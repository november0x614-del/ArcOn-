import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useStore } from "../../store/useStore";

interface ReceiveVAScreenProps {
  onBack: () => void;
}

export function ReceiveVAScreen({ onBack }: ReceiveVAScreenProps) {
  const { fetchBalance, fetchTransactions } = useApp();
  const { registeredUser, displayToast, activeAccountType } = useStore();
  
  const themeClasses = React.useMemo(() => ({
    container: activeAccountType === "unified" ? "bg-[#f0f9f8]" : "bg-[#ecf5fc]",
    header: activeAccountType === "unified" ? "bg-teal-900" : "bg-slate-900",
    button: activeAccountType === "unified" ? "bg-teal-600 hover:bg-teal-700 shadow-teal-500/20" : "bg-slate-900 hover:bg-slate-800",
    buttonPulse: activeAccountType === "unified" ? "bg-teal-600" : "bg-slate-900",
    buttonPulseBg: activeAccountType === "unified" ? "bg-teal-600/10" : "bg-slate-900/10",
  }), [activeAccountType]);

  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    try {
      const receiveAmount = 50; // Mock amount for VA simulation

      const response = await fetch("/api/webhook/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: registeredUser?.supabaseUid,
          amount: receiveAmount,
        }),
      });

      if (!response.ok) throw new Error("Simulation failed");

      await fetchBalance();
      await fetchTransactions();

      displayToast(`Successfully received ${receiveAmount} USDC via VA`);
      onBack();
    } catch (error) {
      console.error(error);
      displayToast("Simulation failed");
      setIsSimulating(false);
    }
  };

  return (
    <div className={`absolute inset-0 z-[60] ${themeClasses.container} flex flex-col animate-in slide-in-from-right duration-300`}>
      <div className={`flex items-center px-4 pt-6 pb-3 ${themeClasses.header} shadow-md relative z-10 w-full justify-between`}>
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h2 className="font-bold text-[16px] text-white ml-2">RECEIVE</h2>
        </div>
      </div>
      <div className="flex-1 p-6 flex flex-col items-center">
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-200 w-full">
          <h3 className="font-bold text-[15px] text-slate-800 mb-2">
            Bank Mandiri (Virtual Account)
          </h3>
          <p className="text-[13px] text-slate-500 mb-6">
            Transfer from any bank to the VA number below. Balance will be
            automatically converted to USDC.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                VA Number
              </p>
              <p className="font-mono font-bold text-[18px] text-slate-800 tracking-wider">
                8932 1820 0147
              </p>
            </div>
            <button
              className="h-10 px-4 bg-slate-100 text-slate-800 font-bold rounded-lg text-[13px] hover:bg-slate-200 transition-colors border-0 cursor-pointer"
              onClick={(e) => {
                const btn = e.currentTarget;
                const originalText = btn.innerText;
                btn.innerText = "Copied!";
                setTimeout(() => {
                  btn.innerText = originalText;
                }, 2000);
              }}
            >
              Copy
            </button>
          </div>

          <button
            className={`w-full ${themeClasses.button} text-white font-bold py-3.5 rounded-xl text-[14px] transition-colors border-0 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide`}
            onClick={handleSimulatePayment}
            disabled={isSimulating}
          >
            {isSimulating ? "Processing..." : "Simulate Payment"}
          </button>
        </div>

        <div className="mt-8 flex gap-3 px-2">
          <div className={`w-8 h-8 rounded-full ${themeClasses.buttonPulseBg} flex items-center justify-center shrink-0`}>
            <div className={`w-2 h-2 ${themeClasses.buttonPulse} rounded-full animate-pulse`}></div>
          </div>
          <div>
            <p className="text-[12px] font-bold text-slate-800 mb-1 leading-none uppercase tracking-widest">
              Instant Settlement
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Arc uses deterministic finality. Your USDC deposit will be
              credited after 1 confirmation, typically in under 1 second.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
