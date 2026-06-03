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
  Package,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { BackendClient } from "../../services/api";

export function ReceiptScreen({ onBack }: { onBack: () => void }) {
  const { selectedTransaction: tx, registeredUser } = useApp();
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showReceiptHelp, setShowReceiptHelp] = useState(false);
  const [resolvedSenderUsername, setResolvedSenderUsername] = useState<
    string | null
  >(null);
  const [resolvedReceiverUsername, setResolvedReceiverUsername] = useState<
    string | null
  >(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const possibleRealHash =
    (tx?.metadata as any)?.txHash ||
    (tx as any)?.txHash ||
    (tx as any)?.tx_hash;

  const isValidBlockchainHash = (hash: any): boolean => {
    if (!hash || typeof hash !== "string") return false;
    const clean = hash.trim().toLowerCase();
    if (
      clean.includes("send_") ||
      clean.includes("swap_") ||
      clean.includes("bridge_") ||
      clean.includes("stake_") ||
      clean.includes("withdraw_") ||
      clean.includes("pay_") ||
      clean.includes("receive_")
    ) {
      return false;
    }
    return clean.startsWith("0x") && clean.length === 66 && /^[0-9a-fA-F]+$/.test(clean.substring(2));
  };

  const hasHash = isValidBlockchainHash(possibleRealHash);
  const txHash = hasHash && typeof possibleRealHash === "string" ? possibleRealHash : "";

  const isSuccess =
    tx?.status === "success" || (tx?.status as any) === "confirmed";
  const isPending =
    tx?.status === "pending" || tx?.status === "pending_approval";

  // Format standard JS Date string to native locale format
  const formatReceiptDate = (timeStr: string = "") => {
    if (!timeStr)
      return new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
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
        hour12: true,
      });
    } catch {
      return timeStr;
    }
  };

  const displayDate = formatReceiptDate(tx?.timestamp);

  // Display names logic
  const myWalletAddress = registeredUser?.walletAddress || "";
  const myUsernameDisplay = registeredUser?.username
    ? `@${registeredUser.username}`
    : "My Arc Wallet";

  const isDeposit =
    tx?.type === "receive" ||
    tx?.type === "deposit" ||
    tx?.metadata?.direction === "inbound";
  const isBatch =
    tx?.type === "batchTransfer" ||
    tx?.metadata?.isAtomicBatch === true ||
    tx?.metadata?.isBatch === true;
  const isBridge = tx?.type === "bridge" || (tx?.metadata as any)?.type === "bridge" || (tx?.metadata as any)?.destinationDomain !== undefined;
  const isSwap = tx?.type === "swap" || (tx?.metadata as any)?.type === "swap";
  const isMint = (tx?.type as string) === "mint" || (tx?.metadata as any)?.type === "mint" || (tx?.metadata as any)?.nftContractAddress !== undefined || (tx?.type as string) === "mint_nft";
  const isStake = (tx?.type as string) === "stake" || (tx?.metadata as any)?.type === "stake" || (tx?.metadata as any)?.action === "stake";
  const isUnstake = (tx?.type as string) === "unstake" || (tx?.metadata as any)?.type === "unstake" || (tx?.metadata as any)?.action === "unstake";
  const isHybridReceipt = (tx?.metadata as any)?.is_hybrid === true;
  const isNftReceipt = ((tx as any)?.type === "receipt" || (tx?.metadata as any)?.receipt_type !== undefined) && !isHybridReceipt;
  const isTransfer = tx?.type === "transfer" || (tx?.type as string) === "send" || (!isSwap && !isBatch && !isBridge && !isMint && !isStake && !isUnstake && !isNftReceipt && !isHybridReceipt);

  const formatAddrShort = (addr: string) =>
    addr ? `0x${addr.substring(2, 6)}...${addr.slice(-4)}` : "";

  const senderAddress = isDeposit
    ? tx?.metadata?.senderAddress || ""
    : myWalletAddress;

  const destAddr =
    tx?.metadata?.destinationAddress || tx?.metadata?.escrowAddress || "";

  const receiverAddress = isDeposit ? myWalletAddress : destAddr;

  const [swapRate, setSwapRate] = useState<number | null>(null);

  useEffect(() => {
    async function resolveNames() {
      if (senderAddress && senderAddress !== myWalletAddress) {
        try {
          const data = await BackendClient.resolveAddress(senderAddress);
          if (data && (data.username || data.name)) {
            setResolvedSenderUsername(data.username || data.name);
          }
        } catch (e) {}
      }

      if (receiverAddress && receiverAddress !== myWalletAddress) {
        try {
          const data = await BackendClient.resolveAddress(receiverAddress);
          if (data && (data.username || data.name)) {
            setResolvedReceiverUsername(data.username || data.name);
          }
        } catch (e) {}
      }
    }
    resolveNames();
  }, [senderAddress, receiverAddress, myWalletAddress]);

  useEffect(() => {
    if (isSwap && tx?.metadata?.fromToken && tx?.metadata?.toToken) {
      BackendClient.getLiveRate(tx.metadata.fromToken.symbol, tx.metadata.toToken.symbol)
        .then((res) => setSwapRate(res.rate))
        .catch(console.error);
    }
  }, [isSwap, tx]);

  const senderName = isDeposit
    ? resolvedSenderUsername
      ? `@${resolvedSenderUsername}`
      : tx?.metadata?.senderName
        ? `@${tx.metadata.senderName}`
        : "External Sender"
    : myUsernameDisplay;

  let receiverName = "Arc Network";
  if (isBatch) {
    receiverName = "Batch Multi-Transfer";
  } else if (isDeposit) {
    receiverName = myUsernameDisplay;
  } else if (resolvedReceiverUsername) {
    receiverName = `@${resolvedReceiverUsername}`;
  } else if (
    tx?.metadata?.recipientName &&
    tx?.metadata?.recipientName !== "EVM Account"
  ) {
    receiverName = tx.metadata.recipientName.startsWith("@")
      ? tx.metadata.recipientName
      : `@${tx.metadata.recipientName}`;
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
        <div className="flex items-center gap-1.5 opacity-0 pointer-events-none">
          <HelpCircle size={19} />
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
                  {!isSuccess 
                    ? "Transaction Failed" 
                    : (isDeposit && isBridge)
                    ? "Funds bridged successfully!"
                    : (isDeposit)
                    ? `You received ${tx?.amount?.replace("-", "") || "0"} ${tx?.currency || "USDC"}`
                    : "Transaction Successful"
                  }
                </h3>
                <span className="text-[12px] text-slate-500 font-medium mt-0.5">
                  {!isSuccess 
                    ? "Reverted by network"
                    : (isDeposit && isBridge)
                    ? `${tx?.amount?.replace("-", "") || "0"} ${tx?.currency || "USDC"} received on ${((tx?.metadata as any)?.destinationDomain || "Arc") as string}`
                    : (isDeposit)
                    ? `from ${senderName || formatAddrShort(senderAddress)}`
                    : "Confirmed on Arc Testnet"
                  }
                </span>
              </div>
            </div>

            {/* Receipt Details Card */}
            {isHybridReceipt ? (
              <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="bg-slate-950 p-6 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 blur-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"></div>
                  <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40 mb-2 z-10">Global Payment Summary</span>
                  <div className="flex flex-col items-center z-10">
                     <span className="text-[12px] font-bold text-white/70 mb-1">{(tx?.metadata as any)?.invoice_number || "INV/20260604/HYBRID"}</span>
                     <span className="text-[24px] font-black text-white tracking-widest leading-none">${tx?.amount?.replace("-", "") || "0.00"} <span className="text-[12px] font-bold opacity-60">USDC</span></span>
                  </div>
                </div>

                <div className="p-6 flex flex-col gap-8">
                  {/* Global Summary Info */}
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Payment Method</span>
                        <span className="text-[11px] font-bold text-slate-800">{(tx?.metadata as any)?.receipt_master?.payment_method || "USDC (Arc Network)"}</span>
                     </div>
                     <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Parent TxID</span>
                        <span className="text-[11px] font-mono font-bold text-blue-600">{formatAddrShort(txHash)}</span>
                     </div>
                  </div>

                  {/* 1. BLOK 1: Produk Fisik (RWA) */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
                           <Package size={14} className="text-blue-600" />
                        </div>
                        <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">1. Real World Assets (RWA)</h4>
                     </div>
                     
                     <div className="space-y-3">
                        {((tx?.metadata as any)?.rwa_block || []).map((item: any, idx: number) => (
                           <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                 <div className="flex flex-col">
                                    <span className="text-[13px] font-black text-slate-900">{item.name}</span>
                                    <span className="text-[11px] font-bold text-slate-400 underline decoration-slate-200">Qty: {item.quantity} Pcs</span>
                                 </div>
                                 <span className="text-[14px] font-black text-slate-900">${item.price} USDC</span>
                              </div>
                              <div className="grid grid-cols-2 gap-y-3 pt-2 border-t border-slate-200/50">
                                 <div className="flex flex-col col-span-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Shipping Address</span>
                                    <span className="text-[11px] font-medium text-slate-600 leading-tight">{item.shipping_address}</span>
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Courier</span>
                                    <span className="text-[11px] font-bold text-slate-800">{item.courier}</span>
                                 </div>
                                 <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tracking Number</span>
                                    <span className="text-[11px] font-mono font-black text-slate-900">{item.tracking_number}</span>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* 2. BLOK 2: Aset Digital (NFT) */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-purple-50 rounded-lg flex items-center justify-center">
                           <ShieldCheck size={14} className="text-purple-600" />
                        </div>
                        <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">2. Digital Assets (NFT)</h4>
                     </div>
                     
                     <div className="space-y-3">
                        {((tx?.metadata as any)?.nft_block || []).map((item: any, idx: number) => (
                           <div key={idx} className="bg-purple-50/30 border border-purple-100/50 rounded-2xl p-4 flex gap-4">
                              <div className="w-16 h-16 rounded-xl bg-white border border-purple-100 overflow-hidden shrink-0 shadow-sm">
                                 <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div className="flex flex-col flex-1 gap-1">
                                 <div className="flex justify-between items-start">
                                    <span className="text-[13px] font-black text-slate-900 truncate max-w-[120px]">{item.name}</span>
                                    <span className="text-[13px] font-black text-slate-900">${item.price} USDC</span>
                                 </div>
                                 <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-purple-600">{item.tokenId} (ERC-721)</span>
                                    <span className="font-mono text-slate-400">{formatAddrShort(item.contract)}</span>
                                 </div>
                                 <div className="flex justify-between items-center text-[10px] mt-1 pt-1 border-t border-purple-100">
                                    <span className="font-bold text-slate-400">Gas Fee</span>
                                    <span className="font-bold text-emerald-600">${item.gas_fee} USDC</span>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Perhitungan Rekonsiliasi Akhir */}
                  <div className="mt-4 bg-slate-900 rounded-3xl p-6 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-bl-full"></div>
                     <h4 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Final Reconciliation</h4>
                     <div className="space-y-3">
                        <div className="flex justify-between items-center text-[12px]">
                           <span className="text-white/60 font-bold">Total RWA Spending</span>
                           <span className="text-white font-black">${(tx?.metadata as any)?.reconciliation?.total_rwa?.toFixed(2)} USDC</span>
                        </div>
                        <div className="flex justify-between items-center text-[12px]">
                           <span className="text-white/60 font-bold">Total NFT Spending</span>
                           <span className="text-white font-black">${(tx?.metadata as any)?.reconciliation?.total_nft?.toFixed(2)} USDC</span>
                        </div>
                        <div className="flex justify-between items-center text-[12px]">
                           <span className="text-white/60 font-bold">Shipping Fee</span>
                           <span className="text-white font-black">${(tx?.metadata as any)?.reconciliation?.total_shipping?.toFixed(2)} USDC</span>
                        </div>
                        <div className="flex justify-between items-center text-[12px]">
                           <span className="text-white/60 font-bold">Blockchain Gas Fee</span>
                           <span className="text-emerald-400 font-black">${(tx?.metadata as any)?.reconciliation?.total_gas?.toFixed(4)} USDC</span>
                        </div>
                        <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                           <span className="text-[14px] font-black text-white uppercase tracking-wider">Total Amount Paid</span>
                           <span className="text-[20px] font-black text-white">${tx?.amount?.replace("-", "") || "0.00"} USDC</span>
                        </div>
                     </div>
                  </div>

                  {/* Verified Footer */}
                  <div className="flex flex-col items-center justify-center pt-4 gap-2">
                     <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center">
                           <Check size={10} className="text-slate-900" strokeWidth={4} />
                        </div>
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Hybrid Receipt Authenticated</span>
                     </div>
                     <span className="text-[9px] font-bold text-slate-400 text-center max-w-[240px]">
                        This receipt contains multiple execution layers (Logistics & Smart Contract) verified by Lounge Protocol.
                     </span>
                  </div>
                </div>
              </div>
            ) : isNftReceipt ? (
              <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="bg-slate-900 p-5 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 blur-xl bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                  <span className="text-[11px] font-black tracking-widest uppercase text-white/50 mb-1 z-10">Transaction Method</span>
                  <span className="text-[20px] font-extrabold text-white tracking-widest z-10">
                    {(tx?.metadata as any)?.receipt_type === "BATCH_BUY" ? "BATCH BUY (CART)" : "PURCHASE"}
                  </span>
                </div>
                
                <div className="p-6 flex flex-col gap-6">
                  {/* 1. Master Summary Data */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">1. Master Summary Data</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Transaction ID (Parent TxID)</span>
                      {hasHash ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => window.open(tx?.metadata?.explorerUrl || `https://testnet.arcscan.app/tx/${txHash}`, "_blank")}
                            className="text-[12px] font-mono font-bold text-blue-600 hover:text-blue-700 bg-transparent border-0 p-0 text-right cursor-pointer"
                          >
                            {formatAddrShort(txHash)}
                          </button>
                          <button onClick={() => handleCopy(txHash, "TxHash")} className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-0"><Copy size={12} /></button>
                        </div>
                      ) : (
                        <span className="text-[12px] font-bold text-slate-400 font-mono italic">Local Ref: {tx?.id?.slice(0,8)}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Total Items</span>
                      <span className="text-[12px] font-bold text-slate-800">{(tx?.metadata as any)?.items?.length || 1} NFT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Total Item Price</span>
                      <span className="text-[14px] font-black text-slate-900">{tx?.amount?.replace("-", "") || "0.00"} USDC</span>
                    </div>
                    <div className="pt-2 flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-500">Platform Fee</span>
                        <span className="text-[11px] font-bold text-slate-700">{(tx?.metadata as any)?.platformFee || "0.15"} USDC</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-500">Creator Royalty</span>
                        <span className="text-[11px] font-bold text-slate-700">{(tx?.metadata as any)?.creatorRoyalty || "0.50"} USDC</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-200 mt-1 pt-1">
                        <span className="text-[11px] font-bold text-slate-500">Network Fee (Gas Fee)</span>
                        <span className="text-[11px] font-bold text-emerald-600">{(tx?.metadata as any)?.gasFee || "0.0012"} USDC</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Cart Details */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">2. Cart Details</h4>
                    <div className="flex flex-col gap-3">
                      {((tx?.metadata as any)?.items || []).map((item: any, idx: number) => (
                        <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col gap-3 shadow-sm relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-1 h-full bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="flex gap-3">
                            <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex flex-col flex-1">
                              <div className="flex justify-between items-start">
                                <h5 className="text-[13px] font-bold text-slate-800 leading-tight truncate max-w-[150px]">{item.name}</h5>
                                <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase">{item.tokenStandard || "ERC-721"}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 mt-0.5">#{item.tokenId || "3341"}</span>
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                                  <Check size={10} strokeWidth={4} /> Validated
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                             <div className="flex justify-between items-center text-[11px]">
                               <span className="text-slate-400 font-bold">Item Price</span>
                               <span className="text-slate-800 font-black">{item.price} USDC</span>
                             </div>
                             <div className="flex justify-between items-center text-[10px]">
                               <span className="text-slate-400 font-medium italic">Original Seller Address</span>
                               <span className="text-slate-500 font-mono">{formatAddrShort(item.merchantAddress || item.seller)}</span>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Verified Footer */}
                  <div className="flex flex-col items-center justify-center pt-8 border-t border-dashed border-slate-200 gap-2">
                     <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center shadow-lg">
                        <Check size={20} className="text-white" strokeWidth={3} />
                     </div>
                     <span className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Digital Receipt Verified</span>
                     <span className="text-[9px] font-bold text-slate-400">Authenticated by Lounge Smart Contract Layer</span>
                  </div>
                </div>
              </div>
            ) : isMint ? (
              <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="bg-[#581c87] p-5 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 blur-xl bg-gradient-to-r from-purple-500 to-pink-500"></div>
                  <span className="text-[11px] font-black tracking-widest uppercase text-white/50 mb-1 z-10">Transaction Method</span>
                  <span className="text-[20px] font-extrabold text-white tracking-widest z-10 uppercase">
                    NFT MINTING
                  </span>
                </div>
                
                <div className="p-6 flex flex-col gap-6">
                  {/* 1. NFT Identity & Collection Data */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">1. NFT Identity & Collection Data</h4>
                    <div className="flex flex-col gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-2">
                       <div className="flex gap-4 items-center">
                          <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm shrink-0">
                             <img src={(tx?.metadata as any)?.image || (tx?.metadata as any)?.image_url} alt="NFT" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[14px] font-black text-slate-900">{(tx?.metadata as any)?.name || "Arc Native Asset"}</span>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lounge Premium Collection</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Transaction ID (TxHash)</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => window.open(`https://testnet.arcscan.app/tx/${txHash}`, "_blank")}
                          className="text-[12px] font-mono font-bold text-purple-600 hover:text-purple-700 bg-transparent border-0 p-0 text-right cursor-pointer"
                        >
                          {formatAddrShort(txHash)}
                        </button>
                        <button onClick={() => handleCopy(txHash, "TxHash")} className="text-slate-300 hover:text-slate-500 bg-transparent border-0 cursor-pointer p-0"><Copy size={12} /></button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Contract Address</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-mono font-bold text-slate-700">
                          {formatAddrShort((tx?.metadata as any)?.nftContractAddress || "0x4aaa...2b5e")}
                        </span>
                        <button onClick={() => handleCopy((tx?.metadata as any)?.nftContractAddress || "0x4aaa0f998817be80405ab1ef4106f3ac9d462b5e", "Contract")} className="text-slate-300 hover:text-slate-500 bg-transparent border-0 cursor-pointer p-0"><Copy size={12} /></button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Token ID</span>
                      <span className="text-[12px] font-mono font-black text-slate-900">#{(tx?.metadata as any)?.tokenId || Math.floor(Math.random() * 8000 + 1000)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Token Standard</span>
                      <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded uppercase">ERC-721</span>
                    </div>
                  </div>

                  {/* 2. Costs & Payment Details */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">2. Costs & Payment Details</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Mint Price</span>
                      <span className="text-[12px] font-bold text-slate-800">{(tx?.metadata as any)?.mintPrice || "5.00"} USDC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Network Fee (Gas Fee)</span>
                      <span className="text-[12px] font-bold text-emerald-600">{(tx?.metadata as any)?.gasFee || "0.0082"} USDC</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-[12px] font-black text-slate-900">Total Costs</span>
                      <span className="text-[16px] font-black text-slate-900">5.0082 USDC</span>
                    </div>
                  </div>

                  {/* 3. Ownership & Mint Info */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">3. Ownership & Mint Info</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Minter Address</span>
                      <span className="text-[12px] font-mono font-bold text-slate-700">{formatAddrShort(myWalletAddress)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Mint Quantity</span>
                      <span className="text-[12px] font-bold text-slate-800">1 Asset</span>
                    </div>
                  </div>
                  
                  {/* Verified Footer */}
                  <div className="flex flex-col items-center justify-center pt-8 border-t border-dashed border-slate-200 gap-2">
                     <div className="w-10 h-10 bg-purple-900 rounded-full flex items-center justify-center shadow-lg">
                        <Check size={20} className="text-white" strokeWidth={3} />
                     </div>
                     <span className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Provenance Verified</span>
                     <span className="text-[9px] font-bold text-slate-400">Authenticated by Arc Network Minter Role</span>
                  </div>
                </div>
              </div>
            ) : isSwap ? (
              <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="bg-slate-900 p-5 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 blur-xl bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                  <span className="text-[11px] font-black tracking-widest uppercase text-white/50 mb-1 z-10">Transaction Method</span>
                  <span className="text-[20px] font-extrabold text-white tracking-widest z-10">SWAP</span>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  {/* 1. Identity & Timestamp Data */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">1. Identity & Timestamp Data</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Transaction ID (TxID)</span>
                      {hasHash ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => window.open(tx?.metadata?.explorerUrl || `https://testnet.arcscan.app/tx/${txHash}`, "_blank")}
                            className="text-[12px] font-mono font-bold text-blue-600 hover:text-blue-700 bg-transparent border-0 p-0 text-right cursor-pointer"
                          >
                            {formatAddrShort(txHash)}
                          </button>
                          <button onClick={() => handleCopy(txHash, "TxHash")} className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-0"><Copy size={12} /></button>
                        </div>
                      ) : (
                        <span className="text-[12px] font-bold text-slate-400 font-mono">-</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Completion Time</span>
                      <span className="text-[12px] font-bold text-slate-800">{displayDate}</span>
                    </div>
                  </div>

                  {/* 2. Asset Conversion Details */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">2. Asset Conversion Details</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Outgoing Asset (From)</span>
                      <span className="text-[14px] font-black text-slate-900">{tx?.amount?.replace("-", "") || "0.00"} {tx?.metadata?.fromToken?.symbol || "USDC"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Incoming Asset (To)</span>
                      <span className="text-[14px] font-black text-emerald-600">
                        {swapRate && tx?.amount 
                          ? "+" + (parseFloat(tx.amount.replace("-", "")) * swapRate).toFixed(2)
                          : "~"
                        } {tx?.metadata?.toToken?.symbol || ""}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Conversion Rate</span>
                      <span className="text-[12px] font-bold text-slate-700">
                        {swapRate 
                          ? `1 ${tx?.metadata?.fromToken?.symbol || ""} = ${swapRate.toFixed(2)} ${tx?.metadata?.toToken?.symbol || ""}`
                          : "Fetching rate..."}
                      </span>
                    </div>
                  </div>

                  {/* 3. Market Data & Protection */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">3. Market Data & Protection</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Route Provider</span>
                      <span className="text-[12px] font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">Arc Network Swap</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Applied Slippage</span>
                      <span className="text-[12px] font-bold text-slate-800">0.5% (Auto)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Swap Fee</span>
                      <span className="text-[12px] font-bold text-slate-800">{tx?.metadata?.platformFee || "0.00"} USDC</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : isTransfer ? (
              <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="bg-slate-900 p-5 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 blur-xl bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                  <span className="text-[11px] font-black tracking-widest uppercase text-white/50 mb-1 z-10">Transaction Method</span>
                  <span className="text-[20px] font-extrabold text-white tracking-widest z-10">{isDeposit ? "RECEIVE (INBOUND)" : "TRANSFER (OUTBOUND)"}</span>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  {/* 1. Identity & Timestamp Data */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">1. Identity & Timestamp Data</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Transaction ID (TxID)</span>
                      {hasHash ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => window.open(tx?.metadata?.explorerUrl || `https://testnet.arcscan.app/tx/${txHash}`, "_blank")}
                            className="text-[12px] font-mono font-bold text-blue-600 hover:text-blue-700 bg-transparent border-0 p-0 text-right cursor-pointer"
                          >
                            {formatAddrShort(txHash)}
                          </button>
                          <button onClick={() => handleCopy(txHash, "TxHash")} className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-0"><Copy size={12} /></button>
                        </div>
                      ) : (
                        <span className="text-[12px] font-bold text-slate-400 font-mono">-</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Completion Time</span>
                      <span className="text-[12px] font-bold text-slate-800">{displayDate}</span>
                    </div>
                  </div>

                  {/* 2. Sender & Receiver Information */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">2. Sender & Receiver Information</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Sender (From)</span>
                      <span className="text-[12px] font-bold text-slate-800">
                        {senderName ? senderName : formatAddrShort(senderAddress)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Receiver (To)</span>
                      <span className="text-[12px] font-bold text-slate-800">
                        {receiverName ? receiverName : formatAddrShort(receiverAddress)}
                      </span>
                    </div>
                  </div>

                  {/* 3. Asset & Fee Details */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">3. Asset & Fee Details</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Asset Amount</span>
                      <span className="text-[14px] font-black text-slate-900">{tx?.amount?.replace("-", "") || "0.00"} {tx?.currency || "USDC"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Network Fee</span>
                      <span className="text-[12px] font-bold text-slate-800 text-right">
                        {tx?.metadata?.platformFee ? `${tx.metadata.platformFee} USDC` : "Free (Sponsored)"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : isBatch ? (
              <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="bg-slate-900 p-5 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 blur-xl bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                  <span className="text-[11px] font-black tracking-widest uppercase text-white/50 mb-1 z-10">Transaction Method</span>
                  <span className="text-[20px] font-extrabold text-white tracking-widest z-10">BATCH TRANSFER</span>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  {/* 1. Master Summary Data */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">1. Master Summary Data</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Transaction ID (Batch TxID)</span>
                      {hasHash ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => window.open(tx?.metadata?.explorerUrl || `https://testnet.arcscan.app/tx/${txHash}`, "_blank")}
                            className="text-[12px] font-mono font-bold text-blue-600 hover:text-blue-700 bg-transparent border-0 p-0 text-right cursor-pointer"
                          >
                            {formatAddrShort(txHash)}
                          </button>
                          <button onClick={() => handleCopy(txHash, "TxHash")} className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-0"><Copy size={12} /></button>
                        </div>
                      ) : (
                        <span className="text-[12px] font-bold text-slate-400 font-mono">-</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Completion Time</span>
                      <span className="text-[12px] font-bold text-slate-800">{displayDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Total Recipient Addresses</span>
                      <span className="text-[12px] font-bold text-slate-800">
                        {tx?.metadata?.recipients ? (tx.metadata.recipients as any[]).length : "0"} Addresses
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Total Outbound Funds</span>
                      <span className="text-[14px] font-black text-slate-900">{tx?.amount?.replace("-", "") || "0.00"} {tx?.currency || "USDC"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Total Fee</span>
                      <span className="text-[12px] font-bold text-slate-800 text-right">
                        {tx?.metadata?.platformFee ? `${tx.metadata.platformFee} USDC` : "Free (Sponsored)"}
                      </span>
                    </div>
                  </div>

                  {/* 2. Recipient Details */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">2. Recipient Details</h4>
                    {tx?.metadata?.recipients ? (
                      <div className="w-full bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col gap-2 relative">
                        {(tx.metadata.recipients as any[]).map((r, i) => (
                          <div key={i} className="flex flex-col bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                            <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100">
                               {isSuccess ? "Status: Success" : "Status: Failed"}
                            </span>
                            <div className="flex justify-between items-center mb-1">
                               <span className="text-[11px] font-bold text-slate-500">Destination Address (To [{i + 1}])</span>
                            </div>
                            <span className="text-[13px] font-bold text-slate-800 mb-1">{r.name || r.username || "Unknown"}</span>
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg truncate flex-1 min-w-0">
                                {r.address || "0x..."}
                              </span>
                              <button 
                                onClick={() => handleCopy(r.address, "Address")}
                                className="text-slate-400 hover:text-slate-900 bg-transparent border-0 cursor-pointer p-1 transition-colors shrink-0"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                            <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-1">
                               <span className="text-[11px] font-bold text-slate-400">Amount per Address</span>
                               <span className="text-[13px] font-black text-slate-900">{r.amount} USDC</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[12px] font-medium text-slate-500 italic text-center py-4 bg-slate-50 rounded-xl border border-slate-100">Recipient detail data unavailable.</span>
                    )}
                  </div>
                </div>
              </div>
            ) : isBridge ? (
              <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="bg-slate-900 p-5 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 blur-xl bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                  <span className="text-[11px] font-black tracking-widest uppercase text-white/50 mb-1 z-10">Transaction Method</span>
                  <span className="text-[20px] font-extrabold text-white tracking-widest z-10">CROSS-CHAIN TRANSFER</span>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  {/* 1. Dual Identity & Timestamp Data */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">1. Dual Identity & Timestamp Data</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Source Transaction ID (Source)</span>
                      {hasHash ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => window.open(tx?.metadata?.explorerUrl || `https://testnet.arcscan.app/tx/${txHash}`, "_blank")}
                            className="text-[12px] font-mono font-bold text-blue-600 hover:text-blue-700 bg-transparent border-0 p-0 text-right cursor-pointer"
                          >
                            {formatAddrShort(txHash)}
                          </button>
                          <button onClick={() => handleCopy(txHash, "TxHash")} className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-0"><Copy size={12} /></button>
                        </div>
                      ) : (
                        <span className="text-[12px] font-bold text-slate-400 font-mono">-</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Destination Transaction ID (Dest)</span>
                      {tx?.metadata?.destinationTxHash ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-mono font-bold text-blue-600">
                             {formatAddrShort(tx?.metadata?.destinationTxHash as string)}
                          </span>
                        </div>
                      ) : (
                         <span className="text-[12px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded italic">Dalam Proses...</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Waktu Selesai (Timestamp)</span>
                      <span className="text-[12px] font-bold text-slate-800">{displayDate}</span>
                    </div>
                  </div>

                  {/* 2. Network Details (Cross-Chain Route) */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">2. Network Details (Route)</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Source Network</span>
                      <span className="text-[12px] font-bold text-slate-800">
                        {((tx?.metadata as any)?.sourceDomain || "Arc") as string}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Destination Network</span>
                      <span className="text-[12px] font-bold text-slate-800">
                        {((tx?.metadata as any)?.destinationDomain || "Ethereum") as string}
                      </span>
                    </div>
                  </div>

                  {/* 3. Asset Details & Value Conversion */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">3. Asset Details & Conversion</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Asset Deposited</span>
                      <span className="text-[13px] font-black text-slate-900">{tx?.amount?.replace("-", "") || "0.00"} {tx?.currency || "USDC"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Asset Received</span>
                      <span className="text-[13px] font-black text-green-600">
                        {tx?.amount?.replace("-", "") || "0.00"} {tx?.currency || "USDC"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Bridge Rate</span>
                      <span className="text-[12px] font-bold text-slate-800">1:1 (Pegged)</span>
                    </div>
                  </div>

                  {/* 4. Multi-Network Fee Details */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">4. Multi-Network Fee Breakdown</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Bridge Protocol Fee</span>
                      <span className="text-[12px] font-bold text-slate-800">
                         {tx?.metadata?.bridgeFee ? `${tx.metadata.bridgeFee} USDC` : "0.00 USDC"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Destination Gas Fee</span>
                      <span className="text-[12px] font-bold text-slate-800 text-right">
                         {tx?.metadata?.destinationGasFee ? `${tx.metadata.destinationGasFee} USDC` : "Free (Sponsored)"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : isStake ? (
              <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="bg-slate-900 p-5 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 blur-xl bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                  <span className="text-[11px] font-black tracking-widest uppercase text-white/50 mb-1 z-10">Transaction Method</span>
                  <span className="text-[20px] font-extrabold text-white tracking-widest z-10">STAKE / DEPOSIT EARN</span>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  {/* 1. Status & Locking Type */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">1. Status & Locking Type</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Transaction ID (TxID)</span>
                      {hasHash ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => window.open(tx?.metadata?.explorerUrl || `https://testnet.arcscan.app/tx/${txHash}`, "_blank")}
                            className="text-[12px] font-mono font-bold text-blue-600 hover:text-blue-700 bg-transparent border-0 p-0 text-right cursor-pointer"
                          >
                            {formatAddrShort(txHash)}
                          </button>
                          <button onClick={() => handleCopy(txHash, "TxHash")} className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-0"><Copy size={12} /></button>
                        </div>
                      ) : (
                        <span className="text-[12px] font-bold text-slate-400 font-mono">-</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Staking Type</span>
                      <span className="text-[12px] font-bold text-slate-800">
                        {((tx?.metadata as any)?.stakeType as string) || "Flexible"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Lock Duration</span>
                      <span className="text-[12px] font-bold text-slate-800">
                        {((tx?.metadata as any)?.lockDuration as string) || "Flexible"}
                      </span>
                    </div>
                  </div>

                  {/* 2. Projected Earnings */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">2. Projected Earnings</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Estimated APY / APR</span>
                      <span className="text-[12px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                         {((tx?.metadata as any)?.apy as string) || "Est. APY 5.5%"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Subscribed Asset</span>
                      <span className="text-[13px] font-black text-slate-900">
                         {tx?.amount?.replace("-", "") || "0.00"} {tx?.currency || "USDC"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Reward Currency</span>
                      <span className="text-[12px] font-bold text-slate-800">
                         {((tx?.metadata as any)?.rewardToken as string) || tx?.currency || "USDC"}
                      </span>
                    </div>
                  </div>

                  {/* 3. Financial Timeline */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">3. Financial Timeline</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Value Date (Start)</span>
                      <span className="text-[12px] font-bold text-slate-800">
                        {((tx?.metadata as any)?.valueDate as string) || "H+1 after staking"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Reward Distribution</span>
                      <span className="text-[12px] font-bold text-slate-800">
                        {((tx?.metadata as any)?.distributionDate as string) || "Daily"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Maturity Date</span>
                      <span className="text-[12px] font-bold text-slate-800">
                        {((tx?.metadata as any)?.maturityDate as string) || "Flexible"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : isUnstake ? (
              <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="bg-slate-900 p-5 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 blur-xl bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                  <span className="text-[11px] font-black tracking-widest uppercase text-white/50 mb-1 z-10">Transaction Method</span>
                  <span className="text-[20px] font-extrabold text-white tracking-widest z-10">UNSTAKE / REDEEM</span>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  {/* 1. Transaction Identity */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">1. Transaction Identity</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Transaction ID (TxID)</span>
                      {hasHash ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => window.open(tx?.metadata?.explorerUrl || `https://testnet.arcscan.app/tx/${txHash}`, "_blank")}
                            className="text-[12px] font-mono font-bold text-blue-600 hover:text-blue-700 bg-transparent border-0 p-0 text-right cursor-pointer"
                          >
                            {formatAddrShort(txHash)}
                          </button>
                          <button onClick={() => handleCopy(txHash, "TxHash")} className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-0"><Copy size={12} /></button>
                        </div>
                      ) : (
                        <span className="text-[12px] font-bold text-slate-400 font-mono">-</span>
                      )}
                    </div>
                  </div>

                  {/* 2. Withdrawal & Redemption Details */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">2. Redemption & Withdrawal Details</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Principal Amount</span>
                      <span className="text-[14px] font-black text-slate-900">
                         {((tx?.metadata as any)?.principalAmount as string) || `${tx?.amount?.replace("-", "") || "0.00"} ${tx?.currency || "USDC"}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Total Profit (Reward)</span>
                      <span className="text-[14px] font-black text-green-600">
                         +{((tx?.metadata as any)?.rewardAmount as string) || `0.00 ${((tx?.metadata as any)?.rewardToken as string) || tx?.currency || "USDC"}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Unbonding Period</span>
                      <span className="text-[12px] font-bold text-slate-800">
                        {((tx?.metadata as any)?.unbondingPeriod as string) || "Instant"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : isMint ? (
              <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="bg-slate-900 p-5 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 blur-xl bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                  <span className="text-[11px] font-black tracking-widest uppercase text-white/50 mb-1 z-10">Transaction Method</span>
                  <span className="text-[20px] font-extrabold text-white tracking-widest z-10">NFT MINTING</span>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  {/* 1. NFT Identity & Collection Data */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">1. NFT Identity & Collection Data</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Transaction ID (TxID)</span>
                      {hasHash ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => window.open(tx?.metadata?.explorerUrl || `https://testnet.arcscan.app/tx/${txHash}`, "_blank")}
                            className="text-[12px] font-mono font-bold text-blue-600 hover:text-blue-700 bg-transparent border-0 p-0 text-right cursor-pointer"
                          >
                            {formatAddrShort(txHash)}
                          </button>
                          <button onClick={() => handleCopy(txHash, "TxHash")} className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-0"><Copy size={12} /></button>
                        </div>
                      ) : (
                        <span className="text-[12px] font-bold text-slate-400 font-mono">-</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Contract Address</span>
                      <span className="text-[12px] font-bold text-slate-800 text-right font-mono">
                        {formatAddrShort((tx?.metadata as any)?.contractAddress || "")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Token ID</span>
                      <span className="text-[12px] font-bold text-slate-800">
                        #{(tx?.metadata as any)?.tokenId || "TBD"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Token Standard</span>
                      <span className="text-[12px] font-bold text-slate-800">
                        {((tx?.metadata as any)?.tokenStandard as string) || "ERC-721"}
                      </span>
                    </div>
                  </div>

                  {/* 2. Costs & Payment Details */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">2. Costs & Payment Details</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Mint Price</span>
                      <span className="text-[12px] font-bold text-slate-800">
                         {tx?.amount === "0" || !tx?.amount ? "Free Mint" : `${tx?.amount?.replace("-", "")} ${tx?.currency || "ETH"}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Network Fee (Gas Fee)</span>
                      <span className="text-[12px] font-bold text-slate-800 text-right">
                        {tx?.metadata?.platformFee ? `${tx.metadata.platformFee} USDC` : "0.00 USDC"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Total Costs</span>
                      <span className="text-[13px] font-black text-slate-900">
                         {tx?.amount === "0" || !tx?.amount ? (tx?.metadata?.platformFee ? `${tx.metadata.platformFee} USDC` : "0.00 USDC") : `${tx?.amount?.replace("-", "")} ${tx?.currency || "ETH"}`}
                      </span>
                    </div>
                  </div>

                  {/* 3. Ownership & Mint Info */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">3. Ownership & Mint Info</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Minter Address (To)</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold bg-green-50 text-green-600 px-1.5 py-0.5 rounded uppercase">Owner</span>
                        <span className="text-[12px] font-bold text-slate-800 font-mono">
                          {formatAddrShort(destAddr)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Mint Quantity (Qty)</span>
                      <span className="text-[12px] font-black text-slate-900">{((tx?.metadata as any)?.quantity as number) || 1} NFT</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col p-6">
              {/* Amount Row */}
              <div className="flex flex-col items-center justify-center pb-6 border-b border-slate-100 mb-6">
                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Total Amount
                </span>
                <span
                  className={`text-[32px] font-black tracking-tight ${isSuccess ? "text-slate-900" : "text-slate-500 line-through decoration-slate-300"}`}
                >
                  {tx ? tx.amount : "0.00"} {tx?.currency || "USDC"}
                </span>
                {isBridge && (
                  <div className="mt-2 text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter italic border border-blue-100">
                    BRIDGE TRANSACTION
                  </div>
                )}
              </div>

              {/* Details List */}
              <div className="flex flex-col gap-5">
                {/* Transaction Hash */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    Transaction ID
                  </span>
                  {hasHash ? (
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
                        {txHash.substring(0, 10)}...
                        {txHash.substring(txHash.length - 8)}
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
                  ) : (
                    <span className="text-[14px] font-bold text-slate-400 font-mono">
                      -
                    </span>
                  )}
                </div>

                {/* Sender */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    Sender
                    {(tx?.metadata?.isAsync || tx?.metadata?.real) && (
                      <div className="relative group flex items-center">
                        <HelpCircle
                          size={12}
                          className="text-slate-300 cursor-pointer"
                        />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-[220px] bg-slate-800 text-[10px] text-white p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity text-center z-50">
                          Because it uses Account Abstraction (ERC-4337), the sender (From) in Explorer is the Paymaster/Bundler, not your personal address.
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
                      {senderAddress.substring(0, 8)}...
                      {senderAddress.slice(-8)}
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
                      {receiverAddress.substring(0, 8)}...
                      {receiverAddress.slice(-8)}
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
                  {tx?.metadata?.platformFee && (
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                        Platform Fee
                      </span>
                      <span className="text-[14px] font-medium text-slate-800">
                        {tx.metadata.platformFee} USDC
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                      Network Fee
                    </span>
                    <span className="text-[14px] font-bold text-slate-800">
                      {isBatch ? "0.05" : "0.01"} USDC
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium italic">
                    {isBatch
                      ? "*Includes SCA batch gas efficiency and platform convenience fees."
                      : "*Network execution fee for individual transfer."}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
