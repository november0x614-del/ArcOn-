import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Image as ImageIcon,
  QrCode,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Contact } from "../../types";

interface ScanQRScreenProps {
  onBack: () => void;
  onScanResult: (scannedContact: Contact) => void;
}

export function ScanQRScreen({ onBack, onScanResult }: ScanQRScreenProps) {
  const [scanning, setScanning] = useState(true);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Initialize Scanner
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {
            // Success callback for every frame read (ignoring Errors)
          },
        );
      } catch (err: any) {
        console.error("Camera access failed", err);
        setErrorVisible(true);
        setErrorMessage(
          err?.message ||
            "Failed to access camera. Please grant permission in browser settings.",
        );
      }
    };

    startScanner();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch((e) => console.warn("Stop failed", e));
      }
    };
  }, []);

  const handleScanSuccess = (text: string) => {
    if (!scanning) return;

    // Simple validation for EVM/Arc Address (0x followed by 40 hex chars)
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    let walletAddress = text.trim();
    let queryAmount: string | null = null;

    if (walletAddress.includes("?")) {
      try {
        const queryStr = walletAddress.split("?")[1];
        const params = new URLSearchParams(queryStr);
        queryAmount = params.get("amount");
      } catch (err) {
        console.error("Failed to parse QR query string", err);
      }
    }

    // Handle possible URI scheme like arc:0x... or ethereum:0x...
    if (walletAddress.includes(":")) {
      walletAddress = walletAddress.split(":")[1].split("?")[0];
    } else if (walletAddress.includes("?")) {
      walletAddress = walletAddress.split("?")[0];
    }

    if (ethAddressRegex.test(walletAddress)) {
      setScanning(false);

      // Stop scanner before moving on
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .then(() => {
            const shortAddr = `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`;
            onScanResult({
              id: `scanned_${Date.now()}`,
              name: `User_${shortAddr}`,
              number: shortAddr,
              avatar: "S",
              account: walletAddress, // Used by AmountInputScreen
              network: "Arc Testnet",
              initials: "QR",
              suggestedAmount: queryAmount,
            } as any);
          })
          .catch((e) => {
            console.error("Failed to stop scanner", e);
            // Force navigation anyway
            const shortAddr = `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`;
            onScanResult({
              id: `scanned_${Date.now()}`,
              name: `User_${shortAddr}`,
              number: shortAddr,
              avatar: "S",
              account: walletAddress,
              network: "Arc Testnet",
              initials: "QR",
              suggestedAmount: queryAmount,
            } as any);
          });
      }
    } else {
      console.warn("Invalid address scanned:", text);
      // Optional: Show temporary UI warning toast
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 relative flex flex-col z-50 animate-in slide-in-from-bottom duration-300">
      <div className="absolute top-0 left-0 w-full p-6 pt-8 flex justify-between items-center z-20">
        <button
          onClick={onBack}
          className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white active:bg-white/20 transition-colors border-0"
        >
          <X size={20} />
        </button>
        <span className="text-white font-bold text-[14.5px] flex items-center gap-2 px-4 py-2 bg-slate-900/40 backdrop-blur-xl rounded-full">
          <QrCode size={16} className="text-blue-400" /> Pay via QR
        </span>
        <button className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white active:bg-white/20 transition-colors border-0">
          <ImageIcon size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-black">
        {/* Real Camera Container */}
        <div id="qr-reader" className="w-full h-full object-cover"></div>

        {/* Custom Overlay (UI Layer above camera) */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
          {/* View Finder Cutout Frame with massive box shadow to mask rest of screen */}
          <div className="w-[260px] h-[260px] relative pointer-events-auto rounded-[32px] shadow-[0_0_0_9999px_rgba(2,6,23,0.75)] border border-white/10 overflow-hidden">
            <div className="absolute top-0 left-0 w-12 h-12 border-t-[5px] border-l-[5px] border-blue-500 rounded-tl-[24px]"></div>
            <div className="absolute top-0 right-0 w-12 h-12 border-t-[5px] border-r-[5px] border-blue-500 rounded-tr-[24px]"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[5px] border-l-[5px] border-blue-500 rounded-bl-[24px]"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[5px] border-r-[5px] border-blue-500 rounded-br-[24px]"></div>

            {/* Horizontal scanning line */}
            {scanning && (
              <div className="w-full h-[2.5px] bg-blue-500/90 shadow-[0_0_15px_4px_rgba(59,130,246,0.6)] absolute top-0 left-0 animate-[scan_2.5s_ease-in-out_infinite]"></div>
            )}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 z-10">
            <p className="text-white font-medium text-[15px] tracking-wide bg-black/40 px-6 py-2 rounded-full backdrop-blur-md border border-white/10">
              Align QR Code in frame
            </p>
            <p className="text-white/40 text-[11px] max-w-[200px] text-center italic">
              Supports Arc Network wallet addresses & Circle Payment Requests.
            </p>
          </div>
        </div>

        {/* Error State */}
        {errorVisible && (
          <div className="absolute inset-0 z-30 bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            <h3 className="text-white font-bold text-[18px] mb-3">
              Camera Access Needed
            </h3>
            <p className="text-slate-400 text-[14px] leading-relaxed mb-8">
              {errorMessage}
            </p>
            <button
              onClick={onBack}
              className="w-full max-w-[200px] py-4 rounded-full bg-white text-slate-900 font-bold text-[15px] active:scale-95 transition-transform"
            >
              Go Back
            </button>
          </div>
        )}
      </div>

      {/* Bottom Sheet Context */}
      <div className="p-6 pb-10 bg-slate-900 rounded-t-[32px] border-t border-slate-800 z-10">
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20">
            <ShieldCheck size={24} />
          </div>
          <div className="flex-1">
            <h4 className="text-white font-bold text-[14px] uppercase tracking-widest flex items-center gap-2">
              Secure Scan{" "}
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            </h4>
            <p className="text-gray-400 text-[11px] leading-tight mt-1">
              All data processed locally on Arc Sandbox Device Vault. No keys
              leave your device.
            </p>
          </div>
        </div>
      </div>

      <style>{`
          @keyframes scan {
             0% { top: 0%; opacity: 0; }
             10% { opacity: 1; }
             90% { opacity: 1; }
             100% { top: 100%; opacity: 0; }
          }
          #qr-reader {
             width: 100% !important;
             height: 100% !important;
             border: none !important;
          }
          #qr-reader video {
             width: 100% !important;
             height: 100% !important;
             object-fit: cover !important;
          }
       `}</style>
    </div>
  );
}
