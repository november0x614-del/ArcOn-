import React, { useState, useEffect } from "react";
import {
  Zap,
  RefreshCw,
  CreditCard,
  Wallet,
  Info,
} from "lucide-react";

export function InfrastructureTab() {
  const [strategy, setStrategy] = useState<"SPONSORED" | "USER_PAID_USDC">(
    "SPONSORED",
  );
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const configRes = await fetch("/api/admin/config/fees");
      if (configRes.ok) {
        const data = await configRes.json();
        setStrategy(data.strategy);
      }
    } catch (err) {
      console.error("[Config fetch error]", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStrategy = async (
    newStrategy: "SPONSORED" | "USER_PAID_USDC",
  ) => {
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
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Gas & Fee Strategy
                  </div>
                  <div className="text-[18px] font-bold tracking-tight text-slate-800">
                    {strategy === "SPONSORED"
                      ? "Sponsored (Gas Station)"
                      : "User Paid (USDC Paymaster)"}
                  </div>
                </div>
              </div>
              {updating && (
                <RefreshCw size={18} className="animate-spin text-slate-300" />
              )}
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
                <div
                  className={`p-2 rounded-lg mb-3 inline-block transition-colors ${
                    strategy === "SPONSORED"
                      ? "bg-white/10 text-white"
                      : "bg-white text-indigo-600 shadow-sm"
                  }`}
                >
                  <CreditCard size={16} />
                </div>
                <div className="text-[13px] font-bold mb-1">Sponsored</div>
                <div
                  className={`text-[10px] uppercase font-bold tracking-widest opacity-60 ${strategy === "SPONSORED" ? "text-slate-300" : "text-slate-500"}`}
                >
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
                <div
                  className={`p-2 rounded-lg mb-3 inline-block transition-colors ${
                    strategy === "USER_PAID_USDC"
                      ? "bg-white/10 text-white"
                      : "bg-white text-emerald-600 shadow-sm"
                  }`}
                >
                  <Wallet size={16} />
                </div>
                <div className="text-[13px] font-bold mb-1">
                  User Paid (USDC)
                </div>
                <div
                  className={`text-[10px] uppercase font-bold tracking-widest opacity-60 ${strategy === "USER_PAID_USDC" ? "text-emerald-100" : "text-slate-500"}`}
                >
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
                : "Biaya gas didebit langsung dari saldo USDC User + 10% profit margin untuk Circle. Memerlukan smart contract SCA wallet."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
