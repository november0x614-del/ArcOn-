import React from "react";
import {
  ArrowDownToLine,
  QrCode,
  ArrowUpToLine,
  ArrowLeft,
} from "lucide-react";

interface DepositOptionsScreenProps {
  onBack: () => void;
  onSelectUSDC: () => void;
  onSelectVA: () => void;
  onSelectQRIS: () => void;
  onSelectWithdraw?: () => void;
  platformConfig?: any;
}

export function DepositOptionsScreen({
  onBack,
  onSelectUSDC,
  onSelectVA,
  onSelectQRIS,
  onSelectWithdraw,
  platformConfig,
}: DepositOptionsScreenProps) {
  const isVaEnabled = !platformConfig || platformConfig.vaEnabled !== false;
  const isQrisEnabled = !platformConfig || platformConfig.qrisEnabled !== false;
  const isWithdrawEnabled =
    !platformConfig || platformConfig.withdrawEnabled !== false;

  return (
    <div className="absolute inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h2 className="font-bold text-[16px] text-white ml-2">
            FUNDS MANAGEMENT
          </h2>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto scrollbar-hide">
        <div>
          <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-3">
            Deposit / Receive
          </h4>
          <div className="flex flex-col gap-3">
            <button
              onClick={onSelectUSDC}
              className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all text-left bg-transparent cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-1000 flex items-center justify-center text-white shrink-0">
                <div className="font-black text-[12px]">USDC</div>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-[15px] text-slate-800">
                  USDC On-chain
                </h4>
                <p className="text-[11px] text-slate-400">
                  Receive from other wallets via Arc-L1
                </p>
              </div>
            </button>

            {isVaEnabled && (
              <button
                onClick={onSelectVA}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all text-left bg-transparent cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0">
                  <ArrowDownToLine size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-[15px] text-slate-800">
                    Virtual Account
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Top-up via Bank Transfer (USDC)
                  </p>
                </div>
              </button>
            )}

            {isQrisEnabled && (
              <button
                onClick={onSelectQRIS}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all text-left bg-transparent cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center text-white shrink-0">
                  <QrCode size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-[15px] text-slate-800">
                    QRIS Receipt
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Receive from m-Banking / e-Wallet
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>

        {isWithdrawEnabled && (
          <div>
            <h4 className="text-[12px] font-black text-red-500 uppercase tracking-widest mb-3">
              Withdraw to Cash
            </h4>
            <div className="flex flex-col gap-3">
              <button
                onClick={onSelectWithdraw}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all text-left bg-transparent cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center text-white shrink-0">
                  <ArrowUpToLine size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-[15px] text-slate-800">
                    Withdraw to Bank
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Cash out USDC to your bank account
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
