import React from 'react';
import { 
  ArrowLeft, 
  Copy, 
  Send, 
  Receipt, 
  Plus, 
  CreditCard, 
  Search, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft 
} from 'lucide-react';

interface AccountDetailScreenProps {
  onBack: () => void;
  onTransfer: () => void;
  onTopup: () => void;
  onPayVA?: () => void;
}

export function AccountDetailScreen({ 
  onBack, 
  onTransfer, 
  onTopup,
  onPayVA
}: AccountDetailScreenProps) {
  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50 animate-in slide-in-from-right duration-300 overflow-hidden">
      {/* Top Header Section - Blue Gradient */}
      <div className="bg-[#3FA2F6] pt-12 pb-24 px-4 relative shrink-0 z-10 flex flex-col items-center overflow-hidden w-full">
        {/* Background abstract curves */}
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-white/5 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>
        
        <button onClick={onBack} className="absolute left-2 top-11 p-2 hover:bg-white/10 rounded-full transition-colors z-20">
          <ArrowLeft size={24} className="text-white" />
        </button>

        <h2 className="text-white text-[16px] font-semibold mt-1 tracking-wide z-10 w-full text-center pr-8">Tabungan USDC</h2>
        
        <div className="flex items-center gap-2 mt-1 z-10">
          <span className="text-white/90 text-[14px] font-mono">0x742d...f44e</span>
          <button className="text-white/80 hover:text-white pt-1">
             <Copy size={14} />
          </button>
        </div>

        <div className="mt-4 z-10">
           <h1 className="text-white text-[32px] font-bold tracking-tight text-center">
             <span className="text-[18px] font-semibold mr-1">USDC</span> 
             1,134<span className="text-[14px] align-top relative top-[8px]">.66</span>
           </h1>
        </div>

        {/* Action Buttons Row */}
        <div className="flex justify-center gap-[18px] mt-6 w-full z-10 px-2">
          <DetailActionButton icon={<Send size={20} />} label={`Transfer\nUSDC`} onClick={onTransfer} />
          <DetailActionButton icon={<Receipt size={20} />} label={`Bayar/VA`} badge="VA" onClick={onPayVA} />
          <DetailActionButton icon={<Plus size={22} />} label="Top-up" onClick={onTopup} />
          <DetailActionButton icon={<CreditCard size={20} />} label={`Kartu`} />
        </div>
      </div>

      {/* Main Content Area - White background overlaps the blue */}
      <div className="flex-1 bg-white rounded-t-[32px] -mt-8 z-20 relative overflow-hidden flex flex-col shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        
        <div className="px-6 pt-6 pb-2 shrink-0 border-b border-slate-100 flex items-center justify-between">
           <div className="flex flex-col items-center border-b-2 border-slate-800 pb-1">
             <h3 className="font-bold text-[15px] text-slate-800">Transaksi</h3>
           </div>
           <button className="text-[#3FA2F6] font-bold text-[13px]">e-Statement</button>
        </div>

        <div className="flex items-center px-4 py-3 shrink-0 justify-between">
           <div className="flex gap-4 overflow-x-auto scrollbar-hide py-1 text-[14px] text-slate-500 font-medium">
             <button className="whitespace-nowrap px-1">Februari</button>
             <button className="whitespace-nowrap px-1">Maret</button>
             <button className="whitespace-nowrap px-1">April</button>
             <button className="whitespace-nowrap px-1 text-slate-800 font-bold border-b-[2.5px] border-slate-800 pb-1">Mei</button>
           </div>
           <div className="flex items-center gap-3 ml-2 shrink-0">
              <button className="text-[#3FA2F6] bg-blue-50 p-2 rounded-full"><Search size={16} strokeWidth={2.5} /></button>
              <button className="text-slate-400 p-2 rounded-full bg-slate-50"><Calendar size={16} strokeWidth={2.5} /></button>
           </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto px-4 pb-24 flex flex-col pt-2">
           
           <div className="flex flex-col">
              <h4 className="text-[12px] font-bold text-slate-400 tracking-wider mb-2">18 Mei 2026</h4>
              <DetailTransactionItem 
                icon={<div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-slate-400 flex items-center justify-center shrink-0 mt-0.5"><ArrowUpRight size={12} className="text-slate-400" /></div>}
                title="Transfer USDC"
                desc={`Transfer ke Dompet Lain\n0x8823...32a1`}
                amount="- 6.25 USDC"
                amountColor="text-slate-800"
              />
              <DetailTransactionItem 
                icon={<div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-slate-400 flex items-center justify-center shrink-0 mt-0.5"><div className="w-[8px] h-[8px] bg-slate-400 rounded-full"></div></div>}
                title="Biaya Gas"
                desc="Biaya jaringan Arc"
                amount="- 0.40 USDC"
                amountColor="text-slate-800"
                hideSeparator
              />
           </div>

           <div className="flex flex-col mt-4">
              <h4 className="text-[12px] font-bold text-slate-400 tracking-wider mb-2">13 Mei 2026</h4>
              <DetailTransactionItem 
                icon={<div className="w-[18px] h-[18px] rounded-full bg-[#e6f4fc] flex items-center justify-center shrink-0 mt-0.5"><Receipt size={10} className="text-[#008fcd]" /></div>}
                title="Penyelesaian Tagihan"
                desc={`Pembelian API Credit\nCircle Web3 Services`}
                amount="- 7.87 USDC"
                amountColor="text-slate-800"
                badge="+ 1 pts"
              />
              <DetailTransactionItem 
                icon={<div className="w-[18px] h-[18px] rounded-full bg-[#e6f4fc] flex items-center justify-center shrink-0 mt-0.5"><Receipt size={10} className="text-[#008fcd]" /></div>}
                title="Pembelian"
                desc={`Pembelian NFT Koleksi\n0x66f...b29a`}
                amount="- 28.75 USDC"
                amountColor="text-slate-800"
                badge="+ 1 pts"
                hideSeparator
              />
           </div>

           <div className="flex flex-col mt-4">
              <h4 className="text-[12px] font-bold text-slate-400 tracking-wider mb-2">07 Mei 2026</h4>
              <DetailTransactionItem 
                icon={<div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-slate-400 flex items-center justify-center shrink-0 mt-0.5"><div className="w-[8px] h-[8px] bg-slate-400 rounded-full"></div></div>}
                title="Biaya"
                desc={`Biaya transaksi bank\nPembayaran GoPay Customer\n082173022116`}
                amount="- Rp 1.000"
                amountColor="text-slate-800"
              />
              <DetailTransactionItem 
                icon={<div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-[#008fcd] flex items-center justify-center shrink-0 mt-0.5"><ArrowDownLeft size={12} className="text-[#008fcd]" /></div>}
                title="Transfer USDC"
                desc={`Deposit dari Wallet Eksternal\n0x112b...fca9`}
                amount="+ 391.31 USDC"
                amountColor="text-[#008fcd]"
              />
           </div>

           <div className="flex flex-col mt-4">
              <h4 className="text-[12px] font-bold text-slate-400 tracking-wider mb-2">04 Mei 2026</h4>
              <DetailTransactionItem 
                icon={<div className="w-[18px] h-[18px] rounded-full bg-[#e6f4fc] flex items-center justify-center shrink-0 mt-0.5"><Receipt size={10} className="text-[#008fcd]" /></div>}
                title="Staking"
                desc={`Setoran ke Arc Liquidity Pool\n0x9ad...e92f`}
                amount="- 48.75 USDC"
                amountColor="text-slate-800"
                badge="+ 1 pts"
              />
              <DetailTransactionItem 
                icon={<div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-slate-400 flex items-center justify-center shrink-0 mt-0.5"><div className="w-[8px] h-[8px] bg-slate-400 rounded-full"></div></div>}
                title="Biaya"
                desc={`Biaya transaksi bank\nPembayaran GoPay Customer\n082173022116`}
                amount="- Rp 1.000"
                amountColor="text-slate-800"
                hideSeparator
              />
           </div>

        </div>
      </div>
    </div>
  );
}

interface DetailActionButtonProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  onClick?: () => void;
}

function DetailActionButton({ icon, label, badge, onClick }: DetailActionButtonProps) {
  return (
    <div className="flex flex-col items-center gap-2 group cursor-pointer w-16" onClick={onClick}>
      <div className="w-12 h-12 rounded-full bg-white text-[#3FA2F6] flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.1)] group-active:scale-95 transition-transform relative">
        {icon}
        {badge && (
          <div className="absolute -top-[2px] -right-[6px] bg-yellow-400 text-slate-800 text-[9px] font-bold px-1 py-[1px] rounded-[4px] border border-white leading-none">
            {badge}
          </div>
        )}
      </div>
      <span className="text-white text-[11px] font-medium text-center leading-tight whitespace-pre-line tracking-wide opacity-95">
        {label}
      </span>
    </div>
  );
}

interface DetailTransactionItemProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  amount: string;
  amountColor?: string;
  badge?: string;
  hideSeparator?: boolean;
}

function DetailTransactionItem({ 
  icon, 
  title, 
  desc, 
  amount, 
  amountColor = "text-slate-800",
  badge,
  hideSeparator
}: DetailTransactionItemProps) {
  return (
    <div className="flex gap-4 p-2 cursor-pointer group active:scale-[0.98] transition-all my-1 text-left w-full">
       <div className="mt-1 w-6 shrink-0 flex justify-center">
          {icon}
       </div>
       <div className={`flex flex-col flex-1 pb-4 ${hideSeparator ? '' : 'border-b border-slate-100'}`}>
          <div className="flex justify-between items-start mb-1">
             <h5 className="font-bold text-[14px] text-slate-800 group-hover:text-[#3FA2F6] transition-colors">{title}</h5>
             <div className="flex flex-col items-end">
                <span className={`font-bold text-[14px] ${amountColor} flex`}>
                  {amount}
                  <span className="text-[9px] mt-0.5 ml-0.5">00</span>
                </span>
             </div>
          </div>
          <p className="text-[12px] text-slate-500 leading-snug whitespace-pre-line max-w-[85%] mt-1">{desc}</p>
          {badge && (
             <div className="mt-2.5 inline-flex items-center gap-1 bg-emerald-55 text-emerald-600 px-2 pt-0.5 pb-1 rounded-full w-fit border border-emerald-100">
                <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center">
                   <span className="text-white text-[8px] font-bold">L</span>
                </div>
                <span className="text-[11px] font-bold tracking-tight">{badge}</span>
             </div>
          )}
       </div>
    </div>
  );
}
export { DetailActionButton, DetailTransactionItem };
