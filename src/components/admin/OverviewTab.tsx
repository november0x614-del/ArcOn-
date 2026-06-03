import React from "react";
import { Users, CircleDollarSign, Activity, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface AdminStats {
  totalUsers: number;
  totalVolume: string;
  treasuryBalance: string;
  volumeData?: {
    batch: number;
    single: number;
  };
}

interface OverviewTabProps {
  stats: AdminStats | null;
  loading: boolean;
}

const COLORS = ["#10b981", "#6366f1"]; // Emerald-500 and Indigo-500

export function OverviewTab({ stats, loading }: OverviewTabProps) {
  const chartData = [
    { name: "Batch Transfers", value: stats?.volumeData?.batch || 0 },
    { name: "Single Transfers", value: stats?.volumeData?.single || 0 },
  ].filter(d => d.value > 0);

  // Default fallback if no data
  const finalChartData = chartData.length > 0 ? chartData : [
    { name: "No Data", value: 1 }
  ];

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* ... existing stats cards ... */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 text-[13px] font-medium">
              Total Users
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Users size={18} className="text-blue-500" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800">
              {loading && !stats ? "..." : (stats?.totalUsers ?? 0)}
            </div>
            <div className="text-[11px] font-medium text-slate-400 mt-1">
              Live DB Records
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 text-[13px] font-medium">
              Treasury (Fee Account)
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <CircleDollarSign size={18} className="text-emerald-500" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-600">
              {loading && !stats
                ? "..."
                : (stats?.treasuryBalance ?? "0.00 USDC")}
            </div>
            <div className="text-[11px] font-medium text-slate-400 mt-1">
              On-chain L1 Admin Wallet Balance
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 text-[13px] font-medium">
              Total TX Volume
            </span>
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
              <Activity size={18} className="text-indigo-500" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800">
              {loading && !stats ? "..." : (stats?.totalVolume ?? "0.00 USDC")}
            </div>
            <div className="text-[11px] font-medium text-slate-400 mt-1">
              Cumulative Ledger Value
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-[350px] flex flex-col">
          <div className="flex items-center gap-2 mb-4">
             <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <PieChartIcon size={18} />
             </div>
             <h3 className="font-bold text-[15px] text-slate-800 tracking-tight">
               Volume Type Analytics
             </h3>
          </div>
          <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={finalChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {finalChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartData.length > 0 ? COLORS[index % COLORS.length] : "#e2e8f0"} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-[12px] font-bold text-slate-600 ml-1">{value}</span>} />
                </PieChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-[350px]">
          <h3 className="font-bold text-[15px] text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> core Node Status
          </h3>
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <span className="text-[13px] text-slate-600 font-medium flex items-center gap-2">
                Circle APIs & Webhook
              </span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Secure (Verified V2)
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <span className="text-[13px] text-slate-600 font-medium flex items-center gap-2">
                Arc Network RPC L1
              </span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <span className="text-[13px] text-slate-600 font-medium flex items-center gap-2">
                Supabase Cluster Sync
              </span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <div className="pt-2">
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Uptime</div>
                    <div className="text-[14px] font-bold text-slate-800">99.98%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Latency</div>
                    <div className="text-[14px] font-bold text-slate-800">2ms</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
