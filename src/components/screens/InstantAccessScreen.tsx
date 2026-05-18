import React, { useState } from 'react';
import { Search, QrCode, Nfc, ArrowDownToLine, Settings, ArrowLeft, Wallet, Info, Zap, CreditCard, Smartphone, Check } from "lucide-react";

export function InstantAccessScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-center relative py-4 shrink-0 shadow-sm z-10 bg-white">
        <button onClick={onBack} className="absolute left-4 p-1 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-700" />
        </button>
        <h2 className="font-bold text-[16px] text-slate-800">Instant Access</h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-10 bg-white">
        <div className="px-6 pt-6 pb-6 flex flex-col items-center text-center w-full">
          <p className="text-[14px] text-slate-600 leading-[1.6]">
            Lakukan transaksi favorit tanpa perlu login. Yuk, aktifkan agar transaksi lebih hemat waktu!
          </p>
          <div className="w-full max-w-[200px] h-[200px] mt-6 mb-2">
             <img src="https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&q=80&w=300&h=300" className="w-full h-full object-cover mix-blend-multiply opacity-90" alt="illustration" />
          </div>
        </div>

        <div className="flex flex-col">
           <InstantAccessItem 
             icon={<Search size={22} className="text-[#6366f1]" />}
             title="Intip Saldo"
             desc="Cek saldo tabungan, sisa limit kartu kredit, dan mutasi transaksi."
             enabled={true}
             hasSettings={true}
           />
           <InstantAccessItem 
             icon={<QrCode size={22} className="text-[#6366f1]" />}
             title="QR Bayar"
             desc="Bayar QR dengan scan atau upload kode lebih praktis tanpa perlu login!"
             enabled={false}
           />
           <InstantAccessItem 
             icon={<Nfc size={22} className="text-[#6366f1]" />}
             title="QRIS Tap"
             desc="Tap handphone untuk keluar dan masuk saat di transportasi publik hingga berbelanja."
             enabled={false}
           />
           <InstantAccessItem 
             icon={<ArrowDownToLine size={22} className="text-[#6366f1]" />}
             title="Setor Tarik"
             desc="Buat token lebih cepat untuk setor atau tarik tunai tanpa kartu di Jaringan Arc."
             enabled={true}
             hasSettings={true}
           />
           <InstantAccessItem 
             icon={<CreditCard size={22} className="text-[#6366f1]" />}
             title="Instant e-money"
             desc="Isi saldo kartu e-money favorit untuk perjalanan bebas hambatan."
             enabled={false}
           />
           <InstantAccessItem 
             icon={<Zap size={22} className="text-[#6366f1]" />}
             title="Quick Pick"
             desc="Transfer, top-up, dan bayar tagihan favorit dengan ringkas."
             enabled={false}
           />
           <InstantAccessItem 
             icon={<Nfc size={22} className="text-[#6366f1]" />}
             title="Tap to Pay"
             desc="Bayar ini itu dengan dekatkan handphone di..."
             enabled={false}
           />
        </div>
      </div>
    </div>
  );
}

export function InstantAccessItem({ icon, title, desc, enabled, hasSettings }: { icon: React.ReactNode, title: string, desc: string, enabled: boolean, hasSettings?: boolean }) {
  const [isOn, setIsOn] = React.useState(enabled);
  return (
    <div className="flex items-start gap-4 px-5 py-5 border-b border-slate-100/60 bg-white">
      <div className="shrink-0 pt-0.5">
        {icon}
      </div>
      <div className="flex-1 flex flex-col gap-1">
         <div className="flex items-start justify-between mb-1">
            <h4 className="font-bold text-[15px] text-slate-800">{title}</h4>
            <div 
              role="button"
              className={`rounded-full flex items-center shrink-0 ml-4 px-[2px] cursor-pointer transition-colors duration-300 ${isOn ? 'bg-[#6366f1]' : 'bg-slate-300'}`}
              onClick={() => setIsOn(!isOn)}
              style={{ width: '46px', height: '24px' }}
            >
              <div className={`w-[20px] h-[20px] bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isOn ? 'translate-x-[22px]' : 'translate-x-0'}`}></div>
            </div>
         </div>
         <p className="text-[13px] text-slate-500 leading-[1.5] pr-8">{desc}</p>
         {hasSettings && isOn && (
           <button className="flex items-center gap-1.5 mt-3 px-3 py-1.5 border border-[#6366f1]/30 text-[#6366f1] rounded-full w-max bg-indigo-50/40 hover:bg-indigo-50 transition-colors">
              <Settings size={14} />
              <span className="font-bold text-[12px] pr-0.5">Atur</span>
           </button>
         )}
      </div>
    </div>
  )
}

