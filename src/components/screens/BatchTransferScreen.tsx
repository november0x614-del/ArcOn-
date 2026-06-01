import React, { useState } from "react";
import {
  ArrowLeft,
  Users,
  Send,
  Trash2,
  CheckCircle2,
  Loader2,
  Plus,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";
import { useApp } from "../../contexts/AppContext";
import { Contact } from "../../types";

interface BatchTransferScreenProps {
  onBack: () => void;
  onViewReceipt: (txId: string) => void;
  contacts: Contact[];
}

export function BatchTransferScreen({
  onBack,
  onViewReceipt,
  contacts,
}: BatchTransferScreenProps) {
  const {
    balance,
    fetchBalance,
    fetchTransactions,
    displayToast,
    registeredUser,
    platformConfig,
    fetchPlatformConfig,
  } = useApp();

  React.useEffect(() => {
    if (!platformConfig) {
      fetchPlatformConfig();
    }
  }, [platformConfig, fetchPlatformConfig]);

  const [multiSendStep, setMultiSendStep] = useState<
    "form" | "confirm" | "success"
  >("form");
  const [recipients, setRecipients] = useState<
    {
      id: string;
      address: string;
      displayAddress: string;
      name: string;
      amount: string;
    }[]
  >([]);
  const [newAddress, setNewAddress] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [selectedQuickAddIds, setSelectedQuickAddIds] = useState<string[]>([]);
  const [modalSearchQuery, setModalSearchQuery] = useState("");

  const filteredModalContacts = (contacts || []).filter(
    (c) =>
      c.name.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
      c.number.toLowerCase().includes(modalSearchQuery.toLowerCase()),
  );

  const addRecipientItem = () => {
    if (!newAddress || !newAmount) return;

    const addressList = newAddress.split(/[\s,]+/).filter(Boolean);
    const newItems: typeof recipients = [];
    const invalidList: string[] = [];

    addressList.forEach((addr) => {
      const match = contacts.find(
        (c) =>
          (c.number?.toLowerCase() || "") === (addr?.toLowerCase() || "") ||
          (c.name?.toLowerCase() || "") === (addr?.toLowerCase() || "") ||
          (c.number || "").includes(addr),
      );
      const fullAddr = match ? match.number : addr;

      if (!fullAddr.startsWith("0x") || fullAddr.length !== 42) {
        invalidList.push(addr);
      } else {
        const name = match
          ? match.name
          : `Recipient #${recipients.length + newItems.length + 1}`;
        const formattedAddress = `${fullAddr.substring(0, 6)}...${fullAddr.substring(fullAddr.length - 4)}`;

        newItems.push({
          id: `${fullAddr}-${Date.now()}-${Math.random()}`,
          address: fullAddr,
          displayAddress: formattedAddress,
          name,
          amount: newAmount,
        });
      }
    });

    if (invalidList.length > 0) {
      displayToast(
        `Format alamat tidak valid untuk: ${invalidList.join(", ")}. Harus berformat 0x dengan 42 karakter.`
      );
      return;
    }

    setRecipients((prev) => [...prev, ...newItems]);
    setNewAddress("");
    setNewAmount("");
    setIsAddedFeedback(true);
    setTimeout(() => {
      setIsAddedFeedback(false);
    }, 1000);
  };

  const removeRecipientItem = (index: number) => {
    setRecipients((prev) => prev.filter((_, i) => i !== index));
  };

  // Dynamic Fee Calculation
  // Formula: BATCH_BASE_FEE + (BATCH_PER_RECIPIENT_FEE * (total_recipients - 1))
  const getBatchFees = () => {
    if (recipients.length === 0) return { base: 0, incremental: 0, total: 0 };
    
    // Parse values from platformConfig
    const baseFee = platformConfig?.batchBaseFee 
      ? parseFloat(platformConfig.batchBaseFee.replace(/[^0-9.]/g, '')) || 0.15
      : 0.15;
      
    const incrementalFee = platformConfig?.batchPerRecipientFee
      ? parseFloat(platformConfig.batchPerRecipientFee.replace(/[^0-9.]/g, '')) || 0.02
      : 0.02;
    
    const incrementalTotal = incrementalFee * (recipients.length - 1);
    
    return {
      base: baseFee,
      incremental: incrementalFee,
      incrementalTotal: incrementalTotal,
      total: baseFee + incrementalTotal
    };
  };

  const fees = getBatchFees();
  const PLATFORM_FEE = fees.total;
  const NETWORK_GAS = platformConfig?.gasSubsidyEnabled ? 0.0 : 0.05;

  const totalPayout = recipients.reduce(
    (acc, curr) => acc + parseFloat(curr.amount || "0"),
    0,
  );

  const totalRequired = totalPayout + PLATFORM_FEE + NETWORK_GAS;
  const hasEnoughBalance = recipients.length > 0 && balance >= totalRequired;

  const startProcessing = () => {
    if (!hasEnoughBalance) {
      displayToast(
        "Insufficient balance for this batch transfer including fees.",
      );
      return;
    }
    setMultiSendStep("confirm");
  };

  const [actualTxId, setActualTxId] = useState<string>("");

  const executeBatch = async () => {
    setIsSending(true);
    setProcessingStatus("Packaging transaction inputs...");

    try {
      setProcessingStatus(
        "Executing atomic batch transaction on Arc Testnet via Circle SDK...",
      );
      const response = await fetch("/api/payments/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: registeredUser?.supabaseUid,
          walletId: registeredUser?.walletId,
          recipients: recipients,
          platformFee: PLATFORM_FEE,
        }),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Batch transfer failed");

      setProcessingStatus("Broadcasting successfully completed.");
      if (result.txId) {
        setActualTxId(result.txId);
      }

      // Update global state
      await fetchBalance();
      await fetchTransactions();

      setMultiSendStep("success");
    } catch (error: any) {
      console.error("Batch send failed", error);
      let errorMessage = error.message;
      if (errorMessage.includes("blocklisted")) {
        errorMessage =
          "Batch aborted: One or more recipients are in the blocklist.";
      }
      displayToast(errorMessage || "Batch transfer failed.");
      setMultiSendStep("form");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#ecf5fc] relative flex flex-col items-center overflow-hidden z-50">
      {/* Header */}
      <div className="flex justify-center bg-slate-900 shadow-md relative z-10 w-full shrink-0">
        <div className="flex items-center px-4 pt-6 pb-3 w-full max-w-[500px] justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h2 className="font-bold text-[16px] text-white ml-2">
              BATCH TRANSFER
            </h2>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="w-full bg-white border-b border-slate-100 flex justify-center shrink-0">
        <div className="w-full max-w-[500px] px-5 py-3 flex gap-2">
          <div
            className="h-1.5 flex-1 rounded-full bg-slate-900"
          ></div>
          <div
            className={`h-1.5 flex-1 rounded-full ${multiSendStep === "confirm" || multiSendStep === "success" ? "bg-slate-900" : "bg-slate-100"}`}
          ></div>
          <div
            className={`h-1.5 flex-1 rounded-full ${multiSendStep === "success" ? "bg-slate-900" : "bg-slate-100"}`}
          ></div>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col overflow-y-auto pb-24 scrollbar-hide">
        <div className="w-full max-w-[500px] mx-auto flex flex-col relative h-full">
        {/* Content Step Logic */}
        <div className="p-5">
          {/* Step 1: Info Screen */}
          {multiSendStep === "info" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <div className="flex flex-col items-center text-center mt-6 mb-8">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-800 mb-4 shadow-sm">
                  <Users size={40} />
                </div>
                <h3 className="font-extrabold text-[24px] text-slate-900 tracking-tight">
                  Multi-Recipient Send
                </h3>
                <p className="text-[14px] text-slate-500 max-w-[300px] mt-2 leading-relaxed">
                  Efficiently distribute USDC to multiple addresses on the Arc
                  Testnet using Circle SDK.
                </p>
              </div>

              <div className="flex flex-col gap-4 text-left">
                <div className="flex gap-4 items-start p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-200 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                    <Send size={22} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[16px] font-bold text-slate-900">
                      Batch Transactions
                    </h4>
                    <p className="text-[13px] text-slate-500 mt-1">
                      Combine up to 100 transfers into a single on-chain
                      execution.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <button
                  onClick={() => setMultiSendStep("form")}
                  className="w-full bg-slate-900 text-white py-4 rounded-full font-bold text-[16px] shadow-lg shadow-blue-500/20 hover:bg-slate-800 active:scale-[0.98] transition-all"
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Form Tool Screen */}
          {multiSendStep === "form" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col text-left"
            >
              <div className="mb-6">
                <h3 className="font-extrabold text-[20px] text-slate-800 tracking-tight">
                  Recipients Batch
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Manage the list of recipients and USDC amounts.
                </p>
              </div>

              {/* Recipient Cards */}
              <div className="space-y-3 mb-6">
                {recipients.map((recipient, idx) => (
                  <div
                    key={recipient.id}
                    className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm relative group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-sm shrink-0">
                      {recipient.name.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900 text-[14px] truncate">
                          {recipient.name}
                        </p>
                        <span
                          className="font-mono text-[11px] text-slate-400 truncate max-w-[120px] ml-2"
                          title={recipient.address}
                        >
                          {recipient.displayAddress}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[12px] font-semibold text-slate-400">
                          Total:
                        </span>
                        <input
                          type="number"
                          value={recipient.amount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRecipients((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, amount: val } : item,
                              ),
                            );
                          }}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[13px] font-bold text-slate-900 w-24 focus:outline-none focus:border-slate-900 font-mono"
                        />
                        <span className="text-[12px] font-bold text-slate-500 tracking-wide">
                          USDC
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeRecipientItem(idx)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

                {recipients.length === 0 && (
                  <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50/50">
                    <Users size={32} strokeWidth={1.5} />
                    <p className="text-[13px] font-medium">
                      No recipients added to batch
                    </p>
                  </div>
                )}
              </div>

              {/* Input Tooling */}
              <div className="bg-slate-100/50 border border-slate-200/50 rounded-[24px] p-5 mb-8 flex flex-col gap-4">
                <div className="flex justify-end items-center w-full mb-1">
                  <button
                    onClick={() => {
                      setSelectedQuickAddIds([]);
                      setShowQuickAddModal(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border-0 rounded-full text-white text-[13px] font-bold shadow-sm hover:bg-slate-800 transition-all active:scale-[0.97] cursor-pointer"
                  >
                    <Plus size={14} strokeWidth={3} />
                    Add from Contacts
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Set Amount (USDC)"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-[14px] font-bold text-slate-900 focus:outline-none focus:border-slate-900 font-mono shadow-sm"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-black text-slate-400">
                      USDC
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <textarea
                      placeholder="Recipient Addresses (comma or space separated)"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-[14px] font-mono text-slate-900 w-full focus:outline-none focus:border-slate-900 min-h-[110px] shadow-sm resize-y leading-relaxed"
                      rows={3}
                    />
                    <button
                      onClick={addRecipientItem}
                      disabled={!newAddress || !newAmount}
                      className={`w-full h-[52px] rounded-2xl font-black text-[14px] transition-all duration-300 active:scale-[0.95] shrink-0 shadow-md flex items-center justify-center border-0 cursor-pointer ${
                        isAddedFeedback
                          ? "bg-emerald-600 text-white shadow-emerald-200"
                          : "bg-[#005faa] text-white hover:bg-[#004780] disabled:opacity-30 disabled:shadow-none"
                      }`}
                    >
                      {isAddedFeedback
                        ? "✓ ADDED SUCCESSFULLY"
                        : "ADD RECIPIENTS TO BATCH"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary info */}
              {recipients.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-2 mb-10 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-slate-500 font-bold">
                      Recipients
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {recipients.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-slate-500 font-bold">
                      Total Payout
                    </span>
                    <span className="font-mono font-extrabold text-slate-800 text-lg">
                      {recipients
                        .reduce(
                          (acc, curr) => acc + parseFloat(curr.amount || "0"),
                          0,
                        )
                        .toFixed(2)}{" "}
                      USDC
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-[12px] text-slate-400 font-medium">
                      Estimated Gas Saving
                    </span>
                    <span className="text-emerald-500 font-black text-[14px]">
                      ~94.2% Saved
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={startProcessing}
                disabled={recipients.length === 0 || !hasEnoughBalance}
                className={`w-full h-16 rounded-[22px] font-bold text-[16px] active:scale-[0.97] transition-all mb-10 border-0 cursor-pointer flex items-center justify-center shadow-lg
                  ${
                    recipients.length === 0
                      ? "bg-dash-100 text-slate-400 opacity-30 shadow-none cursor-not-allowed"
                      : !hasEnoughBalance
                        ? "bg-red-50 text-red-500 border border-red-100 cursor-not-allowed"
                        : "bg-[#0B192C] text-white shadow-slate-200 hover:bg-slate-800"
                  }
                `}
              >
                {recipients.length > 0 && !hasEnoughBalance ? "Insufficient Balance" : "Review Batch Send"}
              </button>
            </motion.div>
          )}

          {/* Step 2.5: Confirmation Screen */}
          {multiSendStep === "confirm" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col text-left"
            >
              <div className="mb-6">
                <h3 className="font-extrabold text-[22px] text-slate-900 tracking-tight">
                  Transfer Confirmation
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Please review the batch details and fees.
                </p>
              </div>

              <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm mb-6">
                <div className="space-y-4 mb-6">
                  {recipients.slice(0, 3).map((rec) => {
                    const isNameVerified =
                      rec.name &&
                      !rec.name.startsWith("User_") &&
                      !rec.name.startsWith("Scanned");
                    return (
                      <div
                        key={rec.id}
                        className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100/30"
                      >
                        <div className="flex flex-col min-w-0 flex-1 mr-3">
                          <span className="font-bold text-slate-900 text-[14px] truncate">
                            {rec.name}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] text-slate-400">
                              {rec.displayAddress}
                            </span>
                            <span
                              className={`text-[8px] ${isNameVerified ? "text-emerald-500" : "text-amber-500"}`}
                            >
                              {isNameVerified ? "🟢" : "🟡"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="font-bold text-slate-900 text-[14px]">
                            {parseFloat(rec.amount).toFixed(2)}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            USDC
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {recipients.length > 3 && (
                    <div className="text-center py-2 border-t border-slate-50 mt-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        + {recipients.length - 3} more recipients
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-5 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-slate-500 font-bold">
                      Total Payout
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {totalPayout.toFixed(2)} USDC
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-slate-500 font-bold flex items-center gap-1.5">
                      Platform Fee
                      <div
                        className="w-3.5 h-3.5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[8px] font-black cursor-help"
                        title={`Base: ${fees.base.toFixed(2)} + ${fees.incremental.toFixed(2)} per extra recipient`}
                      >
                        i
                      </div>
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="font-mono font-bold text-slate-800">
                        {PLATFORM_FEE.toFixed(2)} USDC
                      </span>
                      {recipients.length > 1 && (
                        <span className="text-[9px] text-slate-400 font-medium">
                          ({fees.base.toFixed(2)} + {fees.incrementalTotal.toFixed(2)})
                        </span>
                      )}
                    </div>
                  </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-[13px] text-slate-500 font-bold">
                        Network Gas {platformConfig?.gasSubsidyEnabled && "(Sponsored)"}
                      </span>
                      {platformConfig?.gasSubsidyEnabled ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md w-fit">
                          Free
                        </span>
                      ) : (
                        <span className="font-mono font-bold text-slate-800">
                          {NETWORK_GAS.toFixed(2)} USDC
                        </span>
                      )}
                    </div>

                  <div className="pt-4 mt-2 border-t-2 border-dashed border-slate-100 flex justify-between items-center">
                    <span className="text-[15px] text-slate-900 font-black">
                      Total Amount
                    </span>
                    <span className="text-[20px] font-mono font-black text-slate-900">
                      {totalRequired.toFixed(2)} USDC
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  disabled={isSending}
                  onClick={executeBatch}
                  className={`w-full text-white py-[18px] rounded-full flex justify-between px-6 items-center shadow-[0_4px_14px_rgba(15,23,42,0.3)] border-0 transition-all duration-300 ${
                    isSending 
                      ? "bg-[#0B1527] cursor-not-allowed cursor-wait" 
                      : "bg-slate-900 hover:bg-slate-800 active:scale-[0.98] cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isSending ? (
                      <>
                        <div className="w-5 h-5 border-[2.5px] border-white/20 border-t-white rounded-full animate-spin"></div>
                        <span className="font-bold text-[15px] tracking-wide">Broadcasting Atomic Batch...</span>
                      </>
                    ) : (
                      <span className="font-bold text-[15px]">Confirm & Execute</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-[16px] tracking-tight">
                      {totalRequired.toFixed(2)} USDC
                    </span>
                    {!isSending && (
                      <div className="bg-white/20 w-8 h-8 rounded-full border-0 flex items-center justify-center shadow-inner">
                        <ArrowRight size={18} strokeWidth={3} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setMultiSendStep("form")}
                  className="w-full py-4 text-slate-400 font-bold text-[14px] hover:text-slate-600 transition-colors uppercase tracking-widest border-0 bg-transparent cursor-pointer"
                >
                  Edit Recipients List
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Success Screen */}
          {multiSendStep === "success" && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-6 text-center"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 mx-auto shadow-sm">
                <CheckCircle2 size={42} strokeWidth={2.5} />
              </div>
              <h3 className="font-black text-[26px] text-slate-900 tracking-tight">
                Success!
              </h3>
              <p className="text-[15px] text-slate-500 mt-2 max-w-[320px] mb-8 mx-auto leading-relaxed">
                Transaction batch successfully confirmed on Arc Testnet.
              </p>

              <div className="bg-white border-[1.5px] border-slate-100 rounded-[32px] p-6 text-left mb-8 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4 mb-4">
                  <span>Batch Distribution</span>
                  <span className="text-[#005faa] bg-[#005faa]/5 px-2.5 py-1 rounded-lg">
                    Verified Payout
                  </span>
                </div>
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 mb-4 custom-scrollbar">
                  {recipients.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex justify-between items-center bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100/50"
                    >
                      <div className="flex flex-col min-w-0 flex-1 mr-4">
                        <span className="font-bold text-slate-900 text-[14px] truncate leading-tight">
                          {rec.name ||
                            (rec.address
                              ? `User_${rec.address.slice(0, 6)}...${rec.address.slice(-4)}`
                              : "Recipient")}
                        </span>
                        <span
                          className="font-mono text-[10px] text-slate-400 mt-1"
                          title={rec.address}
                        >
                          {rec.address
                            ? `${rec.address.slice(0, 10)}...${rec.address.slice(-6)}`
                            : rec.displayAddress}
                        </span>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-center gap-1">
                          <span className="font-black text-slate-900 text-[15px]">
                            {parseFloat(rec.amount || "0").toFixed(2)}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            USDC
                          </span>
                        </div>
                        <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter mt-0.5">
                          Confirmed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center border-t border-slate-50 pt-5 mt-2">
                  <span className="text-[12px] font-bold text-slate-500">
                    Total Transferred
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-slate-800 text-[18px]">
                      {recipients
                        .reduce(
                          (acc, curr) => acc + parseFloat(curr.amount || "0"),
                          0,
                        )
                        .toFixed(2)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      USDC
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider italic">
                    Circle Tx ID
                  </span>
                  <span className="font-mono text-[10px] text-[#10b981] bg-[#10b981]/5 px-3 py-2 rounded-xl border border-[#10b981]/10 break-all leading-relaxed font-bold">
                    {actualTxId || "ARC_BATCH_FINALIZED"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={onBack}
                  className="w-full h-16 bg-[#0B192C] text-white rounded-[22px] font-bold text-[16px] shadow-lg shadow-slate-200 active:scale-[0.97] transition-all flex items-center justify-center gap-3 border-0 cursor-pointer"
                >
                  Back to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </div>
        </div>
      </div>

      {/* Quick Add Selection Modal */}
      {showQuickAddModal && (
        <div className="absolute inset-0 bg-slate-900/60 z-[100] flex flex-col justify-end">
          <div className="bg-white rounded-t-[28px] max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="text-left">
                <h3 className="font-extrabold text-[18px] text-slate-800">
                  Select Contacts
                </h3>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Pick contacts one-by-one or select all to add instantly
                </p>
              </div>
              <button
                onClick={() => setShowQuickAddModal(false)}
                className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-400 font-bold border-0 bg-transparent cursor-pointer"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="w-5 h-5"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Search Input Area */}
            <div className="px-5 pt-5 pb-2 shrink-0">
              <div className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3 focus-within:bg-white focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-900/5 transition-all">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="w-4 h-4 text-slate-400"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Search name or 0x address..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-none text-[14px] font-medium text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Select All Controller */}
            <div className="px-5 py-3 border-b border-slate-50 flex justify-between items-center shrink-0 bg-slate-50/50">
              <span className="text-[13px] font-bold text-slate-500">
                {selectedQuickAddIds.length} of {filteredModalContacts.length}{" "}
                Contacts Selected
              </span>
              <button
                onClick={() => {
                  if (
                    selectedQuickAddIds.length === filteredModalContacts.length
                  ) {
                    setSelectedQuickAddIds([]);
                  } else {
                    setSelectedQuickAddIds(
                      filteredModalContacts.map((c) => c.id),
                    );
                  }
                }}
                className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all active:scale-[0.97] cursor-pointer"
              >
                {selectedQuickAddIds.length === filteredModalContacts.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto px-5 py-2 divide-y divide-slate-100 scrollbar-hide">
              {filteredModalContacts.map((contact) => {
                const isSelected = selectedQuickAddIds.includes(contact.id);
                return (
                  <div
                    key={contact.id}
                    onClick={() => {
                      setSelectedQuickAddIds((prev) =>
                        prev.includes(contact.id)
                          ? prev.filter((id) => id !== contact.id)
                          : [...prev, contact.id],
                      );
                    }}
                    className={`flex items-center justify-between py-4 cursor-pointer hover:bg-slate-50 -mx-5 px-5 transition-colors ${isSelected ? "bg-slate-50/50" : ""}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-[44px] h-[44px] rounded-full flex items-center justify-center font-bold text-[13px] border ${isSelected ? "bg-slate-900 text-white border-slate-900" : "bg-slate-100 text-slate-700 border-slate-200"}`}
                      >
                        {contact.initials}
                      </div>
                      <div className="text-left">
                        <p className="font-extrabold text-slate-900 text-[15px] leading-tight">
                          {contact.name}
                        </p>
                        <p className="font-mono text-slate-400 text-[11px] mt-1 pr-1 truncate max-w-[220px]">
                          {contact.number.substring(0, 14)}...
                          {contact.number.substring(contact.number.length - 4)}
                          <span className="font-sans italic ml-1 text-slate-300">
                            ({contact.network || "Arc Network"})
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Checkbox indicator */}
                    <div
                      className={`flex items-center gap-3 ${isSelected ? "opacity-100" : "opacity-30"} hover:opacity-100 cursor-pointer`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Trigger deletion logic
                        const confirmDelete = window.confirm(`Hapus kontak ${contact.name}?`);
                        if (confirmDelete) {
                          // Manually update deleted ids
                          const cached = localStorage.getItem("deleted_contact_ids");
                          const currentDeleted = cached ? JSON.parse(cached) : [];
                          const newDeleted = [...currentDeleted, contact.id];
                          localStorage.setItem("deleted_contact_ids", JSON.stringify(newDeleted));
                          window.dispatchEvent(new Event("storage"));
                          displayToast(`Kontak ${contact.name} berhasil dihapus.`);
                        }
                      }}
                    >
                      <Trash2 size={18} className="text-red-400" />
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-[2px] flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-slate-900 border-slate-900 scale-110"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          className="w-3 h-3 text-white"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredModalContacts.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                    <Users size={32} />
                  </div>
                  <p className="text-slate-400 text-[14px] font-medium">
                    No contacts matching "{modalSearchQuery}"
                  </p>
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            <div className="p-5 border-t border-slate-100 shrink-0 bg-white shadow-[0_-8px_20px_rgba(0,0,0,0.04)] z-10">
              <button
                onClick={() => {
                  if (selectedQuickAddIds.length === 0) return;

                  const selectedContacts = contacts.filter((c) =>
                    selectedQuickAddIds.includes(c.id)
                  );

                  if (newAmount) {
                    // Instantly add to the recipient list with the preset amount
                    const newItems = selectedContacts.map((contact) => {
                      const fullAddr = contact.number;
                      const formattedAddress = `${fullAddr.substring(0, 6)}...${fullAddr.substring(fullAddr.length - 4)}`;

                      return {
                        id: `${fullAddr}-${Date.now()}-${Math.random()}`,
                        address: fullAddr,
                        displayAddress: formattedAddress,
                        name: contact.name,
                        amount: newAmount,
                      };
                    });

                    setRecipients((prev) => [...prev, ...newItems]);
                    setShowQuickAddModal(false);
                    displayToast(
                      `Berhasil menambahkan langsung ${selectedQuickAddIds.length} kontak ke daftar transfer batch!`
                    );
                  } else {
                    // Fallback to populating the text area
                    const selectedAddresses = selectedContacts
                      .map((c) => c.number)
                      .join(", ");

                    setNewAddress((prev) =>
                      prev ? `${prev}, ${selectedAddresses}` : selectedAddresses,
                    );
                    setShowQuickAddModal(false);
                    displayToast(
                      `Berhasil menyalin ${selectedQuickAddIds.length} alamat. Masukkan jumlah USDC untuk menambahkannya.`
                    );
                  }
                }}
                disabled={selectedQuickAddIds.length === 0}
                className="w-full bg-slate-900 border-0 hover:bg-slate-800 disabled:opacity-45 text-white py-4 rounded-full font-bold text-[15px] shadow-lg hover:shadow-xl transition-all active:scale-[0.98] cursor-pointer"
              >
                Add Selected to Input ({selectedQuickAddIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
