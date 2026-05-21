import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState, ShortcutItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { MenuIcon } from '../common/MenuIcon';
import { StockRow } from '../common/StockRow';
import { ProductCard } from '../common/ProductCard';
import { NavItem } from '../common/NavItem';
import { DepositQRScreen } from './DepositQRScreen';
import {
  LogOut, Mail, Settings, ChevronRight, Eye, EyeOff, Settings2, Wallet, ShoppingBag, ArrowLeftRight, CalendarClock, PlusCircle as PlusCircleIcon, TrendingUp, X, Search, ArrowUpRight, ArrowDownToLine, Scan, Home, Box, Coins, Globe, ShieldCheck, Gamepad2, RefreshCw, Trophy, Sparkles, Zap, Flame, Lock, Bot
} from 'lucide-react';

export interface HomeScreenProps {
  userName: string;
  selectedShortcuts: ShortcutItem[];
  onNavigate: (view: ViewState) => void;
  isBiometricVerified?: boolean;
  onRequireVerification?: () => void;
}

export function HomeScreen({ userName, selectedShortcuts, onNavigate, isBiometricVerified = true, onRequireVerification }: HomeScreenProps) {
  const { showBalance, setShowBalance } = useApp();
  const [activeRekeningTab, setActiveRekeningTab] = useState(0);

  const toggleShowBalance = () => {
    setShowBalance(!showBalance);
  };
  const [showDepositWithdrawModal, setShowDepositWithdrawModal] = useState(false);
  const [showDepositOptions, setShowDepositOptions] = useState(false);
  const [showDepositResult, setShowDepositResult] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const promoScrollRef = useRef<HTMLDivElement>(null);

  // Dapps Simulation States
  const [selectedDapp, setSelectedDapp] = useState<'arcswap' | 'arcbird' | 'stablestake' | null>(null);
  
  // 1. ArcSwap DEX States
  const [swapFromAmount, setSwapFromAmount] = useState<string>('100');
  const [swapToToken, setSwapToToken] = useState<'ARC' | 'AETH' | 'AQR'>('ARC');
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [swapSuccess, setSwapSuccess] = useState<boolean>(false);
  const [swapRate, setSwapRate] = useState<number>(0.12); // 1 USDC = 8.33 ARC, etc.

  // 2. ArcBird States
  const [gameScore, setGameScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(localStorage.getItem('arcbird_highscore') ? parseInt(localStorage.getItem('arcbird_highscore')!) : 142);
  const [gameTimeLeft, setGameTimeLeft] = useState<number>(15);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; x: number; y: number; text: string }[]>([]);

  // 3. StableStake States
  const [stakedAmount, setStakedAmount] = useState<number>(0);
  const [stakeAmountInput, setStakeAmountInput] = useState<string>('50');
  const [accruedRewards, setAccruedRewards] = useState<number>(0);
  const [isStaking, setIsStaking] = useState<boolean>(false);

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

  // 2. ArcBird Game Ticker
  useEffect(() => {
    let interval: any;
    if (isGameActive && gameTimeLeft > 0) {
      interval = setInterval(() => {
        setGameTimeLeft(prev => {
          if (prev <= 1) {
            setIsGameActive(false);
            if (gameScore > highScore) {
              setHighScore(gameScore);
              localStorage.setItem('arcbird_highscore', gameScore.toString());
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGameActive, gameTimeLeft, gameScore, highScore]);

  // 3. StableStake Live Reward Yield Accrual
  useEffect(() => {
    let interval: any;
    if (stakedAmount > 0) {
      interval = setInterval(() => {
        setAccruedRewards(prev => prev + (stakedAmount * 0.000008));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [stakedAmount]);

  // ==========================================
  // TRANSACTION FLOW SIMULATOR STATES & TICKERS
  // ==========================================
  const [simStep, setSimStep] = useState<number>(0); // 0: Idle, 1 to 6
  const [simAmount, setSimAmount] = useState<string>('25');
  const [simProduct, setSimProduct] = useState<string>('Kredit Komputasi Cloud');
  const [simStatus, setSimStatus] = useState<'idle' | 'running' | 'success' | 'paused'>('idle');
  const [simLogs, setSimLogs] = useState<string[]>([]);

  const runNextSimStep = (currentStep: number) => {
    const nextStep = currentStep + 1;
    if (nextStep > 6) {
      setSimStatus('success');
      return;
    }
    setSimStep(nextStep);
    
    // Simulasikan pesan log sesuai step dengan menekankan panduan keamanan server-side yang ketat
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    let logMsg = '';
    switch (nextStep) {
      case 1:
        logMsg = `[${timestamp}] [CLIENT-SIDE] Memulai pesanan baru untuk "${simProduct}" senilai ${simAmount} USDC. Tidak ada secret key yang diakses oleh dApp client!`;
        break;
      case 2:
        logMsg = `[${timestamp}] [SERVER-SIDE] Panggil APIs backend '/api/order'. Intelektualitas Circle SDK (@circle-fin/developer-controlled-wallets) dieksekusi seutuhnya di server-side agar CIRCLE_ENTITY_SECRET tetap aman.`;
        break;
      case 3:
        logMsg = `[${timestamp}] [ON-CHAIN] Transaksi senilai ${simAmount} USDC disiarkan langsung ke Arc Testnet L1 Ledger. Token gas menggunakan native USDC (No separate gas coin needed!).`;
        break;
      case 4:
        logMsg = `[${timestamp}] [WEBHOOK] Settlement sukses. Platform Web3 Circle meneruskan payload HTTP POST ke Ngrok public agent: 'https://xxx.ngrok.app/api/circle/webhook'.`;
        break;
      case 5:
        logMsg = `[${timestamp}] [SERVER-SIDE] Node.js memvalidasi Webhook Signature Header secara kriptografis menggunakan public keys Circle. Hasil verifikasi signature: AUTHENTIC / VALID.`;
        break;
      case 6:
        logMsg = `[${timestamp}] [DATABASE] Transaksi divalidasi. Menggunakan SUPABASE_SECRET_KEY di Backend untuk mengupdate kuota kredit database Supabase bagi user secara asinkron. Transaksi sukses! 🎉`;
        break;
    }
    setSimLogs(prev => [...prev, logMsg]);
  };

  useEffect(() => {
    let timeout: any;
    if (simStatus === 'running' && simStep > 0 && simStep < 6) {
      timeout = setTimeout(() => {
        runNextSimStep(simStep);
      }, 2000);
    } else if (simStatus === 'running' && simStep === 6) {
      timeout = setTimeout(() => {
        setSimStatus('success');
      }, 1200);
    }
    return () => clearTimeout(timeout);
  }, [simStatus, simStep]);

  const [showTieredAccessAlert, setShowTieredAccessAlert] = useState(false);

  const startSimulation = () => {
    if (Number(simAmount) > 100 && !isBiometricVerified) {
       setShowTieredAccessAlert(true);
       return;
    }
    
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    setSimStep(1);
    setSimStatus('running');
    setSimLogs([
      `[${timestamp}] [SYSTEM] Menyiapkan alur transaksi e-commerce native-stablecoin di Arc Testnet...`,
      `[${timestamp}] [CLIENT-SIDE] Memulai pesanan baru untuk "${simProduct}" senilai ${simAmount} USDC. Tidak ada secret key yang diakses oleh dApp client!`
    ]);
  };

  const resetSimulation = () => {
    setSimStep(0);
    setSimStatus('idle');
    setSimLogs([]);
  };

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
              {userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2) : "UN"}
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
              <button onClick={toggleShowBalance} className="flex items-center gap-1 hover:text-blue-600 transition-colors bg-transparent border-0">
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
               /* Interactive L1 Transaction Flow Simulator */
               <motion.div 
                 key="tab-3"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.3 }}
                 className="bg-white rounded-[24px] p-5 border border-slate-200/60 shadow-sm mb-3 text-left font-sans flex flex-col gap-4 mx-4 lg:mx-0"
               >
                 {/* Header */}
                 <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                   <div>
                     <h3 className="font-bold text-[16px] text-slate-800 flex items-center gap-1.5 leading-snug">
                       <Zap size={18} className="text-[#3FA2F6] animate-pulse" />
                       Simulasi Alur Transaksi Arc Commerce
                     </h3>
                     <p className="text-[11.5px] text-slate-500 mt-1">
                       Interactive visualizer of the native-stablecoin Circle Web3 architecture on Arc Testnet L1.
                     </p>
                   </div>
                 </div>

                 {/* Config Form - Only active if simulation is Idle */}
                 {simStep === 0 ? (
                   <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 flex flex-col gap-3">
                     <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Konfigurasi Pembelian</span>
                     <div className="grid grid-cols-2 gap-3.5">
                       <div className="flex flex-col gap-1 text-left">
                         <label className="text-[11px] font-semibold text-slate-500 font-sans">Pilih Produk</label>
                         <select 
                           value={simProduct} 
                           onChange={(e) => setSimProduct(e.target.value)}
                           className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700 outline-none focus:border-[#3FA2F6] cursor-pointer"
                         >
                           <option value="Kredit Server L1">Kredit Server L1</option>
                           <option value="Abonemen Premium">Abonemen Premium</option>
                           <option value="Game Item - ArcBird Keys">Game Item - ArcBird Keys</option>
                           <option value="Hardware Node Miner">Hardware Node Miner</option>
                         </select>
                       </div>
                       <div className="flex flex-col gap-1 text-left">
                         <label className="text-[11px] font-semibold text-slate-500 font-sans">Harga (USDC)</label>
                         <input 
                           type="number" 
                           value={simAmount} 
                           onChange={(e) => setSimAmount(e.target.value)}
                           className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12.5px] font-mono font-semibold text-slate-700 outline-none focus:border-[#3FA2F6]"
                           placeholder="25"
                           min="1"
                         />
                       </div>
                     </div>

                     {/* Security Advisory Badges */}
                     <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 flex gap-2.5 items-start">
                       <Lock size={15} className="text-amber-600 mt-0.5 shrink-0" />
                       <div className="flex flex-col gap-0.5 text-left font-sans">
                         <p className="text-[11px] font-bold text-amber-800">Prinsip Keamanan Server-Side (Critical!)</p>
                         <p className="text-[10px] text-amber-700 leading-normal">
                           Dalam arsitektur <strong className="text-amber-900">Circle Web3</strong>, pemanggilan API, kunci privat <code className="bg-amber-100 px-1 py-0.2 rounded text-red-600 font-mono">SUPABASE_SECRET_KEY</code>, dan <code className="bg-amber-100 px-1 py-0.2 rounded text-red-600 font-mono">CIRCLE_ENTITY_SECRET</code> <strong>WAJIB</strong> dijalankan seutuhnya di Server-Side (API Routes / Server Actions) dan dilarang terekspos di browser client.
                         </p>
                       </div>
                     </div>

                     <button 
                       onClick={startSimulation}
                       className="w-full bg-[#3FA2F6] hover:bg-[#328fdc] text-white font-bold py-2.5 rounded-xl text-[13.5px] transition-all flex items-center justify-center gap-2 border-0 shadow-sm cursor-pointer"
                     >
                       <Zap size={14} /> Mulai Simulasi Transaksi L1
                     </button>
                   </div>
                 ) : (
                   <div className="flex flex-col gap-4">
                     {/* Interactive Map Nodes */}
                     <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/60 flex flex-col gap-3">
                       <div className="flex justify-between items-center">
                         <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">Step-by-Step Flow Map</span>
                         <span className="text-[11px] font-bold text-slate-400 font-mono">Step {simStep} dari 6</span>
                       </div>

                       {/* Linear Steps Container */}
                       <div className="flex flex-col gap-3.5 relative">
                         {/* Connector background line */}
                         <div className="absolute left-4 top-4 bottom-4 w-[2px] bg-slate-200 z-0"></div>
                         
                         {/* Dynamic colored connector line based on current step */}
                         <div 
                           className="absolute left-4 top-4 w-[2px] bg-blue-500 z-0 transition-all duration-300"
                           style={{ height: `${((simStep - 1) / 5) * 88}%`, maxHeight: '100%' }}
                         ></div>

                         {/* Step Nodes */}
                         {[
                           { step: 1, label: 'User Orders Checkout', source: 'Client App', desc: `Inisiasi pesanan senilai ${simAmount} USDC`, icon: <ShoppingBag size={14} /> },
                           { step: 2, label: 'Call Circle APIs', source: 'Secure Routing', desc: '@circle-fin/developer-controlled-wallets init', icon: <Lock size={14} /> },
                           { step: 3, label: 'Arc USDC L1 Payment', source: 'Network L1', desc: `Token gas native berbasis USDC`, icon: <Coins size={14} /> },
                           { step: 4, label: 'Circle Webhook Callback', source: 'API Portal', desc: 'Settle notification dikirim asinkron via Ngrok', icon: <Globe size={14} /> },
                           { step: 5, label: 'Signature Verification', source: 'Backend Server', desc: 'Memvalidasi Circle-Signature header kriptografis', icon: <ShieldCheck size={14} /> },
                           { step: 6, label: 'Supabase Data Sync', source: 'Database Sync', desc: 'Sinkronisasi pulsa/kredit user di database', icon: <Box size={14} /> }
                         ].map((node) => {
                           const isCompleted = simStep > node.step || simStatus === 'success';
                           const isActive = simStep === node.step && simStatus === 'running';
                           const isFuture = simStep < node.step;

                           return (
                             <div key={node.step} className="flex gap-4 items-start relative z-10 text-left">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                                 isCompleted 
                                   ? 'bg-emerald-500 border-emerald-500 text-white' 
                                   : isActive 
                                   ? 'bg-blue-100 border-[#3FA2F6] text-[#3FA2F6] animate-pulse ring-4 ring-blue-50' 
                                   : 'bg-white border-slate-200 text-slate-400'
                               }`}>
                                 {isCompleted ? <span className="font-bold text-[12px]">✓</span> : node.icon}
                               </div>
                               <div className="flex-1">
                                 <div className="flex items-center gap-2 flex-wrap">
                                   <p className={`text-[12.5px] font-bold ${isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-700' : 'text-slate-700'} font-sans`}>
                                     {node.label}
                                   </p>
                                   <span className="text-[9px] font-semibold text-slate-400 tracking-wider uppercase px-1.5 py-0.2 bg-slate-100 rounded leading-none">
                                     {node.source}
                                   </span>
                                 </div>
                                 <p className="text-[11px] text-slate-500 font-sans mt-0.5 leading-snug">{node.desc}</p>
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     </div>

                     {/* Simulated Terminal Live Console */}
                     <div className="bg-slate-900 rounded-xl p-3.5 font-mono text-[10.5px] text-slate-300 text-left h-[140px] overflow-y-auto flex flex-col gap-1 shadow-inner relative border border-slate-800">
                       <div className="absolute right-3 top-2.5 text-[8.5px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950 px-1.5 py-0.5 rounded leading-none select-none">
                         Dev Server Console
                       </div>
                       
                       {simLogs.map((log, i) => {
                         let colorClass = 'text-slate-300';
                         if (log.includes('[CLIENT-SIDE]')) colorClass = 'text-sky-300';
                         if (log.includes('[SERVER-SIDE]')) colorClass = 'text-amber-300 font-medium';
                         if (log.includes('[ON-CHAIN]')) colorClass = 'text-yellow-250';
                         if (log.includes('[WEBHOOK]')) colorClass = 'text-indigo-300';
                         if (log.includes('[DATABASE]')) colorClass = 'text-emerald-300';
                         if (log.includes('[SYSTEM]')) colorClass = 'text-slate-400 italic';

                         return (
                           <div key={i} className={`leading-normal break-words ${colorClass}`}>
                             {log}
                           </div>
                         );
                       })}
                       
                       {simStatus === 'running' && (
                         <div className="text-[#3FA2F6] flex items-center gap-1.5 animate-pulse mt-1 select-none font-sans text-[11px]">
                           <span className="w-1.5 h-1.5 bg-[#3FA2F6] rounded-full animate-ping"></span>
                           Memproses transaksional... server bekerja asinkron
                         </div>
                       )}
                     </div>

                     {/* Simulation Controls */}
                     <div className="flex flex-col gap-2.5">
                       {simStatus === 'success' ? (
                         <div className="w-full flex flex-col gap-2.5 mt-1">
                           <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
                             <span className="text-emerald-800 font-bold text-[13px] flex items-center gap-1.5 leading-snug font-sans">
                               <ShieldCheck size={16} className="text-emerald-600" />
                               Simulasi Pembayaran Berhasil!
                             </span>
                             <p className="text-[10px] text-slate-500 leading-normal font-sans mt-1">
                               Alur asinkron Circle Webhook dialihkan via Ngrok ke Supabase DB berhasil mensinkronisasi data kredit pengguna dengan signature valid. 
                             </p>
                           </div>
                           <button 
                             onClick={resetSimulation}
                             className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-[13px] transition-colors border-0 cursor-pointer font-sans"
                           >
                             Ulangi Simulasi Baru
                           </button>
                         </div>
                       ) : (
                         <div className="flex gap-2 w-full font-sans">
                           <button 
                             onClick={() => {
                               if (simStatus === 'running') {
                                 setSimStatus('paused');
                               } else {
                                 setSimStatus('running');
                               }
                             }}
                             className={`flex-1 ${simStatus === 'running' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#3FA2F6] hover:bg-[#328fdc]'} text-white font-bold py-2 px-3 rounded-lg text-[13px] border-0 cursor-pointer transition-colors`}
                           >
                             {simStatus === 'running' ? 'Pause Auto-Play' : 'Mulai Auto-Play'}
                           </button>

                           <button 
                             onClick={() => runNextSimStep(simStep)}
                             disabled={simStatus === 'running' || simStep >= 6}
                             className="bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 font-bold py-2 px-4 rounded-lg text-[13px] border-0 cursor-pointer transition-all"
                           >
                             Langkah Manual →
                           </button>

                           <button 
                             onClick={resetSimulation}
                             className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-3 rounded-lg text-[13px] border-0 cursor-pointer transition-all"
                           >
                             Reset
                           </button>
                         </div>
                       )}
                     </div>
                   </div>
                 )}
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
                   if (item.label === "Request Payment") setShowDepositResult(true);
                   if (item.label === "Pay with USDC") onNavigate('scanQR');
                   if (item.label === "Swap Token") onNavigate('swap');
                   if (item.label === "Deposit/Withdraw") setShowDepositWithdrawModal(true);
                   if (item.label === "Top-up") onNavigate('topup');
                   if (item.label === "Pay/VA") onNavigate('bayarVA');
                   if (item.label === "DApp Browser") onNavigate('ecommerce');
                 }}
               />
            ))}
          </div>

          <div 
            className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 py-3 px-4 rounded-xl flex items-center justify-between gap-3 border border-indigo-100 relative cursor-pointer hover:bg-indigo-100/50 transition-colors"
            onClick={() => onNavigate('aiAgent')}
          >
             {/* Tooltip triangle */}
             <div className="absolute -top-2 right-10 w-4 h-4 bg-indigo-50 border-l border-t border-indigo-100 rotate-45"></div>
             <div className="flex items-center gap-3">
               <div className="bg-white p-2 rounded-lg text-[#3FA2F6] shrink-0 border border-indigo-50 shadow-sm">
                 <Bot size={18} />
               </div>
               <div className="flex flex-col text-left">
                 <span className="text-[13px] font-bold text-slate-800">Tanya AI Assistant</span>
                 <span className="text-[11.5px] text-slate-500">Bantu kamu kelola wallet</span>
               </div>
             </div>
             <div className="bg-white rounded-full p-1 shadow-sm text-[#3FA2F6] shrink-0 border border-indigo-50">
               <ChevronRight size={14} />
             </div>
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
          {/* Dapps */}
          <section className="bg-white rounded-[24px] p-5 shadow-sm mb-4 lg:mb-0 mx-4 lg:mx-0 text-left">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[17px] font-bold text-slate-800 tracking-tight font-sans">Ecosystem Dapps</h2>
              <span className="text-[11px] font-bold text-[#3FA2F6] bg-blue-50 px-2.5 py-1 rounded-full font-sans">Arc Layer-1</span>
            </div>
            
            <div className="flex flex-col gap-3">
              {/* ArcSwap */}
              <div 
                onClick={() => {
                  setSelectedDapp('arcswap');
                  setSwapSuccess(false);
                }}
                className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all active:scale-[0.98]"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <RefreshCw size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-[14px] text-slate-800 font-sans">ArcSwap DEX</h4>
                    <span className="text-[9px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded font-sans">DEX</span>
                  </div>
                  <p className="text-[11.5px] text-slate-400 truncate mt-0.5 font-sans">Swap USDC with Arc Native Tokens</p>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </div>

              {/* ArcBird Mini-Game */}
              <div 
                onClick={() => {
                  setSelectedDapp('arcbird');
                  setGameScore(0);
                  setGameTimeLeft(15);
                  setIsGameActive(false);
                }}
                className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all active:scale-[0.98]"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Gamepad2 size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-[14px] text-slate-800 font-sans">ArcBird Arcade</h4>
                    <span className="text-[9px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-sans">Gaming</span>
                  </div>
                  <p className="text-[11.5px] text-slate-400 truncate mt-0.5 font-sans">Tap to Jump & earn ARC coins</p>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </div>

              {/* StableStake Vault */}
              <div 
                onClick={() => {
                  setSelectedDapp('stablestake');
                }}
                className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all active:scale-[0.98]"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <ShieldCheck size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-[14px] text-slate-800 font-sans">StableStake Vault</h4>
                    <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-sans">Yield & DeFi</span>
                  </div>
                  <p className="text-[11.5px] text-slate-400 truncate mt-0.5 font-sans">Stake stablecoins & earn USDC yield</p>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
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
          <div className="relative group cursor-pointer flex flex-col items-center justify-center" onClick={() => onNavigate('scanQR')}>
            <div className="absolute inset-0 bg-[#3FA2F6] rounded-[22px] blur-md opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <div className="relative w-[56px] h-[56px] bg-[#3FA2F6] rounded-[22px] flex flex-col items-center justify-center text-white shadow-lg transform transition-all duration-300 group-hover:-translate-y-1 active:translate-y-0 border-2 border-white/20 hover:bg-[#328fdc]">
               <Scan size={26} strokeWidth={2.2} />
               <span className="text-[9px] font-bold mt-0.5 tracking-tight uppercase">Pay</span>
            </div>
          </div>
        </div>

      </div>

     {/* Deposit/Withdraw Initial Modal */}
     {/* Step-Up Authentication (Tiered Access) Modal */}
     {showTieredAccessAlert && (
        <div className="absolute inset-0 z-[160] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowTieredAccessAlert(false)}></div>
           <div className="bg-white rounded-3xl p-6 w-full relative z-10 animate-in zoom-in-95 duration-300 shadow-2xl flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck size={32} className="text-red-500" />
             </div>
             <h3 className="font-bold text-[18px] text-slate-800 leading-tight">Step-Up Authentication Required</h3>
             <p className="text-[13px] text-slate-500 mt-2 mb-6 font-sans">
               Untuk transaksi bernilai tinggi di atas 100 USDC atau cash-out, verifikasi biometrik tambahan diperlukan (Tiered Access).
             </p>
             <div className="flex flex-col gap-2 w-full">
               <button 
                 onClick={() => {
                   setShowTieredAccessAlert(false);
                   if (onRequireVerification) {
                     onRequireVerification();
                   }
                 }}
                 className="w-full bg-[#005faa] text-white font-bold py-3.5 rounded-full text-[14px] hover:bg-[#004780] transition-colors"
               >
                 Verifikasi Sekarang
               </button>
               <button 
                 onClick={() => setShowTieredAccessAlert(false)}
                 className="w-full bg-slate-100 text-slate-600 font-bold py-3.5 rounded-full text-[14px] hover:bg-slate-200 transition-colors"
               >
                 Batalkan Transaksi
               </button>
             </div>
           </div>
        </div>
     )}

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

      {/* Dynamic Dapps bottom sheet drawer simulation */}
      {selectedDapp && (
        <div className="absolute inset-0 z-[120] flex items-end animate-in fade-in duration-200">
           <div className="absolute inset-0 bg-slate-900/60" onClick={() => setSelectedDapp(null)}></div>
           <div className="bg-white w-full rounded-t-[32px] z-10 relative flex flex-col pt-5 pb-8 animate-in slide-in-from-bottom duration-300 max-h-[90%] overflow-hidden h-[82%]">
             <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2 absolute top-3 left-1/2 -translate-x-1/2 cursor-grab"></div>
             
             {/* Header */}
             <div className="px-6 flex justify-between items-center mb-4 mt-2 w-full border-b border-slate-150 pb-3">
               <div className="flex items-center gap-2 text-left">
                  {selectedDapp === 'arcswap' && (
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shrink-0">
                      <RefreshCw size={18} />
                    </div>
                  )}
                  {selectedDapp === 'arcbird' && (
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shrink-0">
                      <Gamepad2 size={18} />
                    </div>
                  )}
                  {selectedDapp === 'stablestake' && (
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shrink-0">
                      <ShieldCheck size={18} />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-[16px] text-slate-800 leading-tight font-sans">
                      {selectedDapp === 'arcswap' && 'ArcSwap DEX'}
                      {selectedDapp === 'arcbird' && 'ArcBird Run (Mini-Game)'}
                      {selectedDapp === 'stablestake' && 'StableStake Vault'}
                    </h3>
                    <p className="text-[10px] text-[#3FA2F6] font-bold font-sans">Arc Network L1 Simulation</p>
                  </div>
               </div>
               <button onClick={() => setSelectedDapp(null)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200 bg-transparent border-0">
                 <X size={20} className="text-slate-500 font-sans" strokeWidth={2.5} />
               </button>
             </div>

             {/* Content body based on selection */}
             <div className="flex-1 overflow-y-auto px-6 pb-6">
                {selectedDapp === 'arcswap' && (
                   <div className="flex flex-col gap-4 text-left font-sans">
                     <p className="text-[13px] text-slate-500">Interactive swap simulator for USDC on Arc Layer-1 network. Dynamic gas token optimization included.</p>
                     
                     {/* Swap Container Box */}
                     <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 relative">
                       {/* Pay Token USDC */}
                       <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                         <div className="flex flex-col gap-1 w-2/3">
                           <span className="text-[10px] uppercase font-bold text-slate-400">You Pay</span>
                           <input 
                             type="number" 
                             value={swapFromAmount}
                             onChange={e => {
                               setSwapFromAmount(e.target.value);
                               setSwapSuccess(false);
                             }}
                             className="text-[20px] font-bold text-slate-800 outline-none w-full border-none p-0 focus:ring-0 font-mono"
                             placeholder="0.00"
                           />
                         </div>
                         <div className="bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 border border-slate-200">
                           <div className="w-5 h-5 rounded-full bg-[#2775ca] flex items-center justify-center text-white text-[9px] font-bold">USDC</div>
                           <span className="text-[13px] font-bold text-slate-700">USDC</span>
                         </div>
                       </div>

                       {/* Arrow Swap Button indicator */}
                       <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 bg-white border border-slate-150 rounded-full p-2 shadow-sm z-10 flex items-center justify-center">
                          <ArrowLeftRight size={16} className="text-[#3FA2F6] rotate-90" />
                       </div>

                       {/* Receive Token choice */}
                       <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                         <div className="flex flex-col gap-1 w-2/3">
                           <span className="text-[10px] uppercase font-bold text-slate-400">You Receive (Estimate)</span>
                           <span className="text-[20px] font-bold text-slate-800 font-mono">
                             {swapFromAmount ? (Number(swapFromAmount) / swapRate).toFixed(2) : '0.00'}
                           </span>
                         </div>
                         <div className="flex flex-col gap-1 shrink-0">
                           <select 
                             value={swapToToken}
                             onChange={e => {
                               setSwapToToken(e.target.value as any);
                               setSwapSuccess(false);
                               if (e.target.value === 'ARC') setSwapRate(0.12);
                               else if (e.target.value === 'AETH') setSwapRate(3120);
                               else setSwapRate(1.25);
                             }}
                             className="bg-slate-100 px-2 py-1.5 rounded-lg text-[13px] font-bold text-slate-700 outline-none border border-slate-200 cursor-pointer"
                           >
                             <option value="ARC">ARC Coin</option>
                             <option value="AETH">Wrapped ETH</option>
                             <option value="AQR">Arc-QR Receipt</option>
                           </select>
                         </div>
                       </div>
                     </div>

                     {/* Price Rate info */}
                     <div className="flex justify-between items-center text-[12px] text-slate-500 px-1 font-semibold">
                       <span>Exchange Rate</span>
                       <span className="font-mono font-medium">1 {swapToToken} = {swapRate} USDC</span>
                     </div>

                     {/* Gas Fee Indicator with Arc unique USDC-as-Gas feature */}
                     <div className="bg-indigo-50/50 border border-indigo-100/30 rounded-xl p-3 flex flex-col gap-1 text-[12px]">
                       <div className="flex justify-between text-indigo-950">
                         <span className="font-bold">Gas Mode:</span>
                         <span className="font-bold text-[#008fcd]">Native USDC Gas (No separate ETH needed!)</span>
                       </div>
                       <div className="flex justify-between text-slate-500 mt-1">
                         <span>Estimated Network Fee:</span>
                         <span className="font-mono">0.02 USDC</span>
                       </div>
                     </div>

                     {/* Swap Action Trigger with success confirmation */}
                     {!swapSuccess ? (
                       <button 
                         onClick={() => {
                           setIsSwapping(true);
                           setTimeout(() => {
                             setIsSwapping(false);
                             setSwapSuccess(true);
                           }, 1800);
                         }}
                         disabled={isSwapping || !swapFromAmount || Number(swapFromAmount) <= 0}
                         className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-white font-bold text-[15px] py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm border-0 cursor-pointer font-bold"
                       >
                         {isSwapping ? (
                           <>
                             <RefreshCw className="animate-spin" size={18} />
                             Swapping on Arc Testnet Ledger...
                           </>
                         ) : (
                           `Swap USDC to ${swapToToken}`
                         )}
                       </button>
                     ) : (
                       <div className="flex flex-col gap-3 font-sans">
                         <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
                           <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white mb-2 font-bold font-sans flex items-center justify-center font-bold">
                             ✓
                           </div>
                           <h4 className="font-bold text-emerald-800 text-[15px]">Swap Successful!</h4>
                           <p className="text-[12px] text-emerald-600 mt-1">
                             Swapped {swapFromAmount} USDC for {(Number(swapFromAmount) / swapRate).toFixed(4)} {swapToToken} on Arc Network L1.
                           </p>
                           <div className="mt-2 text-[10px] text-slate-400 font-mono select-all">
                             TXID: 0xarc542f...{Math.floor(Math.random() * 90000) + 10000}
                           </div>
                         </div>
                         <button 
                           onClick={() => setSwapSuccess(false)}
                           className="w-full bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-[13px] border-0 cursor-pointer"
                         >
                           Lock New Swap
                         </button>
                       </div>
                     )}
                   </div>
                )}

                {selectedDapp === 'arcbird' && (
                  <div className="flex flex-col gap-4 text-center items-center font-sans">
                    <p className="text-[13px] text-slate-500 text-left w-full">
                      Play **ArcBird Run**! Tap the JUMP button to flap and earn native ARC rewards instantly. Match the rhythm and raise your scores!
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-2.5">
                        <span className="text-[10px] uppercase font-bold text-purple-400 block mb-0.5 font-bold">Your Highscore</span>
                        <div className="flex items-center justify-center gap-1">
                          <Trophy className="text-amber-500" size={14} />
                          <span className="text-[16px] font-black text-purple-900 font-mono">{highScore} ARC</span>
                        </div>
                      </div>
                      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-2.5 font-sans">
                        <span className="text-[10px] uppercase font-bold text-amber-500 block mb-0.5">Time Left</span>
                        <span className="text-[16px] font-black text-amber-700 font-mono">{gameTimeLeft}s</span>
                      </div>
                    </div>

                    {/* Arcade Cabinet style Board Screen */}
                    <div className="w-full h-[180px] bg-indigo-950 rounded-2xl border-4 border-indigo-900 relative overflow-hidden shadow-inner flex flex-col justify-between p-3 select-none">
                       {/* Stars and clouds simulation pattern in CSS */}
                       <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 to-purple-900 opacity-90"></div>
                       <div className="absolute w-2 h-2 rounded-full bg-white top-4 left-6 animate-pulse"></div>
                       <div className="absolute w-1.5 h-1.5 rounded-full bg-white top-12 right-20 animate-pulse delay-500"></div>
                       <div className="absolute w-2.5 h-2.5 rounded-full bg-white top-8 right-10 opacity-40"></div>
                       
                       {/* High ground grid lines */}
                       <div className="absolute bottom-0 inset-x-0 h-1/4 bg-blue-900/30 border-t border-blue-500/20 grid grid-cols-6 mb-0">
                         {[1,2,3,4,5,6].map(i => <div key={i} className="border-r border-blue-500/10 h-full"></div>)}
                       </div>

                       {/* Interactive floating objects / flying animations */}
                       <div className="relative z-10 flex justify-between items-center w-full">
                         <span className="text-[10px] font-mono text-purple-300 uppercase tracking-widest bg-indigo-900/80 px-2 py-0.5 rounded border border-purple-500/30">
                           Arc Arcade System
                         </span>
                         <div className="flex items-center gap-1.5">
                           <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                           <span className="text-[12px] font-bold text-white font-mono">{gameScore} pts</span>
                         </div>
                       </div>

                       {/* Jumping Bird Mascot */}
                       <div className="relative z-10 flex justify-center items-center h-28">
                         <motion.div 
                           animate={isGameActive ? {
                             y: [0, -32, 0],
                             rotate: [0, -10, 15, 0],
                           } : { y: 0 }}
                           transition={{ duration: 0.5, repeat: isGameActive ? Infinity : 0, repeatDelay: 0.4 }}
                           className="text-[42px]"
                         >
                           🐤
                         </motion.div>

                         {/* Speed streaks in game */}
                         {isGameActive && (
                           <div className="absolute right-0 flex flex-col gap-2 w-full pr-[140px] items-end pointer-events-none">
                             <div className="w-12 h-1 bg-gradient-to-l from-white/30 to-transparent rounded-full animate-pulse"></div>
                             <div className="w-8 h-1 bg-gradient-to-l from-white/20 to-transparent rounded-full animate-pulse delay-300"></div>
                           </div>
                         )}

                         {/* Floating score text */}
                         <AnimatePresence>
                           {floatingTexts.map(f => (
                             <motion.span
                               key={f.id}
                               initial={{ opacity: 1, y: 10, scale: 0.8 }}
                               animate={{ opacity: 0, y: -45, scale: 1.2 }}
                               exit={{ opacity: 0 }}
                               className="absolute text-yellow-300 font-extrabold text-[15px] drop-shadow-md z-20 pointer-events-none font-sans"
                               style={{ left: f.x + 120, top: f.y + 40 }}
                             >
                               {f.text}
                             </motion.span>
                           ))}
                         </AnimatePresence>
                       </div>

                       {/* Status overlay */}
                       {!isGameActive && (
                         <div className="absolute inset-0 bg-slate-950/70 z-20 flex flex-col items-center justify-center gap-2 font-sans animate-in zoom-in-95 duration-200">
                           <Gamepad2 size={24} className="text-purple-400 animate-bounce" />
                           <p className="text-[13px] font-bold text-white uppercase tracking-wider">Ready to Play?</p>
                           <p className="text-[10px] text-slate-300 px-8">Quickly tap the JUMP target down to score native tokens.</p>
                         </div>
                       )}
                    </div>

                    {/* Game Controls */}
                    {isGameActive ? (
                      <button 
                        onClick={(e) => {
                          const rx = Math.random() * 80 - 40;
                          const ry = Math.random() * 20 - 40;
                          
                          setGameScore(s => s + 5);
                          setFloatingTexts(prev => [
                            ...prev, 
                            { id: Date.now(), x: rx, y: ry, text: '+5 ARC!' }
                          ]);
                          
                          // Prune older ones
                          setTimeout(() => {
                            setFloatingTexts(prev => prev.slice(1));
                          }, 900);
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white py-3.5 rounded-2xl font-black text-[16px] tracking-wider active:scale-95 transition-all shadow-lg shadow-purple-500/20 uppercase cursor-pointer border-0 font-bold"
                      >
                        ⚡ FLAP BIRD ⚡
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setGameScore(0);
                          setGameTimeLeft(15);
                          setIsGameActive(true);
                        }}
                        className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-xl text-[14px] transition-all flex items-center justify-center gap-2 border-0 cursor-pointer font-bold"
                      >
                        <Zap size={16} /> Start ArcBird Simulation
                      </button>
                    )}
                  </div>
                )}

                {selectedDapp === 'stablestake' && (
                  <div className="flex flex-col gap-4 text-left font-sans">
                    <p className="text-[13px] text-slate-500">
                      Decentralized staking simulator. Lock cumulative USDC on Arc Testnet Validators to trigger automated compound generation on-chain.
                    </p>

                    {/* Staking Pool Overview Card */}
                    <div className="bg-gradient-to-tr from-slate-900 to-slate-800 rounded-2xl p-5 text-white flex flex-col gap-4 shadow-md relative overflow-hidden">
                      <div className="absolute right-3 top-3 opacity-10">
                        <ShieldCheck size={100} />
                      </div>

                      <div className="flex justify-between items-center z-10">
                        <div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 uppercase font-bold">
                            Arc-L1 Node Validator
                          </span>
                          <h4 className="font-bold text-[18px] mt-1 font-sans">Active Vault Pool #3A</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest block">APY Rate</span>
                          <span className="text-[18px] font-black text-emerald-400 font-mono">12.5%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-slate-700/50 pt-3 z-10">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-sans">Total Staked</span>
                          <span className="text-[16px] font-extrabold text-slate-200 font-mono">{stakedAmount.toFixed(2)} USDC</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-sans">Yield Earned (USDC)</span>
                          <span className="text-[16px] font-extrabold text-yellow-400 font-mono">
                            ${accruedRewards > 0 ? accruedRewards.toFixed(6) : '0.000000'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stake Inputs */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-3 font-sans">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Modify Stake Position</span>
                      <div className="flex gap-2">
                        <input 
                          type="number"
                          value={stakeAmountInput}
                          onChange={e => setStakeAmountInput(e.target.value)}
                          className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[14px] font-mono text-slate-800 flex-1 focus:outline-none focus:border-[#3FA2F6]"
                          placeholder="Amount to stake"
                        />
                        <button 
                          onClick={() => {
                            if (!stakeAmountInput || Number(stakeAmountInput) <= 0) return;
                            setIsStaking(true);
                            setTimeout(() => {
                              setStakedAmount(prev => prev + Number(stakeAmountInput));
                              setStakeAmountInput('');
                              setIsStaking(false);
                            }, 1000);
                          }}
                          disabled={isStaking || !stakeAmountInput}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 rounded-xl text-[13px] active:scale-95 transition-all flex items-center gap-1.5 shrink-0 border-0 cursor-pointer"
                        >
                          {isStaking ? 'Staking...' : 'Stake USDC'}
                        </button>
                      </div>
                    </div>

                    {/* Quick helper guides */}
                    {stakedAmount > 0 ? (
                      <div className="flex flex-col gap-2 font-sans">
                        <div className="bg-emerald-50 border border-emerald-100/60 p-3 rounded-lg flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[12.5px] text-emerald-800 font-semibold font-sans">Compounding (12.5% APY)</span>
                          </div>
                          <button 
                            onClick={() => {
                              setAccruedRewards(0);
                            }}
                            className="text-[11px] font-bold text-emerald-600 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded transition-colors border-0 cursor-pointer"
                          >
                            Claim Yield
                          </button>
                        </div>
                        <button 
                          onClick={() => {
                            setStakedAmount(0);
                            setAccruedRewards(0);
                          }}
                          className="w-full bg-slate-100 text-slate-600 py-2 rounded-xl text-[12px] font-bold transition-all border-0 cursor-pointer"
                        >
                          Unstake Validator Funds
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 text-center italic py-2 font-sans">
                        Stake an amount of USDC to see simulated on-chain rewards compound in real-time.
                      </p>
                    )}
                  </div>
                )}
             </div>
           </div>
        </div>
      )}

    </div>
  );
}
