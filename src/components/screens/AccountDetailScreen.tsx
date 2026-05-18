import React, { useState } from "react";
import { Send, Receipt, CreditCard, ArrowLeft, Copy, SlidersHorizontal, ArrowDownLeft, ArrowUpRight, Plus, Download, Filter, Search, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { Contact } from "../../types";

export function AccountDetailScreen({ 
  onBack, 
  onTransfer,
  onTopup
}: { 
  onBack: () => void,
  onTransfer: () => void,
  onTopup: () => void
}) {
  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50 animate-in slide-in-from-right duration-300 overflow-hidden">
      {/* Top Header Section - Blue Gradient */}
      <div className="bg-[#6366f1] pt-12 pb-24 px-4 relative shrink-0 z-10 flex flex-col items-center overflow-hidden">
        {/* Background abstract curves */}
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-white/5 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>
        
        <button onClick={onBack} className="absolute left-2 top-11 p-2 hover:bg-white/10 rounded-full transition-colors z-20">
          <ArrowLeft size={24} className="text-white" />
        </button>

        <h2 className="text-white text-[16px] font-semibold mt-1 tracking-wide z-10 w-full text-center pr-8">USDC Savings</h2>
        
        <div className="flex items-center gap-2 mt-1 z-10">
          <span className="text-white/90 text-[14px]">1820014780589</span>
          <button className="text-white/80 hover:text-white pt-1">
             <Copy size={14} />
          </button>
        </div>

        <div className="mt-4 z-10">
           <h1 className="text-white text-[32px] font-bold tracking-tight text-center">
             <span className="text-[18px] font-semibold mr-1">Rp</span> 
             18.154.685<span className="text-[14px] align-top relative top-[8px]">00</span>
           </h1>
        </div>

        {/* Action Buttons Row */}
        <div className="flex justify-center gap-[18px] mt-6 w-full z-10 px-2">
          <DetailActionButton icon={<Send size={20} />} label={`USDC\nTransfer`} onClick={onTransfer} />
          <DetailActionButton icon={<Receipt size={20} />} label={`Pay/VA`} badge="VA" />
          <DetailActionButton icon={<Plus size={22} />} label="Top-up" onClick={onTopup} />
          <DetailActionButton icon={<CreditCard size={20} />} label={`Cards`} />
        </div>
      </div>

      {/* Main Content Area - White background overlaps the blue */}
      <div className="flex-1 bg-white rounded-t-[32px] -mt-8 z-20 relative overflow-hidden flex flex-col shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        
        <div className="px-6 pt-6 pb-2 shrink-0 border-b border-slate-100 flex items-center justify-between">
           <div className="flex flex-col items-center border-b-2 border-slate-800 pb-1">
             <h3 className="font-bold text-[15px] text-slate-800">Transactions</h3>
           </div>
           <button className="text-[#6366f1] font-bold text-[13px]">e-Statement</button>
        </div>

        <div className="flex items-center px-4 py-3 shrink-0 justify-between">
           <div className="flex gap-4 overflow-x-auto scrollbar-hide py-1 text-[14px] text-slate-500 font-medium">
             <button className="whitespace-nowrap px-1">February</button>
             <button className="whitespace-nowrap px-1">March</button>
             <button className="whitespace-nowrap px-1">April</button>
             <button className="whitespace-nowrap px-1 text-slate-800 font-bold border-b-[2.5px] border-slate-800 pb-1">May</button>
           </div>
           <div className="flex items-center gap-3 ml-2 shrink-0">
              <button className="text-[#6366f1] bg-indigo-50 p-2 rounded-full"><Search size={16} strokeWidth={2.5} /></button>
              <button className="text-slate-400 p-2 rounded-full bg-slate-50"><Calendar size={16} strokeWidth={2.5} /></button>
           </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 flex flex-col pt-2">
           
           <div className="flex flex-col">
             <h4 className="text-[12px] font-bold text-slate-400 tracking-wider mb-2">18 May 2026</h4>
             <DetailTransactionItem 
               icon={<div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-slate-400 flex items-center justify-center shrink-0 mt-0.5"><ArrowUpRight size={12} className="text-slate-400" /></div>}
               title="USDC Transfer"
               desc={`Transfer to other Bank\nBCA ARADEA WISNU WARDANA 3771669164`}
               amount="- Rp 100.000"
               amountColor="text-slate-800"
             />
             <DetailTransactionItem 
               icon={<div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-slate-400 flex items-center justify-center shrink-0 mt-0.5"><div className="w-[8px] h-[8px] bg-slate-400 rounded-full"></div></div>}
               title="Fee"
               desc="Transfer fee to other Bank"
               amount="- Rp 6.500"
               amountColor="text-slate-800"
               hideSeparator
             />
           </div>

           <div className="flex flex-col mt-4">
             <h4 className="text-[12px] font-bold text-slate-400 tracking-wider mb-2">13 May 2026</h4>
             <DetailTransactionItem 
               icon={<div className="w-[18px] h-[18px] rounded-full bg-[#e0e7ff] flex items-center justify-center shrink-0 mt-0.5"><Receipt size={10} className="text-[#4f46e5]" /></div>}
               title="Pay/Top-up"
               desc={`Pembayaran Finnet Indonesia, PT\n8804460030940825`}
               amount="- Rp 126.000"
               amountColor="text-slate-800"
               badge="+ 1 pts"
             />
             <DetailTransactionItem 
               icon={<div className="w-[18px] h-[18px] rounded-full bg-[#e0e7ff] flex items-center justify-center shrink-0 mt-0.5"><Receipt size={10} className="text-[#4f46e5]" /></div>}
               title="Pay/Top-up"
               desc={`Pembayaran GoPay Customer\n082173022116`}
               amount="- Rp 460.000"
               amountColor="text-slate-800"
               badge="+ 1 pts"
               hideSeparator
             />
           </div>

           <div className="flex flex-col mt-4">
             <h4 className="text-[12px] font-bold text-slate-400 tracking-wider mb-2">07 May 2026</h4>
             <DetailTransactionItem 
               icon={<div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-slate-400 flex items-center justify-center shrink-0 mt-0.5"><div className="w-[8px] h-[8px] bg-slate-400 rounded-full"></div></div>}
               title="Fee"
               desc={`Bank transaction fee\nPembayaran GoPay Customer\n082173022116`}
               amount="- Rp 1.000"
               amountColor="text-slate-800"
             />
             <DetailTransactionItem 
               icon={<div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-[#4f46e5] flex items-center justify-center shrink-0 mt-0.5"><ArrowDownLeft size={12} className="text-[#4f46e5]" /></div>}
               title="USDC Transfer"
               desc={`Transfer from ARC NETWORK\nSAVONA ROLAN DUMA 1480026655707`}
               amount="+ Rp 6.261.000"
               amountColor="text-[#4f46e5]"
             />
           </div>

           <div className="flex flex-col mt-4">
             <h4 className="text-[12px] font-bold text-slate-400 tracking-wider mb-2">04 May 2026</h4>
             <DetailTransactionItem 
               icon={<div className="w-[18px] h-[18px] rounded-full bg-[#e0e7ff] flex items-center justify-center shrink-0 mt-0.5"><Receipt size={10} className="text-[#4f46e5]" /></div>}
               title="Pay/Top-up"
               desc={`Pembayaran GoPay Customer\n082173022116`}
               amount="- Rp 780.000"
               amountColor="text-slate-800"
               badge="+ 1 pts"
             />
             <DetailTransactionItem 
               icon={<div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-slate-400 flex items-center justify-center shrink-0 mt-0.5"><div className="w-[8px] h-[8px] bg-slate-400 rounded-full"></div></div>}
               title="Fee"
               desc={`Bank transaction fee\nPembayaran GoPay Customer\n082173022116`}
               amount="- Rp 1.000"
               amountColor="text-slate-800"
               hideSeparator
             />
           </div>

        </div>
      </div>
    </div>
  );
}



function DetailActionButton({ icon, label, badge, onClick }: { icon: React.ReactNode, label: string, badge?: string, onClick?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 group cursor-pointer w-16" onClick={onClick}>
      <div className="w-12 h-12 rounded-full bg-white text-[#6366f1] flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.1)] group-active:scale-95 transition-transform relative">
        {icon}
        {badge && (
          <div className="absolute -top-[2px] -right-[6px] bg-yellow-400 text-slate-800 text-[9px] font-bold px-1 py-[1px] rounded-[4px] border border-white leading-none">
            {badge}
          </div>
        )}
      </div>
      <span className="text-white text-[11px] font-medium text-center leading-tight whitespace-pre-line tracking-wide opacity-95">
        {label}
      </span>
    </div>
  );
}



function DetailTransactionItem({ 
  icon, 
  title, 
  desc, 
  amount, 
  amountColor = "text-slate-800",
  badge,
  hideSeparator
}: { 
  icon: React.ReactNode, 
  title: string, 
  desc: string, 
  amount: string,
  amountColor?: string,
  badge?: string,
  hideSeparator?: boolean
}) {
  return (
    <div className="flex gap-4 p-2 cursor-pointer group active:scale-[0.98] transition-all my-1">
       <div className="mt-1 w-6 shrink-0 flex justify-center">
          {icon}
       </div>
       <div className={`flex flex-col flex-1 pb-4 ${hideSeparator ? '' : 'border-b border-slate-100'}`}>
          <div className="flex justify-between items-start mb-1">
             <h5 className="font-bold text-[14px] text-slate-800 group-hover:text-[#6366f1] transition-colors">{title}</h5>
             <div className="flex flex-col items-end">
                <span className={`font-bold text-[14px] ${amountColor} flex`}>
                  {amount}
                  <span className="text-[9px] mt-0.5 ml-0.5">00</span>
                </span>
             </div>
          </div>
          <p className="text-[12px] text-slate-500 leading-snug whitespace-pre-line max-w-[85%] mt-1">{desc}</p>
          {badge && (
             <div className="mt-2.5 inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 pt-0.5 pb-1 rounded-full w-fit border border-emerald-100">
                <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center">
                   <span className="text-white text-[8px] font-bold">L</span>
                </div>
                <span className="text-[11px] font-bold tracking-tight">{badge}</span>
             </div>
          )}
       </div>
    </div>
  );
}

