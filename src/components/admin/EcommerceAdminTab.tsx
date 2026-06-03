import React, { useState, useEffect } from "react";
import { ShoppingCart, Split, AlertTriangle, ArrowRight, ShieldCheck, FileCheck, RefreshCw } from "lucide-react";

export function EcommerceAdminTab() {
  const [loading, setLoading] = useState(true);
  const [escrowQueue, setEscrowQueue] = useState<any[]>([]);

  const fetchEscrows = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ecommerce/admin/escrows");
      if (response.ok) {
        const data = await response.json();
        setEscrowQueue(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscrows();
  }, []);

  const totalVolume = escrowQueue.reduce((acc, order) => acc + parseFloat(order.amount || 0), 0).toFixed(2);
  const platformFees = (parseFloat(totalVolume) * 0.05).toFixed(2);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">E-Commerce & Escrow Management</h3>
          <button onClick={fetchEscrows} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <RefreshCw size={16} className={`text-slate-600 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <p className="text-sm text-slate-500 max-w-2xl">
          Manage platform fees, monitor escrow contracts (split-payments), and oversee marketplace transactions. The Platform Treasury acts as the Escrow Agent holding funds until order fulfillment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
             <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                <ShoppingCart size={20} />
             </div>
             <div>
               <p className="text-[13px] text-slate-500 font-medium">Total Escrow Volume</p>
               <h4 className="text-2xl font-bold text-slate-800 tracking-tight">{totalVolume} USDC</h4>
             </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
             <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Split size={20} />
             </div>
             <div>
               <p className="text-[13px] text-slate-500 font-medium">Platform Fees Collected (5%)</p>
               <h4 className="text-2xl font-bold text-slate-800 tracking-tight">{platformFees} USDC</h4>
             </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
             <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                <AlertTriangle size={20} />
             </div>
             <div>
               <p className="text-[13px] text-slate-500 font-medium">Disputed Orders</p>
               <h4 className="text-2xl font-bold text-slate-800 tracking-tight">0</h4>
             </div>
          </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
               <ShieldCheck size={18} className="text-emerald-500" /> 
               Active Escrow Queue
            </h4>
          </div>
        </div>
        
        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="border-b border-slate-100 bg-slate-50">
                 <th className="px-5 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Order DB ID</th>
                 <th className="px-5 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                 <th className="px-5 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Buyer → Seller</th>
                 <th className="px-5 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                 <th className="px-5 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-wider text-right">Status</th>
               </tr>
             </thead>
             <tbody>
                {escrowQueue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-sm text-slate-500">No escrow orders found or table not initialized.</td>
                  </tr>
                ) : escrowQueue.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors">
                     <td className="px-5 py-4 text-[13px] font-mono text-slate-600 truncate max-w-[120px]" title={item.id}>{item.id}</td>
                     <td className="px-5 py-4 text-[14px] font-medium text-slate-800">{item.product_name}</td>
                     <td className="px-5 py-4 text-[13px] text-slate-600 flex items-center gap-2 truncate max-w-[150px]">
                         <span title={item.buyer_id}>{item.buyer_id?.substring(0, 6)}</span> 
                         <ArrowRight size={14} className="text-slate-400 shrink-0" /> 
                         <span title={item.seller_address}>{item.seller_address?.substring(0, 6)}</span>
                     </td>
                     <td className="px-5 py-4 text-[14px] font-bold text-slate-800">{item.amount} USDC</td>
                     <td className="px-5 py-4 text-right">
                         {item.status === "PENDING_ESCROW" || item.status === "ESCROWED" ? (
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[11px] font-bold border border-amber-100 uppercase tracking-wide">
                                {item.status.replace("_", " ")}
                             </span>
                         ) : (
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold border border-emerald-100 uppercase tracking-wide">
                                <FileCheck size={12} /> {item.status}
                             </span>
                         )}
                     </td>
                  </tr>
                ))}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
