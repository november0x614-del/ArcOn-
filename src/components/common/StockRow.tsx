import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StockRowProps {
  code: string;
  name: string;
  price: string;
  change: string;
  percent: string;
  isDown: boolean;
}

export const StockRow = React.memo(function StockRow({
  code,
  name,
  price,
  change,
  percent,
  isDown,
}: StockRowProps) {
  const [flash, setFlash] = React.useState<"up" | "down" | null>(null);
  const prevPriceRef = React.useRef(price);

  React.useEffect(() => {
    if (prevPriceRef.current !== price) {
      setFlash(isDown ? "down" : "up");
      const timer = setTimeout(() => setFlash(null), 1000);
      prevPriceRef.current = price;
      return () => clearTimeout(timer);
    }
  }, [price, isDown]);

  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-lg -mx-2 px-2 transition-colors cursor-pointer group">
      <div className="flex gap-3 items-center">
        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 flex justify-center items-center text-xs font-bold border border-slate-200">
          {code.substring(0, 1)}
        </div>
        <div className="text-left">
          <h4 className="font-bold text-slate-800 text-[15px]">{code}</h4>
          <p className="text-[11px] text-slate-500 max-w-[120px] truncate">
            {name}
          </p>
        </div>
      </div>
      <div className="text-right">
        <div
          className={`transition-colors duration-300 rounded px-1 -mx-1 ${flash === "up" ? "bg-green-100 text-green-700" : flash === "down" ? "bg-red-100 text-red-700" : "text-slate-800"}`}
        >
          <p className="font-bold text-[15px]">{price}</p>
        </div>
        <p
          className={`text-[12px] font-semibold flex items-center justify-end gap-1 mt-0.5 ${isDown ? "text-red-500" : "text-green-500"}`}
        >
          {isDown ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
          {change} ({percent})
        </p>
      </div>
    </div>
  );
});
