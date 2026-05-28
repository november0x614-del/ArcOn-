import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useApp } from "../../contexts/AppContext";

interface SourceAccountCardProps {
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function SourceAccountCard({ isSelected = true, onClick, className = "" }: SourceAccountCardProps) {
  const { registeredUser, balance } = useApp();

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl border-[1.5px] transition-all active:scale-[0.98] cursor-pointer bg-white ${
        isSelected ? "border-slate-900 shadow-sm" : "border-slate-100 hover:border-slate-200"
      } ${className}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-[15px] text-slate-900 leading-none">
            EVM (Arc Testnet)
          </span>
          <span className="text-[13px] text-slate-500 font-medium lowercase">
            {registeredUser?.username || "My"}'s Wallet
          </span>
          
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-[18px] font-bold text-slate-900 font-mono">
              {(balance || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-[13px] font-bold text-slate-400">USDC</span>
          </div>
        </div>

        {isSelected && (
          <CheckCircle2 size={20} className="text-slate-900" fill="currentColor" stroke="white" />
        )}
      </div>
    </div>
  );
}
