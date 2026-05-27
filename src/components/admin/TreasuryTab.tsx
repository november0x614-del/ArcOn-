import React from "react";
import { Settings2 } from "lucide-react";

interface TreasuryTabProps {
  loading: boolean;
  saving: boolean;
  treasuryBalance: string;
  swapFeeInput: string;
  setSwapFeeInput: (v: string) => void;
  withdrawFeeInput: string;
  setWithdrawFeeInput: (v: string) => void;
  bridgeFeeInput: string;
  setBridgeFeeInput: (v: string) => void;
  onSave: (fields: any) => void;
}

export function TreasuryTab({
  loading,
  saving,
  treasuryBalance,
  swapFeeInput,
  setSwapFeeInput,
  withdrawFeeInput,
  setWithdrawFeeInput,
  bridgeFeeInput,
  setBridgeFeeInput,
  onSave,
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="px-4 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-[14px] text-slate-800">
            Admin Fee Settings
          </h3>
          <Settings2 size={16} className="text-slate-400" />
        </div>
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center pt-1">
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-slate-800">
                Swap Fee
              </span>
              <span className="text-[11px] text-slate-500">
                Collected per trade
              </span>
            </div>
            <input
              type="text"
              value={swapFeeInput}
              onChange={(e) => setSwapFeeInput(e.target.value)}
              className="w-24 bg-slate-50 border border-slate-200 text-right text-slate-800 font-mono font-bold text-[13px] px-3 py-1.5 rounded-lg outline-none focus:border-slate-800"
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-slate-800">
                Transfer/Send Fee
              </span>
              <span className="text-[11px] text-slate-500">
                Standard user transfers
              </span>
            </div>
            <input
              type="text"
              value={withdrawFeeInput}
              onChange={(e) => setWithdrawFeeInput(e.target.value)}
              className="w-24 bg-slate-50 border border-slate-200 text-right text-slate-800 font-mono font-bold text-[13px] px-3 py-1.5 rounded-lg outline-none focus:border-slate-800"
            />
          </div>
          <div className="flex justify-between items-center pb-2">
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-slate-800">
                CCTP Bridge Fee
              </span>
              <span className="text-[11px] text-slate-500">
                Cross-chain fee
              </span>
            </div>
            <input
              type="text"
              value={bridgeFeeInput}
              onChange={(e) => setBridgeFeeInput(e.target.value)}
              className="w-24 bg-slate-50 border border-slate-200 text-right text-slate-800 font-mono font-bold text-[13px] px-3 py-1.5 rounded-lg outline-none focus:border-slate-800"
            />
          </div>
          <button
            onClick={() =>
              onSave({
                swapFee: swapFeeInput,
                withdrawFee: withdrawFeeInput,
                bridgeFee: bridgeFeeInput,
              })
            }
            disabled={saving || loading}
            className="w-full mt-2 bg-slate-900 text-white font-bold text-[13px] py-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
          >
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
