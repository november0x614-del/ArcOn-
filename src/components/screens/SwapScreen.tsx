import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, ArrowLeftRight, RefreshCw, Check, Zap } from 'lucide-react';

interface SwapScreenProps {
  onBack: () => void;
}

export function SwapScreen({ onBack }: SwapScreenProps) {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('0');
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapFinished, setSwapFinished] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(0.9852);
  const [balance, setBalance] = useState(1134.66);

  useEffect(() => {
    // Live rate simulation
    const interval = setInterval(() => {
      setExchangeRate(prev => {
        const change = (Math.random() - 0.5) * 0.01;
        return parseFloat((prev + change).toFixed(4));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (fromAmount) {
      setToAmount((parseFloat(fromAmount) * exchangeRate).toFixed(4));
    } else {
      setToAmount('0');
    }
  }, [fromAmount, exchangeRate]);

  const handleSwap = () => {
    setIsSwapping(true);
    setTimeout(() => {
      setIsSwapping(false);
      setSwapFinished(true);
      setBalance(prev => prev - parseFloat(fromAmount || '0'));
    }, 2500);
  };

  if (swapFinished) {
    return (
      <div className="w-full h-full bg-white relative flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-500 z-50 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/20 border-4 border-green-50">
          <Check size={48} className="text-white" strokeWidth={3} />
        </div>
        <h2 className="text-[24px] font-extrabold text-slate-800 mb-2 tracking-tight">Swap Successful!</h2>
        <div className="bg-slate-50 p-6 rounded-3xl w-full mb-8 border border-slate-100">
           <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
             Exchange transaction on Arc Testnet has been confirmed (Circle Managed).
           </p>
           <div className="flex justify-between items-center text-[18px] font-bold text-slate-800 bg-white p-4 rounded-xl shadow-sm">
              <span className="text-blue-600">-{fromAmount} USDC</span>
              <ArrowLeftRight size={16} className="text-slate-400" />
              <span className="text-orange-500">+{toAmount} ARC</span>
           </div>
           <div className="flex justify-between items-center mt-4 px-2">
             <span className="text-[12px] text-slate-400 font-medium">Remaining Balance:</span>
             <span className="text-[14px] text-slate-700 font-bold">{balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USDC</span>
           </div>
        </div>
        <button 
          onClick={onBack}
          className="w-full bg-[#005faa] text-white font-bold py-4 rounded-full hover:bg-[#004780] transition-colors shadow-lg shadow-blue-900/20 active:scale-95"
        >
          Done & Return
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
        <h2 className="font-bold text-[16px] text-slate-800 ml-2">Swap USDC On-chain</h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 p-5 lg:p-10 flex flex-col pt-8 max-w-2xl mx-auto w-full scrollbar-hide">
        <div className="mb-6">
          <h3 className="text-[24px] font-extrabold text-slate-800 leading-tight mb-2 tracking-tight">Swap Assets</h3>
          <p className="text-[14px] text-slate-500">Convert your USDC to other tokens instantly with Arc Exchange.</p>
        </div>

        {/* Swap Box */}
        <div className="relative mb-8">
          {/* From */}
          <div className={`bg-white p-5 rounded-3xl shadow-sm border transition-all duration-500 relative z-10 ${isSwapping ? 'border-blue-400 shadow-blue-100/50 scale-[0.98]' : 'border-slate-200/60 focus-within:border-blue-500'}`}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">You Pay</span>
              <span className="text-[12px] font-bold text-[#005faa]">Balance: {balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USDC</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <input 
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  disabled={isSwapping}
                  className="w-full bg-transparent border-none outline-none text-[32px] font-bold text-slate-800 placeholder:text-slate-200 disabled:opacity-50"
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 hover:border-[#3FA2F6] transition-colors cursor-pointer px-3 py-2 rounded-2xl shrink-0">
                 <div className="w-6 h-6 rounded-full bg-[#2775ca] flex items-center justify-center text-white text-[8px] font-bold shrink-0">USDC</div>
                 <span className="font-bold text-slate-700 text-[14px] pr-1">USDC</span>
                 <ChevronDown size={14} className="text-slate-400" />
              </div>
            </div>
          </div>

          {/* Swap Button Middle */}
          <div className={`absolute left-1/2 top-1/2 z-20 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 ${isSwapping ? 'rotate-180 scale-110' : ''}`}>
            <button className="w-12 h-12 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-[#005faa] hover:scale-105 active:scale-95 transition-all group">
              <ArrowLeftRight size={20} className="rotate-90 group-hover:rotate-[-90deg] transition-transform duration-500" />
            </button>
          </div>

          {/* To */}
          <div className={`bg-white p-5 rounded-3xl shadow-sm border mt-2 transition-all duration-500 relative z-10 ${isSwapping ? 'border-orange-400 shadow-orange-100/50 scale-[1.02]' : 'border-slate-200/60'}`}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">You Receive (Estimated)</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <span className={`text-[32px] font-bold ${toAmount === '0' ? 'text-slate-200' : 'text-slate-800'} transition-opacity ${isSwapping ? 'opacity-50' : 'opacity-100'}`}>
                  {toAmount}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 hover:border-[#f59e0b] transition-colors cursor-pointer px-3 py-2 rounded-2xl shrink-0">
                 <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-400 to-orange-500 flex items-center justify-center text-white text-[8px] font-bold shrink-0 shadow-sm shadow-orange-500/30">ARC</div>
                 <span className="font-bold text-slate-700 text-[14px] pr-1">ARC</span>
                 <ChevronDown size={14} className="text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-white border border-[#005faa]/10 rounded-2xl p-4 mb-4 shadow-sm animate-in fade-in duration-500">
           <div className="flex justify-between items-center mb-3">
              <span className="text-[13px] text-slate-500 flex items-center gap-1"><Zap size={14} className="text-yellow-500" /> Live Rate</span>
              <span className="text-[13px] font-mono font-bold text-[#005faa] bg-blue-50 px-2 py-1 rounded-md transition-all">1 USDC = {exchangeRate} ARC</span>
           </div>
           <div className="flex justify-between items-center pt-3 border-t border-slate-50">
              <span className="text-[13px] text-slate-500">Network Fee (Arc)</span>
              <span className="text-[12px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">Covered by Paymaster</span>
           </div>
        </div>

        <div className="mt-auto pb-10">
          <button 
            disabled={!fromAmount || parseFloat(fromAmount) === 0 || isSwapping || parseFloat(fromAmount) > balance}
            onClick={handleSwap}
            className={`w-full font-bold py-[16px] rounded-full transition-all flex items-center justify-center gap-3 active:scale-95
              ${(!fromAmount || parseFloat(fromAmount) === 0 || parseFloat(fromAmount) > balance)
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : !isSwapping ? 'bg-[#005faa] text-white shadow-lg shadow-blue-900/20 hover:bg-[#004780]' : 'bg-slate-800 text-white shadow-xl scale-[0.98]'
              }`}
          >
            {isSwapping ? (
              <>
                <RefreshCw size={20} className="animate-spin text-blue-400" />
                Executing on Arc Network...
              </>
            ) : parseFloat(fromAmount) > balance ? 'Insufficient Balance' : 'Confirm Swap'}
          </button>
          <p className="text-center text-[11px] text-slate-400 mt-5 leading-relaxed px-6 flex items-center justify-center gap-1.5">
            <Check size={12} className="text-green-500" /> Verified via Circle Developer Wallets
          </p>
        </div>
      </div>
    </div>
  );
}
