import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { UIDCard } from "../common/UIDCard";
import { useBalances } from "../../hooks/useBalances";
import { useStore } from "../../store/useStore";
import { Transaction } from "../../types";
import { ARC_TOKEN_REGISTRY, syncTokenWithArcScan } from "../../lib/arcRegistry";
import { TokenIcon } from "../ui/TokenIcon";

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
  const [activeTab, setActiveTab] = useState<"history" | "token">("history");
  const [showUID, setShowUID] = useState(false);
  const {
    transactions,
    showBalance,
    balance,
    activeFilter,
    setActiveFilter,
    importedTokens,
    importToken,
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
      return ["withdraw", "transfer", "purchase"].includes(tx.type);
    if (activeFilter === "Swaps") return tx.type === "swap";
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
      default:
        return "bg-slate-50 border-slate-100";
    }
  };

  const [showCard, setShowCard] = useState(false);
  const [showUnifiedDetails, setShowUnifiedDetails] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState<"popular" | "custom">("popular");
  const [customAddress, setCustomAddress] = useState("");
  const [customSymbol, setCustomSymbol] = useState("");
  const [customName, setCustomName] = useState("");
  const [customDecimals, setCustomDecimals] = useState("18");

  const popularCatalog = Object.values(ARC_TOKEN_REGISTRY)
    .filter((token) => !token.isNative && token.symbol !== "USDC")
    .map((token) => ({
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      contractAddress: token.contractAddress,
      // Provide mock values for UI
      initialBalance: Math.random() * 1000,
      usdPrice: 1.0,
      type: "ArcScan Verified Token",
      color: "bg-slate-800", // Fallback color
    }));

  const handleAutoFillCustom = () => {
    const templates = [
      {
        symbol: "MINT",
        name: "Arc Mintable Assets",
        address: "0x4fbc689076bc19ad080bfebd8833fd4038a8faec",
        decimals: "18",
      },
      {
        symbol: "STAKE",
        name: "Validator Stake Token",
        address: "0x8ec8ebd8833fd4038a8faec07f1ea50e30d47376",
        decimals: "18",
      },
      {
        symbol: "PAY",
        name: "Arc Gas Refund Pool",
        address: "0x16fd4038a8faec07f1ea50e30d4737604fbc6890",
        decimals: "6",
      },
      {
        symbol: "GOLD",
        name: "Circle Tokenized Gold",
        address: "0x22cfb8da47fcd3eb7ebd8833fd4038a4acc89d2",
        decimals: "8",
      },
    ];

    const randomTemplate =
      templates[Math.floor(Math.random() * templates.length)];
    setCustomAddress(randomTemplate.address);
    setCustomSymbol(randomTemplate.symbol);
    setCustomName(randomTemplate.name);
    setCustomDecimals(randomTemplate.decimals);
    displayToast(`Autofilled details for ${randomTemplate.symbol}`);
  };

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
              className={`flex flex-col items-center border-b-[2.5px] pb-1.5 px-1 cursor-pointer transition-colors ${activeTab === "token" ? "border-slate-900" : "border-transparent"}`}
              onClick={() => setActiveTab("token")}
            >
              <h3
                className={`font-bold text-[14px] ${activeTab === "token" ? "text-slate-800" : "text-slate-400"}`}
              >
                Tokens
              </h3>
            </div>
            <div
              className={`flex flex-col items-center border-b-[2.5px] pb-1.5 px-1 cursor-pointer transition-colors ${activeTab === "history" ? "border-slate-900" : "border-transparent"}`}
              onClick={() => setActiveTab("history")}
            >
              <h3
                className={`font-bold text-[14px] ${activeTab === "history" ? "text-slate-800" : "text-slate-400"}`}
              >
                History
              </h3>
            </div>
          </div>
          {activeTab === "history" && (
            <button className="text-slate-800 font-bold text-[13px]">
              e-Statement
            </button>
          )}
        </div>

        {activeTab === "history" && (
          <>
            <div className="flex items-center px-4 py-3 shrink-0 justify-between">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide py-1 text-[13px] text-slate-500 font-medium">
                {(["All", "Received", "Sent", "Swaps"] as const).map(
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
              <div className="flex items-center gap-3 ml-2 shrink-0">
                <button className="text-slate-800 bg-slate-100 p-2 rounded-full">
                  <Search size={16} strokeWidth={2.5} />
                </button>
                <button className="text-slate-400 p-2 rounded-full bg-slate-50">
                  <Calendar size={16} strokeWidth={2.5} />
                </button>
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
        )}

        {activeTab === "token" && (
          <div className="flex-1 overflow-y-auto px-5 py-5 pb-24 bg-slate-50/50">
            <div className="bg-white rounded-[24px] border border-slate-200/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
              {/* USDC Token Row */}
              <div className="flex flex-col border-b border-slate-100">
                <div
                  className="p-4 flex justify-between items-center hover:bg-slate-50/75 transition-colors cursor-pointer"
                  onClick={() => setShowUnifiedDetails(!showUnifiedDetails)}
                >
                  <div className="flex items-center gap-4">
                    <TokenIcon 
                      contractAddress="0x3600000000000000000000000000000000000000"
                      symbol="USDC"
                      className="w-12 h-12"
                      color="bg-blue-100"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[16px] text-slate-800 leading-tight">
                          USDC
                        </span>
                        <span className="bg-slate-100 text-slate-500 text-[8.5px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm">
                          Unified
                        </span>
                      </div>
                      <span className="text-[12px] text-slate-500 font-medium">
                        USD Coin
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-[16px] text-slate-800">
                        {(balance || 0).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-[12px] text-slate-400 font-medium tracking-wide">
                        ~$
                        {(balance || 0).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 transition-transform duration-200 ${showUnifiedDetails ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>

                {/* Simplified Unified Balance List */}
                {showUnifiedDetails && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-50 bg-white/50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col gap-1 mb-3">
                      <span className="font-extrabold tracking-wide uppercase text-[10px] text-slate-400">
                        Balance Distribution
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Circle Balance */}
                      <div className="flex justify-between items-center py-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#008fcd]">
                            <ShieldCheck size={16} />
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-[12px] font-bold text-slate-800">
                              Circle Gateway
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Standard ERC-20 (6 Decimals)
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-[13px] text-slate-700 font-mono">
                            {showBalance
                              ? (() => {
                                  const circleData =
                                    balanceData?.allBalances?.find(
                                      (b: any) =>
                                        !b.token?.isNative &&
                                        (b.token?.symbol === "USDC" ||
                                          b.token?.name?.includes("USDC")) &&
                                        (b.token?.blockchain?.toUpperCase() ===
                                          "ARC-TESTNET" ||
                                          !b.token?.blockchain),
                                    );
                                  const amt = circleData
                                    ? parseFloat(circleData.amount || "0")
                                    : 0;
                                  return amt.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  });
                                })()
                              : "••••"}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            USDC
                          </span>
                        </div>
                      </div>

                      <div className="h-px bg-slate-100 w-full"></div>

                      {/* Arc Native Balance */}
                      <div className="flex justify-between items-center py-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                            <Zap size={16} />
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-[12px] font-bold text-slate-800">
                              Arc Network Native
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Unified Gas Asset (18 Decimals)
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-[13px] text-slate-700 font-mono">
                            {showBalance
                              ? (() => {
                                  const nativeData =
                                    balanceData?.allBalances?.find(
                                      (b: any) =>
                                        b.token?.isNative &&
                                        (b.token?.symbol === "USDC" ||
                                          b.token?.name?.includes("USDC")),
                                    );
                                  const amt = nativeData
                                    ? parseFloat(nativeData.amount || "0")
                                    : 0;
                                  return amt.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  });
                                })()
                              : "••••"}
                          </span>
                          <span className="text-[9px] text-zinc-400">USDC</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 p-2.5 rounded-xl bg-white border border-slate-100">
                      <p className="text-[9.5px] text-slate-500 leading-relaxed font-medium font-sans">
                        💡 These balances are virtually unified. You can spend
                        the combined total instantly on the Arc network without
                        manual bridging.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ARC Token Row */}
              <div className="p-4 flex justify-between items-center hover:bg-slate-50/75 transition-colors cursor-pointer border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <TokenIcon
                    contractAddress="native"
                    symbol="ARC"
                    className="w-11 h-11"
                    color="bg-slate-900 text-white"
                  />
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-[15.5px] text-slate-800 leading-tight">
                      ARC
                    </span>
                    <span className="text-[11.5px] text-slate-400 font-medium">
                      Arc Network
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-bold text-[15.5px] text-slate-800 font-mono">
                    {showBalance
                      ? (() => {
                          const arcTokenData = balanceData?.allBalances?.find(
                            (b: any) =>
                              b.token?.symbol === "ARC" ||
                              b.token?.name?.toUpperCase().includes("ARC"),
                          );
                          const amt = arcTokenData
                            ? parseFloat(arcTokenData.amount || "0")
                            : 12450.0;
                          return amt.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          });
                        })()
                      : "••••"}
                  </span>
                  <span className="text-[11.5px] text-slate-400 font-medium tracking-wide">
                    {showBalance
                      ? (() => {
                          const arcTokenData = balanceData?.allBalances?.find(
                            (b: any) =>
                              b.token?.symbol === "ARC" ||
                              b.token?.name?.toUpperCase().includes("ARC"),
                          );
                          const amt = arcTokenData
                            ? parseFloat(arcTokenData.amount || "0")
                            : 12450.0;
                          return (
                            `~$` +
                            (amt * 0.02).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          );
                        })()
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
                      <span className="font-bold text-[15.5px] text-slate-800 leading-tight flex items-center gap-1.5 truncate">
                        {token.symbol}
                        <span className="bg-blue-50 text-[#008fcd] text-[8px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-[4px] border border-blue-100 leading-none">
                          Imported
                        </span>
                      </span>
                      <span
                        className="text-[10.5px] text-slate-400 font-medium truncate font-mono mt-0.5"
                        title={token.contractAddress}
                      >
                        {token.contractAddress.substring(0, 6)}...
                        {token.contractAddress.substring(
                          token.contractAddress.length - 4,
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-[15.5px] text-slate-800 font-mono">
                        {showBalance
                          ? (() => {
                              const amt =
                                liveCustomBalances[
                                  token.contractAddress?.toLowerCase().trim() || ""
                                ] !== undefined
                                  ? liveCustomBalances[
                                      token.contractAddress?.toLowerCase().trim() || ""
                                    ]
                                  : token.balance;
                              return amt.toLocaleString("en-US", {
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
                                  token.contractAddress?.toLowerCase().trim() || ""
                                ] !== undefined
                                  ? liveCustomBalances[
                                      token.contractAddress?.toLowerCase().trim() || ""
                                    ]
                                  : token.balance;
                              return (
                                `~$` +
                                (amt * token.usdPrice).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              );
                            })()
                          : "••••"}
                      </span>
                    </div>
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
                    Select from popular standard assets on Arc L1 Testnet:
                  </p>

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
                  <div className="flex justify-between items-center bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100/50 text-left">
                    <span className="text-[11.5px] text-slate-600 leading-relaxed max-w-[70%] font-medium">
                      💡 Fast-track testing? Auto-populate mock contract details
                      instantly with a single tap.
                    </span>
                    <button
                      onClick={handleAutoFillCustom}
                      className="bg-slate-800 text-white hover:bg-blue-700 text-[11.5px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer border-0 shadow-sm"
                    >
                      Autofill
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1 text-left">
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
