import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ArrowLeftRight, RefreshCw, Check } from 'lucide-react';

interface SwapScreenProps {
  onBack: () => void;
}

export function SwapScreen({ onBack }: SwapScreenProps) {
  const [fromAmount, setFromAmount] = useState('0');
  const [toAmount, setToAmount] = useState('0');
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapFinished, setSwapFinished] = useState(false);

  const handleSwap = () => {
    setIsSwapping(true);
    setTimeout(() => {
      setIsSwapping(false);
      setSwapFinished(true);
    }, 2500);
  };

  if (swapFinished) {
    return (
      <div className="w-full h-full bg-white relative flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 z-50 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <Check size={40} className="text-green-500" strokeWidth={3} />
        </div>
        <h2 className="text-[22px] font-bold text-slate-800 mb-2">Swap Berhasil!</h2>
        <p className="text-[14px] text-slate-500 mb-8 leading-relaxed px-4">
          Penukaran <span className="font-bold text-slate-800">{fromAmount} USDC</span> ke <span className="font-bold text-slate-800">{toAmount} ARC</span> telah diproses di jaringan Arc Testnet.
        </p>
        <button 
          onClick={onBack}
          className="w-full bg-[#005faa] text-white font-bold py-3.5 rounded-full hover:bg-[#004780] transition-colors"
        >
          Selesai
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
        <h2 className="font-bold text-[16px] text-slate-800 ml-2">Swap USDC</h2>
      </div>

      <div className="flex-1 p-5 flex flex-col pt-8">
        <div className="mb-6">
          <h3 className="text-[24px] font-extrabold text-slate-800 leading-tight mb-2 tracking-tight">Tukar Aset</h3>
          <p className="text-[14px] text-slate-500">Konversi USDC Anda ke token lain secara instan dengan Arc Exchange.</p>
        </div>

        {/* Swap Box */}
        <div className="relative space-y-2 mb-8">
          {/* From */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/60 transition-all focus-within:border-blue-500">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Anda Bayar</span>
              <span className="text-[12px] font-bold text-[#005faa]">Saldo: 1,134.66</span>
            </div>
            <div className="flex justify-between items-end">
              <div className="flex-1">
                <input 
                  type="number"
                  value={fromAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFromAmount(val);
                    setToAmount((parseFloat(val || '0') * 0.985).toFixed(2));
                  }}
                  className="w-full bg-transparent border-none outline-none text-[32px] font-bold text-slate-800 placeholder:text-slate-200"
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 hover:border-[#3FA2F6] transition-colors cursor-pointer px-3 py-1.5 rounded-2xl">
                 <div className="w-6 h-6 rounded-full bg-[#2775ca] flex items-center justify-center text-white text-[8px] font-bold shrink-0">USDC</div>
                 <span className="font-bold text-slate-700 text-[14px]">USDC</span>
                 <ChevronDown size={14} className="text-slate-400" />
              </div>
            </div>
          </div>

          {/* Swap Button Middle */}
          <div className="absolute left-1/2 top-1/2 -track-x-1/2 -track-y-1/2 z-10 transform -translate-x-1/2 -translate-y-1/2">
            <button className="w-10 h-10 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center text-[#005faa] hover:scale-110 active:scale-95 transition-all">
              <ArrowLeftRight size={20} className="rotate-90" />
            </button>
          </div>

          {/* To */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/60">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Anda Terima (Estimasi)</span>
            </div>
            <div className="flex justify-between items-end">
              <div className="flex-1">
                <span className={`text-[32px] font-bold ${toAmount === '0' ? 'text-slate-200' : 'text-slate-800'}`}>
                  {toAmount}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 hover:border-[#f59e0b] transition-colors cursor-pointer px-3 py-1.5 rounded-2xl">
                 <div className="w-6 h-6 rounded-full bg-[#f59e0b] flex items-center justify-center text-white text-[8px] font-bold shrink-0">ARC</div>
                 <span className="font-bold text-slate-700 text-[14px]">ARC</span>
                 <ChevronDown size={14} className="text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-[#005faa]/5 border border-[#005faa]/10 rounded-2xl p-4 mb-4">
           <div className="flex justify-between mb-2">
              <span className="text-[13px] text-slate-500">Kurs Konversi</span>
              <span className="text-[13px] font-bold text-slate-700">1 USDC = 0.985 ARC</span>
           </div>
           <div className="flex justify-between">
              <span className="text-[13px] text-slate-500">Gas Fee (Circle Managed)</span>
              <span className="text-[13px] font-bold text-green-600">Gratis (Subsidi)</span>
           </div>
        </div>

        <div className="mt-auto pb-10">
          <button 
            disabled={fromAmount === '0' || isSwapping}
            onClick={handleSwap}
            className={`w-full font-bold py-[16px] rounded-full transition-all flex items-center justify-center gap-3
              ${fromAmount !== '0' && !isSwapping
                ? 'bg-[#005faa] text-white shadow-lg hover:bg-[#004780]' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
          >
            {isSwapping ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                Processing Swap...
              </>
            ) : 'Konfirmasi Swap'}
          </button>
          <p className="text-center text-[11px] text-slate-400 mt-4 leading-relaxed px-6">
            Transaksi ini akan diproses menggunakan Circle Smart Contract di jaringan Arc Testnet.
          </p>
        </div>
      </div>
    </div>
  );
}
