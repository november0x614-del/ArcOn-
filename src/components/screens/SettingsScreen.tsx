import React from "react";
import {
  ArrowLeft,
  UserCircle,
  Mail,
  Settings,
  Shield,
  Fingerprint,
  FileText,
  BadgeDollarSign,
  Activity,
  ArrowUpRight,
  HeadphonesIcon,
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
  const { network, registeredUser, language } = useStore();

  const handleNotImplemented = (featureInfo?: string) => {
    if (onShowToast) {
      onShowToast(`Feature ${featureInfo || "this"} is still in development.`);
    }
  };

  return (
    <div className="w-full h-full bg-slate-50 relative flex flex-col z-50 animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center px-4 md:px-6 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 shrink-0">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h3 className="font-bold text-[16px] tracking-tight text-white ml-2">
            SETTINGS
          </h3>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto pb-[120px] scrollbar-hide pt-2 px-4 md:px-6">
        {/* Profile & Account */}
        <div className="mt-4">
          <div className="mb-2">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              Profile & Account
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden shadow-sm">
            <SettingItem
              icon={<UserCircle size={20} className="text-slate-700" />}
              label="Username"
              badge={registeredUser?.username || "Not Set"}
              onClick={() =>
                handleNotImplemented(
                  "Username edit represents solid identity and is locked by default.",
                )
              }
            />
            <SettingItem
              icon={<Mail size={20} className="text-slate-700" />}
              label="Registered Email"
              badge={registeredUser?.email || "Not Set"}
              onClick={() =>
                handleNotImplemented(
                  "Email edit represents solid identity and is locked by default.",
                )
              }
            />
            <SettingItem
              icon={<Settings size={20} className="text-slate-700" />}
              label="Language Preferences"
              badge={language}
              isLast
              onClick={() => handleNotImplemented("Language Preferences")}
            />
          </div>
        </div>

        {/* Security & Limits */}
        <div className="mt-6">
          <div className="mb-2">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              Security & Limits
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden shadow-sm">
            <SettingItem
              icon={<Fingerprint size={20} className="text-slate-700" />}
              label="Biometric Login"
              badge="ENABLED"
              badgeColor="emerald"
              onClick={() => handleNotImplemented("Biometrics")}
            />
            <SettingItem
              icon={<Shield size={20} className="text-slate-700" />}
              label="Transaction PIN"
              badge="SETUP"
              badgeColor="neutral"
              onClick={() => handleNotImplemented("Transaction PIN")}
            />
            <SettingItem
              icon={<Activity size={20} className="text-slate-700" />}
              label="Daily Transfer Limit"
              badge="5,000 USDC"
              badgeColor="neutral"
              isLast
              onClick={() => handleNotImplemented("Transfer Limit")}
            />
          </div>
        </div>

        {/* Network & Platform */}
        <div className="mt-6">
          <div className="mb-2">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              Network & Platform
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden shadow-sm">
            <SettingItem
              icon={<BadgeDollarSign size={20} className="text-slate-700" />}
              label="Gas Fee Sponsorship"
              badge="ACTIVE"
              badgeColor="emerald"
              onClick={() => handleNotImplemented("Paymaster Sponsorship")}
            />
            <SettingItem
              icon={<Activity size={20} className="text-slate-700" />}
              label="Active Network"
              badge={network}
              badgeColor="emerald"
              isLast
              onClick={() => handleNotImplemented("Network Settings")}
            />
          </div>
        </div>

        {/* Help & Support */}
        <div className="mt-6 mb-8">
          <div className="mb-2">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              Help & Support
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 flex flex-col overflow-hidden shadow-sm">
            <SettingItem
              icon={<HeadphonesIcon size={20} className="text-slate-700" />}
              label="Contact Support"
              onClick={() => handleNotImplemented("Support")}
            />
            <SettingItem
              icon={<FileText size={20} className="text-slate-700" />}
              label="Terms of Service"
              onClick={() => handleNotImplemented("Terms")}
            />
            <SettingItem
              icon={<ArrowUpRight size={20} className="text-slate-700" />}
              label="Developer API"
              isLast
              onClick={() => handleNotImplemented("Developer API")}
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
  badgeColor?: "emerald" | "red" | "neutral";
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
      className={`w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50 transition-colors active:bg-slate-100 ${!isLast ? "border-b border-slate-100" : ""}`}
    >
      <div className="flex items-center gap-4">
        {icon}
        <span className="text-[14px] font-bold text-slate-800">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {badge && (
          <span
            className={`px-2.5 py-1 text-[10px] font-bold rounded-md tracking-wide ${
              badgeColor === "emerald"
                ? "bg-emerald-50 text-emerald-600"
                : badgeColor === "red"
                  ? "bg-red-50 text-red-600"
                  : "bg-slate-100 text-slate-600"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </button>
  );
}
