import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState, ShortcutItem } from '../../types';
import { MenuIcon } from '../common/MenuIcon';
import { StockRow } from '../common/StockRow';
import { ProductCard } from '../common/ProductCard';
import { NavItem } from '../common/NavItem';
import { DepositQRScreen } from './DepositQRScreen';
import {
  LogOut, Mail, Settings, ChevronRight, Eye, EyeOff, Settings2, Wallet, ShoppingBag, ArrowLeftRight, CalendarClock, PlusCircle as PlusCircleIcon, TrendingUp, X, Search, ArrowUpRight, ArrowDownToLine, Scan, Home, Box, Coins, Globe, ShieldCheck
} from 'lucide-react';

export interface HomeScreenProps {
  userName: string;
  selectedShortcuts: ShortcutItem[];
  onNavigate: (view: ViewState) => void;
}

export function HomeScreen({ userName, selectedShortcuts, onNavigate }: HomeScreenProps) {
  const [activeRekeningTab, setActiveRekeningTab] = useState(0);
  const [showBalance, setShowBalance] = useState(false);
  const [showDepositWithdrawModal, setShowDepositWithdrawModal] = useState(false);
  const [showDepositOptions, setShowDepositOptions] = useState(false);
  const [showDepositResult, setShowDepositResult] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const promoScrollRef = useRef<HTMLDivElement>(null);

  const handlePromoScroll = () => {
    if (promoScrollRef.current) {
      const scrollLeft = promoScrollRef.current.scrollLeft;
      // account for the gap-4 (16px)
      const itemWidth = promoScrollRef.current.children[0].clientWidth + 16;
      const newIndex = Math.round(scrollLeft / itemWidth);
      if (newIndex !== currentPromoIndex && newIndex >= 0 && newIndex < 4) {
        setCurrentPromoIndex(newIndex);
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (promoScrollRef.current) {
        const itemWidth = promoScrollRef.current.children[0].clientWidth + 16;
        const totalItems = promoScrollRef.current.children.length;
        let newIndex = currentPromoIndex + 1;
        if (newIndex >= totalItems) {
          newIndex = 0;
        }
        
        promoScrollRef.current.scrollTo({
          left: newIndex * itemWidth,
          behavior: 'smooth'
        });
        setCurrentPromoIndex(newIndex);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [currentPromoIndex]);

  const [marketTokens, setMarketTokens] = useState([
    { code: 'USDC', name: 'USD Coin', price: 1.00, change: 0.00, percent: 0.00, isDown: false },
    { code: 'ARC', name: 'Arc Network Gas Token', price: 24.10, change: 1.20, percent: 5.2, isDown: false },
    { code: 'ETH', name: 'Ethereum', price: 3100.00, change: -45.00, percent: -1.4, isDown: true },
    { code: 'SOL', name: 'Solana', price: 145.20, change: 12.00, percent: 9.0, isDown: false },
    { code: 'BTC', name: 'Bitcoin', price: 65000.00, change: -200.0, percent: -0.3, isDown: true }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketTokens(prevTokens => prevTokens.map(token => {
        if (token.code === 'USDC') return token; // Stablecoin, don't change
        
        const changePercent = (Math.random() - 0.5) * 0.005; // -0.25% to +0.25% change
        const changeAmount = token.price * changePercent;
        const newPrice = token.price + changeAmount;
        
        return {
          ...token,
          price: newPrice,
          change: token.change + changeAmount,
          percent: token.percent + (changePercent * 100),
          isDown: changeAmount < 0
        };
      }));
    }, 2000); // 2 seconds

    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${price.toFixed(2)}`;
  };

  const formatChange = (change: number, isDown: boolean) => {
    const absChange = Math.abs(change);
    const prefix = isDown ? '-' : '+';
    if (absChange >= 1000) {
      return `${prefix}${absChange.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${prefix}${absChange.toFixed(2)}`;
  };

  const startYRef = React.useRef(0);
  const currentYRef = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (closeFn: () => void) => {
    const diff = currentYRef.current - startYRef.current;
    if (diff > 50 && currentYRef.current !== 0) {
      closeFn();
    }
    startYRef.current = 0;
    currentYRef.current = 0;
  };

  return (
    <div className="flex flex-col h-full bg-[#ecf5fc] font-sans relative overflow-hidden">
      {/* Background shape that covers the top half */}
      <div className="absolute top-0 left-0 right-0 h-[430px] md:h-[450px] bg-[#3FA2F6] rounded-b-[40px] md:rounded-b-[50px] z-0"></div>

      {/* Top Header */}
      <header className="relative text-white px-5 md:px-8 lg:px-10 pt-6 md:pt-8 pb-3 flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer">
           <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#3FA2F6] font-[900] text-lg shadow-sm uppercase">
              {userName ? userName.slice(0, 2) : "UN"}
           </div>
           <div className="flex flex-col">
              <h1 className="font-bold text-[15px] tracking-wide relative after:content-[''] after:absolute after:right-[-20px] after:top-0 after:bottom-0 after:w-8 after:bg-gradient-to-r after:from-transparent after:to-[#3FA2F6]">
                 {userName ? (userName.length > 18 ? userName.slice(0, 15) + '...' : userName).toUpperCase() : 'USER NAME'}
              </h1>
              <div className="flex items-center gap-1 mt-0.5 hover:opacity-80 transition-opacity">
                 <span className="text-yellow-300 font-bold text-xs tracking-wide">100%</span>
                 <span className="text-xs font-semibold italic text-white/90">Gas Power (USDC)</span>
                 <ChevronRight size={12} className="text-white/80" />
               </div>
           </div>
        </div>
      </header>

      {/* Scrollable Main Content */}
      <div className="flex-1 overflow-y-auto pb-32 pt-0 scrollbar-hide z-20 md:px-4 lg:px-6 relative">
        
        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-6">
          {/* Left Column for Desktop */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3">
                 {/* Accounts Section */}
                 <section className="bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] mx-4 lg:mx-0 border border-slate-50/50 mt-0">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Accounts</h2>
            <div className="flex items-center gap-4 text-[#3FA2F6] text-[12px] font-semibold">
              <button onClick={() => setShowBalance(!showBalance)} className="flex items-center gap-1 hover:text-blue-600 transition-colors bg-transparent border-0">
                Balance {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex overflow-x-auto gap-2 pt-1 pb-3 mb-4 scrollbar-hide text-[12px] font-medium relative">
            {[
              { name: 'My Wallet', icon: <Wallet size={20} /> },
              { name: 'E-commerce', icon: <ShoppingBag size={20} /> },
              { name: 'Swap', icon: <ArrowLeftRight size={20} /> },
              { name: 'History', icon: <CalendarClock size={20} /> }
            ].map((tab, i) => (
              <div 
                key={tab.name} 
                onClick={() => setActiveRekeningTab(i)}
                className={`px-4 pb-2 flex items-center justify-center gap-2 whitespace-nowrap min-w-max cursor-pointer transition-colors relative ${
                activeRekeningTab === i 
                ? 'text-[#3FA2F6] font-bold' 
                : 'text-slate-500 hover:text-slate-800'
              }`}>
                {tab.icon}
                <span>{tab.name}</span>
                {activeRekeningTab === i && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-[#3FA2F6] rounded-t-full z-10"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
            ))}
          </div>
          
          <AnimatePresence mode="wait">
            {activeRekeningTab === 0 && (
              /* My Wallet Card (Slim Web3 Look) */
              <motion.div 
                 key="tab-0"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.2 }}
                 className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-5 text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)] relative overflow-hidden mb-3 cursor-pointer transition-all active:scale-[0.98] group border border-blue-600"
                 onClick={() => onNavigate('accountDetail')}
              >
                {/* Background Glow */}
                <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-blue-400 rounded-full blur-[50px] opacity-20 transition-opacity group-hover:opacity-30"></div>
                
                <div className="flex justify-between items-center z-10 relative">
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[12px] text-blue-100 uppercase tracking-widest leading-none">Arc Wallet</h3>
                    </div>
                    
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <p className="text-[26px] font-bold tracking-tight text-white leading-none">
                        {showBalance ? "1,134.66" : "•••••"}
                      </p>
                      <span className="text-[13px] font-medium text-blue-100 tracking-wide">USDC</span>
                    </div>

                    <div className="mt-2.5 flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                       <span className="text-[10.5px] text-blue-100 font-medium">Arc Testnet Active</span>
                    </div>
                  </div>

                  {/* Slim Virtual Card Art - Holographic Multi-Sig Card */}
                  <div className="w-24 h-16 bg-white/10 rounded-xl border border-white/30 shadow-lg relative overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500 backdrop-blur-md flex flex-col justify-between p-2">
                     <div className="flex justify-between items-start">
                        <div className="w-4 h-3 bg-yellow-400/90 rounded-sm shadow-sm"></div>
                        <span className="text-[6px] font-black tracking-widest text-white/90">MULTI-SIG</span>
                     </div>
                     <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/20"></div>
                     <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-blue-400/30 rounded-full blur-md"></div>
                     <div className="flex justify-between items-end relative z-10">
                        <span className="text-[7.5px] font-mono text-white tracking-widest">ARC...8A12</span>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeRekeningTab === 1 && (
              /* E-commerce Card */
              <motion.div 
                 key="tab-1"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.2 }}
                 className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-5 text-slate-800 shadow-sm relative overflow-hidden mb-3 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] border border-blue-100"
                 onClick={() => onNavigate('ecommerce')}
              >
                 <div className="flex justify-between items-center z-10 relative">
                    <div className="text-left">
                       <h3 className="font-bold text-[15px] text-slate-800">Arc Marketplace</h3>
                       <p className="text-[12px] text-slate-500 mt-1">Shop premium products with USDC</p>
                       <div className="flex items-center gap-2 mt-3">
                          <span className="text-[11px] font-bold text-[#005faa] bg-blue-100 px-2 py-0.5 rounded">E-commerce ready</span>
                       </div>
                    </div>
                    <ShoppingBag size={48} className="text-[#005faa] opacity-10 absolute -right-2 top-0" />
                    <ChevronRight size={20} className="text-[#3FA2F6]" />
                 </div>
              </motion.div>
            )}

            {activeRekeningTab === 2 && (
              /* Swap Card */
              <motion.div 
                 key="tab-2"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.2 }}
                 className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-5 text-slate-800 shadow-sm relative overflow-hidden mb-3 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] border border-orange-100"
                 onClick={() => onNavigate('swap')}
              >
                 <div className="flex justify-between items-center z-10 relative">
                    <div className="text-left">
                       <h3 className="font-bold text-[15px] text-slate-800">Swap USDC to ARC</h3>
                       <p className="text-[12px] text-slate-500 mt-1">Instant asset conversion & low fees</p>
                       <div className="flex items-center gap-2 mt-3">
                          <span className="text-[11px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">Best Rates</span>
                       </div>
                    </div>
                    <ArrowLeftRight size={48} className="text-orange-500 opacity-10 absolute -right-2 top-0" />
                    <ChevronRight size={20} className="text-orange-500" />
                 </div>
              </motion.div>
            )}

            {activeRekeningTab === 3 && (
               /* History Card */
               <motion.div 
                 key="tab-3"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.2 }}
                 className="bg-slate-50 rounded-2xl p-7 border border-slate-200 border-dashed mb-3"
               >
                  <div className="flex flex-col items-center justify-center text-center">
                     <CalendarClock size={28} className="text-slate-300 mb-3" />
                     <p className="text-[13px] font-bold text-slate-500">No transaction history yet</p>
                     <p className="text-[11px] text-slate-400 mt-1">Activity on Arc Testnet will appear here.</p>
                  </div>
               </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            onClick={() => onNavigate('otherAccounts')}
            className="w-full text-center text-[#3FA2F6] text-[12px] font-bold mt-1 py-1.5 hover:bg-blue-50 rounded-lg transition-colors flex justify-center items-center gap-1.5 opacity-90 border-0 bg-transparent"
          >
            Other Personal Savings & Checking <PlusCircleIcon size={14} />
          </button>
        </section>

          {/* Favorite Transactions Section */}
          <section className="bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] mb-3 lg:mb-0 mx-4 lg:mx-0 border border-slate-50/50">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Favorite Transactions</h2>
            <button 
              className="text-[#3FA2F6] text-[13px] font-semibold flex items-center gap-1.5 hover:bg-blue-50 px-2 py-1 rounded-full transition-colors border-0 bg-transparent"
              onClick={() => onNavigate('manageFavorites')}
            >
              Manage <Settings2 size={14} strokeWidth={1.5} />
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            {selectedShortcuts.map((item) => (
               <MenuIcon 
                 key={item.id}
                 icon={item.icon} 
                 label={item.label} 
                 color={item.color} 
                 bgCircle={item.bgCircle}
                 badge={item.badge}
                 badgeColor={item.badgeColor}
                 isTextIcon={item.isTextIcon}
                 textIcon={item.textIcon}
                 onClick={() => {
                   if (item.label === "Transfer USDC On-chain" || item.label === "Transfer USDC") onNavigate('transfer');
                   if (item.label === "Receive USDC") setShowDepositWithdrawModal(true);
                   if (item.label === "Swap Token") onNavigate('swap');
                   if (item.label === "Deposit/Withdraw") setShowDepositWithdrawModal(true);
                   if (item.label === "Top-up") onNavigate('topup');
                   if (item.label === "Pay/VA") onNavigate('bayarVA');
                 }}
               />
            ))}
          </div>

          <div className="mt-6 bg-blue-50/70 py-3 px-4 rounded-xl flex items-center justify-center gap-3 border border-blue-100 relative">
             {/* Tooltip triangle */}
             <div className="absolute -top-2 right-10 w-4 h-4 bg-blue-50/70 border-l border-t border-blue-100 rotate-45"></div>
             <ShieldCheck size={18} className="text-[#3FA2F6]" />
             <span className="text-[13px] font-semibold text-[#3FA2F6]">Protected by Circle Programmable Wallets</span>
          </div>
        </section>

        {/* Special For You (Promo Banner) */}
        <section className="bg-white rounded-[24px] overflow-hidden shadow-sm mb-4 lg:mb-0 mx-4 lg:mx-0 pb-4 border border-x-transparent border-t-transparent border-b-slate-50 relative z-10 lg:mt-8">
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight mb-0 text-left">Special For You</h2>
          </div>
          <div 
            ref={promoScrollRef}
            onScroll={handlePromoScroll}
            className="flex overflow-x-auto gap-4 px-5 scrollbar-hide snap-x snap-mandatory touch-pan-x"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="w-[85vw] max-w-[280px] h-[140px] bg-gradient-to-r from-blue-700 to-blue-800 rounded-2xl p-4 snap-center relative overflow-hidden text-white flex flex-col justify-center shadow-inner text-left shrink-0">
              <div className="absolute right-0 top-0 h-full w-1/2 bg-[url('https://images.unsplash.com/photo-1556740714-a82f3a479426?q=80&w=150&auto=format&fit=crop')] bg-cover mix-blend-overlay opacity-30"></div>
              <h3 className="font-bold text-[15px] leading-tight w-2/3 relative z-10">Opening a Checking Account is Easier...</h3>
              <button className="mt-3 bg-white text-[#005faa] text-xs font-bold px-3 py-1.5 rounded-lg w-max relative z-10 border-0">Open Now</button>
            </div>
            <div className="w-[85vw] max-w-[280px] h-[140px] bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 snap-center relative overflow-hidden text-white flex flex-col justify-center shadow-inner text-left shrink-0">
              <h3 className="font-bold text-[15px] leading-tight w-2/3 relative z-10">Disburse Loan Up To Rp 50 Million</h3>
              <button className="mt-3 bg-white text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-lg w-max relative z-10 border-0">Check Limit</button>
            </div>
            <div className="w-[85vw] max-w-[280px] h-[140px] bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl p-4 snap-center relative overflow-hidden text-white flex flex-col justify-center shadow-inner text-left shrink-0">
              <div className="absolute right-0 top-0 h-full w-1/2 bg-[url('https://images.unsplash.com/photo-1556740714-a82f3a479426?q=80&w=150&auto=format&fit=crop')] bg-cover mix-blend-overlay opacity-30"></div>
              <h3 className="font-bold text-[15px] leading-tight w-2/3 relative z-10">Limited Time: 5% USDC Cash Back</h3>
              <button className="mt-3 bg-white text-red-500 text-xs font-bold px-3 py-1.5 rounded-lg w-max relative z-10 border-0">Claim Now</button>
            </div>
            <div className="w-[85vw] max-w-[280px] h-[140px] bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-4 snap-center relative overflow-hidden text-white flex flex-col justify-center shadow-inner text-left shrink-0">
              <h3 className="font-bold text-[15px] leading-tight w-2/3 relative z-10">Access DApps Securely with Arc</h3>
              <button className="mt-3 bg-white text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-lg w-max relative z-10 border-0">Explore Layer-1</button>
            </div>
          </div>
          {/* Pagination dots */}
          <div className="flex justify-center gap-1.5 mt-4">
            {[0, 1, 2, 3].map((index) => (
              <div 
                key={index} 
                className={`h-1.5 rounded-full transition-all duration-300 ${currentPromoIndex === index ? 'w-5 bg-[#3FA2F6]' : 'w-1.5 bg-slate-200'}`}
              ></div>
            ))}
          </div>
        </section>
        </div>

        {/* Right Column for Desktop */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          {/* Connected Bridges */}
          <section className="bg-white rounded-[24px] p-5 shadow-sm mb-4 lg:mb-0 mx-4 lg:mx-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Connected Bridges</h2>
            <button onClick={() => onNavigate('connectEWallet')} className="text-[#3FA2F6] text-sm font-semibold hover:text-blue-600 transition-colors bg-transparent border-0">Connect <ChevronRight size={14} className="inline -mt-0.5" /></button>
          </div>
          <div className="flex justify-between gap-2 overflow-x-auto scrollbar-hide py-1">
            {['Coinbase', 'MetaMask', 'Circle UI', 'Phantom', 'WalletConnect'].map((wallet, i) => (
              <div key={wallet} className="flex flex-col items-center gap-2 min-w-[64px]">
                <div className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center shadow-sm bg-white">
                  <Wallet className={`size-6 ${
                    i === 0 ? 'text-[#0052FF]' :
                    i === 1 ? 'text-[#F6851B]' :
                    i === 2 ? 'text-[#2775ca]' :
                    i === 3 ? 'text-[#AB9FF2]' :
                    'text-[#3B99FC]'
                  }`} />
                </div>
                <span className="text-[11px] font-medium text-slate-600">{wallet}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Live Token Price Feed */}
        <section className="bg-white rounded-[24px] p-5 shadow-sm mx-4 lg:mx-0 mb-4 lg:mb-0">
          <div className="mb-4 text-left">
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Token Markets</h2>
            <p className="text-xs text-slate-400 mt-1">Live data feed from pyth.network</p>
          </div>
          
          <div className="flex items-center gap-2 mb-4 text-[#3FA2F6] font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
            <TrendingUp size={16} /> Volume
          </div>

          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {marketTokens.map(token => (
                <motion.div
                  key={token.code}
                  layout
                >
                  <StockRow 
                    code={token.code} 
                    name={token.name} 
                    price={formatPrice(token.price)} 
                    change={formatChange(token.change, token.isDown)} 
                    percent={`${token.percent > 0 ? '+' : ''}${token.percent.toFixed(2)}%`} 
                    isDown={token.isDown} 
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          <p className="text-[10px] text-slate-400 mt-5 leading-relaxed bg-slate-50 p-2 rounded-lg text-left">
            Data protected by Circle Programmable Wallets infra.
          </p>
        </section>

        {/* Developer Services */}
        <section className="bg-white rounded-[24px] p-5 shadow-sm mx-4 lg:mx-0 mb-8 lg:mb-0">
          <h2 className="text-[17px] font-bold text-slate-800 tracking-tight mb-4 text-left">Developer Services</h2>
          <div className="grid grid-cols-2 gap-3">
            <ProductCard title="Merchant SDK" desc="On-chain USDC integration." icon={<Box size={20} className="text-blue-500" />} />
            <ProductCard title="Testnet Faucet" desc="Claim ARC Gas Token." icon={<Coins size={20} className="text-blue-500" />} />
            <ProductCard title="Smart Contracts" desc="Deploy smart contract templates." icon={<Globe size={20} className="text-blue-500" />} />
            <ProductCard title="Staking Pool" desc="Stake & secure the network." icon={<ShieldCheck size={20} className="text-blue-500" />} />
          </div>
        </section>
        </div>

        </div>

      </div>

      {/* Aesthetic Bottom Navigation Wrapper with Cutout Notch */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none" style={{ filter: 'drop-shadow(0 -5px 15px rgba(0,0,0,0.06))' }}>
        
        {/* The Masked White Nav Bar */}
        <nav 
          className="relative bg-white h-[75px] md:h-[85px] px-6 lg:px-12 pb-2 flex items-center justify-between lg:justify-around pointer-events-auto rounded-t-2xl md:rounded-t-3xl"
          style={{ maskImage: 'radial-gradient(circle at 50% 0px, transparent 34px, black 35px)', WebkitMaskImage: 'radial-gradient(circle at 50% 0px, transparent 34px, black 35px)' }}
        >
          <NavItem icon={<Home size={22} />} label="Home" active />
          <NavItem 
             icon={<Mail size={22} />} 
             label="Messages" 
             onClick={() => onNavigate('inbox')} 
             badge={<span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-[1.5px] border-white"></span>} 
          />
          
          <div className="w-[50px] md:w-[60px] shrink-0"></div> {/* Spacer for the notch */}
          
          <NavItem 
             icon={<Settings size={22} />} 
             label="Settings" 
             onClick={() => onNavigate('settings')} 
          />
          <NavItem 
             icon={<LogOut size={22} />} 
             label="Logout" 
             onClick={() => setShowLogoutConfirm(true)} 
          />
        </nav>

        {/* Floating Action Button (QR/Pay) - overlapping the notch */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[-28px] pointer-events-auto">
          <div className="relative group cursor-pointer flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-[#3FA2F6] rounded-[22px] blur-md opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <div className="relative w-[56px] h-[56px] bg-[#3FA2F6] rounded-[22px] flex flex-col items-center justify-center text-white shadow-lg transform transition-all duration-300 group-hover:-translate-y-0.5 active:translate-y-0 border-2 border-white/20">
               <Scan size={26} strokeWidth={2.2} />
               <span className="text-[9px] font-bold mt-0.5 tracking-tight uppercase">Pay</span>
            </div>
          </div>
        </div>

      </div>

     {/* Deposit/Withdraw Initial Modal */}
     {showDepositWithdrawModal && (
       <div className="absolute inset-0 z-50 flex items-end animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setShowDepositWithdrawModal(false)}></div>
          <div 
            className="bg-white w-full rounded-t-[32px] z-10 relative flex flex-col pt-6 pb-[100px] px-6 animate-in slide-in-from-bottom duration-300"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => handleTouchEnd(() => setShowDepositWithdrawModal(false))}
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 absolute top-3 left-1/2 -translate-x-1/2 cursor-grab"></div>
            <h3 className="font-bold text-[16px] text-center text-slate-800 mb-6 mt-2">Select deposit method</h3>
            
            <div className="flex flex-col gap-1">
              <button 
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all text-left bg-transparent border-0"
                onClick={() => {
                  setShowDepositWithdrawModal(false);
                  setShowDepositOptions(true);
                }}
              >
                 <div className="w-8 h-8 rounded-full border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                   <ArrowDownToLine size={16} />
                 </div>
                 <div className="flex-1">
                   <h4 className="font-bold text-[14px] text-slate-800">Crypto Deposit</h4>
                   <p className="text-[12px] text-slate-500 mt-0.5">Transfer crypto from on-chain wallet or exchange.</p>
                 </div>
                 <ChevronRight size={18} className="text-slate-400" />
              </button>

              <button 
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all text-left bg-transparent border-0"
                onClick={() => {
                  setShowDepositWithdrawModal(false);
                }}
              >
                 <div className="w-8 h-8 rounded-full border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                   <ArrowUpRight size={16} />
                 </div>
                 <div className="flex-1">
                   <h4 className="font-bold text-[14px] text-slate-800">Withdraw</h4>
                   <p className="text-[12px] text-slate-500 mt-0.5">Transfer funds to your personal wallet.</p>
                 </div>
                 <ChevronRight size={18} className="text-slate-400" />
              </button>
            </div>
          </div>
       </div>
     )}

     {/* Deposit Options Modal */}
     {showDepositOptions && (
       <div className="absolute inset-0 z-50 flex items-end animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setShowDepositOptions(false)}></div>
          <div 
            className="bg-white w-full rounded-t-[32px] z-10 relative flex flex-col pt-6 pb-[90px] animate-in slide-in-from-bottom duration-300 h-[70%]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => handleTouchEnd(() => setShowDepositOptions(false))}
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2 absolute top-3 left-1/2 -translate-x-1/2 cursor-grab"></div>
            
            <div className="px-6 flex justify-center items-center mb-4 mt-2 relative w-full">
               <h3 className="font-bold text-[16px] text-slate-800">Search</h3>
               <button onClick={() => setShowDepositOptions(false)} className="absolute right-6 p-1 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200 bg-transparent border-0">
                 <X size={20} className="text-slate-500" strokeWidth={2.5} />
               </button>
            </div>

            <div className="px-6 mb-4">
              <div className="bg-slate-100/80 rounded-[12px] flex items-center px-4 py-2.5">
                 <Search size={18} className="text-slate-500 mr-2 shrink-0" />
                 <input type="text" placeholder="Search" className="bg-transparent border-none outline-none text-[14px] w-full text-slate-800" readOnly />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full pb-6 scrollbar-hide px-2">
              <div className="px-4 mb-2 text-left">
                 <span className="text-[13px] font-bold text-slate-800">Recent</span>
              </div>
              
              <div className="flex gap-2 px-4 mb-6">
                 <button 
                    className="bg-slate-50 border border-slate-200 rounded-[16px] py-1.5 px-3 flex items-center gap-1.5 active:bg-slate-100 transition-colors bg-transparent"
                    onClick={() => {
                       setShowDepositOptions(false);
                       setShowDepositResult(true);
                    }}
                 >
                    <div className="w-5 h-5 rounded-full bg-[#2775ca] flex items-center justify-center text-white text-[8px] font-bold">USDC</div>
                    <span className="text-[13px] font-bold text-slate-700">USDC</span>
                 </button>
              </div>
              
              <div className="px-4 mb-2 text-left">
                 <span className="text-[13px] font-bold text-slate-800">Popular</span>
              </div>

              <div className="flex flex-col">
                <button 
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-all text-left bg-transparent border-0 group"
                  onClick={() => {
                    setShowDepositOptions(false);
                    setShowDepositResult(true);
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-[#2775ca] flex items-center justify-center font-bold text-white text-[10px] shadow-sm shrink-0">
                    USDC
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[14px] text-slate-800">USDC</h4>
                    <p className="text-[12px] text-slate-500 mt-0.5">USD Coin</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
       </div>
     )}

     {/* Deposit QR Modal View */}
     {showDepositResult && (
       <DepositQRScreen onBack={() => setShowDepositResult(false)} />
     )}

     {/* Logout Confirmation Modal */}
     {showLogoutConfirm && (
       <div className="absolute inset-0 z-[100] flex items-end animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setShowLogoutConfirm(false)}></div>
          <div className="bg-white w-full rounded-t-[24px] z-10 relative flex flex-col pt-6 pb-8 px-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-4 mt-2 w-full">
               <h3 className="font-bold text-[20px] text-slate-800">Want to log out?</h3>
               <button onClick={() => setShowLogoutConfirm(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200 bg-transparent border-0">
                 <X size={22} className="text-slate-500" strokeWidth={2.5} />
               </button>
            </div>
            
            <p className="text-slate-600 text-[14px] leading-relaxed mb-8 text-left">
              Make sure all activities are finished. Thank you for using Arc Commerce today.
            </p>
            
            <button 
              className="w-full bg-[#008fcd] text-white font-bold text-[16px] py-3.5 rounded-full shadow-[0_4px_14px_rgba(0,143,205,0.3)] hover:bg-[#007dba] active:scale-[0.98] transition-all"
              onClick={() => {
                setShowLogoutConfirm(false);
                onNavigate('splash');
              }}
            >
              Log Out
            </button>
          </div>
       </div>
     )}

    </div>
  );
}
