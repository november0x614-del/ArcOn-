import React, { useState } from 'react';
import { X, Image as ImageIcon, Zap, QrCode } from 'lucide-react';
import { Contact } from '../../types';

interface ScanQRScreenProps {
  onBack: () => void;
  onScanResult: (scannedContact: Contact) => void;
}

export function ScanQRScreen({ onBack, onScanResult }: ScanQRScreenProps) {
  const [scanning, setScanning] = useState(true);

  return (
    <div className="w-full h-full bg-slate-950 relative flex flex-col z-50 animate-in slide-in-from-bottom duration-300">
       <div className="absolute top-0 left-0 w-full p-6 pt-8 flex justify-between items-center z-10">
          <button onClick={onBack} className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white active:bg-white/20 transition-colors">
             <X size={20} />
          </button>
          <span className="text-white font-bold text-[14px] flex items-center gap-2">
            <QrCode size={16} /> Scan to Pay
          </span>
          <button className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white active:bg-white/20 transition-colors">
             <ImageIcon size={20} />
          </button>
       </div>

       <div className="flex-1 flex flex-col items-center justify-center relative">
          {/* Camera View Finder */}
          <div 
             className="w-[260px] h-[260px] relative overflow-hidden flex items-center justify-center cursor-pointer group"
             onClick={() => {
                if (!scanning) return;
                setScanning(false);
                setTimeout(() => {
                   onScanResult({
                      id: "scanned_123",
                      name: "Merchant - Arc.market",
                      number: "0x2B...5A9c (Arc Testnet)",
                      avatar: "M"
                   });
                }, 800);
             }}
          >
             {/* Reticle brackets */}
             <div className="absolute top-0 left-0 w-12 h-12 border-t-8 border-l-8 border-slate-900 rounded-tl-3xl opacity-80 group-hover:opacity-100 transition-opacity"></div>
             <div className="absolute top-0 right-0 w-12 h-12 border-t-8 border-r-8 border-slate-900 rounded-tr-3xl opacity-80 group-hover:opacity-100 transition-opacity"></div>
             <div className="absolute bottom-0 left-0 w-12 h-12 border-b-8 border-l-8 border-slate-900 rounded-bl-3xl opacity-80 group-hover:opacity-100 transition-opacity"></div>
             <div className="absolute bottom-0 right-0 w-12 h-12 border-b-8 border-r-8 border-slate-900 rounded-br-3xl opacity-80 group-hover:opacity-100 transition-opacity"></div>

             {/* Dark overlay outside reticle effect logic using box-shadow inner isn't as good, we leave center clear */}
             <div className="absolute inset-2 border-2 border-white/10 rounded-2xl"></div>

             {/* Scanning line animation */}
             {scanning && (
               <div className="w-[90%] h-[2px] bg-slate-900 shadow-[0_0_15px_4px_#0f172a] absolute top-1/2 left-[5%] -translate-y-1/2 animate-[scan_2.5s_ease-in-out_infinite]"></div>
             )}

             {!scanning && (
               <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center animate-in zoom-in spin-in-12 duration-300">
                  <Zap size={32} className="text-white fill-current" />
               </div>
             )}
          </div>
          
          <p className="text-white/60 text-[13px] mt-10 text-center px-10 leading-relaxed font-sans">
             Arahkan kamera ke QR Code USDC di Arc Testnet. <br className="mb-2" />
             <span className="text-white/40 text-[11.5px] italic">Tap area frame untuk uji simulasi QR otomatis.</span>
             <br />
             <br />
          </p>
       </div>

       <div className="p-5 pb-8 bg-slate-900 rounded-t-[32px] border-t border-slate-800">
          <div className="bg-slate-800/80 rounded-2xl p-4 flex gap-4 items-center mb-1">
             <div className="w-10 h-10 bg-slate-900/20 rounded-full flex items-center justify-center text-slate-800 shrink-0">
                <Zap size={20} />
             </div>
             <div className="flex-1">
                <h4 className="text-white font-bold text-[14px]">Circle Web3 Ready</h4>
                <p className="text-gray-400 text-[11px] leading-tight mt-1 max-w-[200px]">Penyelesaian secara asinkron dengan USDC stablecoin (No Gas Coin).</p>
             </div>
          </div>
       </div>

       <style>{`
          @keyframes scan {
             0%, 100% { top: 15%; opacity: 0; }
             20% { opacity: 1; }
             50% { top: 85%; opacity: 1; }
             80% { opacity: 0; }
          }
       `}</style>
    </div>
  )
}
