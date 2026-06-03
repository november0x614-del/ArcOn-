import React from "react";
import { X, Check } from "lucide-react";
import { ARC_TESTNET } from "../../contexts/ArcContext";

interface TransferSuccessScreenProps {
  txId: string;
  amount: string;
  recipientName: string;
  fee?: number | string;
  onBack: () => void;
  title?: string;
  description?: string;
}

export function TransferSuccessScreen({
  txId,
  amount,
  recipientName,
  fee = 0,
  onBack,
  title = "Transfer Confirmed",
  description = "Your assets have been successfully transferred on the Arc Network.",
}: TransferSuccessScreenProps) {
  // Try to use a placeholder or partial display if txId isn't an EVM hash (like if it's Circle internal ref starting with internal_)
  const isHash = txId && txId.startsWith("0x");
  const displayHash = isHash ? txId : txId.substring(0, 20) + (txId.length > 20 ? "..." : "");

  return (
    <div className="w-full h-full bg-[#ecf5fc] relative flex flex-col z-50 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full shrink-0 justify-between">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
        >
          <X size={20} className="text-white" />
        </button>
        <h2 className="font-bold text-[16px] text-white ml-2">
          Transaction Receipt
        </h2>
      </div>
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-[32px] w-full max-w-sm shadow-xl flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white">
            <Check size={40} className="text-green-500" strokeWidth={3} />
          </div>
          <h2 className="text-[24px] font-extrabold text-white mb-2">
            {title}
          </h2>
          {isHash ? (
            <a
              href={`${ARC_TESTNET.blockExplorers.default.url}/tx/${txId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] text-slate-500 mb-8 leading-relaxed hover:underline hover:text-slate-700 transition-colors block cursor-pointer"
            >
              {description}
            </a>
          ) : (
             <span className="text-[14px] text-slate-500 mb-8 leading-relaxed block">
              {description}
             </span>
          )}

          <div className="w-full bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100 space-y-4 text-left">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-slate-500">Amount Sent</span>
              <span className="font-bold text-slate-800">
                {amount} USDC
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-slate-500">Recipient</span>
              <span className="font-bold text-slate-800 break-all text-right max-w-[60%]">
                {recipientName}
              </span>
            </div>
            {Number(fee) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-slate-500">Platform Fee</span>
                <span className="font-bold text-slate-800">
                  {fee} USDC
                </span>
              </div>
            )}
            <div className="w-full h-[1px] bg-slate-200 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-slate-400">Tx ID</span>
              {isHash ? (
                <a
                  href={`${ARC_TESTNET.blockExplorers.default.url}/tx/${txId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] font-mono text-slate-600 break-all hover:underline text-right max-w-[70%]"
                >
                  {displayHash}
                </a>
              ) : (
                <span className="text-[12px] font-mono text-slate-600 break-all text-right max-w-[70%]">
                  {displayHash}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[12px] text-slate-400">Network</span>
              <span className="text-[12px] font-medium text-slate-600">Arc Testnet</span>
            </div>
          </div>

          <button
            onClick={onBack}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-transform active:scale-[0.98] border-0 cursor-pointer shadow-md"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransferSuccessScreen;
