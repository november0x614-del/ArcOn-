import React, { useState } from 'react';
import { ArrowLeft, Wallet, ChevronRight } from 'lucide-react';

const EWALLETS = [
  { id: 'gopay', name: 'GoPay', iconColor: 'text-green-500', isConnected: true, balance: 'Rp 125.000' },
  { id: 'dana', name: 'DANA', iconColor: 'text-blue-500', isConnected: false },
  { id: 'shopeepay', name: 'ShopeePay', iconColor: 'text-orange-500', isConnected: false },
  { id: 'linkaja', name: 'LinkAja', iconColor: 'text-red-600', isConnected: false },
  { id: 'ovo', name: 'OVO', iconColor: 'text-purple-600', isConnected: false },
];

export function ConnectEWalletScreen({ onBack }: { onBack: () => void }) {
  const [wallets, setWallets] = useState(EWALLETS);

  const handleConnect = (id: string) => {
    // Simulasi menghubungkan e-Wallet
    setWallets(wallets.map(w => 
      w.id === id ? { ...w, isConnected: true, balance: 'Rp 0' } : w
    ));
  };

  const handleDisconnect = (id: string) => {
    // Simulasi memutuskan e-Wallet
    setWallets(wallets.map(w => 
      w.id === id ? { ...w, isConnected: false, balance: undefined } : w
    ));
  };

  return (
    <div className="w-full h-full bg-[#f6f8fb] relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-center relative py-4 shrink-0 bg-white shadow-sm z-10">
        <button onClick={onBack} className="absolute left-4 p-1 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-700" />
        </button>
        <h2 className="font-bold text-[16px] text-slate-800">Connect Asset Wallet</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 scrollbar-hide">
        <p className="text-[13px] text-slate-600 mb-4 px-1 leading-relaxed">
          Connect your Web3 wallet to view USDC balance and transact quickly without switching applications.
        </p>

        <div className="flex flex-col gap-3">
          {wallets.map(wallet => (
            <div key={wallet.id} className="bg-white rounded-[16px] p-4 shadow-sm flex items-center justify-between border border-transparent hover:border-slate-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full border border-slate-100 flex items-center justify-center bg-slate-50 shrink-0">
                  <Wallet className={`size-5 ${wallet.iconColor}`} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[14px] text-slate-800 tracking-tight">{wallet.name}</span>
                  {wallet.isConnected ? (
                    <span className="text-[12px] font-bold text-slate-600 mt-0.5">{wallet.balance}</span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400 mt-0.5">Not connected</span>
                  )}
                </div>
              </div>

              {wallet.isConnected ? (
                 <button 
                   onClick={() => handleDisconnect(wallet.id)}
                   className="text-[12px] font-bold text-slate-600 px-3 py-1.5 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                 >
                   Disconnect
                 </button>
              ) : (
                 <button 
                   onClick={() => handleConnect(wallet.id)}
                   className="text-[12px] font-bold text-[#3FA2F6] px-3 py-1.5 bg-blue-50/70 rounded-full flex items-center gap-1 hover:bg-blue-100 transition-colors"
                 >
                   Connect
                 </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
