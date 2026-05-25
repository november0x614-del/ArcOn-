import React, { useState } from 'react';
import { ArrowLeft, Building2, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface WithdrawScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function WithdrawScreen({ onBack, onSuccess }: WithdrawScreenProps) {
  const { balance, fetchBalance, fetchTransactions, displayToast, registeredUser } = useApp();
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [amount, setAmount] = useState('');
  const [selectedBank] = useState('Central Asia Bank (BCA)');
  const [accountNumber] = useState('8830192831');

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      displayToast("Please enter a valid amount.");
      return;
    }
    if (numAmount > balance) {
      displayToast("Insufficient balance.");
      return;
    }

    setStep('processing');
    
    try {
       const response = await fetch('/api/withdraw/execute', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           userId: registeredUser?.supabaseUid,
           amount: amount,
           bank: selectedBank
         })
       });
       
       if (!response.ok) throw new Error("Withdraw failed");
       
       await fetchBalance();
       await fetchTransactions();
       
       setStep('success');
    } catch(err) {
       console.error("Withdraw Error", err);
       displayToast("Withdraw failed");
       setStep('form');
    }
  };

  if (step === 'processing') {
    return (
      <div className="absolute inset-0 bg-white z-[70] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
        <Loader2 className="animate-spin text-slate-800 mb-6" size={48} />
        <h3 className="text-[20px] font-bold text-slate-800 mb-2">Processing Withdrawal</h3>
        <p className="text-slate-500 text-[14px]">Sending USDC to Liquidity Provider for Bank Settlement...</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="absolute inset-0 bg-white z-[70] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h3 className="text-[22px] font-bold text-slate-800 mb-2">Withdrawal Initiated</h3>
        <p className="text-slate-500 text-[15px] mb-8">
          Your withdrawal of <span className="font-bold text-slate-800">{parseFloat(amount).toFixed(2)} USDC</span> to {selectedBank} is being processed.
        </p>
        <button 
          onClick={onSuccess}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold transition-all active:scale-[0.98] border-0 cursor-pointer"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[70] bg-[#f8fafc] flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h2 className="font-bold text-[16px] text-white ml-2">WITHDRAW TO BANK</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-32">
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 mb-6 text-left">
          <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Destination Bank</label>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400">
                <Building2 size={20} />
             </div>
             <div className="flex-1">
                <p className="text-[14px] font-bold text-slate-800">{selectedBank}</p>
                <p className="text-[12px] text-slate-500">{accountNumber} • RAKYAN I.</p>
             </div>
             <ChevronRight size={18} className="text-slate-300" />
          </div>

          <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Withdraw Amount</label>
          <div className="relative">
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-[24px] font-bold text-slate-800 outline-none focus:border-slate-900 transition-colors"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">USDC</span>
          </div>
          
          <div className="flex justify-between mt-3 px-1">
            <span className="text-[12px] text-slate-500">Available: <span className="font-bold text-slate-800">{balance.toFixed(2)} USDC</span></span>
            <button 
              onClick={() => setAmount(balance.toString())}
              className="text-[12px] font-bold text-slate-800 bg-transparent border-0 cursor-pointer"
            >
              Withdraw All
            </button>
          </div>
        </div>

        <div className="bg-slate-100/50 p-4 rounded-2xl border border-slate-200 flex gap-3">
          <div className="text-slate-800 shrink-0 mt-0.5">
             <CheckCircle2 size={16} />
          </div>
          <p className="text-[12px] text-blue-700 leading-relaxed font-medium">
            Funds will be converted to local currency and sent to your bank account via partner liquidity nodes. Settlement usually takes 5-15 minutes.
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-50">
        <button 
          onClick={handleWithdraw}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold transition-all active:scale-[0.98] border-0 cursor-pointer shadow-lg shadow-blue-200"
        >
          Confirm Withdrawal
        </button>
      </div>
    </div>
  );
}
