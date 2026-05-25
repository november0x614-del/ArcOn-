import React from 'react';
import { ArrowLeft, Share2, Download, Receipt as ReceiptIcon, Copy } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ReceiptScreenProps {
  onBack: () => void;
}

export function ReceiptScreen({ onBack }: ReceiptScreenProps) {
  const { selectedTransaction: tx } = useApp();

  return (
    <div className="w-full h-full bg-[#f8fafc] relative flex flex-col z-50 animate-in fade-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h2 className="font-bold text-[16px] text-white ml-2">RECEIPT</h2>
        </div>
        <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer border-0 bg-transparent">
               <Download size={20} className="text-white" />
            </button>
            <button className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer border-0 bg-transparent">
               <Share2 size={20} className="text-white" />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 flex flex-col items-center">
        {/* Receipt Ticket Design */}
        <div className="bg-white rounded-3xl w-full max-w-[320px] shadow-sm border border-slate-100 flex flex-col relative drop-shadow-xl overflow-hidden mt-4">
            
            {/* Ticket Header Graphic */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-[-30px] right-[-30px] w-[100px] h-[100px] bg-white/20 rounded-full blur-xl"></div>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-800 shadow-md z-10 mb-3">
                   <ReceiptIcon size={32} />
                </div>
                <h2 className="text-slate-800 font-bold text-[18px] z-10">{tx?.status === 'success' ? 'Transaction Successful' : 'Transaction Processing'}</h2>
                <span className="text-blue-100 text-[12px] z-10">{tx?.timestamp || 'Unknown Time'}</span>
            </div>

            {/* Jagged edge divider (simulated with CSS circles) */}
            <div className="relative h-4 bg-white overflow-hidden flex transform -translate-y-2">
                <div className="absolute inset-0 flex justify-between space-x-[2px]">
                   {[...Array(20)].map((_, i) => (
                      <div key={i} className="w-3 h-3 bg-[#f8fafc] rounded-full -mt-2"></div>
                   ))}
                </div>
            </div>

            {/* Amount */}
            <div className="flex flex-col items-center pt-2 pb-6 border-b border-dashed border-slate-200 mx-6">
                <span className="text-slate-500 text-[13px] font-medium mb-1">Total Amount</span>
                <h1 className="text-slate-800 text-[32px] font-bold tracking-tight">{tx ? tx.amount.replace('-', '').replace('+', '') : '0.00'} <span className="text-[16px] text-slate-500">{tx?.currency || 'USDC'}</span></h1>
            </div>

            {/* Details Table */}
            <div className="px-6 py-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <span className="text-[13px] text-slate-500 font-medium">Description</span>
                    <span className="text-[13px] font-bold text-slate-800 text-right">{tx?.title || 'Unknown Transaction'}</span>
                </div>
                <div className="flex justify-between items-start">
                    <span className="text-[13px] text-slate-500 font-medium">Transaction Type</span>
                    <span className="text-[13px] font-bold text-slate-800 text-right uppercase">{tx?.type || 'Transfer'}</span>
                </div>
                <div className="flex justify-between items-start">
                    <span className="text-[13px] text-slate-500 font-medium">Source of Funds</span>
                    <span className="text-[13px] font-bold text-slate-800">Arc Wallet</span>
                </div>
                <div className="flex justify-between items-start">
                    <span className="text-[13px] text-slate-500 font-medium">Network Fee</span>
                    <span className="text-[13px] font-bold text-slate-800">0.00 (Sponsored)</span>
                </div>

                {tx?.metadata?.voucherCode && (
                  <div className="mt-2 pt-4 border-t border-slate-100 flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest text-center">Digital Delivery detail</span>
                    <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex flex-col items-center">
                        {tx.metadata.productCategory === 'Subscription' ? (
                          <div className="text-center">
                             <div className="text-emerald-600 font-bold text-[12px] mb-1">✓ Layanan Aktif</div>
                             <p className="text-[11px] text-slate-600 leading-relaxed">{tx.metadata.instructions}</p>
                          </div>
                        ) : (
                          <div className="w-full">
                             <div className="bg-white border border-blue-200 rounded-lg px-3 py-2 flex items-center justify-between shadow-sm">
                                <span className="font-mono font-bold text-[14px] text-slate-800 tracking-wider truncate mr-2">{tx.metadata.voucherCode}</span>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(tx.metadata?.voucherCode || '');
                                    // Normally we would use a toast here, but we are in ReceiptScreen
                                  }}
                                  className="text-slate-600 hover:bg-slate-200 p-1 rounded-md transition-colors"
                                >
                                  <Copy size={14} />
                                </button>
                             </div>
                             <p className="text-[10px] text-slate-400 mt-2 text-center leading-tight">{tx.metadata.instructions}</p>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-start">
                    <span className="text-[13px] text-slate-500 font-medium">Reference Number</span>
                    <div className="flex items-center gap-1.5">
                       <span className="text-[11px] font-mono font-bold text-slate-700 truncate w-24 text-right">{tx?.txHash || 'N/A'}</span>
                       <Copy size={12} className="text-slate-800" />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-medium text-center uppercase tracking-widest">Powered by Arc Network</span>
            </div>
        </div>
      </div>
    </div>
  );
}
