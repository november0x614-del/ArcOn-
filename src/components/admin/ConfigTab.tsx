import React, { memo } from "react";
import {
  Settings2,
  CircleDollarSign,
  Activity,
  ShieldCheck,
} from "lucide-react";

interface AdminConfig {
  swapFee: string;
  withdrawFee: string;
  bridgeFee: string;
  dailyTransferLimit: string;
  gasSubsidyEnabled: boolean;
  transferEnabled: boolean;
  withdrawEnabled: boolean;
  swapEnabled: boolean;
  stableStakeEnabled: boolean;
  bridgeEnabled: boolean;
  faucetEnabled: boolean;
  batchTransferEnabled: boolean;
  ecommerceEnabled: boolean;
  merchantEnabled: boolean;
  vaEnabled: boolean;
  qrisEnabled: boolean;
  scanQrEnabled: boolean;
  registrationEnabled: boolean;
  aiAgentEnabled: boolean;
  eWalletConnectionEnabled: boolean;
  arcBirdEnabled: boolean;
  backupPhraseEnabled: boolean;
}

interface ConfigTabProps {
  config: AdminConfig | null;
  loading: boolean;
  saving: boolean;
  swapFeeInput: string;
  setSwapFeeInput: (v: string) => void;
  withdrawFeeInput: string;
  setWithdrawFeeInput: (v: string) => void;
  bridgeFeeInput: string;
  setBridgeFeeInput: (v: string) => void;
  dailyTransferLimitInput: string;
  setDailyTransferLimitInput: (v: string) => void;
  onSave: (fields: Partial<AdminConfig>) => void;
}

const ToggleItem = memo(
  ({
    label,
    desc,
    field,
    value,
    onToggle,
  }: {
    label: string;
    desc: string;
    field: string;
    value: boolean;
    onToggle: (f: string, v: boolean) => void;
  }) => {
    return (
      <div className="flex justify-between items-center py-4 first:pt-4 last:pb-4 group">
        <div className="flex flex-col pr-4">
          <span className="text-[13px] font-black text-slate-800 leading-tight">
            {label}
          </span>
          <span className="text-[11px] text-slate-500 font-medium mt-1 uppercase tracking-tight opacity-75">{desc}</span>
        </div>
        <button
          type="button"
          onClick={() => onToggle(field, !value)}
          className={`w-12 h-7 rounded-full relative shrink-0 transition-all duration-200 cursor-pointer ${value ? "bg-emerald-500 shadow-sm" : "bg-slate-300"}`}
        >
          <span
            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${value ? "right-1" : "left-1"}`}
          ></span>
        </button>
      </div>
    );
  },
);

export function ConfigTab({
  config,
  loading,
  saving,
  swapFeeInput,
  setSwapFeeInput,
  withdrawFeeInput,
  setWithdrawFeeInput,
  bridgeFeeInput,
  setBridgeFeeInput,
  dailyTransferLimitInput,
  setDailyTransferLimitInput,
  onSave,
}: ConfigTabProps) {
  if (!config)
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading platform configuration nodes...
      </div>
    );

  const handleToggle = (field: string, value: boolean) => {
    onSave({ [field]: value });
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-300">
      {/* Category 1: Fees & Transaction Limits */}
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#f8fafc] px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-800">
            <Settings2 size={16} className="text-slate-500" />
            <h3 className="font-black text-[13px] uppercase tracking-wider text-slate-800">
              FEES & TRANSACTION LIMITS
            </h3>
          </div>
          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-black uppercase tracking-tight">
            LIMITS
          </span>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-x-5 gap-y-6">
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-slate-600 ml-1">
                Swap Fee (%)
              </label>
              <input
                type="text"
                value={swapFeeInput}
                onChange={(e) => setSwapFeeInput(e.target.value)}
                className="w-full bg-[#f8fafc] border border-slate-200/60 text-slate-800 font-mono font-bold text-[13px] px-4 py-3 rounded-2xl outline-none focus:border-slate-800 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-slate-600 ml-1">
                Send / Transfer Fee
              </label>
              <input
                type="text"
                value={withdrawFeeInput}
                onChange={(e) => setWithdrawFeeInput(e.target.value)}
                className="w-full bg-[#f8fafc] border border-slate-200/60 text-slate-800 font-mono font-bold text-[13px] px-4 py-3 rounded-2xl outline-none focus:border-slate-800 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-slate-600 ml-1">
                CCTP Bridge Fee
              </label>
              <input
                type="text"
                value={bridgeFeeInput}
                onChange={(e) => setBridgeFeeInput(e.target.value)}
                className="w-full bg-[#f8fafc] border border-slate-200/60 text-slate-800 font-mono font-bold text-[13px] px-4 py-3 rounded-2xl outline-none focus:border-slate-800 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-slate-600 ml-1">
                Daily Transfer Limit
              </label>
              <input
                type="text"
                value={dailyTransferLimitInput}
                onChange={(e) => setDailyTransferLimitInput(e.target.value)}
                className="w-full bg-[#f8fafc] border border-slate-200/60 text-slate-800 font-mono font-bold text-[13px] px-4 py-3 rounded-2xl outline-none focus:border-slate-800 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex justify-between items-center py-4 px-5 bg-slate-50/80 rounded-[20px] border border-slate-100/80">
            <div className="flex flex-col">
              <span className="text-[13px] font-black text-slate-800">
                Platform Gas Subsidy
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                Remove native USDC gas fee deductions for user transactions
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                handleToggle("gasSubsidyEnabled", !config.gasSubsidyEnabled)
              }
              className={`w-12 h-7 rounded-full relative transition-all duration-200 cursor-pointer ${config.gasSubsidyEnabled ? "bg-emerald-500 shadow-sm" : "bg-slate-300"}`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${config.gasSubsidyEnabled ? "right-1" : "left-1"}`}
              ></span>
            </button>
          </div>

          <button
            onClick={() =>
              onSave({
                swapFee: swapFeeInput,
                withdrawFee: withdrawFeeInput,
                bridgeFee: bridgeFeeInput,
                dailyTransferLimit: dailyTransferLimitInput,
              })
            }
            disabled={saving || loading}
            className="w-full mt-2 bg-[#101827] hover:bg-slate-800 text-white font-black text-[14px] py-4 rounded-[18px] disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer shadow-lg shadow-slate-200"
          >
            {saving ? "Saving Limits & Fees..." : "Save Limits & Fees"}
          </button>
        </div>
      </div>

      {/* Category 2: Core Service Access */}
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#f8fafc] px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-800">
            <CircleDollarSign size={16} className="text-slate-500" />
            <h3 className="font-black text-[13px] uppercase tracking-wider text-slate-800">
              Core Financial Service Access
            </h3>
          </div>
          <span className="text-[10px] bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-black uppercase tracking-tight">
            SERVICES
          </span>
        </div>
        <div className="p-2 space-y-0 divide-y divide-slate-100/50 px-6">
          {[
            {
              field: "transferEnabled",
              label: "Send Funds Feature (Transfer)",
              desc: "Instant USDC cross-user send & transfer button",
            },
            {
              field: "withdrawEnabled",
              label: "Withdraw Funds Feature",
              desc: "Export USDC from wallet to exchange or other addresses",
            },
            {
              field: "swapEnabled",
              label: "USDC Token Swap Feature",
              desc: "Conversion and pool swap for multi-asset tokens on Arc",
            },
            {
              field: "stableStakeEnabled",
              label: "StableStake Deposit Feature",
              desc: "Access USDC yield-generating staking instruments on testnet",
            },
            {
              field: "bridgeEnabled",
              label: "Cross-Chain CCTP Bridge Feature",
              desc: "Burn & Mint USDC between Arbitrum/Ethereum and Arc",
            },
            {
              field: "faucetEnabled",
              label: "Balance Faucet Feature",
              desc: "Claim free weekly gas tokens for testing purposes",
            },
            {
              field: "batchTransferEnabled",
              label: "Mass Transfer Feature (Batch)",
              desc: "Send USDC to multi-destinations in a single transaction",
            },
          ].map((item) => (
            <ToggleItem
              key={item.field}
              label={item.label}
              desc={item.desc}
              field={item.field}
              value={config[item.field as keyof AdminConfig] as boolean}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>

      {/* Category 3: E-commerce & QR Payment */}
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#f8fafc] px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-800">
            <Activity size={16} className="text-slate-500" />
            <h3 className="font-black text-[13px] uppercase tracking-wider text-slate-800">
              E-Commerce & Merchant Modules
            </h3>
          </div>
          <span className="text-[10px] bg-amber-50 text-amber-600 px-3 py-1 rounded-full font-black uppercase tracking-tight">
            PAYMENTS
          </span>
        </div>
        <div className="p-2 space-y-0 divide-y divide-slate-100/50 px-6">
          {[
            {
              field: "ecommerceEnabled",
              label: "Marketplace E-Commerce Module",
              desc: "Shopping platform for physical/digital products within the app",
            },
            {
              field: "merchantEnabled",
              label: "Merchant PoS Module",
              desc: "Point of sales system for registered merchant outlets",
            },
            {
              field: "vaEnabled",
              label: "Virtual Account Payment",
              desc: "Combination of instantly verified dynamic VA",
            },
            {
              field: "qrisEnabled",
              label: "QRIS Code Generator",
              desc: "National standard QR code creation for balance deposits",
            },
            {
              field: "scanQrEnabled",
              label: "QR Code Scanner (Scan)",
              desc: "Camera scanner button to scan QR invoices & wallets",
            },
          ].map((item) => (
            <ToggleItem
              key={item.field}
              label={item.label}
              desc={item.desc}
              field={item.field}
              value={config[item.field as keyof AdminConfig] as boolean}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>

      {/* Category 4: Integration & Security */}
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#f8fafc] px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-800">
            <ShieldCheck size={16} className="text-slate-500" />
            <h3 className="font-black text-[13px] uppercase tracking-wider text-slate-800">
              External Connection & Security
            </h3>
          </div>
          <span className="text-[10px] bg-rose-50 text-rose-600 px-3 py-1 rounded-full font-black uppercase tracking-tight">
            SECURITY
          </span>
        </div>
        <div className="p-2 space-y-0 divide-y divide-slate-100/50 px-6">
          {[
            {
              field: "registrationEnabled",
              label: "New User Registration",
              desc: "Allow creation of new accounts & wallet addresses on this platform",
            },
            {
              field: "aiAgentEnabled",
              label: "AI Agent Co-Pilot (Assistant)",
              desc: "AI-based cognitive pocket financial consulting service",
            },
            {
              field: "eWalletConnectionEnabled",
              label: "e-Wallet Integration (GrabPay / GoPay)",
              desc: "Claim virtual balance transfer bridge with local digital wallet accounts",
            },
            {
              field: "arcBirdEnabled",
              label: "Arc Bird Mini-Game",
              desc: "Flappy Bird hobby feature with integrated tournament leaderboard",
            },
            {
              field: "backupPhraseEnabled",
              label: "Export Keys / Backup Keys",
              desc: "Allow export of Circle wallet security phrases directly by the user",
            },
          ].map((item) => (
            <ToggleItem
              key={item.field}
              label={item.label}
              desc={item.desc}
              field={item.field}
              value={config[item.field as keyof AdminConfig] as boolean}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
