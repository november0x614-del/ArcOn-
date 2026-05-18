import React, { useState } from "react";
import { Landmark, AtSign, ChevronDown, X, Zap, ArrowLeft, Building, Circle, Search, ArrowRight, UserCircle } from 'lucide-react';
import { Contact } from "../../types";

export function NewTransferScreen({ onBack, onSelectContact }: { onBack: () => void, onSelectContact: (contact: any) => void }) {
  const [accountNumber, setAccountNumber] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [showNetworkSelect, setShowNetworkSelect] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('EVM (Arc Testnet)');
  const [isChecking, setIsChecking] = useState(false);
  const [showReceiverDetail, setShowReceiverDetail] = useState(false);

  const handleContinue = () => {
    if (!accountNumber || !receiverName) return;
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      setShowReceiverDetail(true);
    }, 1000);
  };
  
  const initials = receiverName.trim() ? receiverName.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';

  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50">
       {/* Header */}
       <div className="w-full pt-12 pb-6 px-4 shrink-0 flex flex-col items-center relative">
         <button onClick={onBack} className="absolute left-4 top-12 p-1 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200">
           <ArrowLeft className="text-slate-800" size={24} />
         </button>
         
         <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4 mt-2 shadow-sm">
            <ArrowRight className="text-slate-700" size={20} />
         </div>
         <h2 className="text-slate-900 font-bold text-[17px]">Transfer to New Receiver</h2>
       </div>

       {/* Tabs */}
       <div className="flex w-full px-8 mt-2 mb-6">
          <div className="flex-1 flex justify-center items-center gap-2 border-r border-slate-200 cursor-pointer">
             <Landmark size={18} className="text-[#6366f1]" />
             <span className="text-[#6366f1] font-bold text-[14px]">Account</span>
          </div>
          <div className="flex-1 flex justify-center items-center gap-2 cursor-pointer group">
             <AtSign size={18} className="text-slate-400 group-hover:text-slate-500 transition-colors" />
             <span className="text-slate-400 font-bold text-[14px] group-hover:text-slate-500 transition-colors">Proxy</span>
          </div>
       </div>

       {/* Form Fields */}
       <div className="px-5 w-full flex-1">
          {/* Bank Select */}
          <div 
            onClick={() => setShowNetworkSelect(true)} 
            className="bg-[#f6f8fb] rounded-[16px] px-4 py-3 pb-3.5 mb-4 flex justify-between items-center cursor-pointer border border-transparent hover:border-slate-200 transition-colors"
          >
             <div className="flex flex-col">
                <span className="text-slate-400 text-[11px] mb-0.5 font-medium">Choose Network</span>
                <span className="text-slate-800 font-extrabold text-[15px]">{selectedNetwork}</span>
             </div>
             <ChevronDown className="text-slate-500" size={20} />
          </div>
          
          {/* Account Number Input */}
          <div className="bg-[#f6f8fb] rounded-[16px] px-4 py-4 mb-4 flex justify-between items-center border border-transparent focus-within:border-[#6366f1] transition-colors relative">
             <input 
               type="text" 
               placeholder="Wallet Address" 
               value={accountNumber}
               onChange={(e) => setAccountNumber(e.target.value)}
               className="w-full bg-transparent outline-none text-slate-800 font-bold placeholder:font-medium placeholder:text-slate-400 text-[15px] pr-8" 
             />
             {accountNumber && (
               <button onClick={() => setAccountNumber('')} className="absolute right-4 w-[22px] h-[22px] bg-[#d1d5db] rounded-full flex items-center justify-center text-white hover:bg-[#9ca3af] transition-colors">
                 <X size={14} strokeWidth={2.5} />
               </button>
             )}
          </div>
          
          {/* Receiver Name Input */}
          <div className="bg-[#f6f8fb] rounded-[16px] px-4 py-4 mb-4 flex justify-between items-center border border-transparent focus-within:border-[#6366f1] transition-colors relative">
             <input 
               type="text" 
               placeholder="Account Name" 
               value={receiverName}
               onChange={(e) => setReceiverName(e.target.value.toUpperCase())}
               className="w-full bg-transparent outline-none text-slate-800 font-bold placeholder:font-medium placeholder:text-slate-400 text-[15px] pr-8" 
             />
             {receiverName && (
               <button onClick={() => setReceiverName('')} className="absolute right-4 w-[22px] h-[22px] bg-[#d1d5db] rounded-full flex items-center justify-center text-white hover:bg-[#9ca3af] transition-colors">
                 <X size={14} strokeWidth={2.5} />
               </button>
             )}
          </div>
       </div>

       {/* Bottom Button */}
       <div className="px-5 pb-8 shrink-0 relative z-10 bg-white">
          <button 
            onClick={handleContinue}
            disabled={!accountNumber || accountNumber.length < 3 || !receiverName.trim()}
            className={`w-full py-[14px] rounded-full font-bold text-[15px] transition-all flex items-center justify-center gap-2
              ${accountNumber.length > 3 && receiverName.trim().length > 0
                ? 'bg-[#4f46e5] text-white shadow-[0_4px_14px_rgba(0,143,205,0.4)] hover:bg-[#3730a3] active:scale-[0.98]' 
                : 'bg-[#e5e7eb] text-[#9ca3af] shadow-none'}`}
          >
             Lanjutkan
          </button>
       </div>

       {/* Cek Detail Penerima Modal */}
       {(isChecking || showReceiverDetail) && (
          <div className="absolute inset-0 z-[60] bg-black/40 flex flex-col justify-end transition-opacity overflow-hidden">
            {isChecking ? (
              <div className="flex-1 flex items-center justify-center">
                 <div className="w-[60px] h-[60px] bg-white rounded-full flex items-center justify-center shadow-lg relative">
                    <div className="w-10 h-10 border-[3px] border-[#4f46e5] border-t-transparent rounded-full animate-spin"></div>
                 </div>
              </div>
            ) : (
              <div className="bg-white rounded-t-[24px] w-full flex flex-col pb-8 pt-6 shadow-2xl animate-in slide-in-from-bottom duration-300 relative">
                 <div className="px-5 pb-4 flex justify-between items-center mb-2">
                    <h3 className="font-bold text-[18px] text-slate-800">Cek Detail Penerima</h3>
                 </div>
                 
                 <div className="px-5 flex flex-col gap-4">
                    <div className="border border-slate-100 rounded-[16px] p-5 flex flex-col items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                       <div className="w-[52px] h-[52px] rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[16px] mb-3">
                          {initials}
                       </div>
                       <h4 className="font-extrabold text-[16px] text-slate-800 text-center uppercase tracking-tight">{receiverName.toUpperCase()}</h4>
                       <p className="text-slate-500 text-[13px] text-center mt-1">{selectedNetwork} - {accountNumber}</p>
                    </div>

                    <p className="text-slate-500 text-[13px] text-center mt-2 mb-1 px-4">
                      Pastikan detail penerima transfer benar.
                    </p>

                    <button 
                      onClick={() => {
                        setShowReceiverDetail(false);
                        onSelectContact({
                          id: 'new',
                          name: receiverName.toUpperCase(),
                          network: selectedNetwork,
                          account: accountNumber,
                          initials: initials
                        });
                      }}
                      className="w-full bg-[#4f46e5] text-white py-[14px] rounded-full font-bold text-[15px] shadow-[0_4px_14px_rgba(0,143,205,0.4)] hover:bg-[#3730a3] active:scale-[0.98] transition-all"
                    >
                      Lanjutkan
                    </button>
                    <button 
                      onClick={() => setShowReceiverDetail(false)}
                      className="w-full bg-transparent text-[#4f46e5] py-1 rounded-full font-bold text-[15px] hover:bg-slate-50 active:scale-[0.98] transition-all mt-[-4px]"
                    >
                      Ubah Rekening
                    </button>
                 </div>
              </div>
            )}
          </div>
       )}

       {/* Network Select Overlay */}
       {showNetworkSelect && (
         <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in fade-in slide-in-from-right-8 duration-200">
           {/* Overlay Header */}
           <div className="w-full pt-12 pb-4 px-4 flex justify-center items-center relative shrink-0 bg-white border-b border-slate-100">
             <button onClick={() => setShowNetworkSelect(false)} className="absolute left-4 p-1 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200">
               <ArrowLeft className="text-slate-800" size={24} />
             </button>
             <h2 className="text-slate-800 font-bold text-[16px]">Daftar Network</h2>
           </div>

           <div className="flex-1 overflow-y-auto w-full">
             <div className="p-4">
                <div className="bg-[#f0f2f5] rounded-[16px] p-4 flex gap-3 items-start mb-4">
                   <div className="flex-shrink-0 mt-0.5">
                     <div className="w-4 h-4 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">i</div>
                   </div>
                   <div className="flex flex-col gap-1.5">
                      <p className="text-slate-800 font-bold text-[14px] leading-snug">Tidak yakin jaringan mana yang harus dipilih?</p>
                      <p className="text-slate-600 text-[13px] leading-snug">Pilih jaringan yang sesuai dengan jaringan pada platform penerima Anda.</p>
                      <div className="flex items-center gap-1 mt-1 cursor-pointer">
                        <span className="text-slate-800 font-bold text-[13px]">Selengkapnya</span>
                        <ArrowRight size={14} className="text-slate-800" strokeWidth={3} />
                      </div>
                   </div>
                </div>

                <div className="flex flex-col gap-6 mt-6 pb-12">
                   {[
                     { name: 'EVM (Arc Testnet)', fee: 'Biaya 0,0001 USDC (~$0,0001)', time: 'Estimasi waktu penerimaan: ~ 1 menit', logoBg: 'bg-[#4f46e5]', logoForeground: <Zap className="text-white fill-white scale-[1.2]" size={16} /> },
                     { name: 'X Layer (USDT0)', fee: 'Biaya 0,0022 USDT (~$0,0021)', time: 'Estimasi waktu penerimaan: ~ 2 menit', logoBg: 'bg-black', logoForeground: <div className="grid grid-cols-2 gap-[2px] w-[16px] h-[16px]"><div className="bg-white rounded-[2px]"></div><div className="bg-white rounded-[2px]" style={{opacity: 0}}></div><div className="bg-white rounded-[2px]"></div><div className="bg-white rounded-[2px]"></div></div>  },
                     { name: 'Tron (TRC20)', fee: 'Biaya 1,5 USDT (~$1,4992)', time: 'Estimasi waktu penerimaan: ~ 2 menit', logoBg: 'bg-[#db2e38]', logoForeground: <div className="border-[7px] border-transparent border-b-white transform -translate-y-1"></div> },
                     { name: 'Ethereum (ERC20)', fee: 'Biaya 0,18 USDT (~$0,1799)', time: 'Estimasi waktu penerimaan: ~ 2 menit', logoBg: 'bg-[#5e77db]', logoForeground: <div className="w-[12px] h-[18px] bg-white transform rotate-45 rounded-[2px] scale-y-[1.2] clip-path-rhombus" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'}}></div> },
                     { name: 'Aptos', fee: 'Biaya 0,0015 USDT (~$0,0014)', time: 'Estimasi waktu penerimaan: ~ 2 menit', logoBg: 'bg-black', logoForeground: <div className="flex flex-col gap-[3px] w-[20px]"><div className="h-[3px] bg-white rounded-full w-full"></div><div className="h-[3px] bg-white rounded-full w-[80%] ml-auto"></div><div className="h-[3px] bg-white rounded-full w-full"></div></div> },
                     { name: 'Arbitrum One (USDT0)', fee: 'Biaya 0,0029 USDT (~$0,0028)', time: 'Estimasi waktu penerimaan: ~ 2 menit', logoBg: 'bg-[#213a5b]', logoForeground: <div className="flex gap-1 items-end"><div className="w-[4px] h-[12px] bg-indigo-400 rounded-sm"></div><div className="w-[4px] h-[16px] bg-indigo-400 rounded-sm"></div><div className="w-[4px] h-[10px] bg-indigo-400 rounded-sm"></div></div> },
                     { name: 'Avalanche C-Chain', fee: 'Biaya 0,00043 USDT (~$0,0004)', time: 'Estimasi waktu penerimaan: ~ 2 menit', logoBg: 'bg-[#e84142]', logoForeground: <div className="border-[8px] border-transparent border-b-white rounded-[2px] transform scale-x-[0.8] -translate-y-[2px]"></div> }
                   ].map((net, idx) => (
                     <div key={idx} className="flex gap-4 cursor-pointer group px-1" onClick={() => { setSelectedNetwork(net.name); setShowNetworkSelect(false); }}>
                        <div className={`w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0 ${net.logoBg} mt-0.5 overflow-hidden border border-slate-100 shadow-sm transition-transform group-active:scale-95`}>
                           {net.logoForeground}
                        </div>
                        <div className="flex flex-col gap-[1px]">
                           <span className="font-semibold text-slate-800 text-[15.5px] tracking-tight">{net.name}</span>
                           <span className="text-slate-500 text-[13px]">{net.fee}</span>
                           <span className="text-slate-500 text-[13px]">{net.time}</span>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           </div>
         </div>
       )}
    </div>
  )
}

