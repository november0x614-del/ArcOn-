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
import { useUnifiedBalanceKit } from '../../services/unified-balance-kit';
import { useApp } from '../../context/AppContext';
import { UIDCard } from '../common/UIDCard';
import { formatCurrency, truncateAddress } from '../../lib/utils';

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
  onTransactionClick
}: AccountDetailScreenProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'token'>('history');
  const [showUID, setShowUID] = useState(false);
  const { transactions, showBalance, setShowBalance, pnlValue, pnlPercentage, activeFilter, setActiveFilter, registeredUser, allBalances } = useApp();
  const userName = registeredUser?.username || "PENGGUNA ARC";
  const kit = useUnifiedBalanceKit();
  const balance = kit.unifiedBalance.getBalance();

  // Find individual network balances from allBalances
  const arcBalance = allBalances.find(b => b.network === 'ARC' || b.network === 'ARC TESTNET')?.balance || 0;
  const baseBalance = allBalances.find(b => b.network === 'BASE' || b.network === 'BASE SEPOLIA')?.balance || (balance > 0 ? balance * 0.25 : 0);
  const arbBalance = allBalances.find(b => b.network === 'ARBITRUM' || b.network === 'ARBITRUM SEPOLIA')?.balance || (balance > 0 ? balance * 0.25 : 0);
  
  // Adjusted percentages for display if actual data is missing
  const displayArcBalance = arcBalance || (balance > 0 ? balance * 0.50 : 0);

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
      case 'swap': return <RefreshCw size={20} className="text-blue-500" />;
      default: return <Receipt size={20} className="text-slate-500" />;
    }
  };

  const getTxBg = (type: string) => {
    switch (type) {
      case 'deposit': return 'bg-emerald-50 border-emerald-100';
      case 'withdraw': return 'bg-red-50 border-red-100';
      case 'transfer': return 'bg-orange-50 border-orange-100';
      case 'purchase': return 'bg-purple-50 border-purple-100';
      case 'swap': return 'bg-blue-50 border-blue-100';
      default: return 'bg-slate-50 border-slate-100';
    }
  };

  const [showCard, setShowCard] = useState(false);
  const [showUnifiedDetails, setShowUnifiedDetails] = useState(false);
  
  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50 animate-in slide-in-from-right duration-300 overflow-hidden">
      {/* Top Header Section - Blue Gradient */}
      <div className="bg-gradient-to-b from-[#3FA2F6] to-blue-600 pt-12 pb-24 px-4 relative shrink-0 z-10 flex flex-col items-center overflow-hidden w-full">
        {/* Background abstract curves */}
        <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-30px] left-[-30px] w-[150px] h-[150px] bg-blue-400/30 rounded-full blur-xl"></div>
        
        <button onClick={onBack} className="absolute left-4 top-10 p-2 hover:bg-white/10 rounded-full transition-colors z-20">
          <ArrowLeft size={24} className="text-white" />
        </button>

        {/* Header Title */}
        <div className="w-full flex justify-center items-center z-10 h-10 mt-[-4px]">
           <h2 className="text-white text-[16px] font-semibold tracking-wide">USDC Savings</h2>
        </div>

        {/* Wallet Address & Balance Content */}
        <div className="flex flex-col items-center mt-6 z-10 w-full px-4 overflow-hidden">
          <div className="w-full max-w-[340px] bg-gradient-to-br from-[#1e293b] via-[#111827] to-[#030712] border border-white/10 rounded-[24px] p-6 shadow-2xl relative overflow-hidden group flex flex-col items-center">
            
            <div className="flex flex-col items-center w-full text-center text-white relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[13px] font-medium text-slate-400">
                  Est total value
                </span>
                {showBalance ? (
                  <Eye
                    size={16}
                    className="text-slate-500 shrink-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowBalance(false);
                    }}
                  />
                ) : (
                  <EyeOff
                    size={16}
                    className="text-slate-500 shrink-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowBalance(true);
                    }}
                  />
                )}
              </div>

              <div 
                onClick={() => setShowUnifiedDetails(!showUnifiedDetails)}
                className="flex items-baseline gap-2 mb-4 justify-center cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[38px] sm:text-[42px] font-black tracking-tight leading-none text-white font-mono">
                    {showBalance ? formatCurrency(balance) : '••••••'}
                  </span>
                  <span className="bg-blue-500/30 border border-blue-400/30 text-[#60a5fa] text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full mt-1 flex items-center gap-1">
                    Unified Balance
                    <ChevronDown size={11} className={`transition-transform duration-200 ${showUnifiedDetails ? "rotate-180" : ""}`} />
                  </span>
                </div>
              </div>

              {/* Accordion Rincian Saldo Gabungan */}
              {showUnifiedDetails && (
                <div className="w-full mt-3 pt-4 border-t border-white/10 text-left animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-extrabold tracking-wide uppercase text-[10px] text-slate-300">
                      Saldo Lintas Rantai (USDC)
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[8px] font-mono font-bold uppercase">
                      Circle Gateway
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3.5">
                    <div className="rounded-xl p-2.5 border border-white/5 bg-white/5 flex flex-col justify-between">
                      <span className="text-[8.5px] font-mono font-extrabold text-[#3FA2F6]">ARC L1</span>
                      <span className="font-bold text-[12px] sm:text-[13px] mt-1 text-white">
                        {showBalance ? formatCurrency(displayArcBalance, '') : '••••'}
                      </span>
                      <span className="text-[8px] text-slate-400 mt-1">Native ({balance > 0 ? Math.round((displayArcBalance / balance) * 100) : 50}%)</span>
                    </div>

                    <div className="rounded-xl p-2.5 border border-white/5 bg-white/5 flex flex-col justify-between">
                      <span className="text-[8.5px] font-mono font-extrabold text-[#0052FF]">BASE</span>
                      <span className="font-bold text-[12px] sm:text-[13px] mt-1 text-slate-200">
                        {showBalance ? formatCurrency(baseBalance, '') : '••••'}
                      </span>
                      <span className="text-[8px] text-slate-400 mt-1">L2 ({balance > 0 ? Math.round((baseBalance / balance) * 100) : 25}%)</span>
                    </div>

                    <div className="rounded-xl p-2.5 border border-white/5 bg-white/5 flex flex-col justify-between">
                      <span className="text-[8.5px] font-mono font-extrabold text-[#28A0F0]">ARBITRUM</span>
                      <span className="font-bold text-[12px] sm:text-[13px] mt-1 text-slate-200">
                        {showBalance ? formatCurrency(arbBalance, '') : '••••'}
                      </span>
                      <span className="text-[8px] text-slate-400 mt-1">L2 ({balance > 0 ? Math.round((arbBalance / balance) * 100) : 25}%)</span>
                    </div>
                  </div>

                  <div className="text-[10px] sm:text-[11px] leading-relaxed p-2.5 rounded-xl border border-white/5 bg-white/5 text-slate-300">
                    💡 <span className="font-bold">Saldo Terpusat:</span> USDC dari berbagai jaringan (Arc, Base, Arbitrum) disatukan secara virtual. Belanja dan transfer kapan saja secara instan di Arc Testnet tanpa perlu biaya migrasi (cross-chain transfer) yang melelahkan.
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mt-3">
                <span className="text-[13px] text-slate-400 border-b border-dashed border-slate-600 pb-0.5 uppercase tracking-wider font-semibold">
                  PnL 1 Bln
                </span>
                <span className="text-[13px] font-bold text-emerald-400 font-mono">
                  {`${pnlValue >= 0 ? '+' : '-'}${formatCurrency(Math.abs(pnlValue), '')} (${pnlPercentage >= 0 ? '+' : ''}${pnlPercentage.toFixed(2).replace('.', ',')}%)`}
                </span>
              </div>
            </div>

            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full -translate-y-12 translate-x-12 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 blur-[40px] rounded-full translate-y-10 -translate-x-10 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex justify-center gap-[32px] mt-8 w-full z-10 px-2">
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
               className={`flex flex-col items-center border-b-[2.5px] pb-1.5 px-1 cursor-pointer transition-colors ${activeTab === 'token' ? 'border-[#3FA2F6]' : 'border-transparent'}`}
               onClick={() => setActiveTab('token')}
             >
               <h3 className={`font-bold text-[14px] ${activeTab === 'token' ? 'text-slate-800' : 'text-slate-400'}`}>Tokens</h3>
             </div>
             <div 
               className={`flex flex-col items-center border-b-[2.5px] pb-1.5 px-1 cursor-pointer transition-colors ${activeTab === 'history' ? 'border-[#3FA2F6]' : 'border-transparent'}`}
               onClick={() => setActiveTab('history')}
             >
               <h3 className={`font-bold text-[14px] ${activeTab === 'history' ? 'text-slate-800' : 'text-slate-400'}`}>History</h3>
             </div>
           </div>
           {activeTab === 'history' && <button className="text-[#3FA2F6] font-bold text-[13px]">e-Statement</button>}
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
                  <button className="text-[#3FA2F6] bg-blue-50 p-2 rounded-full"><Search size={16} strokeWidth={2.5} /></button>
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
                         <span className={cn(
                           "font-bold text-[15px] font-mono",
                           tx.amount.startsWith('+') ? 'text-emerald-500' : 'text-slate-800'
                         )}>
                            {tx.amount.startsWith('+') ? '+' : '-'}{formatCurrency(tx.amount.replace(/[+-]/g, ''), '')}
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
            <div className="bg-white rounded-2xl p-4 flex justify-between items-center shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-inner">
                  <Coins size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[16px] text-slate-800 leading-tight">USDC</span>
                  <span className="text-[12px] text-slate-500 font-medium">USD Coin</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-bold text-[16px] text-slate-800 font-mono">
                  {formatCurrency(balance || 0)}
                </span>
                <span className="text-[12px] text-slate-400 font-medium tracking-wide font-mono">
                  ~${formatCurrency(balance || 0, '')}
                </span>
              </div>
            </div>

            {/* ARC Token Card */}
            <div className="bg-white rounded-2xl p-4 flex justify-between items-center shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="items-center gap-4 flex">
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
                <span className="font-bold text-[16px] text-slate-800 font-mono">
                  {formatCurrency(allBalances.find(b => b.symbol === 'ARC')?.balance || 0, 'ARC')}
                </span>
                <span className="text-[12px] text-slate-400 font-medium tracking-wide font-mono">
                  ~${formatCurrency((allBalances.find(b => b.symbol === 'ARC')?.balance || 0) * 0.02, '')}
                </span>
              </div>
            </div>

            {/* Empty State / Add Token */}
            <button className="mt-2 w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-[#3FA2F6] hover:border-blue-200 hover:bg-blue-50/50 transition-all font-semibold">
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
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform group-active:scale-95 ${showUID ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-[#3FA2F6]'}`}>
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
        ${isGlow ? 'text-blue-600 shadow-[inset_0_0_12px_rgba(63,162,246,0.3),0_4px_12px_rgba(0,0,0,0.1)] border border-blue-50/50' : 'text-[#3FA2F6]'}`}>
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
             <h5 className="font-bold text-[14px] text-slate-800 group-hover:text-[#3FA2F6] transition-colors">{title}</h5>
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
