import React from 'react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: React.ReactNode;
}

export function NavItem({ icon, label, active = false, onClick, badge }: NavItemProps) {
  return (
    <div onClick={onClick} className={`flex flex-col items-center gap-1 cursor-pointer transition-colors w-16 relative ${active ? 'text-slate-800' : 'text-slate-400 hover:text-slate-800'}`}>
      <div className={`${active ? '-translate-y-0.5' : ''} transition-transform relative`}>
        {icon}
        {badge}
      </div>
      <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </div>
  );
}
