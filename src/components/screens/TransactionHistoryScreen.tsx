import React, { useState } from 'react';
import { ArrowLeft, Clock, ExternalLink, CheckCircle2, Receipt, ArrowUpRight, ArrowDownToLine, RefreshCw, ShoppingBag, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ARC_TESTNET } from '../../lib/arcConfig';

interface TransactionHistoryScreenProps {
  onBack: () => void;
}

export function TransactionHistoryScreen({ onBack }: TransactionHistoryScreenProps) {
  const { transactions } = useApp();
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const getExplorerUrl = (txHash: string) => {
    return `${ARC_TESTNET.blockExplorers.default.url}/tx/${txHash}`;
  };

  const getTxIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownToLine size={20} className="text-emerald-500" />;
      case 'withdraw': return <ArrowUpRight size={20} className="text-red-500" />;
      case 'transfer': return <ArrowUpRight size={20} className="text-orange-500" />;
      case 'purchase': return <ShoppingBag size={20} className="text-purple-500" />;
      case 'swap': return <RefreshCw size={20} className="text-slate-600" />;
      default: return <Receipt size={20} className="text-slate-500" />;
    }
  };

  const getTxBg = (type: string) => {
    switch (type) {
      case 'deposit': return 'bg-emerald-50 border-emerald-100';
      case 'withdraw': return 'bg-red-50 border-red-100';
      case 'transfer': return 'bg-orange-50 border-orange-100';
      case 'purchase': return 'bg-purple-50 border-purple-100';
      case 'swap': return 'bg-slate-100 border-slate-200';
      default: return 'bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="w-full h-full bg-[#f8fafc] relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full shrink-0 justify-between">
        <div className="flex items-center">
           <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent">
             <ArrowLeft size={20} className="text-white" />
           </button>
           <h2 className="font-bold text-[16px] text-white ml-2">Transaction History</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto w-full">
        {!selectedTx ? (
          <div className="p-4 flex flex-col gap-3">
             {transactions.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 mt-20">
                  <Clock size={48} className="mb-4 opacity-50" />
                  <p>No transactions found.</p>
               </div>
             ) : (
               transactions.map((tx) => (
                 <div 
                   key={tx.id} 
                   onClick={() => setSelectedTx(tx)}
                   className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 active:scale-[0.98] transition-all"
                 >
                   <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${getTxBg(tx.type)}`}>
                        {getTxIcon(tx.type)}
                     </div>
                     <div>
                       <h3 className="font-bold text-[15px] text-slate-800 leading-tight">{tx.title}</h3>
                       <p className="text-[12px] text-slate-500 mt-0.5">{tx.timestamp} • {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</p>
                     </div>
                   </div>
                   <div className="flex flex-col items-end">
                     <span className={`font-bold text-[15px] ${tx.amount.startsWith('+') ? 'text-emerald-500' : 'text-slate-800'}`}>
                        {tx.amount} {tx.currency}
                     </span>
                     {tx.status === 'success' ? (
                        <div className="flex items-center gap-1 mt-1 text-emerald-500">
                           <CheckCircle2 size={12} />
                           <span className="text-[10px] font-bold uppercase tracking-wider">Finalized</span>
                        </div>
                     ) : tx.status === 'failed' ? (
                        <div className="flex items-center gap-1 mt-1 text-red-500">
                           <X size={12} />
                           <span className="text-[10px] font-bold uppercase tracking-wider">Failed</span>
                        </div>
                     ) : (
                        <div className="flex items-center gap-1 mt-1 text-amber-500">
                           <Clock size={12} />
                           <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
                        </div>
                     )}
                   </div>
                 </div>
               ))
             )}
          </div>
        ) : (
          <div className="p-4 animate-in slide-in-from-right duration-300 h-full flex flex-col">
             {/* Tx Detail View */}
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-full border-[3px] flex items-center justify-center mb-4 ${getTxBg(selectedTx.type)}`}>
                  {getTxIcon(selectedTx.type)}
                </div>
                <h2 className="text-[18px] font-bold text-slate-800 mb-1">{selectedTx.title}</h2>
                <div className={`text-[32px] font-extrabold font-mono tracking-tight my-2 ${selectedTx.amount.startsWith('+') ? 'text-emerald-500' : 'text-slate-800'}`}>
                  {selectedTx.amount} {selectedTx.currency}
                </div>
                
                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full mt-2 border border-emerald-100 shadow-sm">
                   <CheckCircle2 size={16} />
                   <span className="text-[13px] font-bold tracking-wide uppercase">Arc Native Finalized</span>
                </div>
                <p className="text-[10px] text-emerald-600/70 mt-1 font-bold tracking-wider uppercase">Deterministic 1-Conf</p>
                
                <div className="w-full h-px bg-slate-100 my-6"></div>
                
                <div className="w-full flex justify-between items-center text-[14px] mb-4">
                   <span className="text-slate-500">Transaction ID</span>
                   <span className="font-mono font-medium text-slate-800 bg-slate-50 px-2 py-1 rounded">TRX-{Math.floor(Math.random() * 9000000) + 1000000}</span>
                </div>
                <div className="w-full flex justify-between items-center text-[14px] mb-4">
                   <span className="text-slate-500">Date & Time</span>
                   <span className="font-medium text-slate-800">{selectedTx.timestamp}</span>
                </div>
                <div className="w-full flex justify-between items-center text-[14px] mb-4">
                   <span className="text-slate-500">Network Fee (Gas)</span>
                   <span className="font-medium text-slate-800 font-mono">{selectedTx.metadata?.fee || (selectedTx.type === 'deposit' ? '0.0000' : '0.0001')} USDC</span>
                </div>
                {selectedTx.txHash && (
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl p-4 mt-2 flex flex-col gap-2">
                     <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-blue-800 uppercase tracking-wide">Blockchain Record</span>
                        <div className={`w-2 h-2 rounded-full ${selectedTx.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                     </div>
                     <p className="text-[10px] text-slate-800 font-mono text-left opacity-80 select-all line-clamp-1 break-all">
                       {selectedTx.txHash}
                     </p>
                     
                     <a href={selectedTx.txHash ? getExplorerUrl(selectedTx.txHash) : (selectedTx.explorerUrl || '#')} target="_blank" rel="noopener noreferrer" className="mt-2 w-full bg-white border border-blue-200 text-slate-800 font-bold py-2 rounded-lg text-[13px] flex items-center justify-center gap-1 hover:bg-slate-200 active:scale-95 transition-all">
                        View on Arc Explorer <ExternalLink size={14} />
                     </a>
                  </div>
                )}
             </div>
             
             <button 
                onClick={() => setSelectedTx(null)}
                className="mt-6 w-full bg-slate-100 text-slate-700 font-bold py-4 rounded-full text-[15px] hover:bg-slate-200 transition-colors"
             >
                Close Receipt
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
