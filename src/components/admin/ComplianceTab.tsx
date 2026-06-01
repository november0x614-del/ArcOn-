import React, { useState, useEffect } from "react";
import {
  ShieldOff,
  Ban,
  AlertTriangle,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  ShieldCheck,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BlockedAddress {
  id: string;
  address: string;
  reason: string;
  created_at: string;
}

export function ComplianceTab() {
  const [blocklist, setBlocklist] = useState<BlockedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState("");
  const [newReason, setNewReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchBlocklist = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/compliance/blocklist");
      if (res.ok) {
        setBlocklist(await res.json());
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load blocklist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocklist();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/compliance/blocklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: newAddress, reason: newReason }),
      });

      if (res.ok) {
        setSuccess("Address permanently blocked");
        setNewAddress("");
        setNewReason("");
        await fetchBlocklist();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to block address");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (address: string) => {
    if (
      !confirm(`Are you sure you want to remove ${address} from the blocklist?`)
    )
      return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/compliance/blocklist/${address}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccess("Address unblocked");
        await fetchBlocklist();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError("Failed to remove address");
    } finally {
      setSaving(false);
    }
  };

  const filteredList = blocklist.filter(
    (item) =>
      item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 rounded-[32px] p-6 text-white col-span-2 relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-red-500/10 rounded-full blur-3xl"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-400/10 rounded-2xl text-red-400">
              <ShieldOff size={24} />
            </div>
            <div>
              <h3 className="text-[18px] font-bold tracking-tight">
                Sanctions Master-Filter
              </h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                OFAC & SDN Compliance Node
              </p>
            </div>
          </div>
          <p className="text-[13px] text-slate-300 leading-relaxed mb-4 max-w-lg">
            This module enforces protocol-level sanctions. Addresses added here
            will be immediately blocked from all outbound transfers, purchases,
            and swaps across the Lounge engine.
          </p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span className="text-[10px] font-bold">
                ARC Native Check Active
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <Ban size={12} className="text-red-400" />
              <span className="text-[10px] font-bold">
                {blocklist.length} Local Bans
              </span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-[32px] p-6 border border-amber-100 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <AlertTriangle size={18} />
            <span className="font-bold text-[14px]">Mainnet Advisory</span>
          </div>
          <p className="text-[12px] text-amber-700/80 leading-relaxed font-medium">
            On mainnet, failing to block transactions to sanctioned addresses
            can result in severe legal penalties. Ensure your blocklist is
            synced with official sources.
          </p>
          <div className="mt-4 pt-4 border-t border-amber-200/50">
            <button className="text-[11px] font-bold text-amber-700 flex items-center gap-1 hover:underline">
              <History size={12} /> View Compliance Audit Logs
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ADD FORM */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 text-[15px] mb-6 flex items-center gap-2">
              <Plus size={18} className="text-emerald-500" /> Block New Address
            </h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block px-1">
                  Blockchain Address
                </label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-[13px] font-mono focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block px-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="e.g. OFAC SDN List, Suspicious Activity"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-[13px] min-h-[100px] focus:ring-2 focus:ring-slate-900 outline-none transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={saving || !newAddress}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Ban size={18} />
                )}
                Apply Protocol Ban
              </button>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-[12px] font-bold flex items-center gap-2 animate-in slide-in-from-top-1">
                <AlertTriangle size={14} /> {error}
              </div>
            )}
            {success && (
              <div className="mt-4 p-3 bg-emerald-50 text-emerald-600 rounded-xl text-[12px] font-bold flex items-center gap-2 animate-in slide-in-from-top-1">
                <ShieldCheck size={14} /> {success}
              </div>
            )}
          </div>
        </div>

        {/* LIST */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
              <div className="relative flex-1 w-full">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search blocked addresses or reasons..."
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                />
              </div>
              <button
                onClick={fetchBlocklist}
                className="p-2.5 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <RefreshCw
                  size={20}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto w-full">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
                  <RefreshCw size={32} className="animate-spin opacity-20" />
                  <span className="text-[13px] font-medium font-mono uppercase tracking-widest">
                    Scanning Repository
                  </span>
                </div>
              ) : filteredList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-300">
                  <ShieldCheck size={48} className="opacity-10" />
                  <p className="text-[14px] font-medium leading-tight text-center">
                    {searchQuery
                      ? "No matching addresses found."
                      : "Repository Clean.\nNo local blocklist entries found."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {filteredList.map((item) => (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-5 flex items-start justify-between hover:bg-slate-50/80 transition-colors group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-red-50 rounded-xl text-red-500 mt-0.5">
                          <ShieldOff size={18} />
                        </div>
                        <div className="space-y-1">
                          <div className="text-[13px] font-mono font-bold text-slate-900 tracking-tight break-all">
                            {item.address}
                          </div>
                          {item.reason && (
                            <div className="text-[12px] text-slate-500 font-medium leading-relaxed">
                              {item.reason}
                            </div>
                          )}
                          <div className="flex items-center gap-2 pt-1">
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              <Clock size={10} />{" "}
                              {new Date(item.created_at).toLocaleDateString()}
                            </div>
                            <span className="text-slate-200">•</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Admin Entry
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(item.address)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
