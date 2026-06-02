import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  Wallet,
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useStore } from "../../store/useStore";

interface UnifiedBalanceScreenProps {
  onBack: () => void;
}

export function UnifiedBalanceScreen({ onBack }: UnifiedBalanceScreenProps) {
  const { registeredUser, displayToast } = useApp();
  const { activeAccountType } = useStore();
  const [balance, setBalance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [activeTab, setActiveTab] = useState<"deposit" | "spend">("deposit");

  const themeClasses = React.useMemo(() => ({
    header: activeAccountType === "unified" ? "bg-teal-900" : "bg-slate-900",
    button: activeAccountType === "unified" ? "bg-teal-900" : "bg-slate-900",
    border: activeAccountType === "unified" ? "border-teal-900" : "border-slate-900",
  }), [activeAccountType]);

  const fetchBalance = async () => {
    if (!registeredUser?.walletAddress) return;
    try {
      const res = await fetch(`/api/unified/balance/${registeredUser.walletAddress}`);
      const data = await res.json();
      setBalance(data);
    } catch (err) {
      console.error("Balance fetch error", err);
      displayToast("Failed to fetch balance");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [registeredUser?.walletAddress]);

  const handleAction = async () => {
    if (!amount || !registeredUser) return;
    
    setIsLoading(true);
    const endpoint = activeTab === "deposit" ? "/api/unified/deposit" : "/api/unified/spend";
    const body = {
      amount,
      userAddress: registeredUser.walletAddress,
      userId: registeredUser.supabaseUid,
      recipientAddress: activeTab === "spend" ? recipient : undefined,
      chain: "Base_Sepolia" // Defaulting for now
    };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        displayToast(`${activeTab === "deposit" ? "Deposit" : "Spend"} successful`);
        fetchBalance();
      } else {
        displayToast(data.error || "Action failed");
      }
    } catch (err) {
      displayToast("Action failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[70] bg-[#ecf5fc] flex flex-col animate-in slide-in-from-right duration-300">
      <div className={`flex justify-center ${themeClasses.header} shadow-md relative shrink-0 w-full`}>
        <div className="flex items-center justify-between px-4 pt-6 pb-3 w-full max-w-[500px]">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full bg-transparent border-0 cursor-pointer">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h3 className="font-bold text-[16px] text-white">UNIFIED BALANCE</h3>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-slate-100 rounded-full text-slate-600">
              <Wallet size={20} />
            </div>
            <span className="text-slate-500 font-bold text-[13px]">Total Balance</span>
          </div>
          <p className="text-[32px] font-black text-slate-900">
            {isLoading ? "..." : `${balance?.totalConfirmedBalance || "0.00"} USDC`}
          </p>
        </div>

        <div className="flex bg-white rounded-2xl p-1 mb-6 border border-slate-100">
          <button
            onClick={() => setActiveTab("deposit")}
            className={`flex-1 py-3 rounded-xl text-[13px] font-bold border-0 cursor-pointer transition-colors ${activeTab === "deposit" ? `${themeClasses.button} text-white` : "bg-transparent text-slate-500"}`}
          >
            Deposit
          </button>
          <button
            onClick={() => setActiveTab("spend")}
            className={`flex-1 py-3 rounded-xl text-[13px] font-bold border-0 cursor-pointer transition-colors ${activeTab === "spend" ? `${themeClasses.button} text-white` : "bg-transparent text-slate-500"}`}
          >
            Spend
          </button>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (USDC)"
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4 text-[14px]"
          />
          {activeTab === "spend" && (
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Recipient Address"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4 text-[14px]"
            />
          )}
          <button
            onClick={handleAction}
            disabled={isLoading}
            className={`w-full ${themeClasses.button} text-white py-4 rounded-2xl font-bold text-[15px] cursor-pointer`}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin mx-auto" /> : (activeTab === "deposit" ? "Confirm Deposit" : "Confirm Spend")}
          </button>
        </div>
      </div>
    </div>
  );
}
