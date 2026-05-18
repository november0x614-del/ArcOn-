import React, { useState } from 'react';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { MenuItemData, ALL_TRANSACTION_MENUS } from '../../data/favoriteTransactions';

// We need a small version of MenuIcon or we can rebuild it here
function ManageMenuIcon({ 
  item, 
  actionType, 
  onAction,
  disabled = false
}: { 
  key?: React.Key,
  item: MenuItemData; 
  actionType: 'remove' | 'add'; 
  onAction: () => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center gap-2 relative ${disabled ? 'opacity-40 grayscale' : ''}`}>
       <div 
         className={`w-[60px] h-[60px] rounded-[18px] flex items-center justify-center relative cursor-pointer
           ${item.bgCircle ? item.bgCircle : 'bg-[#f4f8fb]'} 
           ${item.color} shadow-[0_2px_10px_rgba(0,0,0,0.03)]
           ${disabled ? 'cursor-default' : 'hover:scale-105 transition-transform'}`}
         onClick={!disabled ? onAction : undefined}
       >
         {item.isTextIcon ? (
           <span className="font-extrabold text-[15px] italic tracking-tighter relative z-10">{item.textIcon}</span>
         ) : item.icon}
         
         {/* Action Badge */}
         {!disabled && (
           <div 
             className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-20 ${actionType === 'remove' ? 'bg-red-500' : 'bg-green-500'}`}
           >
             {actionType === 'remove' ? <Minus size={14} className="text-white" strokeWidth={3} /> : <Plus size={14} className="text-white" strokeWidth={3} />}
           </div>
         )}
         
         {item.badge && disabled === false && actionType !== 'remove' && (
            <span className={`absolute -top-1.5 -right-2 ${item.badgeColor || 'bg-red-500'} text-white text-[8px] font-extrabold px-1 py-0.5 rounded-full border border-white shadow-sm z-10`}>
              {item.badge}
            </span>
         )}
       </div>
       <span className="text-[11px] text-slate-600 text-center font-medium leading-[1.2] px-1 h-8 line-clamp-2">
         {item.label}
       </span>
    </div>
  );
}

export function ManageFavoritesScreen({ 
  onBack, 
  initialFavorites, 
  onSave 
}: { 
  onBack: () => void; 
  initialFavorites: string[]; 
  onSave: (newFavorites: string[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialFavorites);

  const selectedItems = selectedIds.map(id => ALL_TRANSACTION_MENUS.find(m => m.id === id)).filter(Boolean) as MenuItemData[];
  
  const handleRemove = (id: string) => {
    setSelectedIds(prev => prev.filter(item => item !== id));
  };

  const handleAdd = (id: string) => {
    if (selectedIds.length >= 9) {
      // Cannot add more than 9
      return;
    }
    // ensure it's not already there
    if (!selectedIds.includes(id)) {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const hasChanges = JSON.stringify(initialFavorites) !== JSON.stringify(selectedIds);

  return (
    <div className="w-full h-full bg-slate-50 relative flex flex-col z-50">
      {/* Header */}
      <div className="w-full pt-12 pb-4 px-4 flex items-center justify-center relative bg-white shrink-0 z-10 shadow-sm border-b border-slate-100">
        <button onClick={onBack} className="absolute left-4 p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="text-slate-700" size={24} />
        </button>
        <h2 className="text-[16px] font-bold text-slate-800">Favorite Transactions</h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-[100px] bg-slate-50">
        {/* Selected Area */}
        <div className="bg-white px-5 pt-6 pb-2 mb-2 shadow-sm rounded-b-3xl border-b border-slate-100">
          <p className="text-[13px] text-slate-500 mb-6 font-medium">Select up to 9 transactions you use most often.</p>
          
          <div className="grid grid-cols-4 gap-y-7 gap-x-2">
            {selectedItems.map((item, idx) => (
              <ManageMenuIcon 
                key={`sel-${item.id}-${idx}`} 
                item={item} 
                actionType="remove" 
                onAction={() => handleRemove(item.id)} 
              />
            ))}
            {/* Empty slots placeholders */}
            {Array.from({ length: 9 - selectedIds.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex flex-col items-center gap-2">
                 <div className="w-[60px] h-[60px] rounded-[18px] bg-slate-100/50 border border-slate-200/50 flex items-center justify-center"></div>
              </div>
            ))}
          </div>
        </div>

        {/* All Available Area */}
        <div className="bg-white px-5 pt-6 pb-10 shadow-sm rounded-t-3xl mt-4">
          <div className="grid grid-cols-4 gap-y-7 gap-x-2">
            {ALL_TRANSACTION_MENUS.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <ManageMenuIcon 
                  key={`all-${item.id}`} 
                  item={item} 
                  actionType="add" 
                  onAction={() => handleAdd(item.id)} 
                  disabled={isSelected}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="absolute bottom-6 left-5 right-5 z-20">
        <button 
          disabled={!hasChanges}
          onClick={() => {
            if (hasChanges) {
              onSave(selectedIds);
            }
          }}
          className={`w-full font-bold text-[16px] py-3.5 rounded-[24px] shadow-sm transition-colors ${
            hasChanges 
            ? 'bg-[#6366f1] text-white cursor-pointer hover:bg-indigo-600' 
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Save
        </button>
      </div>
    </div>
  );
}
