import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface RegisterSuccessScreenProps {
  onContinue: () => void;
}

export function RegisterSuccessScreen({ onContinue }: RegisterSuccessScreenProps) {
  return (
    <div className="w-full h-full bg-white relative flex flex-col items-center justify-center text-center p-6 animate-in slide-in-from-right duration-300 z-50">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 size={48} className="text-green-500" />
      </div>
      <h2 className="text-[24px] font-extrabold text-slate-800 mb-2 leading-tight">Rekening &<br/>Web3 Wallet Berhasil Dibuat</h2>
      <p className="text-[14.5px] text-slate-500 mb-8 leading-relaxed">
        Selamat! Akun Livin' Anda beserta Arc Web3 Wallet telah aktif. Anda siap melakukan transaksi dengan USDC dan fitur finansial lainnya.
      </p>
      
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 w-full text-left mb-auto">
         <div className="flex justify-between items-center mb-3">
            <span className="text-slate-500 text-[13px] font-bold">Arc Wallet Address</span>
            <span className="text-[10px] font-bold text-[#005faa] bg-blue-50 px-2 py-0.5 rounded">TESTNET</span>
         </div>
         <p className="font-mono text-slate-800 text-[13px] break-all bg-white p-2 rounded-lg border border-slate-200">
           0x3a4f...8c91
         </p>
      </div>

      <div className="w-full pt-6">
        <button 
          onClick={onContinue}
          className="w-full bg-[#005faa] text-white font-bold py-[14px] rounded-full hover:bg-[#004780] transition-colors active:scale-[0.98]"
        >
          Masuk ke Beranda
        </button>
      </div>
    </div>
  )
}
