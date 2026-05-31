import React, { useEffect, useState } from 'react';
import { apiFetch } from "../../lib/api";
import { Wallet, RefreshCw, CircleDollarSign, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export function TreasuryMonitoringTab() {
  const [data, setData] = useState<{ address: string; balance: string } | null>(null);
  const [hotWalletBalance, setHotWalletBalance] = useState<string>("0.00");
  const [loading, setLoading] = useState(false);
  const [sweepAmount, setSweepAmount] = useState("");
  const [sweeping, setSweeping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [treasuryRes, statsRes] = await Promise.all([
        apiFetch("/api/admin/otc/treasury-balance"),
        apiFetch("/api/admin/stats")
      ]);
      
      if (treasuryRes.ok) setData(await treasuryRes.json());
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setHotWalletBalance(stats.treasuryBalance.split(' ')[0]); // Extract numeric part
      }
    } catch (err) {
      console.error(err);
      setError("Failed to synchronize treasury nodes.");
    } finally {
      setLoading(false);
    }
  };

  const handleSweep = async () => {
    if (!sweepAmount || parseFloat(sweepAmount) <= 0) return;
    
    setSweeping(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await apiFetch("/api/admin/treasury/sweep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: sweepAmount })
      });
      
      const result = await res.json();
      
      if (res.ok) {
        setSuccess("Sweep transaction broadcasted successfully to Treasury.");
        setSweepAmount("");
        fetchData();
      } else {
        setError(result.error || "Sweep execution failed.");
      }
    } catch (err) {
      setError("Network or server failure during sweep.");
    } finally {
      setSweeping(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Visual Header Explainer */}
      <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <ShieldCheck size={180} />
        </div>
        <div className="relative z-10 w-full max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
             <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30">
               <ShieldCheck size={24} className="text-emerald-400" />
             </div>
             <span className="font-black text-[12px] uppercase tracking-[0.2em] text-emerald-400">Security Architecture</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-4 leading-tight">
            Treasury & Multi-Tier <br /> Wallet Management
          </h1>
          <p className="text-slate-400 text-[14px] font-medium leading-relaxed mb-0">
            Platform fees are collected in the <span className="text-white font-bold">Hot Wallet (Admin)</span> for operational liquidity. 
            For enterprise security, it is highly recommended to periodically <span className="text-white font-bold italic">"Sweep"</span> accumulated fees 
            to an offline <span className="text-emerald-400 font-bold">Treasury Wallet</span>.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[13px] font-bold animate-in slide-in-from-top-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 text-[13px] font-bold animate-in slide-in-from-top-2">
          <ShieldCheck size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hot Wallet Card */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 relative group overflow-hidden">
          <div className="flex justify-between items-start mb-8">
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Source Tier 1</span>
              <h3 className="text-[17px] font-black text-slate-800">Admin Hot Wallet</h3>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-100">
               <RefreshCw size={20} className={`text-amber-500 ${loading ? "animate-spin" : ""}`} />
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-[12px] font-bold text-slate-400">Total Operational Balance</p>
            <h4 className="text-3xl font-black text-slate-900">{parseFloat(hotWalletBalance).toLocaleString()} <span className="text-[16px] text-slate-400 font-bold">USDC</span></h4>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-50">
             <div className="flex items-center justify-between mb-4">
                <span className="text-[12px] font-bold text-slate-800">Initiate Treasury Sweep</span>
                <span className="text-[10px] bg-slate-900 text-white px-2 py-1 rounded-md font-black uppercase tracking-tighter">Action</span>
             </div>
             <div className="flex gap-2">
                <input 
                  type="number"
                  value={sweepAmount}
                  onChange={(e) => setSweepAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-mono font-bold text-slate-800 outline-none focus:border-slate-900 transition-all"
                />
                <button 
                  onClick={handleSweep}
                  disabled={sweeping || !sweepAmount || parseFloat(sweepAmount) <= 0 || parseFloat(sweepAmount) > parseFloat(hotWalletBalance)}
                  className="px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[12px] uppercase tracking-wider transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-2"
                >
                  {sweeping ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                  Sweep
                </button>
             </div>
             <p className="text-[10.5px] text-slate-400 font-medium mt-3 leading-relaxed italic">
               *Transfers USDC from Hot Wallet to the configured Treasury address below.
             </p>
          </div>
        </div>

        {/* Treasury Card */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-8">
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Tier 2 Cold Storage</span>
                <h3 className="text-[17px] font-black text-slate-800">Treasury Vault</h3>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-2xl border border-emerald-100">
                 <CircleDollarSign size={20} className="text-emerald-500" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[12px] font-bold text-slate-400">Total Treasury Balance</p>
              {data ? (
                <h4 className="text-3xl font-black text-emerald-600">{parseFloat(data.balance).toLocaleString()} <span className="text-[16px] text-slate-400 font-bold">USDC</span></h4>
              ) : (
                <h4 className="text-2xl font-black text-slate-300">Syncing...</h4>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-50">
             <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Vault Destination</div>
             <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 font-mono text-[11px] text-slate-500 break-all leading-relaxed shadow-inner">
               {data?.address || "Address not sync'd"}
             </div>
             <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Active Destination Node</span>
             </div>
          </div>
        </div>
      </div>
      
      {/* Safety Summary Banner */}
      <div className="p-5 bg-blue-50 border border-blue-100 rounded-[28px] flex gap-4 items-start shadow-sm">
         <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
           <ShieldCheck size={20} />
         </div>
         <div>
            <h5 className="font-black text-[13px] text-blue-900 mb-1">Standard Operating Procedure</h5>
            <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
              Selalu jaga Hot Wallet pada level operasional yang cukup untuk refund atau cashback merchant. Tarik (Sweep) keuntungan berlebih ke Treasury Wallet secara manual atau jadwalkan via Backend Cron Job (`/api/wallet/auto-sweep`).
            </p>
         </div>
      </div>
    </div>
  );
}
