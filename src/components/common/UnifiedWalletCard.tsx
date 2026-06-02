import React from "react";
import { Eye, EyeOff, Diamond, Lock } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../../store/useStore";
import { THEME_STYLES } from "../../utils/theme";
import { UIDCardTheme } from "../../types";

interface UnifiedWalletCardProps {
  onNavigate?: () => void;
  className?: string;
  userName?: string;
}

export const UnifiedWalletCard = React.memo(function UnifiedWalletCard({
  onNavigate,
  className = "",
  userName = "NOVEMBER",
}: UnifiedWalletCardProps) {
  const {
    showBalance,
    setShowBalance,
    pnlValue,
    pnlPercentage,
    registeredUser,
    unifiedBalance,
  } = useStore(
    useShallow((state) => ({
      showBalance: state.showBalance,
      setShowBalance: state.setShowBalance,
      pnlValue: state.pnlValue,
      pnlPercentage: state.pnlPercentage,
      registeredUser: state.registeredUser,
      unifiedBalance: state.unifiedBalance,
    })),
  );

  const isPremium = registeredUser?.uidTheme === "premium";

  const formattedBalance = (typeof unifiedBalance === "number" ? unifiedBalance : Number(unifiedBalance) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const currentTheme: Exclude<UIDCardTheme, undefined> =
    registeredUser?.uidTheme || "default";
  const styles = THEME_STYLES[currentTheme];

  const userRegDateStr = registeredUser?.registrationDate
    ? new Date(registeredUser.registrationDate).toLocaleDateString("en-US", {
        month: "2-digit",
        year: "2-digit",
      })
    : "05/26";

  return (
    <div
      className={`bg-gradient-to-br from-teal-700 to-teal-900 rounded-[24px] p-4 sm:p-5 text-white shadow-xl relative overflow-hidden mb-3 border border-teal-600 cursor-pointer transition-all active:scale-[0.98] group ${!isPremium ? "opacity-75" : ""}`}
      onClick={() => isPremium && onNavigate?.()}
    >
      {!isPremium && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-teal-900/60 backdrop-blur-[2px]">
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20">
            <Lock size={16} />
            <span className="font-bold text-[12px] tracking-wide uppercase">Premium Only</span>
          </div>
        </div>
      )}
      <div className="absolute top-2.5 sm:top-3.5 right-3.5 sm:right-4.5 z-20 flex items-center gap-1 px-1.5 py-[1.5px] bg-slate-950/40 rounded-full border border-white/10 shadow-sm backdrop-blur-[1px] select-none">
        <Diamond
          size={7.5}
          className="text-teal-300"
          strokeWidth={3}
        />
        <span className="text-[6.5px] sm:text-[7px] font-extrabold uppercase tracking-widest text-white/90">
          Unified Account
        </span>
      </div>

      <div className="flex justify-between items-center z-10 relative gap-3">
        <div className="flex flex-col text-left flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[12px] sm:text-[13px] font-medium text-teal-200 whitespace-nowrap"
            >
              Est total value
            </span>
            {showBalance ? (
              <Eye
                size={14}
                className="text-teal-200 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBalance(false);
                }}
              />
            ) : (
              <EyeOff
                size={14}
                className="text-teal-200 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBalance(true);
                }}
              />
            )}
          </div>

          <div className="flex items-baseline gap-1.5 mb-2 sm:mb-3 flex-wrap">
            <span className="text-[26px] sm:text-[32px] font-black tracking-tight leading-none truncate">
              {showBalance ? (isPremium ? formattedBalance : "••••••") : "******"}
            </span>
            <div className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded-md">
              <span
                className="text-[11px] sm:text-[12px] font-black text-white"
              >
                USD
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[11px] sm:text-[12px] text-teal-200 border-b border-dashed border-teal-600 pb-0.5 whitespace-nowrap"
            >
              PnL
            </span>
            <span
              className={`text-[11px] sm:text-[12px] font-bold ${pnlValue >= 0 ? "text-emerald-300" : "text-rose-300"} whitespace-nowrap`}
            >
              {isPremium ? (() => {
                return `${pnlValue >= 0 ? "+" : "-"}${Math.abs(pnlValue).toFixed(2).replace(".", ",")} (${pnlPercentage >= 0 ? "+" : ""}${pnlPercentage.toFixed(2).replace(".", ",")}%)`;
              })() : "—"}
            </span>
          </div>
        </div>

        {/* UID Card Artwork matching the Native Wallet */}
        <div
          className={`w-20 h-13 sm:w-24 sm:h-16 mr-1.5 sm:mr-2 rounded-lg sm:rounded-xl border border-slate-100 shadow-xl relative overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500 flex flex-col justify-between p-2 sm:p-2.5 ${styles.cardBg}`}
        >
          {/* Accent Graphic */}
          <div
            className={`absolute top-0 right-0 w-[50%] h-[120%] border-[2px] ${styles.accentBorder} rounded-full pointer-events-none rotate-12 translate-x-1/2 -translate-y-1/3`}
          ></div>

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-1">
              <div
                className={`w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-[2px] ${currentTheme === "default" ? "bg-slate-800" : currentTheme === "premium" ? "bg-[#d4c085]" : "bg-emerald-500"} flex items-center justify-center`}
              >
                <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full border-[1px] border-white"></div>
              </div>
              <span className="text-slate-900 font-bold text-[5px] sm:text-[6px] tracking-tight italic select-none leading-none">
                arc
              </span>
              <span
                className={`${currentTheme === "default" ? "text-slate-800" : currentTheme === "premium" ? "text-[#d4c085]" : "text-emerald-500"} text-[2.5px] sm:text-[3px] font-black mt-[-2px] ml-[-1px]`}
              >
                ™
              </span>
            </div>

            <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-[2px] bg-slate-50 border border-slate-100 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-[0.2px]">
                <div className="w-[0.8px] sm:w-[1px] h-[0.8px] sm:h-[1px] bg-slate-900 rounded-[0.2px]"></div>
                <div className="w-[0.8px] sm:w-[1px] h-[0.8px] sm:h-[1px] bg-slate-200 rounded-[0.2px]"></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col relative z-10 mt-0.5">
            <span
              className={`text-[5.5px] sm:text-[7px] font-mono ${styles.uidText} tracking-wide font-medium leading-none`}
            >
              {registeredUser?.supabaseUid
                ? `${registeredUser.supabaseUid.slice(0, 4)} ${registeredUser.supabaseUid.slice(4, 8)}`
                : "UID-NONE"}
            </span>
          </div>

          <div className="flex justify-between items-end relative z-10 mt-auto">
            <div className="flex flex-col items-start leading-none gap-0.5">
              <span
                className={`${styles.uidText} font-bold text-[4.5px] sm:text-[6px] uppercase tracking-tighter leading-none`}
              >
                {userName}
              </span>
            </div>
            <div className="flex flex-col items-end leading-none">
              <span
                className={`text-[2.5px] sm:text-[3.5px] font-mono ${styles.uidSubText} select-none`}
              >
                {userRegDateStr}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Ambient Glow */}
      <div
        className="absolute top-0 right-0 w-32 h-32 bg-teal-500 blur-[80px] rounded-full -translate-y-12 translate-x-12 pointer-events-none"
      ></div>
    </div>
  );
});
