import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Edit3, ChevronDown, ArrowRight, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useArc } from '../../contexts/ArcContext';
import { WalletCard } from '../common/WalletCard';

interface AmountInputScreenProps {
  contact: any;
  onBack: () => void;
  onNext: (amount: string, memo: string) => void;
}

export function AmountInputScreen({ contact, onBack, onNext }: AmountInputScreenProps) {
  const { registeredUser, balance, transferAmount, transferMemo } = useStore();
  const { getFeeEstimate } = useArc();
  const [amount, setAmount] = useState(transferAmount && transferAmount !== '0' ? transferAmount : '');
  const [memo, setMemo] = useState(transferMemo || '');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSourceSelect, setShowSourceSelect] = useState(false);
  const [feeDisplay, setFeeDisplay] = useState('~0.0001 USDC');
  const [isEditingMemo, setIsEditingMemo] = useState(false);

  // Fetch real fee estimate
  useEffect(() => {
    const fetchFee = async () => {
      const estimate = await getFeeEstimate(21000n);
      if (estimate) {
        setFeeDisplay(estimate.display);
      }
    };
    fetchFee();
  }, [getFeeEstimate]);

  // Derive real EVM Wallet address from store
  const accountStr = registeredUser?.walletAddress 
    ? `${registeredUser.walletAddress.substring(0, 6)}...${registeredUser.walletAddress.substring(registeredUser.walletAddress.length - 4)}` 
    : "0x00...0000";

  const currentSource = {
    id: 'source-arc',
    name: 'EVM (Arc Testnet)',
    account: registeredUser?.username ? `${registeredUser.username}'s Wallet` : accountStr,
    balance: new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(balance),
    dec: ' USDC',
    isArc: true 
  };
  
  const [selectedSource, setSelectedSource] = useState(currentSource);
  const sources = [currentSource];

  const numericAmount = amount ? parseFloat(amount) : 0;

  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full justify-center">
        <button onClick={onBack} className="absolute left-4 p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="font-bold text-[16px] text-white">INPUT AMOUNT</h2>
      </div>

      <div className="flex-1 overflow-y-auto w-full pb-32">
        {/* Target Contact */}
        <div className="flex flex-col items-center justify-center pt-8 pb-4">
          <div className="w-[52px] h-[52px] shadow-sm rounded-full bg-[#ecf5fc] flex items-center justify-center font-bold text-slate-800 text-[18px] shrink-0 mb-3 border border-[#ecf5fc]">
             {contact.initials}
          </div>
          <h2 className="text-slate-800 font-bold text-[16px] uppercase tracking-tight leading-tight text-center">{contact.name}</h2>
          <p className="text-slate-500 text-[13px] mt-[4px] text-center">{contact.bank || contact.network} - {contact.account}</p>
        </div>

        {/* Nominal */}
        <div className="px-6 py-4 border-b border-transparent">
          <label className={`${amount && numericAmount < 1 ? 'text-[#db2e38]' : amount ? 'text-slate-500' : 'text-slate-800'} text-[13px] font-medium mb-1 block`}>Amount</label>
          <div className={`flex items-center relative border-b pb-1 ${amount && numericAmount < 1 ? 'border-[#db2e38] border-b-[2px]' : amount ? 'border-slate-300' : 'border-slate-800 border-b-[2px]'}`}>
            <span className="text-[36px] font-medium text-slate-800 mr-2 tracking-tight">$</span>
            <input 
              type="number" 
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-[36px] font-medium text-slate-800 outline-none w-full bg-transparent tracking-tight relative z-10" 
              autoFocus
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
        <div className="px-6 py-3 flex flex-col items-center">
          {!isEditingMemo && !memo ? (
            <button 
              onClick={() => setIsEditingMemo(true)}
              className="flex items-center gap-2 text-slate-700 font-medium text-[14px] hover:text-slate-900 transition-colors py-1 cursor-pointer border-0 bg-transparent"
            >
              <Edit3 size={16} className="text-slate-500" /> Add Berita Acara / Memo
            </button>
          ) : (
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus-within:border-slate-400 transition-colors">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Berita Acara / Memo</span>
                <button onClick={() => { setMemo(''); setIsEditingMemo(false); }} className="text-slate-400 hover:text-slate-600 cursor-pointer border-0 bg-transparent">
                  <X size={14} />
                </button>
              </div>
              <input 
                type="text" 
                autoFocus={isEditingMemo}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Ex: Payment for groceries"
                className="w-full bg-transparent outline-none text-slate-700 text-[14px] font-medium"
              />
            </div>
          )}
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

        <div className="px-6 pt-10 pb-8">
           <button 
            onClick={() => setShowConfirm(true)}
            disabled={!amount || parseFloat(amount) < 1}
            className={`w-full py-[14px] rounded-full font-bold text-[15px] transition-all flex items-center justify-center gap-2
              ${amount && parseFloat(amount) >= 1 
                ? 'bg-slate-900 text-white shadow-lg hover:bg-slate-800 active:scale-[0.98]' 
                : 'bg-[#e5e7eb] text-[#9ca3af] shadow-none'}
            `}
          >
            Continue
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
                       <span className="text-slate-800 font-bold text-[14.5px]">{selectedSource.isArc ? `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericAmount)} USDC` : `Rp ${new Intl.NumberFormat('id-ID').format(numericAmount)}`}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-slate-600 text-[14.5px]">Metode Transfer</span>
                       <span className="text-slate-800 font-bold text-[14.5px]">{selectedSource.isArc ? 'Arc Testnet' : 'Arc Network'}</span>
                    </div>
                    {selectedSource.isArc ? (
                       <div className="flex flex-col gap-1 w-full bg-slate-100/50 p-2.5 rounded-xl border border-slate-200/50">
                          <div className="flex justify-between items-center">
                             <span className="text-slate-800 text-[14px] flex items-center gap-1.5"><div className="w-2 h-2 bg-slate-900 rounded-full animate-pulse"></div> Arc Native Gas</span>
                             <span className="text-[#008fcd] font-bold text-[14px]">{feeDisplay}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight">Gas paid natively in USDC. Arc deterministic 1-confirmation finality applies.</p>
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
                      onNext(amount, memo);
                   }}
                   className={`w-full text-white py-[14px] rounded-full flex justify-between px-6 items-center transition-all ${selectedSource.isArc ? 'bg-slate-900 hover:bg-slate-800 shadow-[0_4px_14px_rgba(63,162,246,0.4)]' : 'bg-slate-900 hover:bg-slate-800 shadow-lg'}`}
                 >
                    <span className="font-bold text-[15px]">Continue Transfer</span>
                    <div className="flex items-center gap-2">
                       <span className="font-bold text-[16px]">{selectedSource.isArc ? `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericAmount)} USDC` : `Rp ${new Intl.NumberFormat('id-ID').format(numericAmount + (numericAmount >= 100000 ? 0 : 6500))}`}</span>
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
                    className={`flex flex-col p-4 rounded-2xl border-[1.5px] cursor-pointer hover:bg-slate-50 transition-colors w-full ${selectedSource.id === src.id ? 'border-slate-900 bg-slate-100/10 shadow-[0_2px_10px_rgba(63,162,246,0.1)]' : 'border-slate-200 bg-white shadow-sm'}`}
                  >
                    <div className="flex justify-between items-start mb-2 w-full">
                      <span className={`font-bold text-[15px] text-left ${selectedSource.id === src.id ? 'text-slate-800' : 'text-slate-800'}`}>{src.name}</span>
                      {selectedSource.id === src.id && <CheckCircle2 size={20} className="text-slate-800 shrink-0" />}
                    </div>
                    <span className="text-slate-500 text-[13px] tracking-wide font-medium text-left w-full block">{src.account}</span>
                    <span className={`font-bold text-[14px] mt-2 text-left w-full block ${src.isArc ? 'text-slate-800' : 'text-[#008fcd]'}`}>{src.balance}<span className="text-[10px] align-top relative top-[1px]">{src.dec}</span></span>
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
