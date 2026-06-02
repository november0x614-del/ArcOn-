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
  Coins,
  Eye,
  ArrowDownToLine,
  ShoppingBag,
  RefreshCw,
  Clock,
  CheckCircle2,
  EyeOff,
  ChevronDown,
  Zap,
  ShieldCheck,
  Trash2,
  X,
  Settings2,
  Hexagon,
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { UIDCard } from "../common/UIDCard";
import { useBalances } from "../../hooks/useBalances";
import { useStore } from "../../store/useStore";
import { Transaction } from "../../types";
import {
  ARC_TOKEN_REGISTRY,
  syncTokenWithArcScan,
} from "../../lib/arcRegistry";
import { TokenIcon } from "../ui/TokenIcon";
import { BackendClient } from "../../services/api";
import { useDebounce } from "../../hooks/useDebounce";

interface AccountDetailScreenProps {
  onBack: () => void;
  onTransfer: () => void;
  onReceive: () => void;
  onTransactionClick?: (tx: Transaction) => void;
  userName?: string;
}

export function AccountDetailScreen({
  onBack,
  onTransfer,
  onReceive,
  onTransactionClick,
  userName = "ALEXANDER D",
}: AccountDetailScreenProps) {
  const [activeTab, setActiveTab] = useState<"history" | "asset">("history");
  const [assetSubTab, setAssetSubTab] = useState<"tokens" | "nfts">("tokens");
  const { mintedNfts } = useStore();

  const [showUID, setShowUID] = useState(false);
  const {
    transactions,
    showBalance,
    balance,
    activeFilter,
    setActiveFilter,
    importedTokens,
    importToken,
    removeToken,
    displayToast,
  } = useApp();

  const { data: balanceData } = useBalances();
  const { registeredUser } = useStore();
  const [liveCustomBalances, setLiveCustomBalances] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    if (
      !registeredUser?.supabaseUid ||
      !importedTokens ||
      importedTokens.length === 0
    ) {
      setLiveCustomBalances({});
      return;
    }

    const controller = new AbortController();

    const fetchLiveCustomBalances = async () => {
      try {
        const contracts = importedTokens
          .map((t) => t.contractAddress)
          .join(",");
        const response = await fetch(
          `/api/balance/${registeredUser.supabaseUid}/tokens?contracts=${contracts}`,
          {
            signal: controller.signal,
          },
        );
        if (response.ok) {
          const data = await response.json();
          if (data && data.balances && !controller.signal.aborted) {
            setLiveCustomBalances(data.balances);
          }
        }
      } catch (error) {
        if ((error as any).name !== "AbortError") {
          console.error(
            "Failed to fetch live custom token balances on-chain:",
            error,
          );
        }
      }
    };

    fetchLiveCustomBalances();
    const interval = setInterval(fetchLiveCustomBalances, 15000);
    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [registeredUser?.supabaseUid, importedTokens]);

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
  const [isManageMode, setIsManageMode] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState<"popular" | "custom">("popular");
  const [customAddress, setCustomAddress] = useState("");
  const [customSymbol, setCustomSymbol] = useState("");
  const [customName, setCustomName] = useState("");
  const [customDecimals, setCustomDecimals] = useState("18");
  const [isResolving, setIsResolving] = useState(false);
  const [popularCatalog, setPopularCatalog] = useState<any[]>([]);

  const debouncedAddress = useDebounce(customAddress, 600);

  // Fetch popular tokens from API
  useEffect(() => {
    if (showImportModal && importTab === "popular") {
      BackendClient.getTokens().then((tokens) => {
        if (tokens && Array.isArray(tokens)) {
          setPopularCatalog(
            tokens.map((t) => ({
              ...t,
              initialBalance: Math.random() * 500 + 100, // Still mock balance for newly imported
              usdPrice: 1.0,
              type: t.type || "ArcScan Verified Token",
            })),
          );
        }
      });
    }
  }, [showImportModal, importTab]);

  // Auto-resolve custom token details
  useEffect(() => {
    if (
      debouncedAddress &&
      debouncedAddress.startsWith("0x") &&
      debouncedAddress.length >= 42
    ) {
      const resolve = async () => {
        setIsResolving(true);
        try {
          const metadata = await BackendClient.resolveToken(debouncedAddress);
          if (metadata && metadata.symbol) {
            setCustomSymbol(metadata.symbol || "");
            setCustomName(metadata.name || "");
            setCustomDecimals(String(metadata.decimals || "18"));
            displayToast(`Detected ${metadata.symbol} from chain`);
          } else {
            displayToast("Invalid contract address or not a token on Arc Scan");
            setCustomSymbol("");
            setCustomName("");
          }
        } catch (e) {
          console.warn("Failed to resolve token address", e);
        } finally {
          setIsResolving(false);
        }
      };
      resolve();
    }
  }, [debouncedAddress]);

  const handleImportCustom = () => {
    if (!customAddress || !customSymbol || !customName) {
      displayToast("Please fill all required custom token fields");
      return;
    }

    if (!customAddress.startsWith("0x") || customAddress.length < 20) {
      displayToast("Invalid Arc-style contract address");
      return;
    }

    const dec = parseInt(customDecimals) || 18;
    const mockBalance = Math.floor(Math.random() * 850) + 150;

    const colors = [
      "bg-indigo-600",
      "bg-violet-600",
      "bg-fuchsia-600",
      "bg-orange-500",
      "bg-pink-500",
      "bg-emerald-600",
      "bg-cyan-500",
    ];
    const charCodeSum = customSymbol
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const chosenColor = colors[charCodeSum % colors.length];

    importToken({
      symbol: customSymbol.toUpperCase(),
      name: customName,
      decimals: dec,
      contractAddress: customAddress,
      balance: mockBalance,
      usdPrice: 1.0,
      color: chosenColor,
    });

    displayToast(
      `${customSymbol.toUpperCase()} Custom Token imported successfully!`,
    );

    setCustomAddress("");
    setCustomSymbol("");
    setCustomName("");
    setCustomDecimals("18");
    setShowImportModal(false);
    setIsManageMode(false);
  };

  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50 animate-in slide-in-from-right duration-300 overflow-hidden">
      {/* Top Header Section - Blue Gradient */}
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 pt-12 pb-24 px-4 relative shrink-0 z-10 flex flex-col items-center overflow-hidden w-full">
        {/* Background abstract curves */}
        <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-30px] left-[-30px] w-[150px] h-[150px] bg-blue-400/30 rounded-full blur-xl"></div>

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
            label={`Transfer\nUSDC`}
            onClick={onTransfer}
          />
          <DetailActionButton
            icon={<ArrowDownToLine size={20} />}
            label={`Receive\nUSDC`}
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

      {/* Main Content Area - White background overlaps the blue */}
      <div className="flex-1 bg-white rounded-t-[32px] -mt-8 z-20 relative overflow-hidden flex flex-col shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <div className="px-6 pt-6 pb-2 shrink-0 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div
              className={`flex flex-col items-center border-b-[2.5px] pb-1.5 px-1 cursor-pointer transition-colors ${activeTab === "asset" ? "border-slate-900" : "border-transparent"}`}
              onClick={() => {
                setActiveTab("asset");
                setIsManageMode(false);
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
                setIsManageMode(false);
              }}
            >
              <h3
                className={`font-bold text-[14px] ${activeTab === "history" ? "text-slate-800" : "text-slate-400"}`}
              >
                History
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {activeTab === "asset" && assetSubTab === "tokens" && (
              <button
                onClick={() => setIsManageMode(!isManageMode)}
                className={`p-2 rounded-full transition-all active:scale-90 ${isManageMode ? "bg-red-50 text-red-500" : "text-slate-900 bg-slate-100/50"}`}
              >
                {isManageMode ? (
                  <X size={18} />
                ) : (
                  <Settings2 size={18} strokeWidth={2} />
                )}
              </button>
            )}
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
                  filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      onClick={() => {
                        if (onTransactionClick) {
                          if (true) {
                            onTransactionClick(tx);
                          } else {
                            /* dead branch */
                          }
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
        )}        {activeTab === "asset" && (
          <div className="flex-1 overflow-y-auto px-5 py-5 pb-24 bg-slate-50/50 flex flex-col gap-5">
            {/* Minimalist Sub-tabs Selection */}
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
                {/* USDC Token Row */}
                <div className="p-4 flex justify-between items-center hover:bg-slate-50/75 transition-colors cursor-pointer border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <TokenIcon
                      contractAddress="0x3600000000000000000000000000000000000000"
                      symbol="USDC"
                      className="w-12 h-12"
                      color="bg-blue-100"
                    />
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-slate-800 text-[15px] leading-tight">
                        USD Coin
                      </span>
                      <span className="text-[12px] text-slate-500 mt-0.5">
                        USDC • Stablecoin
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-[16px] text-slate-800 font-mono">
                      {showBalance
                        ? (balance || 0) === 0
                          ? "0"
                          : (balance || 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                        : "••••"}
                    </span>
                    <span className="text-[12px] text-slate-400 font-medium tracking-wide">
                      {showBalance
                        ? (balance || 0) === 0
                          ? "0"
                          : `~$${(balance || 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                        : "••••"}
                    </span>
                  </div>
                </div>

                {/* Imported Tokens List */}
                {importedTokens.map((token) => (
                  <div
                    key={token.symbol}
                    className="p-4 flex justify-between items-center hover:bg-slate-50/75 transition-colors cursor-pointer border-b border-slate-100 relative overflow-hidden"
                  >
                    <div className="flex items-center gap-4">
                      <TokenIcon
                        contractAddress={token.contractAddress}
                        symbol={token.symbol}
                        className="w-11 h-11"
                        color={token.color || "bg-slate-800"}
                      />
                      <div className="flex flex-col text-left max-w-[150px] sm:max-w-[200px]">
                        <span className="font-bold text-slate-800 text-[15px] leading-tight">
                          {token.name || token.symbol}
                        </span>
                        <div className="text-[12px] text-slate-500 mt-0.5">
                          {token.symbol} •{" "}
                          {[
                            "USDC",
                            "EURC",
                            "USDT",
                            "PYUSD",
                            "USDE",
                            "DAI",
                          ].includes(token.symbol.toUpperCase())
                            ? "Stablecoin"
                            : token.symbol.toUpperCase().includes("BTC") ||
                                token.symbol.toUpperCase().includes("ETH")
                              ? "Wrapped Token"
                              : "Utility Token"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-[15.5px] text-slate-800 font-mono">
                          {showBalance
                            ? (() => {
                                const amt =
                                  liveCustomBalances[
                                    token.contractAddress?.toLowerCase().trim() ||
                                      ""
                                  ] !== undefined
                                    ? liveCustomBalances[
                                        token.contractAddress
                                          ?.toLowerCase()
                                          .trim() || ""
                                      ]
                                    : token.balance || 0;
                                return amt === 0
                                  ? "0"
                                  : amt.toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits:
                                        token.decimals > 6 ? 4 : 2,
                                    });
                              })()
                            : "••••"}
                        </span>
                        <span className="text-[11.5px] text-slate-400 font-medium tracking-wide">
                          {showBalance
                            ? (() => {
                                const amt =
                                  liveCustomBalances[
                                    token.contractAddress?.toLowerCase().trim() ||
                                      ""
                                  ] !== undefined
                                    ? liveCustomBalances[
                                        token.contractAddress
                                          ?.toLowerCase()
                                          .trim() || ""
                                      ]
                                    : token.balance || 0;
                                return amt === 0
                                  ? "0"
                                  : `~$` +
                                      (
                                        amt * (token.usdPrice || 1.0)
                                      ).toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      });
                              })()
                            : "••••"}
                        </span>
                      </div>
                      {isManageMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Remove ${token.symbol}?`)) {
                              removeToken(token.symbol);
                              displayToast(`${token.symbol} removed`);
                            }
                          }}
                          className="ml-3 p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors cursor-pointer animate-in zoom-in-50 duration-200 shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Sleek Flat Add Token Row */}
                <button
                  onClick={() => {
                    setShowImportModal(true);
                  }}
                  className="w-full py-4 text-slate-500 hover:text-slate-600 hover:bg-slate-50/75 transition-colors flex items-center justify-center gap-2 font-bold text-[13.5px] outline-none cursor-pointer border-t border-slate-100 bg-transparent rounded-b-[24px]"
                >
                  <Plus size={16} />
                  <span>Import Token</span>
                </button>
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
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                          ID
                        </span>
                        <a
                          href={nft.txHash && !nft.txHash.startsWith("0xgenesis") && !nft.txHash.startsWith("0xpioneer") ? `https://testnet.arcscan.app/tx/${nft.txHash}` : undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-slate-400 hover:text-slate-600 truncate max-w-[80px]"
                          onClick={(e) => {
                            if (!nft.txHash || nft.txHash.startsWith("0xgenesis") || nft.txHash.startsWith("0xpioneer")) {
                              e.preventDefault();
                            }
                          }}
                        >
                          {nft.id ? `#${nft.id.slice(2, 6).toUpperCase()}` : "Verified"}
                        </a>
                      </div>
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
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mt-4 mb-6"></div>

            <div className="px-6 w-full flex flex-col items-center">
              <h3 className="font-bold text-[18px] text-slate-800 mb-6">
                Your UID Card
              </h3>

              {/* Card Design */}
              <UIDCard userName={userName} isBlurred={!showUID} />

              {/* Card Actions */}
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

      {showImportModal && (
        <div className="absolute inset-0 z-[120] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setShowImportModal(false)}
          ></div>

          <div className="bg-white rounded-t-[32px] w-full max-h-[85vh] flex flex-col items-center relative z-10 animate-in slide-in-from-bottom-[100%] duration-300 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mt-4 mb-4"></div>

            <div className="px-6 w-full flex-1 overflow-y-auto flex flex-col pb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-[18px] text-slate-800 uppercase tracking-tight">
                  Import Token
                </h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-1 px-3 hover:bg-slate-100 rounded-full text-slate-500 border-0 bg-transparent text-[13px] font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Import Tabs */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4">
                <button
                  onClick={() => setImportTab("popular")}
                  className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all border-0 cursor-pointer ${
                    importTab === "popular"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "bg-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Popular Token
                </button>
                <button
                  onClick={() => setImportTab("custom")}
                  className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all border-0 cursor-pointer ${
                    importTab === "custom"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "bg-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Custom Token
                </button>
              </div>

              {importTab === "popular" ? (
                <div className="flex flex-col gap-3 min-h-[250px] pb-4 select-none">
                  <p className="text-[12px] text-slate-400 mb-1 font-medium">
                    Select from verified standard assets on Arc Network:
                  </p>

                  {popularCatalog.length === 0 && (
                    <div className="flex flex-col items-center py-10 text-slate-400 gap-2">
                      <RefreshCw className="animate-spin" size={24} />
                      <span className="text-[12px]">Loading catalog...</span>
                    </div>
                  )}

                  {popularCatalog.map((ptok) => {
                    const isAlreadyImported =
                      importedTokens.some(
                        (t) =>
                          t.symbol.toUpperCase() === ptok.symbol.toUpperCase(),
                      ) ||
                      ptok.symbol === "USDC" ||
                      ptok.symbol === "ARC";

                    return (
                      <div
                        key={ptok.symbol}
                        className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <TokenIcon
                            contractAddress={ptok.contractAddress}
                            symbol={ptok.symbol}
                            className="w-10 h-10 text-xs shadow-sm"
                            color={ptok.color || "bg-slate-800"}
                          />
                          <div className="flex flex-col text-left">
                            <span className="font-bold text-[14px] text-slate-800 leading-snug">
                              {ptok.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                              {ptok.symbol} • {ptok.type}
                            </span>
                          </div>
                        </div>

                        {isAlreadyImported ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[11px] font-extrabold border border-emerald-100/50">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            ACTIVE
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              importToken({
                                symbol: ptok.symbol,
                                name: ptok.name,
                                decimals: ptok.decimals,
                                contractAddress: ptok.contractAddress,
                                balance: ptok.initialBalance,
                                usdPrice: ptok.usdPrice,
                                color: ptok.color,
                              });
                              displayToast(`${ptok.symbol} Token imported!`);
                            }}
                            className="bg-slate-900 text-white hover:bg-slate-800 font-sans text-[11.5px] font-bold px-3.5 py-1.5 rounded-xl cursor-pointer border-0 transition-opacity active:opacity-90"
                          >
                            Import
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-4 min-h-[250px] pb-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1 text-left relative">
                      <label className="text-[10.5px] font-extrabold uppercase tracking-widest text-slate-500">
                        Token Contract Address
                      </label>
                      <input
                        type="text"
                        value={customAddress}
                        onChange={(e) => setCustomAddress(e.target.value)}
                        placeholder="e.g. 0x07f1ea50e30d47376c0dfb3eb853fd40e3a8907a"
                        className="w-full bg-slate-55 border border-slate-100 focus:border-blue-400 focus:bg-white rounded-xl px-4 py-2.5 text-[14px] text-slate-800 font-mono focus:outline-none transition-all placeholder:text-slate-300 shadow-inner"
                      />
                      {isResolving && (
                        <div className="absolute right-3 bottom-2.5">
                          <RefreshCw
                            size={14}
                            className="animate-spin text-blue-500"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-[10.5px] font-extrabold uppercase tracking-widest text-slate-500">
                          Token Symbol
                        </label>
                        <input
                          type="text"
                          value={customSymbol}
                          onChange={(e) => setCustomSymbol(e.target.value)}
                          placeholder="e.g. MINT"
                          maxLength={8}
                          className="w-full bg-slate-55 border border-slate-100 focus:border-blue-400 focus:bg-white rounded-xl px-4 py-2.5 text-[14px] text-slate-800 font-extrabold focus:outline-none transition-all placeholder:text-slate-300 shadow-inner"
                        />
                      </div>

                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-[10.5px] font-extrabold uppercase tracking-widest text-slate-500">
                          Decimals
                        </label>
                        <input
                          type="number"
                          value={customDecimals}
                          onChange={(e) => setCustomDecimals(e.target.value)}
                          placeholder="18"
                          className="w-full bg-slate-55 border border-slate-100 focus:border-blue-400 focus:bg-white rounded-xl px-4 py-2.5 text-[14px] text-slate-800 focus:outline-none transition-all placeholder:text-slate-300 shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-[10.5px] font-extrabold uppercase tracking-widest text-slate-500">
                        Token Name
                      </label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g. Arc Mintable Protocol"
                        className="w-full bg-slate-55 border border-slate-100 focus:border-blue-400 focus:bg-white rounded-xl px-4 py-2.5 text-[14px] text-slate-800 focus:outline-none transition-all placeholder:text-slate-300 shadow-inner"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleImportCustom}
                    className="w-full mt-2 bg-slate-900 text-white hover:bg-slate-800 text-[13.5px] font-bold py-3.5 px-4 rounded-xl active:scale-[0.98] transition-all cursor-pointer border-0 uppercase tracking-wide font-sans shadow-md"
                  >
                    Import Custom Token
                  </button>
                </div>
              )}
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
  onClick,
}: DetailTransactionItemProps) {
  return (
    <div
      className="flex gap-4 p-2 cursor-pointer group active:scale-[0.98] transition-all my-1 text-left w-full"
      onClick={onClick}
    >
      <div className="mt-1 w-6 shrink-0 flex justify-center">{icon}</div>
      <div
        className={`flex flex-col flex-1 pb-4 ${hideSeparator ? "" : "border-b border-slate-100"}`}
      >
        <div className="flex justify-between items-start mb-1">
          <h5 className="font-bold text-[14px] text-slate-800 group-hover:text-slate-800 transition-colors">
            {title}
          </h5>
          <div className="flex flex-col items-end">
            <span className={`font-bold text-[14px] ${amountColor} flex`}>
              {amount}
              <span className="text-[9px] mt-0.5 ml-0.5">00</span>
            </span>
          </div>
        </div>
        <p className="text-[12px] text-slate-500 leading-snug whitespace-pre-line max-w-[85%] mt-1">
          {desc}
        </p>
        {badge && (
          <div className="mt-2.5 inline-flex items-center gap-1 bg-emerald-55 text-emerald-600 px-2 pt-0.5 pb-1 rounded-full w-fit border border-emerald-100">
            <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">L</span>
            </div>
            <span className="text-[11px] font-bold tracking-tight">
              {badge}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
export { DetailActionButton, DetailTransactionItem };
