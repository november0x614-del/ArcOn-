import React, { useState } from "react";

interface SafeProductImageProps {
  src?: string;
  name: string;
  category: string;
  className?: string;
}

export function SafeProductImage({ src, name, category, className = "h-full w-full object-cover rounded-xl" }: SafeProductImageProps) {
  const [error, setError] = useState(!src);

  const getCategoryColor = (cat: string) => {
    const c = (cat || "").toLowerCase();
    if (c.includes("coffee") || c.includes("groc")) return "from-amber-100 to-amber-200 text-amber-800";
    if (c.includes("bake") || c.includes("bread")) return "from-orange-100 to-orange-200 text-orange-855";
    if (c.includes("fruit") || c.includes("produce")) return "from-emerald-100 to-emerald-200 text-emerald-800";
    if (c.includes("honey") || c.includes("sweet")) return "from-yellow-100 to-yellow-250 text-yellow-800";
    if (c.includes("milk") || c.includes("dairy")) return "from-blue-100 to-blue-200 text-blue-800";
    return "from-slate-100 to-slate-200 text-slate-800";
  };

  const getInitial = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : "PR";
  };

  if (error || !src) {
    return (
      <div className={`w-full h-full rounded-xl bg-gradient-to-br ${getCategoryColor(category)} flex flex-col items-center justify-center font-bold text-xs select-none p-1 ${className}`}>
        <span className="text-[14px] font-black tracking-tight leading-none mb-1">{getInitial(name)}</span>
        <span className="text-[8px] opacity-75 font-black uppercase tracking-widest scale-90 leading-none">{category || "Item"}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setError(true)}
      className={className}
    />
  );
}
