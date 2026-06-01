import React from "react";
import { IconRenderer } from "./IconRenderer";

export interface MenuIconProps {
  key?: string | number;
  icon: string;
  label: string;
  color: string;
  badge?: string;
  bgCircle?: string;
  badgeColor?: string;
  isTextIcon?: boolean;
  textIcon?: string;
  onClick?: () => void;
  isActive?: boolean;
}

export const MenuIcon = React.memo(function MenuIcon({
  icon,
  label,
  color,
  badge,
  bgCircle,
  badgeColor = "bg-green-500",
  isTextIcon = false,
  textIcon = "",
  onClick,
  isActive = false,
}: MenuIconProps) {
  return (
    <div
      className="flex flex-col items-center gap-2 cursor-pointer group relative"
      onClick={onClick}
    >
      <div
        className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm
        ${bgCircle ? bgCircle : "bg-slate-50 border border-slate-100"} 
        ${color}
        ${isActive ? "shadow-[0_8px_20px_rgba(15,23,42,0.12)] -translate-y-1.5 scale-110 !bg-white border-slate-200" : ""}
      `}
      >
        {isTextIcon ? (
          <span className={`font-black text-sm italic ${color}`}>
            {textIcon}
          </span>
        ) : (
          <IconRenderer name={icon} size={24} />
        )}
      </div>
      {badge && (
        <span
          className={`absolute -top-1 right-0 ${badgeColor} text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-10 border border-white`}
        >
          {badge}
        </span>
      )}
      <span className="text-[12px] font-semibold text-slate-700 text-center leading-[1.1] max-w-[64px] tracking-tight">
        {label}
      </span>
    </div>
  );
});
