import React, { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Info,
  AlertCircle,
  Globe,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useApp } from "../../contexts/AppContext";
import { ArcAppKitAdapter } from "../../services/arc-app-kit/adapter";

interface BridgeScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

const NETWORKS = [
  {
    id: "arc",
    name: "Arc Testnet",
    icon: <Globe size={16} />,
    color: "bg-slate-800",
    domain: 26,
  },
  {
    id: "ethereum",
    name: "Ethereum Sepolia",
    icon: <Globe size={16} />,
    color: "bg-indigo-500",
    domain: 0,
  },
  {
    id: "base",
    name: "Base Sepolia",
    icon: <Globe size={16} />,
    color: "bg-blue-400",
    domain: 6,
  },
  {
    id: "avalanche",
    name: "Avalanche Fuji",
    icon: <Globe size={16} />,
    color: "bg-red-500",
    domain: 1,
  },
];

export function BridgeScreen({ onBack, onSuccess }: BridgeScreenProps) {
  const {
    balance,
    fetchBalance,
    fetchTransactions,
    displayToast,
    registeredUser,
  } = useApp();
  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const mode = "outbound"; // Forced to outbound for now
  const [processingPhase, setProcessingPhase] = useState<
    "broadcasting" | "attesting" | "claiming"
  >("broadcasting");
  const [amount, setAmount] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const fromNetwork = NETWORKS[0]; // Default From: Arc Default
  const [toNetwork, setToNetwork] = useState(NETWORKS[1]); // Default To: Ethereum
  const [showNetworkSelect, setShowNetworkSelect] = useState<
    "from" | "to" | null
  >(null);
  const [showPending, setShowPending] = useState(false);

  const handleBridge = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      displayToast("Please enter a valid amount.");
      return;
    }
    const totalWithFee = numAmount + 0.10;
    if (mode === "outbound" && totalWithFee > balance) {
      displayToast(`Saldo USDC tidak cukup. Dibutuhkan ${totalWithFee.toFixed(2)} USDC (termasuk 0.10 Platform Fee).`);
      return;
    }
    if (!destinationAddress.trim()) {
      displayToast("Please connect or enter a destination wallet address.");
      return;
    }

    setStep("processing");
    setProcessingPhase("broadcasting");

    try {
      if (mode === "outbound") {
        // Mock outbound bridging using Adapter CCTP
        await ArcAppKitAdapter.bridgeTokenCCTP(
          numAmount,
          destinationAddress,
          toNetwork.domain,
        );
      } else {
        // App-kit like inbound capability handling
        // Abstracting the burn on source chain and attest claim
        console.log(
          `Simulating inbound bridge from ${fromNetwork.name} to Arc for ${numAmount} USDC`,
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Let's pretend the mock api inbound claim gives us success
        const response = await fetch("/api/bridge/inbound/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: registeredUser?.supabaseUid,
            sourceTxHash: "0xMockHash" + Date.now(), // Abstracted hash
            sourceChainRpc: "",
          }),
        });

        if (!response.ok) {
          throw new Error("Simulated SDK Claim failed");
        }
      }

      setProcessingPhase("attesting");
      // Simulated wait for Circle Attestation seamless flow
      await new Promise((resolve) => setTimeout(resolve, 3000));

      setProcessingPhase("claiming");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await fetchBalance();
      await fetchTransactions();
      setStep("success");
    } catch (error: any) {
      console.error("Bridge failed", error);
      displayToast(error.message || "Bridge execution failed");
      setStep("form");
    }
  };

  if (step === "processing") {
    const phases = ["broadcasting", "attesting", "claiming"];
    const currentPhaseIndex = phases.indexOf(processingPhase);

    return (
      <div className="absolute inset-0 bg-[#f8fafc] z-[70] flex flex-col p-6 animate-in fade-in duration-300">
        <div className="flex-1 flex flex-col items-center justify-center pt-10">
          <h3 className="text-[22px] font-black text-slate-900 mb-2 text-center">
            Transmitting to {toNetwork.name}
          </h3>
          <p className="text-slate-500 text-[14px] text-center max-w-[280px] mb-12">
            Your bridge is in progress. This typically takes 1-3 minutes
            depending on Circle CCTP attestation.
          </p>

          <div className="w-full max-w-sm bg-white p-6 rounded-[28px] shadow-sm border border-slate-100 flex flex-col gap-6">
            {/* Stepper */}
            {[
              {
                id: "broadcasting",
                label: "Burn on Arc Native",
                desc: "1-confirmation finality burn",
              },
              {
                id: "attesting",
                label: "Circle Attestation",
                desc: "Validating CCTP transaction",
              },
              {
                id: "claiming",
                label: `Mint to ${toNetwork.name}`,
                desc: "Executing receiveMessage",
              },
            ].map((p, idx) => {
              const isActive = currentPhaseIndex === idx;
              const isDone = currentPhaseIndex > idx;
              const isPending = currentPhaseIndex < idx;

              return (
                <div key={p.id} className="flex gap-4 relative">
                  {idx !== 2 && (
                    <div
                      className={`absolute left-4 top-8 bottom-[-24px] w-[2px] rounded-full transition-colors ${isDone ? "bg-slate-800" : "bg-slate-100"}`}
                    />
                  )}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${isDone ? "bg-slate-800 text-white" : isActive ? "bg-white border-2 border-slate-800 text-slate-800" : "bg-slate-100 text-slate-400"}`}
                  >
                    {isDone ? (
                      <CheckCircle2 size={16} />
                    ) : isActive ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <span className="font-bold text-[12px]">{idx + 1}</span>
                    )}
                  </div>
                  <div
                    className={`flex flex-col ${isPending ? "opacity-40" : ""}`}
                  >
                    <span className="text-[14px] font-bold text-slate-900">
                      {p.label}
                    </span>
                    <span className="text-[12px] text-slate-500">{p.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-auto px-4 pb-6 text-center">
          <p className="text-[11px] font-bold text-slate-400 mb-2">
            You can safely close this screen
          </p>
          <button
            onClick={() => {
              setStep("form");
              setShowPending(true);
            }}
            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-full font-bold text-[13px] border-0 cursor-pointer hover:bg-slate-200 transition-colors"
          >
            Run in Background
          </button>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="absolute inset-0 bg-white z-[70] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 shadow-sm shadow-emerald-100">
          <CheckCircle2 size={40} />
        </div>
        <h3 className="text-[24px] font-black text-slate-900 mb-2 tracking-tight">
          Success!
        </h3>
        <p className="text-slate-500 text-[15px] mb-8 leading-relaxed">
          {mode === "outbound"
            ? `Your bridge of ${parseFloat(amount).toFixed(2)} USDC from Arc to ${toNetwork.name} has been initiated.`
            : `Your inbound deposit from ${fromNetwork.name} has been successfully claimed on Arc.`}
        </p>
        <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-8 text-left">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[12px] font-bold text-slate-400">Status</span>
            <span className="text-[12px] font-bold text-emerald-600">
              Completed
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12px] font-bold text-slate-400">
              Network
            </span>
            <span className="text-[12px] font-bold text-slate-800">
              Arc Testnet
            </span>
          </div>
        </div>
        <button
          onClick={onSuccess}
          className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-black text-[16px] shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] cursor-pointer border-0"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[70] bg-[#f8fafc] flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 shrink-0">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h3 className="font-bold text-[16px] text-white ml-2">CCTP BRIDGE</h3>
        </div>
        <button
          onClick={() => setShowPending(true)}
          className="relative flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-[12px] font-bold text-white border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
        >
          <Loader2 size={12} className="animate-spin" />
          Recovery
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-32 scrollbar-hide">
        {/* Network Selection Dashboard */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-200 mb-2 flex flex-col gap-6 relative">
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
              Source Network
            </label>
            <button
              disabled={true}
              className={`w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl transition-colors opacity-80`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 ${fromNetwork.color} rounded-lg flex items-center justify-center text-white`}
                >
                  {fromNetwork.icon}
                </div>
                <span className="font-bold text-slate-800">
                  {fromNetwork.name}
                </span>
              </div>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
              Destination Network
            </label>
            <button
              onClick={() => {
                setShowNetworkSelect("to");
              }}
              className={`w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl transition-colors hover:border-slate-400 cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 ${toNetwork.color} rounded-lg flex items-center justify-center text-white`}
                >
                  {toNetwork.icon}
                </div>
                <span className="font-bold text-slate-800">
                  {toNetwork.name}
                </span>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
          </div>

          {/* External Wallet Connect */}
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-5 mt-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                Destination Wallet
              </label>
              <button
                onClick={() =>
                  setDestinationAddress(
                    "0x" +
                      Array.from({ length: 40 }, () =>
                        Math.floor(Math.random() * 16).toString(16),
                      ).join(""),
                  )
                }
                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 bg-indigo-50 px-2 py-1.5 rounded-lg border-0 cursor-pointer flex items-center gap-1 transition-all"
              >
                Connect External
              </button>
            </div>
            <input
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              placeholder="0x..."
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[13px] font-mono font-medium text-slate-800 outline-none focus:border-slate-400 placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-200 mb-6 text-left relative mt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
              Amount to Bridge
            </span>
          </div>
          <div className="flex items-center justify-between">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="bg-transparent text-[32px] font-black w-2/3 outline-none text-slate-800 focus:text-slate-900 placeholder-slate-200"
            />
            <div className="flex items-center gap-2 bg-slate-100 rounded-full py-1.5 px-3 border border-slate-200 h-9">
              <span className="font-bold text-slate-800 text-[14px]">USDC</span>
            </div>
          </div>
          {mode === "outbound" && (
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
              <span className="text-[12px] text-slate-500 font-medium">
                Balance: {balance.toFixed(2)} USDC
              </span>
              <button
                onClick={() => setAmount(balance.toString())}
                className="text-[11px] font-bold bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md hover:bg-slate-300 transition-colors cursor-pointer border-none"
              >
                MAX
              </button>
            </div>
          )}
        </div>

        {/* Fee Summary / Info */}
        {mode === "outbound" ? (
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-200 mb-10 text-left">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[13px] text-slate-500 font-medium">
                Bridge Details
              </span>
              <AlertCircle size={14} className="text-slate-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-slate-500">Target Chain</span>
                <span className="text-[13px] font-bold text-slate-800">
                  {toNetwork.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-slate-500">Platform Fee</span>
                <span className="text-[13px] font-bold text-slate-800">
                  0.10 USDC
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-slate-500">Network Gas (Sponsored)</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded w-fit">
                  Gratis
                </span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center mt-2">
                <span className="text-[13px] font-bold text-slate-500">Arc Settlement</span>
                <span className="text-[13px] font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded-md">
                  Instant Finality
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-200 mb-10 text-left">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[13px] text-slate-500 font-medium tracking-wide">
                Inbound Status
              </span>
              <Info size={14} className="text-slate-400" />
            </div>
            <p className="text-[12px] text-slate-500 leading-relaxed">
              Arc Network's 1-confirmation finality allows rapid claims. Once
              Circle attests the burn on {fromNetwork.name}, we will
              automatically mint the USDC to your Arc wallet.
            </p>
          </div>
        )}

        <div className="flex gap-3 px-2">
          <div className="text-slate-400 shrink-0">
            <Globe size={18} />
          </div>
          <p className="text-[12px] text-slate-500 leading-relaxed">
            Circle CCTP transfers are native and secure. No liquidity pools or
            wrapped assets involved. Attestation takes approx. 60-90 seconds.
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 z-20 shadow-2xl">
        <button
          onClick={handleBridge}
          className={`w-full bg-slate-900 text-white py-4.5 rounded-full font-black text-[16px] shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98] border-0 cursor-pointer flex items-center justify-center gap-2 ${
            !amount ||
            parseFloat(amount) <= 0 ||
            parseFloat(amount) > balance ||
            !destinationAddress
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          Initiate Bridge
        </button>
      </div>

      {/* Network Select Modal */}
      {showNetworkSelect && (
        <div className="absolute inset-0 z-[80] bg-black/40 flex items-end animate-in fade-in duration-300 pointer-events-auto">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="w-full bg-white rounded-t-[32px] p-6 pb-12 max-h-[85%] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-black text-[20px] text-slate-800">
                Select Network
              </h4>
              <button
                onClick={() => setShowNetworkSelect(null)}
                className="p-2 bg-slate-50 rounded-full text-slate-400 border-0 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {NETWORKS.map((net) => {
                // Prevent selecting Arc as destination for outbound
                if (net.id === "arc") return null;

                return (
                  <button
                    key={net.id}
                    onClick={() => {
                      setToNetwork(net);
                      setShowNetworkSelect(null);
                    }}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      toNetwork.id === net.id
                        ? "border-slate-800 bg-slate-50"
                        : "border-slate-50 bg-white hover:border-slate-100"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 ${net.color} rounded-xl flex items-center justify-center text-white shadow-sm`}
                    >
                      {net.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-black text-slate-800">{net.name}</p>
                      <p className="text-[12px] text-slate-400">
                        Circle CCTP Protocol
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Pending / Recovery Screen */}
      {showPending && (
        <div className="absolute inset-0 z-[90] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-center px-5 py-6 border-b border-slate-100">
            <h3 className="font-black text-[18px] text-slate-900">
              Pending Bridges
            </h3>
            <button
              onClick={() => setShowPending(false)}
              className="p-2 bg-slate-50 rounded-full border-0 cursor-pointer"
            >
              <X size={18} className="text-slate-500" />
            </button>
          </div>
          <div className="p-5 flex-1 overflow-y-auto bg-[#f8fafc]">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[12px] font-bold text-slate-400">
                  Tx: 0x93dc...82f1
                </span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-1 rounded-md">
                  Attesting
                </span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-black text-[20px] text-slate-900">
                  10.00 USDC
                </span>
                <ChevronRight size={14} className="text-slate-300" />
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-indigo-500 rounded flex items-center justify-center text-white">
                    <Globe size={10} />
                  </div>
                  <span className="text-[14px] font-bold text-slate-700">
                    Ethereum
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowPending(false);
                    setStep("processing");
                    setProcessingPhase("attesting");
                  }}
                  className="w-full bg-slate-900 text-white rounded-xl py-3 font-bold text-[14px] border-0 cursor-pointer"
                >
                  Resume Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
