import React, { useState } from 'react';
import { ArrowLeft, ArrowLeftRight, CheckCircle2, Loader2, ChevronRight, Info, AlertCircle, Globe, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { ArcAppKitAdapter } from '../../services/arc-app-kit/adapter';

interface BridgeScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

const NETWORKS = [
  { id: 'arc', name: 'Arc Testnet', icon: <Globe size={16} />, color: 'bg-slate-800', domain: 26 },
  { id: 'ethereum', name: 'Ethereum Sepolia', icon: <Globe size={16} />, color: 'bg-indigo-500', domain: 0 },
  { id: 'base', name: 'Base Sepolia', icon: <Globe size={16} />, color: 'bg-blue-400', domain: 6 },
  { id: 'avalanche', name: 'Avalanche Fuji', icon: <Globe size={16} />, color: 'bg-red-500', domain: 1 },
];

export function BridgeScreen({ onBack, onSuccess }: BridgeScreenProps) {
  const { balance, fetchBalance, fetchTransactions, displayToast, registeredUser } = useApp();
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [mode, setMode] = useState<'outbound' | 'inbound'>('outbound');
  const [processingPhase, setProcessingPhase] = useState<'broadcasting' | 'attesting' | 'claiming'>('broadcasting');
  const [amount, setAmount] = useState('');
  const [sourceTxHash, setSourceTxHash] = useState('');
  const [fromNetwork, setFromNetwork] = useState(NETWORKS[1]); // Default From: Ethereum
  const [toNetwork, setToNetwork] = useState(NETWORKS[0]);   // Default To: Arc
  const [showNetworkSelect, setShowNetworkSelect] = useState<'from' | 'to' | null>(null);

  const handleBridge = async () => {
    if (mode === 'outbound') {
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
      setProcessingPhase('broadcasting');
      
      try {
        await ArcAppKitAdapter.bridgeTokenCCTP(
          numAmount,
          registeredUser?.walletAddress || "",
          toNetwork.domain
        );

        setProcessingPhase('attesting');
        // Circle Attestation takes time
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await fetchBalance();
        await fetchTransactions();
        setStep('success');
      } catch (error: any) {
         console.error("Outbound Bridge failed", error);
         displayToast(error.message || "CCTP Bridge failed");
         setStep('form');
      }
    } else {
      // Inbound Bridge (Claim)
      if (!sourceTxHash) {
        displayToast("Please enter the source transaction hash.");
        return;
      }

      setStep('processing');
      setProcessingPhase('claiming');

      try {
        const response = await fetch('/api/bridge/inbound/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: registeredUser?.supabaseUid,
            sourceTxHash,
            sourceChainRpc: "" // Optional
          })
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Claim failed");
        }

        await fetchBalance();
        await fetchTransactions();
        setStep('success');
      } catch (error: any) {
        console.error("Inbound Bridge Claim failed", error);
        displayToast(error.message || "Claim failed");
        setStep('form');
      }
    }
  };

  if (step === 'processing') {
    return (
      <div className="absolute inset-0 bg-white z-[70] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
        <div className="relative mb-8">
           <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
              <div className="relative">
                 <Loader2 className="animate-spin text-slate-800" size={64} />
                 {(processingPhase === 'attesting' || processingPhase === 'claiming') && (
                    <div className="absolute inset-0 flex items-center justify-center">
                       <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>
                 )}
              </div>
           </div>
        </div>
        <h3 className="text-[20px] font-black text-slate-900 mb-2">
           {processingPhase === 'broadcasting' ? 'Broadcasting to Arc' : 
            processingPhase === 'attesting' ? 'Circle Attestation' : 'Claiming on Arc'}
        </h3>
        <p className="text-slate-500 text-[14px] max-w-[280px]">
           {processingPhase === 'broadcasting' 
             ? `Executing 1-confirmation finality burn on Arc...`
             : processingPhase === 'attesting'
             ? `Waiting for Circle's CCTP Attestation to Domain ${toNetwork.domain}...`
             : `Submitting receiveMessage and minting USDC on Arc...`
           }
        </p>
        <div className="mt-8 w-full max-w-[240px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
           <motion.div 
             initial={{ width: 0 }} 
             animate={{ width: processingPhase === 'broadcasting' ? '40%' : '100%' }} 
             transition={{ duration: 2, ease: "linear" }}
             className="h-full bg-slate-800" 
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
        <h3 className="text-[24px] font-black text-slate-900 mb-2 tracking-tight">Success!</h3>
        <p className="text-slate-500 text-[15px] mb-8 leading-relaxed">
          {mode === 'outbound' 
            ? `Your bridge of ${parseFloat(amount).toFixed(2)} USDC from Arc to ${toNetwork.name} has been initiated.`
            : `Your inbound deposit from ${fromNetwork.name} has been successfully claimed on Arc.`
          }
        </p>
        <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-8 text-left">
           <div className="flex justify-between items-center mb-2">
              <span className="text-[12px] font-bold text-slate-400">Status</span>
              <span className="text-[12px] font-bold text-emerald-600">Completed</span>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-[12px] font-bold text-slate-400">Network</span>
              <span className="text-[12px] font-bold text-slate-800">Arc Testnet</span>
           </div>
        </div>
        <button 
          onClick={onSuccess}
          className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-black text-[16px] shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] cursor-pointer border-0"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[70] bg-[#f8fafc] flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 shrink-0">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h3 className="font-bold text-[16px] text-white ml-2">CCTP BRIDGE</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-32 scrollbar-hide">
        {/* Mode Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
           <button 
             onClick={() => {
                setMode('outbound');
                setFromNetwork(NETWORKS[0]);
                setToNetwork(NETWORKS[1]);
             }}
             className={`flex-1 py-3 rounded-xl font-black text-[14px] transition-all border-0 cursor-pointer ${mode === 'outbound' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 bg-transparent'}`}
           >
              Outbound (From Arc)
           </button>
           <button 
             onClick={() => {
                setMode('inbound');
                setFromNetwork(NETWORKS[1]);
                setToNetwork(NETWORKS[0]);
             }}
             className={`flex-1 py-3 rounded-xl font-black text-[14px] transition-all border-0 cursor-pointer ${mode === 'inbound' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 bg-transparent'}`}
           >
              Inbound (To Arc)
           </button>
        </div>

        {/* Network Selection Dashboard */}
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 mb-6 flex flex-col gap-6 relative">
          
          <div className="flex flex-col gap-2">
             <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Source Network</label>
             <button 
               onClick={() => { if (mode === 'inbound') setShowNetworkSelect('from'); }}
               disabled={mode === 'outbound'}
               className={`w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl transition-colors ${mode === 'inbound' ? 'hover:border-slate-400 cursor-pointer' : 'opacity-80'}`}
             >
                <div className="flex items-center gap-3">
                   <div className={`w-8 h-8 ${fromNetwork.color} rounded-lg flex items-center justify-center text-white`}>
                      {fromNetwork.icon}
                   </div>
                   <span className="font-bold text-slate-800">{fromNetwork.name}</span>
                </div>
                {mode === 'inbound' && <ChevronRight size={18} className="text-slate-300" />}
             </button>
          </div>

          {/* Icon In-Between */}
          <div className="absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 z-10">
             <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 shadow-sm">
                <ArrowLeftRight size={18} />
             </div>
          </div>

          <div className="flex flex-col gap-2">
             <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Destination Network</label>
             <button 
               onClick={() => { if (mode === 'outbound') setShowNetworkSelect('to'); }}
               disabled={mode === 'inbound'}
               className={`w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl transition-colors ${mode === 'outbound' ? 'hover:border-slate-400 cursor-pointer' : 'opacity-80'}`}
             >
                <div className="flex items-center gap-3">
                   <div className={`w-8 h-8 ${toNetwork.color} rounded-lg flex items-center justify-center text-white`}>
                      {toNetwork.icon}
                   </div>
                   <span className="font-bold text-slate-800">{toNetwork.name}</span>
                </div>
                {mode === 'outbound' && <ChevronRight size={18} className="text-slate-300" />}
             </button>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 mb-6 text-left">
          {mode === 'outbound' ? (
            <>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-3 block">Amount to Bridge</label>
              <div className="relative">
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-5 text-[28px] font-black text-slate-900 outline-none focus:border-slate-400 transition-all placeholder:text-slate-200"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                   <span className="font-black text-slate-400">USDC</span>
                </div>
              </div>
              <div className="flex justify-between mt-3 px-1">
                <span className="text-[12px] text-slate-500 font-medium">Arc Balance: <span className="font-black text-slate-800">{balance.toFixed(2)} USDC</span></span>
                <button 
                  onClick={() => setAmount(balance.toString())}
                  className="text-[12px] font-black text-slate-600 bg-transparent border-0 cursor-pointer hover:underline"
                >
                  Max
                </button>
              </div>
            </>
          ) : (
            <>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 mb-3 block">Source Transaction Hash</label>
              <div className="relative">
                <input 
                  type="text"
                  value={sourceTxHash}
                  onChange={(e) => setSourceTxHash(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-5 text-[14px] font-mono font-bold text-slate-900 outline-none focus:border-slate-400 transition-all placeholder:text-slate-200"
                />
              </div>
              <p className="mt-3 text-[11px] text-slate-400 font-medium px-1 italic">
                Enter the burn transaction hash (CCTP) from {fromNetwork.name} to claim your funds on Arc.
              </p>
            </>
          )}
        </div>

        {/* Fee Summary / Info */}
        {mode === 'outbound' ? (
          <div className="bg-slate-900 rounded-[24px] p-5 mb-10 text-white shadow-xl">
             <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Bridge Details</span>
                <AlertCircle size={14} className="text-slate-500" />
             </div>
             <div className="space-y-3">
                <div className="flex justify-between items-center">
                   <span className="text-[13px] text-slate-300">Target Chain</span>
                   <span className="text-[13px] font-bold text-slate-100">{toNetwork.name}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[13px] text-slate-300">CCTP Fee</span>
                   <span className="text-[13px] font-bold text-emerald-400">0.00 USDC</span>
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                   <span className="text-[14px] font-bold">Arc Settlement</span>
                   <span className="text-[14px] font-black text-white">Instant Finality</span>
                </div>
             </div>
          </div>
        ) : (
          <div className="bg-indigo-900 rounded-[24px] p-5 mb-10 text-white shadow-xl">
             <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Inbound Status</span>
                <Info size={14} className="text-indigo-400" />
             </div>
             <p className="text-[13px] text-indigo-100 leading-relaxed mb-1">
                Arc Network's 1-confirmation finality allows rapid claims. Once Circle attests the burn on {fromNetwork.name}, we will automatically mint the USDC to your Arc wallet.
             </p>
          </div>
        )}

        <div className="flex gap-3 px-2">
           <div className="text-slate-400 shrink-0">
              <Globe size={18} />
           </div>
           <p className="text-[12px] text-slate-500 leading-relaxed">
              Circle CCTP transfers are native and secure. No liquidity pools or wrapped assets involved. Attestation takes approx. 60-90 seconds.
           </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 z-20 shadow-2xl">
        <button 
          onClick={handleBridge}
          className={`w-full bg-slate-900 text-white py-4.5 rounded-full font-black text-[16px] shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98] border-0 cursor-pointer flex items-center justify-center gap-2 ${
            mode === 'outbound' 
              ? (!amount || parseFloat(amount) === 0 || parseFloat(amount) > balance ? 'opacity-50 cursor-not-allowed' : '')
              : (!sourceTxHash ? 'opacity-50 cursor-not-allowed' : '')
          }`}
        >
          {mode === 'outbound' ? 'Initiate Outbound Bridge' : 'Claim Inbound Transfer'}
        </button>
      </div>

      {/* Network Select Modal */}
      {showNetworkSelect && (
        <div className="absolute inset-0 z-[80] bg-black/40 flex items-end animate-in fade-in duration-300 pointer-events-auto">
           <motion.div 
             initial={{ y: '100%' }}
             animate={{ y: 0 }}
             className="w-full bg-white rounded-t-[32px] p-6 pb-12 max-h-[85%] overflow-y-auto"
           >
              <div className="flex justify-between items-center mb-6">
                 <h4 className="font-black text-[20px] text-slate-800">Select Network</h4>
                 <button 
                   onClick={() => setShowNetworkSelect(null)}
                   className="p-2 bg-slate-50 rounded-full text-slate-400 border-0 cursor-pointer"
                 >
                    <X size={20} />
                 </button>
              </div>
              <div className="flex flex-col gap-3">
                 {NETWORKS.map(net => {
                    // Prevent selecting Arc as destination for outbound if already on Arc
                    if (mode === 'outbound' && showNetworkSelect === 'to' && net.id === 'arc') return null;
                    // Prevent selecting Arc as source for inbound
                    if (mode === 'inbound' && showNetworkSelect === 'from' && net.id === 'arc') return null;

                    return (
                        <button 
                          key={net.id}
                          onClick={() => {
                             if (showNetworkSelect === 'from') setFromNetwork(net);
                             else setToNetwork(net);
                             setShowNetworkSelect(null);
                          }}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                             (showNetworkSelect === 'from' ? fromNetwork.id : toNetwork.id) === net.id
                                ? 'border-slate-800 bg-slate-50'
                                : 'border-slate-50 bg-white hover:border-slate-100'
                          }`}
                        >
                           <div className={`w-10 h-10 ${net.color} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                              {net.icon}
                           </div>
                           <div className="flex-1 text-left">
                              <p className="font-black text-slate-800">{net.name}</p>
                              <p className="text-[12px] text-slate-400">Circle CCTP Protocol</p>
                           </div>
                        </button>
                    );
                 })}
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
}
