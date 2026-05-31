import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  Hexagon, 
  Zap, 
  ShieldCheck, 
  ExternalLink,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { useArc } from "../../contexts/ArcContext";

export function MintNFTScreen({ onBack }: { onBack: () => void }) {
  const { displayToast, addLog } = useStore();
  const { executeArcTransaction } = useArc();
  const [step, setStep] = useState<"input" | "minting" | "success">("input");
  const [nftName, setNftName] = useState("");
  const [txHash, setTxHash] = useState("");
  const [selectedImage, setSelectedImage] = useState<string>("https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=300&auto=format&fit=crop");
  const [imageLabel, setImageLabel] = useState<string>("Default Generative Image");

  // State for dragging, zooming and crop preview
  const [finalCroppedImage, setFinalCroppedImage] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const getCroppedImage = (): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Industry standard square dimensions
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(selectedImage);
          return;
        }

        const containerWidth = 260;
        const containerHeight = 260;
        
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        
        const imageRatio = imgWidth / imgHeight;
        const containerRatio = containerWidth / containerHeight;
        let drawWidth = containerWidth;
        let drawHeight = containerHeight;
        let startX = 0;
        let startY = 0;
        
        if (imageRatio > containerRatio) {
          drawWidth = containerHeight * imageRatio;
          startX = (containerWidth - drawWidth) / 2;
        } else {
          drawHeight = containerWidth / imageRatio;
          startY = (containerHeight - drawHeight) / 2;
        }
        
        const scaleFactor = 400 / containerWidth;
        
        ctx.translate(200, 200);
        ctx.translate(offset.x * scaleFactor, offset.y * scaleFactor);
        ctx.scale(zoom, zoom);
        ctx.translate(-200, -200);
        
        ctx.drawImage(
          img, 
          0, 0, imgWidth, imgHeight, 
          startX * scaleFactor, startY * scaleFactor, drawWidth * scaleFactor, drawHeight * scaleFactor
        );
        
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => {
        resolve(selectedImage);
      };
      img.src = selectedImage;
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Smooth scroll zooming
    const zoomFactor = -e.deltaY * 0.002;
    setZoom((prevZoom) => {
      const nextZoom = Math.min(Math.max(prevZoom + zoomFactor, 1), 3);
      return nextZoom;
    });
  };

  const handleResetPosition = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    displayToast("Cropper position reset");
  };

  const handleMint = async () => {
    if (!nftName) {
      displayToast("Please enter a name for your NFT");
      return;
    }

    setStep("minting");
    addLog(`Initiating NFT Mint: ${nftName}`);

    try {
      // Process canvas crop in base64 on the fly
      const croppedBase64 = await getCroppedImage();
      setFinalCroppedImage(croppedBase64);

      // Simulate real mint transaction logic on Arc Testnet using the cropped image
      const result = await executeArcTransaction({
        type: "MINT_NFT",
        metadata: {
          name: nftName,
          description: "Arc Network Native NFT",
          image: croppedBase64
        }
      });

      if (result.success && result.txId) {
        // Since it's async, poll for transaction status
        let isFinalized = false;
        let finalTxHash = result.txHash;
        let attempts = 0;
        const maxAttempts = 15; // 30 seconds
        let isSuccess = false;
        
        while (!isFinalized && attempts < maxAttempts) {
          await new Promise(res => setTimeout(res, 2000));
          attempts++;
          
          try {
            const savedUserId = localStorage.getItem("arc_user_id");
            const response = await fetch(`/api/transactions/${savedUserId}`);
            if (response.ok) {
              const txs = await response.json();
              const mintedTx = txs.find((t: any) => t.internal_ref === result.txId);
              
              if (mintedTx && mintedTx.status === "success") {
                isFinalized = true;
                isSuccess = true;
                const potentialHash = mintedTx.tx_hash || mintedTx.metadata?.txHash;
                finalTxHash = (potentialHash && potentialHash.startsWith("0x")) ? potentialHash : mintedTx.tx_hash;
                break;
              } else if (mintedTx && mintedTx.status === "failed") {
                isFinalized = true;
                isSuccess = false;
                throw new Error(mintedTx.metadata?.errorReason || "Transaction failed or reverted on chain.");
              }
            }
          } catch (e) {
            console.error("Polling error", e);
          }
        }

        if (isSuccess && finalTxHash) {
          setTxHash(finalTxHash);
          
          try {
            let oldNfts = [];
            try {
              oldNfts = JSON.parse(localStorage.getItem("minted_nfts") || "[]");
            } catch(e) {}
            
            const newNft = {
              id: finalTxHash,
              name: nftName,
              description: "Arc Network Native NFT",
              image: croppedBase64,
              timestamp: new Date().toLocaleString(),
              txHash: finalTxHash
            };
            
            let nftsToSave = [newNft, ...oldNfts];
            
            let saved = false;
            while (nftsToSave.length > 0 && !saved) {
               try {
                 localStorage.setItem("minted_nfts", JSON.stringify(nftsToSave));
                 saved = true;
               } catch(err) {
                  if (nftsToSave.length > 1) {
                     nftsToSave.pop();
                  } else if (nftsToSave.length === 1 && nftsToSave[0].image) {
                     nftsToSave[0].image = "";
                  } else {
                     break;
                  }
               }
            }
          } catch (e) {
            console.error("Failed to save minted NFT to localStorage", e);
          }

          addLog(`NFT Minted Successfully: ${nftName}`);
          setStep("success");
        } else {
          displayToast("Minting is pending or failed (Timeout). Check webhook and contract permissions.");
          setStep("input");
        }
      } else {
        displayToast("Minting failed. Please try again.");
        setStep("input");
      }
    } catch (err: any) {
      displayToast(err.message || "An error occurred during minting.");
      setStep("input");
    }
  };

  return (
    <div className="w-full h-full bg-[#ecf5fc] relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center px-4 pt-6 pb-4 bg-slate-900 shadow-md relative z-10 w-full shrink-0">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="font-bold text-[16px] text-white ml-2 uppercase tracking-wider">Mint NFT</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col pb-24">
        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 flex flex-col items-center">
                <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 border border-purple-100">
                   <Hexagon size={40} strokeWidth={2} />
                </div>
                <h3 className="font-black text-[20px] text-slate-800 tracking-tight text-center mb-2">Create New Asset</h3>
                <p className="text-[13px] text-slate-500 text-center leading-relaxed mb-6">
                  Mint a unique digital asset on the Arc Network. All NFTs are gas-optimized and settlement is instant.
                </p>

                <div className="w-full space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Name</label>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-inner flex items-center">
                      <Zap size={18} className="text-slate-300 shrink-0" />
                      <input 
                        type="text"
                        value={nftName}
                        onChange={(e) => setNftName(e.target.value)}
                        placeholder="e.g. My First Arc NFT"
                        className="bg-transparent border-none outline-none flex-1 ml-3 font-bold text-[15px] text-slate-800 placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <div 
                    onClick={() => document.getElementById("nft-image-uploader")?.click()}
                    className="bg-slate-50 hover:bg-slate-100/50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] group"
                  >
                    <input 
                      type="file"
                      id="nft-image-uploader"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (reader.result) {
                              setSelectedImage(reader.result as string);
                              setImageLabel(file.name);
                              displayToast("Custom Asset Image selected!");
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors shadow-sm">
                        <ImageIcon size={18} />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[13px] font-bold text-slate-700">{imageLabel}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {imageLabel === "Default Generative Image" 
                            ? "Click to open device gallery" 
                            : "Click to change image"}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-blue-500 uppercase">
                      {imageLabel === "Default Generative Image" ? "Selected" : "Custom"}
                    </span>
                  </div>

                  {/* Interactive NFT Crop & Position Editor */}
                  {selectedImage && (
                    <div className="flex flex-col gap-3 text-left w-full mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                          Adjust Crop Preview
                        </label>
                        <span className="text-[10px] font-bold text-slate-400">
                          Drag to align • Scroll/Slider to zoom
                        </span>
                      </div>
                      
                      <div 
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onWheel={handleWheel}
                        className="w-full aspect-square max-w-[260px] mx-auto rounded-[24px] bg-slate-100 overflow-hidden border-2 border-slate-200 shadow-md relative group flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none"
                      >
                        {/* Interactive Image Frame */}
                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                          <img 
                            src={selectedImage} 
                            alt="NFT Crop Workspace"
                            referrerPolicy="no-referrer"
                            style={{
                              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                              transition: isDragging ? "none" : "transform 0.15s ease-out"
                            }}
                            className="w-full h-full object-cover select-none pointer-events-none origin-center"
                          />
                        </div>

                        {/* Creative Border/Crop Grid Overlay */}
                        <div className="absolute inset-2 border border-dashed border-white/60 rounded-[18px] pointer-events-none flex items-center justify-center">
                          <div className="absolute top-0 bottom-0 left-1/3 right-1/3 border-l border-r border-white/20"></div>
                          <div className="absolute left-0 right-0 top-1/3 bottom-1/3 border-t border-b border-white/20"></div>
                        </div>

                        <div className="absolute top-3 right-3 bg-slate-900/85 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border border-white/10 shadow-md">
                          Adjusting Live
                        </div>
                      </div>

                      {/* Interactive Slider & Controls Panel */}
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/80 flex flex-col gap-2.5 mt-1 max-w-[280px] mx-auto w-full">
                        <div className="flex items-center gap-2.5">
                          <ZoomOut size={15} className="text-slate-400" />
                          <input 
                            type="range"
                            min="1"
                            max="3"
                            step="0.05"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="flex-1 accent-slate-900 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <ZoomIn size={15} className="text-slate-400" />
                          <span className="text-[11px] font-black text-slate-600 w-10 text-right">
                            {zoom.toFixed(2)}x
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                          <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                            Industry standard 1:1 auto-cropped
                          </span>
                          <button
                            type="button"
                            onClick={handleResetPosition}
                            className="py-1 px-2.5 hover:bg-slate-200/60 text-slate-500 rounded-lg transition-colors flex items-center gap-1.5 active:scale-95 border-0 bg-transparent shrink-0 text-[10px] font-black uppercase cursor-pointer"
                          >
                            <RotateCcw size={10} strokeWidth={2.5} />
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-900/5 rounded-2xl p-4 border border-blue-100 flex items-start gap-3">
                <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[12px] text-blue-700 font-medium leading-relaxed">
                  Minting requires a small amount of gas (USDC). Ensure your wallet has sufficient balance on Arc Testnet.
                </p>
              </div>

              <button
                onClick={handleMint}
                className="w-full py-4 bg-slate-900 text-white font-black text-[15px] rounded-[20px] shadow-xl shadow-slate-200 active:scale-[0.98] transition-all border-0 cursor-pointer mt-4"
              >
                Mint on Arc Network
              </button>
            </motion.div>
          )}

          {step === "minting" && (
            <motion.div
              key="minting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-6 text-center"
            >
               <div className="relative">
                 <div className="w-24 h-24 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                   <Loader2 size={32} className="text-purple-600 animate-pulse" />
                 </div>
               </div>
               <h3 className="font-black text-[22px] text-slate-800 tracking-tight mt-8 mb-2">Minting Asset...</h3>
               <p className="text-[14px] text-slate-500 max-w-[240px]">
                 Broadcasting to Arc Network nodes. This usually takes 2-3 seconds.
               </p>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col gap-6"
            >
               <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-50 flex flex-col items-center text-center overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6">
                    <CheckCircle2 size={48} />
                  </div>
                  <h3 className="font-black text-[24px] text-slate-800 tracking-tight mb-2">Mint Successful!</h3>
                  <p className="text-[14px] text-slate-500 mb-8 lowercase uppercase tracking-wide">
                    {nftName} is now live on Arc
                  </p>

                  <div className="w-full aspect-square max-w-[240px] mx-auto rounded-[24px] bg-slate-50 mb-6 overflow-hidden border border-slate-200 relative group shadow-md">
                    <img 
                      src={finalCroppedImage || selectedImage} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      alt="NFT"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full border border-white shadow-sm flex items-center gap-2">
                       <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                       <span className="text-[10px] font-black uppercase text-slate-800">Verified on Arc</span>
                    </div>
                  </div>

                  <div className="w-full space-y-3">
                    <div className="flex justify-between items-center px-2">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Explorer Link</span>
                      <a 
                        href={`https://testnet.arcscan.app/tx/${txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12px] font-bold text-blue-600 flex items-center gap-1 hover:underline"
                      >
                        {txHash.slice(0, 6)}...{txHash.slice(-4)}
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
               </div>

               <button
                onClick={() => {
                  setNftName("");
                  setStep("input");
                }}
                className="w-full py-4 bg-slate-900 text-white font-black text-[15px] rounded-[20px] shadow-xl shadow-slate-200 active:scale-[0.98] transition-all border-0 cursor-pointer"
              >
                Return to Mint
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
