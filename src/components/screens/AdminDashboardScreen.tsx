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
  ShieldOff,
  LayoutDashboard,
  Users,
  Wallet,
  Settings,
  ChevronRight,
  Menu,
  Zap,
  ShoppingCart,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ViewState } from "../../types";
import { useApp } from "../../contexts/AppContext";
import { useStore } from "../../store/useStore";
import { OverviewTab } from "../admin/OverviewTab";
import { UsersTab } from "../admin/UsersTab";
import { TreasuryTab } from "../admin/TreasuryTab";
import { ConfigTab } from "../admin/ConfigTab";
import { DesignTab } from "../admin/DesignTab";
import { InfrastructureTab } from "../admin/InfrastructureTab";
import { ComplianceTab } from "../admin/ComplianceTab";
import { EcommerceAdminTab } from "../admin/EcommerceAdminTab";
import { OtcReconciliationTab } from "../admin/OtcReconciliationTab";
import { TreasuryMonitoringTab } from "../admin/TreasuryMonitoringTab";

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
  useLoungeHubEscrow: boolean;
  loungeHubContractAddress: string;
  minTransferAmount: string;
  minSwapAmount: string;
  minBridgeAmount: string;
  batchBaseFee: string;
  batchPerRecipientFee: string;
  treasuryWalletAddress: string;
}

type TabType =
  | "overview"
  | "users"
  | "ledger"
  | "infra"
  | "compliance"
  | "ecommerce"
  | "otc"
  | "treasury"
  | "settings";

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
  const [systemTransactions, setSystemTransactions] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [selectedUserWallet, setSelectedUserWallet] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userModalTab, setUserModalTab] = useState<
    "identity" | "wallet" | "activity"
  >("identity");
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [otcTransactions, setOtcTransactions] = useState<any[]>([]);
  const [deleteValidation, setDeleteValidation] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const handleVerifyPin = () => {
    // Dynamically check against the fetched platform configuration
    const correctPin = platformConfig?.adminPin || "123456";
    if (pinInput === correctPin) {
      setIsAdminAuthorized(true);
      setPinError(false);
      fetchData();
    } else {
      setPinError(true);
      setPinInput("");
      setTimeout(() => setPinError(false), 2000);
    }
  };

  // Config form state
  const [swapFeeInput, setSwapFeeInput] = useState("");
  const [bridgeFeeInput, setBridgeFeeInput] = useState("");
  const [dailyTransferLimitInput, setDailyTransferLimitInput] = useState("");
  const [minTransferAmountInput, setMinTransferAmountInput] = useState("");
  const [minSwapAmountInput, setMinSwapAmountInput] = useState("");
  const [minBridgeAmountInput, setMinBridgeAmountInput] = useState("");
  const [batchBaseFeeInput, setBatchBaseFeeInput] = useState("");
  const [batchPerRecipientFeeInput, setBatchPerRecipientFeeInput] = useState("");
  const [treasuryWalletInput, setTreasuryWalletInput] = useState("");
  const [adminPinInputConfig, setAdminPinInputConfig] = useState("");

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

  const fetchOtcTransactions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/otc/pending");
      if (res.ok) setOtcTransactions(await res.json());
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/transactions?limit=20");
      if (res.ok) setSystemTransactions(await res.json());
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchApprovals = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/approvals");
      if (res.ok) setPendingApprovals(await res.json());
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleDecideApproval = async (
    txId: string,
    decision: "approve" | "reject",
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/approvals/${txId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) {
        setSuccessMsg(
          `Transaction ${decision === "approve" ? "approved and executed" : "rejected"}.`,
        );
        await Promise.all([
          fetchApprovals(),
          fetchTransactions(),
          fetchStats(),
        ]);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to process approval decision.");
    } finally {
      setSaving(false);
    }
  };

  const fetchWalletDetails = async (userId: string) => {
    setLoadingWallet(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/wallet`);
      if (res.ok) setSelectedUserWallet(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWallet(false);
    }
  };

  const handleUpgradeWallet = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/upgrade`, {
        method: "POST",
      });
      if (res.ok) {
        setSuccessMsg("Wallet upgrade transaction initiated on Arc.");
        setTimeout(() => setSuccessMsg(null), 4000);
        await fetchWalletDetails(userId);
      }
    } catch (err) {
      console.error(err);
      setError("Upgrade failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const fetchConfigData = useCallback(async () => {
    try {
      await fetchPlatformConfig();
      // After sync, use the store value
      const data = useStore.getState().platformConfig;
      if (data) {
        setSwapFeeInput(data.swapFee);
        setBridgeFeeInput(data.bridgeFee);
        setDailyTransferLimitInput(data.dailyTransferLimit || "5000.00 USDC");
        setMinTransferAmountInput(data.minTransferAmount || "0.1");
        setMinSwapAmountInput(data.minSwapAmount || "0.1");
        setMinBridgeAmountInput(data.minBridgeAmount || "0.1");
        setBatchBaseFeeInput(data.batchBaseFee || "0.15 USDC");
        setBatchPerRecipientFeeInput(data.batchPerRecipientFee || "0.02 USDC");
        setTreasuryWalletInput(data.treasuryWalletAddress || "");
        setAdminPinInputConfig(data.adminPin || "123456");
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
      if (activeTab === "ledger") {
        await Promise.all([
          fetchStats(),
          fetchTransactions(),
          fetchApprovals(),
        ]);
      }
      if (activeTab === "otc") {
        await fetchOtcTransactions();
      }
      if (activeTab === "settings") {
        await fetchConfigData();
      }
    } catch (err: any) {
      setError("Failed to fetch administration stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformConfig();
  }, [fetchPlatformConfig]);

  useEffect(() => {
    if (isAdminAuthorized) {
      fetchData();
    }
  }, [activeTab, isAdminAuthorized]);

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

  const handleManualSweepUser = async (userId: string) => {
    setActionLoading("sweep-" + userId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/sweep-funds`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || "Manual sweep initiated successfully.");
        setTimeout(() => setSuccessMsg(null), 4500);
        await Promise.all([fetchWalletDetails(userId), fetchTransactions()]);
      } else {
        setError(data.error || "Failed to sweep funds.");
      }
    } catch (err: any) {
      setError("System connect error during sweep.");
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

  const navItems = [
    { id: "overview", label: "Command Center", icon: LayoutDashboard },
    { id: "users", label: "User & Security", icon: Users },
    { id: "ecommerce", label: "E-Commerce & Escrow", icon: ShoppingCart },
    { id: "otc", label: "OTC Reconciliation", icon: RefreshCw },
    { id: "treasury", label: "Treasury Monitor", icon: Wallet },
    { id: "ledger", label: "Financial Ledger", icon: Wallet },
    { id: "compliance", label: "Compliance & Sanctions", icon: ShieldOff },
    { id: "infra", label: "Infrastructure", icon: ShieldAlert },
    { id: "settings", label: "Global Settings", icon: Settings },
  ];

  return (
    <div className="w-full h-full bg-[#f8fafc] flex z-50 animate-in fade-in duration-500">
      {!isAdminAuthorized ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-900">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white rounded-[40px] p-10 shadow-2xl text-center"
          >
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-400">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">
              Security Challenge
            </h1>
            <p className="text-[13px] text-slate-400 font-medium mb-8">
              Enter the Master Administrative PIN to access the Command Center
            </p>

            <div className="flex justify-center gap-3 mb-8">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    pinInput.length > i
                      ? "bg-slate-900 scale-125"
                      : "bg-slate-100"
                  } ${pinError ? "bg-red-500 animate-bounce" : ""}`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() =>
                    pinInput.length < 6 && setPinInput((p) => p + num)
                  }
                  className="h-14 bg-slate-50 hover:bg-slate-100 rounded-2xl font-black text-xl text-slate-700 transition-all active:scale-90"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setPinInput("")}
                className="h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-100 transition-all active:scale-90"
              >
                <X size={20} />
              </button>
              <button
                onClick={() =>
                  pinInput.length < 6 && setPinInput((p) => p + "0")
                }
                className="h-14 bg-slate-50 hover:bg-slate-100 rounded-2xl font-black text-xl text-slate-700 transition-all active:scale-90"
              >
                0
              </button>
              <button
                onClick={handleVerifyPin}
                disabled={pinInput.length !== 6}
                className="h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-90 disabled:opacity-20"
              >
                <Check size={24} />
              </button>
            </div>

            <button
              onClick={onBack}
              className="text-[12px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancel and Return
            </button>
          </motion.div>
        </div>
      ) : (
        <>
          {/* SIDEBAR NAVIGATION */}
          <aside
            className={`${sidebarOpen ? "w-[260px]" : "w-0 md:w-[80px]"} bg-slate-900 h-full flex flex-col transition-all duration-300 relative overflow-hidden group shadow-2xl z-20`}
          >
            <div className="p-6 flex items-center justify-between">
              {sidebarOpen ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <ShieldCheck size={20} className="text-white" />
                  </div>
                  <span className="font-bold text-white text-[17px] tracking-tight">
                    Admin Portal
                  </span>
                </div>
              ) : (
                <div className="w-full flex justify-center">
                  <ShieldCheck size={24} className="text-emerald-400" />
                </div>
              )}
            </div>

            <nav className="flex-1 px-3 space-y-1.5 mt-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 group/nav ${
                    activeTab === item.id
                      ? "bg-white/10 text-white shadow-sm ring-1 ring-white/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon
                    size={20}
                    className={
                      activeTab === item.id
                        ? "text-emerald-400"
                        : "group-hover/nav:scale-110 transition-transform"
                    }
                  />
                  {sidebarOpen && (
                    <span className="text-[13.5px] font-semibold tracking-wide whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-white/5">
              <button
                onClick={onBack}
                className={`w-full flex items-center gap-3 px-3.5 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all`}
              >
                <ArrowLeft size={20} />
                {sidebarOpen && (
                  <span className="text-[13.5px] font-semibold">
                    Exit Portal
                  </span>
                )}
              </button>
            </div>
          </aside>

          {/* MAIN WORKSPACE Area */}
          <main className="flex-1 h-full flex flex-col min-w-0 bg-slate-50 relative">
            <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 md:block"
                >
                  <Menu size={20} />
                </button>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-800 tracking-tight capitalize">
                    {navItems.find((n) => n.id === activeTab)?.label}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Lounge Engine • Local Testnet Node active
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {loading && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full animate-pulse">
                    <RefreshCw
                      size={12}
                      className="animate-spin text-slate-500"
                    />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Syncing
                    </span>
                  </div>
                )}
                <button
                  onClick={fetchData}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm transition-all"
                >
                  <RefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                  />
                </button>
              </div>
            </header>

            {/* Dynamic Activity Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 w-full max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 text-[13px] font-semibold animate-in zoom-in-95">
                      <AlertCircle size={18} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  {successMsg && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-600 text-[13px] font-semibold animate-in zoom-in-95">
                      <Check size={18} className="shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

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
                  {activeTab === "ecommerce" && <EcommerceAdminTab />}
                  {activeTab === "otc" && (
                    <OtcReconciliationTab
                      pendingTxs={otcTransactions}
                      loading={loading}
                      onResolve={async (txId: string) => {
                        setSaving(true);
                        try {
                          const res = await fetch("/api/admin/otc/reconcile", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "x-admin-secret": process.env.ADMIN_SECRET || "" },
                            body: JSON.stringify({ txId, adminId: "11111111-1111-1111-1111-111111111111" }),
                          });
                          if (res.ok) {
                            setSuccessMsg("Reconciliation successful.");
                            fetchOtcTransactions();
                          }
                        } catch (err) {
                          console.error(err);
                          setError("Failed to reconcile transaction.");
                        } finally {
                          setSaving(false);
                        }
                      }}
                      saving={saving}
                    />
                  )}
                  {activeTab === "treasury" && <TreasuryMonitoringTab />}
                  {activeTab === "ledger" && (
                    <TreasuryTab
                      loading={loading}
                      treasuryBalance={stats?.treasuryBalance || "0.00 USDC"}
                      transactions={systemTransactions}
                      pendingApprovals={pendingApprovals}
                      onDecide={handleDecideApproval}
                      saving={saving}
                    />
                  )}
                  {activeTab === "compliance" && <ComplianceTab />}
                  {activeTab === "infra" && <InfrastructureTab />}
                  {activeTab === "settings" && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                      <ConfigTab
                        config={platformConfig}
                        loading={loading}
                        saving={saving}
                        swapFeeInput={swapFeeInput}
                        setSwapFeeInput={setSwapFeeInput}
                        bridgeFeeInput={bridgeFeeInput}
                        setBridgeFeeInput={setBridgeFeeInput}
                        dailyTransferLimitInput={dailyTransferLimitInput}
                        setDailyTransferLimitInput={setDailyTransferLimitInput}
                        minTransferAmountInput={minTransferAmountInput}
                        setMinTransferAmountInput={setMinTransferAmountInput}
                        minSwapAmountInput={minSwapAmountInput}
                        setMinSwapAmountInput={setMinSwapAmountInput}
                        minBridgeAmountInput={minBridgeAmountInput}
                        setMinBridgeAmountInput={setMinBridgeAmountInput}
                        batchBaseFeeInput={batchBaseFeeInput}
                        setBatchBaseFeeInput={setBatchBaseFeeInput}
                        batchPerRecipientFeeInput={batchPerRecipientFeeInput}
                        setBatchPerRecipientFeeInput={setBatchPerRecipientFeeInput}
                        treasuryWalletInput={treasuryWalletInput}
                        setTreasuryWalletInput={setTreasuryWalletInput}
                        adminPinInput={adminPinInputConfig}
                        setAdminPinInput={setAdminPinInputConfig}
                        onSave={handleSaveConfig}
                      />
                      <DesignTab saving={saving} onRetheme={handleRetheme} />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* USER DETAIL MODAL */}
          <AnimatePresence>
            {selectedUser && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-[90vh]"
                >
                  <div className="bg-slate-900 text-white p-6 flex flex-col gap-4 bg-gradient-to-br from-slate-900 to-slate-800">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-[14px]">
                          {selectedUser.name.charAt(0)}
                        </div>
                        <div>
                          <h2 className="font-bold text-[16px] tracking-tight">
                            {selectedUser.name}
                          </h2>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {selectedUser.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUser(null);
                          setUserModalTab("identity");
                        }}
                        className="p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-full"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="flex gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 mx-[-8px]">
                      {[
                        { id: "identity", label: "Identity" },
                        { id: "wallet", label: "Wallet" },
                        { id: "activity", label: "Activity" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setUserModalTab(tab.id as any)}
                          className={`flex-1 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                            userModalTab === tab.id
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={userModalTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        {userModalTab === "identity" && (
                          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <section className="space-y-4">
                              <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest px-1">
                                Security & Status
                              </h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                  <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">
                                    Account Status
                                  </div>
                                  <div
                                    className={`text-[13px] font-bold tracking-tight ${selectedUser.status === "Blocked" ? "text-red-600" : "text-emerald-600"}`}
                                  >
                                    {selectedUser.status === "Blocked"
                                      ? "Suspended"
                                      : "Authorized"}
                                  </div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                  <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">
                                    Verified
                                  </div>
                                  <div className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5">
                                    <ShieldCheck
                                      size={14}
                                      className="text-blue-500"
                                    />{" "}
                                    System Level
                                  </div>
                                </div>
                              </div>
                            </section>

                            <section className="space-y-4">
                              <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest px-1">
                                Danger Zone
                              </h3>
                              <div className="p-4 bg-red-50 border border-red-100 rounded-3xl space-y-4">
                                <button
                                  onClick={() =>
                                    handleToggleBlock(
                                      selectedUser.id,
                                      selectedUser.status === "Blocked",
                                    )
                                  }
                                  disabled={!!actionLoading}
                                  className={`w-full py-3 rounded-2xl font-bold text-[13px] transition-all flex items-center justify-center gap-2 active:scale-95 ${
                                    selectedUser.status === "Blocked"
                                      ? "bg-emerald-600 text-white"
                                      : "bg-white text-red-600 border border-red-100 shadow-sm"
                                  }`}
                                >
                                  {actionLoading === selectedUser.id ? (
                                    <RefreshCw
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : selectedUser.status === "Blocked" ? (
                                    <ShieldCheck size={16} />
                                  ) : (
                                    <Ban size={16} />
                                  )}
                                  {selectedUser.status === "Blocked"
                                    ? "Revoke Suspension"
                                    : "Initiate Block"}
                                </button>

                                <div className="pt-4 border-t border-red-100/50">
                                  <p className="text-[10px] text-red-400 font-bold text-center mb-3">
                                    Type DELETE to confirm permanent archival
                                  </p>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={deleteValidation}
                                      onChange={(e) =>
                                        setDeleteValidation(e.target.value)
                                      }
                                      className="flex-1 bg-white border border-red-100 rounded-xl px-3 py-2 text-[13px] font-mono font-bold outline-none focus:ring-2 focus:ring-red-200 transition-all text-center"
                                      placeholder="Confirm"
                                    />
                                    <button
                                      disabled={
                                        deleteValidation !== "DELETE" ||
                                        !!actionLoading
                                      }
                                      onClick={() =>
                                        handleDeleteUser(
                                          selectedUser.id,
                                          selectedUser.email,
                                        )
                                      }
                                      className="px-4 bg-red-600 text-white rounded-xl text-[12px] font-bold disabled:opacity-30 active:scale-95"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </section>
                          </div>
                        )}

                        {userModalTab === "wallet" && (
                          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-slate-900 rounded-[28px] p-6 text-white relative overflow-hidden group">
                              <div className="relative z-10">
                                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                                  On-Chain Asset Controller
                                </div>
                                <div className="space-y-4">
                                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <div className="text-[9px] uppercase font-extrabold text-slate-500 mb-1">
                                      Public Hex Address
                                    </div>
                                    <div className="text-[12px] font-mono break-all leading-relaxed text-slate-300">
                                      {selectedUser.wallet}
                                    </div>
                                  </div>

                                  {!selectedUserWallet ? (
                                    <button
                                      onClick={() =>
                                        fetchWalletDetails(selectedUser.id)
                                      }
                                      disabled={loadingWallet}
                                      className="w-full py-4 bg-emerald-500 text-slate-900 rounded-2xl font-black text-[13px] uppercase tracking-widest hover:bg-emerald-400 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                                    >
                                      {loadingWallet ? (
                                        <RefreshCw
                                          size={18}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <ShieldCheck size={18} />
                                      )}
                                      Sync Circle Metadata
                                    </button>
                                  ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="text-[9px] font-bold text-slate-500 mb-1 uppercase">
                                          Architecture
                                        </div>
                                        <div className="text-[14px] font-bold text-emerald-400">
                                          {selectedUserWallet.scaCore
                                            ?.version || "Standard EOA"}
                                        </div>
                                      </div>
                                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="text-[9px] font-bold text-slate-500 mb-1 uppercase">
                                          Cloud Status
                                        </div>
                                        <div className="text-[14px] font-bold text-blue-400">
                                          OPERATIONAL
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {selectedUserWallet &&
                              selectedUserWallet.scaCore?.version ===
                                "circle_4337_v1" && (
                                <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-3xl">
                                  <div className="flex items-center gap-4 mb-3">
                                    <div className="p-2.5 bg-indigo-600 rounded-xl text-white">
                                      <Zap size={20} />
                                    </div>
                                    <div>
                                      <div className="font-bold text-indigo-900 text-[14px]">
                                        Advanced Infrastructure Ready
                                      </div>
                                      <div className="text-[11px] text-indigo-600 font-medium">
                                        Upgrade to Modular SCA for gas
                                        sponsorship.
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleUpgradeWallet(selectedUser.id)
                                    }
                                    disabled={!!actionLoading}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-[13px] hover:bg-indigo-700 transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
                                  >
                                    {actionLoading === selectedUser.id ? (
                                      <RefreshCw
                                        size={16}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <ChevronRight size={16} />
                                    )}
                                    Execute Migration
                                  </button>
                                </div>
                              )}

                            <div className="p-5 bg-orange-50 border border-orange-100 rounded-3xl mt-4">
                              <div className="flex items-center gap-4 mb-3">
                                <div className="p-2.5 bg-orange-500 rounded-xl text-white">
                                  <AlertCircle size={20} />
                                </div>
                                <div>
                                  <div className="font-bold text-orange-900 text-[14px]">
                                    Emergency Sweep
                                  </div>
                                  <div className="text-[11px] text-orange-700 font-medium leading-relaxed">
                                    Instantly withdraw all USDC from this user to the platform Treasury. Useful if user loses access.
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleManualSweepUser(selectedUser.id)}
                                disabled={!!actionLoading}
                                className="w-full py-3 bg-white text-orange-600 border border-orange-200 rounded-xl font-bold text-[13px] hover:bg-orange-50 transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2"
                              >
                                {actionLoading === "sweep-" + selectedUser.id ? (
                                  <RefreshCw size={16} className="animate-spin" />
                                ) : (
                                  <ArrowLeft size={16} />
                                )}
                                Sweep All Funds
                              </button>
                            </div>
                          </div>
                        )}

                        {userModalTab === "activity" && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-between items-center px-1">
                              <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
                                Recent Blockchain Events
                              </h3>
                              <span className="text-[10px] font-bold text-slate-400">
                                Live Sync
                              </span>
                            </div>
                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                              {systemTransactions.filter(
                                (tx) => tx.userId === selectedUser.id,
                              ).length === 0 ? (
                                <div className="text-center py-12 text-slate-400 text-[13px] font-medium border border-dashed border-slate-200 rounded-3xl">
                                  No recent transaction data located.
                                </div>
                              ) : (
                                systemTransactions
                                  .filter((tx) => tx.userId === selectedUser.id)
                                  .map((tx, i) => (
                                    <div
                                      key={i}
                                      className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={`p-2 rounded-lg ${tx.type === "DEPOSIT" ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"}`}
                                        >
                                          <Zap size={14} />
                                        </div>
                                        <div>
                                          <div className="font-bold text-slate-800 text-[13px] tracking-tight">
                                            {tx.type}
                                          </div>
                                          <div className="text-[10px] text-slate-400 font-medium">
                                            {tx.status} • {tx.createdAt}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="font-bold text-slate-900 text-[13px]">
                                        {tx.amount} {tx.symbol}
                                      </div>
                                    </div>
                                  ))
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
