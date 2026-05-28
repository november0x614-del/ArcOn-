import React from "react";
import { Activity, Zap, ShieldCheck, Server, Terminal, RefreshCw } from "lucide-react";

export function InfrastructureTab() {
  const logs = [
    { type: "WEBHOOK", event: "transaction.state_changed", status: "200 OK", time: "2m ago" },
    { type: "CIRCLE_API", event: "GET /wallets", status: "200 OK", time: "5m ago" },
    { type: "AUTH", event: "Supabase JWT Refresh", status: "SUCCESS", time: "12m ago" },
    { type: "BLOCKCHAIN", event: "Arc Testnet RPC Sync", status: "CONNECTED", time: "Instant" },
  ];

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 rounded-[32px] p-6 text-white overflow-hidden relative group">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-400/10 rounded-2xl text-emerald-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Circle API Status</div>
              <div className="text-[18px] font-bold tracking-tight">Enterprise Production - US_EAST_1</div>
            </div>
            <div className="ml-auto">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">Latency</div>
                <div className="text-[14px] font-bold">124ms</div>
             </div>
             <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">Rate Limit</div>
                <div className="text-[14px] font-bold">1.2k / 10k</div>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
             <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                <Server size={24} />
             </div>
             <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Lounge Instance</div>
                <div className="text-[18px] font-bold tracking-tight text-slate-800">Edge Cluster: SG-01</div>
             </div>
          </div>
          <div className="space-y-3">
             <div className="flex items-center justify-between text-[12px]">
                <span className="text-slate-500 font-medium">Memory Usage</span>
                <span className="font-bold text-slate-700">256MB / 512MB</span>
             </div>
             <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-1/2 h-full bg-indigo-500"></div>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[32px] overflow-hidden border border-slate-800 shadow-2xl">
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
           <div className="flex items-center gap-2">
              <Terminal size={16} className="text-slate-400" />
              <h3 className="font-bold text-white text-[14px] tracking-tight">Live System Event Log</h3>
           </div>
           <button className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-400">
              <RefreshCw size={14} />
           </button>
        </div>
        <div className="p-2">
           <div className="bg-slate-950 rounded-2xl overflow-hidden divide-y divide-white/5 font-mono">
              {logs.map((log, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center justify-between text-[11px] group hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-indigo-400 font-bold min-w-[80px]">{log.type}</span>
                    <span className="text-slate-300">{log.event}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`${log.status === "200 OK" || log.status === "SUCCESS" || log.status === "CONNECTED" ? "text-emerald-400" : "text-amber-400"} font-bold`}>
                      {log.status}
                    </span>
                    <span className="text-slate-600 tabular-nums">{log.time}</span>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
