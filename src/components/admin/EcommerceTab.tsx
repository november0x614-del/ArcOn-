import React from "react";
import { ShoppingBag, Package, Truck, ExternalLink } from "lucide-react";

export function EcommerceTab() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Active Orders", value: "12", icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Inventory", value: "154 Items", icon: Package, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Pending Shipping", value: "3", icon: Truck, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 ${stat.bg} ${stat.color} rounded-xl`}>
              <stat.icon size={22} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
              <div className="text-[20px] font-bold text-slate-900 leading-tight">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 tracking-tight">Active Inventory</h3>
          <button className="text-[12px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
            Browse All <ExternalLink size={12} />
          </button>
        </div>
        <div className="divide-y divide-slate-50">
           {["Digital Pass v1", "Lounge Exclusive Sneaker", "Arc Network Node License"].map((item, i) => (
             <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                   <Package size={20} />
                 </div>
                 <div>
                   <div className="font-bold text-slate-800 text-[14px]">{item}</div>
                   <div className="text-[11px] text-slate-400 font-medium">SKU: ARC-00{i+1} • {10 + i} in stock</div>
                 </div>
               </div>
               <div className="text-right">
                 <div className="font-bold text-slate-900 text-[14px]">{(25 + i * 10).toFixed(2)} USDC</div>
                 <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">Instock</div>
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
