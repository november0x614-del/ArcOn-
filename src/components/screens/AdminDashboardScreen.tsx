import React, { useState, useEffect } from "react";
import { ArrowLeft, Users, CircleDollarSign, Search, Settings2, Activity, ShieldCheck, RefreshCw, Check, AlertCircle, Ban, Unlock, Trash2, ChevronRight, X, ShieldAlert } from "lucide-react";
import { ViewState } from "../../types";

interface AdminStats {
  totalUsers: number;
  totalVolume: string;
  treasuryBalance: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  wallet: string;
  walletId: string;
  createdAt: string;
  status: string;
}

interface AdminConfig {
  swapFee: string;
  withdrawFee: string;
  bridgeFee: string;
  dailyTransferLimit: string;
  gasSubsidyEnabled: boolean;

  transferEnabled: boolean;
  withdrawEnabled: boolean;
  swapEnabled: boolean;
  stableStakeEnabled: boolean;
  bridgeEnabled: boolean;
  faucetEnabled: boolean;
  batchTransferEnabled: boolean;

  ecommerceEnabled: boolean;
  merchantEnabled: boolean;
  vaEnabled: boolean;
  qrisEnabled: boolean;
  scanQrEnabled: boolean;

  registrationEnabled: boolean;
  aiAgentEnabled: boolean;
  eWalletConnectionEnabled: boolean;
  arcBirdEnabled: boolean;
  backupPhraseEnabled: boolean;
}

export function AdminDashboardScreen({
  onBack,
}: {
  onBack: () => void;
  onNavigate?: (view: ViewState) => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'treasury' | 'config'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [config, setConfig] = useState<AdminConfig | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [deleteValidation, setDeleteValidation] = useState("");

  // Config form state
  const [swapFeeInput, setSwapFeeInput] = useState("");
  const [withdrawFeeInput, setWithdrawFeeInput] = useState("");
  const [bridgeFeeInput, setBridgeFeeInput] = useState("");
  const [dailyTransferLimitInput, setDailyTransferLimitInput] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Stats
      const statsRes = await fetch("/api/admin/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch Users
      const usersRes = await fetch("/api/admin/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      // 3. Fetch Config
      const configRes = await fetch("/api/admin/config");
      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
        setSwapFeeInput(configData.swapFee);
        setWithdrawFeeInput(configData.withdrawFee);
        setBridgeFeeInput(configData.bridgeFee);
        setDailyTransferLimitInput(configData.dailyTransferLimit || "5000.00 USDC");
      }
    } catch (err: any) {
      console.error("Error loading admin dashboard: ", err);
      setError("Failed to fetch real-time administration stats from API server.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (userId: string, isBlockedNow: boolean): Promise<boolean> => {
    setActionLoading(userId);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await fetch("/api/admin/users/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, block: !isBlockedNow })
      });

      if (response.ok) {
        const actionText = !isBlockedNow ? "dinonaktifkan (Status: Tidak Aktif / Diblokir)" : "diaktifkan kembali (Status: Aktif)";
        setSuccessMsg(`Akun pengguna berhasil ${actionText}. Perubahan langsung diterapkan ke database.`);
        setTimeout(() => setSuccessMsg(null), 4000);
        // Refresh users list
        const usersRes = await fetch("/api/admin/users");
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Gagal memperbarui status blokir pengguna.");
        return false;
      }
    } catch (err: any) {
      setError("Gagal terhubung ke modul otentikasi database.");
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string): Promise<boolean> => {
    setActionLoading(userId);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setSuccessMsg(`Akun pengguna ${userEmail} beserta seluruh data dompet dan ledger transaksi berhasil dihapus permanen dari Supabase.`);
        setTimeout(() => setSuccessMsg(null), 4000);
        
        // Refresh states
        fetchData();
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Gagal menghapus pengguna dari kluster database.");
        return false;
      }
    } catch (err: any) {
      setError("Gagal menghubungi server database.");
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveConfig = async (updatedFields: Partial<AdminConfig>) => {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const mergedConfig = { ...config, ...updatedFields };
      const response = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mergedConfig)
      });
      if (response.ok) {
        const resData = await response.json();
        setConfig(resData.config);
        setSuccessMsg("Configuration successfully applied and live on Testnet.");
        setTimeout(() => setSuccessMsg(null), 3500);
      } else {
        setError("Could not parse configuration updates on core API node.");
      }
    } catch (err: any) {
      setError("Could not establish connection to write configurations.");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.wallet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full bg-[#f8f9fa] relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="bg-slate-900 text-white pt-6 pb-4 px-4 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-800 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[17px] font-bold flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400 animate-pulse" />
              Admin Portal
            </h1>
            <span className="text-[11px] font-medium text-slate-400">Arc Commerce Synchronized Real-Time Backend</span>
          </div>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="p-2 bg-slate-800 rounded-xl text-slate-300 hover:text-white disabled:opacity-50 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 shrink-0 flex gap-4 overflow-x-auto scrollbar-hide text-[13px] font-semibold">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'users', label: 'Users' },
          { id: 'treasury', label: 'Treasury' },
          { id: 'config', label: 'Platform Config' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2 relative whitespace-nowrap transition-colors ${
              activeTab === tab.id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 rounded-t-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Notifications */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-[12px] font-medium">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="mx-4 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-600 text-[12px] font-medium">
          <Check size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto pb-8">
        
        {activeTab === 'overview' && (
          <div className="p-4 space-y-4">
            {/* Stats Grid */}
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

            {/* System Status */}
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
        )}

        {activeTab === 'users' && (
          <div className="p-4 space-y-4">
            <div className="bg-white border text-[13px] border-slate-200 rounded-xl px-3 py-2.5 flex items-center gap-2 focus-within:border-slate-800 transition-colors shadow-sm">
               <Search size={16} className="text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search users by email or address..." 
                 className="bg-transparent flex-1 outline-none font-medium placeholder:text-slate-400 text-slate-700" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                 <span>Account Details</span>
                 <span>Network Status</span>
               </div>
               
               {loading && users.length === 0 ? (
                 <div className="text-center py-8 text-[13px] text-slate-500 font-medium">
                   Retrieving user wallets directly from database cluster...
                 </div>
               ) : filteredUsers.length === 0 ? (
                 <div className="text-center py-8 text-[13px] text-slate-500 font-medium">
                   No users matching query.
                 </div>
               ) : (
                 filteredUsers.map((u, i) => (
                   <div 
                     key={i} 
                     onClick={() => {
                       if (u.id !== "00000000-0000-0000-0000-000000000000") {
                         setSelectedUser(u);
                         setDeleteValidation("");
                       }
                     }}
                     className={`px-4 py-3.5 border-b border-slate-50 flex justify-between items-center transition-colors ${
                       u.id !== "00000000-0000-0000-0000-000000000000" 
                         ? 'cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/50' 
                         : ''
                     }`}
                   >
                     <div className="flex flex-col min-w-0 flex-1 pr-4">
                       <span className="font-bold text-[14px] text-slate-800 tracking-tight leading-none mb-1">
                         {u.name}
                       </span>
                       <span className="text-[11px] text-slate-500 font-medium font-mono truncate">
                         {u.email}
                       </span>
                       <span className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                         Wallet Address: {u.wallet}
                       </span>
                     </div>
                     <div className="shrink-0 flex items-center gap-2">
                       <span className="hidden sm:inline px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                         {u.id.substring(0, 8)}...
                       </span>
                       <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.status === 'Blocked' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                         {u.status === 'Archived' ? 'Terarsipkan' : u.status === 'Blocked' ? 'Tidak Aktif' : 'Aktif'}
                       </span>
                       {u.id !== "00000000-0000-0000-0000-000000000000" ? (
                         <div className="flex items-center gap-1 text-slate-400 ml-1.5 bg-slate-50 border border-slate-100 px-2 py-1 rounded-xl group-hover:text-slate-800 transition-colors">
                           <span className="text-[11px] font-bold text-slate-500">Kelola</span>
                           <ChevronRight size={13} />
                         </div>
                       ) : (
                         <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-100/60 border border-slate-200/50 px-2 py-1 rounded-lg ml-1.5">
                           Platform Admin
                         </span>
                       )}
                     </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        )}

        {activeTab === 'treasury' && (
          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden border border-slate-800">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
               <span className="text-slate-400 font-medium text-[12px] flex items-center gap-1 uppercase tracking-wider">Treasury Balance (USDC)</span>
               <div className="text-3xl font-[900] tracking-tight mt-1.5 mb-4 text-[#00E676]">
                 {loading && !stats ? "..." : stats?.treasuryBalance ?? "0.00 USDC"}
               </div>
               <div className="flex gap-2 relative z-10">
                 <a 
                   href="https://explorer.testnet.arc.network" 
                   target="_blank" 
                   rel="noreferrer"
                   className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-[12px] font-bold px-4 py-2 rounded-xl text-center active:scale-95 transition-transform"
                 >
                   View on Explorer
                 </a>
               </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="px-4 py-4 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-bold text-[14px] text-slate-800">Admin Fee Settings</h3>
                 <Settings2 size={16} className="text-slate-400" />
              </div>
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center pt-1">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-slate-800">Swap Fee</span>
                    <span className="text-[11px] text-slate-500">Collected per trade</span>
                  </div>
                  <input 
                    type="text" 
                    value={swapFeeInput} 
                    onChange={(e) => setSwapFeeInput(e.target.value)}
                    className="w-24 bg-slate-50 border border-slate-200 text-right text-slate-800 font-mono font-bold text-[13px] px-3 py-1.5 rounded-lg outline-none focus:border-slate-800"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-slate-800">Transfer/Send Fee</span>
                    <span className="text-[11px] text-slate-500">Standard user transfers</span>
                  </div>
                  <input 
                    type="text" 
                    value={withdrawFeeInput} 
                    onChange={(e) => setWithdrawFeeInput(e.target.value)}
                    className="w-24 bg-slate-50 border border-slate-200 text-right text-slate-800 font-mono font-bold text-[13px] px-3 py-1.5 rounded-lg outline-none focus:border-slate-800"
                  />
                </div>
                <div className="flex justify-between items-center pb-2">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-slate-800">CCTP Bridge Fee</span>
                    <span className="text-[11px] text-slate-500">Cross-chain fee</span>
                  </div>
                  <input 
                    type="text" 
                    value={bridgeFeeInput} 
                    onChange={(e) => setBridgeFeeInput(e.target.value)}
                    className="w-24 bg-slate-50 border border-slate-200 text-right text-slate-800 font-mono font-bold text-[13px] px-3 py-1.5 rounded-lg outline-none focus:border-slate-800"
                  />
                </div>
                <button 
                  onClick={() => handleSaveConfig({ swapFee: swapFeeInput, withdrawFee: withdrawFeeInput, bridgeFee: bridgeFeeInput })}
                  disabled={saving || loading}
                  className="w-full mt-2 bg-slate-900 text-white font-bold text-[13px] py-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center"
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'config' && config && (
          <div className="p-4 space-y-6">
             {/* Category 1: Biaya & Batasan Transaksi */}
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-slate-800">
                      <Settings2 size={15} className="text-slate-600 animate-none" />
                      <h3 className="font-bold text-[11px] uppercase tracking-wider">Biaya & Batasan Transaksi</h3>
                   </div>
                   <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-extrabold uppercase">Limits</span>
                </div>
                <div className="p-4 space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-[11px] font-bold text-slate-700">Swap Fee (%)</label>
                         <input 
                            type="text" 
                            value={swapFeeInput} 
                            onChange={(e) => setSwapFeeInput(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-mono font-bold text-[12px] px-3 py-2 rounded-xl outline-none focus:border-slate-800"
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[11px] font-bold text-slate-700">Send / Transfer Fee</label>
                         <input 
                            type="text" 
                            value={withdrawFeeInput} 
                            onChange={(e) => setWithdrawFeeInput(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-mono font-bold text-[12px] px-3 py-2 rounded-xl outline-none focus:border-slate-800"
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[11px] font-bold text-slate-700">CCTP Bridge Fee</label>
                         <input 
                            type="text" 
                            value={bridgeFeeInput} 
                            onChange={(e) => setBridgeFeeInput(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-mono font-bold text-[12px] px-3 py-2 rounded-xl outline-none focus:border-slate-800"
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[11px] font-bold text-slate-700">Limit Transfer Harian</label>
                         <input 
                            type="text" 
                            value={dailyTransferLimitInput} 
                            onChange={(e) => setDailyTransferLimitInput(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-mono font-bold text-[12px] px-3 py-2 rounded-xl outline-none focus:border-slate-800"
                         />
                      </div>
                   </div>

                   <div className="flex justify-between items-center py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100 mt-2">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-slate-800">Subsidi Gas Platform</span>
                        <span className="text-[10px] text-slate-500">Bebaskan potongan USDC gas fee native untuk transaksi pengguna</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleSaveConfig({ gasSubsidyEnabled: !config.gasSubsidyEnabled })}
                        className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${config.gasSubsidyEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${config.gasSubsidyEnabled ? 'right-1' : 'left-1'}`}></span>
                      </button>
                   </div>

                   <button 
                     onClick={() => handleSaveConfig({ 
                       swapFee: swapFeeInput, 
                       withdrawFee: withdrawFeeInput, 
                       bridgeFee: bridgeFeeInput,
                       dailyTransferLimit: dailyTransferLimitInput
                     })}
                     disabled={saving || loading}
                     className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[12.5px] py-2.5 rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
                   >
                     {saving ? "Menyimpan Batas & Biaya..." : "Simpan Batas & Biaya"}
                   </button>
                </div>
             </div>

             {/* Category 2: Akses Layanan Utama */}
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-slate-800">
                      <CircleDollarSign size={15} className="text-slate-600" />
                      <h3 className="font-bold text-[11px] uppercase tracking-wider">Akses Layanan Finansial Utama</h3>
                   </div>
                   <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full font-extrabold uppercase">Layanan</span>
                </div>
                <div className="p-4 divide-y divide-slate-100">
                   {[
                     { field: 'transferEnabled', label: 'Fitur Kirim Saldo (Transfer)', desc: 'Tombol kirim & transfer instan USDC antarpengguna' },
                     { field: 'withdrawEnabled', label: 'Fitur Tarik Saldo (Withdraw)', desc: 'Ekspor USDC keluar dari wallet ke bursa atau alamat lain' },
                     { field: 'swapEnabled', label: 'Fitur Swap Token USDC', desc: 'Konversi dan penukaran pool token multi-aset di Arc' },
                     { field: 'stableStakeEnabled', label: 'Fitur StableStake Deposit', desc: 'Akses instrumen staking penghasil yield USDC di testnet' },
                     { field: 'bridgeEnabled', label: 'Fitur CCTP Bridge Lintas Rantai', desc: 'Membakar & mencetak USDC di Arbitrum/Ethereum ke Arc' },
                     { field: 'faucetEnabled', label: 'Fitur Keran Saldo (Faucet)', desc: 'Klaim token gas mingguan gratis untuk kebutuhan uji coba' },
                     { field: 'batchTransferEnabled', label: 'Fitur Transfer Massal (Batch)', desc: 'Kirim USDC multi-tujuan dalam satu transaksi tunggal' },
                   ].map((item) => (
                     <div key={item.field} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                        <div className="flex flex-col pr-4">
                           <span className="text-[12px] font-extrabold text-slate-800 leading-tight">{item.label}</span>
                           <span className="text-[10px] text-slate-500 mt-0.5">{item.desc}</span>
                        </div>
                        <button 
                           type="button"
                           onClick={() => handleSaveConfig({ [item.field]: !config[item.field as keyof AdminConfig] })}
                           className={`w-10 h-6 rounded-full relative shrink-0 transition-colors cursor-pointer ${config[item.field as keyof AdminConfig] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                           <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${config[item.field as keyof AdminConfig] ? 'right-1' : 'left-1'}`}></span>
                        </button>
                     </div>
                   ))}
                </div>
             </div>

             {/* Category 3: E-commerce & Pembayaran QR */}
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-slate-800">
                      <Activity size={15} className="text-slate-600" />
                      <h3 className="font-bold text-[11px] uppercase tracking-wider">Modul E-Commerce & Merchant</h3>
                   </div>
                   <span className="text-[10px] bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-full font-extrabold uppercase">Pembayaran</span>
                </div>
                <div className="p-4 divide-y divide-slate-100">
                   {[
                     { field: 'ecommerceEnabled', label: 'Modul Marketplace E-Commerce', desc: 'Platform belanja produk fisik/kredit di dalam aplikasi' },
                     { field: 'merchantEnabled', label: 'Modul Kasir F&B Merchant', desc: 'Sistem merchant point of sales untuk gerai merchant terdaftar' },
                     { field: 'vaEnabled', label: 'Pembayaran Virtual Account', desc: 'Kombinasi VA dinamis terverifikasi instan' },
                     { field: 'qrisEnabled', label: 'Generator Kode QRIS', desc: 'Pembuatan kode QR standard nasional untuk deposit saldo' },
                     { field: 'scanQrEnabled', label: 'Pemindai Kode QR (Scan)', desc: 'Tombol kamera scanner untuk scan qr invoice & wallet' },
                   ].map((item) => (
                     <div key={item.field} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                        <div className="flex flex-col pr-4">
                           <span className="text-[12px] font-extrabold text-slate-800 leading-tight">{item.label}</span>
                           <span className="text-[10px] text-slate-500 mt-0.5">{item.desc}</span>
                        </div>
                        <button 
                           type="button"
                           onClick={() => handleSaveConfig({ [item.field]: !config[item.field as keyof AdminConfig] })}
                           className={`w-10 h-6 rounded-full relative shrink-0 transition-colors cursor-pointer ${config[item.field as keyof AdminConfig] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                           <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${config[item.field as keyof AdminConfig] ? 'right-1' : 'left-1'}`}></span>
                        </button>
                     </div>
                   ))}
                </div>
             </div>

             {/* Category 4: Integrasi & Keamanan */}
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-slate-800">
                      <ShieldCheck size={15} className="text-slate-600" />
                      <h3 className="font-bold text-[11px] uppercase tracking-wider">Koneksi Eksternal & Keamanan</h3>
                   </div>
                   <span className="text-[10px] bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full font-extrabold uppercase">Keamanan</span>
                </div>
                <div className="p-4 divide-y divide-slate-100">
                   {[
                     { field: 'registrationEnabled', label: 'Registrasi Pengguna Baru', desc: 'Mengizinkan pembuatan akun & alamat dompet baru di platform ini' },
                     { field: 'aiAgentEnabled', label: 'AI Agent Co-Pilot (Asisten)', desc: 'Layanan konsultasi keuangan saku berbasis AI kognitif' },
                     { field: 'eWalletConnectionEnabled', label: 'Integrasi e-Wallet GrabPay / GoPay', desc: 'Klaim jembatan transfer saldo virtual dengan akun dompet digital lokal' },
                     { field: 'arcBirdEnabled', label: 'Permainan Arc Bird Mini-Game', desc: 'Fitur hobi game flappy bird terintegrasi turnamen leaderboard' },
                     { field: 'backupPhraseEnabled', label: 'Ekspor Kunci / Cadangkan Kunci', desc: 'Izinkan ekspor phrase pengaman dompet circle langsung oleh user' },
                   ].map((item) => (
                     <div key={item.field} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                        <div className="flex flex-col pr-4">
                           <span className="text-[12px] font-extrabold text-slate-800 leading-tight">{item.label}</span>
                           <span className="text-[10px] text-slate-500 mt-0.5">{item.desc}</span>
                        </div>
                        <button 
                           type="button"
                           onClick={() => handleSaveConfig({ [item.field]: !config[item.field as keyof AdminConfig] })}
                           className={`w-10 h-6 rounded-full relative shrink-0 transition-colors cursor-pointer ${config[item.field as keyof AdminConfig] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                           <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${config[item.field as keyof AdminConfig] ? 'right-1' : 'left-1'}`}></span>
                        </button>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

      </div>

      {/* User Management Confirmation Modal with Strict Verification */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-amber-400" />
                <h2 className="font-bold text-[15px] tracking-tight">Pusat Administrasi Pengguna</h2>
              </div>
              <button 
                onClick={() => setSelectedUser(null)} 
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1 text-slate-700">
              
              {/* User Identity Details */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Identitas Supabase DB</span>
                <div className="text-[14px] font-bold text-slate-800 mb-0.5">{selectedUser.name}</div>
                <div className="text-[11.5px] font-mono text-slate-500 mb-2 truncate">{selectedUser.email}</div>
                
                <div className="h-px bg-slate-200/60 my-2"></div>
                
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5 mt-2">Alamat Dompet USDC (Arc L1)</span>
                <div className="text-[11px] font-mono text-slate-600 truncate bg-slate-100 p-1.5 rounded-lg select-all border border-slate-200">
                  {selectedUser.wallet}
                </div>
                <div className="text-[10.5px] text-slate-500 mt-2 flex items-center gap-1.5">
                  Status Akun Saat Ini: 
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    selectedUser.status === 'Archived' 
                      ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                      : selectedUser.status === 'Blocked' 
                        ? 'bg-red-50 text-red-600 border border-red-100' 
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    {selectedUser.status === 'Archived' ? 'Terarsipkan (Dihapus)' : selectedUser.status === 'Blocked' ? 'Tidak Aktif' : 'Aktif'}
                  </span>
                </div>
              </div>

              {/* Action 1: Block/Unblock */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col space-y-3">
                <div className="flex gap-2.5 items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    selectedUser.status === 'Archived'
                      ? 'bg-amber-50 text-amber-600 border border-amber-100/50'
                      : selectedUser.status === 'Blocked' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' 
                        : 'bg-amber-50 text-amber-600 border border-amber-150'
                  }`}>
                    {selectedUser.status === 'Archived' ? <Ban size={16} /> : selectedUser.status === 'Blocked' ? <Unlock size={16} /> : <Ban size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[13px] text-slate-800">
                      {selectedUser.status === 'Archived' 
                        ? 'Pembekuan Arsip Berfungsi'
                        : selectedUser.status === 'Blocked' 
                          ? 'Aktifkan Kembali Pengguna' 
                          : 'Tangguhkan / Blokir Pengguna'}
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                      {selectedUser.status === 'Archived'
                        ? 'Akun telah diarsipkan secara permanen. Status dibekukan sepenuhnya untuk menjaga keamanan ledger ledger audit.'
                        : selectedUser.status === 'Blocked' 
                          ? 'Membuka blokir akun ini sehingga pengguna dapat kembali memproses transfer, swap, jembatan CCTP, dan transaksi dagang.' 
                          : 'Menolak dan mengunci seluruh aktivitas API & on-chain Dompet Circle milik pengguna ini di ekosistem platform.'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={async () => {
                    if (selectedUser.status === 'Archived') return;
                    const success = await handleToggleBlock(selectedUser.id, selectedUser.status === 'Blocked');
                    if (success) {
                      setSelectedUser(null);
                    }
                  }}
                  disabled={selectedUser.status === 'Archived' || actionLoading === selectedUser.id}
                  className={`w-full py-2.5 rounded-xl text-[12px] font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedUser.status === 'Archived'
                      ? "bg-slate-100 text-slate-400 border border-slate-200/50 cursor-not-allowed"
                      : selectedUser.status === 'Blocked'
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-amber-500 hover:bg-amber-600 text-white"
                  }`}
                >
                  {actionLoading === selectedUser.id ? (
                    <span className="flex items-center gap-1.5 justify-center">
                      <RefreshCw className="animate-spin" size={13} />
                      <span>Memproses Sinkronisasi...</span>
                    </span>
                  ) : (
                    <>
                      {selectedUser.status === 'Archived' ? (
                        <>
                          <Ban size={14} />
                          <span>Status Terkunci (Diarsipkan)</span>
                        </>
                      ) : selectedUser.status === 'Blocked' ? (
                        <>
                          <Unlock size={14} />
                          <span>Buka Blokir Sekarang</span>
                        </>
                      ) : (
                        <>
                          <Ban size={14} />
                          <span>Blokir Akun ini</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>

               {/* Action 2: Archive / Soft-Delete (Danger Zone) */}
              <div className="bg-red-50/40 border border-red-100 rounded-2xl p-4 shadow-sm flex flex-col space-y-3">
                <div className="flex gap-2.5 items-start">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Trash2 size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[13px] text-red-800">
                      {selectedUser.status === 'Archived' ? 'Akun Telah Diarsipkan' : 'Zona Bahaya: Arsipkan Pengguna (Soft-Delete)'}
                    </h3>
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                      {selectedUser.status === 'Archived'
                        ? 'Pengguna ini telah dinonaktifkan secara permanen. Semua data histori, ledger transaksi USDC, dan balance tetap dipertahankan utuh.'
                        : 'Menonaktifkan otentikasi pengguna secara permanen, namun TETAP MEMPERTAHANKAN seluruh ledger transaksi, detail dompet, dan histori saldo di Supabase untuk kebutuhan audit historis.'}
                    </p>
                  </div>
                </div>

                {selectedUser.status !== 'Archived' ? (
                  <>
                     <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-extrabold text-red-700 uppercase tracking-wider block">
                          Konfirmasi Arsip Akun:
                        </label>
                        <button 
                          type="button"
                          onClick={() => setDeleteValidation(selectedUser.email)}
                          className="text-[10px] font-bold text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 px-2 py-0.5 rounded transition-all cursor-pointer"
                        >
                          Isi Otomatis Email
                        </button>
                      </div>
                      <input 
                        type="text"
                        placeholder={`Ketik "${selectedUser.email}" atau "HAPUS"`}
                        value={deleteValidation}
                        onChange={(e) => setDeleteValidation(e.target.value)}
                        className="w-full bg-white border border-red-200 rounded-xl px-3 py-1.5 font-mono text-[11px] outline-none focus:border-red-500 text-slate-700 animate-none"
                      />
                      <p className="text-[9.5px] text-slate-500 leading-tight">
                        *Ketik <span className="font-bold text-slate-700">HAPUS</span> atau email pengguna di atas untuk mengaktifkan tombol.
                      </p>
                    </div>

                    <button
                      onClick={async () => {
                        const isMatched = 
                          deleteValidation.trim().toLowerCase() === selectedUser.email.toLowerCase() ||
                          deleteValidation.trim().toUpperCase() === "HAPUS" ||
                          deleteValidation.trim().toUpperCase() === "DELETE";

                        if (isMatched) {
                          const success = await handleDeleteUser(selectedUser.id, selectedUser.email);
                          if (success) {
                            setSelectedUser(null);
                          }
                        }
                      }}
                      disabled={
                        !(
                          deleteValidation.trim().toLowerCase() === selectedUser.email.toLowerCase() ||
                          deleteValidation.trim().toUpperCase() === "HAPUS" ||
                          deleteValidation.trim().toUpperCase() === "DELETE"
                        ) || actionLoading === selectedUser.id
                      }
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-[12px] font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {actionLoading === selectedUser.id ? (
                        <span className="flex items-center gap-1.5 justify-center">
                          <RefreshCw className="animate-spin" size={13} />
                          <span>Mengarsipkan...</span>
                        </span>
                      ) : (
                        <>
                          <Trash2 size={14} />
                          <span>Arsip & Nonaktifkan Pengguna</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="bg-amber-50/50 border border-amber-200 text-amber-800 text-[11px] p-2.5 rounded-xl text-center font-medium leading-relaxed">
                    ⚙️ Seluruh rekaman akun, kunci database, wallet mapping ({selectedUser.walletId.substring(0, 10)}...), ledger balance, dan logs di blockchain Arc Testnet telah di-seal dan aman untuk pelaporan kepatuhan audit.
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
