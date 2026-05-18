import React from 'react';
import { ChevronDown, ArrowRight, Zap } from 'lucide-react';

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="w-full h-full bg-white relative flex flex-col">
      {/* Top Splash Section */}
      <div className="flex-1 relative flex flex-col items-center justify-center bg-white overflow-hidden">
        
        {/* Top Indicators */}
        <div className="absolute top-4 w-full flex justify-between items-start px-4 z-20">
           <div className="w-16"></div>
           <div className="flex flex-col items-center opacity-40 mt-1 pb-4">
             <ChevronDown size={20} className="-mb-3 text-slate-400" />
             <ChevronDown size={20} className="text-slate-400" />
           </div>
           <div className="bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
             Arc Points
           </div>
        </div>

        {/* Splash Image area */}
        <div className="absolute inset-0 flex items-center justify-center mix-blend-multiply opacity-95">
           <img 
             src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop" 
             alt="Splash" 
             className="w-[150%] h-[150%] object-cover object-center translate-y-[-10%]"
             style={{ filter: 'contrast(1.2) saturate(1.8) hue-rotate(-20deg)' }}
           />
        </div>
        
        {/* Logo overlay on splash */}
        <div className="z-10 flex flex-col items-center -mt-16">
           <h1 className="text-[72px] font-black italic text-[#4338ca] drop-shadow-xl leading-none">ArcOn</h1>
           <p className="text-[13px] font-bold text-[#4338ca] mt-0 drop-shadow-md tracking-wide">by circle</p>
        </div>
        
        {/* Floating Banner */}
        <div className="absolute bottom-10 left-4 right-4 bg-[#4338ca] text-white rounded-[16px] p-3 flex justify-between items-center shadow-lg z-20 cursor-pointer hover:bg-blue-800 transition-colors">
           <div className="flex flex-col gap-0.5 ml-1">
             <h3 className="font-bold text-[13px]">Saatnya Mulai Investasi ST016 💰</h3>
             <p className="text-[11px] text-blue-100">Kupon s.d. 6.25% per thn, tenor 4 thn 💸</p>
           </div>
           <div className="w-6 h-6 bg-white text-[#4338ca] rounded-full flex items-center justify-center shrink-0">
              <ArrowRight size={14} strokeWidth={3} />
           </div>
        </div>
      </div>
      
      {/* Bottom Action Area */}
      <div className="bg-white z-20 pt-6 pb-10 flex flex-col relative w-full rounded-t-3xl shadow-[0_-15px_30px_rgba(0,0,0,0.08)] mt-[-24px]">
         {/* Quick Actions Scroll */}
         <div className="w-full overflow-x-auto scrollbar-hide mb-6 relative">
            <div className="flex justify-start gap-3 px-5 min-w-max">
               <LoginActionIcon icon={<div className="w-3.5 h-3.5 bg-yellow-400 rounded-[3px]"></div>} label="e-money" />
               <LoginActionIcon icon={<Zap size={22} className="text-indigo-500 fill-blue-500" strokeWidth={1} />} label="Quick Pick" />
               <LoginActionIcon isQris label="QR Bayar" />
               <LoginActionIcon isQris badge="NEW" label="QRIS Tap" badgeColor="bg-green-500" />
               <LoginActionIcon isQris badge="NEW" label="QR Terima Transfer" badgeColor="bg-green-500" />
            </div>
            
            {/* Fade right edge */}
            <div className="absolute top-0 right-0 h-full w-10 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
         </div>
         
         {/* Dots & Arrow */}
         <div className="flex justify-center gap-1.5 mb-8 items-center cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-6 h-1.5 bg-[#4338ca] rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
            <ArrowRight size={14} className="text-slate-400 ml-1" />
         </div>

         {/* Login Button */}
         <div className="px-5">
           <button 
             onClick={onLogin}
             className="w-full bg-[#4338ca] text-white font-bold text-[16px] py-3.5 rounded-[24px] shadow-[0_4px_14px_rgba(0,95,170,0.3)] hover:shadow-[0_6px_20px_rgba(0,95,170,0.4)] hover:bg-[#1e1b4b] transition-all active:scale-[0.98]"
           >
             Login
           </button>
         </div>
      </div>
    </div>
  );
}

function LoginActionIcon({ icon, label, badge, badgeColor, isQris }: { icon?: React.ReactNode, label: string, badge?: string, badgeColor?: string, isQris?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer w-[76px] group">
      <div className="w-[58px] h-[58px] rounded-full bg-white border-[1.5px] border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center justify-center relative transition-all group-hover:scale-105 group-hover:border-blue-200">
        {isQris ? (
          <span className="font-extrabold text-[15px] italic text-[#6366f1] tracking-tighter">QRIS</span>
        ) : icon}
        {badge && (
          <span className={`absolute -top-1 -right-2 ${badgeColor} text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border border-white shadow-sm tracking-wide`}>
            {badge}
          </span>
        )}
      </div>
      <span className="text-[11px] text-slate-600 text-center font-medium leading-[1.2] px-1 group-hover:text-slate-900 transition-colors">{label}</span>
    </div>
  )
}
