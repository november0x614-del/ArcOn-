import React from "react";
import { useArcScanToken } from "../../hooks/useArcScanToken";

interface TokenIconProps {
  contractAddress?: string;
  symbol: string;
  className?: string; // used for w-11 h-11, etc.
  color?: string; // fallback color
}

export function TokenIcon({ contractAddress, symbol, className = "", color = "bg-slate-800" }: TokenIconProps) {
  const { logoUrl } = useArcScanToken(contractAddress, symbol);

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold shadow-inner relative overflow-hidden shrink-0 ${color} ${className}`}
    >
      {logoUrl ? (
        <img 
          src={logoUrl} 
          alt={symbol} 
          className="w-full h-full object-contain z-20"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="z-10 tracking-tight uppercase">
          {symbol.substring(0, 4)}
        </span>
      )}
    </div>
  );
}
