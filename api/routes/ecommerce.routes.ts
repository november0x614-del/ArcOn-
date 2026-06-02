import express from "express";
import crypto from "crypto";
import { getSupabaseAdmin } from "../config/supabase.js";
import { executeTransaction, executeReleaseEscrow, createWallet } from "../services/circle.js";

const router = express.Router();

// Helper to handle seller address extraction (for simplicity in testnet)
const DEFAULT_SELLER_ADDRESS = "0xMerchant";

/**
 * 1. Checkout Endpoint
 * Pembeli mentransfer dana ke PLATFORM_TREASURY_ADDRESS
 */
router.post("/ecommerce/checkout", async (req, res) => {
  try {
    const { buyerId, productId, amount, memo, sellerAddress = DEFAULT_SELLER_ADDRESS } = req.body;
    const supabaseAdmin = getSupabaseAdmin();

    const adminId = "00000000-0000-0000-0000-000000000000";
    // Pastikan Treasury wallet tersedia
    let treasuryAddress = process.env.PLATFORM_TREASURY_ADDRESS;
    if (!treasuryAddress) {
      const { data: treasuryWallet } = await supabaseAdmin
        .from("user_wallets")
        .select("wallet_address")
        .eq("id", adminId)
        .single();
      
      if (treasuryWallet?.wallet_address) {
        treasuryAddress = treasuryWallet.wallet_address;
      } else {
        // Auto-initialize Admin/Treasury Wallet if missing
        console.log(`[Ecommerce] Treasury wallet missing. Attempting auto-initialization for ${adminId}...`);
        try {
          const newAdminWallet = await createWallet(supabaseAdmin, adminId);
          treasuryAddress = newAdminWallet.address;
          console.log(`[Ecommerce] Treasury wallet automatically initialized: ${treasuryAddress}`);
        } catch (initErr: any) {
          console.error("[Ecommerce] Critical: Failed to auto-initialize treasury wallet:", initErr);
          return res.status(500).json({ error: "Platform Treasury Belum Dikonfigurasi dan gagal diinisialisasi otomatis." });
        }
      }
    }

    const orderMemo = `ORDER-${productId}-${Date.now()}`;

    // Insert database record ke 'ecommerce_orders'
    const { data: orderData, error: dbError } = await supabaseAdmin
      .from("ecommerce_orders")
      .insert({
        buyer_id: buyerId,
        seller_address: sellerAddress,
        product_id: parseInt(productId),
        product_name: memo, // We passed product_name as memo in frontend
        amount: amount,
        status: "PENDING_ESCROW",
        memo: orderMemo // Added for webhook matching
      })
      .select()
      .single();

    if (dbError && dbError.code !== "42P01") { // Ignore if table doesn't exist yet for testnet gracefully
      console.error("Order Insert Error:", dbError);
    }

    const orderId = orderData ? orderData.id : "NO_DB_ORDER";

    // Panggil Circle App Kit SDK (dari user ke Treasury)
    const result = await executeTransaction(
      supabaseAdmin,
      buyerId,
      amount,
      treasuryAddress,
      "checkout", // tag 
      {
        finality: "deterministic",
        memo: orderMemo,
        product_id: productId,
        order_status: "PENDING_ESCROW",
        ecommerce_order_id: orderId
      }
    );

    // Update with txId
    if (orderData) {
       await supabaseAdmin.from("ecommerce_orders").update({ tx_hash: result.txId }).eq("id", orderData.id);
    }
    
    res.status(200).json({ 
      message: "Proses transfer ke Escrow dimulai", 
      txHash: result.txId,
      useEscrow: true,
      escrowAddress: treasuryAddress,
      orderId: orderId
    });

  } catch (error: any) {
    console.error("Checkout Error:", error);
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

export default router;
