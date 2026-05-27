import React from "react";

interface TreasuryTabProps {
  loading: boolean;
  treasuryBalance: string;
}

export function TreasuryTab({
  loading,
  treasuryBalance,
}: TreasuryTabProps) {
  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
        <span className="text-slate-400 font-medium text-[12px] flex items-center gap-1 uppercase tracking-wider">
          Treasury Balance (USDC)
        </span>
        <div className="text-3xl font-[900] tracking-tight mt-1.5 mb-4 text-[#00E676]">
          {loading ? "..." : treasuryBalance}
        </div>
        <div className="flex gap-2 relative z-10">
          <a
            href="https://explorer.testnet.arc.network"
            target="_blank"
            rel="noreferrer"
            className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-[12px] font-bold px-4 py-2 rounded-xl text-center active:scale-95 transition-transform"
          >
            View on Explorer
          </a>
        </div>
      </div>

    </div>
  );
}
