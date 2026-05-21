import React, { useState } from 'react';
import { Fingerprint, X, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface BiometricVerifyScreenProps {
  onVerify: () => void;
  onCancel: () => void;
}

export function BiometricVerifyScreen({ onVerify, onCancel }: BiometricVerifyScreenProps) {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success'>('idle');

  const startScan = () => {
    setStatus('scanning');
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
         onVerify();
      }, 1000);
    }, 2000);
  };

  return (
    <div className="w-full h-full bg-slate-900/60 z-50 flex items-end relative overflow-hidden">
       {/* Background overlay is handled by App router, but let's assume this takes full screen */}
       <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel}></div>
       <div className="bg-white w-full rounded-t-[32px] pt-8 pb-12 px-6 flex flex-col items-center relative animate-in slide-in-from-bottom duration-300">
         <button onClick={onCancel} className="absolute right-6 top-6 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
            <X size={20} />
         </button>
         
         <div className="w-16 h-16 bg-[#3FA2F6]/10 text-[#3FA2F6] rounded-full flex items-center justify-center mb-4">
            <ShieldCheck size={32} />
         </div>
         <h2 className="text-[20px] font-bold text-slate-800 tracking-tight mb-2">Security Verification</h2>
         <p className="text-[14px] text-slate-500 text-center mb-8 px-4 leading-relaxed font-sans">
            Please authenticate using your device's biometric sensor to authorize this high-value transaction.
         </p>

         <button 
            onClick={status === 'idle' ? startScan : undefined}
            className={`w-28 h-28 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-sm relative overflow-hidden group
               ${status === 'idle' ? 'border-[#3FA2F6] text-[#3FA2F6] hover:bg-[#3FA2F6]/5' : 
                 status === 'scanning' ? 'border-purple-400 text-purple-500' : 
                 'border-emerald-500 text-emerald-500 bg-emerald-50'}
            `}
         >
            {status === 'idle' && (
               <>
                 <Fingerprint size={56} strokeWidth={1} />
                 <div className="absolute inset-0 bg-[#3FA2F6]/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300"></div>
               </>
            )}
            {status === 'scanning' && (
               <>
                 <Fingerprint size={56} strokeWidth={1} className="relative z-10 opacity-50" />
                 {/* Scanner line animation */}
                 <div className="absolute top-0 left-0 w-full h-[3px] bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] z-20 animate-[scan_1.5s_ease-in-out_infinite]"></div>
               </>
            )}
            {status === 'success' && (
               <CheckCircle2 size={56} strokeWidth={1.5} className="animate-in zoom-in duration-300" />
            )}
         </button>
         
         <div className="mt-8 text-center h-6">
            {status === 'idle' && <span className="text-[13px] font-bold text-slate-400 tracking-wide uppercase">Tap sensor to scan</span>}
            {status === 'scanning' && <span className="text-[13px] font-bold text-purple-500 tracking-wide uppercase animate-pulse">Scanning footprint...</span>}
            {status === 'success' && <span className="text-[13px] font-bold text-emerald-500 tracking-wide uppercase">Identity Verified!</span>}
         </div>
       </div>

       <style dangerouslySetInnerHTML={{__html: `
         @keyframes scan {
            0% { transform: translateY(0); }
            50% { transform: translateY(110px); }
            100% { transform: translateY(0); }
         }
       `}} />
    </div>
  );
}
