import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ArrowLeftRight,
  RefreshCw,
  Check,
  Zap,
  Search,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "../../store/useStore";
import { ArcAppKitAdapter } from "../../services/arc-app-kit/adapter";
import { useBalances } from "../../hooks/useBalances";
import { ARC_TESTNET } from "../../lib/arcConfig";
import { ARC_TOKEN_REGISTRY, syncTokenWithArcScan } from "../../lib/arcRegistry";
import { TokenIcon } from "../ui/TokenIcon";

interface SwapScreenProps {
  onBack: () => void;
}

export function SwapScreen({ onBack }: SwapScreenProps) {
  const {
    registeredUser,
    platformConfig,
    fetchPlatformConfig,
  } = useStore();
  const queryClient = useQueryClient();
  const { data: balanceData } = useBalances();

  useEffect(() => {
    if (!platformConfig) {
      fetchPlatformConfig();
    }
  }, [platformConfig, fetchPlatformConfig]);

  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("0");
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapFinished, setSwapFinished] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [tokens, setTokens] = useState<any[]>([]);

  // Modal states
  const [showTokenSelector, setShowTokenSelector] = useState<
    "from" | "to" | null
  >(null);
  const [fromToken, setFromToken] = useState<any | null>(null);
  const [toToken, setToToken] = useState<any | null>(null);
  const [searchToken, setSearchToken] = useState("");
  const [txHash, setTxHash] = useState("");
  const [slippage, setSlippage] = useState<string>("0.5");
  const [showDetails, setShowDetails] = useState(false);

  const getTokenData = (symbol: string) => {
    return balanceData?.allBalances?.find(
      (b: any) => b.token?.symbol === symbol || b.token?.name?.includes(symbol),
    );
  };

  const getTokenBalance = (symbol: string) => {
    if (!balanceData?.allBalances) return 0;
    const matchingTokens = balanceData.allBalances.filter(
      (b: any) => b.token?.symbol === symbol || b.token?.name?.includes(symbol),
    );
    let total = 0;
    for (const tokenData of matchingTokens) {
      total += parseFloat(tokenData.amount || "0");
    }
    return total;
  };

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const newTokens = await ArcAppKitAdapter.getTokens();
        setTokens(newTokens);
        if (!fromToken && newTokens.length > 0) setFromToken(newTokens[0]);
        if (!toToken && newTokens.length > 1) setToToken(newTokens[1]);
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    };
    fetchInitData();
  }, []);

  useEffect(() => {
    // Update rate when tokens change
    if (fromToken && toToken) {
      ArcAppKitAdapter.getLiveRate(fromToken.symbol, toToken.symbol).then(
        (res) => setExchangeRate(res.rate),
      );
    }
  }, [fromToken, toToken]);

  useEffect(() => {
    if (fromAmount) {
      if (fromToken?.symbol === toToken?.symbol) {
        setToAmount(fromAmount);
      } else {
        setToAmount((parseFloat(fromAmount) * exchangeRate).toFixed(4));
      }
    } else {
      setToAmount("0");
    }
  }, [fromAmount, exchangeRate, fromToken, toToken]);

  const handleSwap = async () => {
    if (!registeredUser?.supabaseUid) return;

    // Check specific token balance for actual swap
    const balance = getTokenBalance(fromToken?.symbol || "");
    if (parseFloat(fromAmount) > balance) {
      useStore.getState().displayToast("Insufficient balance!");
      return;
    }

    const PLATFORM_FEE_PERCENT = platformConfig ? parseFloat(platformConfig.swapFee || "0.1") : 0.1;
    const usdcBalance = getTokenBalance("USDC");
    const requiredMinUsdc = 0.10; // Basic check for platform fee context

    if (usdcBalance < requiredMinUsdc) {
      useStore.getState().displayToast(`Insufficient USDC balance for Platform Fee (~${PLATFORM_FEE_PERCENT}% of nominal).`);
      return;
    }

    setIsSwapping(true);
    setSwapFinished(false);

    try {
      const selectedFromToken = fromToken;
      const targetTokenAddress = selectedFromToken?.contractAddress || 
                                 selectedFromToken?.tokenAddress || 
                                 getTokenData(selectedFromToken?.symbol || "")?.token?.tokenAddress || 
                                 "";

      const result = await ArcAppKitAdapter.swapTokens(
        parseFloat(fromAmount),
        fromToken?.symbol || "",
        toToken?.symbol || "",
        targetTokenAddress,
      );

      setTxHash(result.txId);
      setIsSwapping(false);
      setSwapFinished(true);
      queryClient.invalidateQueries({ queryKey: ["balances"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    } catch (error: any) {
      console.error(error);
      setIsSwapping(false);
      useStore.getState().displayToast(error.message || "Swap failed!");
    }
  };

  const flipTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount("");
    setToAmount("0");
  };

  if (swapFinished) {
    return (
      <div className="w-full h-full bg-slate-50 relative flex flex-col z-50 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full shrink-0 justify-between">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
          >
            <X size={20} className="text-white" />
          </button>
          <h2 className="font-bold text-[16px] text-white ml-2">
            Transaction Receipt
          </h2>
        </div>
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <div className="bg-white p-8 rounded-[32px] w-full max-w-sm shadow-xl flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white">
              <Check size={40} className="text-green-500" strokeWidth={3} />
            </div>
            <h2 className="text-[24px] font-extrabold text-white mb-2">
              Swap Confirmed
            </h2>
            <a
              href={`${ARC_TESTNET.blockExplorers.default.url}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] text-slate-500 mb-8 leading-relaxed hover:underline hover:text-slate-700 transition-colors block cursor-pointer"
            >
              Your assets have been successfully swapped on the Arc Network.
            </a>

            <div className="w-full bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100 space-y-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-slate-500">Paid</span>
                <span className="font-bold text-slate-800">
                  {fromAmount} {fromToken?.symbol || ""}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-slate-500">Received</span>
                <span className="font-bold text-green-600">
                  +{toAmount} {toToken?.symbol || ""}
                </span>
              </div>
              <div className="w-full h-[1px] bg-slate-200 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-slate-400">Tx Hash</span>
                {txHash.startsWith("0x") ? (
                  <a
                    href={`${ARC_TESTNET.blockExplorers.default.url}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] font-mono text-slate-600 break-all hover:underline text-right"
                  >
                    {txHash}
                  </a>
                ) : (
                  <span className="text-[12px] font-mono text-slate-600 break-all text-right">
                    {txHash} <br />
                    <span className="text-[10px] text-slate-400">(Process ID - Pending On-chain Finality)</span>
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-slate-400">Network</span>
                <span className="text-[12px] font-bold text-slate-600">
                  Arc Testnet
                </span>
              </div>
            </div>

            <button
              onClick={onBack}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors shadow-lg active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-50 relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h2 className="font-bold text-[16px] text-white ml-2">SWAP</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 p-5 flex flex-col pt-6 w-full scrollbar-hide relative">
        {/* Swap Box Container */}
        <div className="relative mb-6">
          {/* From */}
          <div
            className={`bg-white p-5 rounded-[24px] shadow-sm border transition-all duration-300 relative z-10 ${isSwapping ? "border-blue-400/50 shadow-blue-100/50 opacity-80" : "border-slate-200 focus-within:border-slate-400"}`}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                You Pay
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-slate-500 flex items-center gap-1">
                  Balance:{" "}
                  {getTokenBalance(fromToken?.symbol || "").toLocaleString(
                    "en-US",
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                  )}{" "}
                  {fromToken?.symbol || ""}
                </span>
                <button
                  onClick={() =>
                    setFromAmount(
                      getTokenBalance(fromToken?.symbol || "").toString(),
                    )
                  }
                  className="bg-slate-100 text-slate-800 font-bold text-[10px] px-2 py-0.5 rounded uppercase hover:bg-slate-200 transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  disabled={isSwapping}
                  className="w-[140px] bg-transparent border-none outline-none text-[36px] font-extrabold text-slate-800 placeholder:text-slate-200 disabled:opacity-50"
                  placeholder="0"
                />
                <button
                  onClick={() => !isSwapping && setShowTokenSelector("from")}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors px-3 py-2 rounded-full shrink-0 h-10"
                >
                  <TokenIcon
                    contractAddress={fromToken?.contractAddress || fromToken?.tokenAddress}
                    symbol={fromToken?.symbol || ""}
                    className="w-6 h-6 text-[8px] shadow-sm shrink-0"
                    color={fromToken?.color || "bg-slate-300"}
                  />
                  <span className="font-bold text-slate-800 text-[14px]">
                    {fromToken?.symbol || ""}
                  </span>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
              </div>
              {fromAmount && (
                <div className="text-[12px] text-slate-400 font-medium">
                  ~ ${(parseFloat(fromAmount) * 1.001).toFixed(2)} USD
                </div>
              )}
            </div>
          </div>

          {/* Swap Swap Button */}
          <div
            className={`absolute left-1/2 top-[calc(50%-20px)] z-20 transform -translate-x-1/2 transition-transform duration-500 ${isSwapping ? "rotate-180" : ""}`}
          >
            <button
              onClick={flipTokens}
              disabled={isSwapping}
              className="w-10 h-10 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-4 border-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:scale-105 active:scale-95 transition-all group disabled:opacity-50"
            >
              <ArrowLeftRight
                size={16}
                className="rotate-90 group-hover:rotate-[-90deg] transition-transform duration-500"
              />
            </button>
          </div>

          {/* To */}
          <div
            className={`bg-white p-5 rounded-[24px] shadow-sm border mt-1.5 transition-all duration-300 relative z-10 ${isSwapping ? "border-orange-400/50 shadow-orange-100/50 opacity-80" : "border-slate-200 gap-2"}`}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                You Receive
              </span>
              <span className="text-[12px] font-bold text-slate-500 flex items-center gap-1">
                Balance:{" "}
                {getTokenBalance(toToken?.symbol || "").toLocaleString(
                  "en-US",
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                )}{" "}
                {toToken?.symbol || ""}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <span
                    className={`text-[36px] font-extrabold ${toAmount === "0" ? "text-slate-300" : "text-slate-800"} transition-opacity ${isSwapping ? "opacity-50" : "opacity-100"}`}
                  >
                    {toAmount}
                  </span>
                </div>
                <button
                  onClick={() => !isSwapping && setShowTokenSelector("to")}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors px-3 py-2 rounded-full shrink-0 h-10"
                >
                  <TokenIcon
                    contractAddress={toToken?.contractAddress || toToken?.tokenAddress}
                    symbol={toToken?.symbol || ""}
                    className="w-6 h-6 text-[8px] shadow-sm shrink-0"
                    color={toToken?.color || "bg-slate-300"}
                  />
                  <span className="font-bold text-slate-800 text-[14px]">
                    {toToken?.symbol || ""}
                  </span>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
              </div>
              {toAmount !== "0" && (
                <div className="text-[12px] text-slate-400 font-medium">
                  ~ ${(parseFloat(toAmount) * 0.999).toFixed(2)} USD
                  <span className="text-orange-400 ml-2">(-0.2%)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-white border border-slate-200 rounded-[20px] p-5 mb-8 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[13px] text-slate-500">Live Rate</span>
            <span className="text-[13px] font-bold text-slate-800 flex items-center gap-1">
              <Zap size={14} className="text-yellow-500" />1{" "}
              {fromToken?.symbol || ""} ={" "}
              {fromToken?.symbol === "USDC" && toToken?.symbol === "ARC"
                ? exchangeRate
                : (1 / (exchangeRate || 1)).toFixed(4)}{" "}
              {toToken?.symbol || ""}
            </span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[13px] text-slate-500 flex flex-col">
              Slippage Tolerance
              <span className="text-[10px] text-slate-400 font-normal">
                Max price impact
              </span>
            </span>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {["0.1", "0.5", "1.0"].map((val) => (
                <button
                  key={val}
                  onClick={() => setSlippage(val)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors ${slippage === val ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>
          <div className="w-full h-[1px] border-b border-dashed border-slate-200 my-3"></div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[13px] text-slate-500">Price Impact</span>
            <div
              className="flex items-center gap-1 cursor-pointer"
              onClick={() => setShowDetails(!showDetails)}
            >
              <span className="text-[13px] font-mono text-emerald-500 font-bold">
                &lt; 0.01%
              </span>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform ${showDetails ? "rotate-180" : ""}`}
              />
            </div>
          </div>
          {showDetails && (
            <div className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-100 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-slate-500">
                  Liquidity Provider Fee
                </span>
                <span className="text-[12px] font-mono text-slate-700 font-bold">
                  {(parseFloat(fromAmount || "0") * 0.003).toFixed(4)}{" "}
                  {fromToken?.symbol || ""}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-slate-500">
                  Minimum Received
                </span>
                <span className="text-[12px] font-mono text-slate-700 font-bold">
                  {(
                    parseFloat(toAmount || "0") *
                    (1 - parseFloat(slippage) / 100)
                  ).toFixed(4)}{" "}
                  {toToken?.symbol || ""}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[12px] text-slate-500">Platform Fee</span>
                <span className="text-[12px] font-mono text-slate-700 font-bold">
                  {platformConfig ? platformConfig.swapFee : "0.1"}%
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[12px] text-slate-500">Network Gas (Sponsored)</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded w-fit ${platformConfig?.gasSubsidyEnabled ? "text-emerald-600 bg-emerald-50" : "text-slate-600 bg-slate-50"}`}>
                  {platformConfig?.gasSubsidyEnabled ? "Free" : "Native"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto pb-4">
          <button
            disabled={
              !fromAmount ||
              parseFloat(fromAmount) === 0 ||
              isSwapping ||
              parseFloat(fromAmount) >
                getTokenBalance(fromToken?.symbol || "") ||
              fromToken?.symbol === toToken?.symbol
            }
            onClick={handleSwap}
            className={`w-full font-bold py-4 rounded-full transition-all flex items-center justify-center gap-3 text-[15px] active:scale-95
              ${
                !fromAmount ||
                parseFloat(fromAmount) === 0 ||
                parseFloat(fromAmount) >
                  getTokenBalance(fromToken?.symbol || "") ||
                fromToken?.symbol === toToken?.symbol
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : !isSwapping
                    ? "bg-slate-900 text-white shadow-lg hover:bg-slate-800"
                    : "bg-slate-800 text-white shadow-xl scale-[0.98]"
              }`}
          >
            {isSwapping ? (
              <>
                <RefreshCw size={20} className="animate-spin text-slate-300" />
                Processing Swap...
              </>
            ) : fromToken?.symbol === toToken?.symbol ? (
              "Invalid Pair"
            ) : parseFloat(fromAmount) >
              getTokenBalance(fromToken?.symbol || "") ? (
              "Insufficient Balance"
            ) : (
              "Review Swap"
            )}
          </button>
        </div>
      </div>

      {/* Token Selector Modal */}
      {showTokenSelector && (
        <div className="absolute inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 justify-between shrink-0">
            <div className="flex items-center">
              <button
                onClick={() => setShowTokenSelector(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
              <h2 className="font-bold text-[16px] text-white ml-2">
                SELECT A TOKEN
              </h2>
            </div>
          </div>

          <div className="p-4 border-b border-slate-100 relative">
            <Search
              size={20}
              className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search name or paste address"
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-2 text-[12px] font-bold text-slate-400 uppercase tracking-wider">
              Popular Tokens
            </div>
            <div className="flex flex-col">
              {tokens
                .filter(
                  (t) =>
                    (t.name?.toLowerCase() || "").includes(searchToken.toLowerCase()) ||
                    (t.symbol?.toLowerCase() || "").includes(searchToken.toLowerCase()),
                )
                .map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => {
                      if (showTokenSelector === "from") setFromToken(token);
                      if (showTokenSelector === "to") setToToken(token);
                      setShowTokenSelector(null);
                    }}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors active:bg-slate-100 text-left border-b border-slate-50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <TokenIcon
                        contractAddress={token.contractAddress || token.tokenAddress}
                        symbol={token.symbol}
                        className="w-10 h-10 text-[10px] shadow-sm"
                        color={token.color || "bg-slate-300"}
                      />
                      <div>
                        <div className="font-bold text-slate-800 text-[15px]">
                          {token.name}
                        </div>
                        <div className="text-[12px] text-slate-500">
                          {token.symbol} • {token.type}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-800">
                        {getTokenBalance(token.symbol).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
