import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, TrendingUp, Pickaxe, PiggyBank, CircleDollarSign } from "lucide-react";
import { useStore } from "../../store/useStore";
import { BackendClient } from "../../services/api/index";
import { useBalances } from "../../hooks/useBalances";

interface EarnScreenProps {
  onBack: () => void;
}

export function StablestakeScreen({ onBack }: EarnScreenProps) {
  useBalances(); // Trigger balance fetch

  const {
    transactions,
    registeredUser,
    displayToast,
    startSyncPolling,
    balance,
  } = useStore();
  const [stakeAmountInput, setStakeAmountInput] = useState("");
  const [activeTab, setActiveTab] = useState<"deposit" | "redeem">("deposit");
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate staked amount from real transactions
  const stakedAmount = useMemo(() => {
    const stakes = transactions
      .filter(
        (tx) =>
          tx.type === "stake" &&
          (tx.status === "complete" || tx.status === "success" || tx.status === "pending"),
      )
      .reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount)), 0);

    const unstakes = transactions
      .filter(
        (tx) =>
          (tx.type === "unstake" || (tx.metadata as any)?.type === "unstake") &&
          (tx.status === "complete" || tx.status === "success" || tx.status === "pending"),
      )
      // The amount in unstake might be totalAmountToReturn (principal + reward). We need to subtract only principal.
      // But if principalAmount is not available easily in amount, we can parse it from metadata
      .reduce((sum, tx) => {
        let principalStr = (tx.metadata as any)?.principalAmount;
        let principal = 0;
        if (principalStr) {
           principal = parseFloat(principalStr.replace(" USDC", ""));
        } else {
           principal = Math.abs(parseFloat(tx.amount));
        }
        return sum + (isNaN(principal) ? 0 : principal);
      }, 0);

    return Math.max(0, stakes - unstakes);
  }, [transactions]);

  // Calculate unstaked amount to subtract? For now keep it simple or implement if backend supports.
  const [accruedRewards, setAccruedRewards] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (stakedAmount > 0) {
      interval = setInterval(() => {
        setAccruedRewards((prev) => prev + (stakedAmount * 0.055) / 31536000); // 5.5% APY
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stakedAmount]);

  const handleTransaction = async () => {
    if (!stakeAmountInput || Number(stakeAmountInput) <= 0) return;
    if (!registeredUser) return;
    
    const amount = parseFloat(stakeAmountInput);

    setIsProcessing(true);
    try {
      if (activeTab === "deposit") {
        await BackendClient.stakeTokens(amount);
        displayToast(`Subtitle: Deposit ${amount} USDC initiated`);
      } else {
        if (amount > stakedAmount) {
           throw new Error("Saldo deposit tidak mencukupi untuk penarikan ini.");
        }
        
        // Calculate proportional reward to unstake
        // In a real system, you would call contract. Redeem might claim all accrued rewards or proportional.
        // For simulation, let's claim all rewards if unstaking everything, or proportional if partial.
        const rewardToClaim = (amount / stakedAmount) * accruedRewards;
        
        await BackendClient.unstakeTokens(amount, rewardToClaim);
        
        setAccruedRewards(prev => Math.max(0, prev - rewardToClaim));
        displayToast(`Subtitle: Penarikan ${amount} USDC berhasil`);
      }
      setStakeAmountInput("");
      startSyncPolling();
    } catch (err: any) {
      displayToast(`Transaksi gagal: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#ecf5fc] relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex justify-center bg-slate-900 shadow-md relative z-10 w-full shrink-0">
        <div className="flex items-center px-4 pt-6 pb-3 w-full max-w-[500px] justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h2 className="font-bold text-[16px] text-white ml-2">CIRCLE EARN</h2>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 p-5 flex flex-col pt-6 w-full scrollbar-hide relative">
        <div className="w-full max-w-[500px] mx-auto flex flex-col relative h-full gap-5">
          {/* Intro & Info */}
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-white shrink-0 shadow-sm">
              <TrendingUp size={24} />
            </div>
            <div className="flex flex-col">
              <h3 className="font-bold text-[18px] text-slate-800 tracking-tight">
                DeFi Yield Vault
              </h3>
              <p className="text-[12px] text-slate-500 font-medium">
                Hubungkan USDC Anda ke protokol DeFi.
              </p>
            </div>
          </div>

          {/* Staking Pool Overview Card */}
          <div className="bg-white rounded-[24px] p-6 text-slate-900 flex flex-col shadow-sm relative overflow-hidden border border-slate-100">
            <div className="absolute -right-4 -bottom-4 opacity-5 text-slate-900">
              <PiggyBank size={140} />
            </div>

            <div className="flex justify-between items-start z-10 mb-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] w-fit px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-600 uppercase font-bold tracking-wider">
                  Flexible Lock
                </span>
                <h4 className="font-bold text-[22px] tracking-tight text-slate-900 leading-none mt-1">
                  USDC Liquid Pool
                </h4>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                  Est. APY
                </span>
                <span className="text-[20px] font-black text-green-600 font-mono leading-none bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                  5.50%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 z-10 w-full">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  Total Subscribed
                </span>
                <span className="text-[18px] font-black text-slate-900 font-mono">
                  {stakedAmount.toFixed(2)} USDC
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  Unclaimed Yield
                </span>
                <span className="text-[18px] font-black text-green-500 font-mono">
                  +{accruedRewards > 0 ? accruedRewards.toFixed(6) : "0.00"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Tabs and Input */}
          <div className="flex flex-col mt-4">
            <div className="flex bg-slate-200/50 p-1 rounded-[16px] mb-4 w-fit mx-auto border border-slate-200">
              <button
                onClick={() => setActiveTab("deposit")}
                className={`py-2 px-6 text-[12px] font-bold rounded-[12px] transition-all border-0 cursor-pointer ${
                  activeTab === "deposit"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "bg-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Deposit (Earn)
              </button>
              <button
                onClick={() => setActiveTab("redeem")}
                className={`py-2 px-6 text-[12px] font-bold rounded-[12px] transition-all border-0 cursor-pointer ${
                  activeTab === "redeem"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "bg-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Redeem (Unstake)
              </button>
            </div>

            {/* Input Form */}
            <div
              className={`bg-white p-5 rounded-[24px] shadow-sm border transition-all duration-300 relative z-10 ${isProcessing ? "border-blue-400/50 shadow-blue-100/50 opacity-80" : "border-slate-200 focus-within:border-slate-400"}`}
            >
              <div className="flex justify-between items-center mb-4">
                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                  {activeTab === "deposit" ? "Nominal Deposit" : "Nominal Penarikan"}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-slate-500">
                    Balance:{" "}
                    {activeTab === "deposit"
                      ? balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : stakedAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                    USDC
                  </span>
                  <button
                    onClick={() => {
                      if (activeTab === "deposit") {
                        setStakeAmountInput(balance.toString());
                      } else {
                        setStakeAmountInput(stakedAmount.toString());
                      }
                    }}
                    className="bg-slate-100 text-slate-800 font-bold text-[10px] px-2 py-0.5 rounded uppercase hover:bg-slate-200 transition-colors border-0 cursor-pointer"
                  >
                    MAX
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <input
                  type="number"
                  value={stakeAmountInput}
                  onChange={(e) => setStakeAmountInput(e.target.value)}
                  disabled={isProcessing}
                  className="w-1/2 bg-transparent border-none outline-none text-[36px] font-extrabold text-slate-800 placeholder:text-slate-200 disabled:opacity-50"
                  placeholder="0"
                />
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-full shrink-0 h-10">
                  <div className="w-6 h-6 rounded-full bg-[#2775ca] flex items-center justify-center">
                    <CircleDollarSign size={14} className="text-white" />
                  </div>
                  <span className="font-bold text-slate-800 text-[14px]">USDC</span>
                </div>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-400 font-medium px-2 text-center mt-3 mb-6">
              {activeTab === "deposit" 
                ? "Dana akan dikunci dalam smart contract DeFi dan mulai menghasilkan bunga." 
                : "Penarikan instan dari pool likuiditas (tanpa unbonding period)."}
            </p>
            
            {/* Action Button */}
            <button
              onClick={handleTransaction}
              disabled={isProcessing || !stakeAmountInput}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-full text-[15px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-0 cursor-pointer shadow-lg hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {isProcessing 
                ? "Memproses..." 
                : activeTab === "deposit" 
                  ? "Konfirmasi Deposit" 
                  : "Tarik Dana"}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
