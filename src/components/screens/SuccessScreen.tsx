import React, { useEffect } from "react";
import { Check, Share2, Download, Home } from "lucide-react";
import { useArc } from "../../contexts/ArcContext";
import { useApp } from "../../contexts/AppContext";

interface SuccessScreenProps {
  amount: string;
  contact: {
    name: string;
    account: string;
    bank?: string;
    network?: string;
  };
  onClose: () => void;
}

export function SuccessScreen({
  amount,
  contact,
  onClose,
}: SuccessScreenProps) {
  const { refreshBalance } = useArc();
  const { fetchTransactions, transferMemo } = useApp();
  const targetName = contact?.name || "Fauzan";
  const targetAccount = contact?.account || "0x8823...32a1";

  useEffect(() => {
    // Refresh global states
    refreshBalance();
    fetchTransactions();

    // Also add a delayed one just in case the backend needs a second to index
    const timer = setTimeout(() => {
      refreshBalance();
    }, 2000);

    return () => clearTimeout(timer);
  }, [refreshBalance, fetchTransactions]);

  return (
    <div className="w-full h-full bg-white relative flex flex-col items-center pt-12 px-6 z-50 overflow-hidden animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col items-center justify-center -mt-8 max-w-sm w-full">
        {/* Success Check Badge */}
        <div className="w-16 h-16 bg-[#3cd458] rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-green-500/10 relative scale-in">
          <Check size={32} strokeWidth={3} />
        </div>

        <span className="text-[14px] font-bold text-[#3cd458] tracking-widest uppercase mb-1">
          Transfer Successful
        </span>
        <h1 className="text-[36px] font-extrabold text-slate-800 tracking-tight flex items-baseline gap-1 mb-8">
          {amount}{" "}
          <span className="text-[14px] text-slate-400 font-bold">USDC</span>
        </h1>

        {/* Receipt Details Box */}
        <div className="bg-[#f8fafc] border border-slate-100 rounded-3xl p-5 w-full space-y-4 mb-8">
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Recipient</span>
            <div className="text-right">
              <span className="text-sm font-bold text-slate-800 block">
                {targetName}
              </span>
              <span className="text-[11px] font-mono text-slate-400 block">
                {targetAccount}
              </span>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Method</span>
            <span className="text-sm font-bold text-slate-800">
              Arc Fast Settlement
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Time</span>
            <span className="text-sm font-bold text-slate-800">
              Today,{" "}
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Network Fee</span>
            <span className="text-sm font-bold text-green-500">
              Free (Subsidized)
            </span>
          </div>
          {transferMemo && (
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-sm text-slate-500">Note</span>
              <span className="text-sm font-bold text-slate-800 italic">
                "{transferMemo}"
              </span>
            </div>
          )}
        </div>

        {/* Receipt buttons */}
        <div className="flex gap-4 w-full mb-6">
          <button className="flex-1 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-[0.98] transition-all font-bold text-[13px] text-slate-600">
            <Share2 size={16} /> Share
          </button>
          <button className="flex-1 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-[0.98] transition-all font-bold text-[13px] text-slate-600">
            <Download size={16} /> Save as PDF
          </button>
        </div>
      </div>

      <div className="pb-10 w-full max-w-sm">
        <button
          onClick={onClose}
          className="w-full bg-[#005faa] text-white font-bold py-4 rounded-full shadow-lg shadow-blue-500/20 hover:bg-[#004780] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Home size={16} /> Back to Home
        </button>
      </div>
    </div>
  );
}
export default SuccessScreen;
