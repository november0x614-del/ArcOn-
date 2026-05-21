import React, { useState } from 'react';
import { ArrowLeft, Droplets, Coins, CheckCircle2, Copy, AlertCircle, Loader2 } from 'lucide-react';

interface FaucetScreenProps {
  onBack: () => void;
}

export function FaucetScreen({ onBack }: FaucetScreenProps) {
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState('');

  const handleClaim = () => {
    if (!address.startsWith('0x') || address.length !== 42) {
      setStatus('error');
      return;
    }

    setStatus('loading');
    
    // Simulate faucet network request
    setTimeout(() => {
      setStatus('success');
      setTxHash('0x9a3f...4b8d');
    }, 2000);
  };

  return (
    <div className="w-full h-full bg-slate-50 relative flex flex-col z-40 animate-in slide-in-from-bottom duration-500">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm relative z-10 w-full flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors -ml-2 bg-transparent border-0">
          <ArrowLeft size={24} className="text-slate-800" />
        </button>
        <div>
          <h1 className="text-[18px] font-bold text-slate-800 tracking-tight font-sans">Arc Faucet</h1>
          <p className="text-[11px] text-[#3FA2F6] font-bold">Testnet Gas Token</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col items-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 mt-4 ring-8 ring-blue-50/50">
          <Droplets size={36} className="text-[#3FA2F6]" />
        </div>
        
        <h2 className="text-[22px] font-bold text-slate-800 mb-2 text-center">Claim ARC Tokens</h2>
        <p className="text-[14px] text-slate-500 text-center mb-8 px-4 leading-relaxed">
          Request testnet ARC tokens to pay for transaction gas fees on the Arc Network.
        </p>

        <div className="w-full bg-white rounded-[20px] p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-5">
          {status === 'success' ? (
            <div className="flex flex-col items-center py-6 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h3 className="font-bold text-[18px] text-slate-800 mb-1">Tokens Sent!</h3>
              <p className="text-[13px] text-slate-500 mb-4 text-center">
                10 ARC has been sent to your wallet.
              </p>
              
              <div className="bg-slate-50 border border-slate-100 w-full p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 mb-1 leading-none">TX HASH</p>
                  <p className="text-[13px] font-mono text-slate-700">{txHash}</p>
                </div>
                <button className="text-slate-400 hover:text-slate-600 bg-transparent border-0 p-1">
                  <Copy size={16} />
                </button>
              </div>
              
              <button 
                onClick={() => {
                  setStatus('idle');
                  setAddress('');
                }}
                className="w-full bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl mt-6 hover:bg-slate-200 transition-colors border-0"
              >
                Claim More
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-2">Wallet Address (0x...)</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (status === 'error') setStatus('idle');
                  }}
                  className={`w-full bg-slate-50 border ${status === 'error' ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-[#3FA2F6]'} rounded-xl px-4 py-3.5 text-[14px] font-mono text-slate-800 focus:outline-none transition-colors`}
                  placeholder="0x742d35Cc6634C053292..."
                  disabled={status === 'loading'}
                />
                {status === 'error' && (
                  <div className="flex items-center gap-1.5 mt-2 text-red-500">
                    <AlertCircle size={14} />
                    <span className="text-[11px] font-medium">Please enter a valid Arc wallet address</span>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-700 leading-relaxed font-medium">
                  This faucet dispenses testnet tokens only. These tokens have no real-world value and cannot be bridged to mainnet.
                </p>
              </div>

              <button 
                onClick={handleClaim}
                disabled={status === 'loading' || !address}
                className="w-full bg-[#3FA2F6] disabled:bg-blue-300 text-white font-bold py-4 rounded-xl mt-2 relative overflow-hidden transition-all border-0"
              >
                {status === 'loading' ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Coins size={18} />
                    Claim 10 ARC
                  </div>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
