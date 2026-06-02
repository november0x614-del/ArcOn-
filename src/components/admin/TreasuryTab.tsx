import React from "react";
import {
  Check,
  X,
  ShieldAlert,
  Clock,
  Wallet,
  Bug,
  ExternalLink,
} from "lucide-react";
import { getTenderlyUrl, ARC_TESTNET } from "../../lib/arcConfig";

interface TreasuryTabProps {
  loading: boolean;
  treasuryBalance: string;
  transactions?: any[];
  pendingApprovals?: any[];
  onDecide?: (txId: string, decision: "approve" | "reject") => void;
  saving?: boolean;
}

export function TreasuryTab({
  loading,
  treasuryBalance,
  transactions = [],
  pendingApprovals = [],
  onDecide,
  saving,
}: TreasuryTabProps) {
  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-300">
      <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-slate-500 font-bold text-[11px] uppercase tracking-[0.2em] mb-2 block">
              Global Treasury Liquidity
            </span>
            <div className="text-4xl font-[900] tracking-tighter text-emerald-400">
              {loading ? "SYNCING..." : treasuryBalance}
            </div>
          </div>
          <div className="flex gap-3">
            <a
              href="https://explorer.testnet.arc.network"
              target="_blank"
              rel="noreferrer"
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[12px] font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all active:scale-95"
            >
              <Wallet size={16} /> Explorer
            </a>
          </div>
        </div>
      </div>

      {/* APPROVAL QUEUE SECTION */}
      {pendingApprovals.length > 0 && (
        <div className="space-y-3 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 px-1">
            <ShieldAlert size={18} className="text-amber-500" />
            <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">
              Critical Approval Queue
            </h3>
            <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-lg">
              {pendingApprovals.length} ACTION REQUIRED
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {pendingApprovals.map((tx, idx) => (
              <div
                key={tx.id || `pending-${idx}`}
                className="bg-white border-2 border-amber-100 rounded-[28px] p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                    <Clock size={24} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-slate-900 text-[15px] tracking-tight">
                        {tx.profiles?.full_name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase">
                        High-Value Move
                      </span>
                    </div>
                    <div className="text-[12px] text-slate-500 font-medium line-clamp-1">
                      {tx.metadata?.description || tx.description}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-1 uppercase tracking-tighter">
                      ID: {tx.id.substring(0, 14)}...
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-4 md:pt-0">
                  <div className="text-right">
                    <div className="text-[20px] font-black text-slate-900 tracking-tighter">
                      {tx.amount} USDC
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Awaiting Decision
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onDecide?.(tx.id, "reject")}
                      disabled={saving}
                      className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl border border-slate-100 transition-all active:scale-90"
                    >
                      <X size={20} />
                    </button>
                    <button
                      onClick={() => onDecide?.(tx.id, "approve")}
                      disabled={saving}
                      className="px-6 py-3 bg-emerald-500 text-slate-900 font-black text-[13px] rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all active:scale-95 flex items-center gap-2 capitalize"
                    >
                      {saving ? (
                        "..."
                      ) : (
                        <>
                          <Check size={18} /> Approve
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AUDIT LOG SECTION */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Global Financial Audit Log
          </h3>
          <span className="text-[10px] font-bold text-slate-400">
            ARC TESTNET
          </span>
        </div>

        <div className="divide-y divide-slate-50">
          {loading && transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-[13px] font-bold italic animate-pulse">
              READING DISTRIBUTED LEDGER DATA...
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-[13px] font-bold italic">
              NO TRANSACTION HISTORY LOCATED
            </div>
          ) : (
            transactions.map((tx, idx) => (
              <div
                key={tx.id || idx}
                className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors group"
              >
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold ${tx.amount.startsWith("-") ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"}`}
                      >
                        {tx.profiles?.full_name?.charAt(0) || "U"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-[14px] text-slate-800 tracking-tight">
                            {tx.profiles?.full_name || "Anonymous User"}
                          </span>
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {tx.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium line-clamp-1 opacity-70">
                          {tx.metadata?.description ||
                            tx.description ||
                            "Automated system entry"}
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                      <span
                        className={`font-black text-[15px] tracking-tight ${tx.amount.startsWith("-") ? "text-slate-900" : "text-emerald-600"}`}
                      >
                        {tx.amount} USDC
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          tx.status === "success"
                            ? "text-emerald-500 bg-emerald-50"
                            : tx.status === "pending" ||
                                tx.status === "pending_approval"
                              ? "text-amber-500 bg-amber-50 animate-pulse"
                              : tx.status === "failed"
                                ? "text-red-500 bg-red-50"
                                : "text-slate-400 bg-slate-50 font-medium"
                        }`}
                      >
                        {tx.status?.replace("_", " ")}
                      </span>

                      {tx.metadata?.txHash &&
                        tx.metadata.txHash.startsWith("0x") && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a
                              href={getTenderlyUrl(tx.metadata.txHash)}
                              target="_blank"
                              rel="noreferrer"
                              title="Debug with Tenderly"
                              className="p-1 hover:text-emerald-400 text-slate-300 transition-colors"
                            >
                              <Bug size={14} />
                            </a>
                            <a
                              href={`${ARC_TESTNET.blockExplorers.default.url}/tx/${tx.metadata.txHash}`}
                              target="_blank"
                              rel="noreferrer"
                              title="View on ArcScan"
                              className="p-1 hover:text-blue-400 text-slate-300 transition-colors"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        )}
                    </div>
                  </div>

                  {tx.status === "failed" && tx.metadata?.errorReason && (
                    <div className="mt-2 ml-14 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-left">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Bug size={12} className="text-red-400" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          Technical Error Logs (Admin Only)
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[11px] font-mono text-red-300">
                          <span className="text-slate-500">Reason:</span>{" "}
                          {tx.metadata.errorReason}
                        </div>
                        {tx.metadata.errorDetails && (
                          <div className="text-[10px] font-mono text-slate-400 leading-relaxed max-w-2xl">
                            <span className="text-slate-600">Details:</span>{" "}
                            {tx.metadata.errorDetails}
                          </div>
                        )}
                        <div className="text-[11px] font-medium text-emerald-400 mt-2 bg-emerald-400/5 px-2 py-1 rounded-lg border border-emerald-400/10 inline-block">
                          User saw: "
                          {tx.metadata.errorMessage || "Transaksi gagal"}"
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
