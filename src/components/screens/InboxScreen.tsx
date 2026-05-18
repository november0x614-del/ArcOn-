import React, { useState } from 'react';
import { Filter, Smartphone, Wallet, Shield, Circle, Info, ArrowLeft, Search, Receipt, CheckCircle2, Tag, Percent, ArrowRight } from 'lucide-react';

export function InboxScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'resi' | 'notifikasi' | 'promo'>('resi');

  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header Tabs */}
      <div className="pt-12 px-4 shadow-sm relative shrink-0 border-b border-slate-100 flex items-center bg-white z-10 w-full rounded-t-[32px]">
        <button onClick={onBack} className="absolute left-2 top-11 p-2 hover:bg-slate-100 rounded-full transition-colors z-20">
          <ArrowLeft size={20} className="text-slate-700" />
        </button>
        <div className="flex-1 flex justify-center gap-6 ml-[40px] pl-[10px] w-[calc(100%-80px)] mt-1 overflow-x-auto scrollbar-hide">
          <button 
            className={`pb-3 font-bold text-[14px] px-2 relative transition-colors whitespace-nowrap border-b-[2.5px] ${activeTab === 'resi' ? 'text-indigo-600 border-blue-600' : 'text-slate-500 border-transparent'}`}
            onClick={() => setActiveTab('resi')}
          >
            Resi
          </button>
          <button 
            className={`pb-3 font-bold text-[14px] px-2 relative transition-colors whitespace-nowrap border-b-[2.5px] ${activeTab === 'notifikasi' ? 'text-indigo-600 border-blue-600' : 'text-slate-500 border-transparent'}`}
            onClick={() => setActiveTab('notifikasi')}
          >
            Notifikasi
          </button>
          <button 
            className={`pb-3 font-bold text-[14px] px-2 relative transition-colors whitespace-nowrap border-b-[2.5px] ${activeTab === 'promo' ? 'text-indigo-600 border-blue-600' : 'text-slate-500 border-transparent'}`}
            onClick={() => setActiveTab('promo')}
          >
            Promo
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'resi' && <ResiContent />}
        {activeTab === 'notifikasi' && <NotifikasiContent />}
        {activeTab === 'promo' && <PromoContent />}
      </div>
    </div>
  );
}

export function ResiContent() {
  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-2 px-4 mt-6">
        <h3 className="font-bold text-[16px] text-slate-800 tracking-tight">Semua Transaksi</h3>
        <button className="p-1 hover:bg-slate-50 rounded-full transition-colors"><Filter size={18} className="text-[#6366f1]" strokeWidth={2.5} /></button>
      </div>

      <div className="flex flex-col gap-4 px-4">
        <h4 className="text-[13px] font-bold text-slate-500 tracking-wide mt-1">18 Mei 2026</h4>
        <TransactionItem 
          icon={<ArrowRight size={22} className="text-[#6366f1]" />}
          title="Bank Central Asia - ARADEA WISNU WARDANA"
          status="Berhasil"
          amount="- Rp 106.500"
        />
        <TransactionItem 
          icon={<Smartphone size={22} className="text-[#6366f1]" />}
          title="Finnet Indonesia, PT - MyTelkomsel"
          status="Berhasil"
          amount="- Rp 126.000"
        />
      </div>

      <div className="flex flex-col gap-4 px-4">
        <h4 className="text-[13px] font-bold text-slate-500 tracking-wide mt-2">11 Mei 2026</h4>
        <TransactionItem 
          icon={<Wallet size={22} className="text-[#6366f1]" />}
          title="GoPay Customer - RAKYAN INUKERTAPATI"
          status="Berhasil"
          amount="- Rp 461.000"
        />
      </div>
      
      <div className="flex flex-col gap-4 px-4">
        <h4 className="text-[13px] font-bold text-slate-500 tracking-wide mt-2">04 Mei 2026</h4>
        <TransactionItem 
          icon={<Wallet size={22} className="text-[#6366f1]" />}
          title="GoPay Customer - RAKYAN INUKERTAPATI"
          status="Berhasil"
          amount="- Rp 781.000"
        />
      </div>
      
      <div className="flex flex-col gap-4 px-4">
        <h4 className="text-[13px] font-bold text-slate-500 tracking-wide mt-2">30 Apr 2026</h4>
        <TransactionItem 
          icon={<ArrowRight size={22} className="text-[#6366f1]" />}
          title="Bank Negara Indonesia - ARGA SATYAGRAHA"
          status="Berhasil"
          amount="- Rp 5.002.500"
        />
      </div>
    </div>
  );
}

export function TransactionItem({ icon, title, status, amount }: { icon: React.ReactNode, title: string, status: string, amount: string }) {
  return (
    <div className="flex items-start justify-between bg-white cursor-pointer active:scale-[0.98] transition-transform group">
      <div className="flex gap-3 items-start pr-4">
         <div className="mt-0.5 w-8 h-8 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors rounded-full">{icon}</div>
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

export function NotifikasiContent() {
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
           <button className="text-[#6366f1] text-[13px] font-bold px-2 py-1 hover:bg-indigo-50 rounded-lg transition-colors">Atur</button>
        </div>
        
        <NotificationItem 
           icon={<div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><span className="w-3 h-3 bg-yellow-400 rounded-sm"></span></div>}
           title="GoPay Tidak Lagi Terhubung"
           desc="Akun GoPay Anda sudah tidak lagi terhubung dengan ArcOn. Hubungkan kembali akun GoPay kapan pun m..."
           date="27 Apr"
        />

        <NotificationItem 
           icon={<div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><Smartphone size={16} className="text-slate-500" /></div>}
           title="Perubahan Nomor Handphone Berh..."
           desc="Nomor yang terhubung dengan aplikasi ArcOn telah diubah menjadi 6281318056437. Selanjutnya, semua..."
           date="27 Apr"
        />

        <NotificationItem 
           icon={<div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0"><Circle size={16} className="text-amber-500 fill-amber-500" strokeWidth={0} /></div>}
           title="Token Tarik Tunai Siap Digunakan"
           desc="Berikut adalah Token Tarik Tunai Anda. Segera gunakan di ATM terdekat sebelum masa berlakunya..."
           date="10 Mar"
        />

        <NotificationItem 
           icon={<div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0"><Circle size={16} className="text-amber-500 fill-amber-500" strokeWidth={0} /></div>}
           title="Transaksi Tarik Tunai Berhasil!"
           desc="Berikut adalah detail transaksi tarik tunai Anda di Agen Arc. Token Tarik - 602765 Nominal ..."
           date="10 Mar"
        />
      </div>
    </div>
  );
}

export function NotificationItem({ icon, title, desc, date }: { icon: React.ReactNode, title: string, desc: string, date: string }) {
  return (
    <div className="flex items-start gap-4 mb-2 cursor-pointer group">
       <div className="mt-1 shrink-0">{icon}</div>
       <div className="flex flex-col flex-1 border-b border-slate-100 pb-5 pt-1">
          <div className="flex justify-between items-start mb-1 gap-2">
             <h5 className="font-bold text-[14px] text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">{title}</h5>
             <span className="text-[12px] text-slate-500 shrink-0 font-medium">{date}</span>
          </div>
          <p className="text-[12px] text-slate-600/90 leading-[1.6] line-clamp-2 pr-2">{desc}</p>
       </div>
    </div>
  );
}

export function PromoContent() {
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
                  <div className="w-[120%] h-[120%] bg-indigo-600/10 rounded-full blur-2xl absolute -top-10 -right-10"></div>
                  <div className="w-[150%] h-[150%] bg-indigo-900/5 mix-blend-multiply opacity-50 absolute inset-0 rotate-12 scale-150 border-[50px] border-dashed border-indigo-200/30 rounded-full"></div>
               </div>
               
               <div className="absolute top-3 left-3 bg-[#10b981] text-white text-[11px] font-bold px-2 py-0.5 rounded flex items-center shadow-sm z-10">
                  Terbaru
               </div>
            </div>
            
            <div className="p-5 bg-white relative">
               <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 -mt-10 relative z-10 border-4 border-white shadow-sm">
                  <Info size={18} className="fill-blue-600 text-white" />
               </div>
               
               <h4 className="font-bold text-[17px] text-slate-800 mb-4 leading-snug pr-4 group-hover:text-indigo-600 transition-colors">Lagi Cari Aset dengan Harga Terbaik? 😉</h4>
               
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
         <div className="w-6 h-1.5 bg-[#6366f1] rounded-full"></div>
         <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
         <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
         <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
      </div>
      
      <div className="w-full h-2 bg-slate-50 mt-2 border-y border-slate-100"></div>
      
      <div className="flex justify-between items-center px-4 mt-2">
         <h3 className="font-bold text-[18px] text-slate-800 tracking-tight">Hanya di ArcOn</h3>
      </div>
    </div>
  );
}

