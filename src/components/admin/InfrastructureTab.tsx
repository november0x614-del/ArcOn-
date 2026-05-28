import React, { useState, useEffect } from "react";
import { Activity, Zap, ShieldCheck, Server, Terminal, RefreshCw, CreditCard, Wallet, Info } from "lucide-react";

export function InfrastructureTab() {
  const [strategy, setStrategy] = useState<"SPONSORED" | "USER_PAID_USDC">("SPONSORED");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/config/fees");
      if (res.ok) {
        const data = await res.json();
        setStrategy(data.strategy);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStrategy = async (newStrategy: "SPONSORED" | "USER_PAID_USDC") => {
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/config/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: newStrategy }),
      });
      if (res.ok) {
        setStrategy(newStrategy);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const logs = [
    { type: "WEBHOOK", event: "transaction.state_changed", status: "200 OK", time: "2m ago" },
    { type: "CIRCLE_API", event: "GET /wallets", status: "200 OK", time: "5m ago" },
    { type: "AUTH", event: "Supabase JWT Refresh", status: "SUCCESS", time: "12m ago" },
    { type: "BLOCKCHAIN", event: "Arc Testnet RPC Sync", status: "CONNECTED", time: "Instant" },
  ];

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fee Strategy Card */}
        <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                  <Zap size={24} />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Gas & Fee Strategy</div>
                  <div className="text-[18px] font-bold tracking-tight text-slate-800">
                    {strategy === "SPONSORED" ? "Sponsored (Gas Station)" : "User Paid (USDC Paymaster)"}
                  </div>
                </div>
              </div>
              {updating && <RefreshCw size={18} className="animate-spin text-slate-300" />}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button 
                onClick={() => updateStrategy("SPONSORED")}
                disabled={updating || loading}
                className={`p-4 rounded-2xl border transition-all text-left group ${
                  strategy === "SPONSORED" 
                  ? "border-slate-900 bg-slate-900 text-white" 
                  : "border-slate-100 bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className={`p-2 rounded-lg mb-3 inline-block transition-colors ${
                  strategy === "SPONSORED" ? "bg-white/10 text-white" : "bg-white text-indigo-600 shadow-sm"
                }`}>
                  <CreditCard size={16} />
                </div>
                <div className="text-[13px] font-bold mb-1">Sponsored</div>
                <div className={`text-[10px] uppercase font-bold tracking-widest opacity-60 ${strategy === "SPONSORED" ? "text-slate-300" : "text-slate-500"}`}>
                   Dev Card Billing
                </div>
              </button>

              <button 
                onClick={() => updateStrategy("USER_PAID_USDC")}
                disabled={updating || loading}
                className={`p-4 rounded-2xl border transition-all text-left group ${
                  strategy === "USER_PAID_USDC" 
                  ? "border-emerald-600 bg-emerald-600 text-white" 
                  : "border-slate-100 bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className={`p-2 rounded-lg mb-3 inline-block transition-colors ${
                  strategy === "USER_PAID_USDC" ? "bg-white/10 text-white" : "bg-white text-emerald-600 shadow-sm"
                }`}>
                  <Wallet size={16} />
                </div>
                <div className="text-[13px] font-bold mb-1">User Paid (USDC)</div>
                <div className={`text-[10px] uppercase font-bold tracking-widest opacity-60 ${strategy === "USER_PAID_USDC" ? "text-emerald-100" : "text-slate-500"}`}>
                   10% Convenience Fee
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <Info size={14} className="mt-0.5 text-slate-400 shrink-0" />
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              {strategy === "SPONSORED" 
                ? "Merchant membayar biaya gas menggunakan kartu kredit yang terdaftar di Circle console. User tidak membayar gas apapun." 
                : "Biaya gas didebit langsung dari saldo USDC User + 10% profit margin untuk Circle. Memerlukan SCA wallet."
              }
            </p>
          </div>
        </div>

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
          <div className="grid grid-cols-2 gap-4 text-white">
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
      </div>

      <div className="bg-slate-900 rounded-[32px] overflow-hidden border border-slate-800 shadow-2xl">
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
           <div className="flex items-center gap-2">
              <Terminal size={16} className="text-slate-400" />
              <h3 className="font-bold text-white text-[14px] tracking-tight">Live System Event Log</h3>
           </div>
           <button onClick={fetchConfig} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-400">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
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
