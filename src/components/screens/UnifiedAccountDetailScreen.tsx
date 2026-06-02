import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Send,
  Receipt,
  Plus,
  CreditCard,
  Search,
  Calendar,
  ArrowUpRight,
  Loader2,
  Clock,
  CheckCircle2,
  Eye,
  EyeOff,
  ShoppingBag,
  RefreshCw,
  Hexagon,
  Trash2,
  X,
  Settings2,
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { UIDCard } from "../common/UIDCard";
import { useStore } from "../../store/useStore";
import { Transaction } from "../../types";
import { TokenIcon } from "../ui/TokenIcon";

interface UnifiedAccountDetailScreenProps {
  onBack: () => void;
  onTransfer: () => void;
  onReceive: () => void;
  onTransactionClick?: (tx: Transaction) => void;
  userName?: string;
}

export function UnifiedAccountDetailScreen({
  onBack,
  onTransfer,
  onReceive,
  onTransactionClick,
  userName = "NOVEMBER",
}: UnifiedAccountDetailScreenProps) {
  const [activeTab, setActiveTab] = useState<"history" | "asset">("asset");
  const [assetSubTab, setAssetSubTab] = useState<"tokens" | "nfts">("tokens");
  const [mintedNfts, setMintedNfts] = useState<any[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("minted_nfts");
      if (stored) {
        setMintedNfts(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load minted NFTs in UnifiedAccountDetailScreen:", e);
    }
  }, [activeTab, assetSubTab]);

  const [showUID, setShowUID] = useState(false);
  const {
    transactions,
    showBalance,
    activeFilter,
    setActiveFilter,
    displayToast,
  } = useApp();

  const { registeredUser, activeAccountType, unifiedBalance } = useStore();
  
  const themeClasses = React.useMemo(() => ({
    header: activeAccountType === "unified" ? "from-teal-700 to-teal-950" : "from-slate-800 to-slate-900",
    accent: activeAccountType === "unified" ? "bg-teal-400/30" : "bg-blue-400/30",
    button: activeAccountType === "unified" ? "bg-teal-600 shadow-teal-500/20" : "bg-slate-800 shadow-slate-500/20",
  }), [activeAccountType]);

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Received") return tx.type === "deposit";
    if (activeFilter === "Sent")
      return ["withdraw", "transfer", "purchase", "batchTransfer"].includes(
        tx.type,
      );
    if (activeFilter === "Swaps") return tx.type === "swap";
    if (activeFilter === "Bridge") return tx.type === "bridge";
    return true;
  });

  const getTxIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownToLine size={20} className="text-emerald-500" />;
      case "withdraw":
        return <ArrowUpRight size={20} className="text-red-500" />;
      case "transfer":
        return <ArrowUpRight size={20} className="text-orange-500" />;
      case "purchase":
        return <ShoppingBag size={20} className="text-purple-500" />;
      case "swap":
        return <RefreshCw size={20} className="text-slate-600" />;
      case "bridge":
        return <Hexagon size={20} className="text-blue-500" />;
      default:
        return <Receipt size={20} className="text-slate-500" />;
    }
  };

  const getTxBg = (type: string) => {
    switch (type) {
      case "deposit":
        return "bg-emerald-50 border-emerald-100";
      case "withdraw":
        return "bg-red-50 border-red-100";
      case "transfer":
        return "bg-orange-50 border-orange-100";
      case "purchase":
        return "bg-purple-50 border-purple-100";
      case "swap":
        return "bg-slate-100 border-slate-200";
      case "bridge":
        return "bg-blue-50 border-blue-100";
      default:
        return "bg-slate-50 border-slate-100";
    }
  };

  const [showCard, setShowCard] = useState(false);

  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50 animate-in slide-in-from-right duration-300 overflow-hidden">
      {/* Top Header Section - Blue Gradient */}
      <div className={`bg-gradient-to-b ${themeClasses.header} pt-12 pb-24 px-4 relative shrink-0 z-10 flex flex-col items-center overflow-hidden w-full`}>
        {/* Background abstract curves */}
        <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-white/10 rounded-full blur-2xl"></div>
        <div className={`absolute bottom-[-30px] left-[-30px] w-[150px] h-[150px] ${themeClasses.accent} rounded-full blur-xl`}></div>

        <button
          onClick={onBack}
          className="absolute left-4 top-10 p-2 hover:bg-white/10 rounded-full transition-colors z-20"
        >
          <ArrowLeft size={24} className="text-white" />
        </button>

        {/* Action Buttons Row */}
        <div className="flex justify-center gap-[32px] mt-2 w-full z-10 px-2">
          <DetailActionButton
            icon={<Send size={20} />}
            label={`Transfer\nUnified`}
            onClick={onTransfer}
          />
          <DetailActionButton
            icon={<ArrowDownToLine size={20} />}
            label={`Receive\nUnified`}
            onClick={onReceive}
          />
          <DetailActionButton
            icon={<CreditCard size={20} />}
            label={`Card`}
            isGlow
            onClick={() => setShowCard(true)}
          />
        </div>
      </div>

      {/* Main Content Area - White background overlaps the teal */}
      <div className="flex-1 bg-white rounded-t-[32px] -mt-8 z-20 relative overflow-hidden flex flex-col shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <div className="px-6 pt-6 pb-2 shrink-0 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div
              className={`flex flex-col items-center border-b-[2.5px] pb-1.5 px-1 cursor-pointer transition-colors ${activeTab === "asset" ? "border-slate-900" : "border-transparent"}`}
              onClick={() => {
                setActiveTab("asset");
              }}
            >
              <h3
                className={`font-bold text-[14px] ${activeTab === "asset" ? "text-slate-800" : "text-slate-400"}`}
              >
                Assets
              </h3>
            </div>
            <div
              className={`flex flex-col items-center border-b-[2.5px] pb-1.5 px-1 cursor-pointer transition-colors ${activeTab === "history" ? "border-slate-900" : "border-transparent"}`}
              onClick={() => {
                setActiveTab("history");
              }}
            >
              <h3
                className={`font-bold text-[14px] ${activeTab === "history" ? "text-slate-800" : "text-slate-400"}`}
              >
                History
              </h3>
            </div>
          </div>
        </div>

        {activeTab === "history" && (
          <>
            <div className="flex items-center px-4 py-3 shrink-0 justify-between">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide py-1 text-[13px] text-slate-500 font-medium">
                {(["All", "Received", "Sent", "Swaps", "Bridge"] as const).map(
                  (filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`whitespace-nowrap px-1 ${activeFilter === filter ? "text-slate-800 font-bold border-b-[2.5px] border-slate-800 pb-1" : ""}`}
                    >
                      {filter}
                    </button>
                  ),
                )}
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
                  filteredTransactions.map((tx, idx) => (
                    <div
                      key={tx.id || `uni-tx-${idx}`}
                      onClick={() => {
                        if (onTransactionClick) {
                          onTransactionClick(tx);
                        }
                      }}
                      className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 ${getTxBg(tx.type)}`}
                        >
                          {getTxIcon(tx.type)}
                        </div>
                        <div>
                          <h3 className="font-bold text-[15px] text-slate-800 leading-tight">
                            {tx.title}
                          </h3>
                          <p className="text-[12px] text-slate-500 mt-0.5">
                            {tx.timestamp} •{" "}
                            {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span
                          className={`font-bold text-[15px] ${tx.amount.startsWith("+") ? "text-emerald-500" : "text-slate-800"}`}
                        >
                          {tx.amount} {tx.currency}
                        </span>
                        {tx.status === "success" ? (
                          <div className="flex items-center gap-1 mt-1 text-emerald-500 bg-emerald-50/50 px-2 py-0.5 rounded-full border border-emerald-100">
                            <CheckCircle2 size={10} />
                            <span className="text-[9px] font-black uppercase tracking-wider">
                              SUCCESS
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 mt-1 text-amber-500 bg-amber-50/50 px-2 py-0.5 rounded-full border border-amber-100">
                            <Clock size={10} />
                            <span className="text-[9px] font-black uppercase tracking-wider">
                              {tx.status}
                            </span>
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

        {activeTab === "asset" && (
          <div className="flex-1 overflow-y-auto px-5 py-5 pb-24 bg-slate-50/50 flex flex-col gap-5">
            {/* Sub-tabs */}
            <div className="flex gap-1.5 p-1 bg-slate-200/60 rounded-2xl w-full select-none shrink-0 border border-slate-100">
              <button
                onClick={() => setAssetSubTab("tokens")}
                className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all border-0 cursor-pointer ${
                  assetSubTab === "tokens"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "bg-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Token List
              </button>
              <button
                onClick={() => setAssetSubTab("nfts")}
                className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all border-0 cursor-pointer ${
                  assetSubTab === "nfts"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "bg-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                NFT List
              </button>
            </div>

            {assetSubTab === "tokens" ? (
              <div className="bg-white rounded-[24px] border border-slate-200/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
                {/* USDC Unified Token Row */}
                <div className="p-4 flex justify-between items-center hover:bg-slate-50/75 transition-colors cursor-pointer border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <TokenIcon
                      contractAddress="0x3600000000000000000000000000000000000000"
                      symbol="USD"
                      className="w-12 h-12"
                      color="bg-teal-600"
                    />
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-slate-800 text-[15px] leading-tight">
                        USD Coin (Unified)
                      </span>
                      <span className="text-[12px] text-slate-500 mt-0.5">
                        USD • Unified Wallet
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-[16px] text-slate-800 font-mono">
                      {showBalance
                        ? (unifiedBalance || 0) === 0
                          ? "0"
                          : (unifiedBalance || 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                        : "••••"}
                    </span>
                    <span className="text-[12px] text-slate-400 font-medium tracking-wide">
                      {showBalance
                        ? (unifiedBalance || 0) === 0
                          ? "0"
                          : `~$${(unifiedBalance || 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                        : "••••"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* NFT List Panel */
              <div className="grid grid-cols-2 gap-4 pb-12 w-full">
                {[
                  ...mintedNfts,
                  {
                    id: "0xgenesisnftpass777",
                    name: "Arc Genesis Pass #459",
                    description: "Elite membership Pass",
                    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop",
                    txHash: "0x89eeef21db0f17a81df101239"
                  },
                  {
                    id: "0xpioneersstable666",
                    name: "StablePioneer Diamond",
                    description: "Lounge Stablecoin Master",
                    image: "https://images.unsplash.com/photo-1644024541215-68e83fdf0840?q=80&w=300&auto=format&fit=crop",
                    txHash: "0x12a9efb8b2e59df6f15777aa"
                  }
                ].map((nft, idx) => (
                  <motion.div
                    key={nft.id + idx}
                    whileHover={{ 
                      scale: 1.03, 
                      boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.08)",
                      borderColor: "rgba(15, 23, 42, 0.15)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="bg-white rounded-3xl border border-slate-200/50 overflow-hidden shadow-sm flex flex-col group cursor-pointer"
                  >
                    <div className="h-32 w-full bg-slate-50 relative overflow-hidden">
                      <img
                        src={nft.image}
                        alt={nft.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/20">
                        Arc
                      </div>
                    </div>
                    <div className="p-3.5 flex flex-col text-left">
                      <span className="font-bold text-[13px] text-slate-800 truncate leading-snug">
                        {nft.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                        {nft.description}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
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
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mt-4 mb-6"></div>

            <div className="px-6 w-full flex flex-col items-center">
              <h3 className="font-bold text-[18px] text-slate-800 mb-6">
                Your UID Card
              </h3>

              <UIDCard userName={userName} isBlurred={!showUID} />

              <div className="flex justify-center w-full mt-8 border-t border-slate-100 pt-6">
                <div
                  onClick={() => setShowUID(!showUID)}
                  className="flex flex-col items-center gap-2 cursor-pointer group"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform group-active:scale-95 ${showUID ? "bg-slate-100 text-slate-600" : "bg-slate-100 text-slate-800"}`}
                  >
                    {showUID ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                  <span className="text-[12px] font-medium text-slate-600">
                    {showUID ? "Hide UID" : "View UID"}
                  </span>
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

function DetailActionButton({
  icon,
  label,
  badge,
  onClick,
  isGlow,
}: DetailActionButtonProps) {
  return (
    <div
      className="flex flex-col items-center gap-2 group cursor-pointer w-16"
      onClick={onClick}
    >
      <div
        className={`w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.1)] group-active:scale-95 transition-all relative
        ${isGlow ? "text-slate-800 shadow-[inset_0_0_12px_rgba(63,162,246,0.3),0_4px_12px_rgba(0,0,0,0.1)] border border-blue-50/50" : "text-slate-800"}`}
      >
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

// ArrowDownToLine fallback icon
function ArrowDownToLine({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 17V3" />
      <path d="m6 11 6 6 6-6" />
      <path d="M19 21H5" />
    </svg>
  );
}
