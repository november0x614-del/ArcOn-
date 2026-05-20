import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface StockRowProps {
  code: string;
  name: string;
  price: string;
  change: string;
  percent: string;
  isDown: boolean;
}

export function StockRow({ code, name, price, change, percent, isDown }: StockRowProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-lg -mx-2 px-2 transition-colors cursor-pointer">
      <div className="flex gap-3 items-center">
        <div className="w-8 h-8 rounded-full bg-blue-50 text-[#3FA2F6] flex justify-center items-center text-xs font-bold border border-blue-100">
           {code.substring(0, 1)}
        </div>
        <div className="text-left">
          <h4 className="font-bold text-slate-800 text-[15px]">{code}</h4>
          <p className="text-[11px] text-slate-500 max-w-[120px] truncate">{name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-slate-800 text-[15px]">{price}</p>
        <p className={`text-[12px] font-semibold flex items-center justify-end gap-1 ${isDown ? 'text-red-500' : 'text-green-500'}`}>
          {isDown ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
          {change} ({percent})
        </p>
      </div>
    </div>
  );
}
