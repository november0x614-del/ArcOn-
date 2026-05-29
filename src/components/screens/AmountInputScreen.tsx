import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  ChevronDown,
  ArrowRight,
  X,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { useArc } from "../../contexts/ArcContext";
import { WalletCard } from "../common/WalletCard";

interface AmountInputScreenProps {
  contact: any;
  onBack: () => void;
  onNext: (amount: string, memo: string) => void;
}

export function AmountInputScreen({
  contact,
  onBack,
  onNext,
}: AmountInputScreenProps) {
  const { registeredUser, balance, allBalances, transferAmount, transferMemo } =
    useStore();
  const { getFeeEstimate } = useArc();
  const [amount, setAmount] = useState(
    transferAmount && transferAmount !== "0" ? transferAmount : "",
  );
  const [memo, setMemo] = useState(transferMemo || "");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSourceSelect, setShowSourceSelect] = useState(false);
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Fee estimating skipped - utilizing Sponsored Gas Station instead

  // Derive real EVM Wallet address from store
  const accountStr = registeredUser?.walletAddress
    ? `${registeredUser.walletAddress.substring(0, 6)}...${registeredUser.walletAddress.substring(registeredUser.walletAddress.length - 4)}`
    : "0x00...0000";

  const currentSource = {
    id: "source-arc",
    name: "EVM (Arc Testnet)",
    account: registeredUser?.username
      ? `${registeredUser.username}'s Wallet`
      : accountStr,
    balance: new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(balance),
    dec: " USDC",
    isArc: true,
  };

  const [selectedSource, setSelectedSource] = useState(currentSource);
  const sources = [currentSource];

  const numericAmount = amount ? parseFloat(amount) : 0;

  // Accurate USDC Balance check for Arc Testnet
  const usdcData = allBalances.find((b) => b.token?.symbol === "USDC");
  const actualUSDC = usdcData ? parseFloat(usdcData.amount) : 0;

  // Total needed (including platform fee)
  const totalRequired = numericAmount + 0.1;
  const hasEnough = actualUSDC >= totalRequired;

  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full justify-center">
        <button
          onClick={onBack}
          className="absolute left-4 p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="font-bold text-[16px] text-white">INPUT AMOUNT</h2>
      </div>

      <div className="flex-1 overflow-y-auto w-full pb-32 p-5 bg-[#f8fafc]">
        {/* Recipient Card - Updated Design */}
        <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-8 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
          <div className="w-[64px] h-[64px] shadow-sm rounded-full bg-slate-900 flex items-center justify-center font-bold text-white text-[22px] shrink-0 mb-4 border-4 border-slate-50">
            {contact.initials}
          </div>
          <h2 className="text-slate-900 font-black text-[18px] uppercase tracking-tight leading-tight text-center">
            {contact.name}
          </h2>
          <div className="mt-2 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100">
            <p className="text-slate-500 text-[12px] font-bold tracking-tight text-center flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {contact.bank || contact.network} - {contact.account}
            </p>
          </div>
        </div>

        {/* Input box */}
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 mb-6 relative space-y-4">
          <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block">
            Transfer Amount
          </label>
          <div className="flex items-center justify-between pb-1 relative">
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-[36px] font-black w-2/3 outline-none text-slate-800 focus:text-slate-900 bg-transparent placeholder-slate-200"
            />
            {amount && (
              <button
                onClick={() => setAmount("")}
                className="absolute right-20 w-[24px] h-[24px] bg-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-300 transition-colors z-20 top-1/2 -translate-y-1/2"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
            <div className="flex items-center gap-2 bg-slate-100 rounded-full py-1.5 px-3 border border-slate-200 h-9 shrink-0">
              <span className="font-bold text-[14px] text-slate-800 tracking-tight">
                USDC
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100">
            <span className="text-[12px] text-slate-500 font-medium">
              USDC Balance: {actualUSDC.toFixed(2)} USDC
            </span>
            <button
              onClick={() =>
                setAmount(
                  actualUSDC >= 0.1 ? (actualUSDC - 0.1).toFixed(2) : "0",
                )
              }
              className="text-[11px] font-bold bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md hover:bg-slate-300 transition-colors cursor-pointer border-none"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Memo Input */}
        <div className="bg-white rounded-[20px] shadow-sm border border-slate-200 mb-6 p-4">
          {!isEditingMemo && !memo ? (
            <button
              onClick={() => setIsEditingMemo(true)}
              className="flex items-center justify-center w-full gap-2 text-slate-600 font-medium text-[13px] hover:text-slate-900 transition-colors py-1 cursor-pointer border-0 bg-transparent"
            >
              <Edit3 size={15} className="text-slate-400" /> Add Memo (Optional)
            </button>
          ) : (
            <div className="w-full flex flex-col gap-2 relative">
              <div className="flex justify-between items-center z-10 w-full bg-white relative">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  Memo
                </span>
                <button
                  onClick={() => {
                    setMemo("");
                    setIsEditingMemo(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer border-0 bg-transparent inline-flex leading-none pt-0 pb-0"
                >
                  <X size={14} />
                </button>
              </div>
              <input
                type="text"
                autoFocus={isEditingMemo}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Ex: Payment for groceries"
                className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none text-slate-700 text-[14px] font-medium"
              />
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-8">
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!amount || numericAmount < 1 || !hasEnough}
            className={`w-full py-4 rounded-full font-bold text-[15px] transition-all flex items-center justify-center gap-2
              ${
                amount && numericAmount >= 1 && hasEnough
                  ? "bg-slate-900 text-white shadow-lg hover:bg-slate-800 active:scale-[0.98]"
                  : "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
              }
            `}
          >
            Review Transfer
          </button>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="absolute inset-0 z-50 bg-black/40 flex flex-col justify-end transition-opacity overflow-hidden">
          <div className="bg-white rounded-t-[24px] w-full flex flex-col relative max-h-[95%] shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="px-5 pt-6 pb-4 flex justify-between items-center border-b border-slate-100">
              <h3 className="font-bold text-[18px] text-slate-800">
                Transfer Confirmation
              </h3>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-slate-400 p-1 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>

            <div className="px-5 pb-6 overflow-y-auto pt-5 flex-1 block">
              {/* Contact Preview */}
              <div className="flex items-center gap-4 mb-8 text-left">
                <div className="w-[46px] h-[46px] rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[15px] shrink-0">
                  {contact.initials}
                </div>
                <div className="flex flex-col overflow-hidden gap-[2px]">
                  <span className="font-extrabold text-[15px] text-slate-800 uppercase tracking-tight truncate">
                    {contact.name}
                  </span>
                  <span className="text-slate-500 text-[13px] truncate">
                    {contact.bank || contact.network} - {contact.account}
                  </span>
                </div>
              </div>

              {/* Detail Table */}
              <div className="flex flex-col gap-3.5 mb-6 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-[14.5px]">
                    Transfer Amount
                  </span>
                  <span className="text-slate-800 font-bold text-[14.5px]">
                    {selectedSource.isArc
                      ? `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericAmount)} USDC`
                      : `Rp ${new Intl.NumberFormat("id-ID").format(numericAmount)}`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-[14.5px]">
                    Transfer Method
                  </span>
                  <span className="text-slate-800 font-bold text-[14.5px]">
                    {selectedSource.isArc ? "Arc Testnet" : "Arc Network"}
                  </span>
                </div>
                {selectedSource.isArc ? (
                  <div className="flex flex-col gap-1 w-full bg-slate-100/50 p-2.5 rounded-xl border border-slate-200/50">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-800 text-[14px] flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-slate-900 rounded-full"></div>{" "}
                        Platform Fee
                      </span>
                      <span className="text-slate-900 font-bold text-[14px]">
                        0.10 USDC
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-slate-500 text-[12px] flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>{" "}
                        Network Gas (Sponsored)
                      </span>
                      <span className="text-emerald-600 font-bold text-[12px]">
                        Free
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight mt-2 border-t border-slate-200/50 pt-2">
                      Platform fees are used for application operation. Your
                      network gas fee is sponsored by Arc Gas Station.
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 text-[14.5px]">
                      Transaction Fee
                    </span>
                    {numericAmount >= 100000 ? (
                      <>
                        <span className="line-through text-slate-400 text-[14px] mr-2">
                          Rp 6.500
                        </span>
                        <span className="text-green-600 font-bold text-[14.5px]">
                          FREE
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-800 font-bold text-[14.5px]">
                        Rp 6.500
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="h-[1px] bg-slate-100 w-full mb-4 opacity-50"></div>
            </div>

            {/* Bottom Confirm Action */}
            <div className="px-5 py-5 bg-white shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] border-t border-slate-100">
              <button
                disabled={isSending}
                onClick={async () => {
                  setIsSending(true);
                  if (selectedSource.isArc && numericAmount > 100) {
                    // Bio verification handler space
                  }
                  await onNext(amount, memo);
                  setIsSending(false);
                }}
                className={`w-full text-white py-[14px] rounded-full flex justify-between px-6 items-center transition-all ${selectedSource.isArc ? "bg-slate-900 hover:bg-slate-800 shadow-[0_4px_14px_rgba(63,162,246,0.4)]" : "bg-slate-900 hover:bg-slate-800 shadow-lg"} ${isSending ? "opacity-90" : ""}`}
              >
                <span className="font-bold text-[15px]">
                  {isSending ? "Initiating Transfer..." : "Continue Transfer"}
                </span>
                <div className="flex items-center gap-2">
                  {!isSending && (
                    <>
                      <span className="font-bold text-[16px]">
                        {selectedSource.isArc
                          ? `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericAmount)} USDC`
                          : `Rp ${new Intl.NumberFormat("id-ID").format(numericAmount + (numericAmount >= 100000 ? 0 : 6500))}`}
                      </span>
                      <div className="bg-white/20 p-1 rounded-full flex shrink-0 border-0">
                        <ArrowRight size={16} strokeWidth={3} />
                      </div>
                    </>
                  )}
                  {isSending && (
                    <div className="w-5 h-5 border-[2.5px] border-white/20 border-t-white rounded-full animate-spin"></div>
                  )}
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
              <h3 className="font-bold text-[18px] text-slate-800">
                Select Source Account
              </h3>
              <button
                onClick={() => setShowSourceSelect(false)}
                className="text-slate-400 p-1 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200 bg-transparent border-0"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3 overflow-y-auto w-full pb-10">
              {sources.map((src) => (
                <div
                  key={src.id}
                  onClick={() => {
                    setSelectedSource(src);
                    setShowSourceSelect(false);
                  }}
                  className={`flex flex-col p-4 rounded-2xl border-[1.5px] cursor-pointer hover:bg-slate-50 transition-colors w-full ${selectedSource.id === src.id ? "border-slate-900 bg-slate-100/10 shadow-[0_2px_10px_rgba(63,162,246,0.1)]" : "border-slate-200 bg-white shadow-sm"}`}
                >
                  <div className="flex justify-between items-start mb-2 w-full">
                    <span
                      className={`font-bold text-[15px] text-left ${selectedSource.id === src.id ? "text-slate-800" : "text-slate-800"}`}
                    >
                      {src.name}
                    </span>
                    {selectedSource.id === src.id && (
                      <CheckCircle2
                        size={20}
                        className="text-slate-800 shrink-0"
                      />
                    )}
                  </div>
                  <span className="text-slate-500 text-[13px] tracking-wide font-medium text-left w-full block">
                    {src.account}
                  </span>
                  <span
                    className={`font-bold text-[14px] mt-2 text-left w-full block ${src.isArc ? "text-slate-800" : "text-[#008fcd]"}`}
                  >
                    {src.balance}
                    <span className="text-[10px] align-top relative top-[1px]">
                      {src.dec}
                    </span>
                  </span>
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
