import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Zap, 
  ShieldCheck, 
  Server, 
  Terminal, 
  RefreshCw, 
  CreditCard, 
  Wallet, 
  Info, 
  Copy, 
  Check, 
  AlertTriangle, 
  Play, 
  HelpCircle,
  Clock
} from "lucide-react";

interface PendingTransaction {
  id: string;
  user_id: string;
  amount: string;
  type: string;
  status: string;
  internal_ref: string;
  created_at: string;
  metadata: any;
}

export function InfrastructureTab() {
  const [strategy, setStrategy] = useState<"SPONSORED" | "USER_PAID_USDC">("SPONSORED");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Simulation states
  const [pendingTxList, setPendingTxList] = useState<PendingTransaction[]>([]);
  const [selectedInternalRef, setSelectedInternalRef] = useState<string>("");
  const [simulationStatus, setSimulationStatus] = useState<"COMPLETE" | "FAILED">("COMPLETE");
  const [errorReason, setErrorReason] = useState<string>("INSUFFICIENT_NATIVE_TOKEN");
  const [errorDetails, setErrorDetails] = useState<string>("Saldo gas tidak mencukupi");
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [simSuccess, setSimSuccess] = useState<string | null>(null);

  // Clipboard copies
  const [copiedAiStudio, setCopiedAiStudio] = useState(false);
  const [copiedVercel, setCopiedVercel] = useState(false);
  const [vercelDomain, setVercelDomain] = useState("arc-on-y1t4.vercel.app");

  const fetchConfigAndPending = async () => {
    setLoading(true);
    try {
      // 1. Fee strategy
      const configRes = await fetch("/api/admin/config/fees");
      if (configRes.ok) {
        const data = await configRes.json();
        setStrategy(data.strategy);
      }

      // 2. Pending transactions for simulation dropdown
      const pendingRes = await fetch("/api/admin/config/pending-transactions");
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingTxList(data || []);
        if (data && data.length > 0) {
          setSelectedInternalRef(data[0].internal_ref);
        } else {
          setSelectedInternalRef("");
        }
      }
    } catch (err) {
      console.error("[Config/Pending fetch error]", err);
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

  const executeWebhookSimulation = async () => {
    if (!selectedInternalRef) return;
    setSimulating(true);
    setSimError(null);
    setSimSuccess(null);

    try {
      const payload: any = {
        internalRef: selectedInternalRef,
        status: simulationStatus,
      };

      if (simulationStatus === "FAILED") {
        payload.errorReason = errorReason;
        payload.errorDetails = errorDetails;
      }

      const res = await fetch("/api/admin/simulate-circle-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses simulasi webhook");
      }

      setSimSuccess(data.message || "Webhook berhasil disimulasikan!");
      
      // Refresh configurations & transactions pending list
      setTimeout(() => {
        fetchConfigAndPending();
      }, 1000);
    } catch (err: any) {
      setSimError(err.message || "Gagal menyambung ke server simulasi");
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    fetchConfigAndPending();
  }, []);

  const copyToClipboard = (text: string, type: "aistudio" | "vercel") => {
    navigator.clipboard.writeText(text);
    if (type === "aistudio") {
      setCopiedAiStudio(true);
      setTimeout(() => setCopiedAiStudio(false), 2000);
    } else {
      setCopiedVercel(true);
      setTimeout(() => setCopiedVercel(false), 2000);
    }
  };

  const aiStudioWebhookUrl = `${window.location.origin}/api/circle/webhook`;
  const vercelWebhookUrl = vercelDomain.startsWith("http") 
    ? `${vercelDomain.replace(/\/$/, "")}/api/circle/webhook`
    : `https://${vercelDomain}/api/circle/webhook`;

  const logs = [
    { type: "WEBHOOK", event: "transaction.state_changed", status: "200 OK", time: "2m ago" },
    { type: "CIRCLE_API", event: "GET /wallets", status: "200 OK", time: "5m ago" },
    { type: "AUTH", event: "Supabase JWT Refresh", status: "SUCCESS", time: "12m ago" },
    { type: "BLOCKCHAIN", event: "Arc Testnet RPC Sync", status: "CONNECTED", time: "Instant" },
  ];

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      
      {/* 2-Column top header settings */}
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
                : "Biaya gas didebit langsung dari saldo USDC User + 10% profit margin untuk Circle. Memerlukan smart contract SCA wallet."
              }
            </p>
          </div>
        </div>

        {/* Dynamic Dual Webhook Configuration Display (AI Studio & Vercel) */}
        <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4 mb-5">
              <div className="p-3 bg-violet-50 rounded-2xl text-violet-600">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Dual Webhook Sync</div>
                <div className="text-[18px] font-bold tracking-tight text-slate-800">Circle Webhook Subscription URLs</div>
              </div>
            </div>

            <p className="text-[12px] text-slate-500 mb-4 tracking-tight leading-relaxed">
              Daftarkan salah satu atau kedua alamat callback Webhook berikut di dalam akun <strong className="text-slate-800">Circle Developer Portal (Developer &gt; Webhooks)</strong> untuk menjamin status mutasi transaksi real-time:
            </p>

            <div className="space-y-3.5 mb-2">
              {/* 1. AI Studio Webhook URL */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">1. AI Studio Workspace URL</span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={aiStudioWebhookUrl} 
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-600 focus:outline-none focus:border-slate-200"
                  />
                  <button 
                    onClick={() => copyToClipboard(aiStudioWebhookUrl, "aistudio")}
                    className="px-3 bg-slate-900 active:scale-95 transition-all text-white rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-800 text-[11px] font-bold shrink-0 cursor-pointer border-0"
                  >
                    {copiedAiStudio ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copiedAiStudio ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* 2. Vercel Webhook URL */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2. Vercel Production URL</span>
                <div className="flex gap-2">
                  <div className="flex-1 flex border border-slate-100 bg-slate-50 rounded-xl overflow-hidden items-center group focus-within:border-slate-200">
                    <span className="pl-3 text-[11px] text-slate-400 font-medium tracking-tight">https://</span>
                    <input 
                      type="text" 
                      value={vercelDomain} 
                      onChange={(e) => setVercelDomain(e.target.value.replace(/^https?:\/\//i, ""))}
                      placeholder="lounge-secure-stablecoin.vercel.app"
                      className="flex-1 bg-transparent border-0 py-2 px-1 text-[11px] font-mono text-slate-600 focus:outline-none"
                    />
                    <span className="pr-3 text-[11px] text-indigo-500 font-mono tracking-tight font-medium">/api/circle/webhook</span>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(vercelWebhookUrl, "vercel")}
                    className="px-3 bg-slate-900 active:scale-95 transition-all text-white rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-800 text-[11px] font-bold shrink-0 cursor-pointer border-0"
                  >
                    {copiedVercel ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copiedVercel ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 mt-2 font-medium flex items-center gap-1.5">
            <Info size={12} className="text-violet-500" />
            <span>Format standard path Callback Circle: <code className="bg-slate-100 p-0.5 rounded px-1 font-mono text-slate-600 text-[9.5px]">/api/circle/webhook</code></span>
          </div>
        </div>
      </div>

      {/* Manual Webhook Simulation Center */}
      <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
           <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                 <Server size={22} />
              </div>
              <div>
                 <h3 className="font-bold text-slate-800 text-[16px] tracking-tight">Lounge Offline Webhook Simulator</h3>
                 <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Automated State Reconciliation Debugger</p>
              </div>
           </div>
           
           <button 
             onClick={fetchConfigAndPending}
             className="px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 active:scale-95 transition-all rounded-xl text-[12px] font-bold flex items-center gap-2 border border-slate-100 cursor-pointer"
           >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh Pending
           </button>
        </div>

        {/* Display Simulated Responses */}
        {simSuccess && (
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-100 flex items-start gap-3 text-[13px] font-medium leading-relaxed animate-in fade-in zoom-in duration-200">
            <ShieldCheck size={18} className="shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5">Simulasi Sukses!</p>
              <p className="text-[12px] text-emerald-700 font-medium">{simSuccess}</p>
            </div>
          </div>
        )}

        {simError && (
          <div className="bg-rose-50 text-rose-800 p-4 rounded-2xl border border-rose-100 flex items-start gap-3 text-[13px] font-medium leading-relaxed animate-in fade-in zoom-in duration-200">
            <AlertTriangle size={18} className="shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5">Kesalahan Simulasi</p>
              <p className="text-[12px] text-rose-700 font-medium">{simError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Section 1: Select Stuck Transaction */}
          <div className="space-y-2 col-span-1 md:col-span-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">
              1. Pilihlah Transaksi Pending (Stuck) di Database
            </label>
            
            {loading ? (
              <div className="p-10 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 font-medium text-[13px] bg-slate-50">
                <RefreshCw size={24} className="animate-spin text-slate-300 mb-2" />
                Mengevaluasi transaksi...
              </div>
            ) : pendingTxList.length === 0 ? (
              <div className="p-8 border border-dashed border-indigo-100 bg-indigo-50/10 rounded-2xl flex flex-col items-center justify-center text-center">
                <Clock size={28} className="text-slate-300 mb-2" />
                <span className="text-[13px] text-slate-500 font-bold mb-1">Semua Transaksi Selesai</span>
                <span className="text-[10.5px] text-slate-400 font-medium max-w-[280px]">
                  Tidak ada transaksi bernilai 'pending' yang stuck di Supabase saat ini. Anda dapat membuat transaksi (swap atau transfer) baru di client, lalu membukanya di sini untuk simulasi callback.
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <select 
                  value={selectedInternalRef} 
                  onChange={(e) => setSelectedInternalRef(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl py-3 px-4 text-[13px] font-medium text-slate-800 focus:outline-none focus:border-slate-300 transition-colors"
                >
                  {pendingTxList.map((tx) => {
                    const formattedDate = new Date(tx.created_at).toLocaleTimeString();
                    const metadataMemo = tx.metadata?.fromToken 
                      ? `${tx.metadata?.fromToken} ➔ ${tx.metadata?.toToken}`
                      : (tx.metadata?.recipientName || tx.metadata?.destinationAddress || tx.type);
                    return (
                      <option key={tx.id} value={tx.internal_ref}>
                        [{tx.type.toUpperCase()}] ({formattedDate}) - {tx.amount} USDC ({metadataMemo}) ref_id: {tx.internal_ref.substring(0, 12)}...
                      </option>
                    );
                  })}
                </select>
                <span className="text-[10px] text-slate-400 pl-1 font-medium italic block">
                  Pilihlah ID reference Circle internal yang dikembalikan untuk diselesaikan dengan payload buatan.
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Choose Simulation Callback Result */}
          <div className="space-y-3.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">
              2. Status Simulasi & Parameter
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => setSimulationStatus("COMPLETE")}
                className={`py-2 px-3 rounded-xl border text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                  simulationStatus === "COMPLETE"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${simulationStatus === "COMPLETE" ? "bg-emerald-500" : "bg-slate-400"}`}></div>
                COMPLETE (Success)
              </button>

              <button 
                type="button"
                onClick={() => setSimulationStatus("FAILED")}
                className={`py-2 px-3 rounded-xl border text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                  simulationStatus === "FAILED"
                  ? "border-rose-600 bg-rose-50 text-rose-700"
                  : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${simulationStatus === "FAILED" ? "bg-rose-500" : "bg-slate-400"}`}></div>
                FAILED (Gagal)
              </button>
            </div>

            {simulationStatus === "FAILED" && (
              <div className="space-y-2.5 p-3.5 bg-rose-50/40 rounded-2xl border border-rose-100/40 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block">Alasan kegagalan (Webhook Error)</label>
                  <select 
                    value={errorReason}
                    onChange={(e) => {
                      setErrorReason(e.target.value);
                      if (e.target.value === "INSUFFICIENT_NATIVE_TOKEN") {
                        setErrorDetails("Saldo gas (token native) tidak mencukupi.");
                      } else if (e.target.value === "ESTIMATION_ERROR") {
                        setErrorDetails("ERC20: transfer amount exceeds balance");
                      } else if (e.target.value === "PAYMASTER_POLICY_EXCEED_MAX_DAILY_TRANSACTIONS") {
                        setErrorDetails("Gas Station policy check exceeded daily limits.");
                      } else {
                        setErrorDetails("Check allowance");
                      }
                    }}
                    className="w-full bg-white border border-rose-100 rounded-xl py-1.5 px-3 text-[11.5px] font-medium text-rose-800"
                  >
                    <option value="INSUFFICIENT_NATIVE_TOKEN">INSUFFICIENT_NATIVE_TOKEN</option>
                    <option value="ESTIMATION_ERROR">ESTIMATION_ERROR (Revert)</option>
                    <option value="FAILED_ON_CHAIN">FAILED_ON_CHAIN (Blockchain Revert)</option>
                    <option value="PAYMASTER_POLICY_EXCEED_MAX_DAILY_TRANSACTIONS">GAS_POLICIES_LIMIT</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block">Deskripsi Detail Kesalahan</label>
                  <input 
                    type="text" 
                    value={errorDetails}
                    onChange={(e) => setErrorDetails(e.target.value)}
                    className="w-full bg-white border border-rose-100 rounded-xl py-1.5 px-3 text-[11.5px] font-medium text-rose-800"
                  />
                </div>
              </div>
            )}

            <button
              onClick={executeWebhookSimulation}
              disabled={simulating || pendingTxList.length === 0}
              className="w-full bg-slate-900 active:scale-[0.98] transition-all py-3.5 rounded-2xl text-white font-bold text-[13px] flex items-center justify-center gap-2 border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide shadow-sm"
            >
              {simulating ? (
                <>
                  <RefreshCw size={15} className="animate-spin text-white" />
                  Mengirim Event...
                </>
              ) : (
                <>
                  <Play size={14} className="fill-white" />
                  Kirim Callback Simulasi
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* System Logs */}
      <div className="bg-slate-900 rounded-[32px] overflow-hidden border border-slate-800 shadow-2xl">
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
           <div className="flex items-center gap-2">
              <Terminal size={106} className="text-slate-400 w-4 h-4" />
              <h3 className="font-bold text-white text-[14px] tracking-tight">Live System Event Log</h3>
           </div>
           <button onClick={fetchConfigAndPending} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-400">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
           </button>
        </div>
        <div className="p-2">
           <div className="bg-slate-950 rounded-2xl overflow-hidden divide-y divide-white/5 font-mono animate-pulse">
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
