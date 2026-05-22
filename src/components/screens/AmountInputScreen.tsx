import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Edit3, ChevronDown, ArrowRight, X, Delete } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface AmountInputScreenProps {
  contact: any;
  onBack: () => void;
  onNext: (amount: string) => void;
}

export function AmountInputScreen({ contact, onBack, onNext }: AmountInputScreenProps) {
  const { sourceAccount } = useStore();
  const [amount, setAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSourceSelect, setShowSourceSelect] = useState(false);

  const currentSource = {
    id: 'source-1',
    name: sourceAccount.name,
    account: sourceAccount.accountNumber,
    balance: new Intl.NumberFormat('id-ID').format(sourceAccount.balance),
    dec: '00',
    isArc: false 
  };
  const [selectedSource, setSelectedSource] = useState(currentSource);
  const sources = [currentSource];

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

      <div className="flex-1 overflow-y-auto w-full pb-[380px]">
        {/* Nominal */}
        <div className="px-6 py-6 border-b border-transparent">
          <label className={`${amount && numericAmount < 10000 ? 'text-[#db2e38]' : amount ? 'text-slate-500' : 'text-[#008fcd]'} text-[13px] font-medium mb-1 block`}>Amount</label>
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
          <label className="text-slate-400 text-[12px] mb-2 block font-medium text-left">Source Account</label>
          <div 
            className="bg-white border border-slate-200 rounded-[12px] p-4 flex justify-between shadow-sm overflow-hidden relative min-h-[96px] cursor-pointer hover:border-[#3FA2F6] transition-colors"
            onClick={() => setShowSourceSelect(true)}
          >
            <div className="flex flex-col z-10 w-[70%] bg-white/80 backdrop-blur-sm pr-2">
              <div className="flex items-center gap-1.5 mb-1 text-left">
                <span className="font-bold text-slate-800 text-[15px]">{selectedSource.name}</span>
                {!selectedSource.isArc && <CheckCircle2 size={16} className="text-[#008fcd] fill-[#e6f4fc]" strokeWidth={2.5} />}
              </div>
              <span className="text-slate-500 text-[13.5px] tracking-wide font-medium block text-left">{selectedSource.account}</span>
              <span className={`${selectedSource.isArc ? 'text-blue-600' : 'text-[#008fcd]'} font-bold text-[15px] mt-1.5 block text-left`}>{selectedSource.balance}<span className="text-[10px] align-top relative top-[2px]">{selectedSource.dec}</span></span>
            </div>
            
            {/* The absolute right part containing the wallet card style */}
            <div className="absolute right-0 top-2 bottom-2 w-[40%] rounded-l-[16px] shadow-xl relative overflow-hidden shrink-0 flex flex-col justify-between p-2 bg-white border-l border-t border-b border-slate-100">
               {/* Reference: Minimalist Background with Blue or Gold Accent based on card */}
               <div className={`absolute top-0 right-0 w-[60%] h-[120%] border-[2px] ${selectedSource.isArc ? 'border-blue-600/10' : 'border-[#d4c085]/20'} rounded-full pointer-events-none rotate-12 translate-x-1/2 -translate-y-1/3`}></div>

               <div className="flex justify-between items-start relative z-10">
                 <div className="flex items-center gap-1">
                   <div className={`w-2 h-2 rounded-[2px] ${selectedSource.isArc ? 'bg-blue-600' : 'bg-[#d4c085]'} flex items-center justify-center`}>
                     <div className="w-1 h-1 rounded-full border-[1px] border-white"></div>
                   </div>
                   <span className="text-slate-900 font-bold text-[6px] tracking-tight italic select-none leading-none">arc</span>
                 </div>
                 
                 <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-[0.2px]">
                       <div className="w-[1px] h-[1px] bg-slate-900 rounded-[0.2px]"></div>
                       <div className="w-[1px] h-[1px] bg-slate-200 rounded-[0.2px]"></div>
                    </div>
                 </div>
               </div>

               <div className="flex flex-col relative z-10 mt-1">
                  <span className="text-[7px] font-mono text-slate-900 tracking-wide font-medium leading-none truncate">
                    {selectedSource.account.slice(0, 8)}
                  </span>
               </div>
               
               <div className="flex justify-between items-end relative z-10 mt-auto">
                  <span className="text-slate-900 font-bold text-[6px] uppercase tracking-tighter leading-none">{selectedSource.name.slice(0, 8)}</span>
                  <span className="text-[4px] font-mono text-slate-400 select-none">05/30</span>
               </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="px-6 py-3 flex justify-center">
          <button className="flex items-center gap-2 text-slate-700 font-medium text-[14px] hover:text-slate-900 transition-colors">
            <Edit3 size={16} className="text-slate-500" /> Add Note
          </button>
        </div>

        {/* Options */}
        <div className="px-6 py-2">
          <div className="border-t border-slate-100 pt-6 pb-2">
            <div className="flex justify-between items-center border border-slate-200 rounded-[12px] p-4 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex flex-col text-left">
                <span className="text-slate-400 text-[12px] mb-1 font-medium">Metode Transfer</span>
                <span className="text-slate-800 font-bold text-[15px]">Arc Network</span>
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
            Continue
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
             <Delete size={24} strokeWidth={2.5} className="ml-1"/>
           </button>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="absolute inset-0 z-50 bg-black/40 flex flex-col justify-end transition-opacity overflow-hidden">
           <div className="bg-white rounded-t-[24px] w-full flex flex-col relative max-h-[95%] shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="px-5 pt-6 pb-4 flex justify-between items-center border-b border-slate-100">
                 <h3 className="font-bold text-[18px] text-slate-800">Transfer Confirmation</h3>
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
                       <span className="text-slate-600 text-[14.5px]">Transfer Amount</span>
                       <span className="text-slate-800 font-bold text-[14.5px]">{selectedSource.isArc ? `${new Intl.NumberFormat('en-US').format(numericAmount)} USDC` : `Rp ${new Intl.NumberFormat('id-ID').format(numericAmount)}`}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-slate-600 text-[14.5px]">Metode Transfer</span>
                       <span className="text-slate-800 font-bold text-[14.5px]">{selectedSource.isArc ? 'Arc Testnet' : 'Arc Network'}</span>
                    </div>
                    {selectedSource.isArc ? (
                       <div className="flex flex-col gap-1 w-full bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50">
                          <div className="flex justify-between items-center">
                             <span className="text-blue-600 text-[14px] flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div> Network Gas Fee</span>
                             <span className="text-blue-800 font-bold text-[14px]">{(Math.random() * 0.005 + 0.001).toFixed(4)} USDC</span>
                          </div>
                          <span className="text-[11px] text-blue-400">Dynamic fee simulated based on current Arc Testnet load.</span>
                       </div>
                    ) : (
                       <div className="flex justify-between items-center">
                          <span className="text-slate-600 text-[14.5px]">Transaction Fee</span>
                          {numericAmount >= 100000 ? (
                             <>
                                <span className="line-through text-slate-400 text-[14px] mr-2">Rp 6.500</span>
                                <span className="text-green-600 font-bold text-[14.5px]">FREE</span>
                             </>
                          ) : (
                             <span className="text-slate-800 font-bold text-[14.5px]">Rp 6.500</span>
                          )}
                       </div>
                    )}
                 </div>

                 <div className="h-[1px] bg-slate-100 w-full mb-6"></div>

                 {/* Rekening Sumber inside Confirm */}
                 <label className="text-slate-500 text-[14.5px] mb-2 block text-left">Source Account</label>
                 <div className="bg-slate-50 border border-slate-100 rounded-[12px] p-4 flex flex-col gap-0.5 text-left">
                    <span className="font-bold text-slate-800 text-[14.5px]">{selectedSource.name} - {selectedSource.account}</span>
                    <span className="text-slate-500 text-[13px]">{selectedSource.balance}<span className="text-[9px] align-top relative top-[1px]">{selectedSource.dec}</span></span>
                 </div>
              </div>

              {/* Bottom Confirm Action */}
              <div className="px-5 py-5 bg-white shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] border-t border-slate-100">
                 <button 
                   onClick={() => {
                      if (selectedSource.isArc && numericAmount > 100) {
                          // Handle biometric requirement hook? It's easier to handle biometric inside App.tsx or just proceed
                          // But we can just proceed for simplicity, or we can use onNext which passes through `TransferScreen` to `App`.
                          // Wait, App just does `setViewState('processing')`.
                      }
                      onNext(amount);
                   }}
                   className={`w-full text-white py-[14px] rounded-full flex justify-between px-6 items-center transition-all ${selectedSource.isArc ? 'bg-[#3FA2F6] hover:bg-blue-600 shadow-[0_4px_14px_rgba(63,162,246,0.4)]' : 'bg-[#008fcd] hover:bg-[#007dba] shadow-[0_4px_14px_rgba(0,143,205,0.4)]'}`}
                 >
                    <span className="font-bold text-[15px]">Continue Transfer</span>
                    <div className="flex items-center gap-2">
                       <span className="font-bold text-[16px]">{selectedSource.isArc ? `${new Intl.NumberFormat('en-US').format(numericAmount)} USDC` : `Rp ${new Intl.NumberFormat('id-ID').format(numericAmount + (numericAmount >= 100000 ? 0 : 6500))}`}</span>
                       <div className="bg-white/20 p-1 rounded-full">
                         <ArrowRight size={16} strokeWidth={3} />
                       </div>
                    </div>
                 </button>
              </div>
           </div>
        </div>
      )}
      {/* Source Account Selection Modal */}
      {showSourceSelect && (
        <div className="absolute inset-0 z-[60] bg-black/40 flex flex-col justify-end transition-opacity overflow-hidden">
           <div className="bg-white rounded-t-[24px] w-full flex flex-col relative max-h-[80%] shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="px-5 pt-6 pb-4 flex justify-between items-center border-b border-slate-100">
                 <h3 className="font-bold text-[18px] text-slate-800">Select Source Account</h3>
                 <button onClick={() => setShowSourceSelect(false)} className="text-slate-400 p-1 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200 bg-transparent border-0">
                   <X size={24} strokeWidth={2.5}/>
                 </button>
              </div>
              
              <div className="p-5 flex flex-col gap-3 overflow-y-auto w-full pb-10">
                {sources.map(src => (
                  <div 
                    key={src.id}
                    onClick={() => {
                      setSelectedSource(src);
                      setShowSourceSelect(false);
                    }}
                    className={`flex flex-col p-4 rounded-2xl border-[1.5px] cursor-pointer hover:bg-slate-50 transition-colors w-full ${selectedSource.id === src.id ? 'border-[#3FA2F6] bg-blue-50/10 shadow-[0_2px_10px_rgba(63,162,246,0.1)]' : 'border-slate-200 bg-white shadow-sm'}`}
                  >
                    <div className="flex justify-between items-start mb-2 w-full">
                      <span className={`font-bold text-[15px] text-left ${selectedSource.id === src.id ? 'text-[#3FA2F6]' : 'text-slate-800'}`}>{src.name}</span>
                      {selectedSource.id === src.id && <CheckCircle2 size={20} className="text-[#3FA2F6] shrink-0" />}
                    </div>
                    <span className="text-slate-500 text-[13px] tracking-wide font-medium text-left w-full block">{src.account}</span>
                    <span className={`font-bold text-[14px] mt-2 text-left w-full block ${src.isArc ? 'text-blue-600' : 'text-[#008fcd]'}`}>{src.balance}<span className="text-[10px] align-top relative top-[1px]">{src.dec}</span></span>
                  </div>
                ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
export default AmountInputScreen;
