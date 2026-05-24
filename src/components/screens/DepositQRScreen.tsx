import React, { useState } from "react";
import { ArrowLeft, Copy, Check, Info, Scan } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useApp } from "../../context/AppContext";

interface DepositQRScreenProps {
  onBack: () => void;
}

export function DepositQRScreen({ onBack }: DepositQRScreenProps) {
  const { 
    registeredUser, 
    displayToast,  
    fetchBalance,
    fetchTransactions,
    setViewState,
    setSelectedContact,
    setTransferAmount // Add this
  } = useApp();
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [isScanningSim, setIsScanningSim] = useState(false);
  const [scanSimComplete, setScanSimComplete] = useState(false);
  
  const handleSimulateCamera = () => {
    setIsScanningSim(true);
    setScanSimComplete(false);
    
    // Simulate scan detection in 2 seconds
    setTimeout(() => {
      setScanSimComplete(true);
      
      // Navigate to amountInputScreen with mock contact data
      const mockContact = {
        id: 'mock-1',
        letter: 'A',
        name: 'ANNISA PATRIA',
        network: 'EVM (Arc Testnet)',
        account: '0x1A2bc2f35497B6CEAc40eEb29037C9F306633c4A',
        initials: 'AP'
      };
      
      setTransferAmount(amount || '20'); // Set amount in context!
      setSelectedContact(mockContact);
      setViewState("amountInput");
      
      setIsScanningSim(false);
      setScanSimComplete(false);
    }, 2000);
  };

  const address = registeredUser?.walletAddress || "No Wallet Created Yet";

  React.useEffect(() => {
    if (isSimulating && simStep < 4) {
      const timer = setTimeout(() => {
        setSimStep((prev) => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSimulating, simStep]);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateWebhook = async () => {
    setIsSimulating(true);
    setSimStep(0);
    
    try {
      const receiveAmount = parseFloat(amount) || 100;
      
      const response = await fetch('/api/webhook/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: registeredUser?.supabaseUid,
          amount: receiveAmount
        }),
      });
      
      if (!response.ok) throw new Error('Simulation failed');
      
      // Update data from backend
      await fetchBalance();
      await fetchTransactions();
      
      displayToast(`Successfully received ${receiveAmount} USDC`);
    } catch (error) {
      console.error(error);
      displayToast("Simulation failed");
      setIsSimulating(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#f8fafc] relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-white border-b border-slate-100 shadow-sm relative z-10 w-full">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-slate-800" />
          </button>
          <h2 className="font-bold text-[16px] text-slate-800 ml-2">
            Receive Payment
          </h2>
        </div>
        <button
          onClick={handleSimulateWebhook}
          className="bg-purple-100 text-purple-700 font-bold px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wide hover:bg-purple-200 transition-colors"
          title="Simulate incoming hook from Arc Testnet"
        >
          Simulate Webhook
        </button>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center overflow-y-auto pb-24">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200/60 flex flex-col items-center w-full">
          <span className="text-[11px] font-black tracking-widest text-[#005faa] bg-blue-50 px-2.5 py-1 rounded-full mb-6 uppercase">
            USDC (ARC TESTNET)
          </span>

          {/* QR Code */}
          <div className="w-56 h-56 bg-white border-2 border-slate-100 rounded-3xl p-4 flex items-center justify-center relative shadow-sm mb-4 group">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md z-10 flex items-center gap-1.5 uppercase tracking-wider whitespace-nowrap">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
              Scan Me
            </div>

            <QRCodeSVG
              value={
                amount ? `arc:${address}?amount=${amount}` : `arc:${address}`
              }
              size={180}
              bgColor={"#ffffff"}
              fgColor={"#0f172a"}
              level={"Q"}
              imageSettings={{
                src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/96px-Bitcoin.svg.png",
                x: undefined,
                y: undefined,
                height: 32,
                width: 32,
                excavate: true,
              }}
            />

            {/* Scan Simulator Overlay */}
            {isScanningSim && (
              <div className="absolute inset-0 bg-slate-900/80 z-20 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-300 rounded-[28px]">
                {/* Camera Reticle Brackets */}
                <div
                  className={`absolute top-4 left-4 w-8 h-8 border-t-[3px] border-l-[3px] rounded-tl-xl transition-colors duration-300 ${scanSimComplete ? "border-green-400 shadow-[inset_4px_4px_10px_-4px_rgba(74,222,128,0.5)]" : "border-blue-400"}`}
                ></div>
                <div
                  className={`absolute top-4 right-4 w-8 h-8 border-t-[3px] border-r-[3px] rounded-tr-xl transition-colors duration-300 ${scanSimComplete ? "border-green-400 shadow-[inset_-4px_4px_10px_-4px_rgba(74,222,128,0.5)]" : "border-blue-400"}`}
                ></div>
                <div
                  className={`absolute bottom-4 left-4 w-8 h-8 border-b-[3px] border-l-[3px] rounded-bl-xl transition-colors duration-300 ${scanSimComplete ? "border-green-400 shadow-[inset_4px_-4px_10px_-4px_rgba(74,222,128,0.5)]" : "border-blue-400"}`}
                ></div>
                <div
                  className={`absolute bottom-4 right-4 w-8 h-8 border-b-[3px] border-r-[3px] rounded-br-xl transition-colors duration-300 ${scanSimComplete ? "border-green-400 shadow-[inset_-4px_-4px_10px_-4px_rgba(74,222,128,0.5)]" : "border-blue-400"}`}
                ></div>

                {/* Scanning Laser Line */}
                {!scanSimComplete && (
                  <div className="w-[85%] h-[2px] bg-blue-400 shadow-[0_0_12px_3px_#60A5FA] absolute left-[7.5%] top-[10%] animate-[scan_1.5s_ease-in-out_infinite]"></div>
                )}

                {/* Success Detection Box */}
                {scanSimComplete && (
                  <div className="w-[140px] h-[140px] border-2 border-green-400/50 bg-green-500/10 rounded-2xl flex items-center justify-center animate-in zoom-in spin-in-12 duration-500 shadow-[0_0_20px_0_rgba(74,222,128,0.2)]">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg text-white">
                      <Check size={24} strokeWidth={3} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleSimulateCamera}
            className="mb-6 bg-white hover:bg-blue-50 text-blue-600 font-bold px-4 py-2.5 rounded-xl text-[12px] flex items-center gap-2 transition-all active:scale-95 border border-blue-100 shadow-sm hover:shadow"
          >
            <Scan size={14} /> Simulate Camera View
          </button>

          {/* Set Amount Input */}
          <div className="w-full mb-6">
            {!isEditingAmount && !amount && (
              <button
                onClick={() => setIsEditingAmount(true)}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-[#005faa] border border-slate-200 border-dashed rounded-xl font-bold text-[13px] transition-colors"
              >
                + Set Payment Amount
              </button>
            )}

            {(isEditingAmount || amount) && (
              <div className="flex flex-col gap-2 relative">
                <label className="text-[11px] font-bold text-slate-500 font-sans text-left">
                  Requested Amount (Optional)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-500 font-bold text-[14px]">
                    USDC
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onBlur={() => setIsEditingAmount(false)}
                    autoFocus={isEditingAmount}
                    placeholder="0.00"
                    className="w-full pl-14 pr-4 py-3 bg-white border border-slate-200 hover:border-[#3FA2F6] focus:border-[#3FA2F6] text-[16px] font-bold text-slate-800 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          <p className="text-[12px] text-slate-400 text-center mb-6 leading-relaxed">
            Show this QR code or share your wallet address below to receive or
            request USDC payment via Arc Testnet.
          </p>

          {/* Address bar */}
          <div
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 group active:bg-slate-100 transition-all cursor-pointer overflow-hidden font-sans"
            onClick={handleCopy}
          >
            <div className="flex-1 overflow-hidden">
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5 text-left">
                WALLET ADDRESS
              </span>
              <span className="text-[12px] font-mono font-bold text-slate-800 block truncate text-left">
                {address}
              </span>
            </div>
            <button className="bg-white text-[#005faa] hover:bg-slate-50 border border-slate-100 p-2 rounded-xl shrink-0 shadow-sm transition-colors active:scale-95">
              {copied ? (
                <Check size={16} className="text-green-500" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 flex gap-2 items-start text-left max-w-sm">
          <Info size={16} className="text-[#3FA2F6] shrink-0 mt-0.5" />
          <span className="text-[12px] text-slate-500 font-medium leading-snug">
            Only send USDC tokens to this address. Transactions via networks
            other than Arc will result in permanent asset loss.
          </span>
        </div>
      </div>

      {/* Webhook Simulation Overlay */}
      {isSimulating && (
        <div className="absolute inset-0 bg-slate-900/60 z-[100] flex flex-col justify-end">
          <div className="bg-slate-900 h-2/3 rounded-t-[32px] w-full p-6 flex flex-col items-center">
            <h3 className="text-white font-bold text-[18px] mb-2 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3 border border-purple-500/30">
                <span className="animate-pulse">⚡</span>
              </div>
              Webhook Monitor
            </h3>
            <p className="text-[12px] text-slate-400 text-center mb-6 max-w-[280px]">
              Listening for POST request on <code>/api/circle/webhook</code>{" "}
              from Arc Testnet...
            </p>

            <div className="w-full bg-black/40 rounded-xl p-4 flex-1 overflow-y-auto flex flex-col gap-3 font-mono text-[11px] text-left">
              {simStep >= 1 && (
                <div className="text-green-400 animate-in fade-in slide-in-from-bottom flex items-start gap-2">
                  <span className="text-green-500 shrink-0">➜</span>
                  <span>
                    [ON-CHAIN] Transaction detected on Arc Testnet Ledger.
                    Status: Pending.
                  </span>
                </div>
              )}
              {simStep >= 2 && (
                <div className="text-purple-400 animate-in fade-in slide-in-from-bottom flex items-start gap-2">
                  <span className="text-purple-500 shrink-0">➜</span>
                  <span>
                    [CIRCLE] Sending payload to webhook webhook_sig_verified.
                  </span>
                </div>
              )}
              {simStep >= 3 && (
                <div className="text-blue-400 animate-in fade-in slide-in-from-bottom flex items-start gap-2">
                  <span className="text-blue-500 shrink-0">➜</span>
                  <span>
                    [SERVER] POST /api/circle/webhook - Signature Valid.
                    Settling locally.
                  </span>
                </div>
              )}
              {simStep >= 4 && (
                <div className="text-emerald-400 animate-in fade-in slide-in-from-bottom flex items-start gap-2">
                  <span className="text-emerald-500 shrink-0">➜</span>
                  <span>
                    [DATABASE] Balance updated. +{amount ? amount : "100"} USDC
                    Received! 🎉
                  </span>
                </div>
              )}
            </div>

            {simStep >= 4 && (
              <button
                onClick={() => {
                  setIsSimulating(false);
                  setSimStep(0);
                  onBack();
                }}
                className="mt-6 bg-white text-slate-900 font-bold py-3 px-8 rounded-full w-full"
              >
                Close & View Balance
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
         @keyframes scan {
            0%, 100% { top: 10%; opacity: 0; }
            20% { opacity: 1; }
            50% { top: 90%; opacity: 1; }
            80% { opacity: 0; }
         }
      `}</style>
    </div>
  );
}
export default DepositQRScreen;
