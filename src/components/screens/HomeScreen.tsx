import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../../store/useStore";
import { ViewState, ShortcutItem } from "../../types";
import { useApp } from "../../contexts/AppContext";
import { useArc } from "../../contexts/ArcContext";
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
  Bot,
  Check,
  X,
  ShieldCheck,
  Gamepad2,
  RefreshCw,
  Box,
  Coins,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  Plus,
} from "lucide-react";

export interface HomeScreenProps {
  userName: string;
  selectedShortcuts: ShortcutItem[];
  onNavigate: (view: ViewState) => void;
  platformConfig?: any;
  desktopRightColumn?: React.ReactNode;
  activeView?: ViewState;
  isDesktop?: boolean;
}

export const HomeScreen = React.memo(
  ({
    userName,
    selectedShortcuts,
    onNavigate,
    platformConfig,
    desktopRightColumn,
    activeView,
    isDesktop = false,
  }: HomeScreenProps) => {
    const {
      transactions,
      visibleTokenCodes,
      setVisibleTokenCodes,
      fetchTransactions,
      readReceiptIds,
      displayToast,
      registeredUser,
      startSyncPolling,
      stopSyncPolling,
      isSyncing,
      lastSyncTime,
    } = useStore(
      useShallow((state) => ({
        transactions: state.transactions,
        visibleTokenCodes: state.visibleTokenCodes,
        setVisibleTokenCodes: state.setVisibleTokenCodes,
        fetchTransactions: state.fetchTransactions,
        readReceiptIds: state.readReceiptIds,
        displayToast: state.displayToast,
        registeredUser: state.registeredUser,
        startSyncPolling: state.startSyncPolling,
        stopSyncPolling: state.stopSyncPolling,
        isSyncing: state.isSyncing,
        lastSyncTime: state.lastSyncTime,
      })),
    );

    const { refreshBalance } = useArc();

    // Critical Performance Guard: Do not render heavy UI until user data is present
    if (!registeredUser) {
      return (
        <div className="flex-1 flex items-center justify-center bg-[#ecf5fc]">
          <div className="w-12 h-12 border-4 border-slate-900/10 border-t-slate-900 rounded-full animate-spin"></div>
        </div>
      );
    }

    const unreadCount = transactions.filter(
      (tx) => (tx.status === "success" || tx.status === "failed") && !readReceiptIds.includes(tx.id),
    ).length;

    useEffect(() => {
      // Stabilize polling - start only if not already active
      startSyncPolling();

      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          startSyncPolling();
        } else {
          stopSyncPolling();
        }
      };

      const handleFocus = () => {
        if (document.visibilityState === "visible") {
          startSyncPolling();
        }
      };

      window.addEventListener("focus", handleFocus);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        // Only stop if the component is actually unmounting permanently
        // or let the global store handle session logic
        window.removeEventListener("focus", handleFocus);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      };
    }, []); // Run once on mount

    const [activeRekeningTab, setActiveRekeningTab] = useState(0);
    const [otherAccountsExpanded, setOtherAccountsExpanded] = useState(false);

    const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
    const promoScrollRef = useRef<HTMLDivElement>(null);

    const handlePromoScroll = () => {
      if (promoScrollRef.current) {
        const scrollLeft = promoScrollRef.current.scrollLeft;
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
      }, 6000); // Increased from 4s to 6s for better stability
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
        code: "EURC",
        name: "Euro Coin",
        price: 1.08,
        change: 0.05,
        percent: 0.15,
        isDown: false,
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
          : [...visibleTokenCodes, code],
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
      }, 8000); // Reduced frequency from 2s to 8s for performance

      return () => clearInterval(interval);
    }, []);

    const formatPrice = React.useCallback((price: number) => {
      if (price >= 1000) {
        return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return `$${price.toFixed(2)}`;
    }, []);

    const formatChange = React.useCallback(
      (change: number, isDown: boolean) => {
        const absChange = Math.abs(change);
        const prefix = isDown ? "-" : "+";
        if (absChange >= 1000) {
          return `${prefix}${absChange.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `${prefix}${absChange.toFixed(2)}`;
      },
      [],
    );

    const filteredShortcuts = React.useMemo(() => {
      if (!platformConfig) return selectedShortcuts;
      return selectedShortcuts.filter((item) => {
        const label = item.label;
        if (
          label === "Transfer USDC" ||
          label === "Transfer USDC On-chain" ||
          label === "Receive USDC" ||
          label === "Request Payment"
        ) {
          return platformConfig.transferEnabled !== false;
        }
        if (label === "Swap USDC" || label === "Native Wallet Swap") {
          return platformConfig.swapEnabled !== false;
        }
        if (label === "Withdraw") {
          return platformConfig.withdrawEnabled !== false;
        }
        if (label === "ATM" || label === "CCPT Bridge") {
          return platformConfig.bridgeEnabled !== false;
        }
        if (label === "Staking Pool") {
          return platformConfig.stableStakeEnabled !== false;
        }
        if (label === "Pay/VA") {
          return platformConfig.vaEnabled !== false;
        }
        if (label === "DApp Browser") {
          return platformConfig.ecommerceEnabled !== false;
        }
        return true;
      });
    }, [selectedShortcuts, platformConfig]);

    const activeTabs = React.useMemo(() => {
      const tabs = [{ name: "My Wallet", icon: <Wallet size={20} /> }];
      if (platformConfig && platformConfig.ecommerceEnabled !== false) {
        tabs.push({ name: "E-commerce", icon: <ShoppingBag size={20} /> });
      }
      return tabs;
    }, [platformConfig]);

    useEffect(() => {
      if (activeRekeningTab >= activeTabs.length) {
        setActiveRekeningTab(0);
      }
    }, [activeTabs, activeRekeningTab]);

    return (
      <div className="flex flex-col h-full bg-[#ecf5fc] font-sans relative overflow-hidden">
        {/* Background shape that covers the top half */}
        <div className="absolute top-0 left-0 right-0 h-[40vh] md:h-[450px] bg-slate-900 rounded-b-[40px] md:rounded-b-[50px] z-0"></div>

        {/* Top Header */}
        <header className={`relative text-white ${isDesktop ? "px-10" : "px-5 md:px-8"} pt-4 md:pt-8 pb-3 flex justify-between items-center z-20 shrink-0`}>
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

          {/* Network Status Indicator */}
          <a
            href="https://testnet.arcscan.app"
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-end hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-1">
              <div className="relative flex h-1.5 w-1.5">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${isSyncing ? "animate-ping" : ""}`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isSyncing ? "bg-emerald-400" : "bg-emerald-600"}`}
                ></span>
              </div>
              <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider leading-none">
                {isSyncing ? "Syncing..." : "In Sync"}
              </span>
            </div>
            <span className="text-[7px] text-white/60 font-medium mt-0.5">
              {lastSyncTime
                ? `Last update: ${lastSyncTime.toLocaleTimeString()}`
                : "Arc Network Testnet"}
            </span>
          </a>
        </header>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto pb-[140px] pt-0 scrollbar-hide z-20 relative w-full flex flex-col items-center">
          <div className={`w-full ${isDesktop ? "max-w-none px-6" : "max-w-[700px] px-4 md:px-6 animate-in fade-in duration-300"}`}>
            <div className={`flex flex-col ${isDesktop ? "grid grid-cols-12 gap-6" : ""} mt-4`}>
              {/* Left Column for Desktop */}
              <div className={`${isDesktop ? "col-span-7 xl:col-span-8" : ""} flex flex-col gap-3`}>
                {/* Wrapping Accounts & Favorites for precise height alignment with Right Column feature popup on Desktop */}
                <div className={`flex flex-col gap-3 shrink-0 ${isDesktop ? "h-[680px]" : ""}`}>
                  {/* Accounts Section */}
                  <section className={`bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-slate-50/50 ${isDesktop ? "mx-0" : "mx-4"}`}>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
                    Accounts
                  </h2>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto gap-2 pt-1 pb-3 mb-4 scrollbar-hide text-[12px] font-medium relative">
                  {activeTabs.map((tab, i) => (
                    <div
                      key={tab.name}
                      onClick={() => setActiveRekeningTab(i)}
                      className={`px-4 pb-2 flex items-center justify-center gap-2 whitespace-nowrap min-w-max cursor-pointer transition-colors relative ${
                        activeRekeningTab === i
                          ? "text-slate-900 font-bold"
                          : "text-slate-400 font-medium hover:text-slate-600"
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
                  {activeTabs[activeRekeningTab]?.name === "My Wallet" && (
                    /* My Wallet Card (Visual Look) */
                    <WalletCard
                      userName={userName}
                      onNavigate={() => onNavigate("accountDetail")}
                    />
                  )}

                  {activeTabs[activeRekeningTab]?.name === "E-commerce" && (
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

                    {/* Real Recent Orders Section removed per user request */}
                  </AnimatePresence>

                <div className="mt-1 px-1">
                  <button
                    onClick={() => setOtherAccountsExpanded(!otherAccountsExpanded)}
                    className="w-full text-center text-slate-700 hover:text-slate-900 text-[12.5px] font-bold py-2 hover:bg-slate-50/80 rounded-xl transition-all active:scale-[0.98] flex justify-center items-center gap-2 border-[1.5px] border-slate-100 bg-white shadow-sm mt-2 cursor-pointer"
                  >
                    <span>Other Personal Savings & Checking</span>
                    {otherAccountsExpanded ? (
                      <ChevronUpIcon size={14} className="text-slate-500 transition-transform duration-300" />
                    ) : (
                      <ChevronDownIcon size={14} className="text-slate-500 transition-transform duration-300" />
                    )}
                  </button>

                  <AnimatePresence>
                    {otherAccountsExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 pb-1 flex flex-col gap-2 animate-in fade-in duration-300">
                          <div
                            onClick={() => displayToast("In Development")}
                            className="bg-white border-[1.5px] border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer group active:scale-[0.99] shadow-sm"
                          >
                            <div className="flex items-center gap-3 text-left">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-slate-800 border-[1.5px] border-slate-100 transition-colors shrink-0">
                                <Plus size={18} strokeWidth={2.5} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-[13.5px] tracking-tight">Connect New Account</span>
                                <span className="text-[10px] text-slate-400 mt-0.5">Link an external wallet or savings account</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] font-extrabold text-slate-700 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md tracking-wider uppercase">
                                ADD
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* Favorite Transactions Section */}
              <section className={`bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-slate-50/50 ${isDesktop ? "mb-0 mx-0 flex-1 flex flex-col justify-start" : "mb-3 mx-4"}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
                    Favorite Transactions
                  </h2>
                  <button
                    className="text-slate-800 p-2 hover:bg-slate-100 rounded-full transition-all active:scale-95 border-0 bg-transparent"
                    onClick={() => onNavigate("manageFavorites")}
                  >
                    <Settings2 size={18} strokeWidth={2} />
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-y-5 gap-x-2 justify-items-center">
                  {filteredShortcuts
                    .filter((item) => item.label !== "DApp Browser" && item.label !== "Transaction History" && item.label !== "Unified balance")
                    .map((item) => {
                      let mappedView = "";
                      if (
                        item.label === "Transfer USDC On-chain" ||
                        item.label === "Transfer USDC"
                      )
                        mappedView = "transfer";
                      if (
                        item.label === "Receive USDC" ||
                        item.label === "Request Payment"
                      )
                        mappedView = "receive";
                      if (item.label === "Pay with USDC") mappedView = "scanQR";
                      if (
                        item.label === "Native Wallet Swap" ||
                        item.label === "Swap USDC"
                      )
                        mappedView = "swap";
                      if (item.label === "Deposit/Withdraw")
                        mappedView = "depositOptions";
                      if (item.label === "Pay/VA") mappedView = "bayarVA";
                      if (item.label === "DApp Browser")
                        mappedView = "ecommerce";
                      if (item.label === "Staking Pool")
                        mappedView = "stablestake";
                      if (item.label === "Withdraw") mappedView = "withdraw";
                      if (item.label === "ATM" || item.label === "CCPT Bridge") mappedView = "bridge";
                      if (item.label === "Mint NFT") mappedView = "mintNFT";
                      if (item.label === "Security & Limits")
                        mappedView = "settings";
                      if (item.label === "Transaction History")
                        mappedView = "transactionHistory";

                      return (
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
                          isActive={
                            (activeView as string) === mappedView && mappedView !== ""
                          }
                          onClick={() => {
                            if (mappedView) onNavigate(mappedView as any);
                          }}
                        />
                      );
                    })}
                </div>

                {registeredUser?.email ===
                  (import.meta.env.VITE_ADMIN_EMAIL || "admin@admin.com") && (
                  <div
                    className="mt-6 bg-gradient-to-r from-slate-800 to-slate-900 py-3 px-4 rounded-xl flex items-center justify-between gap-3 border border-slate-700 relative cursor-pointer hover:bg-slate-700 transition-colors shadow-sm"
                    onClick={() => onNavigate("adminDashboard")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-700 p-2 rounded-lg text-white shrink-0 border border-slate-600 shadow-sm relative">
                        <ShieldCheck size={18} />
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-800"></div>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[13px] font-bold text-white leading-tight">
                          Admin Dashboard
                        </span>
                        <span className="text-[11px] text-slate-300">
                          Manage users, treasury & platform configs
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                )}

                {(!platformConfig ||
                  platformConfig.aiAgentEnabled !== false) && !isDesktop && (
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
                          Lounge Assistant
                        </span>
                        <span className="text-[11.5px] text-slate-500">
                          Help you manage your wallet
                        </span>
                      </div>
                    </div>
                    <div className="bg-white rounded-full p-1 shadow-sm text-slate-800 shrink-0 border border-indigo-50">
                      <ChevronRight size={14} />
                    </div>
                  </div>
                )}
              </section>
              </div>

              {/* Special For You (Promo Banner) */}
              <section className={`bg-white rounded-[24px] overflow-hidden shadow-sm pb-4 border border-x-transparent border-t-transparent border-b-slate-50 relative z-10 ${isDesktop ? "mb-0 mx-0 mt-8" : "mb-4 mx-4"}`}>
                <div className="px-5 pt-5 pb-3">
                  <h2 className="text-[17px] font-bold text-slate-800 tracking-tight mb-0 text-left">
                    Special For You
                  </h2>
                </div>
                <div
                  ref={promoScrollRef}
                  onScroll={handlePromoScroll}
                  className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory touch-pan-x"
                  style={{ scrollBehavior: "smooth" }}
                >
                  <div className="w-full shrink-0 snap-center px-5">
                    <div className="w-full h-[140px] bg-gradient-to-r from-blue-700 to-blue-800 rounded-2xl p-5 relative overflow-hidden text-white flex flex-col justify-center shadow-inner text-left">
                      <div className="absolute right-0 top-0 h-full w-1/2 bg-[url('https://images.unsplash.com/photo-1556740714-a82f3a479426?q=80&w=150&auto=format&fit=crop')] bg-cover mix-blend-overlay opacity-30"></div>
                      <h3 className="font-bold text-[16px] leading-tight w-2/3 relative z-10">
                        Opening a Checking Account is Easier...
                      </h3>
                      <button className="mt-3 bg-white text-slate-800 text-[13px] font-bold px-4 py-2 rounded-lg w-max relative z-10 border-0 active:scale-95 transition-transform">
                        Open Now
                      </button>
                    </div>
                  </div>
                  <div className="w-full shrink-0 snap-center px-5">
                    <div className="w-full h-[140px] bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 relative overflow-hidden text-white flex flex-col justify-center shadow-inner text-left">
                      <h3 className="font-bold text-[16px] leading-tight w-2/3 relative z-10">
                        Disburse Loan Up To 5,000 USDC
                      </h3>
                      <button className="mt-3 bg-white text-emerald-600 text-[13px] font-bold px-4 py-2 rounded-lg w-max relative z-10 border-0 active:scale-95 transition-transform">
                        Check Limit
                      </button>
                    </div>
                  </div>
                  <div className="w-full shrink-0 snap-center px-5">
                    <div className="w-full h-[140px] bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl p-5 relative overflow-hidden text-white flex flex-col justify-center shadow-inner text-left">
                      <div className="absolute right-0 top-0 h-full w-1/2 bg-[url('https://images.unsplash.com/photo-1556740714-a82f3a479426?q=80&w=150&auto=format&fit=crop')] bg-cover mix-blend-overlay opacity-30"></div>
                      <h3 className="font-bold text-[16px] leading-tight w-2/3 relative z-10">
                        Limited Time: 5% USDC Cash Back
                      </h3>
                      <button className="mt-3 bg-white text-red-500 text-[13px] font-bold px-4 py-2 rounded-lg w-max relative z-10 border-0 active:scale-95 transition-transform">
                        Claim Now
                      </button>
                    </div>
                  </div>
                  <div className="w-full shrink-0 snap-center px-5">
                    <div className="w-full h-[140px] bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-5 relative overflow-hidden text-white flex flex-col justify-center shadow-inner text-left">
                      <h3 className="font-bold text-[16px] leading-tight w-2/3 relative z-10">
                        Access DApps Securely with Arc
                      </h3>
                      <button className="mt-3 bg-white text-indigo-600 text-[13px] font-bold px-4 py-2 rounded-lg w-max relative z-10 border-0 active:scale-95 transition-transform">
                        Explore Layer-1
                      </button>
                    </div>
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

              {/* Moved Bottom Sections inside Left Column */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 relative z-10 w-full mb-8">
                <div className={`flex flex-col gap-6 w-full max-w-[500px] mx-auto ${isDesktop ? "max-w-none" : ""}`}>
                  {/* Dapps */}
                  {/* External DApps */}
                  {(!platformConfig ||
                    platformConfig.swapEnabled !== false ||
                    platformConfig.arcBirdEnabled !== false ||
                    platformConfig.stableStakeEnabled !== false) && (
                    <section className={`bg-white rounded-[24px] p-5 shadow-sm text-left ${isDesktop ? "mb-0 mx-0" : "mb-4 mx-4"}`}>
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex flex-col">
                          <h2 className="text-[17px] font-bold text-slate-800 tracking-tight font-sans">
                            External DApps
                          </h2>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight max-w-[200px]">
                            Connect to decentralized applications on the Arc
                            Network securely.
                          </p>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-0 p-1">
                          <Search size={18} strokeWidth={2.5} />
                        </button>
                      </div>

                      <div className="flex flex-col gap-3">
                        {/* ArcSwap */}
                        {(!platformConfig ||
                          platformConfig.swapEnabled !== false) && (
                          <div
                            onClick={() => {
                              // Show a toast message to simulate opening an external browser
                              displayToast(
                                "Opening external web browser to ArcSwap...",
                              );
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
                              <p className="text-[13px] text-slate-400 truncate mt-0.5 font-sans">
                                Swap USDC with Arc Native Tokens
                              </p>
                            </div>
                            <ChevronRight
                              size={16}
                              className="text-slate-400"
                            />
                          </div>
                        )}

                        {/* ArcBird Mini-Game */}
                        {(!platformConfig ||
                          platformConfig.arcBirdEnabled !== false) && (
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
                              <p className="text-[13px] text-slate-400 truncate mt-0.5 font-sans">
                                Tap to Jump & earn USDC rewards
                              </p>
                            </div>
                            <ChevronRight
                              size={16}
                              className="text-slate-400"
                            />
                          </div>
                        )}

                        {/* StableStake Vault */}
                        {(!platformConfig ||
                          platformConfig.stableStakeEnabled !== false) && (
                          <div
                            onClick={() => {
                              onNavigate("stablestake");
                            }}
                            className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all active:scale-[0.98]"
                          >
                            <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-sm">
                              <TrendingUp size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-[14px] text-slate-800 font-sans tracking-tight">
                                  Circle Earn
                                </h4>
                                <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded font-sans uppercase">
                                  DeFi Yield
                                </span>
                              </div>
                              <p className="text-[13px] text-slate-500 truncate mt-0.5 font-sans">
                                Hubungkan USDC Anda ke protokol DeFi
                              </p>
                            </div>
                            <ChevronRight
                              size={16}
                              className="text-slate-400"
                            />
                          </div>
                        )}
                      </div>
                    </section>
                  )}
                </div>

                <div className={`flex flex-col gap-6 w-full max-w-[500px] mx-auto ${isDesktop ? "max-w-none" : ""}`}>
                  <section className={`bg-white rounded-[24px] p-5 shadow-sm ${isDesktop ? "mx-0 mb-0" : "mx-4 mb-4"}`}>
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
                        className="text-slate-800 p-2 hover:bg-slate-100 rounded-full transition-all active:scale-95 border-0 bg-transparent"
                      >
                        <Settings2 size={18} strokeWidth={2} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold text-sm bg-slate-100 px-3 py-1.5 rounded-lg w-fit">
                      <TrendingUp size={16} /> Volume
                    </div>

                    <div className="flex flex-col gap-4">
                      <AnimatePresence>
                        {marketTokens
                          .filter((t) => visibleTokenCodes.includes(t.code))
                          .map((token) => (
                            <motion.div
                              key={token.code}
                              layout
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <StockRow
                                code={token.code}
                                name={token.name}
                                price={formatPrice(token.price)}
                                change={formatChange(
                                  token.change,
                                  token.isDown,
                                )}
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

                  {/* Developer Services (Mobile Only) */}
                  {!isDesktop && (!platformConfig ||
                    platformConfig.merchantEnabled !== false ||
                    platformConfig.faucetEnabled !== false) && (
                    <section className="bg-white rounded-[24px] p-5 shadow-sm mx-4 mb-8">
                      <h2 className="text-[17px] font-bold text-slate-800 tracking-tight mb-4 text-left">
                        Services
                      </h2>
                      <div
                        className={`grid ${!platformConfig || (platformConfig.merchantEnabled !== false && platformConfig.faucetEnabled !== false) ? "grid-cols-2" : "grid-cols-1"} gap-3`}
                      >
                        {(!platformConfig ||
                          platformConfig.merchantEnabled !== false) && (
                          <ProductCard
                            title="Merchant Dashboard"
                            desc="Manage your stock"
                            icon={<Box size={20} className="text-slate-600" />}
                            onClick={() => onNavigate("merchant")}
                          />
                        )}
                        {(!platformConfig ||
                          platformConfig.faucetEnabled !== false) && (
                          <ProductCard
                            title="Testnet Faucet"
                            desc="Claim USDC Gas Token."
                            icon={
                              <Coins size={20} className="text-slate-600" />
                            }
                            onClick={() => onNavigate("faucet")}
                          />
                        )}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column for Desktop / Landscape Tablet */}
            {isDesktop && (
              <div className="col-span-5 xl:col-span-4 flex relative z-20 flex-col gap-6 w-full lg:max-w-[500px]">
                {desktopRightColumn && (
                  <div className="rounded-[24px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden border border-slate-100 w-full max-w-[500px] mx-auto relative z-20 flex flex-col h-[680px]">
                    {desktopRightColumn}
                  </div>
                )}

                {/* Developer Services (Desktop Only) */}
                {(!platformConfig ||
                  platformConfig.merchantEnabled !== false ||
                  platformConfig.faucetEnabled !== false) && (
                  <section className="bg-white rounded-[24px] p-5 shadow-sm w-full max-w-[500px] mx-auto">
                    <h2 className="text-[17px] font-bold text-slate-800 tracking-tight mb-4 text-left">
                      Services
                    </h2>
                    <div
                      className={`grid ${!platformConfig || (platformConfig.merchantEnabled !== false && platformConfig.faucetEnabled !== false) ? "grid-cols-2" : "grid-cols-1"} gap-3`}
                    >
                      {(!platformConfig ||
                        platformConfig.merchantEnabled !== false) && (
                        <ProductCard
                          title="Merchant Dashboard"
                          desc="Manage your stock"
                          icon={<Box size={20} className="text-slate-600" />}
                          onClick={() => onNavigate("merchant")}
                        />
                      )}
                      {(!platformConfig ||
                        platformConfig.faucetEnabled !== false) && (
                        <ProductCard
                          title="Testnet Faucet"
                          desc="Claim USDC Gas Token."
                          icon={<Coins size={20} className="text-slate-600" />}
                          onClick={() => onNavigate("faucet")}
                        />
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Aesthetic Bottom Navigation Wrapper with Cutout Notch */}
        {!isDesktop && (
          <div
            className="fixed bottom-0 left-0 right-0 z-35 pointer-events-none"
            style={{ filter: "drop-shadow(0 -5px 15px rgba(0,0,0,0.06))" }}
          >
            {/* The Masked White Nav Bar */}
            <nav
              className="relative bg-white h-[75px] md:h-[85px] px-6 pb-2 flex items-center justify-between pointer-events-auto rounded-t-2xl md:rounded-t-3xl"
              style={{
                maskImage:
                  platformConfig?.scanQrEnabled === false
                    ? "none"
                    : "radial-gradient(circle at 50% 0px, transparent 34px, black 35px)",
                WebkitMaskImage:
                  platformConfig?.scanQrEnabled === false
                    ? "none"
                    : "radial-gradient(circle at 50% 0px, transparent 34px, black 35px)",
              }}
            >
              <NavItem icon={<Home size={22} />} label="Home" active />
              <NavItem
                icon={<Mail size={22} />}
                label="Inbox"
                onClick={() => onNavigate("inbox")}
                badge={
                  unreadCount > 0 ? (
                    <span className="absolute -top-2 -right-2 h-4 min-w-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold px-1 rounded-full border-2 border-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : undefined
                }
              />
              {(!platformConfig || platformConfig.scanQrEnabled !== false) && (
                <div className="w-[50px] md:w-[60px] shrink-0"></div>
              )}
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
            {(!platformConfig || platformConfig.scanQrEnabled !== false) && (
              <div className="absolute left-1/2 -translate-x-1/2 top-[-28px] pointer-events-auto">
                <div
                  className="relative group cursor-pointer flex flex-col items-center justify-center active:scale-[0.98] transition-all duration-300"
                  onClick={() => onNavigate("scanQR")}
                >
                  <div className="relative w-[56px] h-[56px] bg-slate-900 rounded-full flex flex-col items-center justify-center text-white shadow-[0_8px_24px_rgba(15,23,42,0.25)] transform transition-transform duration-300 group-hover:-translate-y-1 border-2 border-white/10">
                    <Scan size={26} strokeWidth={2.2} />
                    <span className="text-[9px] font-bold mt-0.5 tracking-tight uppercase">
                      Pay
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Deposit/Withdraw Initial Modal */}

        {/* Manage Token Markets Modal */}
        <AnimatePresence>
          {showManageMarketModal && (
            <div className="absolute inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setShowManageMarketModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 15 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                className="bg-white rounded-[32px] p-6 w-full max-w-[340px] relative z-10 shadow-2xl flex flex-col"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-[18px] text-slate-800">
                    Manage Markets
                  </h3>
                  <button
                    onClick={() => setShowManageMarketModal(false)}
                    className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:text-red-500 transition-colors border-0 pointer-events-auto cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Select the tokens you want to display on the live market feed
                  home page.
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
                          <span className="font-bold text-[14px] text-slate-800 leading-none mb-1">
                            {token.code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {token.name}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${visibleTokenCodes.includes(token.code) ? "bg-slate-900 text-white shadow-lg shadow-blue-200" : "bg-white border-2 border-slate-200 text-transparent"}`}
                      >
                        <Check size={14} strokeWidth={4} />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowManageMarketModal(false)}
                  className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-[14px] transition-all hover:bg-slate-800 active:scale-[0.95] mt-8 shadow-xl shadow-slate-900/10 cursor-pointer border-0"
                >
                  Save Configuration
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
