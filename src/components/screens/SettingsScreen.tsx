import React from "react";
import {
  ArrowLeft,
  Search,
  Headphones as HeadphonesIcon,
  UserCircle,
  Mail,
  Settings,
  FileText,
  Key,
  RefreshCw,
  ArrowUpRight,
  Smartphone,
  Lock,
  Shield,
} from "lucide-react";
import { useStore } from "../../store/useStore";

interface SettingsScreenProps {
  onBack: () => void;
  onNamaPanggilan?: () => void;
  onEmail?: () => void;
  onShowToast?: (msg: string) => void;
}

export function SettingsScreen({
  onBack,
  onNamaPanggilan,
  onEmail,
  onShowToast,
}: SettingsScreenProps) {
  const {
    network,
    walletConnectSessions,
    contractAllowances,
    registeredUser,
    language,
  } = useStore();

  const handleNotImplemented = (featureInfo?: string) => {
    if (onShowToast) {
      onShowToast(`Feature ${featureInfo || "this"} is still in development.`);
    }
  };

  return (
    <div className="w-full h-full bg-[#f8fafc] relative flex flex-col z-50 animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 flex items-center gap-3 px-4 py-4 z-10 shrink-0">
        <button
          onClick={onBack}
          className="p-1 -ml-1 hover:bg-slate-50 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div className="flex-1 bg-slate-100/80 rounded-[12px] flex items-center px-3 py-2.5">
          <Search size={18} className="text-slate-500 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search settings..."
            className="bg-transparent border-none outline-none text-[13px] w-full text-slate-700"
          />
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto pb-8">
        {/* Akun & Profil */}
        <div className="mt-4">
          <div className="px-4 mb-2">
            <span className="text-[12px] font-bold text-slate-500 tracking-wide uppercase">
              Profile & Account
            </span>
          </div>
          <div className="bg-white border-y border-slate-100 flex flex-col">
            <SettingItem
              icon={<UserCircle size={20} className="text-slate-800" />}
              label="Nickname"
              badge={registeredUser?.username || "Not Set"}
              onClick={onNamaPanggilan}
            />
            <SettingItem
              icon={<Mail size={20} className="text-slate-800" />}
              label="Registered Email"
              badge={registeredUser?.email || "Not Set"}
              onClick={onEmail}
            />
            <SettingItem
              icon={<Settings size={20} className="text-slate-800" />}
              label="Language Preferences"
              badge={language}
              isLast
              onClick={() => handleNotImplemented("Language Preferences")}
            />
          </div>
        </div>

        {/* Keamanan & Dompet */}
        <div className="mt-6">
          <div className="px-4 mb-2">
            <span className="text-[12px] font-bold text-slate-500 tracking-wide uppercase">
              Wallet & Custody
            </span>
          </div>
          <div className="bg-white border-y border-slate-100 flex flex-col">
            <SettingItem
              icon={<Shield size={20} className="text-slate-800" />}
              label="Signing Policy"
              badge="2/3 MPC"
              onClick={() => handleNotImplemented("Signing Policy")}
            />
            <SettingItem
              icon={<Lock size={20} className="text-slate-800" />}
              label="Compliance Blocklist"
              badge="ACTIVE"
              onClick={() => handleNotImplemented("Compliance Blocklist")}
            />
            <SettingItem
              icon={<Key size={20} className="text-slate-800" />}
              label="Dev-Controlled Seeds"
              badge="CIRCLE WEB3"
              isLast
              onClick={() => handleNotImplemented("Wallet Seed Management")}
            />
          </div>
        </div>

        {/* Jaringan & Web3 */}
        <div className="mt-6">
          <div className="px-4 mb-2">
            <span className="text-[12px] font-bold text-slate-500 tracking-wide uppercase">
              Network & Connections
            </span>
          </div>
          <div className="bg-white border-y border-slate-100 flex flex-col">
            <SettingItem
              icon={<RefreshCw size={20} className="text-slate-800" />}
              label="Network Settings"
              badge={network}
              onClick={() => handleNotImplemented("Network Settings")}
            />
            <SettingItem
              icon={<Smartphone size={20} className="text-slate-800" />}
              label="WalletConnect Sessions"
              badge={walletConnectSessions.toString()}
              onClick={() => handleNotImplemented("WalletConnect")}
            />
            <SettingItem
              icon={<FileText size={20} className="text-slate-800" />}
              label="Contract Allowances"
              badge={contractAllowances.toString()}
              isLast
              onClick={() => handleNotImplemented("Contract Allowances")}
            />
          </div>
        </div>

        {/* Pusat Bantuan */}
        <div className="mt-6 mb-8">
          <div className="px-4 mb-2">
            <span className="text-[12px] font-bold text-slate-500 tracking-wide uppercase">
              Help & Community
            </span>
          </div>
          <div className="bg-white border-y border-slate-100">
            <SettingItem
              icon={<HeadphonesIcon size={20} className="text-slate-800" />}
              label="Arc Help Center"
              onClick={() => handleNotImplemented("Help Center")}
            />
            <SettingItem
              icon={<ArrowUpRight size={20} className="text-slate-800" />}
              label="Developer Docs"
              isLast
              onClick={() => handleNotImplemented("Docs")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  badgeColor?: "emerald" | "red";
  isLast?: boolean;
  onClick?: () => void;
}

function SettingItem({
  icon,
  label,
  badge,
  badgeColor = "emerald",
  isLast,
  onClick,
}: SettingItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors ${!isLast ? "border-b border-slate-100" : ""}`}
    >
      <div className="flex items-center gap-4">
        {icon}
        <span className="text-[14px] font-bold text-slate-800">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {badge && (
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] ${
              badgeColor === "emerald"
                ? "bg-emerald-50 text-emerald-600 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.3)]"
                : "bg-red-50 text-red-600 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.3)]"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </button>
  );
}
