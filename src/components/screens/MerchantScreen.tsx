import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Box,
  PlusCircle,
  BarChart3,
  Settings,
  MoreVertical,
  Search,
  Wallet,
  TrendingUp,
  Tags,
  Download,
  Eye,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  Trash2,
  Package,
  ShoppingCart,
  Home,
  User
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useStore } from "../../store/useStore";
import { motion, AnimatePresence } from "motion/react";

interface MerchantScreenProps {
  onBack: () => void;
}

import { SafeProductImage } from "../common/SafeProductImage";

export function MerchantScreen({ onBack }: MerchantScreenProps) {
  const { registeredUser } = useApp();
  const address = registeredUser?.walletAddress || "0xNoWallet";
  const [activeTab, setActiveTab] = useState<
    "products" | "dashboard" | "settings"
  >("products");

  const { products, setProducts } = useStore();

  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // States for adding a new product
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductStock, setNewProductStock] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("Grocery");
  const [newProductImage, setNewProductImage] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");
  const [mintedNfts, setMintedNfts] = useState<any[]>([]);

  useEffect(() => {
    if (showAddModal) {
      try {
        const stored = localStorage.getItem("minted_nfts");
        if (stored) {
          setMintedNfts(JSON.parse(stored));
        } else {
          setMintedNfts([]);
        }
      } catch (e) {
        console.error("Failed to load minted_nfts", e);
      }
    }
  }, [showAddModal]);

  const handleSelectNft = (nft: any) => {
    setNewProductName(nft.name);
    setNewProductImage(nft.image);
    setNewProductDesc(nft.description || "Arc Network Native NFT");
    setNewProductStock("1");
    useStore.getState().displayToast(`Attached NFT "${nft.name}"!`);
  };

  const handleAddProduct = () => {
    if (!newProductName || !newProductPrice || !newProductStock) {
      useStore.getState().displayToast("Please fill all fields!");
      return;
    }
    const priceNum = parseFloat(newProductPrice);
    const stockNum = parseInt(newProductStock, 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      useStore.getState().displayToast("Invalid price!");
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      useStore.getState().displayToast("Invalid stock!");
      return;
    }
    const newProduct = {
      id: Date.now(),
      name: newProductName,
      price: priceNum,
      stock: stockNum,
      image: newProductImage || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop",
      category: newProductCategory,
      sales: 0,
      desc: newProductDesc || "Fresh merchant addition sold securely on Arc Testnet.",
      dateLabel: newProductCategory === "NFT" ? "Unique L1 NFT" : `Valid until ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).getDate()}/${new Date().getMonth() + 1}`
    };
    setProducts([...products, newProduct]);
    useStore.getState().displayToast(`Successfully listed ${newProductName}!`);
    setShowAddModal(false);
    setNewProductName("");
    setNewProductPrice("");
    setNewProductStock("");
    setNewProductImage("");
    setNewProductDesc("");
  };

  useEffect(() => {
    const fetchSales = async () => {
      setLoadingSales(true);
      try {
        const response = await fetch(`/api/ecommerce/merchant/sales/${address}`);
        if (response.ok) {
           const data = await response.json();
           setRecentSales(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSales(false);
      }
    };
    if (address && address !== "0xNoWallet") {
       fetchSales();
    }
  }, [address]);

  const [processingRelease, setProcessingRelease] = useState<string | null>(null);

  const handleFinalize = async (sale: any) => {
    try {
      setProcessingRelease(sale.id);
      
      const response = await fetch("/api/ecommerce/release-escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: sale.id,
          sellerAddress: address,
          totalAmount: sale.amount,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setRecentSales((prev) => prev.map((s) => s.id === sale.id ? { ...s, status: data.details?.status || "RELEASED" } : s));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setProcessingRelease(null);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const BottomNav = () => (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 rounded-[32px] px-3 py-2 flex items-center justify-between shadow-2xl z-50 transition-all duration-300 w-[92%] max-w-sm border border-white/5 font-sans">
      {/* Inventory Tab */}
      <button 
        onClick={() => setActiveTab("products")}
        className={`p-2 px-3.5 rounded-[22px] flex items-center gap-1.5 transition-all text-xs font-black uppercase tracking-wider border-0 cursor-pointer ${
          activeTab === "products" 
            ? "bg-white text-slate-900 shadow-md scale-105" 
            : "text-slate-400 hover:text-white bg-transparent"
        }`}
      >
        <Package size={18} strokeWidth={activeTab === "products" ? 3 : 2} />
        {activeTab === "products" && <span>Stock</span>}
      </button>

      {/* Insights/Dashboard Tab */}
      <button 
        onClick={() => setActiveTab("dashboard")}
        className={`p-2 px-3.5 rounded-[22px] flex items-center gap-1.5 transition-all text-xs font-black uppercase tracking-wider border-0 cursor-pointer ${
          activeTab === "dashboard" 
            ? "bg-white text-slate-900 shadow-md scale-105" 
            : "text-slate-400 hover:text-white bg-transparent"
        }`}
      >
        <BarChart3 size={18} strokeWidth={activeTab === "dashboard" ? 3 : 2} />
        {activeTab === "dashboard" && <span>Sales</span>}
      </button>

      {/* Settings Tab */}
      <button 
        onClick={() => setActiveTab("settings")}
        className={`p-2 px-3.5 rounded-[22px] flex items-center gap-1.5 transition-all text-xs font-black uppercase tracking-wider border-0 cursor-pointer ${
          activeTab === "settings" 
            ? "bg-white text-slate-900 shadow-md scale-105" 
            : "text-slate-400 hover:text-white bg-transparent"
        }`}
      >
        <Settings size={18} strokeWidth={activeTab === "settings" ? 3 : 2} />
        {activeTab === "settings" && <span>Profile</span>}
      </button>

      {/* Circle Close Back to Wallet */}
      <button 
        onClick={() => onBack()}
        className="w-10 h-10 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all border border-red-500/30 cursor-pointer shrink-0"
        title="Exit Admin"
      >
        <ArrowLeft size={18} strokeWidth={3} />
      </button>
    </div>
  );

  return (
    <div className="w-full h-full bg-slate-50 relative flex flex-col z-40 overflow-hidden font-sans">
      
      {/* LDS Minimal White Header for Merchant */}
      <div className="bg-white pt-7 pb-7 px-6 rounded-b-[32px] shadow-sm border-b border-slate-100 shrink-0 relative z-40">
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={onBack} 
            className="w-10 h-10 bg-slate-50 hover:bg-slate-100 flex items-center justify-center rounded-full active:scale-95 transition-all text-slate-800 border-0 cursor-pointer"
          >
            <ChevronDown size={20} className="rotate-90" strokeWidth={3} />
          </button>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-0.5">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
               <span className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Merchant Console</span>
            </div>
            <h1 className="text-[17px] font-black text-slate-900 tracking-tight leading-none">
               {registeredUser?.username || "Global"} Market
            </h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
             <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(registeredUser?.username || "M")}&background=f1f5f9&color=0f172a`} className="w-full h-full" alt="Merchant" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full pb-40 scrollbar-hide flex flex-col p-6">
        <AnimatePresence mode="wait">
          {activeTab === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center mb-6 gap-3">
                <div className="bg-white rounded-2xl p-1 pl-4 flex items-center shadow-sm border border-slate-100 flex-1">
                  <Search size={18} className="text-slate-300 shrink-0" strokeWidth={2.5} />
                  <input
                    type="text"
                    placeholder="Filter inventory..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-0 py-2.5 flex-1 ml-3 outline-none text-[14px] font-bold text-slate-800 placeholder-slate-300"
                  />
                </div>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all border-0 cursor-pointer"
                  title="Add New Listing"
                >
                  <PlusCircle size={20} strokeWidth={3} />
                </button>
              </div>

              <div className="space-y-4">
                {filteredProducts.map((p, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={p.id}
                    className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0 bg-slate-50 border border-slate-100 p-1">
                      <SafeProductImage
                        src={p.image}
                        name={p.name}
                        category={p.category}
                      />
                    </div>

                    <div className="ml-4 flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-black text-slate-900 text-[14px] leading-tight mb-1">
                          {p.name}
                        </h3>
                        <button className="text-slate-300 hover:text-slate-600 transition-colors p-1 bg-transparent border-0 cursor-pointer">
                          <MoreVertical size={16} strokeWidth={3} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                         <span className="font-black text-[15px] text-slate-900">
                            {p.price} <span className="text-[10px] text-slate-400">USDC</span>
                         </span>
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 flex items-center gap-1">
                               <Package size={10} /> {p.stock}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-tighter text-blue-500 flex items-center gap-1">
                               <TrendingUp size={10} /> {p.sales} Sold
                            </span>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "dashboard" && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Main Stats Card */}
              <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <BarChart3 size={120} strokeWidth={1} />
                </div>
                <div className="relative z-10">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Market Performance</p>
                  <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-4xl font-black tracking-tighter">1,240.50</span>
                    <span className="text-sm font-black text-white/40 uppercase tracking-widest">USDC</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-md">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Pending Arc</p>
                      <p className="text-lg font-black text-blue-400">240.20 <span className="text-[10px]">USDC</span></p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-md">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Total Sales</p>
                      <p className="text-lg font-black text-emerald-400">32 <span className="text-[10px]">Units</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sales List */}
              <div>
                 <div className="flex justify-between items-end mb-6 px-1">
                    <div>
                      <h3 className="font-black text-[18px] text-slate-900 tracking-tight">Recent Sales</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Testnet activity</p>
                    </div>
                    <Download size={18} className="text-slate-300" />
                 </div>

                 <div className="space-y-4">
                    {recentSales.length === 0 ? (
                      <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center border border-dashed border-slate-200 text-slate-400">
                         <BarChart3 size={40} className="mb-4 opacity-20" />
                         <span className="font-black text-[12px] uppercase tracking-widest">No Sales Found</span>
                      </div>
                    ) : (
                      recentSales.map((sale) => (
                        <div key={sale.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col gap-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-[12px] text-slate-400 border border-slate-100 uppercase">
                                 {(sale.buyer_id || "U").slice(0, 2)}
                               </div>
                               <div>
                                 <p className="font-black text-[14px] text-slate-900 leading-tight mb-1">{sale.product_name}</p>
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                   {new Date(sale.created_at).toLocaleDateString()}
                                 </span>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="font-black text-[16px] text-slate-900">{sale.amount} <span className="text-[10px] text-slate-400">USDC</span></p>
                               <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                                 sale.status === "ESCROWED" ? "bg-blue-50 text-blue-600" : sale.status === "PENDING_ESCROW" ? "bg-amber-50 text-amber-500" : "bg-emerald-50 text-emerald-600"
                               }`}>
                                 {sale.status === "PENDING_ESCROW" ? "PENDING" : sale.status}
                               </span>
                            </div>
                          </div>
                          {sale.status === "ESCROWED" && (
                             <button 
                               onClick={() => handleFinalize(sale)}
                               disabled={processingRelease === sale.id}
                               className="w-full py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-lg active:scale-[0.98] transition-all border-0 cursor-pointer disabled:opacity-50"
                             >
                               {processingRelease === sale.id ? "Settling..." : "Settle Arc Funds"}
                             </button>
                          )}
                        </div>
                      ))
                    )}
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
               <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                    <h3 className="font-black text-slate-900 text-[15px] mb-1">Store Profile</h3>
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Identity Settings</p>
                  </div>
                  
                  <div className="p-6 space-y-6">
                     <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Display Name</label>
                        <input 
                          type="text" 
                          defaultValue={registeredUser?.username || "Market Admin"}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all shadow-inner"
                        />
                     </div>
                     
                     <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Escrow Payout Wallet</label>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 flex items-center justify-between shadow-inner">
                           <span className="text-[12px] font-mono font-bold text-slate-500 truncate mr-4">{address}</span>
                           <ExternalLink size={16} className="text-slate-300" />
                        </div>
                     </div>

                     <div className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                        <div>
                          <h4 className="font-black text-[14px] text-slate-900 mb-0.5">Auto-Settle Sales</h4>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Direct release to wallet</p>
                        </div>
                        <div className="w-12 h-7 bg-slate-200 rounded-full relative shadow-inner p-1">
                           <div className="w-5 h-5 bg-white rounded-full shadow-md"></div>
                        </div>
                     </div>

                     <button className="w-full bg-slate-900 text-white font-black text-[14px] py-4 rounded-2xl mt-4 active:scale-[0.98] shadow-xl shadow-slate-200 transition-all border-0 cursor-pointer">
                        Update Profile
                     </button>
                  </div>
               </div>

               <div className="flex flex-col gap-4 px-6 mt-8">
                  <button className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-0 bg-transparent cursor-pointer hover:text-red-500 transition-colors">
                     Deactivate Merchant Portal
                  </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
      <BottomNav />

      {/* Add Product Modal Overlay */}
      {showAddModal && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-end justify-center z-50 font-sans animate-in fade-in duration-300">
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="bg-white rounded-t-[40px] w-full max-w-md p-6 pb-12 shadow-2xl relative border-t border-slate-100"
          >
            {/* Handle Bar */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 shrink-0"></div>

            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">List New Product</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Post to Arc Storefront</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center border-0 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Category</label>
                <div className="relative">
                  <select
                    value={newProductCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewProductCategory(val);
                      if (val === "NFT") {
                        setNewProductStock("1");
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-[14.5px] font-bold text-slate-700 focus:outline-none appearance-none"
                  >
                    <option value="NFT">Digital Asset (NFT)</option>
                    <option value="Grocery">Grocery / Food</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Apparel">Style & Apparel</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Dynamic NFT Selection Block */}
              {newProductCategory === "NFT" && (
                <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest block px-1">Your Minted L1 NFTs</span>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100/50">Arc Network</span>
                  </div>

                  {mintedNfts.length === 0 ? (
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100/70 text-center space-y-2">
                      <p className="text-[12.5px] font-black text-amber-800 leading-snug">Kamu belum mencetak NFT apa pun</p>
                      <p className="text-[10.5px] text-amber-600 font-bold uppercase tracking-wider">Silakan buka menu "Mint NFT" utama terlebih dahulu!</p>
                    </div>
                  ) : (
                    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                      {mintedNfts.map((nft) => {
                        const isSelected = newProductName === nft.name && newProductImage === nft.image;
                        return (
                          <button
                            key={nft.id || nft.txHash}
                            type="button"
                            onClick={() => handleSelectNft(nft)}
                            className={`flex items-center gap-3 bg-white hover:bg-slate-50/80 rounded-2xl p-2.5 border shrink-0 transition-all cursor-pointer ${
                              isSelected 
                                ? "border-slate-850 ring-[1.5px] ring-slate-800 shadow-sm"
                                : "border-slate-100 hover:border-slate-200"
                            }`}
                          >
                            <img src={nft.image} className="w-10 h-10 rounded-xl object-cover shrink-0 bg-slate-100" alt={nft.name} />
                            <div className="flex flex-col text-left max-w-[120px] truncate">
                              <span className="text-[12px] font-black text-slate-800 truncate">{nft.name}</span>
                              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-tight truncate">
                                {nft.txHash ? `${nft.txHash.slice(0, 6)}...${nft.txHash.slice(-4)}` : "L-1 Mint"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {newProductImage && (
                    <div className="pt-2 flex items-center gap-3.5 bg-white p-2.5 rounded-2xl border border-slate-100">
                      <img src={newProductImage} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm" alt="Preview NFT" />
                      <div className="flex flex-col text-left truncate">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Preview NFT Lampiran</span>
                        <span className="text-[13px] font-black text-slate-800 truncate">{newProductName}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Product Name</label>
                <input 
                  type="text" 
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="e.g. Fine Dark Roast atau Nama NFT"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-[14.5px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Price (USDC)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    placeholder="8.50"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-[14.5px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">Initial Stock</label>
                  <input 
                    type="number" 
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(e.target.value)}
                    disabled={newProductCategory === "NFT"}
                    placeholder="50"
                    className={`w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-[14.5px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all ${
                      newProductCategory === "NFT" ? "opacity-60 cursor-not-allowed text-slate-450 font-black" : ""
                    }`}
                  />
                </div>
              </div>

              <button 
                onClick={handleAddProduct}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[13px] uppercase tracking-widest py-4 rounded-2xl mt-4 active:scale-[0.98] shadow-lg transition-all border-0 cursor-pointer"
              >
                Publish Listing
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

