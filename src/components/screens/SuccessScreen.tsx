import React, { useState } from "react";
import { X, Check, ChevronUp, ArrowUpRight, PlusCircle, ArrowLeft, CheckCircle2, Copy, Send, Download } from 'lucide-react';
import { Contact } from "../../types";

export function SuccessScreen({ contact, amount, onClose }: { contact: any, amount: string, onClose: () => void }) {
  const [isSaved, setIsSaved] = useState(false);
  const numericAmount = parseFloat(amount.replace(/\./g, ''));
  const now = new Date();
  const formatTime = `${now.getDate()} Mei 2026 • ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} WIB`;

  return (
    <div className="w-full h-full bg-slate-50 relative flex flex-col z-50 overflow-y-auto overflow-x-hidden pb-12 animate-in fade-in duration-300">
      <div className="bg-white flex flex-col items-center pt-16 pb-8 text-center px-6 relative rounded-b-[32px] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
         <button onClick={onClose} className="absolute right-5 top-5 p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20} strokeWidth={2.5}/>
         </button>
         
         <div className="w-20 h-20 rounded-full bg-[#12B76A] flex items-center justify-center shadow-[0_4px_24px_rgba(18,183,106,0.3)] mb-5">
            <Check size={40} className="text-white" strokeWidth={3} />
         </div>

         <h2 className="text-[24px] font-extrabold text-slate-800 mb-2">Transfer Berhasil!</h2>
         <p className="text-slate-500 text-[13px]">{formatTime}</p>
         
         <div className="flex items-center gap-1.5 text-[#4f46e5] font-semibold text-[14px] mt-6 bg-[#4f46e5]/10 px-4 py-2 rounded-full cursor-pointer hover:bg-[#4f46e5]/20 transition-colors">
             Lihat Resi
             <ChevronUp size={16} strokeWidth={2.5} />
         </div>
      </div>

      <div className="px-5 mt-6 mb-8 flex-1">
         {/* Details Card */}
         <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col items-center text-center relative overflow-hidden mb-6">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(#4f46e5 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
            
            <span className="text-slate-500 text-[13px] mb-2 relative z-10">Penerima</span>
            <h3 className="text-slate-800 font-extrabold text-[18px] mb-1 relative z-10 uppercase">{contact.name}</h3>
            <p className="text-slate-600 text-[14px] mb-8 relative z-10">{contact.bank} - {contact.account}</p>

            <span className="text-slate-500 text-[13px] mb-2 relative z-10">Nominal</span>
            <h1 className="text-slate-800 font-extrabold text-[28px] tracking-tight mb-2 relative z-10">Rp {numericAmount.toLocaleString('id-ID')}</h1>
            <p className="text-slate-500 text-[13px] relative z-10">dari RAKYAN INUKERTAPATI</p>

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-10 relative z-10">
               <button className="flex-1 border-2 border-[#4f46e5] text-[#4f46e5] font-bold text-[14px] py-3.5 rounded-full flex items-center justify-center gap-2 hover:bg-[#4f46e5] hover:text-white transition-all active:scale-[0.98]">
                  <ArrowUpRight size={18} strokeWidth={2.5} />
                  Bagikan Resi
               </button>
               <button 
                  onClick={() => setIsSaved(true)} 
                  disabled={isSaved}
                  className={`flex-1 font-bold text-[14px] py-3.5 rounded-full flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isSaved ? 'bg-slate-100 text-slate-500 cursor-default' : 'bg-[#4f46e5] text-white hover:bg-[#3730a3] shadow-[0_4px_14px_rgba(0,143,205,0.3)]'}`}
               >
                  {isSaved ? (
                    <>
                       <Check size={18} strokeWidth={2.5} />
                       Tersimpan
                    </>
                  ) : (
                    <>
                       <PlusCircle size={18} strokeWidth={2.5} />
                       Simpan ke Daftar
                    </>
                  )}
                </button>
             </div>
          </div>
       </div>
     </div>
   );
}

