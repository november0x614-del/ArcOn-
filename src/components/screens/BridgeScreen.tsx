import React, { useState } from 'react';
import { ArrowLeft, ArrowLeftRight, CheckCircle2, Loader2, ChevronRight, Info, AlertCircle, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { ArcAppKitAdapter } from '../../services/arc-app-kit/adapter';

interface BridgeScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

const NETWORKS = [
  { id: 'arc', name: 'Arc Testnet', icon: <Globe size={16} />, color: 'bg-blue-600' },
  { id: 'ethereum', name: 'Ethereum Sepolia', icon: <Globe size={16} />, color: 'bg-indigo-500' },
  { id: 'polygon', name: 'Polygon Amoy', icon: <Globe size={16} />, color: 'bg-purple-600' },
  { id: 'base', name: 'Base Sepolia', icon: <Globe size={16} />, color: 'bg-blue-400' },
];

export function BridgeScreen({ onBack, onSuccess }: BridgeScreenProps) {
  const { balance, fetchBalance, fetchTransactions, displayToast, registeredUser } = useApp();
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [amount, setAmount] = useState('');
  const [fromNetwork, setFromNetwork] = useState(NETWORKS[0]);
  const [toNetwork, setToNetwork] = useState(NETWORKS[1]);
  const [showNetworkSelect, setShowNetworkSelect] = useState<'from' | 'to' | null>(null);

  const handleBridge = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      displayToast("Please enter a valid amount.");
      return;
    }
    if (numAmount > balance) {
      displayToast("Insufficient balance.");
      return;
    }

    setStep('processing');
    
    try {
      const result = await ArcAppKitAdapter.executeBridge(
        numAmount,
        fromNetwork.name,
        toNetwork.name
      );
      
      await fetchBalance();
      await fetchTransactions();
      
      setStep('success');
    } catch (error) {
       console.error("Bridge failed", error);
       displayToast("Bridge failed");
       setStep('form');
    }
  };

  if (step === 'processing') {
    return (
      <div className="absolute inset-0 bg-white z-[70] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
        <div className="relative mb-8">
           <Loader2 className="animate-spin text-[#3FA2F6]" size={64} />
           <div className="absolute inset-0 flex items-center justify-center">
              <ArrowLeftRight size={24} className="text-[#3FA2F6] opacity-50" />
           </div>
        </div>
        <h3 className="text-[20px] font-black text-slate-900 mb-2">Cross-Chain Bridge</h3>
        <p className="text-slate-500 text-[14px] max-w-[280px]">
           Locking assets on {fromNetwork.name} and minting synthetic USDC on {toNetwork.name}...
        </p>
        <div className="mt-8 w-full max-w-[240px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
           <motion.div 
             initial={{ width: 0 }} 
             animate={{ width: '100%' }} 
             transition={{ duration: 3, ease: "linear" }}
             className="h-full bg-[#3FA2F6]" 
           />
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="absolute inset-0 bg-white z-[70] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 shadow-sm shadow-emerald-100">
          <CheckCircle2 size={40} />
        </div>
        <h3 className="text-[24px] font-black text-slate-900 mb-2 tracking-tight">Bridge Successful!</h3>
        <p className="text-slate-500 text-[15px] mb-8 leading-relaxed">
          Your bridge of <span className="font-extrabold text-slate-900">{parseFloat(amount).toFixed(2)} USDC</span> from <span className="font-bold text-slate-700">{fromNetwork.name}</span> to <span className="font-bold text-slate-700">{toNetwork.name}</span> has been broadcasted.
        </p>
        <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-8 text-left">
           <div className="flex justify-between items-center mb-2">
              <span className="text-[12px] font-bold text-slate-400">Transaction ID</span>
              <span className="text-[12px] font-mono font-bold text-[#3FA2F6]">0x1a2b...3c4d</span>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-[12px] font-bold text-slate-400">Estimated Arrival</span>
              <span className="text-[12px] font-bold text-emerald-600">~2-5 Minutes</span>
           </div>
        </div>
        <button 
          onClick={onSuccess}
          className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-black text-[16px] shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[70] bg-[#f8fafc] flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 pt-12 pb-4 bg-white border-b border-slate-100 shadow-sm relative z-10 shrink-0">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors bg-transparent border-0 cursor-pointer mr-3">
          <ArrowLeft size={24} className="text-slate-700" />
        </button>
        <h3 className="font-black text-[18px] text-slate-800 tracking-tight">Bridge Assets (USDC)</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-32 scrollbar-hide">
        {/* Network Selection Dashboard */}
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 mb-6 flex flex-col gap-6 relative">
          
          <div className="flex flex-col gap-2">
             <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Transfer From</label>
             <button 
               onClick={() => setShowNetworkSelect('from')}
               className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-[#3FA2F6] transition-colors"
             >
                <div className="flex items-center gap-3">
                   <div className={`w-8 h-8 ${fromNetwork.color} rounded-lg flex items-center justify-center text-white`}>
                      {fromNetwork.icon}
                   </div>
                   <span className="font-bold text-slate-800">{fromNetwork.name}</span>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
             </button>
          </div>

          {/* Swap Button In-Between */}
          <div className="absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 z-10">
             <button 
               onClick={() => {
                  const temp = fromNetwork;
                  setFromNetwork(toNetwork);
                  setToNetwork(temp);
               }}
               className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[#3FA2F6] shadow-md hover:rotate-180 transition-transform duration-500 active:scale-90"
             >
                <ArrowLeftRight size={18} />
             </button>
          </div>

          <div className="flex flex-col gap-2">
             <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Destination Bridge</label>
             <button 
               onClick={() => setShowNetworkSelect('to')}
               className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-[#3FA2F6] transition-colors"
             >
                <div className="flex items-center gap-3">
                   <div className={`w-8 h-8 ${toNetwork.color} rounded-lg flex items-center justify-center text-white`}>
                      {toNetwork.icon}
                   </div>
                   <span className="font-bold text-slate-800">{toNetwork.name}</span>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
             </button>
          </div>
        </div>

        {/* Amount Input Section */}
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 mb-6 text-left">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-3 block">Amount to Bridge</label>
          <div className="relative">
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-5 text-[28px] font-black text-slate-900 outline-none focus:border-[#3FA2F6] transition-all placeholder:text-slate-200"
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
               <span className="font-black text-slate-400">USDC</span>
            </div>
          </div>
          
          <div className="flex justify-between mt-3 px-1">
            <span className="text-[12px] text-slate-500 font-medium">Balance on {fromNetwork.name}: <span className="font-black text-[#3FA2F6]">{balance.toFixed(2)} USDC</span></span>
            <button 
              onClick={() => setAmount(balance.toString())}
              className="text-[12px] font-black text-[#3FA2F6] bg-transparent border-0 cursor-pointer hover:underline"
            >
              Max
            </button>
          </div>
        </div>

        {/* Fee Summary */}
        <div className="bg-slate-900 rounded-[24px] p-5 mb-10 text-white shadow-xl">
           <div className="flex justify-between items-center mb-4">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Bridge Details</span>
              <AlertCircle size={14} className="text-slate-500" />
           </div>
           <div className="space-y-3">
              <div className="flex justify-between items-center">
                 <span className="text-[13px] text-slate-300">Cross-chain Fee</span>
                 <span className="text-[13px] font-bold text-emerald-400">0.00 USDC</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[13px] text-slate-300">Relayer Gas Est.</span>
                 <span className="text-[13px] font-bold text-slate-300">~0.012 USDC</span>
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                 <span className="text-[14px] font-bold">Total Payout</span>
                 <span className="text-[16px] font-black text-[#3FA2F6]">
                    {amount ? (parseFloat(amount) - 0.012).toFixed(2) : '0.00'} USDC
                 </span>
              </div>
           </div>
        </div>

        {/* Info Tip */}
        <div className="flex gap-3 px-2">
           <div className="text-amber-500 shrink-0">
              <Info size={18} />
           </div>
           <p className="text-[12px] text-slate-500 leading-relaxed">
              Bridging assets between L1/L2 and Arc Network requires a security settlement window. Assets will be automatically deposited to your destination wallet address.
           </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 z-20 shadow-2xl">
        <button 
          onClick={handleBridge}
          className="w-full bg-[#3FA2F6] text-white py-4.5 rounded-full font-black text-[16px] shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-[0.98] border-0 cursor-pointer flex items-center justify-center gap-2"
        >
          Initiate Cross-Chain Bridge
        </button>
      </div>

      {/* Network Select Modal */}
      {showNetworkSelect && (
        <div className="absolute inset-0 z-[80] bg-black/40 flex items-end animate-in fade-in duration-300">
           <motion.div 
             initial={{ y: '100%' }}
             animate={{ y: 0 }}
             className="w-full bg-white rounded-t-[32px] p-6 pb-12 max-h-[70%] overflow-y-auto"
           >
              <div className="flex justify-between items-center mb-6">
                 <h4 className="font-black text-[20px] text-slate-800">Select Network</h4>
                 <button 
                   onClick={() => setShowNetworkSelect(null)}
                   className="p-2 bg-slate-50 rounded-full text-slate-400"
                 >
                    <X size={20} />
                 </button>
              </div>
              <div className="flex flex-col gap-3">
                 {NETWORKS.map(net => (
                    <button 
                      key={net.id}
                      onClick={() => {
                         if (showNetworkSelect === 'from') setFromNetwork(net);
                         else setToNetwork(net);
                         setShowNetworkSelect(null);
                      }}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                         (showNetworkSelect === 'from' ? fromNetwork.id : toNetwork.id) === net.id
                            ? 'border-[#3FA2F6] bg-blue-50/50'
                            : 'border-slate-50 bg-white hover:border-slate-100'
                      }`}
                    >
                       <div className={`w-10 h-10 ${net.color} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                          {net.icon}
                       </div>
                       <div className="flex-1 text-left">
                          <p className="font-black text-slate-800">{net.name}</p>
                          <p className="text-[12px] text-slate-400">Supported by Circle Bridge Protocol</p>
                       </div>
                    </button>
                 ))}
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
}

function X({ size }: { size: number }) {
   return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
         <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
      </svg>
   )
}
