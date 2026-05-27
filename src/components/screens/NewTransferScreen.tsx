import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  X,
  Zap,
  Landmark,
  AtSign,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

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
  const [showNetworkSelect, setShowNetworkSelect] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState("EVM (Arc Testnet)");
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
          // Normalize to lowercase for consistency
          const addrToSearch = cleanAddress.toLowerCase();

          const { data, error } = await supabase
            .from("profiles")
            .select("full_name, username")
            .eq("wallet_address", addrToSearch)
            .maybeSingle();

          if (!error && data) {
            const name = data.full_name || data.username || "";
            if (name) {
              setReceiverName(name);
              setAddressVerified(true);
            } else {
              setAddressVerified(false);
            }
          } else {
            // Not found in DB - let user type manually, don't reset name if they already started
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
    if (!accountNumber || !receiverName) return;
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      setShowReceiverDetail(true);
    }, 800);
  };

  const initials = receiverName.trim()
    ? receiverName
        .trim()
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "?";

  return (
    <div className="absolute inset-0 w-full h-full bg-slate-50 relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 shrink-0">
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

      <div className="px-5 w-full flex-1 overflow-y-auto scrollbar-hide pb-32">
        {/* Tabs */}
        <div className="flex w-full mt-6 mb-6">
          <div className="flex-1 flex justify-center items-center gap-2 border-r border-slate-200 cursor-pointer">
            <Landmark size={18} className="text-slate-800" />
            <span className="text-slate-800 font-bold text-[14px]">Account</span>
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
          
          {/* Network Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left">
              Network
            </label>
            <div
              onClick={() => setShowNetworkSelect(true)}
              className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl transition-colors hover:border-slate-300 cursor-pointer"
            >
              <div className="flex items-center gap-3 text-left">
                <span className="text-slate-800 font-bold text-[15px]">
                  {selectedNetwork}
                </span>
              </div>
              <ChevronDown className="text-slate-500" size={20} />
            </div>
          </div>

          {/* Wallet Address Input */}
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-5 mt-2">
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
                {addressVerified && (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                )}
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

          {/* Receiver Name Input */}
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-5 mt-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left">
              Receiver Name
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter full name"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className={`w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[14px] font-bold outline-none focus:border-slate-300 focus:bg-white transition-colors placeholder:text-slate-300 pr-12 ${addressVerified ? "text-emerald-600" : "text-slate-800"}`}
              />
              {!addressVerified && receiverName && (
                <button
                  onClick={() => setReceiverName("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-[20px] h-[20px] bg-slate-300 rounded-full flex items-center justify-center text-white hover:bg-slate-400 transition-colors border-0"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              )}
            </div>
            {addressVerified && (
              <span className="text-[10px] font-bold text-emerald-500 mt-1 uppercase tracking-widest text-left">
                Verified Arc User
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="absolute bottom-0 left-0 right-0 p-5 w-full z-20">
        <button
          onClick={handleContinue}
          disabled={
            !!addressError ||
            !accountNumber ||
            accountNumber.length < 42 ||
            !receiverName.trim()
          }
          className={`w-full py-4 rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-2
              ${
                !addressError &&
                accountNumber.length === 42 &&
                receiverName.trim().length > 0
                  ? "bg-slate-900 text-white shadow-[0_8px_20px_-8px_rgba(15,23,42,0.4)] hover:bg-slate-800 active:scale-[0.98]"
                  : "bg-slate-200 text-slate-400 shadow-none opacity-80"
              }`}
        >
          Continue
        </button>
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
                  <div className="w-[52px] h-[52px] rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[16px] mb-3">
                    {initials}
                  </div>
                  <h4 className="font-extrabold text-[16px] text-slate-800 text-center tracking-tight">
                    {receiverName}
                  </h4>
                  <p className="text-slate-500 text-[13px] text-center mt-1">
                    {selectedNetwork} - {accountNumber}
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
                      name: receiverName,
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

      {/* Network Select Overlay */}
      {showNetworkSelect && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in fade-in slide-in-from-right-8 duration-200">
          {/* Overlay Header */}
          <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full justify-between shrink-0">
            <div className="flex items-center">
              <button
                onClick={() => setShowNetworkSelect(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
              <h2 className="font-bold text-[16px] text-white ml-2">
                NETWORK LIST
              </h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto w-full">
            <div className="p-4">
              <div className="bg-[#f0f2f5] rounded-[16px] p-4 flex gap-3 items-start mb-4 text-left">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-4 h-4 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                    i
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-slate-800 font-bold text-[14px] leading-snug">
                    Unsure which network to choose?
                  </p>
                  <p className="text-slate-600 text-[13px] leading-snug">
                    Select the network that matches the network on your
                    recipient's platform.
                  </p>
                  <div className="flex items-center gap-1 mt-1 cursor-pointer">
                    <span className="text-slate-800 font-bold text-[13px]">
                      Learn more
                    </span>
                    <ArrowRight
                      size={14}
                      className="text-slate-800"
                      strokeWidth={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6 mt-6 pb-12 text-left">
                {[
                  {
                    name: "EVM (Arc Testnet)",
                    fee: "Fee 0.0001 USDC (~$0.0001)",
                    time: "Estimated arrival time: ~ 1 minute",
                    logoBg: "bg-slate-900",
                    logoForeground: (
                      <Zap
                        className="text-white fill-white scale-[1.2]"
                        size={16}
                      />
                    ),
                  },
                  {
                    name: "X Layer (USDT0)",
                    fee: "Fee 0.0022 USDT (~$0.0021)",
                    time: "Estimated arrival time: ~ 2 minutes",
                    logoBg: "bg-black",
                    logoForeground: (
                      <div className="grid grid-cols-2 gap-[2px] w-[16px] h-[16px]">
                        <div className="bg-white rounded-[2px]"></div>
                        <div
                          className="bg-white rounded-[2px]"
                          style={{ opacity: 0 }}
                        ></div>
                        <div className="bg-white rounded-[2px]"></div>
                        <div className="bg-white rounded-[2px]"></div>
                      </div>
                    ),
                  },
                  {
                    name: "Tron (TRC20)",
                    fee: "Fee 1.5 USDT (~$1.4992)",
                    time: "Estimated arrival time: ~ 2 minutes",
                    logoBg: "bg-[#db2e38]",
                    logoForeground: (
                      <div className="border-[7px] border-transparent border-b-white transform -translate-y-1"></div>
                    ),
                  },
                  {
                    name: "Ethereum (ERC20)",
                    fee: "Fee 0.18 USDT (~$0.1799)",
                    time: "Estimated arrival time: ~ 2 minutes",
                    logoBg: "bg-[#5e77db]",
                    logoForeground: (
                      <div
                        className="w-[12px] h-[18px] bg-white transform rotate-45 rounded-[2px] scale-y-[1.2] clip-path-rhombus"
                        style={{
                          clipPath:
                            "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                        }}
                      ></div>
                    ),
                  },
                  {
                    name: "Aptos",
                    fee: "Fee 0.0015 USDT (~$0.0014)",
                    time: "Estimated arrival time: ~ 2 minutes",
                    logoBg: "bg-black",
                    logoForeground: (
                      <div className="flex flex-col gap-[3px] w-[20px]">
                        <div className="h-[3px] bg-white rounded-full w-full"></div>
                        <div className="h-[3px] bg-white rounded-full w-[80%] ml-auto"></div>
                        <div className="h-[3px] bg-white rounded-full w-full"></div>
                      </div>
                    ),
                  },
                  {
                    name: "Arbitrum One (USDT0)",
                    fee: "Fee 0.0029 USDT (~$0.0028)",
                    time: "Estimated arrival time: ~ 2 minutes",
                    logoBg: "bg-[#213a5b]",
                    logoForeground: (
                      <div className="flex gap-1 items-end">
                        <div className="w-[4px] h-[12px] bg-[#28A0F0] rounded-sm"></div>
                        <div className="w-[4px] h-[16px] bg-[#28A0F0] rounded-sm"></div>
                        <div className="w-[4px] h-[10px] bg-[#28A0F0] rounded-sm"></div>
                      </div>
                    ),
                  },
                  {
                    name: "Avalanche C-Chain",
                    fee: "Fee 0.00043 USDT (~$0.0004)",
                    time: "Estimated arrival time: ~ 2 minutes",
                    logoBg: "bg-[#e84142]",
                    logoForeground: (
                      <div className="border-[8px] border-transparent border-b-white rounded-[2px] transform scale-x-[0.8] -translate-y-[2px]"></div>
                    ),
                  },
                ].map((net, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 cursor-pointer group px-1"
                    onClick={() => {
                      setSelectedNetwork(net.name);
                      setShowNetworkSelect(false);
                    }}
                  >
                    <div
                      className={`w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0 ${net.logoBg} mt-0.5 overflow-hidden border border-slate-100 shadow-sm transition-transform group-active:scale-95`}
                    >
                      {net.logoForeground}
                    </div>
                    <div className="flex flex-col gap-[1px]">
                      <span className="font-semibold text-slate-800 text-[15.5px] tracking-tight">
                        {net.name}
                      </span>
                      <span className="text-slate-500 text-[13px]">
                        {net.fee}
                      </span>
                      <span className="text-slate-500 text-[13px]">
                        {net.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default NewTransferScreen;
