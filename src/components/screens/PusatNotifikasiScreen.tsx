import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

interface PusatNotifikasiScreenProps {
  onBack: () => void;
}

export function PusatNotifikasiScreen({ onBack }: PusatNotifikasiScreenProps) {
  const [isOn, setIsOn] = useState(true);
  
  return (
    <div className="w-full h-full bg-[#f8fafc] relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-center relative py-4 shrink-0 shadow-sm z-10 bg-white">
        <button onClick={onBack} className="absolute left-4 p-1 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-700" />
        </button>
        <h2 className="font-bold text-[16px] text-slate-800">Notification Center</h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        <div className="px-6 pt-6 pb-6 text-center">
          <p className="text-[14px] text-slate-600 leading-[1.6]">
            Manage feature notifications, transactions, and important information according to your needs.
          </p>
        </div>

        <div className="mt-2 bg-white">
          <div className="flex items-start gap-4 px-5 py-5 border-y border-slate-100">
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
               <span className="text-yellow-500 font-bold text-[10px]">Lpoin</span>
            </div>
            <div className="flex-1 flex flex-col gap-1">
               <div className="flex items-start justify-between">
                  <h4 className="font-bold text-[15px] text-slate-800">Enable Points Notification</h4>
                  <div 
                    role="button"
                    className={`rounded-full flex items-center shrink-0 ml-4 px-[2px] cursor-pointer transition-colors duration-300 ${isOn ? 'bg-[#3FA2F6]' : 'bg-slate-300'}`}
                    onClick={() => setIsOn(!isOn)}
                    style={{ width: '46px', height: '24px' }}
                  >
                    <div className={`w-[20px] h-[20px] bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isOn ? 'translate-x-[22px]' : 'translate-x-0'}`}></div>
                  </div>
               </div>
               <p className="text-[13px] text-slate-500 leading-[1.5] pr-8">Notification for successful transactions and earning additional Arc Points.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
