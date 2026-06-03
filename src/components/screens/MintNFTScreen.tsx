import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../../utils/cropImage";
import { 
  ArrowLeft, 
  Hexagon, 
  Zap, 
  ShieldCheck, 
  ExternalLink,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  Check,
  X
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { useArc } from "../../contexts/ArcContext";

export function MintNFTScreen({ onBack }: { onBack: () => void }) {
  const { displayToast, addLog } = useStore();
  const { executeArcTransaction } = useArc();
  const [step, setStep] = useState<"input" | "minting" | "success" | "crop">("input");
  const [nftName, setNftName] = useState("");
  const [nftDescription, setNftDescription] = useState("");
  const [txHash, setTxHash] = useState("");
  const [selectedImage, setSelectedImage] = useState<string>("https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=300&auto=format&fit=crop");
  const [imageLabel, setImageLabel] = useState<string>("Default Generative Image");
  
  // Cropper states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [tempImage, setTempImage] = useState<string>("");

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    try {
      if (!tempImage || !croppedAreaPixels) return;
      const croppedImage = await getCroppedImg(tempImage, croppedAreaPixels);
      setSelectedImage(croppedImage);
      setStep("input");
      displayToast("Asset Image adjusted successfully!");
    } catch (e) {
      console.error(e);
      displayToast("Failed to crop image.");
    }
  };

  const handleMint = async () => {
    if (!nftName) {
      displayToast("Please enter a name for your NFT");
      return;
    }

    setStep("minting");
    addLog(`Initiating NFT Mint: ${nftName}`);

    try {
      // Execute real mint transaction on Arc Testnet
      const result = await executeArcTransaction({
        type: "MINT_NFT",
        metadata: {
          name: nftName,
          description: nftDescription || "Arc Network Native NFT",
          image: selectedImage
        }
      });

      if (result.success) {
        setTxHash(result.txHash || "pending");
        
        // Finalize state by fetching fresh assets from server (Server-First)
        await useStore.getState().fetchMintedNfts();

        if (result.txHash === "pending") {
          addLog(`NFT Minting in Progress: ${nftName}`);
          displayToast("Proses minting sedang berjalan di background!");
        } else {
          addLog(`NFT Minted Successfully: ${nftName}`);
          displayToast("Berhasil mencetak NFT baru!");
        }
        setStep("success");
      } else {
        displayToast("Minting failed. Please try again.");
        setStep("input");
      }
    } catch (err) {
      displayToast("An error occurred during minting.");
      setStep("input");
    }
  };

  return (
    <div className="w-full h-full bg-[#ecf5fc] relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex justify-center bg-slate-900 shadow-md relative z-10 w-full shrink-0">
        <div className="flex items-center px-4 pt-6 pb-4 w-full max-w-[500px]">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h2 className="font-bold text-[16px] text-white ml-2 uppercase tracking-wider">Mint NFT</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col pb-24">
        <div className="w-full max-w-[500px] mx-auto flex flex-col relative h-full">
        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col">
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
                              setTempImage(reader.result as string);
                              setImageLabel(file.name);
                              setStep("crop");
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

                  {/* Live NFT Image Preview */}
                  {selectedImage && (
                    <div className="flex flex-col gap-2 text-left w-full mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Image Preview (1:1 Standard)</label>
                      <div className="w-full aspect-square rounded-2xl bg-slate-50 overflow-hidden border-2 border-slate-100/80 shadow-sm relative group flex items-center justify-center">
                        <img 
                          src={selectedImage} 
                          alt="NFT Preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 right-3 bg-slate-900/85 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border border-white/10 shadow-md">
                          Live Active
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Description (Optional)</label>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-inner flex items-center">
                      <textarea 
                        value={nftDescription}
                        onChange={(e) => setNftDescription(e.target.value)}
                        placeholder="Tell a story about your NFT..."
                        className="bg-transparent border-none outline-none w-full font-bold text-[14px] text-slate-800 placeholder:text-slate-300 resize-none h-16"
                      />
                    </div>
                  </div>
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

          {step === "crop" && (
            <motion.div
              key="crop"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed inset-0 bg-slate-900 z-[100] flex flex-col touch-none"
            >
              <div className="flex justify-between items-center px-6 pt-12 pb-4 safe-top">
                 <h3 className="text-white font-black text-[18px] uppercase tracking-widest">Adjust Image</h3>
                 <span className="text-slate-400 text-[11px] font-bold bg-slate-800 px-3 py-1 rounded-full">1:1 Standard</span>
              </div>
              <div className="flex-1 relative w-full touch-none bg-black/50">
                <Cropper
                  image={tempImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  showGrid={true}
                  objectFit="contain"
                />
              </div>
              <div className="p-6 bg-slate-900 flex gap-4 pb-12 safe-bottom">
                <button
                  onClick={() => setStep("input")}
                  className="flex-1 py-4 bg-slate-800 text-white font-black text-[14px] rounded-[16px] shadow-sm active:scale-95 transition-all flex justify-center items-center gap-2 border-0 cursor-pointer"
                >
                  <X size={18} strokeWidth={3} /> Cancel
                </button>
                <button
                  onClick={handleCropSave}
                  className="flex-1 py-4 bg-emerald-500 text-white font-black text-[14px] rounded-[16px] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex justify-center items-center gap-2 border-0 cursor-pointer"
                >
                  <Check size={18} strokeWidth={3} /> Apply
                </button>
              </div>
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

                  <div className="w-full aspect-square rounded-2xl bg-slate-50 mb-8 overflow-hidden border border-slate-100 relative group">
                    <img 
                      src={selectedImage} 
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
                      {txHash !== "pending" ? (
                        <a 
                          href={`https://testnet.arcscan.app/tx/${txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[12px] font-bold text-blue-600 flex items-center gap-1 hover:underline"
                        >
                          {txHash.slice(0, 6)}...{txHash.slice(-4)}
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-[12px] font-medium text-slate-500 italic">Processing...</span>
                      )}
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
    </div>
  );
}
