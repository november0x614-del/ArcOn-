import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Edit3, ChevronDown, ArrowRight, X } from 'lucide-react';

interface AmountInputScreenProps {
  contact: any;
  onBack: () => void;
  onNext: (amount: string) => void;
}

export function AmountInputScreen({ contact, onBack, onNext }: AmountInputScreenProps) {
  const [amount, setAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleNumpad = (num: string) => {
    if (num === 'backspace') {
      setAmount(prev => prev.slice(0, -1));
    } else if (num === '000') {
      setAmount(prev => prev === '' ? '' : prev + '000');
    } else {
      setAmount(prev => prev + num);
    }
  };

  const formattedAmount = amount ? new Intl.NumberFormat('id-ID').format(parseInt(amount)) : '0';
  const numericAmount = amount ? parseInt(amount) : 0;

  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50">
      {/* Header */}
      <div className="w-full pt-12 pb-4 px-4 flex items-center shadow-sm relative z-10 shrink-0 bg-white border-b border-slate-100">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors absolute left-4">
          <ArrowLeft className="text-slate-700" size={24} />
        </button>
        <div className="flex flex-col items-center justify-center flex-1">
          <h2 className="text-slate-800 font-bold text-[15px] uppercase tracking-tight leading-tight">{contact.name}</h2>
          <p className="text-slate-500 text-[13px] mt-[2px]">{contact.bank || contact.network} - {contact.account}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full pb-[280px]">
        {/* Nominal */}
        <div className="px-6 py-6 border-b border-transparent">
          <label className={`${amount && numericAmount < 10000 ? 'text-[#db2e38]' : amount ? 'text-slate-500' : 'text-[#008fcd]'} text-[13px] font-medium mb-1 block`}>Nominal</label>
          <div className={`flex items-center relative border-b pb-1 ${amount && numericAmount < 10000 ? 'border-[#db2e38] border-b-[2px]' : amount ? 'border-slate-300' : 'border-[#008fcd] border-b-[2px]'}`}>
            <span className="text-[36px] font-medium text-slate-800 mr-2 tracking-tight">Rp</span>
            <input 
              type="text" 
              readOnly
              value={formattedAmount}
              className="text-[36px] font-medium text-slate-800 outline-none w-full bg-transparent tracking-tight relative z-10 pointer-events-none" 
            />
            {amount && (
               <button onClick={() => setAmount('')} className="absolute right-0 w-[24px] h-[24px] bg-[#d1d5db] rounded-full flex items-center justify-center text-white hover:bg-[#9ca3af] transition-colors z-20">
                 <X size={16} strokeWidth={2.5} />
               </button>
            )}
          </div>
          {amount && numericAmount < 10000 ? (
             <p className="text-[#db2e38] text-[12px] font-medium mt-1.5 leading-none">Minimum transfer Rp 10.000</p>
          ) : (
             <div className="h-[18px]"></div>
          )}
        </div>

        {/* Source Account */}
        <div className="px-6 py-4">
          <label className="text-slate-400 text-[12px] mb-2 block font-medium">Rekening Sumber</label>
          <div className="bg-white border border-slate-200 rounded-[12px] p-4 flex justify-between shadow-sm overflow-hidden relative min-h-[96px]">
            <div className="flex flex-col z-10 w-[70%] bg-white/80 backdrop-blur-sm pr-2">
              <div className="flex items-center gap-1.5 mb-1 text-left">
                <span className="font-bold text-slate-800 text-[15px]">Tabungan NOW IDR</span>
                <CheckCircle2 size={16} className="text-[#008fcd] fill-[#e6f4fc]" strokeWidth={2.5} />
              </div>
              <span className="text-slate-500 text-[13.5px] tracking-wide font-medium block text-left">1820014780589</span>
              <span className="text-[#008fcd] font-bold text-[15px] mt-1.5 block text-left">Rp 18.261.185<span className="text-[10px] align-top relative top-[2px]">00</span></span>
            </div>
            
            {/* The absolute right part containing the fake card image */}
            <div className="absolute right-0 top-0 bottom-0 w-[45%] bg-[#dfcd99] overflow-hidden -z-0 rounded-r-[12px] shadow-inner" style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)' }}>
               <img src="https://images.unsplash.com/photo-1541592102481-c75c87a2d4b7?auto=format&fit=crop&q=80&w=200&h=200" className="w-full h-full object-cover mix-blend-overlay opacity-50" alt="card bg" />
               <div className="absolute top-2 left-4 text-white drop-shadow-md">
                 <span className="font-bold italic text-[14px]">mandiri</span>
               </div>
               <div className="absolute bottom-2 right-2 text-white drop-shadow-md font-bold italic text-[12px]">VISA</div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="px-6 py-3 flex justify-center">
          <button className="flex items-center gap-2 text-slate-700 font-medium text-[14px] hover:text-slate-900 transition-colors">
            <Edit3 size={16} className="text-slate-500" /> Tambah Keterangan
          </button>
        </div>

        {/* Options */}
        <div className="px-6 py-2">
          <div className="border-t border-slate-100 pt-6 pb-2">
            <div className="flex justify-between items-center border border-slate-200 rounded-[12px] p-4 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex flex-col text-left">
                <span className="text-slate-400 text-[12px] mb-1 font-medium">Metode Transfer</span>
                <span className="text-slate-800 font-bold text-[15px]">BI Fast</span>
              </div>
              <ChevronDown className="text-slate-800" size={20} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Simple Numpad Area */}
      <div className="absolute bottom-0 left-0 w-full bg-white z-20 pb-6 pt-4 border-t border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <div className="px-5 mb-4">
          <button 
            onClick={() => setShowConfirm(true)}
            disabled={!amount || parseInt(amount) < 10000}
            className={`w-full py-[14px] rounded-full font-bold text-[15px] transition-all flex items-center justify-center gap-2
              ${amount && parseInt(amount) >= 10000 
                ? 'bg-[#008fcd] text-white shadow-[0_4px_14px_rgba(0,143,205,0.4)] hover:bg-[#007dba] active:scale-[0.98]' 
                : 'bg-[#e5e7eb] text-[#9ca3af] shadow-none'}
            `}
          >
            Lanjutkan
          </button>
        </div>

        <div className="px-5 grid grid-cols-3 gap-2 gap-y-3">
           {[1,2,3,4,5,6,7,8,9].map(n => (
             <button key={n} onClick={() => handleNumpad(n.toString())} className="h-12 bg-[#f8fafc] rounded-xl text-slate-700 font-semibold text-[20px] active:bg-slate-200 transition-colors flex items-center justify-center">
                {n}
             </button>
           ))}
           <button onClick={() => handleNumpad('000')} className="h-12 bg-[#f8fafc] rounded-xl text-slate-700 font-semibold text-[18px] active:bg-slate-200 transition-colors flex items-center justify-center">000</button>
           <button onClick={() => handleNumpad('0')} className="h-12 bg-[#f8fafc] rounded-xl text-slate-700 font-semibold text-[20px] active:bg-slate-200 transition-colors flex items-center justify-center">0</button>
           <button onClick={() => handleNumpad('backspace')} className="h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 active:bg-slate-100 transition-colors border border-slate-100">
             <X size={24} strokeWidth={2.5} className="ml-1"/>
           </button>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="absolute inset-0 z-50 bg-black/40 flex flex-col justify-end transition-opacity overflow-hidden">
           <div className="bg-white rounded-t-[24px] w-full flex flex-col relative max-h-[95%] shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="px-5 pt-6 pb-4 flex justify-between items-center border-b border-slate-100">
                 <h3 className="font-bold text-[18px] text-slate-800">Konfirmasi Transfer</h3>
                 <button onClick={() => setShowConfirm(false)} className="text-slate-400 p-1 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200">
                   <X size={24} strokeWidth={2.5}/>
                 </button>
              </div>

              <div className="px-5 pb-6 overflow-y-auto pt-5 flex-1 block">
                 {/* Contact Preview */}
                 <div className="flex items-center gap-4 mb-8 text-left">
                    <div className="w-[46px] h-[46px] rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[15px] shrink-0">
                       {contact.initials}
                    </div>
                    <div className="flex flex-col overflow-hidden gap-[2px]">
                       <span className="font-extrabold text-[15px] text-slate-800 uppercase tracking-tight truncate">{contact.name}</span>
                       <span className="text-slate-500 text-[13px] truncate">{contact.bank || contact.network} - {contact.account}</span>
                    </div>
                 </div>

                 {/* Detail Table */}
                 <div className="flex flex-col gap-3.5 mb-6 text-left">
                    <div className="flex justify-between items-center">
                       <span className="text-slate-600 text-[14.5px]">Nominal Transfer</span>
                       <span className="text-slate-800 font-bold text-[14.5px]">Rp {new Intl.NumberFormat('id-ID').format(numericAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-slate-600 text-[14.5px]">Metode Transfer</span>
                       <span className="text-slate-800 font-bold text-[14.5px]">Online</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-slate-600 text-[14.5px]">Biaya Transaksi</span>
                       <span className="text-slate-800 font-bold text-[14.5px]">Rp 6.500</span>
                    </div>
                 </div>

                 <div className="h-[1px] bg-slate-100 w-full mb-6"></div>

                 {/* Rekening Sumber inside Confirm */}
                 <label className="text-slate-500 text-[14.5px] mb-2 block text-left">Rekening Sumber</label>
                 <div className="bg-slate-50 border border-slate-100 rounded-[12px] p-4 flex flex-col gap-0.5 text-left">
                    <span className="font-bold text-slate-800 text-[14.5px]">Tabungan NOW IDR - 1820014780589</span>
                    <span className="text-slate-500 text-[13px]">Rp 18.261.185<span className="text-[9px] align-top relative top-[1px]">00</span></span>
                 </div>
              </div>

              {/* Bottom Confirm Action */}
              <div className="px-5 py-5 bg-white shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] border-t border-slate-100">
                 <button 
                   onClick={() => onNext(amount)}
                   className="w-full bg-[#008fcd] text-white py-[14px] rounded-full flex justify-between px-6 items-center shadow-[0_4px_14px_rgba(0,143,205,0.4)] hover:bg-[#007dba] active:scale-[0.98] transition-all"
                 >
                    <span className="font-bold text-[15px]">Lanjut Transfer</span>
                    <div className="flex items-center gap-2">
                       <span className="font-bold text-[16px]">Rp {new Intl.NumberFormat('id-ID').format(numericAmount + 6500)}</span>
                       <div className="bg-white/20 p-1 rounded-full">
                         <ArrowRight size={16} strokeWidth={3} />
                       </div>
                    </div>
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
export default AmountInputScreen;
