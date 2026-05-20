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
}

export function SettingsScreen({ 
  onBack, 
  onInstantAccess, 
  onPusatNotifikasi, 
  onNamaPanggilan, 
  onEmail 
}: SettingsScreenProps) {
  return (
    <div className="w-full h-full bg-[#f8fafc] relative flex flex-col z-50 animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 flex items-center gap-3 px-4 py-4 z-10 shrink-0">
        <button onClick={onBack} className="p-1 -ml-1 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-700" />
        </button>
        <div className="flex-1 bg-slate-100/80 rounded-[12px] flex items-center px-3 py-2.5">
          <Search size={18} className="text-slate-500 mr-2 shrink-0" />
          <input type="text" placeholder="Cari pengaturan yang ingin diubah..." className="bg-transparent border-none outline-none text-[13px] w-full text-slate-700" />
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto pb-8">
        
        {/* Pusat Bantuan */}
        <div className="mt-4">
          <div className="px-4 mb-2">
            <span className="text-[12px] font-bold text-slate-500 tracking-wide">Pusat Bantuan</span>
          </div>
          <div className="bg-white border-y border-slate-100">
            <SettingItem icon={<HeadphonesIcon size={20} className="text-[#3FA2F6]" />} label="Arc Call Center" badge="NEW" isLast />
          </div>
        </div>

        {/* Fitur Tanpa Login */}
        <div className="mt-6">
          <div className="px-4 mb-2">
            <span className="text-[12px] font-bold text-slate-500 tracking-wide">Fitur Tanpa Login</span>
          </div>
          <div className="bg-white border-y border-slate-100">
            <SettingItem icon={<LogIn size={20} className="text-[#3FA2F6]" />} label="Instant Access" onClick={onInstantAccess} />
            <SettingItem icon={<Bell size={20} className="text-[#3FA2F6]" />} label="Pusat Notifikasi" isLast onClick={onPusatNotifikasi} />
          </div>
        </div>

        {/* Akun */}
        <div className="mt-6">
          <div className="px-4 mb-2">
            <span className="text-[12px] font-bold text-slate-500 tracking-wide">Akun</span>
          </div>
          <div className="bg-white border-y border-slate-100 flex flex-col">
            <SettingItem icon={<UserCircle size={20} className="text-[#3FA2F6]" />} label="Nama Panggilan" onClick={onNamaPanggilan} />
            <SettingItem icon={<Mail size={20} className="text-[#3FA2F6]" />} label="Email" onClick={onEmail} />
            <SettingItem icon={<Settings size={20} className="text-[#3FA2F6]" />} label="Bahasa" />
            <SettingItem icon={<FileText size={20} className="text-[#3FA2F6]" />} label="Data Anda" isLast />
          </div>
        </div>

        {/* Fitur */}
        <div className="mt-6">
          <div className="px-4 mb-2">
            <span className="text-[12px] font-bold text-slate-500 tracking-wide">Fitur</span>
          </div>
          <div className="bg-white border-y border-slate-100 flex flex-col">
            <SettingItem icon={<Key size={20} className="text-[#3FA2F6]" />} label="Token Online" badge="NEW" />
            <SettingItem icon={<RefreshCw size={20} className="text-[#3FA2F6]" />} label="Proxy untuk BI Fast" />
            <SettingItem icon={<CardIcon size={20} className="text-[#3FA2F6]" />} label="Sumber Dana Utama" badge="NEW" />
            <SettingItem icon={<ArrowUpRight size={20} className="text-[#3FA2F6]" />} label="Terima Tagihan" />
            <SettingItem icon={<Smartphone size={20} className="text-[#3FA2F6]" />} label="Produk di Beranda" badge="NEW" isLast />
          </div>
        </div>

        {/* Keamanan */}
        <div className="mt-6 mb-8">
          <div className="px-4 mb-2">
            <span className="text-[12px] font-bold text-slate-500 tracking-wide">Keamanan</span>
          </div>
          <div className="bg-white border-y border-slate-100 flex flex-col">
            <SettingItem icon={<Fingerprint size={20} className="text-[#3FA2F6]" />} label="Biometrik untuk Login" />
            <SettingItem icon={<Lock size={20} className="text-[#3FA2F6]" />} label="PIN" />
            <SettingItem icon={<Shield size={20} className="text-[#3FA2F6]" />} label="Password" isLast />
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
  isLast?: boolean;
  onClick?: () => void;
}

function SettingItem({ icon, label, badge, isLast, onClick }: SettingItemProps) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors ${!isLast ? 'border-b border-slate-100' : ''}`}>
      <div className="flex items-center gap-4">
        {icon}
        <span className="text-[14px] font-bold text-slate-800">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {badge && (
          <span className="px-2 py-0.5 bg-emerald-55 text-emerald-600 text-[10px] font-bold rounded shadow-[inset_0_0_0_1px_rgba(52,211,153,0.3)]">
            {badge}
          </span>
        )}
      </div>
    </button>
  );
}
