import React from 'react';
import { ArrowLeft, Smartphone, Zap, Wallet, Plane, Joystick, Car, Search } from 'lucide-react';

export function TopUpScreen({ onBack }: { onBack: () => void }) {
  const topUpCategories = [
    { id: 'ewallet', name: 'Digital Wallet', icon: <Wallet className="text-blue-500" size={24} /> },
    { id: 'pulsa', name: 'Digital Services', icon: <Smartphone className="text-purple-500" size={24} /> },
    { id: 'pln', name: 'Utility & Energy', icon: <Zap className="text-yellow-500" size={24} /> },
    { id: 'transport', name: 'Mobility', icon: <Car className="text-emerald-500" size={24} /> },
    { id: 'game', name: 'Digital Entertainment', icon: <Joystick className="text-red-500" size={24} /> },
    { id: 'roaming', name: 'Connectivity', icon: <Plane className="text-indigo-500" size={24} /> },
  ];

  return (
    <div className="w-full h-full bg-[#f6f8fb] relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-center relative py-4 shrink-0 bg-white z-10 transition-colors">
        <button onClick={onBack} className="absolute left-4 p-1 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-700" />
        </button>
        <h2 className="font-bold text-[16px] text-slate-800 tracking-tight">Add Balance</h2>
      </div>

      <div className="flex-1 overflow-y-auto w-full scrollbar-hide pb-24">
        
        {/* Search */}
        <div className="bg-white px-4 pb-4 shadow-sm border-b border-slate-100">
          <div className="bg-slate-100 rounded-full flex items-center px-4 py-2.5">
            <Search size={18} className="text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search for Billers, Products, or Institutions" 
              className="bg-transparent w-full outline-none text-[13px] text-slate-700 placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>

        {/* Fast & Easy */}
        <div className="px-4 py-5">
           <h3 className="font-bold text-[16px] text-slate-800 tracking-tight mb-4">Fast & Easy</h3>
           <div className="grid grid-cols-4 gap-y-6 gap-x-2">
            {topUpCategories.map((cat) => (
              <div 
                key={cat.id} 
                className="flex flex-col items-center gap-2 cursor-pointer group w-full"
              >
                <div className="relative w-max">
                  <div className={`w-[52px] h-[52px] rounded-[16px] border border-slate-100 flex flex-col items-center justify-center shrink-0 shadow-sm transition-transform bg-white group-active:scale-95`}>
                    {cat.icon}
                  </div>
                </div>
                <span className="text-[11px] font-medium text-slate-700 text-center leading-[1.1] ">{cat.name}</span>
              </div>
            ))}
           </div>
        </div>

      </div>
    </div>
  );
}
