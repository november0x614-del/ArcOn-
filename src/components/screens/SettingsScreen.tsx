import React from 'react';
import { 
  ArrowLeft, 
  Search, 
  Headphones as HeadphonesIcon, 
  LogIn, 
  Bell, 
  UserCircle, 
  Mail, 
  Settings, 
  FileText, 
  Key, 
  RefreshCw, 
  CreditCard as CardIcon, 
  ArrowUpRight, 
  Smartphone, 
  Fingerprint, 
  Lock, 
  Shield 
} from 'lucide-react';

interface SettingsScreenProps {
  onBack: () => void;
  onInstantAccess?: () => void;
  onPusatNotifikasi?: () => void;
  onNamaPanggilan?: () => void;
  onEmail?: () => void;
  onShowToast?: (msg: string) => void;
  isBiometricVerified?: boolean;
  onVerifyBiometric?: () => void;
}

export function SettingsScreen({ 
  onBack, 
  onInstantAccess, 
  onPusatNotifikasi, 
  onNamaPanggilan, 
  onEmail,
  onShowToast,
  isBiometricVerified = true,
  onVerifyBiometric
}: SettingsScreenProps) {
  const handleNotImplemented = (featureInfo?: string) => {
    if (featureInfo === 'Biometrics' && !isBiometricVerified && onVerifyBiometric) {
        onVerifyBiometric();
        return;
    }
    if (onShowToast) {
       onShowToast(`Feature ${featureInfo || 'this'} is still in development.`);
    }
  };

  return (
    <div className="w-full h-full bg-[#f8fafc] relative flex flex-col z-50 animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 flex items-center gap-3 px-4 py-4 z-10 shrink-0">
        <button onClick={onBack} className="p-1 -ml-1 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-700" />
        </button>
        <div className="flex-1 bg-slate-100/80 rounded-[12px] flex items-center px-3 py-2.5">
          <Search size={18} className="text-slate-500 mr-2 shrink-0" />
          <input type="text" placeholder="Search settings..." className="bg-transparent border-none outline-none text-[13px] w-full text-slate-700" />
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto pb-8">
        
        {/* Akun & Profil */}
        <div className="mt-4">
          <div className="px-4 mb-2">
            <span className="text-[12px] font-bold text-slate-500 tracking-wide uppercase">Profile & Account</span>
          </div>
          <div className="bg-white border-y border-slate-100 flex flex-col">
            <SettingItem icon={<UserCircle size={20} className="text-[#3FA2F6]" />} label="Nickname" onClick={onNamaPanggilan} />
            <SettingItem icon={<Mail size={20} className="text-[#3FA2F6]" />} label="Registered Email" onClick={onEmail} />
            <SettingItem icon={<Settings size={20} className="text-[#3FA2F6]" />} label="Language Preferences" isLast onClick={() => handleNotImplemented("Language Preferences")} />
          </div>
        </div>

        {/* Keamanan & Dompet */}
        <div className="mt-6">
          <div className="px-4 mb-2">
            <span className="text-[12px] font-bold text-slate-500 tracking-wide uppercase">Wallet Security</span>
          </div>
          <div className="bg-white border-y border-slate-100 flex flex-col">
            <SettingItem 
              icon={<Fingerprint size={20} className="text-[#3FA2F6]" />} 
              label="Biometric Auth" 
              badge={isBiometricVerified ? "VERIFIED" : "ACTION NEEDED"} 
              badgeColor={isBiometricVerified ? "emerald" : "red"} 
              onClick={() => handleNotImplemented("Biometrics")} 
            />
            <SettingItem icon={<Lock size={20} className="text-[#3FA2F6]" />} label="Change PIN / Password" onClick={() => handleNotImplemented("Change PIN")} />
            <SettingItem icon={<Key size={20} className="text-[#3FA2F6]" />} label="Recovery Phrase (Seed)" badge="IMPORTANT" onClick={() => handleNotImplemented("Recovery Phrase")} />
            <SettingItem icon={<Shield size={20} className="text-[#3FA2F6]" />} label="Export Private Key" isLast onClick={() => handleNotImplemented("Export Private Key")} />
          </div>
        </div>

        {/* Jaringan & Web3 */}
        <div className="mt-6">
          <div className="px-4 mb-2">
            <span className="text-[12px] font-bold text-slate-500 tracking-wide uppercase">Network & Connections</span>
          </div>
          <div className="bg-white border-y border-slate-100 flex flex-col">
            <SettingItem icon={<RefreshCw size={20} className="text-[#3FA2F6]" />} label="Network Settings" badge="ARC TESTNET" onClick={() => handleNotImplemented("Network Settings")} />
            <SettingItem icon={<Smartphone size={20} className="text-[#3FA2F6]" />} label="WalletConnect Sessions" onClick={() => handleNotImplemented("WalletConnect")} />
            <SettingItem icon={<FileText size={20} className="text-[#3FA2F6]" />} label="Contract Allowances" isLast onClick={() => handleNotImplemented("Contract Allowances")}/>
          </div>
        </div>

        {/* Pusat Bantuan */}
        <div className="mt-6 mb-8">
          <div className="px-4 mb-2">
            <span className="text-[12px] font-bold text-slate-500 tracking-wide uppercase">Help & Community</span>
          </div>
          <div className="bg-white border-y border-slate-100">
            <SettingItem icon={<HeadphonesIcon size={20} className="text-[#3FA2F6]" />} label="Arc Help Center" onClick={() => handleNotImplemented("Help Center")} />
            <SettingItem icon={<ArrowUpRight size={20} className="text-[#3FA2F6]" />} label="Developer Docs" isLast onClick={() => handleNotImplemented("Docs")} />
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
  badgeColor?: 'emerald' | 'red';
  isLast?: boolean;
  onClick?: () => void;
}

function SettingItem({ icon, label, badge, badgeColor = 'emerald', isLast, onClick }: SettingItemProps) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors ${!isLast ? 'border-b border-slate-100' : ''}`}>
      <div className="flex items-center gap-4">
        {icon}
        <span className="text-[14px] font-bold text-slate-800">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {badge && (
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] ${
            badgeColor === 'emerald' ? 'bg-emerald-50 text-emerald-600 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.3)]' : 
            'bg-red-50 text-red-600 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.3)]'
          }`}>
            {badge}
          </span>
        )}
      </div>
    </button>
  );
}
