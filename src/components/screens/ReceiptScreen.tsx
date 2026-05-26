import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  Download, 
  Copy, 
  Check,
  X,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

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
  const formatReceiptDate = (timeStr: string = '') => {
    if (!timeStr) return 'Monday, 25 May 2026 at 10:30pm UTC';
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const dayName = days[d.getDay()];
      const dateNum = d.getDate();
      const monthName = months[d.getMonth()];
      const year = d.getFullYear();
      
      let hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const minutesStr = minutes < 10 ? '0' + minutes : minutes;
      
      return `${dayName}  ${dateNum}  ${monthName}  ${year}  at  ${hours}:${minutesStr}${ampm} UTC`;
    } catch {
      return timeStr;
    }
  };

  const txHash = tx?.txHash || (tx?.id && tx.id.startsWith('0x') ? tx.id : '0x' + (tx?.id ? tx.id.substring(0, 16) + 'abc' + tx.id.substring(tx.id.length - 8) : 'dc78e12b7fa120021c99f018a14b9c1d'));
  const isSuccess = tx?.status === 'success';
  const isPending = tx?.status === 'pending';
  const blockNumber = tx?.metadata?.blockNumber;

  return (
    <div className="w-full h-full bg-slate-100 relative flex flex-col z-50 animate-in fade-in slide-in-from-right duration-300">
      
      {/* Toast Feedback */}
      {copiedText && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white text-xs px-3.5 py-2 rounded-full shadow-xl z-[9999] flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check size={14} className="text-emerald-400 stroke-[3]" />
          <span className="font-semibold">{copiedText} disalin ke clipboard!</span>
        </div>
      )}

      {/* Modern, clean Glassmorphism Header */}
      <div className="flex items-center px-4 pt-5 pb-3 bg-white border-b border-slate-200 shadow-xs relative z-10 w-full justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200 cursor-pointer border-0 bg-transparent flex items-center justify-center">
            <ArrowLeft size={20} className="text-slate-800" />
          </button>
          <div className="ml-2 flex flex-col">
            <h2 className="font-extrabold text-[14px] text-slate-900 tracking-wide uppercase">STRUK TRANSAKSI WEB3</h2>
            <span className="text-[9px] text-slate-500 font-bold tracking-wider uppercase font-sans">ARC NETWORK TESTNET</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => handleCopy(JSON.stringify(tx, null, 2), "JSON Metadata")} 
            className="p-2 hover:bg-slate-100 rounded-full transition-all cursor-pointer border-0 bg-transparent text-slate-700 hover:text-slate-900"
            title="Download JSON Metadata"
          >
            <Download size={19} />
          </button>
          <button 
            onClick={() => window.open(tx?.metadata?.explorerUrl || `https://testnet.arcscan.app/tx/${txHash}`, '_blank')} 
            className="p-2 hover:bg-slate-100 rounded-full transition-all cursor-pointer border-0 bg-transparent text-slate-700 hover:text-slate-900"
            title="Buka di Explorer"
          >
            <Share2 size={19} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 flex flex-col items-center gap-6">
        
        {isPending ? (
          <div className="flex flex-col items-center justify-center mt-20 p-8 w-full max-w-[370px]">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-[19px] font-extrabold text-slate-800 tracking-tight leading-snug mb-3">Transaksi Diproses</h3>
            <p className="text-[13px] text-slate-500 leading-relaxed text-center font-medium font-sans">
              Waiting for Arc Deterministic Finality.<br/>This usually takes less than 1 second.
            </p>
          </div>
        ) : (
          <>
            {/* SUBMITTED SUCCESS BANNER */}
            <div className="flex items-center gap-4 w-full max-w-[370px] bg-transparent py-2 px-1">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md shrink-0 ${isSuccess ? 'bg-[#E6F4EA] text-[#137333] border border-emerald-200' : 'bg-rose-100 text-rose-600 border border-rose-200'}`}>
                {isSuccess ? (
                  <Check size={32} className="stroke-[3]" />
                ) : (
                   <X size={32} className="stroke-[3]" />
                )}
              </div>
              <div className="flex flex-col">
                <h3 className="text-[17px] font-bold text-slate-800 tracking-tight leading-snug">
                  {isSuccess ? 'Transaction Confirmed' : 'Transaction failed'}
                </h3>
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  {isSuccess ? 'Deterministic Finality Verified' : 'Reverted on Arc Blockchain'}
                </span>
              </div>
            </div>

            {/* PHYSICAL RECEIPT ADAPTATION */}
            <div className="bg-white w-full max-w-[370px] shadow-sm border border-slate-200/65 flex flex-col relative">
              
              {/* Jagged physical paper cutout edge simulator */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-slate-100 overflow-hidden flex z-20">
                <div className="absolute inset-x-0 top-[-4px] flex justify-between space-x-[2px] px-[1px]">
                  {[...Array(24)].map((_, i) => (
                    <div key={i} className="w-[12px] h-[12px] bg-white rounded-full"></div>
                  ))}
                </div>
              </div>

              {/* Receipt Body content */}
              <div className="px-7 pt-9 pb-8 flex flex-col">
                
                <h1 className="text-slate-800 text-[26px] font-normal tracking-tight mb-7 mt-2">
                  Receipt
                </h1>

                {/* Status Row with Deterministic Branding */}
                {isSuccess && (
                  <div className="flex flex-col mb-5 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <div className="flex justify-between items-center">
                       <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Finalized</span>
                       <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="text-[11px] font-bold text-emerald-700">1 Block Confirmation</span>
                       </div>
                    </div>
                    <p className="text-[10px] text-emerald-600 mt-1 font-medium italic">
                      Deterministic finality achieved. This transaction is immutable.
                    </p>
                  </div>
                )}

                {/* Receipt Number Column */}
                <div className="flex flex-col mb-5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12.5px] font-normal leading-relaxed text-slate-500">Transaction Hash</span>
                    <button 
                      onClick={() => setShowReceiptHelp(!showReceiptHelp)}
                      className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-100 flex items-center justify-center border-0 bg-transparent cursor-pointer"
                    >
                      <HelpCircle size={13} />
                    </button>
                  </div>
                  <span className="text-[16px] font-bold text-slate-800 font-mono tracking-tight mt-0.5 flex items-center gap-1.5 select-all">
                    {txHash.substring(0, 15)}...{txHash.substring(txHash.length - 8)}
                    <button 
                      onClick={() => handleCopy(txHash, "TxHash")}
                      className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors bg-transparent border-0 cursor-pointer"
                    >
                      <Copy size={12} />
                    </button>
                  </span>
                </div>

                {/* Block Number */}
                {blockNumber && (
                   <div className="flex flex-col mb-5">
                      <span className="text-[12.5px] font-normal leading-relaxed text-slate-500">Block Number</span>
                      <span className="text-[16px] font-bold text-slate-800 mt-0.5">#{blockNumber}</span>
                   </div>
                )}

                {/* Amount Column */}
                <div className="flex flex-col mb-5">
                  <span className="text-[12.5px] font-normal leading-relaxed text-slate-500">Amount</span>
                  <span className="text-[23px] font-bold text-slate-800 mt-0.5">
                    {tx ? tx.amount : '0.00'} {tx?.currency || 'USDC'}
                  </span>
                  <p className="text-[10px] text-slate-400 font-medium italic">Unified Gas: USDC covers fees implicitly.</p>
                </div>

                {/* From Source Wallet */}
                <div className="flex flex-col mb-5">
                  <span className="text-[12.5px] text-slate-450 font-normal leading-relaxed text-slate-500">From</span>
                  <span className="text-[16px] font-bold text-slate-800 mt-0.5">
                    Arc Developer-Controlled Wallet
                  </span>
                  <span className="font-mono text-[11.5px] text-slate-500 tracking-tight">0x40E9D4b82Acbf082ef2bEc7aa0b8d2345efF...</span>
                </div>

                {/* To Destination/Merchant */}
                <div className="flex flex-col mb-5">
                  <span className="text-[12.5px] text-slate-450 font-normal leading-relaxed text-slate-500">To</span>
                  <span className="text-[16px] font-bold text-slate-800 mt-0.5 truncate max-w-full">
                    {tx?.title || 'Arc Merchant Gateway'}
                  </span>
                  <span className="font-mono text-[11.5px] text-slate-500 tracking-tight truncate max-w-full">
                    {tx?.metadata?.destinationAddress || "0x981C8e25E12E1119590632501081117906A..."}
                  </span>
                </div>

                {/* When Timestamp column */}
                <div className="flex flex-col">
                  <span className="text-[12.5px] text-slate-450 font-normal leading-relaxed text-slate-500">When</span>
                  <span className="text-[13.5px] font-medium text-slate-700 mt-1">
                    {formatReceiptDate(tx?.timestamp)}
                  </span>
                </div>

                {/* Digital Voucher payload if any (Clean styled card) */}
                {tx?.metadata?.voucherCode && (
                  <div className="mt-6 pt-5 border-t border-slate-200/70 flex flex-col gap-2">
                    <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">Digital product payload</span>
                    {tx.metadata.productCategory === 'Subscription' ? (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/50">
                        <div className="text-emerald-700 font-extrabold text-[12px] flex items-center gap-1.5 mb-1">
                          <Check size={14} className="stroke-[3]" />
                          <span>Subscription Layanan Aktif</span>
                        </div>
                        <p className="text-[11.5px] text-slate-600 leading-normal font-medium">{tx.metadata.instructions}</p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/50 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Voucher Code</span>
                          <button 
                            onClick={() => handleCopy(tx.metadata?.voucherCode || '', "Kode Voucher")}
                            className="text-slate-400 hover:text-slate-700 flex items-center gap-1 font-bold text-[10px] bg-transparent border-0 cursor-pointer"
                          >
                            <Copy size={10} /> Salin
                          </button>
                        </div>
                        <div className="bg-white border border-slate-200 py-2.5 px-3 rounded text-center shadow-2xs">
                          <span className="font-mono font-extrabold text-[16px] text-slate-800 tracking-widest select-all">
                            {tx.metadata.voucherCode}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 leading-tight block mt-0.5">{tx.metadata.instructions}</p>
                      </div>
                    )}
                  </div>
                )}

              </div>

              <div className="bg-[#FFFCEF] border-t border-slate-200/60 p-4.5 px-7 flex flex-col items-center gap-0.5">
                <span className="text-[10.5px] text-slate-500 font-medium">On-chain consensus generated ticket</span>
                <span className="text-[9.5px] text-slate-400/80 font-bold tracking-wider font-mono">POWERED BY SECURE ARC PLATFORM</span>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
