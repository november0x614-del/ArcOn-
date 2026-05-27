import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useApp } from "../../contexts/AppContext";

interface ReceiveQRISScreenProps {
  onBack: () => void;
}

export function ReceiveQRISScreen({ onBack }: ReceiveQRISScreenProps) {
  const { registeredUser, displayToast, fetchBalance, fetchTransactions } =
    useApp();
  const userName = registeredUser?.username || "Arc User";
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    try {
      const receiveAmount = 10; // Mock amount for QRIS simulation

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

      displayToast(`Successfully received ${receiveAmount} USDC via QRIS`);
      onBack();
    } catch (error) {
      console.error(error);
      displayToast("Simulation failed");
      setIsSimulating(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[60] bg-slate-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full justify-between">
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
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 w-full max-w-[320px] flex flex-col items-center relative overflow-hidden">
          <h3 className="font-bold text-[18px] text-slate-800 text-center mb-1">
            {userName}
          </h3>
          <p className="text-[13px] text-slate-500 mb-5">NMID: ID1029384756</p>

          <div className="w-56 h-56 bg-white border-2 border-slate-100 rounded-xl flex items-center justify-center p-3 mb-6 relative">
            <div className="w-full h-full border-2 border-slate-800 rounded-lg flex flex-col items-center justify-center p-2 relative">
              <div className="grid grid-cols-5 gap-1.5 w-full h-full p-2">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${i % 2 === 0 || i % 7 === 0 || i < 5 || i % 4 === 0 ? "bg-slate-900" : "bg-slate-100"}`}
                  />
                ))}
              </div>
            </div>
            {/* QRIS Logo placeholder in center */}
            <div className="absolute w-14 h-14 bg-white rounded-xl shadow-sm border-[3px] border-white flex items-center justify-center text-[12px] font-black tracking-widest text-[#ed1b24] italic p-1 text-center">
              QRIS
            </div>
          </div>

          <div className="w-full h-[1px] border-b border-dashed border-slate-200 my-2"></div>
          <p className="text-[12px] text-slate-400 text-center font-medium mt-3 mb-6 leading-relaxed">
            Show this QR code to receive payments from any m-Banking or
            e-Wallet.
          </p>

          <button
            className="w-full bg-[#ed1b24] text-white font-bold py-3 rounded-xl text-[14px] hover:bg-red-700 transition-colors border-0 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={handleSimulatePayment}
            disabled={isSimulating}
          >
            {isSimulating ? "Processing..." : "Simulate QRIS"}
          </button>
        </div>
      </div>
    </div>
  );
}
