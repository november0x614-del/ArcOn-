import express from "express";
import crypto from "crypto";
import { getSupabaseAdmin } from "../config/supabase.js";
import { executeTransaction, executeReleaseEscrow } from "../services/circle.js";

const router = express.Router();

// Helper to handle seller address extraction (for simplicity in testnet)
const DEFAULT_SELLER_ADDRESS = "0xMerchant";

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

    // Insert database record ke 'ecommerce_orders' untuk setiap item
    const orderPromises = items.map((item: any) => {
      return supabaseAdmin
        .from("ecommerce_orders")
        .insert({
          buyer_id: buyerId,
          seller_address: item.merchantAddress || DEFAULT_SELLER_ADDRESS,
          product_id: item.productId?.toString(),
          product_name: item.name,
          amount: parseFloat(item.price) * (item.quantity || 1),
          status: "PENDING_ESCROW",
          memo: orderMemo,
          batch_id: orderBatchId
        });
    });

    await Promise.all(orderPromises);

    // Panggil Circle SDK (Single Atomic Transfer for Total Amount)
    const result = await executeTransaction(
      supabaseAdmin,
      buyerId,
      parseFloat(totalAmount),
      treasuryAddress,
      "checkout_batch",
      {
        finality: "deterministic",
        memo: orderMemo,
        batch_id: orderBatchId,
        order_status: "PENDING_ESCROW"
      }
    );

    // Update with txId
    await supabaseAdmin
      .from("ecommerce_orders")
      .update({ tx_hash: result.txId })
      .eq("memo", orderMemo);
    
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
