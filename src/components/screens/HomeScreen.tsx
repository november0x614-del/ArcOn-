import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ViewState, ShortcutItem } from "../../types";
import { useApp } from "../../context/AppContext";
import { LogPanel } from "../common/LogPanel";
import { MenuIcon } from "../common/MenuIcon";
import { StockRow } from "../common/StockRow";
import { ProductCard } from "../common/ProductCard";
import { NavItem } from "../common/NavItem";
import { WalletCard } from "../common/WalletCard";
import {
  LogOut,
  Mail,
  Settings,
  ChevronRight,
  Settings2,
  Wallet,
  ShoppingBag,
  PlusCircle as PlusCircleIcon,
  TrendingUp,
  Search,
  Scan,
  Home,
  Box,
  Coins,
  Globe,
  ShieldCheck,
  Gamepad2,
  RefreshCw,
  Zap,
  Lock,
  Bot,
  Check,
  X,
  ExternalLink
} from "lucide-react";

export interface HomeScreenProps {
  userName: string;
  selectedShortcuts: ShortcutItem[];
  onNavigate: (view: ViewState) => void;
}

export const HomeScreen = React.memo(({
  userName,
  selectedShortcuts,
  onNavigate,
}: HomeScreenProps) => {
  const {
    transactions,
    visibleTokenCodes,
    setVisibleTokenCodes,
    fetchTransactions,
    readReceiptIds,
    displayToast
  } = useApp();

  const unreadCount = transactions.filter((tx) => !readReceiptIds.includes(tx.id)).length;
  
  const { fetchBalance } = useApp(); // Keep for PnL calculation


  useEffect(() => {
    fetchBalance();
    fetchTransactions();
    
    // Refresh when user returns to the app
    const handleFocus = () => {
      fetchBalance();
      fetchTransactions();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchBalance, fetchTransactions]);
  const [activeRekeningTab, setActiveRekeningTab] = useState(0);

  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const promoScrollRef = useRef<HTMLDivElement>(null);

  // Dapps Simulation States

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
          behavior: "smooth",
        });
        setCurrentPromoIndex(newIndex);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [currentPromoIndex]);

  // ==========================================
  // TRANSACTION FLOW SIMULATOR STATES & TICKERS
  // ==========================================
  const [simStep, setSimStep] = useState<number>(0); // 0: Idle, 1 to 6
  const [simAmount, setSimAmount] = useState<string>("25");
  const [simProduct, setSimProduct] = useState<string>(
    "Kredit Komputasi Cloud",
  );
  const [simStatus, setSimStatus] = useState<
    "idle" | "running" | "success" | "paused"
  >("idle");
  const [simLogs, setSimLogs] = useState<string[]>([]);

  const runNextSimStep = (currentStep: number) => {
    const nextStep = currentStep + 1;
    if (nextStep > 6) {
      setSimStatus("success");
      return;
    }
    setSimStep(nextStep);

    // Simulasikan pesan log sesuai step dengan menekankan panduan keamanan server-side yang ketat
    const timestamp = new Date().toISOString().split("T")[1].slice(0, 8);
    let logMsg = "";
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
    setSimLogs((prev) => [...prev, logMsg]);
  };

  useEffect(() => {
    let timeout: any;
    if (simStatus === "running" && simStep > 0 && simStep < 6) {
      timeout = setTimeout(() => {
        runNextSimStep(simStep);
      }, 2000);
    } else if (simStatus === "running" && simStep === 6) {
      timeout = setTimeout(() => {
        setSimStatus("success");
      }, 1200);
    }
    return () => clearTimeout(timeout);
  }, [simStatus, simStep]);

  const [showTieredAccessAlert, setShowTieredAccessAlert] = useState(false);

  const startSimulation = () => {
    const timestamp = new Date().toISOString().split("T")[1].slice(0, 8);
    setSimStep(1);
    setSimStatus("running");
    setSimLogs([
      `[${timestamp}] [SYSTEM] Menyiapkan alur transaksi e-commerce native-stablecoin di Arc Testnet...`,
      `[${timestamp}] [CLIENT-SIDE] Memulai pesanan baru untuk "${simProduct}" senilai ${simAmount} USDC. Tidak ada secret key yang diakses oleh dApp client!`,
    ]);
  };

  const resetSimulation = () => {
    setSimStep(0);
    setSimStatus("idle");
    setSimLogs([]);
  };

  const [marketTokens, setMarketTokens] = useState([
    {
      code: "USDC",
      name: "USD Coin",
      price: 1.0,
      change: 0.0,
      percent: 0.0,
      isDown: false,
    },
    {
      code: "ARC",
      name: "Arc Network Gas Token",
      price: 24.1,
      change: 1.2,
      percent: 5.2,
      isDown: false,
    },
    {
      code: "ETH",
      name: "Ethereum",
      price: 3100.0,
      change: -45.0,
      percent: -1.4,
      isDown: true,
    },
    {
      code: "SOL",
      name: "Solana",
      price: 145.2,
      change: 12.0,
      percent: 9.0,
      isDown: false,
    },
    {
      code: "BTC",
      name: "Bitcoin",
      price: 65000.0,
      change: -200.0,
      percent: -0.3,
      isDown: true,
    },
  ]);

  const [showManageMarketModal, setShowManageMarketModal] = useState(false);

  const toggleTokenVisibility = (code: string) => {
    setVisibleTokenCodes(
      visibleTokenCodes.includes(code)
        ? visibleTokenCodes.filter((c: string) => c !== code)
        : [...visibleTokenCodes, code]
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketTokens((prevTokens) =>
        prevTokens.map((token) => {
          if (token.code === "USDC") return token; // Stablecoin, don't change

          const changePercent = (Math.random() - 0.5) * 0.005; // -0.25% to +0.25% change
          const changeAmount = token.price * changePercent;
          const newPrice = token.price + changeAmount;

          return {
            ...token,
            price: newPrice,
            change: token.change + changeAmount,
            percent: token.percent + changePercent * 100,
            isDown: changeAmount < 0,
          };
        }),
      );
    }, 2000); // 2 seconds

    return () => clearInterval(interval);
  }, []);

  const formatPrice = React.useCallback((price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${price.toFixed(2)}`;
  }, []);

  const formatChange = React.useCallback((change: number, isDown: boolean) => {
    const absChange = Math.abs(change);
    const prefix = isDown ? "-" : "+";
    if (absChange >= 1000) {
      return `${prefix}${absChange.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${prefix}${absChange.toFixed(2)}`;
  }, []);



  return (
    <div className="flex flex-col h-full bg-[#ecf5fc] font-sans relative overflow-hidden">
      {/* Background shape that covers the top half */}
      <div className="absolute top-0 left-0 right-0 h-[40vh] md:h-[450px] bg-slate-900 rounded-b-[40px] md:rounded-b-[50px] z-0"></div>

      {/* Top Header */}
      <header className="relative text-white px-5 md:px-8 lg:px-10 pt-4 md:pt-8 pb-3 flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-800 font-[900] text-lg shadow-sm uppercase">
            {userName
              ? userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
              : "UN"}
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-[15px] tracking-wide relative after:content-[''] after:absolute after:right-[-20px] after:top-0 after:bottom-0 after:w-8 after:bg-gradient-to-r after:from-transparent after:to-slate-800">
              {userName
                ? (userName.length > 18
                    ? userName.slice(0, 15) + "..."
                    : userName
                  ).toUpperCase()
                : "USER NAME"}
            </h1>
            <div className="flex items-center gap-1 mt-0.5 hover:opacity-80 transition-opacity">
              <span className="text-yellow-300 font-bold text-xs tracking-wide">
                100%
              </span>
              <span className="text-xs font-semibold italic text-white/90">
                Gas Power (USDC)
              </span>
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
            {/* Arc Network Status Monitor (Enterprise Finality) */}
            <div className="mx-4 lg:mx-0 mt-4 mb-2 flex items-center justify-between bg-white rounded-[20px] p-3 shadow-sm border border-slate-100/50">
               <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                    <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping opacity-40"></div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none flex items-center gap-1.5">
                       Arc Testnet Live
                       <span className="bg-slate-900 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">ARC-GAS</span>
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium mt-1">Deterministic Finality: Sub-second Settlement</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-slate-800">Unified Gas System</span>
                    <span className="text-[8px] text-slate-400">No ETH Funding Required</span>
                 </div>
                 <div className="w-[1px] h-6 bg-slate-100"></div>
                 <a 
                   href="https://testnet.arcscan.app" 
                   target="_blank" 
                   rel="noreferrer" 
                   className="p-1.5 bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                 >
                   <ExternalLink size={14} />
                 </a>
               </div>
            </div>

            {/* Accounts Section */}
            <section className="bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] mx-4 lg:mx-0 border border-slate-50/50 mt-0">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
                  Accounts
                </h2>
              </div>

              {/* Tabs */}
              <div className="flex overflow-x-auto gap-2 pt-1 pb-3 mb-4 scrollbar-hide text-[12px] font-medium relative">
                {[
                  { name: "My Wallet", icon: <Wallet size={20} /> },
                  { name: "E-commerce", icon: <ShoppingBag size={20} /> },
                ].map((tab, i) => (
                  <div
                    key={tab.name}
                    onClick={() => setActiveRekeningTab(i)}
                    className={`px-4 pb-2 flex items-center justify-center gap-2 whitespace-nowrap min-w-max cursor-pointer transition-colors relative ${
                      activeRekeningTab === i
                        ? "text-slate-800 font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.name}</span>
                    {activeRekeningTab === i && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-slate-900 rounded-t-full z-10"
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeRekeningTab === 0 && (
                  /* My Wallet Card (Visual Look) */
                  <WalletCard userName={userName} onNavigate={() => onNavigate("accountDetail")} />
                )}

                {activeRekeningTab === 1 && (
                  /* E-commerce Card */
                  <motion.div
                    key="tab-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-5 text-slate-800 shadow-sm relative overflow-hidden mb-3 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] border border-slate-200"
                    onClick={() => onNavigate("ecommerce")}
                  >
                    <div className="flex justify-between items-center z-10 relative">
                      <div className="text-left">
                        <h3 className="font-bold text-[15px] text-slate-800">
                          Arc Marketplace
                        </h3>
                        <p className="text-[12px] text-slate-500 mt-1">
                          Shop premium products with USDC
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-[11px] font-bold text-slate-800 bg-blue-100 px-2 py-0.5 rounded">
                            E-commerce ready
                          </span>
                        </div>
                      </div>
                      <ShoppingBag
                        size={48}
                        className="text-slate-800 opacity-10 absolute -right-2 top-0"
                      />
                      <ChevronRight size={20} className="text-slate-800" />
                    </div>
                  </motion.div>
                )}

                {false && (
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
                          <Zap
                            size={18}
                            className="text-slate-800 animate-pulse"
                          />
                          Simulasi Alur Transaksi Arc Commerce
                        </h3>
                        <p className="text-[11.5px] text-slate-500 mt-1">
                          Interactive visualizer of the native-stablecoin Circle
                          Web3 architecture on Arc Testnet L1.
                        </p>
                      </div>
                    </div>

                    {/* Config Form - Only active if simulation is Idle */}
                    {simStep === 0 ? (
                      <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 flex flex-col gap-3">
                        <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                          Konfigurasi Pembelian
                        </span>
                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="flex flex-col gap-1 text-left">
                            <label className="text-[11px] font-semibold text-slate-500 font-sans">
                              Pilih Produk
                            </label>
                            <select
                              value={simProduct}
                              onChange={(e) => setSimProduct(e.target.value)}
                              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700 outline-none focus:border-slate-900 cursor-pointer"
                            >
                              <option value="Kredit Server L1">
                                Kredit Server L1
                              </option>
                              <option value="Abonemen Premium">
                                Abonemen Premium
                              </option>
                              <option value="Game Item - ArcBird Keys">
                                Game Item - ArcBird Keys
                              </option>
                              <option value="Hardware Node Miner">
                                Hardware Node Miner
                              </option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1 text-left">
                            <label className="text-[11px] font-semibold text-slate-500 font-sans">
                              Harga (USDC)
                            </label>
                            <input
                              type="number"
                              value={simAmount}
                              onChange={(e) => setSimAmount(e.target.value)}
                              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12.5px] font-mono font-semibold text-slate-700 outline-none focus:border-slate-900"
                              placeholder="25"
                              min="1"
                            />
                          </div>
                        </div>

                        {/* Security Advisory Badges */}
                        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 flex gap-2.5 items-start">
                          <Lock
                            size={15}
                            className="text-amber-600 mt-0.5 shrink-0"
                          />
                          <div className="flex flex-col gap-0.5 text-left font-sans">
                            <p className="text-[11px] font-bold text-amber-800">
                              Prinsip Keamanan Server-Side (Critical!)
                            </p>
                            <p className="text-[10px] text-amber-700 leading-normal">
                              Dalam arsitektur{" "}
                              <strong className="text-amber-900">
                                Circle Web3
                              </strong>
                              , pemanggilan API, kunci privat{" "}
                              <code className="bg-amber-100 px-1 py-0.2 rounded text-red-600 font-mono">
                                SUPABASE_SECRET_KEY
                              </code>
                              , dan{" "}
                              <code className="bg-amber-100 px-1 py-0.2 rounded text-red-600 font-mono">
                                CIRCLE_ENTITY_SECRET
                              </code>{" "}
                              <strong>WAJIB</strong> dijalankan seutuhnya di
                              Server-Side (API Routes / Server Actions) dan
                              dilarang terekspos di browser client.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={startSimulation}
                          className="w-full bg-slate-900 hover:bg-[#328fdc] text-white font-bold py-2.5 rounded-xl text-[13.5px] transition-all flex items-center justify-center gap-2 border-0 shadow-sm cursor-pointer"
                        >
                          <Zap size={14} /> Mulai Simulasi Transaksi L1
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {/* Interactive Map Nodes */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/60 flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">
                              Step-by-Step Flow Map
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 font-mono">
                              Step {simStep} dari 6
                            </span>
                          </div>

                          {/* Linear Steps Container */}
                          <div className="flex flex-col gap-3.5 relative">
                            {/* Connector background line */}
                            <div className="absolute left-4 top-4 bottom-4 w-[2px] bg-slate-200 z-0"></div>

                            {/* Dynamic colored connector line based on current step */}
                            <div
                              className="absolute left-4 top-4 w-[2px] bg-slate-1000 z-0 transition-all duration-300"
                              style={{
                                height: `${((simStep - 1) / 5) * 88}%`,
                                maxHeight: "100%",
                              }}
                            ></div>

                            {/* Step Nodes */}
                            {[
                              {
                                step: 1,
                                label: "User Orders Checkout",
                                source: "Client App",
                                desc: `Inisiasi pesanan senilai ${simAmount} USDC`,
                                icon: <ShoppingBag size={14} />,
                              },
                              {
                                step: 2,
                                label: "Call Circle APIs",
                                source: "Secure Routing",
                                desc: "@circle-fin/developer-controlled-wallets init",
                                icon: <Lock size={14} />,
                              },
                              {
                                step: 3,
                                label: "Arc USDC L1 Payment",
                                source: "Network L1",
                                desc: `Token gas native berbasis USDC`,
                                icon: <Coins size={14} />,
                              },
                              {
                                step: 4,
                                label: "Circle Webhook Callback",
                                source: "API Portal",
                                desc: "Settle notification dikirim asinkron via Ngrok",
                                icon: <Globe size={14} />,
                              },
                              {
                                step: 5,
                                label: "Signature Verification",
                                source: "Backend Server",
                                desc: "Memvalidasi Circle-Signature header kriptografis",
                                icon: <ShieldCheck size={14} />,
                              },
                              {
                                step: 6,
                                label: "Supabase Data Sync",
                                source: "Database Sync",
                                desc: "Sinkronisasi pulsa/kredit user di database",
                                icon: <Box size={14} />,
                              },
                            ].map((node) => {
                              const isCompleted =
                                simStep > node.step || simStatus === "success";
                              const isActive =
                                simStep === node.step &&
                                simStatus === "running";

                              return (
                                <div
                                  key={node.step}
                                  className="flex gap-4 items-start relative z-10 text-left"
                                >
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                                      isCompleted
                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                        : isActive
                                          ? "bg-blue-100 border-slate-900 text-slate-800 animate-pulse ring-4 ring-blue-50"
                                          : "bg-white border-slate-200 text-slate-400"
                                    }`}
                                  >
                                    {isCompleted ? (
                                      <span className="font-bold text-[12px]">
                                        ✓
                                      </span>
                                    ) : (
                                      node.icon
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p
                                        className={`text-[12.5px] font-bold ${isActive ? "text-slate-800" : isCompleted ? "text-emerald-700" : "text-slate-700"} font-sans`}
                                      >
                                        {node.label}
                                      </p>
                                      <span className="text-[9px] font-semibold text-slate-400 tracking-wider uppercase px-1.5 py-0.2 bg-slate-100 rounded leading-none">
                                        {node.source}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-sans mt-0.5 leading-snug">
                                      {node.desc}
                                    </p>
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
                            let colorClass = "text-slate-300";
                            if (log.includes("[CLIENT-SIDE]"))
                              colorClass = "text-sky-300";
                            if (log.includes("[SERVER-SIDE]"))
                              colorClass = "text-amber-300 font-medium";
                            if (log.includes("[ON-CHAIN]"))
                              colorClass = "text-yellow-250";
                            if (log.includes("[WEBHOOK]"))
                              colorClass = "text-indigo-300";
                            if (log.includes("[DATABASE]"))
                              colorClass = "text-emerald-300";
                            if (log.includes("[SYSTEM]"))
                              colorClass = "text-slate-400 italic";

                            return (
                              <div
                                key={i}
                                className={`leading-normal break-words ${colorClass}`}
                              >
                                {log}
                              </div>
                            );
                          })}

                          {simStatus === "running" && (
                            <div className="text-slate-800 flex items-center gap-1.5 animate-pulse mt-1 select-none font-sans text-[11px]">
                              <span className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-ping"></span>
                              Memproses transaksional... server bekerja asinkron
                            </div>
                          )}
                        </div>

                        {/* Simulation Controls */}
                        <div className="flex flex-col gap-2.5">
                          {simStatus === "success" ? (
                            <div className="w-full flex flex-col gap-2.5 mt-1">
                              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
                                <span className="text-emerald-800 font-bold text-[13px] flex items-center gap-1.5 leading-snug font-sans">
                                  <ShieldCheck
                                    size={16}
                                    className="text-emerald-600"
                                  />
                                  Simulasi Pembayaran Berhasil!
                                </span>
                                <p className="text-[10px] text-slate-500 leading-normal font-sans mt-1">
                                  Alur asinkron Circle Webhook dialihkan via
                                  Ngrok ke Supabase DB berhasil mensinkronisasi
                                  data kredit pengguna dengan signature valid.
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
                                  if (simStatus === "running") {
                                    setSimStatus("paused");
                                  } else {
                                    setSimStatus("running");
                                  }
                                }}
                                className={`flex-1 ${simStatus === "running" ? "bg-amber-500 hover:bg-amber-600" : "bg-slate-900 hover:bg-[#328fdc]"} text-white font-bold py-2 px-3 rounded-lg text-[13px] border-0 cursor-pointer transition-colors`}
                              >
                                {simStatus === "running"
                                  ? "Pause Auto-Play"
                                  : "Mulai Auto-Play"}
                              </button>

                              <button
                                onClick={() => runNextSimStep(simStep)}
                                disabled={
                                  simStatus === "running" || simStep >= 6
                                }
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
                onClick={() => onNavigate("otherAccounts")}
                className="w-full text-center text-slate-800 text-[12px] font-bold mt-1 py-1.5 hover:bg-slate-100 rounded-lg transition-colors flex justify-center items-center gap-1.5 opacity-90 border-0 bg-transparent"
              >
                Other Personal Savings & Checking <PlusCircleIcon size={14} />
              </button>
            </section>

            {/* Favorite Transactions Section */}
            <section className="bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] mb-3 lg:mb-0 mx-4 lg:mx-0 border border-slate-50/50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
                  Favorite Transactions
                </h2>
                <button
                  className="text-slate-800 text-[13px] font-semibold flex items-center gap-1.5 hover:bg-slate-100 px-2 py-1 rounded-full transition-colors border-0 bg-transparent"
                  onClick={() => onNavigate("manageFavorites")}
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
                        if (
                          item.label === "Transfer USDC On-chain" ||
                          item.label === "Transfer USDC"
                        )
                          onNavigate("transfer");
                        if (item.label === "Receive USDC") onNavigate("receive");
                        if (item.label === "Request Payment")
                          onNavigate("receive");
                        if (item.label === "Pay with USDC") onNavigate("scanQR");
                        if (item.label === "Native Wallet Swap" || item.label === "Swap USDC") onNavigate("swap");
                        if (item.label === "Deposit/Withdraw")
                          onNavigate("depositOptions");
                        if (item.label === "Top-up") onNavigate("topup");
                        if (item.label === "Pay/VA") onNavigate("bayarVA");
                        if (item.label === "DApp Browser")
                          onNavigate("ecommerce");
                        if (item.label === "Staking Pool")
                          onNavigate("stablestake");
                        if (item.label === "Withdraw")
                          onNavigate("withdraw");
                        if (item.label === "Bridge USDC")
                          onNavigate("bridge");
                        if (item.label === "Security & Limits")
                          onNavigate("settings");
                        if (item.label === "Transaction History")
                          onNavigate("transactionHistory");
                      }}
                    />
                ))}
              </div>

              <div
                className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 py-3 px-4 rounded-xl flex items-center justify-between gap-3 border border-indigo-100 relative cursor-pointer hover:bg-indigo-100/50 transition-colors"
                onClick={() => onNavigate("aiAgent")}
              >
                {/* Tooltip triangle */}
                <div className="absolute -top-2 right-10 w-4 h-4 bg-indigo-50 border-l border-t border-indigo-100 rotate-45"></div>
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg text-slate-800 shrink-0 border border-indigo-50 shadow-sm">
                    <Bot size={18} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[13px] font-bold text-slate-800">
                      Tanya AI Assistant
                    </span>
                    <span className="text-[11.5px] text-slate-500">
                      Bantu kamu kelola wallet
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-full p-1 shadow-sm text-slate-800 shrink-0 border border-indigo-50">
                  <ChevronRight size={14} />
                </div>
              </div>
            </section>

            {/* Special For You (Promo Banner) */}
            <section className="bg-white rounded-[24px] overflow-hidden shadow-sm mb-4 lg:mb-0 mx-4 lg:mx-0 pb-4 border border-x-transparent border-t-transparent border-b-slate-50 relative z-10 lg:mt-8">
              <div className="px-5 pt-5 pb-3">
                <h2 className="text-[17px] font-bold text-slate-800 tracking-tight mb-0 text-left">
                  Special For You
                </h2>
              </div>
              <div
                ref={promoScrollRef}
                onScroll={handlePromoScroll}
                className="flex overflow-x-auto gap-4 px-5 scrollbar-hide snap-x snap-mandatory touch-pan-x"
                style={{ scrollBehavior: "smooth" }}
              >
                <div className="w-[85vw] max-w-[280px] h-[140px] bg-gradient-to-r from-blue-700 to-blue-800 rounded-2xl p-4 snap-center relative overflow-hidden text-white flex flex-col justify-center shadow-inner text-left shrink-0">
                  <div className="absolute right-0 top-0 h-full w-1/2 bg-[url('https://images.unsplash.com/photo-1556740714-a82f3a479426?q=80&w=150&auto=format&fit=crop')] bg-cover mix-blend-overlay opacity-30"></div>
                  <h3 className="font-bold text-[15px] leading-tight w-2/3 relative z-10">
                    Opening a Checking Account is Easier...
                  </h3>
                  <button className="mt-3 bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg w-max relative z-10 border-0">
                    Open Now
                  </button>
                </div>
                <div className="w-[85vw] max-w-[280px] h-[140px] bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 snap-center relative overflow-hidden text-white flex flex-col justify-center shadow-inner text-left shrink-0">
                  <h3 className="font-bold text-[15px] leading-tight w-2/3 relative z-10">
                    Disburse Loan Up To Rp 50 Million
                  </h3>
                  <button className="mt-3 bg-white text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-lg w-max relative z-10 border-0">
                    Check Limit
                  </button>
                </div>
                <div className="w-[85vw] max-w-[280px] h-[140px] bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl p-4 snap-center relative overflow-hidden text-white flex flex-col justify-center shadow-inner text-left shrink-0">
                  <div className="absolute right-0 top-0 h-full w-1/2 bg-[url('https://images.unsplash.com/photo-1556740714-a82f3a479426?q=80&w=150&auto=format&fit=crop')] bg-cover mix-blend-overlay opacity-30"></div>
                  <h3 className="font-bold text-[15px] leading-tight w-2/3 relative z-10">
                    Limited Time: 5% USDC Cash Back
                  </h3>
                  <button className="mt-3 bg-white text-red-500 text-xs font-bold px-3 py-1.5 rounded-lg w-max relative z-10 border-0">
                    Claim Now
                  </button>
                </div>
                <div className="w-[85vw] max-w-[280px] h-[140px] bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-4 snap-center relative overflow-hidden text-white flex flex-col justify-center shadow-inner text-left shrink-0">
                  <h3 className="font-bold text-[15px] leading-tight w-2/3 relative z-10">
                    Access DApps Securely with Arc
                  </h3>
                  <button className="mt-3 bg-white text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-lg w-max relative z-10 border-0">
                    Explore Layer-1
                  </button>
                </div>
              </div>
              {/* Pagination dots */}
              <div className="flex justify-center gap-1.5 mt-4">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${currentPromoIndex === index ? "w-5 bg-slate-900" : "w-1.5 bg-slate-200"}`}
                  ></div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column for Desktop */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
            <LogPanel />
            {/* Dapps */}
            <section className="bg-white rounded-[24px] p-5 shadow-sm mb-4 lg:mb-0 mx-4 lg:mx-0 text-left">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[17px] font-bold text-slate-800 tracking-tight font-sans">
                  External DApps
                </h2>
                <button className="text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-0 p-1">
                  <Search size={18} strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {/* ArcSwap */}
                <div
                  onClick={() => {
                    // Show a toast message to simulate opening an external browser
                    displayToast("Membuka external web browser ke ArcSwap...");
                  }}
                  className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <RefreshCw size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-[14px] text-slate-800 font-sans">
                        ArcSwap DEX
                      </h4>
                      <span className="text-[9px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded font-sans">
                        DEX
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-400 truncate mt-0.5 font-sans">
                      Swap USDC with Arc Native Tokens
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>

                {/* ArcBird Mini-Game */}
                <div
                  onClick={() => {
                    onNavigate("arcbird");
                  }}
                  className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Gamepad2 size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-[14px] text-slate-800 font-sans">
                        ArcBird Arcade
                      </h4>
                      <span className="text-[9px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-sans">
                        Gaming
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-400 truncate mt-0.5 font-sans">
                      Tap to Jump & earn ARC coins
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>

                {/* StableStake Vault */}
                <div
                  onClick={() => {
                    onNavigate("stablestake");
                  }}
                  className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-[14px] text-slate-800 font-sans">
                        StableStake Vault
                      </h4>
                      <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-sans">
                        Yield & DeFi
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-400 truncate mt-0.5 font-sans">
                      Stake stablecoins & earn USDC yield
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              </div>
            </section>

            {/* Live Token Price Feed */}
            <section className="bg-white rounded-[24px] p-5 shadow-sm mx-4 lg:mx-0 mb-4 lg:mb-0">
              <div className="mb-4 text-left flex justify-between items-start">
                <div>
                  <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
                    Token Markets
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Live data feed from pyth.network
                  </p>
                </div>
                <button 
                  onClick={() => setShowManageMarketModal(true)}
                  className="text-slate-800 text-[13px] font-semibold flex items-center gap-1.5 hover:bg-slate-100 px-2 py-1 rounded-full transition-colors border-0 bg-transparent"
                >
                  Manage <Settings2 size={14} strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold text-sm bg-slate-100 px-3 py-1.5 rounded-lg w-fit">
                <TrendingUp size={16} /> Volume
              </div>

              <div className="flex flex-col gap-4">
                <AnimatePresence>
                  {marketTokens.filter(t => visibleTokenCodes.includes(t.code)).map((token) => (
                    <motion.div key={token.code} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <StockRow
                        code={token.code}
                        name={token.name}
                        price={formatPrice(token.price)}
                        change={formatChange(token.change, token.isDown)}
                        percent={`${token.percent > 0 ? "+" : ""}${token.percent.toFixed(2)}%`}
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
              <h2 className="text-[17px] font-bold text-slate-800 tracking-tight mb-4 text-left">
                Developer Services
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <ProductCard
                  title="Merchant"
                  desc="On-chain USDC integration."
                  icon={<Box size={20} className="text-slate-600" />}
                  onClick={() => onNavigate("merchant")}
                />
                <ProductCard
                  title="Testnet Faucet"
                  desc="Claim ARC Gas Token."
                  icon={<Coins size={20} className="text-slate-600" />}
                  onClick={() => onNavigate("faucet")}
                />
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Aesthetic Bottom Navigation Wrapper with Cutout Notch */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none"
        style={{ filter: "drop-shadow(0 -5px 15px rgba(0,0,0,0.06))" }}
      >
        {/* The Masked White Nav Bar */}
        <nav
          className="relative bg-white h-[75px] md:h-[85px] px-6 lg:px-12 pb-2 flex items-center justify-between lg:justify-around pointer-events-auto rounded-t-2xl md:rounded-t-3xl"
          style={{
            maskImage:
              "radial-gradient(circle at 50% 0px, transparent 34px, black 35px)",
            WebkitMaskImage:
              "radial-gradient(circle at 50% 0px, transparent 34px, black 35px)",
          }}
        >
          <NavItem icon={<Home size={22} />} label="Home" active />
          <NavItem
            icon={<Mail size={22} />}
            label="Messages"
            onClick={() => onNavigate("inbox")}
            badge={
              unreadCount > 0 ? (
                <span className="absolute -top-2 -right-2 h-4 min-w-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold px-1 rounded-full border-2 border-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : undefined
            }
          />
          <div className="w-[50px] md:w-[60px] shrink-0"></div>{" "}
          {/* Spacer for the notch */}
          <NavItem
            icon={<Settings size={22} />}
            label="Settings"
            onClick={() => onNavigate("settings")}
          />
          <NavItem
            icon={<LogOut size={22} />}
            label="Logout"
            onClick={() => onNavigate("logout")}
          />
        </nav>

        {/* Floating Action Button (QR/Pay) - overlapping the notch */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[-28px] pointer-events-auto">
          <div
            className="relative group cursor-pointer flex flex-col items-center justify-center"
            onClick={() => onNavigate("scanQR")}
          >
            <div className="absolute inset-0 bg-slate-900 rounded-[22px] blur-md opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <div className="relative w-[56px] h-[56px] bg-slate-900 rounded-[22px] flex flex-col items-center justify-center text-white shadow-lg transform transition-all duration-300 group-hover:-translate-y-1 active:translate-y-0 border-2 border-white/20 hover:bg-[#328fdc]">
              <Scan size={26} strokeWidth={2.2} />
              <span className="text-[9px] font-bold mt-0.5 tracking-tight uppercase">
                Pay
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit/Withdraw Initial Modal */}
      {/* Step-Up Authentication (Tiered Access) Modal */}
      {showTieredAccessAlert && (
        <div className="absolute inset-0 z-[160] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowTieredAccessAlert(false)}
          ></div>
          <div className="bg-white rounded-3xl p-6 w-full relative z-10 animate-in zoom-in-95 duration-300 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck size={32} className="text-red-500" />
            </div>
            <h3 className="font-bold text-[18px] text-slate-800 leading-tight">
              Step-Up Authentication Required
            </h3>
            <p className="text-[13px] text-slate-500 mt-2 mb-6 font-sans">
              Untuk transaksi bernilai tinggi di atas 100 USDC atau cash-out,
              verifikasi biometrik tambahan diperlukan (Tiered Access).
            </p>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => {
                  setShowTieredAccessAlert(false);
                  onNavigate("settings");
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

      {/* Manage Token Markets Modal */}
      {showManageMarketModal && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowManageMarketModal(false)}
          ></div>
          <div className="bg-white rounded-[32px] p-6 w-full max-w-[340px] relative z-10 animate-in slide-in-from-bottom-8 duration-300 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-[18px] text-slate-800">
                Manage Markets
              </h3>
              <button 
                onClick={() => setShowManageMarketModal(false)}
                className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:text-red-500 transition-colors border-0"
              >
                <X size={18} />
              </button>
            </div>
            
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Pilih token yang ingin ditampilkan di halaman utama live market feed.
            </p>

            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide">
              {marketTokens.map((token) => (
                <div 
                  key={token.code}
                  className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/50 rounded-2xl cursor-pointer transition-all active:scale-[0.98] group border border-slate-100"
                  onClick={() => toggleTokenVisibility(token.code)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm font-black text-slate-800 text-xs border border-blue-50">
                      {token.code.slice(0, 2)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[14px] text-slate-800 leading-none mb-1">{token.code}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{token.name}</span>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${visibleTokenCodes.includes(token.code) ? 'bg-slate-900 text-white shadow-lg shadow-blue-200' : 'bg-white border-2 border-slate-200 text-transparent'}`}>
                    <Check size={14} strokeWidth={4} />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowManageMarketModal(false)}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-[14px] transition-all hover:bg-[#328fdc] active:scale-[0.95] mt-8 shadow-xl shadow-blue-500/20"
            >
              Simpan Konfigurasi
            </button>
          </div>
        </div>
      )}






    </div>
  );
});
