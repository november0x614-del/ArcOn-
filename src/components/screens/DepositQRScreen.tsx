import React, { useState } from 'react';
import { Info, Check, ArrowLeft, Copy, Share2, Download, Maximize } from 'lucide-react';

export function DepositQRScreen({ onBack }: { onBack: () => void }) {
  const [copied, setCopied] = useState(false);
  const address = "0xc411ed99f10a699b42d8649a87c8e321e9169126";

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in fade-in slide-in-from-right-8 duration-200">
      {/* Header */}
      <div className="w-full pt-12 pb-4 px-4 flex items-center shadow-sm relative z-10 shrink-0 bg-white border-b border-slate-100">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors absolute left-4">
           <ArrowLeft className="text-slate-700" size={24} />
        </button>
        <div className="flex flex-col items-center justify-center flex-1">
           <h2 className="text-slate-800 font-bold text-[16px] tracking-tight text-center">Deposit USDC</h2>
           <p className="text-slate-500 text-[12px]">EVM (Arc Testnet)</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full p-6 flex flex-col items-center pb-12">
        
        {/* Warning card */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex gap-3 items-start w-full shadow-sm">
           <Info size={18} className="text-amber-500 mt-0.5 shrink-0" />
           <p className="text-[12px] text-amber-800 leading-relaxed font-medium">Hanya kirimkan <strong className="font-bold">USDC</strong> di jaringan <strong className="font-bold border-b border-amber-300">EVM (Arc Testnet)</strong> ke alamat ini. Mengirim koin atau jaringan lain akan mengakibatkan hilangnya aset Anda.</p>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.06)] flex flex-col items-center w-[260px] mb-8 relative">
           {/* Visual QR Code Mockup */}
           <div className="w-full aspect-square bg-slate-50 flex items-center justify-center p-2 mb-4 border border-slate-200 rounded-xl relative overflow-hidden">
             {/* Simulated QR Pattern */}
             <div className="w-full h-full relative opacity-80" style={{ background: 'repeating-linear-gradient(45deg, #0f172a 0, #0f172a 8px, transparent 8px, transparent 12px), repeating-linear-gradient(-45deg, #0f172a 0, #0f172a 8px, transparent 8px, transparent 12px)' }}></div>
             <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]"></div>
             <div className="absolute bg-[#6366f1] rounded-[8px] p-2 flex items-center justify-center shadow-md border-[3px] border-white text-white font-bold text-[10px] tracking-wider z-10 w-12 h-12">
                USDC
             </div>
             
             {/* QR Target lines */}
             <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-slate-800"></div>
             <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-slate-800"></div>
             <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-slate-800"></div>
             <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-slate-800"></div>
           </div>
           
           <h3 className="font-bold text-slate-800 text-[14px] mb-1">Pindai kode QR ini</h3>
           <p className="text-slate-500 text-[12px] text-center px-2 leading-relaxed">Menggunakan kamera atau aplikasi wallet web3 Anda</p>
        </div>

        {/* Address Container */}
        <div className="w-full relative px-2">
           <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Alamat Deposit</label>
           <div className="bg-[#f8fafc] border border-slate-200 rounded-[16px] p-4 pr-16 shadow-inner relative group flex items-center min-h-[72px]">
              <span className="font-mono text-[13px] text-slate-600 font-medium tracking-tight break-all">
                {address}
              </span>
              
              <button 
                onClick={handleCopy}
                className={`absolute right-3 p-2.5 bg-white border border-slate-200 rounded-[12px] shadow-sm transition-all flex items-center justify-center min-w-[42px] ${copied ? 'bg-emerald-50 border-emerald-200' : 'text-[#6366f1] hover:bg-[#6366f1] hover:text-white hover:border-[#6366f1]'}`}
              >
                {copied ? <Check size={18} strokeWidth={3} className="text-emerald-500" /> : <span className="text-[12px] font-bold">Salin</span>}
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}

