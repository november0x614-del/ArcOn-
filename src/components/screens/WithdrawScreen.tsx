import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  CheckCircle2,
  Loader2,
  ArrowRight,
  X,
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useArc } from "../../contexts/ArcContext";

interface WithdrawScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  hideBack?: boolean;
}

export function WithdrawScreen({ onBack, onSuccess, hideBack }: WithdrawScreenProps) {
  const {
    balance,
    fetchBalance,
    fetchTransactions,
    displayToast,
    registeredUser,
    platformConfig,
    fetchPlatformConfig,
  } = useApp();

  useEffect(() => {
    if (!platformConfig) {
      fetchPlatformConfig();
    }
  }, [platformConfig, fetchPlatformConfig]);

  const { getFeeEstimate } = useArc();
  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  // Sponsored fee - no client estimation needed
  const PLATFORM_FEE = platformConfig?.withdrawFee
    ? parseFloat(platformConfig.withdrawFee.replace(/[^0-9.]/g, '')) || 0.1
    : 0.1;
  const IS_GAS_FREE = platformConfig?.gasSubsidyEnabled;

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      displayToast("Please enter a valid amount.");
      return;
    }
    const totalRequired = numAmount + PLATFORM_FEE; // amount + platform fee
    if (totalRequired > balance) {
      displayToast(
        `Insufficient balance. Requires ${totalRequired.toFixed(2)} USDC (inc. ${PLATFORM_FEE.toFixed(2)} Platform Fee)`,
      );
      return;
    }

    setStep("processing");

    try {
      const response = await fetch("/api/withdraw/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: registeredUser?.supabaseUid,
          amount: amount,
          bank: selectedBank,
          memo: memo || undefined,
        }),
      });

      if (!response.ok) throw new Error("Withdraw failed");

      await fetchBalance();
      await fetchTransactions();

      setStep("success");
    } catch (err) {
      console.error("Withdraw Error", err);
      displayToast("Withdraw failed");
      setStep("form");
    }
  };

  if (step === "processing") {
    return (
      <div className="absolute inset-0 bg-[#ecf5fc] z-[70] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
        <Loader2 className="animate-spin text-slate-800 mb-6" size={48} />
        <h3 className="text-[20px] font-bold text-slate-800 mb-2">
          Processing Withdrawal
        </h3>
        <p className="text-slate-500 text-[14px]">
          Sending USDC to Liquidity Provider for Bank Settlement...
        </p>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="absolute inset-0 bg-[#ecf5fc] z-[70] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h3 className="text-[22px] font-bold text-slate-800 mb-2">
          Withdrawal Initiated
        </h3>
        <p className="text-slate-500 text-[15px] mb-8">
          Your withdrawal of{" "}
          <span className="font-bold text-slate-800">
            {parseFloat(amount).toFixed(2)} USDC
          </span>{" "}
          to {selectedBank} is being processed.
        </p>
        <button
          onClick={() => {
            setAmount("");
            setMemo("");
            setStep("form");
          }}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold transition-all active:scale-[0.98] border-0 cursor-pointer"
        >
          Return to Withdraw
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[70] bg-[#ecf5fc] flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex justify-center bg-slate-900 shadow-md relative z-10 w-full">
        <div className="flex items-center px-4 pt-6 pb-3 w-full max-w-[500px] justify-between">
          <div className="flex items-center">
            {!hideBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent flex items-center justify-center animate-in fade-in"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
            )}
            <h2 className="font-bold text-[16px] text-white">
              WITHDRAW TO BANK
            </h2>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-32">
        <div className="w-full max-w-[500px] mx-auto flex flex-col relative w-full h-full">
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-200 mb-2 text-left space-y-4">
          <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block">
            Bank Destination Details
          </label>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Bank Name
              </label>
              <input
                type="text"
                placeholder="e.g. Bank Central Asia (BCA)"
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-800 outline-none focus:border-slate-400 transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Account Number
              </label>
              <input
                type="text"
                placeholder="e.g. 8830192831"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-800 outline-none focus:border-slate-400 transition-colors"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-200 mb-6 text-left relative mt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
              Withdraw Amount
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

          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
            <span className="text-[12px] text-slate-500 font-medium">
              Available: {balance.toFixed(2)} USDC
            </span>
            <button
              onClick={() => setAmount(balance.toString())}
              className="text-[11px] font-bold bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md hover:bg-slate-300 transition-colors cursor-pointer border-none"
            >
              MAX
            </button>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-5">
            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Withdrawal Memo (Optional)
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="e.g. Account identifier for exchange"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-800 outline-none focus:border-slate-400 transition-colors"
            />
            <p className="text-[10px] text-slate-400 mt-2 px-1 leading-relaxed">
              *Important for sending to exchanges.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-200 mb-6 text-left">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[13px] text-slate-500 font-medium tracking-wide">
              Withdrawal Details
            </span>
            <Building2 size={14} className="text-slate-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-slate-500">Platform Fee</span>
              <span className="text-[13px] font-bold text-slate-800">
                {PLATFORM_FEE.toFixed(2)} USDC
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-slate-500">
                Network Gas (Sponsored)
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded w-fit ${IS_GAS_FREE ? "text-emerald-600 bg-emerald-50" : "text-slate-600 bg-slate-50"}`}
              >
                {IS_GAS_FREE ? "Free" : "Native"}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center mt-2">
              <span className="text-[13px] font-bold text-slate-500">
                Processing Time
              </span>
              <span className="text-[13px] font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded-md">
                ~5-15 Min
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex gap-3 text-left mb-6">
          <div className="text-slate-800 shrink-0 mt-0.5">
            <CheckCircle2 size={16} />
          </div>
          <p className="text-[12px] text-blue-700 leading-relaxed font-medium">
            Funds will be converted to local currency and sent to your bank
            account via partner liquidity nodes. Settlement usually takes 5-15
            minutes.
          </p>
        </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-50 flex justify-center">
        <div className="w-full max-w-[500px]">
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={!amount || parseFloat(amount) <= 0 || (parseFloat(amount) + PLATFORM_FEE) > balance || !selectedBank || !accountNumber}
            className={`w-full py-4 rounded-full font-bold transition-all active:scale-[0.98] border-0 cursor-pointer shadow-lg
              ${(!amount || parseFloat(amount) <= 0 || (parseFloat(amount) + PLATFORM_FEE) > balance || !selectedBank || !accountNumber) 
                ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" 
                : "bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800"}
            `}
          >
            {(!amount || parseFloat(amount) <= 0) 
              ? "Confirm Withdrawal" 
              : (parseFloat(amount) + PLATFORM_FEE) > balance 
                ? "Insufficient Balance" 
                : (!selectedBank || !accountNumber)
                  ? "Enter Bank Information"
                  : "Review Withdrawal"}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="absolute inset-0 z-[80] bg-black/40 flex flex-col justify-end animate-in fade-in duration-300 pointer-events-auto">
          <div className="bg-white rounded-t-[24px] w-full flex flex-col relative max-h-[85%] shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="px-5 pt-6 pb-4 flex justify-between items-center border-b border-slate-100">
              <h3 className="font-bold text-[18px] text-slate-800">Review Withdrawal</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 p-1 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200 bg-transparent border-0 cursor-pointer"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>

            <div className="px-5 pb-6 overflow-y-auto pt-5 flex-1 block">
              {/* Destination Bank Preview */}
              <div className="flex items-center gap-4 mb-6 text-left">
                <div className="w-[46px] h-[46px] rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                  <Building2 size={22} />
                </div>
                <div className="flex flex-col overflow-hidden gap-[2px]">
                  <span className="font-extrabold text-[15px] text-slate-800 uppercase tracking-tight truncate">
                    {selectedBank}
                  </span>
                  <span className="text-slate-500 text-[13px] truncate font-medium">
                    Account: {accountNumber}
                  </span>
                </div>
              </div>

              {/* Withdrawal Details Table */}
              <div className="flex flex-col gap-3.5 mb-6 text-left text-[14px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Withdrawal Amount</span>
                  <span className="text-slate-800 font-bold">{parseFloat(amount).toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Platform Fee</span>
                  <span className="text-slate-800 font-bold">{PLATFORM_FEE.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Network Gas</span>
                  <span className="text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-md text-[11px]">Sponsored (Free)</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center mt-2.5">
                  <span className="text-slate-800 font-bold">Total Deduction</span>
                  <span className="text-slate-950 font-black text-[16px]">{(parseFloat(amount) + PLATFORM_FEE).toFixed(2)} USDC</span>
                </div>
              </div>
            </div>

            {/* Confirm Bottom CTA Button */}
            <div className="px-5 py-5 bg-white shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] border-t border-slate-100">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  handleWithdraw();
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-[16px] rounded-full flex justify-between px-6 items-center transition-all shadow-[0_4px_14px_rgba(15,23,42,0.3)] active:scale-[0.98] border-0 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[15px]">Confirm Withdrawal</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-[16px] tracking-tight">{(parseFloat(amount) + PLATFORM_FEE).toFixed(2)} USDC</span>
                  <div className="bg-white/20 p-1.5 rounded-full border-0 flex items-center justify-center">
                    <ArrowRight size={18} strokeWidth={3} />
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
