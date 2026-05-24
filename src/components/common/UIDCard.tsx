import React from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'motion/react';
import { useApp } from "../../context/AppContext";
import { UIDCardTheme } from "../../types";
import { THEME_STYLES } from "../../utils/theme";

interface UIDCardProps {
  userName: string;
  isBlurred?: boolean;
}

export function UIDCard({ userName, isBlurred = false }: UIDCardProps) {
  const { registeredUser } = useApp();
  
  const rawUid = (registeredUser?.supabaseUid || "8f7e-ffa1-0fb0-c52a").replace(/-/g, '').toUpperCase();
  const formattedUid = rawUid.match(/.{1,4}/g)?.slice(0, 4).join(' ') || rawUid;

  const currentTheme: Exclude<UIDCardTheme, undefined> = registeredUser?.uidTheme || 'default';
  const styles = THEME_STYLES[currentTheme];

  const userRegDateStr = registeredUser?.registrationDate 
    ? new Date(registeredUser.registrationDate).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })
    : "05/26";

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);
  
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div style={{ perspective: 1200 }} className="w-full max-w-[500px] mx-auto">
      <motion.div 
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d"
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full aspect-[1.586/1] rounded-[24px] p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden shadow-[0_15px_45px_-12px_rgba(0,0,0,0.12)] ${styles.cardBg} border ${styles.borderClass} group transition-all duration-300 ${isBlurred ? 'blur-md pointer-events-none' : ''}`}
      >
          {/* Accent Graphic */}
          <div className={`absolute top-[-10%] right-[-10%] w-[50%] h-[120%] border-[12px] ${styles.accentBorder} rounded-[100px] pointer-events-none rotate-12`}></div>
          <div className={`absolute top-[10%] right-[-5%] w-[40%] h-[40%] border-[2px] ${styles.accentBorder} rounded-full pointer-events-none opacity-50`}></div>

          {/* Top Section: Logo */}
          <div className="flex justify-between items-start z-10" style={{ transform: "translateZ(20px)" }}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg ${currentTheme === 'default' ? 'bg-blue-600' : currentTheme === 'premium' ? 'bg-[#d4c085]' : 'bg-emerald-500'} flex items-center justify-center shadow-lg`}>
                <div className="w-3.5 h-3.5 rounded-full border-[2px] border-white"></div>
              </div>
              <span className={`text-[16px] font-bold tracking-tight italic ${styles.uidText} select-none`}>arc</span>
              <span className={`text-[8px] font-black mt-[-10px] ml-[-2px] ${currentTheme === 'default' ? 'text-blue-600' : currentTheme === 'premium' ? 'text-[#d4c085]' : 'text-emerald-500'}`}>™</span>
            </div>
            
            <div className={`w-8 h-8 rounded-lg ${currentTheme === 'default' ? 'bg-slate-50' : 'bg-white/50'} border ${styles.borderClass} flex items-center justify-center`}>
               <div className="grid grid-cols-2 gap-[1px]">
                  <div className={`w-[3px] h-[3px] ${currentTheme === 'default' ? 'bg-slate-900' : currentTheme === 'premium' ? 'bg-slate-800' : 'bg-emerald-900'} rounded-[1px]`}></div>
                  <div className={`w-[3px] h-[3px] ${styles.uidSubText} rounded-[1px]`}></div>
                  <div className={`w-[3px] h-[3px] ${styles.uidSubText} rounded-[1px]`}></div>
                  <div className={`w-[3px] h-[3px] ${currentTheme === 'default' ? 'bg-slate-900' : currentTheme === 'premium' ? 'bg-slate-800' : 'bg-emerald-900'} rounded-[1px]`}></div>
               </div>
            </div>
          </div>

          {/* Middle Section: Card Number */}
          <div className="flex flex-col relative z-10" style={{ transform: "translateZ(30px)" }}>
             <span className={`text-[22px] sm:text-[28px] font-mono ${styles.uidText} tracking-[0.15em] font-medium block text-center mt-4 drop-shadow-sm`}>
               {formattedUid.substring(0, 19)}
             </span>
          </div>
          
          {/* Bottom Section: Info */}
          <div className="flex justify-between items-end relative z-10" style={{ transform: "translateZ(25px)" }}>
             <div className="flex flex-col items-start">
               <span className={`${styles.uidText} font-bold text-[14px] uppercase tracking-wider`}>{userName}</span>
             </div>
             
             <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <span className={`text-[6px] ${styles.uidSubText} uppercase tracking-widest mb-0.5`}>Valid Thru</span>
                  <span className={`text-[12px] font-mono ${styles.uidText}`}>05/30</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[6px] ${styles.uidSubText} uppercase tracking-widest mb-0.5`}>Since</span>
                  <span className={`text-[12px] font-mono ${styles.uidText}`}>{userRegDateStr}</span>
                </div>
             </div>
          </div>
      </motion.div>
    </div>
  );
}
