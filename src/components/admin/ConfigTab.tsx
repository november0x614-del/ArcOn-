import React, { memo } from "react";
import { Settings2, CircleDollarSign, Activity, ShieldCheck } from "lucide-react";

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

interface ConfigTabProps {
  config: AdminConfig | null;
  loading: boolean;
  saving: boolean;
  swapFeeInput: string;
  setSwapFeeInput: (v: string) => void;
  withdrawFeeInput: string;
  setWithdrawFeeInput: (v: string) => void;
  bridgeFeeInput: string;
  setBridgeFeeInput: (v: string) => void;
  dailyTransferLimitInput: string;
  setDailyTransferLimitInput: (v: string) => void;
  onSave: (fields: Partial<AdminConfig>) => void;
}

const ToggleItem = memo(({ label, desc, field, value, onToggle }: { label: string, desc: string, field: string, value: boolean, onToggle: (f: string, v: boolean) => void }) => {
  return (
    <div className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
      <div className="flex flex-col pr-4">
        <span className="text-[12px] font-extrabold text-slate-800 leading-tight">{label}</span>
        <span className="text-[10px] text-slate-500 mt-0.5">{desc}</span>
      </div>
      <button 
        type="button"
        onClick={() => onToggle(field, !value)}
        className={`w-10 h-6 rounded-full relative shrink-0 transition-colors cursor-pointer ${value ? 'bg-emerald-500' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${value ? 'right-1' : 'left-1'}`}></span>
      </button>
    </div>
  );
});

export function ConfigTab({
  config,
  loading,
  saving,
  swapFeeInput,
  setSwapFeeInput,
  withdrawFeeInput,
  setWithdrawFeeInput,
  bridgeFeeInput,
  setBridgeFeeInput,
  dailyTransferLimitInput,
  setDailyTransferLimitInput,
  onSave
}: ConfigTabProps) {
  if (!config) return <div className="p-8 text-center text-slate-500 font-medium">Loading platform configuration nodes...</div>;

  const handleToggle = (field: string, value: boolean) => {
    onSave({ [field]: value });
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-300">
      {/* Category 1: Biaya & Batasan Transaksi */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <Settings2 size={15} className="text-slate-600" />
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
              onClick={() => handleToggle('gasSubsidyEnabled', !config.gasSubsidyEnabled)}
              className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${config.gasSubsidyEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${config.gasSubsidyEnabled ? 'right-1' : 'left-1'}`}></span>
            </button>
          </div>

          <button 
            onClick={() => onSave({ 
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
            <ToggleItem 
              key={item.field} 
              label={item.label} 
              desc={item.desc} 
              field={item.field} 
              value={config[item.field as keyof AdminConfig] as boolean} 
              onToggle={handleToggle} 
            />
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
            <ToggleItem 
              key={item.field} 
              label={item.label} 
              desc={item.desc} 
              field={item.field} 
              value={config[item.field as keyof AdminConfig] as boolean} 
              onToggle={handleToggle} 
            />
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
            <ToggleItem 
              key={item.field} 
              label={item.label} 
              desc={item.desc} 
              field={item.field} 
              value={config[item.field as keyof AdminConfig] as boolean} 
              onToggle={handleToggle} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
