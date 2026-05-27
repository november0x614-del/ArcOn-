import React from "react";
import { ArrowLeft, Wallet, ChevronRight, Plus } from "lucide-react";

interface OtherAccountsScreenProps {
  onBack: () => void;
}

export function OtherAccountsScreen({ onBack }: OtherAccountsScreenProps) {
  const accounts = [
    {
      name: "USDC Checking Account",
      number: "123-00-1122334",
      balance: "5,000.00",
      type: "Checking",
      isWeb3: true,
    },
    {
      name: "ARC Deposit Savings",
      number: "123-00-9988776",
      balance: "12,500.00",
      type: "Savings",
      isWeb3: true,
    },
    {
      name: "Global Savings Account",
      number: "123-00-4455667",
      balance: "1,500.00",
      type: "Legacy",
      isWeb3: false,
    },
  ];

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
          <h2 className="font-bold text-[16px] text-white ml-2">ACCOUNTS</h2>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        <div className="mb-8">
          <h3 className="text-[24px] font-extrabold text-slate-800 leading-tight mb-2 tracking-tight">
            All Accounts
          </h3>
          <p className="text-[14px] text-slate-500">
            Manage and view balances from various assets in one place.
          </p>
        </div>

        <div className="space-y-4">
          {accounts.map((acc, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow cursor-pointer group active:scale-[0.98]"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-2xl ${acc.isWeb3 ? "bg-slate-100 text-slate-800" : "bg-slate-100 text-slate-500"}`}
                  >
                    <Wallet size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-[15px]">
                      {acc.name}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {acc.number}
                    </p>
                  </div>
                </div>
                {acc.isWeb3 && (
                  <span className="text-[8px] font-black text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 tracking-widest uppercase">
                    Web3
                  </span>
                )}
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Available Balance
                  </span>
                  <p className="text-xl font-bold text-slate-800 h-8 flex items-baseline gap-1 mt-1">
                    {acc.balance}{" "}
                    <span className="text-[10px] text-slate-400 font-medium">
                      {acc.isWeb3 ? "USDC" : ""}
                    </span>
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-slate-800 group-hover:bg-slate-100 transition-colors">
                  <ChevronRight size={18} />
                </div>
              </div>
            </div>
          ))}

          <button className="w-full py-5 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-slate-800 hover:border-slate-900 hover:bg-slate-100 transition-all group">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Plus size={24} />
            </div>
            <span className="text-[13px] font-bold">Connect New Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
