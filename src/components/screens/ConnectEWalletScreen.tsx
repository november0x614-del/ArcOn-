import React, { useState } from "react";
import {
  ArrowLeft,
  Wallet,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useArcWallet } from "../../lib/useArcWallet";

const EWALLETS = [
  {
    id: "gopay",
    name: "GoPay",
    iconColor: "text-green-500",
    isConnected: true,
    balance: "Rp 125.000",
    type: "e-wallet",
  },
  {
    id: "dana",
    name: "DANA",
    iconColor: "text-blue-500",
    isConnected: false,
    type: "e-wallet",
  },
  {
    id: "shopeepay",
    name: "ShopeePay",
    iconColor: "text-orange-500",
    isConnected: false,
    type: "e-wallet",
  },
];

export function ConnectEWalletScreen({ onBack }: { onBack: () => void }) {
  const [wallets, setWallets] = useState(EWALLETS);
  const { status, address, isBusy, connect, disconnect, error } =
    useArcWallet();

  const handleConnect = (id: string) => {
    setWallets(
      wallets.map((w) =>
        w.id === id ? { ...w, isConnected: true, balance: "Rp 0" } : w,
      ),
    );
  };

  const handleDisconnect = (id: string) => {
    setWallets(
      wallets.map((w) =>
        w.id === id ? { ...w, isConnected: false, balance: undefined } : w,
      ),
    );
  };

  return (
    <div className="w-full h-full bg-[#f6f8fb] relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center px-4 py-4 shrink-0 bg-slate-900 shadow-md z-10">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition-colors border-0 bg-transparent"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="font-bold text-[16px] text-white ml-2 uppercase tracking-wide">
          Connect Asset
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 scrollbar-hide">
        {/* Web3 Wallet Section */}
        <div className="mb-8">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
            Web3 Connection
          </h3>
          <div className="bg-slate-900 rounded-[24px] p-5 shadow-xl border border-white/10 relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#008fcd] opacity-10 blur-3xl group-hover:opacity-20 transition-opacity"></div>

            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Zap className="text-[#008fcd]" size={24} />
                </div>
                <div>
                  <h4 className="text-white font-bold text-[17px] tracking-tight">
                    Arc Wallet
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    Connect via MetaMask or Rabby
                  </p>
                </div>
              </div>
              {status === "connected" && (
                <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  <span className="text-emerald-500 text-[10px] font-bold">
                    VERIFIED
                  </span>
                </div>
              )}
            </div>

            {status === "connected" ? (
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                    Connected Address
                  </p>
                  <p className="text-[13px] text-slate-200 font-mono break-all">
                    {address}
                  </p>
                </div>
                <button
                  onClick={disconnect}
                  disabled={isBusy}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl border border-white/10 transition-all text-[14px]"
                >
                  Disconnect Wallet
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-400 text-[12px] leading-relaxed">
                  Connect your self-custody wallet to interact directly with the
                  Arc Network and manage your USDC.
                </p>
                <button
                  onClick={connect}
                  disabled={isBusy || status === "not-installed"}
                  className="w-full bg-[#008fcd] hover:bg-[#007fb5] text-white font-bold py-3 rounded-xl shadow-lg shadow-[#008fcd]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-[14px]"
                >
                  {isBusy ? "Connecting..." : "Connect MetaMask"}
                  <ExternalLink size={16} />
                </button>
                {status === "not-installed" && (
                  <p className="text-amber-500 text-[10px] text-center font-medium">
                    Wallet extension not detected.{" "}
                    <a
                      href="https://metamask.io"
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Install MetaMask
                    </a>
                  </p>
                )}
                {error && (
                  <p className="text-red-400 text-[10px] text-center">
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* E-Wallet Section */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
            E-Wallet Assets
          </h3>
          <div className="flex flex-col gap-3">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="bg-white rounded-[20px] p-4 shadow-sm flex items-center justify-between border border-slate-100 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl border border-slate-100 flex items-center justify-center bg-slate-50 shrink-0">
                    <Wallet className={`size-5 ${wallet.iconColor}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[14px] text-slate-800 tracking-tight">
                      {wallet.name}
                    </span>
                    {wallet.isConnected ? (
                      <span className="text-[12px] font-bold text-[#008fcd] mt-0.5">
                        {wallet.balance}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400 mt-0.5">
                        Click to link account
                      </span>
                    )}
                  </div>
                </div>

                {wallet.isConnected ? (
                  <button
                    onClick={() => handleDisconnect(wallet.id)}
                    className="text-[12px] font-bold text-slate-400 px-4 py-2 hover:text-slate-600 transition-colors bg-transparent border-0"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(wallet.id)}
                    className="text-[12px] font-bold text-[#008fcd] px-5 py-2 bg-[#008fcd]/5 rounded-full hover:bg-[#008fcd]/10 transition-colors border-0"
                  >
                    Connect
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
