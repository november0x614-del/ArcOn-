import React from 'react';
import { Eye, EyeOff } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useUSDCBalance } from "../../services/unified-balance-kit/hooks";
import { UIDCardTheme } from "../../types";
import { THEME_STYLES } from "../../utils/theme";

interface WalletCardProps {
  onNavigate?: () => void;
  onClick?: () => void;
  className?: string;
  userName: string;
}

export const WalletCard = React.memo(function WalletCard({ onNavigate, onClick, className = "", userName }: WalletCardProps) {
  const {
    showBalance,
    setShowBalance,
    pnlValue,
    pnlPercentage,
    registeredUser,
  } = useApp();

  const { formattedBalance } = useUSDCBalance();

  const currentTheme: Exclude<UIDCardTheme, undefined> = registeredUser?.uidTheme || 'default';
  const styles = THEME_STYLES[currentTheme];

  const userRegDateStr = registeredUser?.registrationDate 
    ? new Date(registeredUser.registrationDate).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })
    : "05/26";

  return (
    <div
      className={`${styles.walletBg} rounded-[24px] p-4 sm:p-5 ${styles.textColor} shadow-xl relative overflow-hidden mb-3 border ${styles.borderClass} cursor-pointer transition-all active:scale-[0.98] group ${className}`}
      onClick={onClick || onNavigate}
    >
      <div className="flex justify-between items-center z-10 relative gap-3">
        <div className="flex flex-col text-left flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[12px] sm:text-[13px] font-medium ${styles.subText} whitespace-nowrap`}>
              Est total value
            </span>
            {showBalance ? (
              <Eye
                size={14}
                className={`${styles.subText} shrink-0`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBalance(false);
                }}
              />
            ) : (
              <EyeOff
                size={14}
                className={`${styles.subText} shrink-0`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBalance(true);
                }}
              />
            )}
          </div>

          <div className="flex items-baseline gap-1.5 mb-2 sm:mb-3 flex-wrap">
            <span className="text-[26px] sm:text-[32px] font-black tracking-tight leading-none truncate">
              {showBalance ? (formattedBalance || '0,00') : '******'}
            </span>
            <div className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded-md">
              <span className={`text-[11px] sm:text-[12px] font-black ${styles.currencyText}`}>
                USDC
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] sm:text-[12px] ${styles.subText} border-b border-dashed ${styles.pnlBorder} pb-0.5 whitespace-nowrap`}>
              PnL
            </span>
            <span className="text-[11px] sm:text-[12px] font-bold text-emerald-500 whitespace-nowrap">
              {(() => {
                return `${pnlValue >= 0 ? '+' : '-'}${Math.abs(pnlValue).toFixed(2).replace('.', ',')} (${pnlPercentage >= 0 ? '+' : ''}${pnlPercentage.toFixed(2).replace('.', ',')}%)`;
              })()}
            </span>
          </div>
        </div>

        {/* UID Card Artwork */}
        <div className={`w-20 h-13 sm:w-24 sm:h-16 rounded-lg sm:rounded-xl border border-slate-100 shadow-xl relative overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500 flex flex-col justify-between p-2 sm:p-2.5 ${styles.cardBg}`}>
          {/* Accent Graphic */}
          <div className={`absolute top-0 right-0 w-[50%] h-[120%] border-[2px] ${styles.accentBorder} rounded-full pointer-events-none rotate-12 translate-x-1/2 -translate-y-1/3`}></div>

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-1">
              <div className={`w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-[2px] ${currentTheme === 'default' ? 'bg-blue-600' : currentTheme === 'premium' ? 'bg-[#d4c085]' : 'bg-emerald-500'} flex items-center justify-center`}>
                <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full border-[1px] border-white"></div>
              </div>
              <span className="text-slate-900 font-bold text-[5px] sm:text-[6px] tracking-tight italic select-none leading-none">arc</span>
              <span className={`${currentTheme === 'default' ? 'text-blue-600' : currentTheme === 'premium' ? 'text-[#d4c085]' : 'text-emerald-500'} text-[2.5px] sm:text-[3px] font-black mt-[-2px] ml-[-1px]`}>™</span>
            </div>
            
            <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-[2px] bg-slate-50 border border-slate-100 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-[0.2px]">
                  <div className="w-[0.8px] sm:w-[1px] h-[0.8px] sm:h-[1px] bg-slate-900 rounded-[0.2px]"></div>
                  <div className="w-[0.8px] sm:w-[1px] h-[0.8px] sm:h-[1px] bg-slate-200 rounded-[0.2px]"></div>
                </div>
            </div>
          </div>

          <div className="flex flex-col relative z-10 mt-0.5">
              <span className={`text-[5.5px] sm:text-[7px] font-mono ${styles.uidText} tracking-wide font-medium leading-none`}>
                {registeredUser?.supabaseUid ? `${registeredUser.supabaseUid.slice(0, 4)} ${registeredUser.supabaseUid.slice(4, 8)}` : "UID-NONE"}
              </span>
          </div>
          
          <div className="flex justify-between items-end relative z-10 mt-auto">
              <div className="flex flex-col items-start leading-none gap-0.5">
                <span className={`${styles.uidText} font-bold text-[4.5px] sm:text-[6px] uppercase tracking-tighter leading-none`}>{userName}</span>
              </div>
              <div className="flex flex-col items-end leading-none">
                <span className={`text-[2.5px] sm:text-[3.5px] font-mono ${styles.uidSubText} select-none`}>{userRegDateStr}</span>
              </div>
          </div>
        </div>
      </div>

      {/* Ambient Glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${styles.glow} blur-[60px] rounded-full -translate-y-12 translate-x-12 pointer-events-none`}></div>
    </div>
  );
});
