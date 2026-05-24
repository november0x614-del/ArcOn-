import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, ArrowLeftRight, RefreshCw, Check, Zap, Search, X } from 'lucide-react';
import { useUSDCBalance } from '../../services/unified-balance-kit/hooks';
import { useApp } from '../../context/AppContext';

interface SwapScreenProps {
  onBack: () => void;
}

const TOKENS = [
  { symbol: 'USDC', name: 'USD Coin', balance: '0.00', color: 'bg-[#2775ca]', type: 'Stablecoin' },
  { symbol: 'EURC', name: 'EURC', balance: '0.00', color: 'bg-gradient-to-tr from-blue-400 to-blue-500', type: 'Stablecoin' },
  { symbol: 'cirBTC', name: 'Circle BTC', balance: '0.00', color: 'bg-[#f7931a]', type: 'Wrapped Token' },
];

export function SwapScreen({ onBack }: SwapScreenProps) {
  const { registeredUser, fetchBalance, fetchTransactions, allBalances } = useApp();
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('0');
  const [swapFinished, setSwapFinished] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(0.9852); // Fallback init rate
  const { balance } = useUSDCBalance();
  const [slippage, setSlippage] = useState(0.5); 
  const [gasFee, setGasFee] = useState('Free on Arc Testnet');
  const [isEstimating, setIsEstimating] = useState(false);
  const [swapStatus, setSwapStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle'); 

  // Modal states
  const [showTokenSelector, setShowTokenSelector] = useState<'from' | 'to' | null>(null);
  
  // Helper to get balance for a token
  const getTokenBalance = (symbol: string) => {
      if (symbol === 'USDC') return balance.toFixed(2);
      const tokenBalance = allBalances.find(b => b.token?.symbol === symbol);
      return tokenBalance ? parseFloat(tokenBalance.amount).toFixed(2) : '0.00';
  };

  const [fromToken, setFromToken] = useState({ ...TOKENS[0], balance: getTokenBalance(TOKENS[0].symbol) });
  const [toToken, setToToken] = useState({ ...TOKENS[1], balance: getTokenBalance(TOKENS[1].symbol) });
  const [searchToken, setSearchToken] = useState('');
  const [txHash, setTxHash] = useState('');

  // Update balances when allBalances changes
  useEffect(() => {
     setFromToken(prev => ({ ...prev, balance: getTokenBalance(prev.symbol) }));
     setToToken(prev => ({ ...prev, balance: getTokenBalance(prev.symbol) }));
  }, [allBalances, balance]);

  // Estimate hook with debounce
  useEffect(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setToAmount('0');
      return;
    }

    if (fromToken.symbol === toToken.symbol) {
       setToAmount(fromAmount);
       return;
    }

    setIsEstimating(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch('/api/estimate-swap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: registeredUser?.supabaseUid,
            amount: fromAmount,
            fromToken: fromToken.symbol,
            toToken: toToken.symbol
          }),
        });

        if (!response.ok) throw new Error('Estimate failed');
        const data = await response.json();
        
        setToAmount(data.estimatedOutput);
        
        // Update exchange rate based on actual estimate
        if (parseFloat(fromAmount) > 0 && parseFloat(data.estimatedOutput) > 0) {
            setExchangeRate(parseFloat(data.estimatedOutput) / parseFloat(fromAmount));
        }

        // Format fees
        if (data.fees && data.fees.length > 0) {
            const feeStr = data.fees.map((f: any) => `${f.amount} ${f.token}`).join(', ');
            setGasFee(feeStr);
        } else {
            setGasFee('Free on Arc Testnet');
        }
      } catch (error) {
         console.error("Failed to estimate swap:", error);
         // Fallback simulate
         const rate = fromToken.symbol === 'USDC' && toToken.symbol === 'EURC' ? 0.9852 : (1 / 0.9852);
         setToAmount((parseFloat(fromAmount) * rate).toFixed(4));
         setGasFee('Free on Arc Testnet');
      } finally {
        setIsEstimating(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [fromAmount, fromToken.symbol, toToken.symbol, registeredUser]);

  const handleSwap = async () => {
    setSwapStatus('processing');
    try {
        const response = await fetch('/api/swap/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: registeredUser?.supabaseUid,
            amount: fromAmount,
            fromToken: fromToken.symbol,
            toToken: toToken.symbol
          }),
        });

        if (!response.ok) throw new Error('Swap failed');

        const data = await response.json();
        setTxHash(data.txId);
        
        // Update user state
        await fetchBalance();
        await fetchTransactions();
        
        setSwapStatus('success');
        setSwapFinished(true);
        
        // Reset status
        setTimeout(() => {
          setSwapStatus('idle');
          setSwapFinished(false);
        }, 5000);
    } catch (e) {
        setSwapStatus('failed');
        setTimeout(() => setSwapStatus('idle'), 3000);
    }
  };

  const flipTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount('');
    setToAmount('0');
  };

  if (swapFinished) {
    return (
      <div className="w-full h-full bg-slate-50 relative flex flex-col z-50 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center px-4 pt-12 pb-4 bg-white border-b border-slate-100 shadow-sm relative z-10 w-full">
           <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
             <X size={24} className="text-slate-800" />
           </button>
           <h2 className="font-bold text-[16px] text-slate-800 ml-2">Transaction Receipt</h2>
        </div>
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
            <div className="bg-white p-8 rounded-[32px] w-full max-w-sm shadow-xl flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white">
                  <Check size={40} className="text-green-500" strokeWidth={3} />
                </div>
                <h2 className="text-[24px] font-extrabold text-slate-800 mb-2">Swap Confirmed</h2>
                <p className="text-[14px] text-slate-500 mb-8 leading-relaxed">
                  Your assets have been successfully swapped on the Arc Network.
                </p>

                <div className="w-full bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100 space-y-4 text-left">
                   <div className="flex justify-between items-center">
                      <span className="text-[13px] text-slate-500">Paid</span>
                      <span className="font-bold text-slate-800">{fromAmount} {fromToken.symbol}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[13px] text-slate-500">Received</span>
                      <span className="font-bold text-green-600">+{toAmount} {toToken.symbol}</span>
                   </div>
                   <div className="w-full h-[1px] bg-slate-200 my-2"></div>
                   <div className="flex justify-between items-center">
                      <span className="text-[12px] text-slate-400">Tx Hash</span>
                      <a 
  href={`https://testnet.arcscan.app/tx/${txHash}`} 
  target="_blank" 
  rel="noopener noreferrer" 
  className="text-[12px] font-mono text-blue-500 truncate max-w-[120px] hover:underline"
>
  {txHash}
</a>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[12px] text-slate-400">Network</span>
                      <span className="text-[12px] font-bold text-slate-600">Arc Testnet</span>
                   </div>
                </div>

                <button 
                  onClick={onBack}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors shadow-lg active:scale-95"
                >
                  Done
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-50 relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center px-4 pt-12 pb-4 bg-white border-b border-slate-100 shadow-sm relative z-10 w-full">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200">
          <ArrowLeft size={24} className="text-slate-800" />
        </button>
        <h2 className="font-bold text-[16px] text-slate-800 ml-2">Swap Assets</h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 p-5 flex flex-col pt-6 w-full scrollbar-hide relative">
        {/* Swap Box Container */}
        <div className="relative mb-6">
          {/* From */}
          <div className={`bg-white p-5 rounded-[24px] shadow-sm border transition-all duration-300 relative z-10 ${swapStatus === 'processing' ? 'border-blue-400/50 shadow-blue-100/50 opacity-80' : 'border-slate-200 focus-within:border-slate-400'}`}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">You Pay</span>
              <span className="text-[12px] font-bold text-slate-500 flex items-center gap-1">
                 Balance: {fromToken.balance}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <input 
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  disabled={swapStatus === 'processing'}
                  className="w-[140px] bg-transparent border-none outline-none text-[36px] font-extrabold text-slate-800 placeholder:text-slate-200 disabled:opacity-50"
                  placeholder="0"
                />
                <button 
                  onClick={() => swapStatus !== 'processing' && setShowTokenSelector('from')}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors px-3 py-2 rounded-full shrink-0 h-10"
                >
                   <div className={`w-6 h-6 rounded-full ${fromToken.color} flex items-center justify-center text-white text-[8px] font-bold shrink-0 shadow-sm`}>
                     {fromToken.symbol.substring(0,4)}
                   </div>
                   <span className="font-bold text-slate-800 text-[14px]">{fromToken.symbol}</span>
                   <ChevronDown size={16} className="text-slate-400" />
                </button>
              </div>
              {fromAmount && (
                <div className="text-[12px] text-slate-400 font-medium">
                  ~ ${(parseFloat(fromAmount) * 1.001).toFixed(2)} USD
                </div>
              )}
            </div>
          </div>

          {/* Swap Swap Button */}
          <div className={`absolute left-1/2 top-[calc(50%-20px)] z-20 transform -translate-x-1/2 transition-transform duration-500 ${swapStatus === 'processing' ? 'rotate-180' : ''}`}>
             <button 
               onClick={flipTokens}
               disabled={swapStatus === 'processing'}
               className="w-10 h-10 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-4 border-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:scale-105 active:scale-95 transition-all group disabled:opacity-50"
             >
               <ArrowLeftRight size={16} className="rotate-90 group-hover:rotate-[-90deg] transition-transform duration-500" />
             </button>
          </div>

          {/* To */}
          <div className={`bg-white p-5 rounded-[24px] shadow-sm border mt-1.5 transition-all duration-300 relative z-10 ${swapStatus === 'processing' ? 'border-orange-400/50 shadow-orange-100/50 opacity-80' : 'border-slate-200 gap-2'}`}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">You Receive</span>
              <span className="text-[12px] font-bold text-slate-500 flex items-center gap-1">
                 Balance: {toToken.balance}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <span className={`text-[36px] font-extrabold ${toAmount === '0' ? 'text-slate-300' : 'text-slate-800'} transition-opacity ${swapStatus === 'processing' || isEstimating ? 'opacity-50' : 'opacity-100'}`}>
                    {toAmount}
                  </span>
                </div>
                <button 
                  onClick={() => (swapStatus !== 'processing' && !isEstimating) && setShowTokenSelector('to')}
                  className={`flex items-center gap-2 bg-slate-50 border border-slate-200 transition-colors px-3 py-2 rounded-full shrink-0 h-10 ${isEstimating ? 'opacity-50' : 'hover:bg-slate-100'}`}
                >
                   <div className={`w-6 h-6 rounded-full ${toToken.color} flex items-center justify-center text-white text-[8px] font-bold shrink-0 shadow-sm`}>
                     {toToken.symbol.substring(0,4)}
                   </div>
                   <span className="font-bold text-slate-800 text-[14px]">{toToken.symbol}</span>
                   <ChevronDown size={16} className="text-slate-400" />
                </button>
              </div>
              {toAmount !== '0' && (
                <div className="text-[12px] text-slate-400 font-medium">
                  ~ ${(parseFloat(toAmount) * 0.999).toFixed(2)} USD
                  <span className="text-orange-400 ml-2">(-0.2%)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-white border border-slate-200 rounded-[20px] p-5 mb-8 shadow-sm">
           <div className="flex justify-between items-center mb-3">
              <span className="text-[13px] text-slate-500">Live Rate</span>
              <span className="text-[13px] font-bold text-slate-800 flex items-center gap-1">
                <Zap size={14} className="text-yellow-500" /> 
                1 {fromToken.symbol} = {exchangeRate.toFixed(4)} {toToken.symbol}
              </span>
           </div>
           <div className="flex justify-between items-center mb-2">
              <span className="text-[13px] text-slate-500">Slippage Tolerance</span>
              <div className="flex gap-2">
                {[0.1, 0.5, 1.0].map(s => (
                   <button key={s} onClick={() => setSlippage(s)} className={`text-[12px] font-bold px-2 py-1 rounded transition-colors ${slippage === s ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                      {s}%
                   </button>
                ))}
              </div>
           </div>
           <div className="w-full h-[1px] border-b border-dashed border-slate-200 my-3"></div>
           <div className="flex justify-between items-center">
              <span className="text-[13px] text-slate-500">{gasFee !== 'Free on Arc Testnet' ? 'Network & Custom Fee' : 'Network Fee (Est.)'}</span>
              <span className="text-[12px] font-bold text-slate-800">{isEstimating ? 'Calculating...' : gasFee}</span>
           </div>
        </div>

        <div className="mt-auto pb-4">
          <button 
            disabled={!fromAmount || parseFloat(fromAmount) === 0 || swapStatus === 'processing' || isEstimating || (fromToken.symbol === 'USDC' && parseFloat(fromAmount) > balance) || fromToken.symbol === toToken.symbol}
            onClick={handleSwap}
            className={`w-full font-bold py-4 rounded-full transition-all flex items-center justify-center gap-3 text-[15px] active:scale-95
              ${(!fromAmount || parseFloat(fromAmount) === 0 || isEstimating || (fromToken.symbol === 'USDC' && parseFloat(fromAmount) > balance) || fromToken.symbol === toToken.symbol)
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : swapStatus !== 'processing' ? 'bg-slate-900 text-white shadow-lg hover:bg-slate-800' : 'bg-slate-800 text-white shadow-xl scale-[0.98]'
              }`}
          >
            {isEstimating ? (
              <>
                <RefreshCw size={20} className="animate-spin text-slate-400" />
                Estimating...
              </>
            ) : swapStatus === 'processing' ? (
              <>
                <RefreshCw size={20} className="animate-spin text-slate-300" />
                Processing Swap...
              </>
            ) : swapStatus === 'failed' ? (
               <>
                 <X size={20} className="text-white" />
                 Swap Failed
               </>
            ) : fromToken.symbol === toToken.symbol ? (
              'Invalid Pair'
            ) : fromToken.symbol === 'USDC' && parseFloat(fromAmount) > balance ? (
              'Insufficient Balance'
            ) : (
              'Review Swap'
            )}
          </button>
        </div>
      </div>

      {/* Token Selector Modal */}
      {showTokenSelector && (
        <div className="absolute inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
           <div className="flex items-center px-4 pt-12 pb-4 border-b border-slate-100 shadow-sm relative z-10">
             <button onClick={() => setShowTokenSelector(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
               <ArrowLeft size={24} className="text-slate-800" />
             </button>
             <h2 className="font-bold text-[16px] text-slate-800 ml-2">Select a token</h2>
           </div>
           
           <div className="p-4 border-b border-slate-100 relative">
              <Search size={20} className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                 type="text" 
                 placeholder="Search name or paste address" 
                 value={searchToken}
                 onChange={(e) => setSearchToken(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
              />
           </div>

           <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-2 text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                Popular Tokens
              </div>
              <div className="flex flex-col">
                {TOKENS.filter(t => t.name.toLowerCase().includes(searchToken.toLowerCase()) || t.symbol.toLowerCase().includes(searchToken.toLowerCase())).map((token) => (
                   <button 
                     key={token.symbol}
                     onClick={() => {
                        if (showTokenSelector === 'from') setFromToken({ ...token, balance: getTokenBalance(token.symbol) });
                        if (showTokenSelector === 'to') setToToken({ ...token, balance: getTokenBalance(token.symbol) });
                        setShowTokenSelector(null);
                     }}
                     className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors active:bg-slate-100 text-left border-b border-slate-50 last:border-0"
                   >
                     <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${token.color} flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}>
                          {token.symbol.substring(0,4)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-[15px]">{token.name}</div>
                          <div className="text-[12px] text-slate-500">{token.symbol} • {token.type}</div>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="font-bold text-slate-800">
                          {getTokenBalance(token.symbol)}
                        </div>
                     </div>
                   </button>
                ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
