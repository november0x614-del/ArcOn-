import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface ReceiveVAScreenProps {
  onBack: () => void;
}

export function ReceiveVAScreen({ onBack }: ReceiveVAScreenProps) {
  return (
    <div className="absolute inset-0 z-[60] bg-[#f8fafc] flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center px-4 pt-12 pb-4 bg-white border-b border-slate-100 shadow-sm relative z-10 w-full">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200"
        >
          <ArrowLeft size={24} className="text-slate-800" />
        </button>
        <h2 className="font-bold text-[16px] text-slate-800 ml-2">
          Receive via VA
        </h2>
      </div>
      <div className="flex-1 p-6 flex flex-col items-center">
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-200 w-full">
          <h3 className="font-bold text-[15px] text-slate-800 mb-2">
            Bank Mandiri (Virtual Account)
          </h3>
          <p className="text-[13px] text-slate-500 mb-6">
            Transfer dari bank manapun ke nomor VA di bawah. Saldo akan
            otomatis dikonversi ke USDC.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                Nomor VA
              </p>
              <p className="font-mono font-bold text-[18px] text-slate-800 tracking-wider">
                8932 1820 0147
              </p>
            </div>
            <button
              className="h-10 px-4 bg-blue-50 text-[#3FA2F6] font-bold rounded-lg text-[13px] hover:bg-blue-100 transition-colors border-0 cursor-pointer"
              onClick={(e) => {
                const btn = e.currentTarget;
                const originalText = btn.innerText;
                btn.innerText = "Tersalin!";
                setTimeout(() => {
                  btn.innerText = originalText;
                }, 2000);
              }}
            >
              Salin
            </button>
          </div>

          <button
            className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl text-[14px] hover:bg-slate-800 transition-colors border-0 cursor-pointer"
            onClick={() => {
              alert(
                "Simulasi Pembayaran Berhasil! \n\nNotifikasi Webhook diterima dan saldo akan dikonversi menjadi USDC.",
              );
              onBack();
            }}
          >
            Simulasikan Pembayaran
          </button>
        </div>
      </div>
    </div>
  );
}
