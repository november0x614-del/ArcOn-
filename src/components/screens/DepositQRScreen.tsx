import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, Info } from 'lucide-react';

interface DepositQRScreenProps {
  onBack: () => void;
}

export function DepositQRScreen({ onBack }: DepositQRScreenProps) {
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const address = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full bg-[#f8fafc] relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center px-4 pt-12 pb-4 bg-white border-b border-slate-100 shadow-sm relative z-10 w-full">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-800" />
        </button>
        <h2 className="font-bold text-[16px] text-slate-800 ml-2">Receive / Request Payment</h2>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center overflow-y-auto pb-24">
         <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200/60 flex flex-col items-center w-full">
            <span className="text-[11px] font-black tracking-widest text-[#005faa] bg-blue-50 px-2.5 py-1 rounded-full mb-6 uppercase">USDC (ARC TESTNET)</span>
            
            {/* Visual QR Placeholder */}
            <div className="w-48 h-48 bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-center relative shadow-inner mb-6">
               <div className="w-full h-full border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-2 text-center text-slate-300">
                  <div className="grid grid-cols-5 gap-1.5 w-32 h-32">
                     {Array.from({ length: 25 }).map((_, i) => (
                        <div key={i} className={`rounded-sm ${(i % 3 === 0 || i % 7 === 0 || i < 5 || i % 5 === 0) ? 'bg-[#005faa]' : 'bg-slate-100'}`} />
                     ))}
                  </div>
               </div>
               <div className="absolute bg-white p-2 rounded-xl shadow-md border border-slate-50">
                  <span className="text-[9px] font-bold text-[#005faa]">ARC</span>
               </div>
            </div>

            {/* Set Amount Input */}
            <div className="w-full mb-6">
                {!isEditingAmount && !amount && (
                  <button 
                    onClick={() => setIsEditingAmount(true)}
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-[#005faa] border border-slate-200 border-dashed rounded-xl font-bold text-[13px] transition-colors"
                  >
                    + Set Payment Amount
                  </button>
                )}
                
                {(isEditingAmount || amount) && (
                  <div className="flex flex-col gap-2 relative">
                    <label className="text-[11px] font-bold text-slate-500 font-sans text-left">Requested Amount (Optional)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-500 font-bold text-[14px]">USDC</span>
                      <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        onBlur={() => setIsEditingAmount(false)}
                        autoFocus={isEditingAmount}
                        placeholder="0.00"
                        className="w-full pl-14 pr-4 py-3 bg-white border border-slate-200 hover:border-[#3FA2F6] focus:border-[#3FA2F6] text-[16px] font-bold text-slate-800 rounded-xl outline-none font-mono"
                      />
                    </div>
                  </div>
                )}
            </div>

            <p className="text-[12px] text-slate-400 text-center mb-6 leading-relaxed">
               Show this QR code or share your wallet address below to receive or request USDC payment via Arc Testnet.
            </p>

            {/* Address bar */}
            <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 group active:bg-slate-100 transition-all cursor-pointer overflow-hidden font-sans" onClick={handleCopy}>
               <div className="flex-1 overflow-hidden">
                  <span className="text-[10px] font-bold text-slate-400 block mb-0.5 text-left">WALLET ADDRESS</span>
                  <span className="text-[12px] font-mono font-bold text-slate-800 block truncate text-left">{address}</span>
               </div>
               <button className="bg-white text-[#005faa] hover:bg-slate-50 border border-slate-100 p-2 rounded-xl shrink-0 shadow-sm transition-colors active:scale-95">
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
               </button>
            </div>
         </div>

         <div className="mt-6 flex gap-2 items-start text-left max-w-sm">
            <Info size={16} className="text-[#3FA2F6] shrink-0 mt-0.5" />
            <span className="text-[12px] text-slate-500 font-medium leading-snug">Only send USDC tokens to this address. Transactions via networks other than Arc will result in permanent asset loss.</span>
         </div>
      </div>
    </div>
  );
}
export default DepositQRScreen;
