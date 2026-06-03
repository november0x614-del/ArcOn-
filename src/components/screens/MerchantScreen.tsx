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
  ChevronUp,
  CheckCircle2,
  X,
  Package,
  ShoppingCart,
  Home,
  User,
  Store,
  ArrowUpRight,
  Lock,
  Activity,
  Check,
  Plus,
  ShieldCheck,
  Copy,
  LayoutDashboard,
  ShieldAlert
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useStore } from "../../store/useStore";
import { motion, AnimatePresence } from "motion/react";
import { SafeProductImage } from "../common/SafeProductImage";

interface MerchantScreenProps {
  onBack: () => void;
}

export function MerchantScreen({ onBack }: MerchantScreenProps) {
  const { registeredUser } = useApp();
  const address = registeredUser?.walletAddress || "0xNoWallet";
  const [activeTab, setActiveTab] = useState<
    "products" | "dashboard" | "settings"
  >("products");

  const { products, setProducts, mintedNfts } = useStore();

  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  // States for adding a new product
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductStock, setNewProductStock] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("Digital");
  const [newProductImage, setNewProductImage] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");
  const [newProductTxHash, setNewProductTxHash] = useState("");

  // Statistics calculated from real-time database transactions
  const totalSalesCount = recentSales.length;
  const totalRevenue = recentSales.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const escrowedRevenue = recentSales.filter(s => s.status === "ESCROWED").reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const settledRevenue = recentSales.filter(s => s.status === "RELEASED" || s.status === "SETTLED").reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  const handleSelectNft = (nft: any) => {
    setNewProductName(nft.name);
    setNewProductImage(nft.image);
    setNewProductDesc(nft.description || "Arc Network Native NFT");
    setNewProductStock("1");
    setNewProductTxHash(nft.txHash || "");
    useStore.getState().displayToast(`Attached NFT "${nft.name}"!`);
  };

  const handleCopyWallet = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      useStore.getState().displayToast("Store payout address copied!");
    }
  };

  const handleDeleteListing = (id: number | string, name: string) => {
    if (confirm(`Are you sure you want to remove the listing "${name}"?`)) {
      useStore.getState().removeProduct(id);
      useStore.getState().displayToast(`Successfully removed listing "${name}"`);
    }
  };

  const handleAddProduct = async () => {
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
      name: newProductName,
      price: priceNum,
      stock: stockNum,
      image: newProductImage || "", 
      category: newProductCategory,
      sales: 0,
      desc: newProductDesc || "Secured product listed on Arc Testnet via Lounge Marketplace.",
      date_label: newProductCategory === "NFT" ? "Lounge L1 Certificate" : "Standard Asset",
      seller_address: address,
      tx_hash: newProductTxHash
    };

    // Check for duplicate listing locally first
    if (products.some(p => (p.name === newProduct.name || (p.tx_hash && p.tx_hash === newProduct.tx_hash)) && p.category === newProduct.category && p.seller_address === address)) {
      useStore.getState().displayToast("Duplicate Listing: This item or NFT is already in your inventory.");
      return;
    }
    
    try {
      await useStore.getState().saveProduct(newProduct);
      useStore.getState().displayToast(`Successfully listed ${newProductName}!`);
      setShowAddModal(false);
      setNewProductName("");
      setNewProductPrice("");
      setNewProductStock("");
      setNewProductImage("");
      setNewProductDesc("");
      setNewProductTxHash("");
    } catch (err: any) {
      useStore.getState().displayToast(err.message || "Failed to save product");
    }
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
  const [processingMint, setProcessingMint] = useState<string | null>(null);

  const handleMintNFT = async (product: any) => {
    try {
      setProcessingMint(String(product.id));
      
      // Simple metadata URI for now (could be dynamic later)
      const metadataUri = `https://lounge.market/metadata/${product.id}.json`;
      
      await useStore.getState().mintProductNFT(product.id, address, metadataUri);
      
      useStore.getState().displayToast(`NFT Minting request successful for "${product.name}"!`);
    } catch (err: any) {
      console.error(err);
      useStore.getState().displayToast(err.message || "Minting failed");
    } finally {
      setProcessingMint(null);
    }
  };

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
        useStore.getState().displayToast(`Escrow funds settled successfully to store!`);
      } else {
        useStore.getState().displayToast(data.message || "Failed to settle funds");
      }
    } catch (err: any) {
      console.error(err);
      useStore.getState().displayToast("Failed to finalize settlement due to network error");
    } finally {
      setProcessingRelease(null);
    }
  };

  const filteredProducts = products.filter(p => 
    p.seller_address?.toLowerCase() === address.toLowerCase() &&
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (p.category !== "NFT" || p.stock > 0) // Hide sold out NFTs from active inventory
  );

  // LDS Responsive Bottom Navigation for Mobile Devices
  const MobileBottomNav = () => (
    <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 rounded-[30px] px-3 py-2 flex items-center justify-between shadow-xl z-50 transition-all duration-300 w-[92%] max-w-sm border border-white/5 font-sans">
      <button 
        onClick={() => setActiveTab("products")}
        className={`p-2 px-4 rounded-[22px] flex items-center gap-1.5 transition-all text-xs font-bold uppercase tracking-wider border-0 cursor-pointer ${
          activeTab === "products" 
            ? "bg-white text-slate-900 shadow-md scale-105" 
            : "text-slate-400 hover:text-white bg-transparent"
        }`}
      >
        <Package size={16} strokeWidth={activeTab === "products" ? 3 : 2} />
        {activeTab === "products" && <span>Stock</span>}
      </button>

      <button 
        onClick={() => setActiveTab("dashboard")}
        className={`p-2 px-4 rounded-[22px] flex items-center gap-1.5 transition-all text-xs font-bold uppercase tracking-wider border-0 cursor-pointer ${
          activeTab === "dashboard" 
            ? "bg-white text-slate-900 shadow-md scale-105" 
            : "text-slate-400 hover:text-white bg-transparent"
        }`}
      >
        <BarChart3 size={16} strokeWidth={activeTab === "dashboard" ? 3 : 2} />
        {activeTab === "dashboard" && <span>Sales</span>}
      </button>

      <button 
        onClick={() => setActiveTab("settings")}
        className={`p-2 px-4 rounded-[22px] flex items-center gap-1.5 transition-all text-xs font-bold uppercase tracking-wider border-0 cursor-pointer ${
          activeTab === "settings" 
            ? "bg-white text-slate-900 shadow-md scale-105" 
            : "text-slate-400 hover:text-white bg-transparent"
        }`}
      >
        <Settings size={16} strokeWidth={activeTab === "settings" ? 3 : 2} />
        {activeTab === "settings" && <span>Profile</span>}
      </button>

      <button 
        onClick={() => onBack()}
        className="w-10 h-10 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all border border-red-500/20 cursor-pointer shrink-0"
        title="Exit Admin"
      >
        <ArrowLeft size={16} strokeWidth={3} />
      </button>
    </div>
  );

  return (
    <div className="w-full h-full bg-slate-50 relative flex flex-col md:flex-row z-40 overflow-hidden font-sans">
      
      {/* =========================================================================
          DESKTOP SIDEBAR PANEL (Industrial Standard Sidebar for Desktop Screen Layout)
          ========================================================================= */}
      <div className="hidden md:flex w-64 bg-white border-r border-slate-100 flex-col justify-between p-6 shrink-0 h-full relative z-50">
        <div>
          {/* Store Console Branding */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-sm border border-slate-800">
              <Store size={20} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ARC NETWORK</span>
              <span className="font-bold text-[15.5px] text-slate-900 tracking-tight leading-none mt-1">Merchant Suite</span>
            </div>
          </div>

          {/* Active Store Display */}
          <div className="bg-slate-50/60 rounded-2xl p-4.5 border border-slate-100 mb-8 flex items-center gap-3.5 shadow-sm text-left">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-150 border border-slate-200 shrink-0">
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(registeredUser?.username || "M")}&background=0f172a&color=ffffff`} 
                className="w-full h-full" 
                alt="Merchant" 
              />
            </div>
            <div className="flex flex-col truncate">
              <span className="font-bold text-slate-900 text-[14px] truncate leading-tight">
                {registeredUser?.username || "Global"} Market
              </span>
              <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span>Active Portal</span>
              </span>
            </div>
          </div>

          {/* Responsive Vertical Route Tabs */}
          <div className="space-y-1.5 text-left">
            <button
              onClick={() => setActiveTab("products")}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all border-0 text-[13.5px] cursor-pointer active:scale-[0.98] ${
                activeTab === "products"
                  ? "bg-slate-900 text-white shadow-[0_4px_12px_rgba(15,23,42,0.15)] shadow-slate-900/20"
                  : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Package size={17} strokeWidth={activeTab === "products" ? 2.5 : 2} />
              <span>Stock & Listings</span>
            </button>

            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all border-0 text-[13.5px] cursor-pointer active:scale-[0.98] ${
                activeTab === "dashboard"
                  ? "bg-slate-900 text-white shadow-[0_4px_12px_rgba(15,23,42,0.15)] shadow-slate-900/20"
                  : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <BarChart3 size={17} strokeWidth={activeTab === "dashboard" ? 2.5 : 2} />
              <span>Dashboard Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all border-0 text-[13.5px] cursor-pointer active:scale-[0.98] ${
                activeTab === "settings"
                  ? "bg-slate-900 text-white shadow-[0_4px_12px_rgba(15,23,42,0.15)] shadow-slate-900/20"
                  : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Settings size={17} strokeWidth={activeTab === "settings" ? 2.5 : 2} />
              <span>Store Configuration</span>
            </button>
          </div>
        </div>

        {/* Exit Store back to User App Screen */}
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-500 hover:text-white transition-all border-0 cursor-pointer active:scale-[0.98] text-[13px] uppercase tracking-wider"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>Close Console</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MOBILE VIEW CORE HEADER
          ========================================================================= */}
      <div className="md:hidden bg-white pt-6 pb-6 px-5 rounded-b-[32px] shadow-sm border-b border-slate-100 shrink-0 relative z-40">
        <div className="flex items-center justify-between mb-0.5">
          <button 
            onClick={onBack} 
            className="w-10 h-10 bg-slate-50 hover:bg-slate-100 flex items-center justify-center rounded-full active:scale-95 transition-all text-slate-800 border-0 cursor-pointer"
          >
            <ChevronDown size={20} className="rotate-90" strokeWidth={3} />
          </button>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-1">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
               <span className="font-extrabold text-[9.5px] uppercase tracking-[0.2em] text-slate-400">Merchant Console</span>
            </div>
            <h1 className="text-[16px] font-black text-slate-900 tracking-tight leading-none">
               {registeredUser?.username || "Global"} Market
            </h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
             <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(registeredUser?.username || "M")}&background=f1f5f9&color=0f172a`} className="w-full h-full" alt="Merchant" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN SCROLLABLE CONTENT AREA
          ========================================================================= */}
      <div className="flex-1 overflow-y-auto w-full pb-44 md:pb-12 scrollbar-hide flex flex-col p-5 md:p-10">
        
        {/* DESKTOP-ONLY TOP PERFORMANCE BELT */}
        <div className="hidden md:flex justify-between items-center mb-8 bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm text-left">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {activeTab === "products" && "Product Inventory"}
              {activeTab === "dashboard" && "Dashboard Performance"}
              {activeTab === "settings" && "Store Profile Settings"}
            </h2>
            <p className="text-[11.5px] text-slate-400 uppercase tracking-widest font-black mt-1 flex items-center gap-1.5">
              <span>Admin Center</span>
              <span>•</span>
              <span className="text-blue-600">Arc Devnet Blockchain Environment</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
              Testnet Network Live
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* =========================================================================
              TAB: PRODUCTS & INVENTORY
              ========================================================================= */}
          {activeTab === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-left"
            >
              {/* Controls bar: search and publish CTA */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                <div className="bg-white rounded-2xl p-1 pl-4 flex items-center shadow-sm border border-slate-100 flex-1">
                  <Search size={18} className="text-slate-300 shrink-0" strokeWidth={2.5} />
                  <input
                    type="text"
                    placeholder="Search listed inventory..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-0 py-3 flex-1 ml-3 outline-none text-[14px] font-bold text-slate-800 placeholder-slate-300 w-full"
                  />
                </div>
                
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-slate-900 text-white rounded-2xl px-5 py-3.5 flex items-center justify-center gap-2 shadow-md hover:bg-slate-850 active:scale-[0.98] transition-all border-0 cursor-pointer font-bold duration-300"
                >
                  <PlusCircle size={18} strokeWidth={2.5} />
                  <span className="text-[13px] uppercase tracking-wider">List New Product</span>
                </button>
              </div>

              {/* Mobile Listing View (Responsive Card Pile) */}
              <div className="space-y-4 md:hidden">
                {filteredProducts.map((p, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={p.id}
                    className="bg-white p-3.5 rounded-2xl border border-slate-100 flex items-center shadow-sm hover:shadow-md transition-all group"
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
                        <h3 className="font-bold text-slate-950 text-[14px] leading-tight mb-1">
                          {p.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            p.category === "NFT" 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100/60" 
                              : "bg-slate-100 text-slate-500 border-slate-200/50"
                          }`}>
                            {p.category === "NFT" ? (
                              <>
                                <ShieldCheck size={10} strokeWidth={3} />
                                <span>Verified</span>
                              </>
                            ) : (
                              "Draft / Pending"
                            )}
                          </span>
                          {p.category !== "NFT" && (
                            <button 
                              onClick={() => handleMintNFT(p)}
                              disabled={processingMint === String(p.id)}
                              className="flex items-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-2.5 py-1 rounded-xl border border-blue-100/50 transition-all cursor-pointer active:scale-95 shadow-xs disabled:opacity-50"
                              title="Verify Product by minting NFT"
                            >
                              <ShieldCheck size={12} strokeWidth={3} />
                              <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                                {processingMint === String(p.id) ? "Verifying..." : "Verify"}
                              </span>
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteListing(p.id, p.name)}
                            className="flex items-center gap-1 bg-white text-slate-400 hover:text-red-600 px-2.5 py-1 rounded-xl border border-slate-100 hover:border-red-100 hover:bg-red-50/50 transition-all cursor-pointer active:scale-95 group/btn shadow-xs"
                            title="Unlist Listing"
                          >
                            <X size={12} strokeWidth={3} className="group-hover/btn:rotate-90 transition-transform" />
                            <span className="text-[9px] font-black uppercase tracking-widest leading-none">Unlist</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                         <span className="font-extrabold text-[15px] text-slate-900">
                            {p.price} <span className="text-[10px] text-slate-400">USDC</span>
                         </span>
                         <div className="flex items-center gap-3">
                            {p.stock <= 0 ? (
                               <span className="text-[10px] font-black uppercase tracking-tight text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                                  Sold Out
                               </span>
                            ) : (
                               <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400 flex items-center gap-1">
                                  <Package size={10} /> {p.stock}
                               </span>
                            )}
                            <span className="text-[10px] font-bold uppercase tracking-tight text-blue-500 flex items-center gap-1">
                               <TrendingUp size={10} /> {p.sales} Sold
                            </span>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* =========================================================================
                  DESKTOP PRODUCTS INDUSTRIAL DATAGRID (Sleek, Clean, Responsive Table)
                  ========================================================================= */}
              <div className="hidden md:block bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-100 text-[10.5px] font-black uppercase text-slate-400 tracking-wider">
                        <th className="py-4.5 px-6 font-black w-2/5">Listing Details</th>
                        <th className="py-4.5 px-5 font-black">Category</th>
                        <th className="py-4.5 px-5 font-black">Price Unit</th>
                        <th className="py-4.5 px-5 font-black">Stock Available</th>
                        <th className="py-4.5 px-5 font-black">Sales Perf</th>
                        <th className="py-4.5 px-6 font-black text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[13px] text-slate-700 font-medium">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-14 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400">
                              <Package size={42} className="mb-3 opacity-20" />
                              <span className="font-black text-[12.5px] uppercase tracking-widest text-slate-400">No Inventory Found</span>
                              <span className="text-slate-350 text-[11px] mt-1">Refine your search term or list a new product</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/40 transition-colors group">
                            {/* Details: Image, title, dateLabel */}
                            <td className="py-4 px-6 text-left">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 p-0.5 shrink-0 shadow-sm">
                                  <SafeProductImage
                                    src={p.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&auto=format&fit=crop"}
                                    name={p.name}
                                    category={p.category}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                </div>
                                <div className="flex flex-col truncate max-w-sm">
                                  <span className="font-bold text-slate-900 text-[14px] leading-tight truncate group-hover:text-blue-600 transition-colors">
                                    {p.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-1.5 truncate">
                                    {p.date_label || "Physical Product"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            {/* Category badge */}
                            <td className="py-4 px-5">
                              <div className="flex flex-col gap-1.5 items-start">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${
                                  p.category === "NFT" 
                                    ? "bg-purple-50 text-purple-600 border-purple-100" 
                                    : "bg-slate-100 text-slate-500 border-slate-200"
                                }`}>
                                  {p.category === "NFT" ? "Premium NFT" : "Standard List"}
                                </span>
                                {p.category === "NFT" ? (
                                  <span className="text-[9px] font-black text-emerald-600 flex items-center gap-1 ml-1">
                                    <ShieldCheck size={10} /> Verified Market
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black text-slate-400 flex items-center gap-1 ml-1 italic">
                                    <ShieldAlert size={10} /> Not in Public Market
                                  </span>
                                )}
                              </div>
                            </td>
                            {/* Price unit display */}
                            <td className="py-4 px-5 font-extrabold text-slate-900 text-[14.5px]">
                              {p.price} <span className="text-[10px] text-slate-400 font-bold">USDC</span>
                            </td>
                            {/* Stock state */}
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${p.stock <= 0 ? 'bg-red-500' : p.stock < 10 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                <span className={`font-bold text-[13px] ${p.stock <= 0 ? 'text-red-500' : p.stock < 10 ? 'text-amber-500' : 'text-slate-800'}`}>
                                  {p.stock <= 0 ? "Out of Stock" : `${p.stock} units`}
                                </span>
                              </div>
                            </td>
                            {/* Sales metric count */}
                            <td className="py-4 px-5 text-slate-500 font-bold">
                              <div className="flex items-center gap-1.5 text-blue-600 font-extrabold">
                                <TrendingUp size={13} />
                                <span>{p.sales} Sold</span>
                              </div>
                            </td>
                            {/* Column action triggers */}
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {p.category !== "NFT" && (
                                  <button 
                                    onClick={() => handleMintNFT(p)}
                                    disabled={processingMint === String(p.id)}
                                    className="flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-xl border border-blue-100/50 transition-all cursor-pointer active:scale-95 shadow-sm disabled:opacity-50"
                                    title="Verify & List Publicly"
                                  >
                                    <ShieldCheck size={13} strokeWidth={3} />
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                      {processingMint === String(p.id) ? "Verifying..." : "Verify Asset"}
                                    </span>
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleDeleteListing(p.id, p.name)}
                                  className="flex items-center gap-1.5 bg-white text-slate-400 hover:text-red-600 px-3 py-1.5 rounded-xl border border-slate-100 hover:border-red-100 hover:bg-red-50/50 transition-all cursor-pointer active:scale-95 group/btn shadow-sm"
                                  title="Unlist listing"
                                >
                                  <X size={13} strokeWidth={3} className="group-hover/btn:rotate-90 transition-transform" />
                                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">Unlist</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              TAB: ANALYTICS & ESCROW SETTLEMENTS
              ========================================================================= */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8 text-left animate-in fade-in duration-300"
            >
              {/* Responsive Metric KPI Grid layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Gross Revenues */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm text-left flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.99] group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Revenues</span>
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                      <BarChart3 size={15} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[24px] font-black text-slate-900 tracking-tight leading-none">
                      {totalRevenue.toFixed(2)}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-2">
                      USDC Total Volume
                    </span>
                  </div>
                </div>

                {/* Settle Earnings */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm text-left flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.99] group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Settle Balance</span>
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <CheckCircle2 size={15} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[24px] font-black text-slate-900 tracking-tight leading-none text-emerald-600">
                      {settledRevenue.toFixed(2)}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-2">
                      USDC Released
                    </span>
                  </div>
                </div>

                {/* Escrow Locks */}
                 <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm text-left flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.99] group bg-gradient-to-br from-white to-blue-50/30">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Total Escrow Protection</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
                      <Lock size={15} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[24px] font-black text-slate-900 tracking-tight leading-none text-blue-600">
                      {escrowedRevenue.toFixed(2)}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-2">
                      USDC Waiting for Settlement
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100/50 flex items-center gap-2">
                     <ShieldCheck size={12} className="text-emerald-500" />
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Safe Platform Custody</span>
                  </div>
                </div>

                {/* Orders / Sales count */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm text-left flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.99] group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sales Transactions</span>
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      <TrendingUp size={15} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[24px] font-black text-slate-900 tracking-tight leading-none">
                      {totalSalesCount} <span className="text-slate-400 text-xs font-semibold">orders</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-2">
                      Testnet operations
                    </span>
                  </div>
                </div>
              </div>

              {/* Transactions list Header block */}
              <div>
                 <div className="flex justify-between items-center mb-6 px-1">
                    <div>
                      <h3 className="font-black text-[18px] text-slate-900 tracking-tight">Recent Sales Escrows</h3>
                      <p className="text-[11.5px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Asynchronous purchase records securely logged on Arc Layer-1</p>
                    </div>
                    <Download size={18} className="text-slate-300 hover:text-slate-600 cursor-pointer hidden sm:block" />
                 </div>

                 {/* Desktop table-based recent escrows sales logs */}
                 <div className="hidden md:block bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                   <div className="w-full overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="bg-slate-50/75 border-b border-slate-100 text-[10.5px] font-black uppercase text-slate-400 tracking-wider">
                           <th className="py-4 px-6 font-black">Customer Key</th>
                           <th className="py-4 px-5 font-black">Purchased Item</th>
                           <th className="py-4 px-5 font-black">Transaction Date</th>
                           <th className="py-4 px-5 font-black text-right">Receipt Price</th>
                           <th className="py-4 px-5 font-black text-center">Settlement Status</th>
                           <th className="py-4 px-6 font-black text-right">Settlement Command</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50 text-[13px] text-slate-700 font-medium">
                         {recentSales.length === 0 ? (
                           <tr>
                             <td colSpan={6} className="py-14 text-center">
                               <div className="flex flex-col items-center justify-center text-slate-400">
                                 <BarChart3 size={42} className="mb-3 opacity-20" />
                                 <span className="font-black text-[12.5px] uppercase tracking-widest">No Sales Found</span>
                                 <span className="text-slate-350 text-[11px] mt-1">Settle commands appear dynamically as users complete checkouts</span>
                               </div>
                             </td>
                           </tr>
                         ) : (
                           recentSales.map((sale) => (
                             <tr key={sale.id} className="hover:bg-slate-50/40 transition-colors">
                               {/* Customer Address */}
                               <td className="py-4 px-6">
                                 <div className="flex items-center gap-2.5">
                                   <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 text-[11.5px] font-black text-slate-400 flex items-center justify-center uppercase shrink-0">
                                     {(sale.buyer_id || "U").slice(0, 2)}
                                   </div>
                                   <div className="flex flex-col">
                                     <span className="font-bold text-slate-800 font-mono text-[11px]">
                                       {sale.buyer_id ? `${sale.buyer_id.slice(0, 8)}...${sale.buyer_id.slice(-6)}` : "0xAnonymous"}
                                     </span>
                                     <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Custodial User</span>
                                   </div>
                                 </div>
                               </td>
                               {/* Purchased Item details */}
                               <td className="py-4 px-5 font-bold text-slate-900 text-[13.5px]">
                                 {sale.product_name}
                               </td>
                               {/* Created Timestamp date */}
                               <td className="py-4 px-5 text-slate-450 font-bold text-[12.5px]">
                                 {new Date(sale.created_at).toLocaleString()}
                               </td>
                               {/* Unit Receipts Price */}
                               <td className="py-4 px-5 font-black text-slate-900 text-[14px] text-right">
                                 {sale.amount} <span className="text-[10px] text-slate-400 font-bold">USDC</span>
                               </td>
                               {/* Settlement status badges */}
                               <td className="py-4 px-5 text-center">
                                 <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                   sale.status === "ESCROWED" 
                                     ? "bg-blue-50 text-blue-600 border-blue-100/60" 
                                     : sale.status === "PENDING_ESCROW" 
                                     ? "bg-amber-50 text-amber-500 border-amber-150" 
                                     : "bg-emerald-50 text-emerald-600 border-emerald-100/60"
                                 }`}>
                                   <span className={`w-1.5 h-1.5 rounded-full ${
                                     sale.status === "ESCROWED" ? "bg-blue-500 animate-pulse" : sale.status === "PENDING_ESCROW" ? "bg-amber-500" : "bg-emerald-500"
                                   }`}></span>
                                   {sale.status === "PENDING_ESCROW" ? "PENDING" : sale.status}
                                 </span>
                               </td>
                               {/* Action cell for releases */}
                               <td className="py-4 px-6 text-right">
                                 {sale.status === "ESCROWED" ? (
                                   <button 
                                     onClick={() => handleFinalize(sale)}
                                     disabled={processingRelease === sale.id}
                                     className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all border-0 cursor-pointer disabled:opacity-50"
                                   >
                                     {processingRelease === sale.id ? "Settling..." : "Settle Funds"}
                                   </button>
                                 ) : sale.status === "RELEASED" || sale.status === "SETTLED" ? (
                                   <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center justify-end gap-1 px-3">
                                     <ShieldCheck size={14} className="text-emerald-500" /> Settled
                                   </span>
                                 ) : (
                                   <span className="text-slate-400 italic text-xs px-3">Locked</span>
                                 )}
                               </td>
                             </tr>
                           ))
                         )}
                       </tbody>
                     </table>
                   </div>
                 </div>

                 {/* Mobile Sales Cards (fallback under responsive sizing) */}
                 <div className="space-y-4 md:hidden">
                    {recentSales.length === 0 ? (
                      <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center border border-dashed border-slate-200 text-slate-400">
                         <BarChart3 size={40} className="mb-4 opacity-20" />
                         <span className="font-extrabold text-[11.5px] uppercase tracking-widest">No Sales Found</span>
                      </div>
                    ) : (
                      recentSales.map((sale) => (
                        <div key={sale.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col gap-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-[12px] text-slate-500 border border-slate-150 uppercase font-mono">
                                 {(sale.buyer_id || "U").slice(0, 2)}
                               </div>
                               <div className="text-left">
                                 <p className="font-bold text-[13.5px] text-slate-900 leading-tight mb-1">{sale.product_name}</p>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                   {new Date(sale.created_at).toLocaleDateString()}
                                 </span>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="font-black text-[15.5px] text-slate-900">{sale.amount} <span className="text-[10px] text-slate-400 font-bold">USDC</span></p>
                               <span className={`text-[8.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                 sale.status === "ESCROWED" ? "bg-blue-50 text-blue-600 border border-blue-100/50" : sale.status === "PENDING_ESCROW" ? "bg-amber-50 text-amber-500" : "bg-emerald-50 text-emerald-600"
                               }`}>
                                 {sale.status === "PENDING_ESCROW" ? "PENDING" : sale.status}
                               </span>
                            </div>
                          </div>
                          {sale.status === "ESCROWED" && (
                             <button 
                               onClick={() => handleFinalize(sale)}
                               disabled={processingRelease === sale.id}
                               className="w-full py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-md active:scale-[0.98] transition-all border-0 cursor-pointer disabled:opacity-50"
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

          {/* =========================================================================
              TAB: STORE PROFILE SETTINGS
              ========================================================================= */}
          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-left"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Information form card (Left part) */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-[15.5px] mb-0.5">Store Profile Details</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Identify preferences on Arc network</p>
                    </div>
                    <Store className="text-slate-400" size={18} />
                  </div>
                  
                  <div className="p-6 space-y-6">
                     <div>
                        <label className="text-[10.5px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Display Name</label>
                        <input 
                          type="text" 
                          defaultValue={registeredUser?.username || "Market Admin"}
                          className="w-full bg-slate-50 border border-slate-150 focus:border-slate-300 focus:bg-white rounded-2xl px-5 py-4 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all shadow-inner"
                        />
                     </div>
                     
                     <div>
                        <label className="text-[10.5px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Escrow Payout Wallet</label>
                        <div className="bg-slate-50 border border-slate-150 rounded-2xl px-5 py-4 flex items-center justify-between shadow-inner relative group">
                           <span className="text-[12px] font-mono font-bold text-slate-500 truncate mr-4">{address}</span>
                           <button 
                             onClick={handleCopyWallet}
                             className="text-slate-400 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition-all border-0 bg-transparent cursor-pointer shrink-0"
                             title="Copy Wallet Address"
                           >
                             {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                           </button>
                        </div>
                     </div>

                     <div className="bg-blue-50/40 p-4.5 rounded-2xl border border-blue-100/50 text-[12px] text-blue-800 leading-relaxed font-bold flex items-start gap-3">
                        <ShieldAlert size={16} className="text-blue-500 shrink-0 mt-0.5" />
                        <span>
                          Settlement gas fees are fully covered by the Wallet Server Controller using the Circle Gas Station API. Your store receives full profit without testnet gas deductions.
                        </span>
                     </div>

                     <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[13.5px] uppercase tracking-wider py-4 rounded-2xl mt-4 active:scale-[0.98] shadow-md hover:shadow transition-all border-0 cursor-pointer duration-300">
                        Update Portal Profile
                     </button>
                  </div>
                </div>

                {/* Status and Parameters card (Right part) */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm space-y-6">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 text-[15.5px] mb-0.5">Automations Settings</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Policy and payout procedures</p>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="flex items-center justify-between p-4.5 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                       <div>
                         <h4 className="font-bold text-[14px] text-slate-900 mb-0.5">Auto-Release Escrow</h4>
                         <p className="text-[10.5px] text-slate-400 font-bold uppercase tracking-tight">Direct release after ship</p>
                       </div>
                       <div className="w-12 h-7 bg-slate-200 rounded-full relative p-1 cursor-not-allowed">
                          <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
                       </div>
                    </div>

                    <div className="flex items-center justify-between p-4.5 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                       <div>
                         <h4 className="font-bold text-[14px] text-slate-900 mb-0.5">Notification Webhooks</h4>
                         <p className="text-[10.5px] text-slate-400 font-bold uppercase tracking-tight">Post payload to Ngrok URL</p>
                       </div>
                       <div className="w-12 h-7 bg-slate-900 rounded-full relative p-1 flex justify-end">
                          <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
                       </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider block mb-2">Arc Testnet Status</span>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-slate-700">Relayer Latency</span>
                        <span className="text-[12px] font-mono font-black text-slate-800">21.24.42 ms</span>
                      </div>
                      <div className="w-full h-[1px] bg-slate-200/60 my-2.5"></div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-slate-700">Circle Webhook Service</span>
                        <span className="text-[10.5px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md uppercase">Connected</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Deactivate Portal command */}
              <div className="flex flex-col items-center justify-center p-6 mt-6">
                <button className="text-xs font-black text-slate-400 hover:text-red-600 uppercase tracking-[0.2em] border-0 bg-transparent cursor-pointer transition-colors">
                   Deactivate Merchant Portal permanently
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
      
      {/* Mobile devices bottom navigation */}
      <MobileBottomNav />

      {/* =========================================================================
          ADD PRODUCT OVERLAY MODAL
          ========================================================================= */}
      <AnimatePresence>
        {showAddModal && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 font-sans animate-in fade-in duration-300 p-0 md:p-6 text-left">
            <motion.div 
              initial={{ y: "100%", opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="bg-white rounded-t-[32px] md:rounded-[32px] w-full max-w-md p-6 md:p-8 pb-12 md:pb-8 shadow-2xl relative border-t md:border border-slate-150 flex flex-col max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              {/* Responsive Drag Indicator / Handle bar */}
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6 shrink-0 md:hidden"></div>

              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">List New Product</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Post product listing to store catalogs</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 font-bold flex items-center justify-center border-0 cursor-pointer active:scale-90 transition-all text-lg shrink-0"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 px-0.5">Category</label>
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
                      className="w-full bg-slate-50 border border-slate-150 hover:border-slate-200 rounded-2xl px-4 py-3.5 text-[14px] font-bold text-slate-800 focus:outline-none appearance-none cursor-pointer shadow-inner transition-colors"
                    >
                      <option value="Digital">Digital / NFT Asset</option>
                      <option value="Physical">Physical Goods</option>
                      <option value="Service">Services / Freelancing</option>
                      <option value="NFT">Secondary Marketplace NFT</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-450 pointer-events-none" />
                  </div>
                </div>

                {/* Dynamic NFT Selection block */}
                {newProductCategory === "NFT" && (
                  <div className="bg-slate-50/70 p-4 rounded-2.5xl border border-slate-150/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest block px-0.5">Your Minted L1 NFTs</span>
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100/40 px-2 rounded-full">Arc Network</span>
                    </div>

                    {mintedNfts.filter(nft => !products.some(p => p.tx_hash === nft.txHash)).length === 0 ? (
                      <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100 text-center space-y-2">
                        <p className="text-[12.5px] font-black text-amber-800 leading-snug">
                          {mintedNfts.length === 0 ? "You haven't minted any NFTs yet" : "All your NFTs are already listed in the store"}
                        </p>
                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                          {mintedNfts.length === 0 ? "Visit the 'Mint NFT' section to create one!" : "Check your current inventory list!"}
                        </p>
                      </div>
                    ) : (
                      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                        {mintedNfts
                          .filter(nft => !products.some(p => p.tx_hash === nft.txHash))
                          .map((nft) => {
                            const isSelected = newProductName === nft.name && newProductImage === nft.image;
                            return (
                              <button
                                key={nft.id || nft.txHash}
                                type="button"
                                onClick={() => handleSelectNft(nft)}
                                className={`flex items-center gap-3 bg-white hover:bg-slate-50/80 rounded-2xl p-2.5 border shrink-0 transition-all cursor-pointer ${
                                  isSelected 
                                    ? "border-slate-800 ring-[1px] ring-slate-800 shadow-sm"
                                    : "border-slate-150 hover:border-slate-200"
                                }`}
                              >
                                <img src={nft.image} className="w-10 h-10 rounded-xl object-cover shrink-0 bg-slate-100" alt={nft.name} />
                                <div className="flex flex-col text-left max-w-[120px] truncate">
                                  <span className="text-[12px] font-bold text-slate-800 truncate">{nft.name}</span>
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
                      <div className="pt-2 flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm animate-in fade-in duration-200">
                        <img src={newProductImage} className="w-11 h-11 rounded-lg object-cover border border-slate-200" alt="Preview NFT" />
                        <div className="flex flex-col text-left truncate">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Attached NFT Item</span>
                          <span className="text-[12.5px] font-bold text-slate-800 truncate">{newProductName}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-[10.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 px-0.5">Product Name</label>
                  <input 
                    type="text" 
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="e.g. Fine Dark Roast, Avocado L1 NFT, etc."
                    className="w-full bg-slate-50 border border-slate-150 focus:border-slate-300 focus:bg-white rounded-2xl px-4 py-3 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 px-0.5">Price (USDC)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      placeholder="8.50"
                      className="w-full bg-slate-50 border border-slate-150 focus:border-slate-300 focus:bg-white rounded-2xl px-4 py-3 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 px-0.5">Initial Stock</label>
                    <input 
                      type="number" 
                      value={newProductStock}
                      onChange={(e) => setNewProductStock(e.target.value)}
                      disabled={newProductCategory === "NFT"}
                      placeholder="50"
                      className={`w-full bg-slate-50 border border-slate-150 focus:border-slate-300 focus:bg-white rounded-2xl px-4 py-3 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all shadow-inner ${
                        newProductCategory === "NFT" ? "opacity-60 cursor-not-allowed text-slate-400 font-extrabold" : ""
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 px-0.5">Description (Optional)</label>
                  <textarea 
                    value={newProductDesc}
                    onChange={(e) => setNewProductDesc(e.target.value)}
                    placeholder="Short summary of ingredients, utility, or release parameters..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-150 focus:border-slate-300 focus:bg-white rounded-2xl px-4 py-3 text-[13.5px] font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all shadow-inner resize-none"
                  />
                </div>

                <button 
                  onClick={handleAddProduct}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[13px] uppercase tracking-widest py-4 rounded-2xl mt-4 active:scale-[0.98] shadow-lg transition-all border-0 cursor-pointer duration-300"
                >
                  Publish Listing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
