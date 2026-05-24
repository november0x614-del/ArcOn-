import React from 'react';
import { ArrowLeft, Share2, Download, Receipt as ReceiptIcon, Copy } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, truncateAddress } from '../../lib/utils';

interface ReceiptScreenProps {
  onBack: () => void;
}

export function ReceiptScreen({ onBack }: ReceiptScreenProps) {
  const { selectedTransaction: tx, registeredUser } = useApp();

  if (!tx) return null;

  const isSuccess = tx.status === 'success';
  const isPending = tx.status === 'pending';
  const isFailed = tx.status === 'failed';

  return (
    <div className="w-full h-full bg-[#f8fafc] relative flex flex-col z-50 animate-in fade-in slide-in-from-right duration-300">
      {/* Header */}
      <div className={`${isSuccess ? 'bg-[#3FA2F6]' : 'bg-slate-800'} flex items-center justify-between px-4 py-4 z-10 shrink-0 text-white shadow-md transition-colors duration-500`}>
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={24} />
            </button>
            <span className="font-bold text-[16px] tracking-wide">{isSuccess ? 'Transaction Receipt' : 'Transaction Status'}</span>
        </div>
        <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
               <Download size={20} />
            </button>
            <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
               <Share2 size={20} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 flex flex-col items-center">
        {/* Receipt Ticket Design - Only for Success */}
        {isSuccess ? (
          <div className="bg-white rounded-3xl w-full max-w-[340px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col relative overflow-hidden mt-4 animate-in zoom-in-95 duration-500">
              
              {/* Premium Ticket Header */}
              <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 flex flex-col items-center relative overflow-hidden">
                  <div className="absolute top-[-30px] right-[-30px] w-[120px] h-[120px] bg-blue-500/10 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-[-20px] left-[-20px] w-[80px] h-[80px] bg-emerald-500/10 rounded-full blur-xl"></div>
                  
                  {/* Verified Seal */}
                  <div className="absolute top-4 right-4 rotate-12 opacity-20 select-none pointer-events-none">
                    <div className="border-2 border-emerald-400 rounded-full p-1">
                      <div className="border border-emerald-400 rounded-full px-2 py-0.5 text-[8px] font-black text-emerald-400 uppercase tracking-tighter">Verified</div>
                    </div>
                  </div>

                  <div className="w-14 h-14 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center text-blue-400 shadow-inner z-10 mb-4 border border-white/10">
                     <ReceiptIcon size={28} />
                  </div>
                  <h2 className="text-white font-extrabold text-[20px] z-10 tracking-tight">STRUK TRANSAKSI</h2>
                  <div className="flex items-center gap-2 mt-1 opacity-80 z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-widest leading-none">Berhasil • Arc L1</span>
                  </div>
              </div>

              {/* Jagged edge divider with realistic shadow */}
              <div className="relative h-4 bg-white overflow-hidden flex transform -translate-y-2 z-20">
                  <div className="absolute inset-x-0 top-0 flex justify-between px-1">
                     {[...Array(24)].map((_, i) => (
                        <div key={i} className="w-3 h-3 bg-[#0f172a] rounded-full -mt-2 shadow-inner"></div>
                     ))}
                  </div>
              </div>

              {/* Amount Section */}
              <div className="flex flex-col items-center pt-2 pb-8 border-b border-dashed border-slate-200 mx-8">
                  <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2">Total Pembayaran</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-slate-400 text-[18px] font-medium">$</span>
                    <h1 className="text-slate-900 text-[40px] font-black tracking-tighter leading-none font-mono">
                      {formatCurrency(tx.amount.replace('-', '').replace('+', ''), '')}
                    </h1>
                    <span className="text-slate-500 font-bold text-[14px] ml-1">USDC</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 font-mono">Rate: 1.00 USDC = 1.00 USD</span>
              </div>

              {/* Transaction Details Section */}
              <div className="px-8 py-6 flex flex-col gap-5 text-left">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                        <span className="text-[12px] text-slate-400 font-bold uppercase tracking-wide">Merchant/Desc</span>
                        <span className="text-[13px] font-extrabold text-slate-800 text-right max-w-[160px]">{tx?.title || 'Pembayaran Arc'}</span>
                    </div>
                    
                    <div className="flex justify-between items-start">
                        <span className="text-[12px] text-slate-400 font-bold uppercase tracking-wide">Waktu</span>
                        <span className="text-[13px] font-bold text-slate-700 text-right">{tx?.timestamp || 'Selesai'}</span>
                    </div>

                    <div className="flex justify-between items-start">
                        <span className="text-[12px] text-slate-400 font-bold uppercase tracking-wide">Metode</span>
                        <div className="text-right">
                          <span className="text-[13px] font-bold text-slate-800 block">Arc Wallet (USDC)</span>
                          <span className="text-[10px] font-mono text-slate-400">{registeredUser?.walletAddress ? truncateAddress(registeredUser.walletAddress) : 'Internal Settlement'}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-[12px] text-slate-400 font-bold uppercase tracking-wide">Status Settlement</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded uppercase tracking-tighter border border-emerald-100">Finalized High</span>
                    </div>
                  </div>

                  {/* Delivery Info if any */}
                  {tx?.metadata?.voucherCode && (
                    <div className="mt-2 pt-5 border-t border-slate-100">
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full -mr-8 -mt-8"></div>
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 block">Detail Pengiriman Digital</span>
                        
                        {tx.metadata.productCategory === 'Subscription' ? (
                          <div className="flex gap-3">
                             <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                               <ReceiptIcon size={16} />
                             </div>
                             <div>
                               <div className="text-slate-800 font-bold text-[12px]">Layanan Aktif</div>
                               <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{tx.metadata.instructions}</p>
                             </div>
                          </div>
                        ) : (
                          <div className="w-full">
                             <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm group">
                                <span className="font-mono font-black text-[15px] text-blue-600 tracking-widest truncate">{tx.metadata.voucherCode}</span>
                                <button 
                                  onClick={() => navigator.clipboard.writeText(tx.metadata?.voucherCode || '')}
                                  className="text-blue-400 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                >
                                  <Copy size={16} />
                                </button>
                             </div>
                             <p className="text-[9px] text-slate-400 mt-2 text-center font-medium italic">"{tx.metadata.instructions}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* High Tech Technical Metadata */}
                  <div className="mt-4 pt-5 border-t border-slate-100 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[11px] text-slate-400 font-medium">Siklus Blok</span>
                        <span className="text-[11px] font-mono text-slate-600">{Math.floor(Math.random() * 800000 + 4000000)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[11px] text-slate-400 font-medium">Protocol ID</span>
                        <span className="text-[11px] font-mono text-slate-600">ARC-V3.2-PNT</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">ID Referensi (Hash)</span>
                        <div className="bg-slate-50 rounded-lg px-3 py-2 flex items-center justify-between border border-slate-100">
                           <span className="text-[10px] font-mono font-bold text-slate-500 truncate w-48 uppercase">
                             {tx?.txHash || `ARCX${tx?.id?.toString().substring(0, 16).toUpperCase()}`}
                           </span>
                           <Copy size={12} className="text-slate-300" />
                        </div>
                    </div>
                  </div>
              </div>

              {/* Realistic Thermal Paper Footer */}
              <div className="bg-slate-50 px-8 py-5 border-t border-slate-200/50 flex flex-col items-center relative gap-2">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-b from-slate-200/20 to-transparent"></div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1e293b]"></div>
                    <span className="text-[9px] text-[#1e293b] font-black uppercase tracking-[0.2em]">ARCSYSTEM SETTLEMENT PROOF</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1e293b]"></div>
                  </div>
                  <span className="text-[8px] text-slate-400 text-center font-medium max-w-[200px]">Simpan struk digital ini sebagai bukti sah pembayaran Anda di jaringan Arc Testnet.</span>
              </div>
          </div>
        ) : (
          /* STATUS VIEW - for Pending or Failed */
          <div className="bg-white rounded-3xl w-full max-w-[320px] shadow-sm border border-slate-100 flex flex-col overflow-hidden mt-10 p-8 items-center text-center text-left">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isFailed ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                {isPending ? (
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ReceiptIcon size={40} />
                )}
              </div>
              
              <h2 className={`text-xl font-bold mb-2 ${isFailed ? 'text-red-600' : 'text-slate-800'}`}>
                {isPending ? 'Transaction Processing' : 'Transaction Failed'}
              </h2>
              
              <p className="text-slate-500 text-[14px] mb-8 leading-relaxed">
                {isPending 
                  ? 'Your transaction is being verified on the Arc Network. This usually takes a few moments.' 
                  : 'The transaction could not be processed at this time. Please check your balance and try again.'}
              </p>

              <div className="w-full space-y-4 pt-6 border-t border-slate-100 text-left">
                 <div className="flex justify-between">
                    <span className="text-[13px] text-slate-500">Amount</span>
                    <span className="text-[13px] font-bold text-slate-800">{tx.amount} USDC</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-[13px] text-slate-500">Status</span>
                    <span className={`text-[13px] font-bold uppercase tracking-wide ${isPending ? 'text-blue-500' : 'text-red-500'}`}>
                      {tx.status}
                    </span>
                 </div>
              </div>
              
              <button 
                onClick={onBack}
                className="mt-10 w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl transition-all active:scale-[0.98]"
              >
                Close Status
              </button>
          </div>
        )}
      </div>
    </div>
  );
}
