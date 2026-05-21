import React from 'react';
import { X, ArrowDownToLine, QrCode, ArrowUpToLine } from 'lucide-react';

interface DepositOptionsScreenProps {
  onBack: () => void;
  onSelectUSDC: () => void;
  onSelectVA: () => void;
  onSelectQRIS: () => void;
  onSelectWithdraw?: () => void;
}

export function DepositOptionsScreen({ onBack, onSelectUSDC, onSelectVA, onSelectQRIS, onSelectWithdraw }: DepositOptionsScreenProps) {
  return (
    <div className="absolute inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="flex justify-between items-center px-6 pt-12 pb-4 border-b border-slate-100 shadow-sm relative z-10">
        <h3 className="font-bold text-[20px] text-slate-800">Funds Management</h3>
        <button
          onClick={onBack}
          className="p-1 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200 bg-transparent border-0 cursor-pointer"
        >
          <X size={22} className="text-slate-500" strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto scrollbar-hide">
        <div>
          <h4 className="text-[12px] font-black text-[#3FA2F6] uppercase tracking-widest mb-3">Deposit / Receive</h4>
          <div className="flex flex-col gap-3">
            <button 
              onClick={onSelectUSDC}
              className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all text-left bg-transparent cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white shrink-0">
                <div className="font-black text-[12px]">USDC</div>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-[15px] text-slate-800">USDC On-chain</h4>
                <p className="text-[11px] text-slate-400">Receive from other wallets via Arc-L1</p>
              </div>
            </button>

            <button 
              onClick={onSelectVA}
              className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all text-left bg-transparent cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0">
                <ArrowDownToLine size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-[15px] text-slate-800">Virtual Account</h4>
                <p className="text-[11px] text-slate-400">Top-up via Bank Transfer (USDC)</p>
              </div>
            </button>

            <button 
              onClick={onSelectQRIS}
              className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all text-left bg-transparent cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center text-white shrink-0">
                <QrCode size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-[15px] text-slate-800">QRIS Receipt</h4>
                <p className="text-[11px] text-slate-400">Receive from m-Banking / e-Wallet</p>
              </div>
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-[12px] font-black text-red-500 uppercase tracking-widest mb-3">Withdraw to Cash</h4>
          <div className="flex flex-col gap-3">
             <button 
              onClick={onSelectWithdraw}
              className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all text-left bg-transparent cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center text-white shrink-0">
                <ArrowUpToLine size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-[15px] text-slate-800">Withdraw to Bank</h4>
                <p className="text-[11px] text-slate-400">Cash out USDC to your bank account</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
