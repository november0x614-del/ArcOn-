import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Check,
  AlertCircle,
  X,
  ShieldCheck,
  Ban,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { ViewState } from "../../types";
import { useApp } from "../../contexts/AppContext";
import { useStore } from "../../store/useStore";
import { OverviewTab } from "../admin/OverviewTab";
import { UsersTab } from "../admin/UsersTab";
import { TreasuryTab } from "../admin/TreasuryTab";
import { ConfigTab } from "../admin/ConfigTab";
import { DesignTab } from "../admin/DesignTab";

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

type TabType = "overview" | "users" | "treasury" | "config" | "design";

export function AdminDashboardScreen({
  onBack,
}: {
  onBack: () => void;
  onNavigate?: (view: ViewState) => void;
}) {
  const {
    registeredUser,
    platformConfig,
    setPlatformConfig,
    fetchPlatformConfig,
  } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);

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

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchConfigData = useCallback(async () => {
    try {
      await fetchPlatformConfig();
      // After sync, use the store value
      const data = useStore.getState().platformConfig;
      if (data) {
        setSwapFeeInput(data.swapFee);
        setWithdrawFeeInput(data.withdrawFee);
        setBridgeFeeInput(data.bridgeFee);
        setDailyTransferLimitInput(data.dailyTransferLimit || "5000.00 USDC");
      }
    } catch (err) {
      console.error(err);
    }
  }, [fetchPlatformConfig]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "overview") await fetchStats();
      if (activeTab === "users") await fetchUsers();
      if (activeTab === "treasury") {
        await fetchStats();
        await fetchConfigData();
      }
      if (activeTab === "config") {
        await fetchConfigData();
      }
    } catch (err: any) {
      setError("Failed to fetch administration stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleToggleBlock = async (
    userId: string,
    isBlockedNow: boolean,
  ): Promise<boolean> => {
    setActionLoading(userId);
    setError(null);
    try {
      const response = await fetch("/api/admin/users/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, block: !isBlockedNow }),
      });

      if (response.ok) {
        setSuccessMsg(
          `User successfully ${!isBlockedNow ? "blocked" : "unblocked"}.`,
        );
        setTimeout(() => setSuccessMsg(null), 4000);
        await fetchUsers();
        return true;
      }
      return false;
    } catch (err: any) {
      setError("Auth cluster failure.");
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (
    userId: string,
    userEmail: string,
  ): Promise<boolean> => {
    setActionLoading(userId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setSuccessMsg(`User ${userEmail} archived.`);
        setTimeout(() => setSuccessMsg(null), 4000);
        fetchData();
        return true;
      }
      return false;
    } catch (err: any) {
      setError("Database server failure.");
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveConfig = async (updatedFields: Partial<AdminConfig>) => {
    if (!platformConfig) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...platformConfig, ...updatedFields }),
      });
      if (response.ok) {
        const resData = await response.json();
        setPlatformConfig(resData.config);
        setSuccessMsg("Config applied.");
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err: any) {
      setError("Config write failure.");
    } finally {
      setSaving(false);
    }
  };

  const handleRetheme = async (type: "colors" | "headers") => {
    setSaving(true);
    setError(null);
    try {
      const endpoint =
        type === "colors"
          ? "/api/admin/design/retheme-colors"
          : "/api/admin/design/retheme-headers";
      const response = await fetch(endpoint, { method: "POST" });
      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(data.message);
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (err: any) {
      setError("Retheme error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#f8f9fa] relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      <header className="bg-slate-900 text-white pt-6 pb-4 px-4 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[17px] font-bold flex items-center gap-2">
              <ShieldCheck
                size={18}
                className="text-emerald-400 animate-pulse"
              />
              Admin Portal
            </h1>
            <span className="text-[11px] font-medium text-slate-400">
              Arc Commerce Synchronized Real-Time Backend
            </span>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 bg-slate-800 rounded-xl text-slate-300 hover:text-white disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      <div className="bg-white border-b border-slate-200 px-4 py-2 shrink-0 flex gap-4 overflow-x-auto scrollbar-hide text-[13px] font-semibold">
        {[
          { id: "overview", label: "Overview" },
          { id: "users", label: "Users" },
          { id: "treasury", label: "Treasury" },
          { id: "config", label: "Platform Config" },
          { id: "design", label: "Design & Theme" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`pb-2 relative whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 rounded-t-full"></div>
            )}
          </button>
        ))}
      </div>

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

      <div className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto pb-8">
        {activeTab === "overview" && (
          <OverviewTab stats={stats} loading={loading} />
        )}
        {activeTab === "users" && (
          <UsersTab
            users={users}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectUser={setSelectedUser}
          />
        )}
        {activeTab === "treasury" && (
          <TreasuryTab
            loading={loading}
            treasuryBalance={stats?.treasuryBalance || "0.00 USDC"}
          />
        )}
        {activeTab === "config" && (
          <ConfigTab
            config={platformConfig}
            loading={loading}
            saving={saving}
            swapFeeInput={swapFeeInput}
            setSwapFeeInput={setSwapFeeInput}
            withdrawFeeInput={withdrawFeeInput}
            setWithdrawFeeInput={setWithdrawFeeInput}
            bridgeFeeInput={bridgeFeeInput}
            setBridgeFeeInput={setBridgeFeeInput}
            dailyTransferLimitInput={dailyTransferLimitInput}
            setDailyTransferLimitInput={setDailyTransferLimitInput}
            onSave={handleSaveConfig}
          />
        )}
        {activeTab === "design" && (
          <DesignTab saving={saving} onRetheme={handleRetheme} />
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-amber-400" />
                <h2 className="font-bold text-[15px]">Account Terminal</h2>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-[14px] font-bold text-slate-800">
                  {selectedUser.name}
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  {selectedUser.email}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-2 break-all bg-white p-2 rounded-lg border border-slate-100">
                  {selectedUser.wallet}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() =>
                    handleToggleBlock(
                      selectedUser.id,
                      selectedUser.status === "Blocked",
                    )
                  }
                  disabled={!!actionLoading}
                  className={`py-3.5 rounded-2xl font-bold text-[13px] transition-all flex items-center justify-center gap-2 ${
                    selectedUser.status === "Blocked"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {actionLoading === selectedUser.id ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : selectedUser.status === "Blocked" ? (
                    <ShieldCheck size={14} />
                  ) : (
                    <Ban size={14} />
                  )}
                  {selectedUser.status === "Blocked"
                    ? "Aktifkan User"
                    : "Blokir User"}
                </button>
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <p className="text-[11px] text-red-600 font-bold mb-2 uppercase tracking-tight">
                    Ketik DELETE untuk menghapus:
                  </p>
                  <input
                    type="text"
                    value={deleteValidation}
                    onChange={(e) => setDeleteValidation(e.target.value)}
                    className="w-full bg-white border border-red-200 rounded-xl px-3 py-2.5 text-[12px] font-bold outline-none mb-3"
                    placeholder="DELETE"
                  />
                  <button
                    disabled={deleteValidation !== "DELETE" || !!actionLoading}
                    onClick={() =>
                      handleDeleteUser(selectedUser.id, selectedUser.email)
                    }
                    className="w-full py-3 bg-red-600 text-white rounded-xl text-[13px] font-bold disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    {actionLoading === selectedUser.id ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Arsipkan Akun
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
