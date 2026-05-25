import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Receipt, 
  Plus, 
  CreditCard, 
  Search, 
  Calendar, 
  ArrowUpRight, 
  Coins,
  Eye,
  ArrowDownToLine,
  ShoppingBag,
  RefreshCw,
  Clock,
  CheckCircle2,
  EyeOff,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UIDCard } from '../common/UIDCard';

interface AccountDetailScreenProps {
  onBack: () => void;
  onTransfer: () => void;
  onReceive: () => void;
  onTransactionClick?: () => void;
  userName?: string;
}

export function AccountDetailScreen({                
  onBack, 
  onTransfer, 
  onReceive,
  onTransactionClick,
  userName = "ALEXANDER D"
}: AccountDetailScreenProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'token'>('history');
  const [showUID, setShowUID] = useState(false);
  const { transactions, showBalance, balance, activeFilter, setActiveFilter } = useApp();
  
  const filteredTransactions = transactions.filter((tx) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Received') return tx.type === 'deposit';
    if (activeFilter === 'Sent') return ['withdraw', 'transfer', 'purchase'].includes(tx.type);
    if (activeFilter === 'Swaps') return tx.type === 'swap';
    return true;
  });

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

  const [showCard, setShowCard] = useState(false);
  const [showUnifiedDetails, setShowUnifiedDetails] = useState(false);
  
  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50 animate-in slide-in-from-right duration-300 overflow-hidden">
      {/* Top Header Section - Blue Gradient */}
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 pt-12 pb-24 px-4 relative shrink-0 z-10 flex flex-col items-center overflow-hidden w-full">
        {/* Background abstract curves */}
        <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-30px] left-[-30px] w-[150px] h-[150px] bg-blue-400/30 rounded-full blur-xl"></div>
        
        <button onClick={onBack} className="absolute left-4 top-10 p-2 hover:bg-white/10 rounded-full transition-colors z-20">
          <ArrowLeft size={24} className="text-white" />
        </button>

        {/* Action Buttons Row */}
        <div className="flex justify-center gap-[32px] mt-2 w-full z-10 px-2">
          <DetailActionButton icon={<Send size={20} />} label={`Transfer\nUSDC`} onClick={onTransfer} />
          <DetailActionButton icon={<ArrowDownToLine size={20} />} label={`Receive\nUSDC`} onClick={onReceive} />
          <DetailActionButton icon={<CreditCard size={20} />} label={`Card`} isGlow onClick={() => setShowCard(true)} />
        </div>
      </div>

      {/* Main Content Area - White background overlaps the blue */}
      <div className="flex-1 bg-white rounded-t-[32px] -mt-8 z-20 relative overflow-hidden flex flex-col shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        
        <div className="px-6 pt-6 pb-2 shrink-0 border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-6">
             <div 
               className={`flex flex-col items-center border-b-[2.5px] pb-1.5 px-1 cursor-pointer transition-colors ${activeTab === 'token' ? 'border-slate-900' : 'border-transparent'}`}
               onClick={() => setActiveTab('token')}
             >
               <h3 className={`font-bold text-[14px] ${activeTab === 'token' ? 'text-slate-800' : 'text-slate-400'}`}>Tokens</h3>
             </div>
             <div 
               className={`flex flex-col items-center border-b-[2.5px] pb-1.5 px-1 cursor-pointer transition-colors ${activeTab === 'history' ? 'border-slate-900' : 'border-transparent'}`}
               onClick={() => setActiveTab('history')}
             >
               <h3 className={`font-bold text-[14px] ${activeTab === 'history' ? 'text-slate-800' : 'text-slate-400'}`}>History</h3>
             </div>
           </div>
           {activeTab === 'history' && <button className="text-slate-800 font-bold text-[13px]">e-Statement</button>}
        </div>

        {activeTab === 'history' && (
          <>
            <div className="flex items-center px-4 py-3 shrink-0 justify-between">
                <div className="flex gap-4 overflow-x-auto scrollbar-hide py-1 text-[13px] text-slate-500 font-medium">
                  {(['All', 'Received', 'Sent', 'Swaps'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`whitespace-nowrap px-1 ${activeFilter === filter ? 'text-slate-800 font-bold border-b-[2.5px] border-slate-800 pb-1' : ''}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
               <div className="flex items-center gap-3 ml-2 shrink-0">
                  <button className="text-slate-800 bg-slate-100 p-2 rounded-full"><Search size={16} strokeWidth={2.5} /></button>
                  <button className="text-slate-400 p-2 rounded-full bg-slate-50"><Calendar size={16} strokeWidth={2.5} /></button>
               </div>
            </div>

            {/* Transactions List */}
            <div className="flex-1 overflow-y-auto px-4 pb-24 flex flex-col pt-2">
              <div className="flex flex-col gap-3 mt-2">
                 {filteredTransactions.length === 0 ? (
                   <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 mt-10">
                      <Clock size={48} className="mb-4 opacity-50" />
                      <p>No transactions found.</p>
                   </div>
                 ) : (
                   filteredTransactions.map((tx) => (
                     <div 
                       key={tx.id} 
                       onClick={() => {
                         if (onTransactionClick) onTransactionClick();
                       }}
                       className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-all"
                     >
                       <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 ${getTxBg(tx.type)}`}>
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
                            <div className="flex items-center gap-1 mt-1 text-emerald-500 bg-emerald-50/50 px-2 py-0.5 rounded-full border border-emerald-100">
                               <CheckCircle2 size={10} />
                               <span className="text-[9px] font-black uppercase tracking-wider">SUCCESS</span>
                            </div>
                         ) : (
                            <div className="flex items-center gap-1 mt-1 text-amber-500 bg-amber-50/50 px-2 py-0.5 rounded-full border border-amber-100">
                               <Clock size={10} />
                               <span className="text-[9px] font-black uppercase tracking-wider">{tx.status}</span>
                            </div>
                         )}
                       </div>
                     </div>
                   ))
                 )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'token' && (
          <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 flex flex-col gap-4 bg-slate-50/50">
            {/* USDC Token Card */}
            <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div 
                className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setShowUnifiedDetails(!showUnifiedDetails)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-[#008fcd] shadow-inner shrink-0">
                    <Coins size={24} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                       <span className="font-bold text-[16px] text-slate-800 leading-tight">USDC</span>
                       <span className="bg-slate-100 text-slate-500 text-[8.5px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm">Unified</span>
                    </div>
                    <span className="text-[12px] text-slate-500 font-medium">USD Coin</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-[16px] text-slate-800">
                      {(balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[12px] text-slate-400 font-medium tracking-wide">
                      ~${(balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${showUnifiedDetails ? "rotate-180" : ""}`} />
                </div>
              </div>

              {/* Accordion Rincian Saldo Gabungan */}
              {showUnifiedDetails && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-50 bg-slate-50/50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center mb-3 mt-1">
                    <span className="font-extrabold tracking-wide uppercase text-[10px] text-slate-500">
                      Cross-Chain Balance (USDC)
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-[#008fcd] text-[8px] font-mono font-bold uppercase">
                      Circle Gateway
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="rounded-xl p-2.5 bg-white border border-slate-100 flex flex-col justify-between shadow-sm">
                      <span className="text-[8.5px] font-mono font-extrabold text-slate-800">ARC L1</span>
                      <span className="font-bold text-[12px] sm:text-[13px] mt-1 text-slate-700">
                        {showBalance ? `${(balance * 0.50).toFixed(2).replace('.', ',')}` : '••••'}
                      </span>
                      <span className="text-[8px] text-slate-400 mt-1">Native (50%)</span>
                    </div>

                    <div className="rounded-xl p-2.5 bg-white border border-slate-100 flex flex-col justify-between shadow-sm">
                      <span className="text-[8.5px] font-mono font-extrabold text-[#0052FF]">BASE</span>
                      <span className="font-bold text-[12px] sm:text-[13px] mt-1 text-slate-700">
                        {showBalance ? `${(balance * 0.25).toFixed(2).replace('.', ',')}` : '••••'}
                      </span>
                      <span className="text-[8px] text-slate-400 mt-1">L2 (25%)</span>
                    </div>

                    <div className="rounded-xl p-2.5 bg-white border border-slate-100 flex flex-col justify-between shadow-sm">
                      <span className="text-[8.5px] font-mono font-extrabold text-[#28A0F0]">ARBITRUM</span>
                      <span className="font-bold text-[12px] sm:text-[13px] mt-1 text-slate-700">
                        {showBalance ? `${(balance * 0.25).toFixed(2).replace('.', ',')}` : '••••'}
                      </span>
                      <span className="text-[8px] text-slate-400 mt-1">L2 (25%)</span>
                    </div>
                  </div>

                  <div className="text-[10px] sm:text-[11px] leading-relaxed p-3 rounded-xl border border-blue-100 bg-blue-50/50 text-slate-600">
                    💡 <span className="font-bold text-slate-700">Unified Balance:</span> USDC from various networks (Arc, Base, Arbitrum) are virtually unified. You can spend or transfer your total balance instantly on Arc Testnet without tedious cross-chain bridging.
                  </div>
                </div>
              )}
            </div>

            {/* ARC Token Card */}
            <div className="bg-white rounded-2xl p-4 flex justify-between items-center shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-inner relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/40 via-transparent to-blue-500/40"></div>
                   <span className="font-bold text-[10px] tracking-wider italic z-10">ARC</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[16px] text-slate-800 leading-tight">ARC</span>
                  <span className="text-[12px] text-slate-500 font-medium">Arc Network</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-bold text-[16px] text-slate-800">12,450.00</span>
                <span className="text-[12px] text-slate-400 font-medium tracking-wide">~$249.00</span>
              </div>
            </div>

            {/* Empty State / Add Token */}
            <button className="mt-2 w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-slate-800 hover:border-blue-200 hover:bg-slate-100/50 transition-all font-semibold">
              <Plus size={18} />
              <span className="text-[14px]">Import Token</span>
            </button>
          </div>
        )}
      </div>

      {showCard && (
        <div className="absolute inset-0 z-[100] flex flex-col justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in" 
            onClick={() => setShowCard(false)}
          ></div>
          
          <div className="bg-white rounded-t-[32px] w-full flex flex-col items-center relative z-10 animate-in slide-in-from-bottom-[100%] duration-300 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
            
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mt-4 mb-6"></div>
            
            <div className="px-6 w-full flex flex-col items-center">
              <h3 className="font-bold text-[18px] text-slate-800 mb-6">Your UID Card</h3>
              
              {/* Card Design */}
              <UIDCard userName={userName} isBlurred={!showUID} />
              
              {/* Card Actions */}
              <div className="flex justify-center w-full mt-8 border-t border-slate-100 pt-6">
                <div onClick={() => setShowUID(!showUID)} className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform group-active:scale-95 ${showUID ? 'bg-slate-100 text-slate-600' : 'bg-slate-100 text-slate-800'}`}>
                    {showUID ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                  <span className="text-[12px] font-medium text-slate-600">{showUID ? 'Hide UID' : 'View UID'}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DetailActionButtonProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  onClick?: () => void;
  isGlow?: boolean;
}

function DetailActionButton({ icon, label, badge, onClick, isGlow }: DetailActionButtonProps) {
  return (
    <div className="flex flex-col items-center gap-2 group cursor-pointer w-16" onClick={onClick}>
      <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.1)] group-active:scale-95 transition-all relative
        ${isGlow ? 'text-slate-800 shadow-[inset_0_0_12px_rgba(63,162,246,0.3),0_4px_12px_rgba(0,0,0,0.1)] border border-blue-50/50' : 'text-slate-800'}`}>
        {icon}
        {badge && (
          <div className="absolute -top-[2px] -right-[6px] bg-yellow-400 text-slate-800 text-[9px] font-bold px-1 py-[1px] rounded-[4px] border border-white leading-none">
            {badge}
          </div>
        )}
      </div>
      <span className="text-white text-[11px] font-medium text-center leading-tight whitespace-pre-line tracking-wide opacity-95">
        {label}
      </span>
    </div>
  );
}

interface DetailTransactionItemProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  amount: string;
  amountColor?: string;
  badge?: string;
  hideSeparator?: boolean;
  onClick?: () => void;
}

function DetailTransactionItem({ 
  icon, 
  title, 
  desc, 
  amount, 
  amountColor = "text-slate-800",
  badge,
  hideSeparator,
  onClick
}: DetailTransactionItemProps) {
  return (
    <div className="flex gap-4 p-2 cursor-pointer group active:scale-[0.98] transition-all my-1 text-left w-full" onClick={onClick}>
       <div className="mt-1 w-6 shrink-0 flex justify-center">
          {icon}
       </div>
       <div className={`flex flex-col flex-1 pb-4 ${hideSeparator ? '' : 'border-b border-slate-100'}`}>
          <div className="flex justify-between items-start mb-1">
             <h5 className="font-bold text-[14px] text-slate-800 group-hover:text-slate-800 transition-colors">{title}</h5>
             <div className="flex flex-col items-end">
                <span className={`font-bold text-[14px] ${amountColor} flex`}>
                  {amount}
                  <span className="text-[9px] mt-0.5 ml-0.5">00</span>
                </span>
             </div>
          </div>
          <p className="text-[12px] text-slate-500 leading-snug whitespace-pre-line max-w-[85%] mt-1">{desc}</p>
          {badge && (
             <div className="mt-2.5 inline-flex items-center gap-1 bg-emerald-55 text-emerald-600 px-2 pt-0.5 pb-1 rounded-full w-fit border border-emerald-100">
                <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center">
                   <span className="text-white text-[8px] font-bold">L</span>
                </div>
                <span className="text-[11px] font-bold tracking-tight">{badge}</span>
             </div>
          )}
       </div>
    </div>
  );
}
export { DetailActionButton, DetailTransactionItem };
