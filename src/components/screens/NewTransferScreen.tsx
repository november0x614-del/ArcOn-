import React, { useState, useEffect } from "react";
import {
  Landmark,
  AtSign,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  X,
} from "lucide-react";
import { BackendClient } from "../../services/api";
import { useStore } from "../../store/useStore";

interface NewTransferScreenProps {
  onBack: () => void;
  onSelectContact: (contact: any) => void;
}

export function NewTransferScreen({
  onBack,
  onSelectContact,
}: NewTransferScreenProps) {
  const [accountNumber, setAccountNumber] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const selectedNetwork = "EVM (Arc Testnet)";
  const [isChecking, setIsChecking] = useState(false);
  const [isVerifyingAddress, setIsVerifyingAddress] = useState(false);
  const [showReceiverDetail, setShowReceiverDetail] = useState(false);
  const [addressVerified, setAddressVerified] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Helper to validate EVM address format
  const validateAddressFormat = (addr: string) => {
    const clean = addr.trim();
    if (!clean) return null;
    if (!clean.startsWith("0x")) return "Address must start with 0x";
    if (!/^0x[a-fA-F0-9]*$/.test(clean)) return "Invalid characters in address";
    if (clean.length < 42) return "Address is too short";
    if (clean.length > 42) return "Address is too long";
    return null;
  };

  // Helper for gradient avatar
  const getIdenticonGradient = (address: string) => {
    if (!address || address.length < 20)
      return { background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)" };

    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      hash = address.charCodeAt(i) + ((hash << 5) - hash);
    }

    const h1 = Math.abs(hash) % 360;
    const h2 = (h1 + 40) % 360;

    return {
      background: `linear-gradient(135deg, hsl(${h1}, 80%, 75%), hsl(${h2}, 70%, 55%))`,
    };
  };

  const formatShortAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const getFallbackName = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `User_${formatShortAddress(addr)}`;
  };

  // Auto-verify address when pasted/typed
  useEffect(() => {
    const cleanAddress = accountNumber.trim();
    const formatError = validateAddressFormat(cleanAddress);

    setAddressError(formatError);

    // Only verify with DB if the format is strictly valid (0x + 40 hex chars)
    if (!formatError && cleanAddress.length === 42) {
      const verifyAddress = async () => {
        setIsVerifyingAddress(true);
        try {
          const data = await BackendClient.resolveAddress(cleanAddress);
          if (data && data.name) {
            setReceiverName(data.name);
            setAddressVerified(true);
          } else {
            setAddressVerified(false);
          }
        } catch (err) {
          console.error("Verification error:", err);
          setAddressVerified(false);
        } finally {
          setIsVerifyingAddress(false);
        }
      };

      const timer = setTimeout(verifyAddress, 300);
      return () => clearTimeout(timer);
    } else {
      if (addressVerified) setAddressVerified(false);
    }
  }, [accountNumber]);

  const handlePaste = (e: React.ClipboardEvent) => {
    // Force immediate validation on paste
    const pastedText = e.clipboardData.getData("text").trim();
    if (pastedText.startsWith("0x")) {
      console.debug("Manual paste detected:", pastedText);
    }
  };

  const handleContinue = () => {
    if (!accountNumber || accountNumber.length < 42 || addressError) return;
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      setShowReceiverDetail(true);
    }, 800);
  };

  const finalName =
    addressVerified && receiverName
      ? receiverName
      : getFallbackName(accountNumber);

  const initials = finalName
    ? finalName
        .trim()
        .replace(/@/g, "")
        .replace(/User_/g, "")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "??";

  return (
    <div className="absolute inset-0 w-full h-full bg-slate-50 relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex justify-center bg-slate-900 shadow-md relative z-10 shrink-0 w-full">
        <div className="flex items-center justify-between px-4 pt-6 pb-3 w-full max-w-[500px]">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h2 className="font-bold text-[16px] text-white ml-2 uppercase tracking-tight">
              New Transfer
            </h2>
          </div>
        </div>
      </div>

      <div className="px-5 w-full flex-1 overflow-y-auto scrollbar-hide pb-32">
        <div className="w-full max-w-[500px] mx-auto flex flex-col relative h-full">
        {/* Tabs */}
        <div className="flex w-full mt-6 mb-6">
          <div className="flex-1 flex justify-center items-center gap-2 border-r border-slate-200 cursor-pointer">
            <Landmark size={18} className="text-slate-800" />
            <span className="text-slate-800 font-bold text-[14px]">
              Account
            </span>
          </div>
          <div className="flex-1 flex justify-center items-center gap-2 cursor-pointer group">
            <AtSign
              size={18}
              className="text-slate-400 group-hover:text-slate-500 transition-colors"
            />
            <span className="text-slate-400 font-bold text-[14px] group-hover:text-slate-500 transition-colors">
              Proxy
            </span>
          </div>
        </div>

        {/* Transfer Form Container */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 mb-6 flex flex-col gap-6 relative">
          {/* Wallet Address Input */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left">
              Wallet Address
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="0x..."
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.trim())}
                onPaste={handlePaste}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[13px] font-mono font-medium text-slate-800 outline-none focus:border-slate-300 focus:bg-white transition-colors placeholder:text-slate-300 pr-12"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isVerifyingAddress && (
                  <Loader2 size={16} className="text-slate-400 animate-spin" />
                )}
                {/* CheckCircle is removed from here and moved to the dynamic card */}
                {accountNumber && (
                  <button
                    onClick={() => {
                      setAccountNumber("");
                      setReceiverName("");
                      setAddressVerified(false);
                      setAddressError(null);
                    }}
                    className="w-[20px] h-[20px] bg-slate-300 rounded-full flex items-center justify-center text-white hover:bg-slate-400 transition-colors border-0"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                )}
              </div>
            </div>
            {addressError && accountNumber.length > 20 && (
              <span className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-widest text-left">
                {addressError}
              </span>
            )}
          </div>

          {/* Dynamic Receiver Profile Card */}
          {accountNumber.length === 42 &&
            !addressError &&
            !isVerifyingAddress && (
              <div className="border border-slate-100 rounded-[16px] p-4 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] animate-in fade-in zoom-in-95 duration-300 bg-white">
                <div className="flex items-center gap-4">
                  {addressVerified && receiverName ? (
                    <>
                      <div className="w-[42px] h-[42px] rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-[14px]">
                        {initials}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-800 text-[15px]">
                          {receiverName}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <CheckCircle2
                            size={12}
                            className="text-emerald-500"
                          />
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                            Verified Arc User
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className="w-[42px] h-[42px] rounded-full border border-slate-200 shadow-sm"
                        style={getIdenticonGradient(accountNumber)}
                      ></div>
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-900 text-[15px]">
                          {finalName}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            External Network
                          </span>
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white border border-slate-100 shadow-sm">
                            <span
                              className={
                                addressVerified
                                  ? "text-[8px] text-emerald-500"
                                  : "text-[8px] text-amber-500"
                              }
                            >
                              {addressVerified ? "🟢" : "🟡"}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase tracking-tight ${addressVerified ? "text-emerald-600" : "text-amber-600"}`}
                            >
                              {addressVerified ? "Connected" : "Not Linked"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
        </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="absolute bottom-0 left-0 right-0 w-full z-20 flex justify-center pb-5 bg-gradient-to-t from-slate-50 to-transparent">
        <div className="w-full max-w-[500px] px-5">
          <button
          onClick={handleContinue}
          disabled={
            !!addressError ||
            !accountNumber ||
            accountNumber.length < 42 ||
            isVerifyingAddress
          }
          className={`w-full py-4 rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-2
              ${
                !addressError &&
                accountNumber.length === 42 &&
                !isVerifyingAddress
                  ? "bg-slate-900 text-white shadow-[0_8px_20px_-8px_rgba(15,23,42,0.4)] hover:bg-slate-800 active:scale-[0.98]"
                  : "bg-slate-200 text-slate-400 shadow-none opacity-80"
              }`}
        >
          Continue
        </button>
        </div>
      </div>

      {/* Check Receiver Details Modal */}
      {(isChecking || showReceiverDetail) && (
        <div className="absolute inset-0 z-[60] bg-black/40 flex flex-col justify-end transition-opacity overflow-hidden">
          {isChecking ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-[60px] h-[60px] bg-white rounded-full flex items-center justify-center shadow-lg relative">
                <div className="w-10 h-10 border-[3px] border-[#008fcd] border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-t-[24px] w-full flex flex-col pb-8 pt-6 shadow-2xl animate-in slide-in-from-bottom duration-300 relative">
              <div className="px-5 pb-4 flex justify-between items-center mb-2">
                <h3 className="font-bold text-[18px] text-slate-800">
                  Check Receiver Details
                </h3>
              </div>

              <div className="px-5 flex flex-col gap-4">
                <div className="border border-slate-100 rounded-[16px] p-5 flex flex-col items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                  {addressVerified && receiverName ? (
                    <div className="w-[52px] h-[52px] rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-[16px] mb-3">
                      {initials}
                    </div>
                  ) : (
                    <div
                      className="w-[52px] h-[52px] rounded-full shadow-sm mb-3 border border-slate-200"
                      style={getIdenticonGradient(accountNumber)}
                    ></div>
                  )}
                  <h4 className="font-extrabold text-[16px] text-slate-800 text-center tracking-tight">
                    {finalName}
                  </h4>
                  <p className="text-slate-500 text-[13px] text-center mt-1">
                    {selectedNetwork} - {formatShortAddress(accountNumber)}
                  </p>
                </div>

                <p className="text-slate-500 text-[13px] text-center mt-2 mb-1 px-4">
                  Ensure the transfer recipient details are correct.
                </p>

                <button
                  onClick={() => {
                    setShowReceiverDetail(false);
                    onSelectContact({
                      id: "new",
                      name: finalName,
                      network: selectedNetwork,
                      account: accountNumber,
                      initials: initials,
                    });
                  }}
                  className="w-full bg-slate-900 text-white py-[14px] rounded-full font-bold text-[15px] shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all"
                >
                  Continue
                </button>
                <button
                  onClick={() => setShowReceiverDetail(false)}
                  className="w-full bg-transparent text-[#008fcd] py-1 rounded-full font-bold text-[15px] hover:bg-slate-50 active:scale-[0.98] transition-all mt-[-4px]"
                >
                  Change Account
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default NewTransferScreen;
