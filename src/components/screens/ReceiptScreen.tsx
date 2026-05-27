import React, { useState } from "react";
import {
  ArrowLeft,
  Share2,
  Download,
  Copy,
  Check,
  X,
  HelpCircle,
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";

export function ReceiptScreen({ onBack }: { onBack: () => void }) {
  const { selectedTransaction: tx } = useApp();
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showReceiptHelp, setShowReceiptHelp] = useState(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Convert default ISO timestamp or simple date to Commonwealth-style "Sunday, 28 Jun 2015 at 10:33am"
  const formatReceiptDate = (timeStr: string = "") => {
    if (!timeStr) return "Monday, 25 May 2026 at 10:30pm UTC";
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;

      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const dayName = days[d.getDay()];
      const dateNum = d.getDate();
      const monthName = months[d.getMonth()];
      const year = d.getFullYear();

      let hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const minutesStr = minutes < 10 ? "0" + minutes : minutes;

      return `${dayName}  ${dateNum}  ${monthName}  ${year}  at  ${hours}:${minutesStr}${ampm} UTC`;
    } catch {
      return timeStr;
    }
  };

  const txHash =
    (tx?.metadata as any)?.txHash ||
    (tx as any)?.txHash ||
    (tx?.id && tx.id.startsWith("0x")
      ? tx.id
      : "0x" +
        (tx?.id
          ? tx.id.substring(0, 16) + "abc" + tx.id.substring(tx.id.length - 8)
          : "dc78e12b7fa120021c99f018a14b9c1d"));
  const isSuccess = tx?.status === "success" || (tx?.status as any) === "confirmed";
  const isPending = tx?.status === "pending";
  const blockNumber = (tx?.metadata as any)?.blockNumber;

  return (
    <div className="w-full h-full bg-slate-100 relative flex flex-col z-50 animate-in fade-in slide-in-from-right duration-300">
      {/* Toast Feedback */}
      {copiedText && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white text-xs px-3.5 py-2 rounded-full shadow-xl z-[9999] flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check size={14} className="text-emerald-400 stroke-[3]" />
          <span className="font-semibold">
            {copiedText} copied to clipboard!
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full justify-between shrink-0">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="ml-2 flex flex-col items-start">
            <h2 className="font-extrabold text-[16px] text-white tracking-tight uppercase leading-tight">
              RECEIPT
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() =>
              handleCopy(JSON.stringify(tx, null, 2), "JSON Metadata")
            }
            className="p-2 hover:bg-white/10 rounded-full transition-all cursor-pointer border-0 bg-transparent text-slate-300 hover:text-white"
            title="Download JSON Metadata"
          >
            <Download size={19} />
          </button>
          {(!isPending || tx?.metadata?.explorerUrl || (tx?.metadata as any)?.txHash) && (
            <button
              onClick={() =>
                window.open(
                  tx?.metadata?.explorerUrl ||
                    `https://testnet.arcscan.app/tx/${txHash}`,
                  "_blank",
                )
              }
              className="p-2 hover:bg-white/10 rounded-full transition-all cursor-pointer border-0 bg-transparent text-slate-300 hover:text-white"
              title="Buka di Explorer"
            >
              <Share2 size={19} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 pb-24 flex flex-col items-center gap-4 bg-slate-50">
        {isPending ? (
          <div className="flex flex-col items-center justify-center mt-20 p-8 w-full max-w-[370px]">
            <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <svg
                className="animate-spin w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <h3 className="text-[19px] font-extrabold text-slate-800 tracking-tight leading-snug mb-3">
              Processing Transaction
            </h3>
            <p className="text-[13px] text-slate-500 leading-relaxed text-center font-medium font-sans">
              Waiting for network confirmation.
              <br />
              This usually takes a few seconds.
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-4">
            {/* Status Card */}
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${isSuccess ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"}`}
              >
                {isSuccess ? (
                  <Check size={28} className="stroke-[3]" />
                ) : (
                  <X size={28} className="stroke-[3]" />
                )}
              </div>
              <div className="flex flex-col">
                <h3 className="text-[17px] font-bold text-slate-800 tracking-tight leading-snug">
                  {isSuccess ? "Transaction Successful" : "Transaction Failed"}
                </h3>
                <span className="text-[12px] text-slate-500 font-medium mt-0.5">
                  {isSuccess
                    ? "Confirmed on Arc Testnet"
                    : "Reverted by network"}
                </span>
              </div>
            </div>

            {/* Receipt Details Card */}
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col p-6">
              
              {/* Amount Row */}
              <div className="flex flex-col items-center justify-center pb-6 border-b border-slate-100 mb-6">
                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Amount</span>
                <span className={`text-[32px] font-black tracking-tight ${isSuccess ? "text-slate-900" : "text-slate-500 line-through decoration-slate-300"}`}>
                  {tx ? tx.amount : "0.00"} {tx?.currency || "USDC"}
                </span>
              </div>

              {/* Details List */}
              <div className="flex flex-col gap-5">
                {/* Transaction Hash */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    Transaction ID
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-slate-800 font-mono tracking-tight select-all">
                      {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
                    </span>
                    <button
                      onClick={() => handleCopy(txHash, "TxHash")}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-50 transition-colors bg-transparent border-0 cursor-pointer flex items-center justify-center"
                      title="Copy transaction ID"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {/* Sender */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    Sender
                  </span>
                  <span className="text-[14px] font-bold text-slate-800">
                    Arc Developer Wallet
                  </span>
                </div>

                {/* Receiver */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    Receiver
                  </span>
                  <span className="text-[14px] font-bold text-slate-800 truncate">
                    {tx?.title || "Arc Merchant"}
                  </span>
                  <span className="font-mono text-[12px] text-slate-500 truncate">
                    {tx?.metadata?.destinationAddress ||
                      "0x981C8e25E12E11195906325010811179... "}
                  </span>
                </div>

                {/* Date */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    Date & Time
                  </span>
                  <span className="text-[14px] font-medium text-slate-800">
                    {formatReceiptDate(tx?.timestamp)}
                  </span>
                </div>
              </div>

              {/* Voucher Area if any */}
              {tx?.metadata?.voucherCode && (
                <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-3">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    Digital Product
                  </span>
                  {tx.metadata.productCategory === "Subscription" ? (
                      <div className="bg-slate-50 p-4 rounded-[16px] border border-slate-100">
                        <div className="text-emerald-600 font-bold text-[13px] flex items-center gap-2 mb-1.5">
                          <Check size={16} strokeWidth={2.5} />
                          <span>Subscription Active</span>
                        </div>
                        <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
                          {tx.metadata.instructions}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-4 rounded-[16px] border border-slate-100 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Voucher Code
                          </span>
                          <button
                            onClick={() =>
                              handleCopy(
                                tx.metadata?.voucherCode || "",
                                "Voucher Code",
                              )
                            }
                            className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 font-bold text-[11px] bg-white px-2 py-1/2 rounded-md shadow-sm border border-slate-200 cursor-pointer"
                          >
                            <Copy size={12} /> Copy
                          </button>
                        </div>
                        <div className="bg-white border border-slate-200 py-3 px-4 rounded-xl text-center shadow-sm">
                          <span className="font-mono font-black text-[18px] text-slate-800 tracking-widest select-all">
                            {tx.metadata.voucherCode}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed text-center font-medium mt-1">
                          {tx.metadata.instructions}
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
