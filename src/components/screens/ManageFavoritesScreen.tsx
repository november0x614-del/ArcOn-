import React, { useState } from 'react';
import { ArrowLeft, Send, Receipt, PlusCircle, CreditCard, ArrowDownToLine, Globe, Nfc, Coins, QrCode, LayoutGrid, Minus, Plus } from 'lucide-react';

export interface ShortcutItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  bgCircle?: string;
  badge?: string;
  badgeColor?: string;
  isTextIcon?: boolean;
  textIcon?: string;
}

export const defaultSelectedShortcuts: ShortcutItem[] = [
    { id: '1', icon: <Send size={24} />, label: "Transfer USDC", color: "text-blue-500" },
    { id: '2', icon: <Receipt size={24} />, label: "Bayar/Billing", color: "text-blue-500", badge: "NEW" },
    { id: '3', icon: <PlusCircle size={24} />, label: "Isi Saldo USDC", color: "text-blue-500" },
    { id: '4', icon: <CreditCard size={24} />, label: "Token Digital", color: "text-yellow-500", bgCircle: "bg-yellow-50" },
    { id: '5', icon: <ArrowDownToLine size={24} />, label: "Deposit/Withdraw", color: "text-[#3FA2F6]" },
    { id: '6', icon: <Globe size={24} />, label: "Cross-Chain Transfer", color: "text-[#3FA2F6]", badge: "Rp", badgeColor: "bg-yellow-400" },
    { id: '7', icon: <Nfc size={24} />, label: "Tap to Pay", color: "text-[#3FA2F6]" },
    { id: '8', icon: <Coins size={24} />, label: "Request Dana", color: "text-[#3FA2F6]", badge: "Rp" },
    { id: '9', icon: <QrCode size={24} />, label: "Terima QRIS Web3", color: "text-yellow-500", isTextIcon: true, textIcon: "QRIS" },
  ];

  export const defaultAvailableShortcuts: ShortcutItem[] = [
    { id: '10', icon: <Send size={24} />, label: "Transfer Fiat", color: "text-slate-400" },
    { id: '11', icon: <Receipt size={24} />, label: "Tagih Aset", color: "text-[#3FA2F6]", badge: "NEW" },
    { id: '12', icon: <LayoutGrid size={24} />, label: "Lihat Semua", color: "text-blue-400" },
  ];

  export function ManageFavoritesScreen({ 
    onBack, 
    onSave,
    initialSelected,
    initialAvailable
  }: { 
    onBack: () => void, 
    onSave: (selected: ShortcutItem[], available: ShortcutItem[]) => void,
    initialSelected: ShortcutItem[],
    initialAvailable: ShortcutItem[]
  }) {
    const [selected, setSelected] = useState<ShortcutItem[]>(initialSelected);
    const [available, setAvailable] = useState<ShortcutItem[]>(initialAvailable);

    const handleRemove = (item: ShortcutItem) => {
      setSelected(prev => prev.filter(i => i.id !== item.id));
      setAvailable(prev => [...prev, item]);
    };

    const handleAdd = (item: ShortcutItem) => {
      if (selected.length >= 9) return;
      setAvailable(prev => prev.filter(i => i.id !== item.id));
      setSelected(prev => [...prev, item]);
    };

    const isSaveDisabled = selected.length === 0;

    return (
      <div className="w-full h-full bg-white relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-center relative py-4 shrink-0 bg-white">
          <button onClick={onBack} className="absolute left-4 p-1 hover:bg-slate-50 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-700" />
          </button>
          <h2 className="font-bold text-[16px] text-slate-800">Web3 Transaction Favorites</h2>
        </div>

        <div className="flex-1 overflow-y-auto w-full scrollbar-hide pb-24">
          
          <div className="px-5 text-center mt-2 mb-6">
             <p className="text-[14px] text-slate-600">Select 9 asset transaction menus that you use most frequently.</p>
          </div>

        <div className="px-4">
           {/* Selected Grid */}
           <div className="grid grid-cols-4 gap-y-6 gap-x-2 mb-6">
             {selected.map((item, idx) => (
               <div key={item.id} className="flex flex-col items-center gap-2 cursor-pointer group w-full" onClick={() => handleRemove(item)}>
                 <div className="relative">
                   <div className={`w-[52px] h-[52px] rounded-full border border-[#f1f5f9] flex flex-col items-center justify-center shrink-0 shadow-sm relative ${item.bgCircle || 'bg-white'}`}>
                     <div className={item.color}>
                       {item.icon}
                     </div>
                     {item.isTextIcon && (
                       <span className={`text-[8px] font-bold -mt-0.5 ${item.color}`}>{item.textIcon}</span>
                     )}
                   </div>
                   
                   {/* Minus Badge */}
                   <div className="absolute -top-1 -right-1 w-[20px] h-[20px] bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 transition-transform group-active:scale-95">
                     <Minus size={12} strokeWidth={4} className="text-white" />
                   </div>
                   
                   {item.badge && (
                      <div className={`absolute -top-1 right-3 ${item.badgeColor || 'bg-green-500'} text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-sm z-0`}>
                        {item.badge}
                      </div>
                   )}
                 </div>
                 <span className="text-[11px] font-medium text-slate-700 text-center leading-[1.1] ">{item.label}</span>
               </div>
             ))}
             
             {/* Empty slots placeholders */}
             {Array.from({length: Math.max(0, 9 - selected.length)}).map((_, idx) => (
                <div key={`empty-${idx}`} className="flex flex-col items-center gap-2 w-full opacity-60">
                  <div className="w-[52px] h-[52px] rounded-full bg-slate-100 flex items-center justify-center shrink-0"></div>
                </div>
             ))}
           </div>

           <div className="w-full h-[1px] bg-slate-100 my-6"></div>

           {/* Available Grid */}
           <div className="grid grid-cols-4 gap-y-6 gap-x-2 pb-6">
             {available.map((item) => (
               <div 
                 key={item.id} 
                 className={`flex flex-col items-center gap-2 cursor-pointer group w-full ${selected.length >= 9 ? 'opacity-50 grayscale' : ''}`}
                 onClick={() => {
                   if (selected.length < 9) handleAdd(item);
                 }}
               >
                 <div className="relative w-max">
                   <div className={`w-[52px] h-[52px] rounded-full border border-[#f1f5f9] flex flex-col items-center justify-center shrink-0 shadow-sm transition-colors ${item.bgCircle || 'bg-white'}`}>
                     <div className={item.color}>
                       {item.icon}
                     </div>
                     {item.isTextIcon && (
                       <span className={`text-[8px] font-bold -mt-0.5 ${item.color}`}>{item.textIcon}</span>
                     )}
                   </div>
                   
                   {/* Plus Badge */}
                   <div className="absolute -top-1 -right-1 w-[20px] h-[20px] bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 transition-transform group-active:scale-95">
                     <Plus size={12} strokeWidth={4} className="text-white" />
                   </div>
                 </div>
                 <span className="text-[11px] font-medium text-slate-700 text-center leading-[1.1]">{item.label}</span>
               </div>
             ))}
           </div>
        </div>

      </div>

      <div className="bg-white/95 backdrop-blur-md px-5 pb-5 pt-4 absolute bottom-0 w-full z-30 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
        <button 
          onClick={() => {
             if (!isSaveDisabled) onSave(selected, available);
          }}
          disabled={isSaveDisabled}
          className={`w-full py-3.5 rounded-full font-bold text-[15px] transition-all
            ${isSaveDisabled 
              ? 'bg-slate-200 text-slate-400' 
              : 'bg-[#3FA2F6] text-white hover:bg-blue-600 active:scale-[0.98]'
            }
          `}
        >
          Save
        </button>
      </div>

    </div>
  );
}
