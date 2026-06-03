import { PostgrestClient } from "@supabase/postgrest-js";
import * as crypto from "crypto";

/**
 * Service untuk mengelola siklus hidup transaksi (Lifecycle Management).
 * Bertujuan untuk mencegah timeout di platform serverless (seperti Vercel)
 * dengan cara memproses data berat di latar belakang.
 */
export class TransactionService {
  /**
   * Mendaftarkan transaksi ke database dengan status 'pending' secara instan.
   * Ini memastikan pengguna langsung melihat respons di UI (Actionable Feedback).
   */
  static async registerPending(
    supabase: any,
    userId: string,
    params: {
      amount: string | number;
      type: string;
      internalRef: string;
      metadata: any;
      ledgerType?: string;
      destinationAddress?: string;
    }
  ) {
    const { amount, type, internalRef, metadata, ledgerType, destinationAddress } = params;

    // 1. Masukkan ke tabel transaksi utama (untuk Riwayat UI)
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: userId,
      amount: amount.toString().startsWith("-") ? amount.toString() : `-${amount}`,
      type,
      status: "pending",
      internal_ref: internalRef,
      metadata: {
        ...metadata,
        real: true,
        async_execution: true,
        registered_at: new Date().toISOString()
      },
    });

    if (txError) throw txError;

    // 2. Masukkan ke tabel ledger (untuk pembukuan teknis/akuntansi)
    if (ledgerType) {
      await supabase.from("transaction_ledger").insert({
        user_id: userId,
        tx_type: ledgerType,
        amount: Math.abs(parseFloat(amount.toString())),
        circle_tx_id: internalRef,
        status: "PENDING",
        destination_address: destinationAddress,
        metadata: { ...metadata, is_async: true },
      });
    }
  }

  /**
   * Menjalankan logika eksekusi blockchain di latar belakang.
   * Jika berhasil atau gagal, status di database akan diperbarui secara otomatis.
   */
  static async executeAsync(
    supabase: any,
    internalRef: string,
    executionFn: () => Promise<{ txId: string }>,
    onSuccess?: (txId: string) => Promise<void>
  ) {
    try {
      const result = await executionFn();
      
      // Jika ID dari Circle berbeda dengan ID internal kita, update referensinya
      if (result.txId && result.txId !== internalRef) {
        await supabase
          .from("transactions")
          .update({ internal_ref: result.txId })
          .eq("internal_ref", internalRef);
        
        await supabase
          .from("transaction_ledger")
          .update({ circle_tx_id: result.txId })
          .eq("circle_tx_id", internalRef);
      }

      if (onSuccess) await onSuccess(result.txId);
      
    } catch (err: any) {
      console.error(`[TransactionService] Async Execution Error untuk ${internalRef}:`, err.message);
      
      // Tandai transaksi sebagai gagal di database agar pengguna tahu
      await supabase
        .from("transactions")
        .update({ 
          status: "failed", 
          metadata: { error: err.message || "Execution error" } 
        })
        .eq("internal_ref", internalRef);

      await supabase
        .from("transaction_ledger")
        .update({ status: "FAILED" })
        .eq("circle_tx_id", internalRef);
    }
  }
}
