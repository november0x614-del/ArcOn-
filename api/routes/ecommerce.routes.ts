import express from "express";
import crypto from "crypto";
import { getSupabaseAdmin } from "../config/supabase.js";
import { executeTransaction, executeReleaseEscrow } from "../services/circle.js";

const router = express.Router();

/**
 * 1. Checkout Batch Endpoint (Atomic Multiple Checkout)
 */
router.post("/ecommerce/checkout-batch", async (req, res) => {
  try {
    const { buyerId, items, totalAmount, memo } = req.body;
    const supabaseAdmin = getSupabaseAdmin();

    let treasuryAddress = process.env.PLATFORM_TREASURY_ADDRESS;
    if (!treasuryAddress) {
      const { data: treasuryWallet } = await supabaseAdmin
        .from("user_wallets")
        .select("wallet_address")
        .eq("id", "11111111-1111-1111-1111-111111111111")
        .single();
      treasuryAddress = treasuryWallet?.wallet_address;
    }

    if (!treasuryAddress) {
      return res.status(500).json({ error: "Platform Treasury Not Configured." });
    }

    const orderBatchId = crypto.randomUUID();
    const orderMemo = `BATCH-${orderBatchId.slice(0, 8)}-${Date.now()}`;
    const invoiceNumber = `INV/${new Date().toISOString().slice(0, 10).replace(/-/g, "")}/USDC-HYBRID/${Math.floor(Math.random() * 90000 + 10000)}`;

    const itemDetails: any[] = [];

    // Insert database record ke 'ecommerce_orders' untuk setiap item
    const orderPromises = items.map(async (item: any) => {
      // Fetch product details to check if it's an NFT and get metadata
      const { data: product } = await supabaseAdmin
        .from("ecommerce_products")
        .select("*")
        .eq("id", item.productId)
        .single();

      itemDetails.push({ ...item, category: product?.category || "General", desc: product?.desc, image: product?.image });

      const orderResult = await supabaseAdmin
        .from("ecommerce_orders")
        .insert({
          buyer_id: buyerId,
          seller_address: item.merchantAddress,
          product_id: item.productId?.toString(),
          product_name: item.name,
          amount: parseFloat(item.price) * (item.quantity || 1),
          status: "PENDING_ESCROW",
          memo: orderMemo,
          batch_id: orderBatchId
        });

      if (orderResult.error) throw orderResult.error;

      // If it's an NFT, also register it to the user's NFT collection
      if (product && product.category === "NFT") {
        const { error: nftError } = await supabaseAdmin.from("user_nfts").insert({
          user_id: buyerId,
          name: product.name,
          description: product.desc,
          image: product.image,
          tx_hash: product.tx_hash || "purchased",
          contract_address: process.env.LOUNGE_NFT_ADDRESS || "0x4aaa0f998817be80405ab1ef4106f3ac9d462b5e",
          metadata: { 
            productId: product.id,
            origin: "marketplace",
            purchased_at: new Date().toISOString()
          }
        });
        if (nftError) console.error("NFT Registration Error:", nftError);

        // Mark product as sold out if it's a unique NFT
        await supabaseAdmin
          .from("ecommerce_products")
          .update({ stock: 0 })
          .eq("id", item.productId);
      }

      // 1.1 Notify Merchant/Seller
      const { data: sellerWallet } = await supabaseAdmin
        .from("user_wallets")
        .select("user_id")
        .eq("wallet_address", item.merchantAddress)
        .single();
      
      if (sellerWallet) {
        await supabaseAdmin.from("inbox_messages").insert({
          user_id: sellerWallet.user_id,
          title: "Premium Product Sold!",
          content: `Your product "${item.name}" has been purchased by ${buyerId.slice(0, 8)}. Settlement is being held in platform escrow for safety.`,
          type: "receipt",
          metadata: {
            receipt_type: "MERCHANT_SALE",
            invoice_number: invoiceNumber,
            product_id: item.productId,
            product_name: item.name,
            amount: item.price,
            buyer: buyerId,
            status: "ESCROWED",
            checkout_at: new Date().toISOString(),
            action_required: "Go to Merchant Suite to settle funds"
          }
        });
      }

      return orderResult;
    });

    await Promise.all(orderPromises);

    const rwaItems = itemDetails.filter(i => i.category !== "NFT");
    const nftItems = itemDetails.filter(i => i.category === "NFT");
    const isHybrid = rwaItems.length > 0 && nftItems.length > 0;

    const gasFee = 0.0012;
    const platformFee = items.length * 0.15;
    const creatorRoyalty = nftItems.length * 0.50;
    const shippingFee = rwaItems.length > 0 ? 15.00 : 0;

    // Panggil Circle SDK (Single Atomic Transfer for Total Amount)
    const result = await executeTransaction(
      supabaseAdmin,
      buyerId,
      parseFloat(totalAmount) + shippingFee, // Total includes shipping if RWA present
      treasuryAddress,
      "payment",
      {
        finality: "deterministic",
        memo: orderMemo,
        batch_id: orderBatchId,
        order_status: "PENDING_ESCROW",
        invoice_number: invoiceNumber,
        is_hybrid: isHybrid,
        receipt_type: isHybrid ? "HYBRID_PURCHASE" : (nftItems.length > 0 ? "NFT_PURCHASE" : "RWA_PURCHASE"),
        receipt_master: {
          invoice_number: invoiceNumber,
          total_items: items.length,
          total_paid: parseFloat(totalAmount) + shippingFee,
          platform_fee: platformFee,
          creator_royalty: creatorRoyalty,
          gas_fee: gasFee,
          shipping_fee: shippingFee,
          payment_method: "USDC (via Arc Network)",
          parent_tx_hash: null 
        },
        rwa_block: rwaItems.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          shipping_address: "Jl. Jendral Sudirman No. 45, Jakarta, Indonesia (10220)",
          courier: "DHL Express / FedEx",
          tracking_number: `AWB-${Math.floor(Math.random() * 900000000 + 100000000)}`,
          shipping_fee: shippingFee / rwaItems.length
        })),
        nft_block: nftItems.map(item => ({
          name: item.name,
          tokenId: `#${Math.floor(Math.random() * 9000 + 1000)}`,
          contract: process.env.LOUNGE_NFT_ADDRESS || "0x4aaa0f998817be80405ab1ef4106f3ac9d462b5e",
          price: item.price,
          gas_fee: gasFee / nftItems.length,
          image: item.image
        })),
        reconciliation: {
          total_rwa: rwaItems.reduce((acc, i) => acc + (parseFloat(i.price) * (i.quantity || 1)), 0),
          total_nft: nftItems.reduce((acc, i) => acc + (parseFloat(i.price) * (i.quantity || 1)), 0),
          total_shipping: shippingFee,
          total_gas: gasFee
        }
      }
    );

    // Update with txId
    await supabaseAdmin
      .from("ecommerce_orders")
      .update({ tx_hash: result.txId })
      .eq("memo", orderMemo);

    // Add an inbox notification for the purchase
    await supabaseAdmin.from("inbox_messages").insert({
      user_id: buyerId,
      title: isHybrid ? "Hybrid Purchase Successful" : (nftItems.length > 0 ? "NFT Purchase Successful" : "Order Confirmed"),
      content: `Your transaction ${invoiceNumber} has been successfully processed.`,
      type: "receipt",
      metadata: {
        txId: result.txId,
        invoice_number: invoiceNumber,
        is_hybrid: isHybrid,
        receipt_type: isHybrid ? "HYBRID_PURCHASE" : (nftItems.length > 1 ? "BATCH_BUY" : "PURCHASE"),
        items: itemDetails,
        rwa_items: rwaItems,
        nft_items: nftItems,
        totalAmount: (parseFloat(totalAmount) + shippingFee).toFixed(2),
        platformFee,
        creatorRoyalty,
        gasFee,
        shippingFee,
        reconciliation: {
          total_rwa: rwaItems.reduce((acc, i) => acc + (parseFloat(i.price) * (i.quantity || 1)), 0),
          total_nft: nftItems.reduce((acc, i) => acc + (parseFloat(i.price) * (i.quantity || 1)), 0),
          total_shipping: shippingFee,
          total_gas: gasFee
        }
      }
    });
    
    res.status(200).json({ 
      message: "Proses Multi-Checkout Atomic dimulai", 
      txHash: result.txId,
      useEscrow: true,
      escrowAddress: treasuryAddress,
      batchId: orderBatchId
    });

  } catch (error: any) {
    console.error("Batch Checkout Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 2. Release Escrow & Split Payment
 */
router.post("/ecommerce/release-escrow", async (req, res) => {
  try {
    const { sellerAddress, totalAmount, orderId } = req.body;
    const supabaseAdmin = getSupabaseAdmin();

    const amountFloat = parseFloat(totalAmount);
    
    // Execute real transfer on Circle SDK (Treasury -> Seller)
    const result = await executeReleaseEscrow(
      supabaseAdmin,
      sellerAddress,
      amountFloat,
      orderId
    );

    res.status(200).json({
      message: "Escrow Split Payment Success. Payout executed on Arc Testnet via Circle.",
      details: {
        order_id: orderId,
        tx_hash: result.txId,
        seller_receives: `${result.sellerReceive.toFixed(2)} USDC`,
        platform_fee: `${result.platformFee.toFixed(2)} USDC`,
        seller_address: sellerAddress,
        status: "RELEASED",
        smart_contract_execution: "SUCCESS (Real Transfer Executed)"
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
router.get("/ecommerce/admin/escrows", async (req, res) => {
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

router.post("/ecommerce/products", async (req, res) => {
  try {
    const product = req.body;
    const supabaseAdmin = getSupabaseAdmin();

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

router.put("/ecommerce/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const supabaseAdmin = getSupabaseAdmin();
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

router.delete("/ecommerce/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const supabaseAdmin = getSupabaseAdmin();
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
router.post("/ecommerce/mint-nft", async (req, res) => {
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
