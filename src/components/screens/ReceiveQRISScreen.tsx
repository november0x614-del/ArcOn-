import React from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ReceiveQRISScreenProps {
  onBack: () => void;
}

export function ReceiveQRISScreen({ onBack }: ReceiveQRISScreenProps) {
  const { registeredUser } = useApp();
  const userName = registeredUser?.username || "Arc User";

  return (
    <div className="absolute inset-0 z-[60] bg-[#1a202c] flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between px-4 pt-12 pb-4 relative z-10 w-full">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-white bg-transparent border-0 cursor-pointer"
          >
            <X size={24} />
          </button>
          <h2 className="font-bold text-[16px] text-white ml-2">
            QRIS Terima Dana
          </h2>
        </div>
      </div>
      <div className="flex-1 p-6 flex flex-col items-center justify-center -mt-16">
        <div className="bg-white p-6 rounded-[32px] shadow-2xl w-full max-w-[320px] flex flex-col items-center relative overflow-hidden">
          <h3 className="font-bold text-[18px] text-slate-800 text-center mb-1">
            {userName}
          </h3>
          <p className="text-[13px] text-slate-500 mb-5">
            NMID: ID1029384756
          </p>

          <div className="w-56 h-56 bg-white border-2 border-slate-100 rounded-xl flex items-center justify-center p-3 mb-6 relative">
            <div className="w-full h-full border-2 border-slate-800 rounded-lg flex flex-col items-center justify-center p-2 relative">
              <div className="grid grid-cols-5 gap-1.5 w-full h-full p-2">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${i % 2 === 0 || i % 7 === 0 || i < 5 || i % 4 === 0 ? "bg-slate-900" : "bg-slate-100"}`}
                  />
                ))}
              </div>
            </div>
            {/* QRIS Logo placeholder in center */}
            <div className="absolute w-14 h-14 bg-white rounded-xl shadow-sm border-[3px] border-white flex items-center justify-center text-[12px] font-black tracking-widest text-[#ed1b24] italic p-1 text-center">
              QRIS
            </div>
          </div>

          <div className="w-full h-[1px] border-b border-dashed border-slate-200 my-2"></div>
          <p className="text-[12px] text-slate-400 text-center font-medium mt-3 mb-6 leading-relaxed">
            Tunjukkan kode QR ini untuk menerima pembayaran dari m-Banking
            atau e-Wallet manapun.
          </p>
        </div>
      </div>
    </div>
  );
}
