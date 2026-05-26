import React from 'react';

interface ProductCardProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

export function ProductCard({ title, desc, icon, onClick }: ProductCardProps) {
  return (
    <div 
      className="bg-slate-50 rounded-2xl p-4 border border-slate-100 relative overflow-hidden group cursor-pointer hover:bg-slate-100 hover:border-slate-200 transition-colors"
      onClick={onClick}
    >
      <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center shadow-sm mb-3">
         {icon}
      </div>
      <h3 className="font-bold text-slate-800 text-[13px] mb-1 text-left">{title}</h3>
      <p className="text-[11px] text-slate-500 leading-snug text-left">{desc}</p>
      
      <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-blue-100/50 rounded-full blur-xl group-hover:bg-blue-200/50 transition-colors"></div>
    </div>
  );
}
