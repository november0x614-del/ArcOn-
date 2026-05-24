import React, { useState } from 'react';
import { ArrowLeft, Check, Smartphone, RefreshCw, Wallet } from 'lucide-react';

interface BayarVAScreenProps {
  onBack: () => void;
}

export function BayarVAScreen({ onBack }: BayarVAScreenProps) {
  const [vaNumber, setVaNumber] = useState('');
  const [step, setStep] = useState<'input' | 'confirm' | 'processing' | 'success'>('input');
  const [isValidating, setIsValidating] = useState(false);

  const handleNext = () => {
    setIsValidating(true);
    // Simulasi validasi nomor VA
    setTimeout(() => {
      setIsValidating(false);
      setStep('confirm');
    }, 1500);
  };

  const handlePay = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('success');
    }, 3000);
  };

  if (step === 'success') {
    return (
      <div className="w-full h-full bg-white relative flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 z-50 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <Check size={40} className="text-green-500" strokeWidth={3} />
        </div>
        <h2 className="text-[22px] font-bold text-slate-800 mb-2">Payment Successful!</h2>
        <p className="text-[14px] text-slate-500 mb-8 leading-relaxed px-4">
          VA Payment <span className="font-bold text-slate-800">{vaNumber}</span> for <span className="font-bold text-[#005faa]">250.00 USDC</span> has been successfully processed via Arc Network.
        </p>
        <button 
          onClick={onBack}
          className="w-full bg-[#005faa] text-white font-bold py-3.5 rounded-full hover:bg-[#004780] transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-50 relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center px-4 pt-12 pb-4 bg-white border-b border-slate-100 shadow-sm relative z-10 w-full">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200">
          <ArrowLeft size={24} className="text-slate-800" />
        </button>
        <h2 className="font-bold text-[16px] text-slate-800 ml-2">Pay Virtual Account</h2>
      </div>

      <div className="flex-1 p-5 lg:p-10 flex flex-col pt-8 overflow-y-auto pb-24 max-w-2xl mx-auto w-full scrollbar-hide">
        {step === 'input' ? (
          <>
            <div className="mb-8">
               <h3 className="text-[24px] font-extrabold text-slate-800 leading-tight mb-2 tracking-tight">Input VA Number</h3>
               <p className="text-[14px] text-slate-500">Enter the destination Virtual Account number for your payment.</p>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/60 mb-6 font-sans">
               <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Virtual Account Number</label>
               <input 
                  type="number"
                  value={vaNumber}
                  onChange={(e) => setVaNumber(e.target.value)}
                  placeholder="Example: 8871 0812 3344 5566"
                  className="w-full py-2 bg-transparent border-b-2 border-slate-100 focus:border-[#005faa] outline-none text-xl font-bold text-slate-800 transition-colors placeholder:text-slate-200"
               />
               <div className="mt-4 flex items-center gap-2 text-slate-400">
                  <Smartphone size={14} />
                  <span className="text-[12px]">Supports Mandiri, BCA, and other VAs via Bridge</span>
               </div>
            </div>

            <div className="mt-auto pb-10">
               <button 
                  disabled={vaNumber.length < 5 || isValidating}
                  onClick={handleNext}
                  className={`w-full font-bold py-[16px] rounded-full transition-all flex items-center justify-center gap-3
                    ${vaNumber.length >= 5 && !isValidating
                      ? 'bg-[#005faa] text-white shadow-lg shadow-blue-500/20' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
               >
                  {isValidating ? <RefreshCw size={20} className="animate-spin" /> : 'Continue'}
               </button>
            </div>
          </>
        ) : step === 'confirm' ? (
          <>
            <div className="mb-8">
               <h3 className="text-[24px] font-extrabold text-slate-800 leading-tight mb-2 tracking-tight">Payment Confirmation</h3>
               <p className="text-[14px] text-slate-500">Review billing details before paying.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden mb-6">
               <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex justify-between items-center">
                     <span className="text-sm text-slate-500">Institution</span>
                     <span className="text-sm font-bold text-slate-800">PREPAID ELECTRICITY</span>
                  </div>
               </div>
               <div className="p-5 space-y-4">
                  <div className="flex justify-between">
                     <span className="text-sm text-slate-500">Customer Name</span>
                     <span className="text-sm font-bold text-slate-800">PENGGUNA ARC</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-sm text-slate-500">VA Number</span>
                     <span className="text-sm font-mono text-slate-800">{vaNumber}</span>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
                     <span className="text-sm text-slate-500">Total Bill</span>
                     <div className="text-right">
                        <span className="text-[10px] font-bold text-[#005faa] block">USDC</span>
                        <span className="text-2xl font-black text-slate-800">250.00</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4 flex gap-3">
               <div className="bg-white p-2 rounded-lg shadow-sm h-fit">
                  <Wallet size={20} className="text-[#005faa]" />
               </div>
               <div>
                  <p className="text-[13px] font-bold text-slate-700">Source of Funds: Arc Wallet</p>
                  <p className="text-[11px] text-slate-500">Remaining Balance: 1,134.66 USDC</p>
               </div>
            </div>

            <div className="mt-auto pb-10">
               <button 
                  onClick={handlePay}
                  className="w-full bg-[#005faa] text-white font-bold py-[16px] rounded-full shadow-lg shadow-blue-500/20 hover:bg-[#004780] transition-colors"
                >
                  Pay Now
               </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
             <div className="relative mb-8">
                <div className="w-20 h-20 border-4 border-slate-100 border-t-[#005faa] rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <Smartphone size={24} className="text-[#005faa]/40" />
                </div>
             </div>
             <h3 className="font-bold text-slate-800 text-[20px] mb-3">Processing VA via Arc</h3>
             <p className="text-slate-400 text-[14px] leading-relaxed max-w-[240px]">
                Processing bill payment to the banking system via network bridge <span className="font-bold text-slate-700">Arc Testnet</span>...
             </p>
          </div>
        )}
      </div>
    </div>
  );
}
