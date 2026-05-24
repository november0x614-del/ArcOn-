import React, { useState, useEffect } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { formatCurrency } from "../../lib/utils";

interface StablestakeScreenProps {
  onBack: () => void;
}

export function StablestakeScreen({ onBack }: StablestakeScreenProps) {
  const [stakedAmount, setStakedAmount] = useState(0);
  const [accruedRewards, setAccruedRewards] = useState(0);
  const [stakeAmountInput, setStakeAmountInput] = useState("");
  const [isStaking, setIsStaking] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (stakedAmount > 0) {
      interval = setInterval(() => {
        setAccruedRewards((prev) => prev + (stakedAmount * 0.125) / 31536000);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stakedAmount]);

  return (
    <div className="w-full h-full bg-slate-50 relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center px-4 pt-12 pb-4 bg-white border-b border-slate-100 shadow-sm relative z-10 w-full">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200"
        >
          <ArrowLeft size={24} className="text-slate-800" />
        </button>
        <h2 className="font-bold text-[16px] text-slate-800 ml-2">
          StableStake Vault
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 p-5 flex flex-col pt-6 w-full scrollbar-hide relative bg-white">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-md">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="font-bold text-[18px] text-slate-800 leading-tight font-sans">
              StableStake Vault
            </h3>
            <p className="text-[12px] text-[#3FA2F6] font-bold font-sans">
              Arc Network L1 Simulation
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 text-left font-sans">
          <p className="text-[14px] text-slate-500 leading-relaxed">
            Decentralized staking simulator. Lock cumulative USDC on Arc Testnet
            Validators to trigger automated compound generation on-chain.
          </p>

          {/* Staking Pool Overview Card */}
          <div className="bg-gradient-to-tr from-slate-900 to-slate-800 rounded-[24px] p-6 text-white flex flex-col gap-5 shadow-lg relative overflow-hidden mt-2">
            <div className="absolute -right-4 -top-4 opacity-10">
              <ShieldCheck size={140} />
            </div>

            <div className="flex justify-between items-center z-10">
              <div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 uppercase font-bold tracking-wider">
                  Arc-L1 Node Validator
                </span>
                <h4 className="font-bold text-[20px] mt-2 font-sans tracking-tight">
                  Active Vault Pool #3A
                </h4>
              </div>
              <div className="text-right bg-black/20 p-2 rounded-xl backdrop-blur-sm border border-white/10">
                <span className="text-[10px] text-slate-300 uppercase tracking-widest block mb-0.5">
                  APY Rate
                </span>
                <span className="text-[20px] font-black text-emerald-400 font-mono leading-none block">
                  12.5%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-700/50 pt-4 z-10 w-full">
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-[11px] text-slate-400 block font-sans mb-1 uppercase tracking-wider">
                  Total Staked
                </span>
                <span className="text-[20px] font-extrabold text-slate-200 font-mono block">
                  {formatCurrency(stakedAmount)}
                </span>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-[11px] text-slate-400 block font-sans mb-1 uppercase tracking-wider">
                  Yield Earned
                </span>
                <span className="text-[20px] font-extrabold text-yellow-400 font-mono block">
                  ${accruedRewards > 0 ? accruedRewards.toFixed(6) : "0.000"}
                </span>
              </div>
            </div>
          </div>

          {/* Stake Inputs */}
          <div className="bg-slate-50 border border-slate-200 rounded-[20px] p-5 flex flex-col gap-4 font-sans mt-2 shadow-sm">
            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">
              Modify Stake Position
            </span>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={stakeAmountInput}
                  onChange={(e) => setStakeAmountInput(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-4 pr-12 py-3.5 text-[16px] font-mono font-bold text-slate-800 focus:outline-none focus:border-[#3FA2F6] focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                  placeholder="0.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-400">
                  USDC
                </span>
              </div>
              <button
                onClick={() => {
                  if (!stakeAmountInput || Number(stakeAmountInput) <= 0)
                    return;
                  setIsStaking(true);
                  setTimeout(() => {
                    setStakedAmount((prev) => prev + Number(stakeAmountInput));
                    setStakeAmountInput("");
                    setIsStaking(false);
                  }, 1000);
                }}
                disabled={isStaking || !stakeAmountInput}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 rounded-2xl text-[14px] active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 border-0 cursor-pointer shadow-md"
              >
                {isStaking ? "Staking..." : "Stake"}
              </button>
            </div>
          </div>

          {/* Quick helper guides */}
          {stakedAmount > 0 && (
            <div className="flex flex-col gap-3 font-sans mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-[16px] flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                  <div>
                    <span className="block text-[14px] text-emerald-900 font-bold font-sans">
                      Compounding Auto-Yield
                    </span>
                    <span className="block text-[11px] text-emerald-600 font-medium mt-0.5">
                      Accruing 12.5% APY per block
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAccruedRewards(0);
                  }}
                  className="text-[12px] font-bold text-emerald-700 bg-emerald-200/50 hover:bg-emerald-200 px-3 py-2 rounded-xl transition-colors border-0 cursor-pointer shadow-sm"
                >
                  Claim
                </button>
              </div>

              <button
                onClick={() => {
                  setStakedAmount(0);
                  setAccruedRewards(0);
                }}
                className="w-full bg-white border border-slate-200 text-red-500 py-3.5 rounded-2xl text-[14px] font-bold hover:bg-red-50 transition-all cursor-pointer shadow-sm mt-2"
              >
                Withdraw & Unstake All Funds
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
