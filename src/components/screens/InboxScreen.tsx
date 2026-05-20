import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Search, 
  Calendar, 
  Wallet, 
  ArrowRight, 
  Shield, 
  Smartphone, 
  Circle, 
  Info 
} from 'lucide-react';

interface InboxScreenProps {
  onBack: () => void;
}

export function InboxScreen({ onBack }: InboxScreenProps) {
  const [activeTab, setActiveTab] = useState<'resi' | 'notifikasi' | 'promo'>('resi');

  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50 animate-in slide-in-from-bottom duration-300">
      {/* Search & Back Header */}
      <div className="px-4 pt-12 pb-2 bg-white flex items-center justify-between shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-800" />
        </button>
        <div className="flex items-center gap-3">
          <button className="text-[#3FA2F6] bg-blue-50 p-2.5 rounded-full"><Search size={18} strokeWidth={2.5} /></button>
          <button className="text-slate-400 p-2.5 rounded-full bg-slate-50"><Trash2 size={18} /></button>
        </div>
      </div>

      {/* Segmented Tabs Control */}
      <div className="px-4 py-2 shrink-0 border-b border-slate-100 bg-white">
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center relative gap-1">
          <button 
             onClick={() => setActiveTab('resi')}
             className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] transition-all relative z-10 ${
                activeTab === 'resi' ? 'bg-white text-[#3FA2F6] shadow-sm' : 'text-slate-400 hover:text-slate-600'
             }`}
          >
             Resi
          </button>
          <button 
             onClick={() => setActiveTab('notifikasi')}
             className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] transition-all relative z-10 ${
                activeTab === 'notifikasi' ? 'bg-white text-[#3FA2F6] shadow-sm' : 'text-slate-400 hover:text-slate-600'
             }`}
          >
             Notifikasi
          </button>
          <button 
             onClick={() => setActiveTab('promo')}
             className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] transition-all relative z-10 ${
                activeTab === 'promo' ? 'bg-white text-[#3FA2F6] shadow-sm' : 'text-slate-400 hover:text-slate-600'
             }`}
          >
             Promo
          </button>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="flex-1 overflow-y-auto">
         {activeTab === 'resi' && <ResiContent />}
         {activeTab === 'notifikasi' && <NotifikasiContent />}
         {activeTab === 'promo' && <PromoContent />}
      </div>
    </div>
  );
}

function ResiContent() {
  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between px-4 mt-6">
         <h3 className="font-extrabold text-[18px] text-slate-800 tracking-tight">Terbaru</h3>
         <button className="text-slate-400 p-2 rounded-full bg-slate-50"><Calendar size={18} /></button>
      </div>

      <div className="flex flex-col gap-4 px-4">
        <h4 className="text-[13px] font-bold text-slate-500 tracking-wide mt-2">18 Mei 2026</h4>
        <TransactionItem 
          icon={<Wallet size={22} className="text-[#3FA2F6]" />}
          title="GoPay Customer - RAKYAN INUKERTAPATI"
          status="Berhasil"
          amount="- Rp 361.000"
        />
        <TransactionItem 
          icon={<Wallet size={22} className="text-[#3FA2F6]" />}
          title="GoPay Customer - RAKYAN INUKERTAPATI"
          status="Berhasil"
          amount="- Rp 941.000"
        />
      </div>

      <div className="flex flex-col gap-4 px-4">
        <h4 className="text-[13px] font-bold text-slate-500 tracking-wide mt-2">11 Mei 2026</h4>
        <TransactionItem 
          icon={<Wallet size={22} className="text-[#3FA2F6]" />}
          title="GoPay Customer - RAKYAN INUKERTAPATI"
          status="Berhasil"
          amount="- Rp 461.000"
        />
      </div>
      
      <div className="flex flex-col gap-4 px-4">
        <h4 className="text-[13px] font-bold text-slate-500 tracking-wide mt-2">04 Mei 2026</h4>
        <TransactionItem 
          icon={<Wallet size={22} className="text-[#3FA2F6]" />}
          title="GoPay Customer - RAKYAN INUKERTAPATI"
          status="Berhasil"
          amount="- Rp 781.000"
        />
      </div>
      
      <div className="flex flex-col gap-4 px-4">
        <h4 className="text-[13px] font-bold text-slate-500 tracking-wide mt-2">30 Apr 2026</h4>
        <TransactionItem 
          icon={<ArrowRight size={22} className="text-[#3FA2F6]" />}
          title="Bank Negara Indonesia - ARGA SATYAGRAHA"
          status="Berhasil"
          amount="- Rp 5.002.500"
        />
      </div>
    </div>
  );
}

interface TransactionItemProps {
  icon: React.ReactNode;
  title: string;
  status: string;
  amount: string;
}

function TransactionItem({ icon, title, status, amount }: TransactionItemProps) {
  return (
    <div className="flex items-start justify-between bg-white cursor-pointer active:scale-[0.98] transition-transform group">
      <div className="flex gap-3 items-start pr-4">
         <div className="mt-0.5 w-8 h-8 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors rounded-full">{icon}</div>
         <div className="flex flex-col">
            <h5 className="font-medium text-[14px] text-slate-800 leading-snug mb-1">{title}</h5>
            <span className="text-[12px] text-emerald-500 font-medium">{status}</span>
         </div>
      </div>
      <div className="flex shrink-0">
         <span className="font-medium text-[14px] text-slate-800">{amount}</span>
         <span className="text-[10px] font-bold text-slate-700 mt-0.5 ml-0.5">00</span>
      </div>
    </div>
  );
}

function NotifikasiContent() {
  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 px-4 mt-6">
        <h3 className="font-bold text-[18px] text-slate-800 tracking-tight mb-2">Prioritas</h3>
        <NotificationItem 
           icon={<div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0"><Shield size={16} className="text-amber-500 fill-amber-100" /></div>}
           title="Lengkapi Data NPWP Sekarang, Y..."
           desc="Selesaikan proses registrasi dengan masukkan data NPWP Anda terlebih dahulu."
           date="10/03/2025"
        />
      </div>

      <div className="w-full h-2 bg-slate-50 mt-4 border-y border-slate-100"></div>

      <div className="flex flex-col gap-4 mt-2 px-4">
        <div className="flex justify-between items-center mb-2">
           <h3 className="font-bold text-[18px] text-slate-800 tracking-tight">Info Akun</h3>
           <button className="text-[#3FA2F6] text-[13px] font-bold px-2 py-1 hover:bg-blue-50 rounded-lg transition-colors">Atur</button>
        </div>
        
        <NotificationItem 
           icon={<div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><span className="w-3 h-3 bg-yellow-400 rounded-sm"></span></div>}
           title="GoPay Tidak Lagi Terhubung"
           desc="Akun GoPay Anda sudah tidak lagi terhubung dengan Livin'. Hubungkan kembali akun GoPay kapan pun m..."
           date="27 Apr"
        />

        <NotificationItem 
           icon={<div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><Smartphone size={16} className="text-slate-500" /></div>}
           title="Perubahan Nomor Handphone Berh..."
           desc="Nomor yang terhubung dengan aplikasi Livin' telah diubah menjadi 6281318056437. Selanjutnya, semua..."
           date="27 Apr"
        />

        <NotificationItem 
           icon={<div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0"><Circle size={16} className="text-amber-500 fill-amber-500" strokeWidth={0} /></div>}
           title="Token Tarik Tunai SiAap Digunakan"
           desc="Berikut adalah Token Tarik Tunai Anda. Segera gunakan di ATM terdekat sebelum masa berlakunya..."
           date="10 Mar"
        />

        <NotificationItem 
           icon={<div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0"><Circle size={16} className="text-amber-500 fill-amber-500" strokeWidth={0} /></div>}
           title="Transaksi Tarik Tunai Berhasil!"
           desc="Berikut adalah detail transaksi tarik tunai Anda di ATM Mandiri. Token Tarik - 602765 Nominal ..."
           date="10 Mar"
        />
      </div>
    </div>
  );
}

interface NotificationItemProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  date: string;
}

function NotificationItem({ icon, title, desc, date }: NotificationItemProps) {
  return (
    <div className="flex items-start gap-4 mb-2 cursor-pointer group">
       <div className="mt-1 shrink-0">{icon}</div>
       <div className="flex flex-col flex-1 border-b border-slate-100 pb-5 pt-1">
          <div className="flex justify-between items-start mb-1 gap-2">
             <h5 className="font-bold text-[14px] text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">{title}</h5>
             <span className="text-[12px] text-slate-500 shrink-0 font-medium">{date}</span>
          </div>
          <p className="text-[12px] text-slate-600/90 leading-[1.6] line-clamp-2 pr-2">{desc}</p>
       </div>
    </div>
  );
}

function PromoContent() {
  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center px-4 mt-6">
         <h3 className="font-bold text-[18px] text-slate-800 tracking-tight">Eksklusif untuk Anda</h3>
      </div>
      
      <div className="px-4">
         <div className="rounded-[16px] overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] relative bg-white group cursor-pointer">
            <div className="bg-gradient-to-tr from-blue-100 to-indigo-50 h-[170px] relative overflow-hidden group-hover:opacity-90 transition-opacity">
               {/* Banner Abstract Image block */}
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[120%] h-[120%] bg-blue-600/10 rounded-full blur-2xl absolute -top-10 -right-10"></div>
                  <div className="w-[150%] h-[150%] bg-indigo-900/5 mix-blend-multiply opacity-50 absolute inset-0 rotate-12 scale-150 border-[50px] border-dashed border-indigo-200/30 rounded-full"></div>
               </div>
               
               <div className="absolute top-3 left-3 bg-[#f59e0b] text-white text-[11px] font-bold px-2 py-0.5 rounded flex items-center shadow-sm z-10">
                  Terbaru
               </div>
            </div>
            
            <div className="p-5 bg-white relative">
               <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 -mt-10 relative z-10 border-4 border-white shadow-sm">
                  <Info size={18} className="fill-blue-600 text-white" />
               </div>
               
               <h4 className="font-bold text-[17px] text-slate-800 mb-4 leading-snug pr-4 group-hover:text-blue-600 transition-colors">Lagi Cari Aset dengan Harga Terbaik? 😉</h4>
               
               <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50/80 border border-slate-100 rounded-[8px] mb-4">
                  <span className="text-[14px]">⌛</span>
                  <span className="text-[11px] font-bold text-slate-700">Berlaku Sampai</span>
                  <span className="text-[12px] font-medium text-slate-500 ml-1">31 Mei 2026</span>
               </div>
               
               <p className="text-[13px] text-slate-600 leading-[1.6]">
                  Tersedia beragam pilihan aset, mulai dari properti hingga kendaraan dengan penawaran menarik!
               </p>
            </div>
         </div>
      </div>
      
      <div className="flex justify-center mt-2 gap-1.5">
         <div className="w-6 h-1.5 bg-[#3FA2F6] rounded-full"></div>
         <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
         <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
         <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
      </div>
      
      <div className="w-full h-2 bg-slate-50 mt-2 border-y border-slate-100 z-10 relative"></div>
      
      <div className="flex justify-between items-center px-4 mt-2">
         <h3 className="font-bold text-[18px] text-slate-800 tracking-tight">Hanya di Arc Commerce</h3>
      </div>
    </div>
  );
}
export { NotificationItem, TransactionItem };
