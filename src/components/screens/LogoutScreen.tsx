import React from 'react';
import { X, LogOut } from 'lucide-react';

interface LogoutScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

export function LogoutScreen({ onBack, onLogout }: LogoutScreenProps) {
  return (
    <div className="absolute inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="flex justify-between items-center px-6 pt-12 pb-4 border-b border-slate-100 shadow-sm relative z-10">
        <h3 className="font-bold text-[20px] text-slate-800">Want to log out?</h3>
        <button
          onClick={onBack}
          className="p-1 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200 bg-transparent border-0 cursor-pointer"
        >
          <X size={22} className="text-slate-500" strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-6">
          <LogOut size={40} />
        </div>
        
        <h3 className="font-bold text-[22px] text-slate-800 mb-3">
          Sign Out of Arc Commerce?
        </h3>
        <p className="text-slate-600 text-[15px] leading-relaxed mb-10 max-w-xs">
          Make sure all your on-chain activities are finished. Thank you for building with us today!
        </p>

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button
            className="w-full bg-[#008fcd] text-white font-bold text-[16px] py-4 rounded-2xl shadow-lg hover:bg-[#007dba] active:scale-[0.98] transition-all border-0 cursor-pointer"
            onClick={onLogout}
          >
            Yes, Log Me Out
          </button>
          <button
            className="w-full bg-slate-50 text-slate-500 font-bold text-[16px] py-4 rounded-2xl hover:bg-slate-100 transition-all border-0 cursor-pointer"
            onClick={onBack}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
