import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, ArrowLeftRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/utils';

interface ArcSwapScreenProps {
  onBack: () => void;
}

export function ArcSwapScreen({ onBack }: ArcSwapScreenProps) {
  const { fetchBalance, fetchTransactions, registeredUser } = useApp();
  const [swapFromAmount, setSwapFromAmount] = useState<string>("100");
  const [swapToToken, setSwapToToken] = useState<"ARC" | "AETH" | "AQR">("ARC");
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [swapSuccess, setSwapSuccess] = useState<boolean>(false);
  const [swapRate, setSwapRate] = useState<number>(0.12);

  const handleSwap = async () => {
    setIsSwapping(true);
    
    try {
      const fromNum = Number(swapFromAmount);
      
      const response = await fetch('/api/swap/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: registeredUser?.supabaseUid,
          amount: fromNum,
          fromToken: 'USDC',
          toToken: swapToToken
        }),
      });

      if (!response.ok) throw new Error('Swap failed');

      await response.json();
      
      // Update data from backend
      await fetchBalance();
      await fetchTransactions();
      
      setSwapSuccess(true);
    } catch (error) {
      console.error(error);
      // In a real app, show a toast here
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center px-4 pt-12 pb-4 bg-white border-b border-slate-100 shadow-sm relative z-10 w-full">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200 bg-transparent border-0 cursor-pointer"
        >
          <ArrowLeft size={24} className="text-slate-800" />
        </button>
        <div className="flex items-center gap-2 ml-2">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shrink-0">
             <RefreshCw size={16} />
           </div>
           <div>
             <h2 className="font-bold text-[16px] text-slate-800 leading-tight">ArcSwap DEX</h2>
             <p className="text-[10px] text-[#3FA2F6] font-bold">Arc Network L1 Simulation</p>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <p className="text-[13px] text-slate-500">
          Interactive swap simulator for USDC on Arc Layer-1 network.
          Dynamic gas token optimization included.
        </p>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 relative">
          <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between">
            <div className="flex flex-col gap-1 w-2/3">
              <span className="text-[10px] uppercase font-bold text-slate-400">You Pay</span>
              <input
                type="number"
                value={swapFromAmount}
                onChange={(e) => {
                  setSwapFromAmount(e.target.value);
                  setSwapSuccess(false);
                }}
                className="text-[20px] font-bold text-slate-800 outline-none w-full border-none p-0 focus:ring-0 font-mono"
                placeholder="0.00"
              />
            </div>
            <div className="bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 border border-slate-200">
              <div className="w-5 h-5 rounded-full bg-[#2775ca] flex items-center justify-center text-white text-[9px] font-bold">USDC</div>
              <span className="text-[13px] font-bold text-slate-700">USDC</span>
            </div>
          </div>

          <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 bg-white border border-slate-150 rounded-full p-2 shadow-sm z-10 flex items-center justify-center">
            <ArrowLeftRight size={16} className="text-[#3FA2F6] rotate-90" />
          </div>

          <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between">
            <div className="flex flex-col gap-1 w-2/3">
              <span className="text-[10px] uppercase font-bold text-slate-400">You Receive (Estimate)</span>
              <span className="text-[20px] font-bold text-slate-800 font-mono">
                {formatCurrency(swapFromAmount ? (Number(swapFromAmount) / swapRate) : 0, '')}
              </span>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <select
                value={swapToToken}
                onChange={(e) => {
                  setSwapToToken(e.target.value as any);
                  setSwapSuccess(false);
                  if (e.target.value === "ARC") setSwapRate(0.12);
                  else if (e.target.value === "AETH") setSwapRate(3120);
                  else setSwapRate(1.25);
                }}
                className="bg-slate-100 px-2 py-1.5 rounded-lg text-[13px] font-bold text-slate-700 outline-none border border-slate-200 cursor-pointer"
              >
                <option value="ARC">ARC Coin</option>
                <option value="AETH">Wrapped ETH</option>
                <option value="AQR">Arc-QR Receipt</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-[12px] text-slate-500 px-1 font-semibold">
          <span>Exchange Rate</span>
          <span className="font-mono font-medium">1 {swapToToken} = {swapRate} USDC</span>
        </div>

        <div className="bg-indigo-50/50 border border-indigo-100/30 rounded-xl p-3 flex flex-col gap-1 text-[12px]">
          <div className="flex justify-between text-indigo-950">
            <span className="font-bold">Gas Mode:</span>
            <span className="font-bold text-[#008fcd]">Native USDC Gas (No separate ETH needed!)</span>
          </div>
          <div className="flex justify-between text-slate-500 mt-1">
            <span>Estimated Network Fee:</span>
            <span className="font-mono">0.02 USDC</span>
          </div>
        </div>

        {!swapSuccess ? (
          <button
            onClick={handleSwap}
            disabled={isSwapping || !swapFromAmount || Number(swapFromAmount) <= 0}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-white font-bold text-[15px] py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md border-0 cursor-pointer"
          >
            {isSwapping ? (
              <>
                <RefreshCw className="animate-spin" size={18} />
                Swapping on Arc Testnet Ledger...
              </>
            ) : (
              `Swap USDC to ${swapToToken}`
            )}
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white mb-3 shadow-lg">
                <RefreshCw size={24} />
              </div>
              <h4 className="font-bold text-emerald-800 text-[18px]">Swap Successful!</h4>
              <p className="text-[14px] text-emerald-600 mt-2">
                Swapped {swapFromAmount} USDC for {(Number(swapFromAmount) / swapRate).toFixed(4)} {swapToToken} on Arc Network L1.
              </p>
              <div className="mt-4 text-[10px] text-slate-400 font-mono select-all bg-white px-3 py-1 rounded-full border border-emerald-100">
                TXID: 0xarc542f...{Math.floor(Math.random() * 90000) + 10000}
              </div>
            </div>
            <button
              onClick={() => setSwapSuccess(false)}
              className="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl text-[14px] border-0 cursor-pointer"
            >
              Start New Swap
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
