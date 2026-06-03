import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, TrendingUp, Pickaxe, PiggyBank, CircleDollarSign } from "lucide-react";
import { useStore } from "../../store/useStore";
import { BackendClient } from "../../services/api/index";

interface EarnScreenProps {
  onBack: () => void;
}

export function StablestakeScreen({ onBack }: EarnScreenProps) {
  const { transactions, registeredUser, displayToast, startSyncPolling } =
    useStore();
  const [stakeAmountInput, setStakeAmountInput] = useState("");
  const [activeTab, setActiveTab] = useState<"deposit" | "redeem">("deposit");
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balResp = await BackendClient.getBalance();
        if (balResp && balResp.tokenBalances && balResp.tokenBalances.length > 0) {
          setBalance(parseFloat(balResp.tokenBalances[0].amount));
        }
      } catch (err) {
        console.error("Failed to fetch balance", err);
      }
    };
    fetchBalance();
  }, []);

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
    <div className="w-full h-full bg-slate-50 relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Hero Header Atas */}
      <div className="flex justify-center bg-slate-900 rounded-b-[40px] shadow-sm relative z-10 w-full shrink-0">
        <div className="flex flex-col px-4 pt-6 pb-8 w-full max-w-[500px]">
          <div className="flex items-center mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95 cursor-pointer border-0 bg-transparent flex items-center justify-center text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="font-bold text-[16px] text-white ml-2 tracking-tight uppercase">CIRCLE EARN</h2>
          </div>
          
          <div className="flex items-center gap-4 px-2 mt-2">
            <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm">
              <TrendingUp size={24} />
            </div>
            <div className="flex flex-col">
              <h3 className="font-bold text-[20px] text-white tracking-tight leading-tight">
                DeFi Yield Vault
              </h3>
              <p className="text-[13px] text-slate-300 font-medium">
                Hubungkan USDC Anda ke protokol DeFi.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 p-5 flex flex-col w-full scrollbar-hide relative bg-slate-50">
        <div className="w-full max-w-[500px] mx-auto flex flex-col relative h-full gap-5 mt-2">

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

          {/* Action Tabs */}
          <div className="flex flex-col gap-4">
            <div className="flex bg-slate-50 p-1.5 rounded-[16px] border border-slate-100">
              <button
                onClick={() => setActiveTab("deposit")}
                className={`flex-1 py-2.5 text-[13px] font-bold rounded-[12px] transition-all border-0 cursor-pointer ${
                  activeTab === "deposit"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "bg-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Subscribe (Deposit)
              </button>
              <button
                onClick={() => setActiveTab("redeem")}
                className={`flex-1 py-2.5 text-[13px] font-bold rounded-[12px] transition-all border-0 cursor-pointer ${
                  activeTab === "redeem"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "bg-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Redeem (Unstake)
              </button>
            </div>

            {/* Input Form */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-end px-1">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                  {activeTab === "deposit" ? "Nominal Deposit" : "Nominal Penarikan"}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-400">
                    {activeTab === "deposit" 
                      ? `Tersedia: ${balance.toFixed(2)} USDC` 
                      : `Tersedia: ${stakedAmount.toFixed(2)} USDC`}
                  </span>
                  <button
                    onClick={() => {
                      if (activeTab === "deposit") {
                        setStakeAmountInput(balance.toString());
                      } else {
                        setStakeAmountInput(stakedAmount.toString());
                      }
                    }}
                    className="text-[11px] font-bold text-blue-600 cursor-pointer hover:underline bg-blue-50 px-2 py-0.5 rounded border border-blue-100"
                  >
                    Max
                  </button>
                </div>
              </div>
              
              <div className="relative flex items-center">
                <div className="absolute left-4 text-slate-400 flex items-center justify-center">
                  <CircleDollarSign size={20} />
                </div>
                <input
                  type="number"
                  value={stakeAmountInput}
                  onChange={(e) => setStakeAmountInput(e.target.value)}
                  className="w-full bg-white border-[1.5px] border-slate-200 rounded-[16px] pl-11 pr-16 py-4 text-[18px] font-mono font-black text-slate-900 focus:outline-none focus:border-slate-900 transition-all shadow-sm"
                  placeholder="0.00"
                />
                <span className="absolute right-4 text-[13px] font-black text-slate-400 font-mono">
                  USDC
                </span>
              </div>
              
              <p className="text-[11px] text-slate-400 font-medium px-1">
                {activeTab === "deposit" 
                  ? "Dana akan dikunci dalam smart contract DeFi pilihan dan mulai menghasilkan bunga." 
                  : "Penarikan instan dari pool likuiditas (tanpa unbonding period)."}
              </p>
            </div>
            
            {/* Action Button */}
            <button
              onClick={handleTransaction}
              disabled={isProcessing || !stakeAmountInput}
              className={`w-full text-white font-bold py-4 rounded-[16px] text-[15px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-0 cursor-pointer shadow-sm mt-2 ${
                activeTab === "deposit" 
                  ? "bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300" 
                  : "bg-white text-slate-900 border-[1.5px] border-slate-200 hover:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 disabled:bg-slate-50"
              }`}
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
