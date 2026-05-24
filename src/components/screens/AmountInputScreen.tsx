import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Edit3, ChevronDown, ArrowRight, X, Delete } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { truncateAddress, formatCurrency, cn } from '../../lib/utils';
import { WalletCard } from '../common/WalletCard';

export function AmountInputScreen({ contact, onBack, onNext }: AmountInputScreenProps) {
  const { registeredUser, balance, transferAmount } = useStore();
  const [amount, setAmount] = useState(transferAmount && transferAmount !== '0' ? transferAmount : '');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSourceSelect, setShowSourceSelect] = useState(false);

  // Use real wallet address if available, or a formatted placeholder
  const walletAddr = registeredUser?.walletAddress || "0x0000000000000000000000000000000000000000";
  const displayWallet = truncateAddress(walletAddr, 6, 4);

  const currentSource = {
    id: 'source-arc',
    name: 'EVM (Arc Testnet)',
    account: registeredUser?.username ? `${registeredUser.username}'s Wallet` : displayWallet,
    balance: balance.toString(),
    currency: 'USDC',
    isArc: true 
  };
  
  const [selectedSource, setSelectedSource] = useState(currentSource);
  const sources = [currentSource];

  const handleNumpad = (num: string) => {
    if (num === 'backspace') {
      setAmount(prev => prev.slice(0, -1));
    } else if (num === '.') {
      if (!amount.includes('.')) {
         setAmount(prev => prev === '' ? '0.' : prev + '.');
      }
    } else {
      setAmount(prev => prev + num);
    }
  };

  const formattedAmount = amount || '0';
  const numericAmount = amount ? parseFloat(amount) : 0;

  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50">
      {/* Header */}
      <div className="w-full pt-12 pb-4 px-4 flex items-center shadow-sm relative z-10 shrink-0 bg-white border-b border-slate-100">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors absolute left-4 z-20">
          <ArrowLeft className="text-slate-700" size={24} />
        </button>
        <div className="flex flex-col items-center justify-center flex-1 px-12 min-w-0">
          <h2 className="text-slate-800 font-bold text-[15px] uppercase tracking-tight leading-tight truncate w-full text-center">{contact.name}</h2>
          <p className="text-slate-500 text-[11px] mt-[2px] truncate w-full text-center font-mono">
            {contact.bank || contact.network} • {truncateAddress(contact.account, 10, 8)}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full pb-[380px]">
        {/* Nominal */}
        <div className="px-6 py-6 border-b border-transparent">
          <label className={`${amount && numericAmount < 1 ? 'text-[#db2e38]' : amount ? 'text-slate-500' : 'text-[#008fcd]'} text-[13px] font-medium mb-1 block`}>Amount</label>
          <div className={`flex items-center relative border-b pb-1 ${amount && numericAmount < 1 ? 'border-[#db2e38] border-b-[2px]' : amount ? 'border-slate-300' : 'border-[#008fcd] border-b-[2px]'}`}>
            <span className="text-[36px] font-medium text-slate-800 mr-2 tracking-tight">$</span>
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
          {amount && numericAmount < 1 ? (
             <p className="text-[#db2e38] text-[12px] font-medium mt-1.5 leading-none">Minimum transfer $1 USDC</p>
          ) : (
             <div className="h-[18px]"></div>
          )}
        </div>

        {/* Source Account */}
        <div className="px-6 py-4">
          <label className="text-slate-400 text-[12px] mb-2 block font-medium text-left">Source Account</label>
          <WalletCard 
            userName={registeredUser?.username || "Guest"} 
            onClick={() => setShowSourceSelect(true)}
            className="!mb-0"
          />
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
            disabled={!amount || parseFloat(amount) < 1}
            className={`w-full py-[14px] rounded-full font-bold text-[15px] transition-all flex items-center justify-center gap-2
              ${amount && parseFloat(amount) >= 1 
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
           <button onClick={() => handleNumpad('.')} className="h-12 bg-[#f8fafc] rounded-xl text-slate-700 font-semibold text-[20px] active:bg-slate-200 transition-colors flex items-center justify-center">.</button>
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
                       <span className="text-slate-500 text-[13px] truncate">{contact.bank || contact.network} - {truncateAddress(contact.account, 10, 8)}</span>
                    </div>
                 </div>

                 {/* Detail Table */}
                 <div className="flex flex-col gap-3.5 mb-6 text-left">
                    <div className="flex justify-between items-center">
                       <span className="text-slate-600 text-[14.5px]">Transfer Amount</span>
                       <span className="text-slate-800 font-bold text-[14.5px]">{formatCurrency(numericAmount)}</span>
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
                          <span className="text-[11px] text-blue-400">Dynamic fee based on current Arc Testnet load.</span>
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
                    <span className="text-slate-500 text-[13px] font-mono">{formatCurrency(selectedSource.balance)}</span>
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
                    <span className="font-bold text-[15px]">Lanjutkan Transfer</span>
                    <div className="flex items-center gap-2">
                       <span className="font-bold text-[16px]">{formatCurrency(numericAmount)}</span>
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
                    <span className="text-slate-500 text-[13px] tracking-wide font-medium text-left w-full block font-mono">{src.account}</span>
                    <span className="font-bold text-[14px] mt-2 text-left w-full block text-blue-600 font-mono">{formatCurrency(src.balance)}</span>
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
