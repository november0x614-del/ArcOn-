import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ViewState, ShortcutItem } from "../../types";
import { useApp } from "../../context/AppContext";
import { MenuIcon } from "../common/MenuIcon";
import { StockRow } from "../common/StockRow";
import { ProductCard } from "../common/ProductCard";
import { NavItem } from "../common/NavItem";
import { WalletCard } from "../common/WalletCard";
import { formatCurrency } from "../../lib/utils";
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
  ShieldCheck,
  Gamepad2,
  RefreshCw,
  Bot,
  Check,
  X
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
    fetchBalance
  } = useApp();

  const unreadCount = transactions.filter((tx) => !readReceiptIds.includes(tx.id)).length;


  useEffect(() => {
    fetchBalance();
    fetchTransactions();
    
    // Refresh when user returns to the app
    const handleFocus = () => {
      fetchBalance();
      fetchTransactions();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchBalance, fetchTransactions]);
  const [activeRekeningTab, setActiveRekeningTab] = useState(0);

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
          behavior: "smooth",
        });
        setCurrentPromoIndex(newIndex);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [currentPromoIndex]);

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
    return formatCurrency(price, '$');
  }, []);

  const formatChange = React.useCallback((change: number, isDown: boolean) => {
    const absChange = Math.abs(change);
    const prefix = isDown ? "-" : "+";
    return `${prefix}${formatCurrency(absChange, '')}`;
  }, []);



  return (
    <div className="flex flex-col h-full bg-[#ecf5fc] font-sans relative overflow-hidden">
      {/* Background shape that covers the top half */}
      <div className="absolute top-0 left-0 right-0 h-[40vh] md:h-[450px] bg-[#3FA2F6] rounded-b-[40px] md:rounded-b-[50px] z-0"></div>

      {/* Top Header */}
      <header className="relative text-white px-5 md:px-8 lg:px-10 pt-4 md:pt-8 pb-3 flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#3FA2F6] font-[900] text-lg shadow-sm uppercase">
            {userName
              ? userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
              : "UN"}
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-[15px] tracking-wide relative after:content-[''] after:absolute after:right-[-20px] after:top-0 after:bottom-0 after:w-8 after:bg-gradient-to-r after:from-transparent after:to-[#3FA2F6]">
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
                        ? "text-[#3FA2F6] font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.name}</span>
                    {activeRekeningTab === i && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-[#3FA2F6] rounded-t-full z-10"
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
                    className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-5 text-slate-800 shadow-sm relative overflow-hidden mb-3 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] border border-blue-100"
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
                          <span className="text-[11px] font-bold text-[#005faa] bg-blue-100 px-2 py-0.5 rounded">
                            E-commerce ready
                          </span>
                        </div>
                      </div>
                      <ShoppingBag
                        size={48}
                        className="text-[#005faa] opacity-10 absolute -right-2 top-0"
                      />
                      <ChevronRight size={20} className="text-[#3FA2F6]" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => onNavigate("otherAccounts")}
                className="w-full text-center text-[#3FA2F6] text-[12px] font-bold mt-1 py-1.5 hover:bg-blue-50 rounded-lg transition-colors flex justify-center items-center gap-1.5 opacity-90 border-0 bg-transparent"
              >
                Other Personal Savings & Checking <PlusCircleIcon size={14} />
              </button>
            </section>

            {/* Favorite Transactions Section */}
            <section className="bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] mb-3 lg:mb-0 mx-4 lg:mx-0 border border-slate-50/50">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
                  Favorite Transactions
                </h2>
                <button
                  className="text-[#3FA2F6] text-[13px] font-semibold flex items-center gap-1.5 hover:bg-blue-50 px-2 py-1 rounded-full transition-colors border-0 bg-transparent"
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
                        if (item.label === "Swap Token") onNavigate("swap");
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
                  <div className="bg-white p-2 rounded-lg text-[#3FA2F6] shrink-0 border border-indigo-50 shadow-sm">
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
                <div className="bg-white rounded-full p-1 shadow-sm text-[#3FA2F6] shrink-0 border border-indigo-50">
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
                  <button className="mt-3 bg-white text-[#005faa] text-xs font-bold px-3 py-1.5 rounded-lg w-max relative z-10 border-0">
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
                    className={`h-1.5 rounded-full transition-all duration-300 ${currentPromoIndex === index ? "w-5 bg-[#3FA2F6]" : "w-1.5 bg-slate-200"}`}
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
                <h2 className="text-[17px] font-bold text-slate-800 tracking-tight font-sans">
                  Arc Ecosystem
                </h2>
                <button className="text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-0 p-1">
                  <Search size={18} strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {/* ArcSwap */}
                <div
                  onClick={() => onNavigate("arcswap")}
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
                  className="text-[#3FA2F6] text-[13px] font-semibold flex items-center gap-1.5 hover:bg-blue-50 px-2 py-1 rounded-full transition-colors border-0 bg-transparent"
                >
                  Manage <Settings2 size={14} strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4 text-[#3FA2F6] font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
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
                  icon={<Box size={20} className="text-blue-500" />}
                  onClick={() => onNavigate("merchant")}
                />
                <ProductCard
                  title="Testnet Faucet"
                  desc="Claim ARC Gas Token."
                  icon={<Coins size={20} className="text-blue-500" />}
                  onClick={() => onNavigate("faucet")}
                />
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Aesthetic Bottom Navigation Wrapper with Cutout Notch */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none"
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
            <div className="absolute inset-0 bg-[#3FA2F6] rounded-[22px] blur-md opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <div className="relative w-[56px] h-[56px] bg-[#3FA2F6] rounded-[22px] flex flex-col items-center justify-center text-white shadow-lg transform transition-all duration-300 group-hover:-translate-y-1 active:translate-y-0 border-2 border-white/20 hover:bg-[#328fdc]">
              <Scan size={26} strokeWidth={2.2} />
              <span className="text-[9px] font-bold mt-0.5 tracking-tight uppercase">
                Pay
              </span>
            </div>
          </div>
        </div>
      </div>

{/* Deposit/Withdraw Initial Modal */}

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
                  className="flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50/50 rounded-2xl cursor-pointer transition-all active:scale-[0.98] group border border-slate-100"
                  onClick={() => toggleTokenVisibility(token.code)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm font-black text-[#3FA2F6] text-xs border border-blue-50">
                      {token.code.slice(0, 2)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[14px] text-slate-800 leading-none mb-1">{token.code}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{token.name}</span>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${visibleTokenCodes.includes(token.code) ? 'bg-[#3FA2F6] text-white shadow-lg shadow-blue-200' : 'bg-white border-2 border-slate-200 text-transparent'}`}>
                    <Check size={14} strokeWidth={4} />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowManageMarketModal(false)}
              className="w-full bg-[#3FA2F6] text-white font-black py-4 rounded-2xl text-[14px] transition-all hover:bg-[#328fdc] active:scale-[0.95] mt-8 shadow-xl shadow-blue-500/20"
            >
              Simpan Konfigurasi
            </button>
          </div>
        </div>
      )}






    </div>
  );
});
