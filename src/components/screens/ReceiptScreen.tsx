import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Share2,
  Download,
  Copy,
  Check,
  X,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { BackendClient } from "../../services/api";

export function ReceiptScreen({ onBack }: { onBack: () => void }) {
  const { selectedTransaction: tx, registeredUser } = useApp();
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showReceiptHelp, setShowReceiptHelp] = useState(false);
  const [resolvedSenderUsername, setResolvedSenderUsername] = useState<string | null>(null);
  const [resolvedReceiverUsername, setResolvedReceiverUsername] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  let rawHash =
    (tx?.metadata as any)?.txHash ||
    (tx as any)?.txHash ||
    (tx as any)?.tx_hash ||
    tx?.id ||
    tx?.internal_ref ||
    "0xdc78e12b7fa120021c99f018a14b9c1d";

  if (typeof rawHash === "object" && rawHash !== null) {
    rawHash = rawHash.hash || rawHash.txHash || rawHash.id || rawHash.name || "";
  } 
  
  if (typeof rawHash === "string" && rawHash.startsWith("{")) {
    try {
      const parsed = JSON.parse(rawHash);
      rawHash = parsed.hash || parsed.txHash || parsed.id || parsed.name || rawHash;
    } catch (e) {
      // Ignore
    }
  }

  rawHash = String(rawHash);

  const txHash = rawHash.startsWith("0x")
    ? rawHash
    : "0x" +
      rawHash.replace(/[^a-fA-F0-9]/g, "").padStart(64, "0").substring(0, 64);


  const isSuccess = tx?.status === "success" || (tx?.status as any) === "confirmed";
  const isPending = tx?.status === "pending" || tx?.status === "pending_approval";
  
  // Format standard JS Date string to native locale format
  const formatReceiptDate = (timeStr: string = "") => {
    if (!timeStr) return new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
    try {
      // If it's already a formatted string like "28/5/2026, 18.40.03" from toLocaleString in store, just return it.
      // But we can ensure it looks consistent.
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr; 
      
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return timeStr;
    }
  };

  const displayDate = formatReceiptDate(tx?.timestamp);
  
  // Display names logic
  const myWalletAddress = registeredUser?.walletAddress || "";
  const myUsernameDisplay = registeredUser?.username ? `@${registeredUser.username}` : "My Arc Wallet";

  const isDeposit = tx?.type === "receive" || tx?.type === "deposit" || tx?.metadata?.direction === "inbound";
  const isBatch = tx?.type === "batchTransfer";

  const formatAddrShort = (addr: string) => addr ? `0x${addr.substring(2, 6)}...${addr.slice(-4)}` : "";

  const senderAddress = isDeposit
    ? (tx?.metadata?.senderAddress || "")
    : myWalletAddress;

  const destAddr = tx?.metadata?.destinationAddress || tx?.metadata?.escrowAddress || "";

  const receiverAddress = isDeposit
    ? myWalletAddress
    : destAddr;

  useEffect(() => {
    async function resolveNames() {
      if (senderAddress && senderAddress !== myWalletAddress) {
        try {
          const data = await BackendClient.resolveAddress(senderAddress);
          if (data && (data.username || data.name)) {
            setResolvedSenderUsername(data.username || data.name);
          }
        } catch(e) {}
      }
      
      if (receiverAddress && receiverAddress !== myWalletAddress) {
        try {
          const data = await BackendClient.resolveAddress(receiverAddress);
          if (data && (data.username || data.name)) {
            setResolvedReceiverUsername(data.username || data.name);
          }
        } catch(e) {}
      }
    }
    resolveNames();
  }, [senderAddress, receiverAddress, myWalletAddress]);

  const senderName = isDeposit 
    ? (resolvedSenderUsername ? `@${resolvedSenderUsername}` : (tx?.metadata?.senderName ? `@${tx.metadata.senderName}` : "External Sender"))
    : myUsernameDisplay;

  let receiverName = "Arc Network";
  if (isDeposit) {
    receiverName = myUsernameDisplay;
  } else if (resolvedReceiverUsername) {
    receiverName = `@${resolvedReceiverUsername}`;
  } else if (tx?.metadata?.recipientName && tx?.metadata?.recipientName !== "EVM Account") {
    receiverName = tx.metadata.recipientName.startsWith('@') ? tx.metadata.recipientName : `@${tx.metadata.recipientName}`;
  } else if (tx?.title && tx?.title !== "Transfer") {
    receiverName = tx.title;
  } else if (destAddr) {
    receiverName = formatAddrShort(destAddr);
  }

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
                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {isBatch ? "Total Batch Amount" : "Total Amount"}
                </span>
                <span className={`text-[32px] font-black tracking-tight ${isSuccess ? "text-slate-900" : "text-slate-500 line-through decoration-slate-300"}`}>
                  {tx ? tx.amount : "0.00"} {tx?.currency || "USDC"}
                </span>
                {isBatch && (
                  <div className="mt-2 text-[11px] font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase tracking-tighter italic border border-purple-100">
                    SCA BATCH OPTIMIZED
                  </div>
                )}
              </div>

              {/* Batch Recipients Breakdown */}
              {isBatch && tx?.metadata?.recipients && (
                <div className="w-full bg-slate-50 rounded-3xl p-4 mb-6 border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                    Distribution Summary
                  </p>
                  <div className="space-y-2">
                    {(tx.metadata.recipients as any[]).map((recipient, i) => (
                      <div key={i} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-50 shadow-sm">
                        <div className="flex flex-col">
                           <span className="text-[13px] font-bold text-slate-800">{recipient.name || recipient.username || "Unknown"}</span>
                           <span className="text-[10px] font-mono text-slate-400">{recipient.address ? formatAddrShort(recipient.address) : ""}</span>
                        </div>
                        <span className="text-[13px] font-black text-slate-900">
                          {recipient.amount} <span className="text-[10px] text-slate-400">USDC</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Details List */}
              <div className="flex flex-col gap-5">
                {/* Transaction Hash */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    Transaction ID
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        window.open(
                          tx?.metadata?.explorerUrl ||
                            `https://testnet.arcscan.app/tx/${txHash}`,
                          "_blank",
                        )
                      }
                      className="text-[14px] font-medium text-blue-600 hover:text-blue-700 font-mono tracking-tight cursor-pointer bg-transparent border-0 p-0 text-left flex items-center transition-colors break-all"
                      title="View on Arcscan"
                    >
                      {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
                      <ExternalLink size={14} className="ml-1 opacity-70" />
                    </button>
                    <button
                      onClick={() => handleCopy(txHash, "TxHash")}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-50 transition-colors bg-transparent border-0 cursor-pointer flex items-center justify-center ml-auto"
                      title="Copy transaction ID"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {/* Sender */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    Sender
                    {(tx?.metadata?.isAsync || tx?.metadata?.real) && (
                      <div className="relative group flex items-center">
                        <HelpCircle size={12} className="text-slate-300 cursor-pointer" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-[220px] bg-slate-800 text-[10px] text-white p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity text-center z-50">
                          Karena menggunakan Account Abstraction (ERC-4337), pengirim (From) di Explorer adalah Paymaster/Bundler, bukan personal address Anda.
                          <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-slate-800"></div>
                        </div>
                      </div>
                    )}
                  </span>
                  <span className="text-[14px] font-bold text-slate-800">
                    {senderName}
                  </span>
                  {senderAddress && (
                    <span className="font-mono text-[12px] text-slate-500 truncate">
                      {senderAddress.substring(0, 8)}...{senderAddress.slice(-8)}
                    </span>
                  )}
                </div>

                {/* Receiver */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    Receiver
                  </span>
                  <span className="text-[14px] font-bold text-slate-800 truncate">
                    {receiverName}
                  </span>
                  {receiverAddress && (
                    <span className="font-mono text-[12px] text-slate-500 truncate">
                      {receiverAddress.substring(0, 8)}...{receiverAddress.slice(-8)}
                    </span>
                  )}
                </div>

                {/* Date */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    Date & Time
                  </span>
                  <span className="text-[14px] font-medium text-slate-800">
                    {displayDate}
                  </span>
                </div>

                {/* Account Type (New) */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    Infrastructure
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                      Smart Contract Account (SCA)
                    </span>
                  </div>
                </div>

                {/* Fee Breakdown */}
                <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-50">
                   <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Estimated Fees</span>
                      <span className="text-[14px] font-bold text-slate-800">
                        {isBatch ? "0.05" : "0.01"} USDC
                      </span>
                   </div>
                   <p className="text-[10px] text-slate-400 font-medium italic">
                     {isBatch 
                       ? "*Includes batch processing gas optimization and platform convenience fee."
                       : "*Network execution fee for single transfer."}
                   </p>
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
