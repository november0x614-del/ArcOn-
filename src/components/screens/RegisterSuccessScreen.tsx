import React from 'react';
import { CheckCircle2, User, Mail, Wallet } from 'lucide-react';

interface RegisterSuccessScreenProps {
  username?: string;
  email?: string;
  walletAddress?: string;
  onContinue: () => void;
}

export function RegisterSuccessScreen({ username = 'Arcreal', email = 'arcreal@example.com', walletAddress = '0x00...0000', onContinue }: RegisterSuccessScreenProps) {
  return (
    <div className="w-full h-full bg-white relative flex flex-col justify-center text-center p-6 animate-in slide-in-from-right duration-300 z-50">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
        <CheckCircle2 size={40} className="text-green-500" />
      </div>
      <h2 className="text-[22px] font-extrabold text-slate-800 mb-2 leading-tight">Account &<br/>Web3 Wallet Created Successfully</h2>
      <p className="text-[14px] text-slate-500 mb-8 leading-relaxed">
        Congratulations! Your Livin' account and Arc Web3 Wallet are now active. You are ready to make transactions.
      </p>
      
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 w-full text-left mb-6 flex flex-col gap-4">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-slate-800 flex items-center justify-center shrink-0">
               <User size={16} />
            </div>
            <div className="flex flex-col">
               <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Username</span>
               <span className="font-bold text-slate-800 text-[14px]">{username}</span>
            </div>
         </div>
         
         <div className="w-full h-[1px] bg-slate-200/50"></div>
         
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-slate-800 flex items-center justify-center shrink-0">
               <Mail size={16} />
            </div>
            <div className="flex flex-col">
               <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Email</span>
               <span className="font-bold text-slate-800 text-[14px]">{email}</span>
            </div>
         </div>

         <div className="w-full h-[1px] bg-slate-200/50"></div>

         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-slate-800 flex items-center justify-center shrink-0">
               <Wallet size={16} />
            </div>
            <div className="flex flex-col w-full overflow-hidden">
               <div className="flex justify-between items-center w-full">
                  <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Arc Wallet Address</span>
                  <span className="text-[9px] font-bold text-slate-800 bg-blue-100 px-1.5 py-0.5 rounded">TESTNET</span>
               </div>
               <span className="font-mono font-medium text-slate-800 text-[13px] truncate mt-0.5">{walletAddress}</span>
            </div>
         </div>
      </div>

      <div className="w-full mt-auto">
        <button 
          onClick={onContinue}
          className="w-full bg-[#005faa] text-white font-bold py-[14px] rounded-full hover:bg-[#004780] transition-colors active:scale-[0.98]"
        >
          Mulai Eksplorasi
        </button>
      </div>
    </div>
  )
}
