import express from "express";
import crypto from "crypto";
import { getSupabaseAdmin } from "../config/supabase.js";
import { executeTransaction, executeReleaseEscrow, shouldRequireApproval, recordPendingApprovalTx, getTreasuryAddress } from "../services/circle.js";
import { TransactionService } from "../services/transaction.service.js";
import { requireUserAuth } from "../middleware/userAuth.js";
import { authenticateAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

/**
 * 1. Checkout Batch Endpoint (Atomic Multiple Checkout)
 */
/**
 * Endpoint Checkout Massal (Atomic Multiple Checkout).
 * Memungkinkan pembelian beberapa produk sekaligus dari merchant yang berbeda
 * dalam satu kali pembayaran aman (Escrow).
 */
router.post("/ecommerce/checkout-batch", requireUserAuth, async (req, res) => {
  try {
    // SECURITY: Ambil buyerId langsung dari sesi user terverifikasi
    const buyerId = (req as any).userId; 
    const { items, memo } = req.body;
    const supabaseAdmin = getSupabaseAdmin();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Item list is required." });
    }

    // SECURITY: Ambil harga dan detail merchant dari Database (Authority)
    const productIds = items.map((i: any) => i.productId);
    const { data: products, error: productError } = await supabaseAdmin
      .from("ecommerce_products")
      .select("id, price, merchant_address, name")
      .in("id", productIds);

    if (productError || !products || products.length !== items.length) {
      return res.status(400).json({ error: "One or more products could not be found." });
    }

    // Reconstruct items with verified data
    const reconstructedItems = items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        ...item,
        name: product!.name,
        price: parseFloat(product!.price),
        merchantAddress: product!.merchant_address,
      };
    });

    const totalAmount = reconstructedItems.reduce(
      (sum: number, item: any) => sum + item.price * (item.quantity || 1),
      0
    );

    const treasuryAddress = await getTreasuryAddress(supabaseAdmin);

    const orderBatchId = crypto.randomUUID();
    const orderMemo = memo || `BATCH-${orderBatchId.slice(0, 8)}`;
    const invoiceNumber = `INV/${new Date().toISOString().slice(0, 10).replace(/-/g, "")}/USDC-HYBRID/${Math.floor(Math.random() * 90000 + 10000)}`;

    const internalRef = crypto.randomUUID();

    // 1. Registrasi Pesanan di Database (Instan)
    const orderPromises = reconstructedItems.map(async (item: any) => {
      return supabaseAdmin.from("ecommerce_orders").insert({
        buyer_id: buyerId,
        seller_address: item.merchantAddress,
        product_id: item.productId?.toString(),
        product_name: item.name,
        amount: item.price * (item.quantity || 1),
        status: "PENDING_ESCROW",
        memo: orderMemo,
        batch_id: orderBatchId
      });
    });
    await Promise.all(orderPromises);

    // 2. Registrasi Transaksi Finansial (Instan)
    // Cek apakah butuh persetujuan sebelum mendaftarkan pendings
    const shippingFee = reconstructedItems.some((i: any) => i.category !== "NFT") ? 15.00 : 0;
    const finalAmount = totalAmount + shippingFee;

    if (shouldRequireApproval(finalAmount, buyerId)) {
      await recordPendingApprovalTx(
        supabaseAdmin,
        buyerId,
        finalAmount,
        "payment",
        {
          memo: orderMemo,
          invoice_number: invoiceNumber,
          batch_id: orderBatchId,
          receipt_type: "BATCH_CHECKOUT"
        },
        internalRef,
        treasuryAddress!
      );

      return res.status(202).json({
        message: "Transaksi ini memerlukan persetujuan admin.",
        txId: internalRef,
        status: "pending_approval"
      });
    }

    // Jika tidak butuh persetujuan, lanjut flow normal
    await TransactionService.registerPending(supabaseAdmin, buyerId, {
      amount: totalAmount.toString(),
      type: "payment",
      internalRef,
      metadata: {
        description: `Pembayaran Checkout #${invoiceNumber}`,
        invoiceNumber,
        batchId: orderBatchId,
        itemsCount: reconstructedItems.length
      }
    });

    // 3. Eksekusi Pembayaran secara sinkron (Await)                
    try {
      const result = await executeTransaction(
        supabaseAdmin,
        buyerId,
        finalAmount,
        treasuryAddress!,
        "payment",
        {
          memo: orderMemo,
          invoice_number: invoiceNumber,
          batch_id: orderBatchId,
          receipt_type: "BATCH_CHECKOUT",
          bypassApproval: true // Sudah dicek di atas
        },
        internalRef
      );

      // Setelah berhasil di blockchain, update sisa metadata di tabel order dan status
      await supabaseAdmin
        .from("ecommerce_orders")
        .update({ tx_hash: result.txId, status: "ESCROWED" }) // Update ke ESCROWED
        .eq("batch_id", orderBatchId);
      
      await supabaseAdmin
        .from("transactions")
        .update({ status: "success", tx_hash: result.txId })
        .eq("internal_ref", internalRef);

      res.status(200).json({ 
        message: "Pembayaran berhasil dan escrow terkunci", 
        txId: result.txId,
        invoiceNumber 
      });

    } catch (e: any) {
      console.error("[CheckoutSync] Fatal error:", e);
      
      // Update status database sebagai gagal
      await supabaseAdmin
        .from("transactions")
        .update({ status: "failed", metadata: { error: e.message } })
        .eq("internal_ref", internalRef);
      
      await supabaseAdmin
        .from("ecommerce_orders")
        .update({ status: "failed_escrow" })
        .eq("batch_id", orderBatchId);

      res.status(500).json({ error: "Checkout gagal: " + e.message });
    }

  } catch (error: any) {
    console.error("Batch Checkout Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 2. Release Escrow & Split Payment
 */
router.post("/ecommerce/release-escrow", requireUserAuth, authenticateAdmin, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: "Missing required orderId in request body." });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Secure database lookup: Load order details entirely from Supabase (server-side authority)
    const { data: order, error: orderError } = await supabaseAdmin
      .from("ecommerce_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error(`[ReleaseEscrow] Order lookup failed:`, orderError);
      return res.status(404).json({ error: "Order not found inside database." });
    }

    // Safety validation: Only order with exactly ESCROWED status can proceed
    if (order.status !== "ESCROWED") {
      return res.status(400).json({
        error: `Invalid workflow transition. Only orders with status 'ESCROWED' are eligible for release. Current state is: '${order.status}'`
      });
    }

    const sellerAddress = order.seller_address;
    const amountFloat = parseFloat(order.amount);

    if (!sellerAddress || isNaN(amountFloat) || amountFloat <= 0) {
      return res.status(400).json({ error: "Order database record contains invalid seller address or amount." });
    }
    
    // Execute real transfer on Circle SDK (Treasury -> Seller)
    // The status becomes PROCESSING_RELEASE during this step and is finalized as RELEASED inside the webhook channel.
    const result = await executeReleaseEscrow(
      supabaseAdmin,
      sellerAddress,
      amountFloat,
      orderId
    );

    res.status(200).json({
      message: "Escrow Split Payment processing. Payout transaction successfully initiated on Arc Testnet via Circle.",
      details: {
        order_id: orderId,
        tx_hash: result.txId,
        seller_receives: `${result.sellerReceive.toFixed(2)} USDC`,
        platform_fee: `${result.platformFee.toFixed(2)} USDC`,
        seller_address: sellerAddress,
        status: "PROCESSING_RELEASE",
        smart_contract_execution: "PENDING_BLOCKCHAIN_CONFIRMATION"
      }
    });

  } catch (error: any) {
    console.error("Release Escrow Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. Fetch Admin Escrow Queue
 */
router.get("/ecommerce/admin/escrows", requireUserAuth, authenticateAdmin, async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    // Gunakan relasi dengan users untuk mendapatkan nama buyer if possible, here using direct query
    const { data: orders, error } = await supabaseAdmin
      .from("ecommerce_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
       // Return empty array if table doesn't exist
       if (error.code === '42P01') return res.json([]);
       return res.status(500).json({ error: error.message });
    }
    res.json(orders || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 4. Fetch Merchant Sales
 */
router.get("/ecommerce/merchant/sales/:sellerAddress", async (req, res) => {
  try {
    const { sellerAddress } = req.params;
    const supabaseAdmin = getSupabaseAdmin();
    
    // We match roughly by merchant identifier
    let query = supabaseAdmin
      .from("ecommerce_orders")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (sellerAddress !== "all") {
       query = query.eq("seller_address", sellerAddress);
    }

    const { data: orders, error } = await query;

    if (error) {
       if (error.code === '42P01') return res.json([]);
       return res.status(500).json({ error: error.message });
    }
    res.json(orders || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 5. Products Catalog Management
 */
router.get("/ecommerce/products", async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: products, error } = await supabaseAdmin
      .from("ecommerce_products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "42P01") {
        // Fallback for testnet if table not created
        return res.json([]);
      }
      return res.status(500).json({ error: error.message });
    }
    res.json(products || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/ecommerce/products", requireUserAuth, async (req, res) => {
  try {
    const product = req.body;
    const authenticatedUserId = (req as any).userId;
    const supabaseAdmin = getSupabaseAdmin();

    // Securely retrieve the user's registered wallet address to prevent address spoofing
    const { data: userWallet } = await supabaseAdmin
      .from("user_wallets")
      .select("wallet_address")
      .eq("id", authenticatedUserId)
      .maybeSingle();

    if (!userWallet || !userWallet.wallet_address) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You must set up a wallet before you can list products on the marketplace."
      });
    }

    // Force or validate that user lists with their own seller address
    if (product.seller_address && product.seller_address.toLowerCase() !== userWallet.wallet_address.toLowerCase()) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Seller address mismatch. You can only list products using your own verified wallet address."
      });
    }

    // Auto-populate to guarantee correctness
    product.seller_address = userWallet.wallet_address;

    // Check for duplicate NFT listing
    if (product.category === "NFT" || product.tx_hash) {
      const { data: existingNFT } = await supabaseAdmin
        .from("ecommerce_products")
        .select("id")
        .or(`name.eq.${product.name},tx_hash.eq.${product.tx_hash}`)
        .eq("category", "NFT")
        .maybeSingle();

      if (existingNFT) {
        return res.status(400).json({ 
          error: "Duplicate Listing", 
          message: "This NFT asset or name is already listed in your inventory." 
        });
      }
    }

    const { data, error } = await supabaseAdmin
      .from("ecommerce_products")
      .insert(product)
      .select()
      .single();

    if (error) {
      if (error.code === "42P01") {
        return res.status(503).json({ 
          error: "Database Table Missing", 
          message: "Tabel 'ecommerce_products' belum dibuat. Silakan jalankan file 'ecommerce_setup.sql' di Supabase SQL Editor.",
          code: "TABLE_MISSING"
        });
      }
      throw error;
    }
    res.json(data);
  } catch (error: any) {
    console.error("Save Product Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.put("/ecommerce/products/:id", requireUserAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const authenticatedUserId = (req as any).userId;
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch current product
    const { data: currentProduct, error: fetchErr } = await supabaseAdmin
      .from("ecommerce_products")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !currentProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 2. Determine admin role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", authenticatedUserId)
      .single();

    const isAdmin = profile?.role === "admin";

    // 3. If not admin, check if their wallet address matches currentProduct.seller_address
    if (!isAdmin) {
      const { data: userWallet } = await supabaseAdmin
        .from("user_wallets")
        .select("wallet_address")
        .eq("id", authenticatedUserId)
        .single();

      if (!userWallet || !userWallet.wallet_address || userWallet.wallet_address.toLowerCase() !== currentProduct.seller_address?.toLowerCase()) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You do not have permission to modify this product listing."
        });
      }
    }

    // Prevent tampering with seller_address during update
    if (!isAdmin && updates.seller_address) {
      delete updates.seller_address;
    }

    const { data, error } = await supabaseAdmin
      .from("ecommerce_products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/ecommerce/products/:id", requireUserAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const authenticatedUserId = (req as any).userId;
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch current product
    const { data: currentProduct, error: fetchErr } = await supabaseAdmin
      .from("ecommerce_products")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !currentProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 2. Determine admin role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", authenticatedUserId)
      .single();

    const isAdmin = profile?.role === "admin";

    // 3. If not admin, check ownership
    if (!isAdmin) {
      const { data: userWallet } = await supabaseAdmin
        .from("user_wallets")
        .select("wallet_address")
        .eq("id", authenticatedUserId)
        .single();

      if (!userWallet || !userWallet.wallet_address || userWallet.wallet_address.toLowerCase() !== currentProduct.seller_address?.toLowerCase()) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You do not have permission to delete this product listing."
        });
      }
    }

    const { error } = await supabaseAdmin
      .from("ecommerce_products")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 6. NFT Minting Management
 */
router.post("/ecommerce/mint-nft", requireUserAuth, authenticateAdmin, async (req, res) => {
  try {
    const { productId, merchantAddress, metadataUri } = req.body;
    const supabaseAdmin = getSupabaseAdmin();
    
    // contract address from env
    let contractAddress = process.env.LOUNGE_NFT_ADDRESS || "0x4aaa0f998817be80405ab1ef4106f3ac9d462b5e";
    
    // Proteksi: arahkan ke alamat valid jika env kosong atau berisi alamat deployer
    if (!contractAddress || contractAddress.toLowerCase() === "0x76231be309a473855eed23f6e7a13c414a0ee925") {
      contractAddress = "0x4aaa0f998817be80405ab1ef4106f3ac9d462b5e";
    }

    // We use the Platform Admin Wallet to mint on behalf of the platform (since contract is owned by platform)
    const adminId = "11111111-1111-1111-1111-111111111111";
    
    const { executeContractTransaction } = await import("../services/circle.js");

    // abi: mint(address to, string memory uri)
    const result = await executeContractTransaction(
      supabaseAdmin,
      adminId,
      contractAddress,
      "mint(address, string)", // function signature
      [merchantAddress, metadataUri], // parameters
      "HIGH"
    );

    // Update product record
    await supabaseAdmin
      .from("ecommerce_products")
      .update({ 
        category: "NFT",
        tx_hash: result.txId,
        date_label: "Lounge L1 Certificate"
      })
      .eq("id", productId);

    res.json({
      success: true,
      message: "Minting request sent to Arc Network via Circle Developer Wallet.",
      txId: result.txId
    });

  } catch (error: any) {
    console.error("Mint NFT Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
