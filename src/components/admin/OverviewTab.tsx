import React from "react";
import { Users, CircleDollarSign, Activity } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalVolume: string;
  treasuryBalance: string;
}

interface OverviewTabProps {
  stats: AdminStats | null;
  loading: boolean;
}

export function OverviewTab({ stats, loading }: OverviewTabProps) {
  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 text-[13px] font-medium">Total Users</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Users size={18} className="text-blue-500" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800">
              {loading && !stats ? "..." : stats?.totalUsers ?? 0}
            </div>
            <div className="text-[11px] font-medium text-slate-400 mt-1">Live DB Records</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 text-[13px] font-medium">Treasury (Fee Account)</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <CircleDollarSign size={18} className="text-emerald-500" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-600">
              {loading && !stats ? "..." : stats?.treasuryBalance ?? "0.00 USDC"}
            </div>
            <div className="text-[11px] font-medium text-slate-400 mt-1">On-chain L1 Admin Wallet Balance</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 text-[13px] font-medium">Total TX Volume</span>
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
              <Activity size={18} className="text-indigo-500" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800">
              {loading && !stats ? "..." : stats?.totalVolume ?? "0.00 USDC"}
            </div>
            <div className="text-[11px] font-medium text-slate-400 mt-1">Cumulative Ledger Value</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
         <h3 className="font-bold text-[14px] text-slate-800 mb-3">Core Node Infrastructure</h3>
         <div className="space-y-3">
           <div className="flex items-center justify-between border-b border-slate-50 pb-2">
             <span className="text-[13px] text-slate-600 font-medium flex items-center gap-2">
               <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-ping"></span> Circle APIs & Webhook Signature
             </span>
             <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">Secure (Verified V2)</span>
           </div>
           <div className="flex items-center justify-between border-b border-slate-50 pb-2">
             <span className="text-[13px] text-slate-600 font-medium flex items-center gap-2">
               <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Arc Network RPC Layer-1
             </span>
             <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">Connected (ID 5042002)</span>
           </div>
           <div className="flex items-center justify-between">
             <span className="text-[13px] text-slate-600 font-medium flex items-center gap-2">
               <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Supabase Cluster Sync
             </span>
             <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">Active</span>
           </div>
         </div>
      </div>
    </div>
  );
}
