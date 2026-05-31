import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Wallet,
  CheckCircle2,
  Copy,
  ChevronDown,
  Plus,
  Minus,
  Home,
  Package,
  Lock,
  ShieldAlert
} from "lucide-react";
import { useStore } from "../../store/useStore";

interface EcommerceScreenProps {
  onBack: () => void;
}

import { SafeProductImage } from "../common/SafeProductImage";

export function EcommerceScreen({ onBack }: EcommerceScreenProps) {
  const {
    allBalances,
    fetchBalance,
    fetchTransactions,
    displayToast,
    registeredUser,
    products,
    updateProductStockAndSales,
  } = useStore();
  
  const [viewState, setViewState] = useState<
    "list" | "detail" | "checkout" | "success"
  >("list");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<"Digital" | "RealWorld">("Digital");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "preparing" | "broadcasting" | "settling"
  >("idle");
  const [showFilter, setShowFilter] = useState(false);
  const [filterPriceRange, setFilterPriceRange] = useState<"All" | "under10" | "10to50" | "above50">("All");
  const [sortByPrice, setSortByPrice] = useState<"none" | "lowToHigh" | "highToLow">("none");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [transactionMetadata, setTransactionMetadata] = useState<any>(null);
  
  const [cartQuantities, setCartQuantities] = useState<{ [id: number]: number }>({});

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setViewState("detail");
  };

  const updateQuantity = (id: number, delta: number) => {
    setCartQuantities(prev => {
      const newQ = (prev[id] || 0) + delta;
      return { ...prev, [id]: Math.max(0, newQ) };
    });
  };

  const getCartCount = (): number => {
    return Object.values(cartQuantities).reduce((a, b) => (a as number) + (b as number), 0) as number;
  };

  const getCartTotal = (): number => {
    let total = 0;
    (Object.entries(cartQuantities) as Array<[string, number]>).forEach(([id, qty]) => {
      const p = products.find(prod => prod.id === Number(id));
      if (p) total += Number(p.price) * qty;
    });
    return total - discount;
  };

  const applyPromoCode = () => {
    if (promoInput.toUpperCase() === "LOUNGE10") {
      const currentTotal = getCartTotal() + discount;
      if (currentTotal === 0) {
        displayToast("Cart is empty");
        return;
      }
      const savings = currentTotal * 0.1;
      setDiscount(savings);
      displayToast(`Promo applied! You saved ${savings.toFixed(2)} USDC`);
    } else {
      setDiscount(0);
      displayToast("Invalid promo code");
    }
  };

  const handleCopyProduct = () => {
    if (!selectedProduct) return;
    navigator.clipboard.writeText(`${selectedProduct.name} - ${selectedProduct.price} USDC`);
    displayToast("Product info copied to clipboard");
  };

  const handleShareProduct = async () => {
    if (!selectedProduct) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: selectedProduct.name,
          text: selectedProduct.desc,
          url: window.location.href,
        });
      } else {
        handleCopyProduct();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter(p => {
    const isNft = p.category === "NFT";
    const isRwa = p.category === "RWA";
    
    if (selectedCategoryTab === "Digital") {
      if (!isNft) return false;
    } else {
      if (!isRwa) return false;
    }

    // Price range filter
    const priceNum = Number(p.price);
    if (filterPriceRange === "under10" && priceNum >= 10) return false;
    if (filterPriceRange === "10to50" && (priceNum < 10 || priceNum > 50)) return false;
    if (filterPriceRange === "above50" && priceNum <= 50) return false;

    return p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           p.category.toLowerCase().includes(searchQuery.toLowerCase());
  }).sort((a, b) => {
    if (sortByPrice === "lowToHigh") return Number(a.price) - Number(b.price);
    if (sortByPrice === "highToLow") return Number(b.price) - Number(a.price);
    return 0;
  });

  const executePurchase = async () => {
    // Find specific USDC balance for accurate validation
    const usdcData = allBalances.find((b: any) => b.token?.symbol === "USDC");
    const actualUSDC = usdcData ? parseFloat(usdcData.amount) : 0;
    
    let subtotal = getCartTotal();
    if (subtotal === 0 && selectedProduct && viewState === "detail") {
       subtotal = Number(selectedProduct.price);
    }
    
    if (subtotal === 0) return;

    const serviceFee = subtotal * 0.015; // 1.5% App Profit
    const totalToPay = subtotal + serviceFee;

    if (totalToPay > actualUSDC) {
      displayToast(
        `Insufficient USDC balance. Required ${totalToPay.toFixed(2)} USDC (including 1.5% Fee).`,
      );
      return;
    }

    setIsPurchasing(true);
    setPaymentStatus("preparing");

    try {
      setPaymentStatus("broadcasting");

      const response = await fetch("/api/ecommerce/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: registeredUser?.supabaseUid,
          productId: selectedProduct?.id || 0,
          amount: totalToPay,
          memo: getCartCount() > 0 ? `Grocery Cart (${getCartCount()} items)` : (selectedProduct?.name || "Grocery"),
        }),
      });

      if (!response.ok) throw new Error("Purchase failed");

      const data = await response.json();
      setPaymentStatus("settling");

      await fetchBalance();
      await fetchTransactions();

      setIsPurchasing(false);
      setPaymentStatus("idle");
      setViewState("success");

      // Decrement product stocks and increment sales dynamically on purchase success
      try {
        const activeCartItems = (Object.entries(cartQuantities) as Array<[string, number]>).filter(([_, q]) => q > 0);
        if (activeCartItems.length > 0) {
          activeCartItems.forEach(([id, qty]) => {
            updateProductStockAndSales(Number(id), qty);
          });
        } else if (selectedProduct) {
          updateProductStockAndSales(selectedProduct.id, 1);
        }
      } catch (e) {
        console.error("Dynamic stock update failed:", e);
      }

      setTransactionMetadata({
        txHash: data.txHash || "0x...",
        date: new Date().toISOString(),
        merchantBase: "Arc Marketplace",
        voucherCode: "GROCERY-PICKUP",
        serviceFee: serviceFee.toFixed(2),
        totalPaid: totalToPay.toFixed(2),
        useEscrow: data.useEscrow,
        escrowAddress: data.escrowAddress,
      });

      displayToast("Payment Confirmed! 🎉");
      setCartQuantities({}); // clear cart
    } catch (err) {
      console.error(err);
      setIsPurchasing(false);
      setPaymentStatus("idle");
      displayToast("Purchase failed");
    }
  };

  if (viewState === "success") {
    return (
      <div className="w-full h-full bg-slate-50 flex flex-col z-50 animate-in slide-in-from-bottom duration-500 overflow-hidden relative font-sans">
        <div className="flex items-center px-6 pt-10 pb-3 bg-transparent relative z-10 w-full shrink-0 justify-between">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-90 cursor-pointer text-slate-800 border-0 bg-transparent">
             <ChevronDown size={22} className="rotate-90" strokeWidth={3}/>
          </button>
        </div>

        <div className="flex-1 p-8 flex flex-col items-center justify-center -mt-10">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-8 shadow-xl shadow-emerald-100/50 border border-emerald-50 animate-bounce">
              <CheckCircle2 size={40} className="text-emerald-500" strokeWidth={3} />
            </div>
            <h2 className="text-[30px] font-black text-slate-900 mb-2 leading-tight tracking-tight">Payment Executed</h2>
            <p className="text-[14px] text-slate-400 mb-10 max-w-[240px] mx-auto text-center font-bold uppercase tracking-widest leading-relaxed">Your order on Arc Testnet has been confirmed.</p>

            <div className="bg-white rounded-[32px] p-7 w-full shadow-sm border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -z-0"></div>
               <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-center">
                     <span className="text-slate-400 font-black text-[12px] uppercase tracking-widest">Amount Paid</span>
                     <span className="text-slate-900 font-black text-[18px]">{transactionMetadata?.totalPaid} USDC</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-slate-400 font-black text-[12px] uppercase tracking-widest">Voucher Code</span>
                     <span className="text-slate-900 font-mono font-black text-[16px] bg-slate-50 px-3 py-1 rounded-xl">{transactionMetadata?.voucherCode}</span>
                  </div>
                  <div className="w-full h-px border-t border-slate-100 mt-2"></div>
                  <div className="flex justify-between items-center pt-2">
                     <span className="text-slate-400 font-black text-[12px] uppercase tracking-widest">Network</span>
                     <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="text-slate-900 font-black text-[13px] uppercase tracking-tighter">Arc Testnet</span>
                     </div>
                  </div>
               </div>
            </div>
            
            <button
               onClick={() => setViewState("list")}
               className="w-full bg-slate-900 text-white font-black py-4 rounded-3xl mt-10 active:scale-[0.98] transition-all text-[16px] shadow-xl shadow-slate-200 hover:bg-slate-800 border-0 cursor-pointer"
            >
               Return to Store
            </button>
        </div>
      </div>
    );
  }

  const BottomNav = () => {
    const isShopActive = viewState === "list" || viewState === "detail";
    const isCartActive = viewState === "checkout";

    return (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 rounded-[32px] px-3 py-2 flex items-center justify-between shadow-2xl z-50 transition-all duration-300 w-[92%] max-w-sm border border-white/5 font-sans">
        {/* Shop Tab */}
        <button 
          onClick={() => setViewState("list")}
          className={`p-2 px-4 rounded-[22px] flex items-center gap-1.5 transition-all text-xs font-black uppercase tracking-wider border-0 cursor-pointer ${
            isShopActive 
              ? "bg-white text-slate-900 shadow-md scale-105" 
              : "text-slate-400 hover:text-white bg-transparent"
          }`}
        >
          <Home size={18} strokeWidth={isShopActive ? 3 : 2} />
          {isShopActive && <span>Shop</span>}
        </button>

        {/* Checkout/Cart Tab */}
        <button 
          onClick={() => setViewState("checkout")}
          className={`p-2 px-4 rounded-[22px] flex items-center gap-1.5 transition-all text-xs font-black uppercase tracking-wider border-0 cursor-pointer relative ${
            isCartActive 
              ? "bg-white text-slate-900 shadow-md scale-105" 
              : "text-slate-400 hover:text-white bg-transparent"
          }`}
        >
          <ShoppingCart size={18} strokeWidth={isCartActive ? 3 : 2} />
          {isCartActive ? (
            <span>Cart</span>
          ) : (
            getCartCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#CEEC98] text-slate-950 font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900 animate-pulse">
                {getCartCount()}
              </span>
            )
          )}
          {isCartActive && getCartCount() > 0 && (
            <span className="bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold">
              {getCartCount()}
            </span>
          )}
        </button>

        {/* Back to main wallet */}
        <button 
          onClick={() => onBack()}
          className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all border border-white/5 cursor-pointer shrink-0"
          title="Return to Wallet"
        >
          <Wallet size={18} strokeWidth={2.5} />
        </button>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-slate-50 relative flex flex-col z-40 overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {viewState === "list" && (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex-1 overflow-y-auto pb-40 scrollbar-hide"
          >
            {/* Minimal Header */}
            <div className="bg-white pt-6 pb-5 px-6 rounded-b-[32px] shadow-sm border-b border-slate-100 relative z-30">
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={onBack} 
                  className="w-10 h-10 bg-slate-50 hover:bg-slate-100 flex items-center justify-center rounded-full active:scale-95 transition-all text-slate-800 border-0 cursor-pointer"
                >
                  <ChevronDown size={20} className="rotate-90" strokeWidth={3} />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Arc Marketplace</span>
                </div>
                <div className="w-10 h-10"></div>
              </div>

              {/* Integrated Search Box inside Header with Zero Overlap */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-1.5 pl-4 flex items-center shadow-inner relative z-50">
                <Search size={18} className="text-slate-400 shrink-0" strokeWidth={2.5} />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-0 py-2 flex-1 ml-2.5 outline-none text-[14px] font-bold text-slate-800 placeholder-slate-400"
                />
                <button 
                  onClick={() => {
                    if (searchQuery) {
                      setSearchQuery("");
                    } else {
                      setShowFilter(!showFilter);
                    }
                  }}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl active:scale-95 shrink-0 transition-all border cursor-pointer shadow-sm ${
                    showFilter || filterPriceRange !== "All" || sortByPrice !== "none"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-100 hover:bg-slate-100"
                  }`}
                >
                  {searchQuery ? (
                     <Plus size={16} className="rotate-45" strokeWidth={3} />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="8" r="2"></circle><line x1="2" y1="8" x2="8" y2="8"></line><line x1="12" y1="8" x2="22" y2="8"></line><circle cx="14" cy="16" r="2"></circle><line x1="2" y1="16" x2="12" y2="16"></line><line x1="16" y1="16" x2="22" y2="16"></line></svg>
                  )}
                </button>

                {/* Minimalist Price Range & Sorting Popup */}
                <AnimatePresence>
                  {showFilter && (
                    <>
                      <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowFilter(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-14 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 flex flex-col gap-4 font-sans text-left"
                      >
                        <div>
                          <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase mb-2 block">Price Filter</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { id: "All", label: "All Price" },
                              { id: "under10", label: "< 10 USDC" },
                              { id: "10to50", label: "10 - 50 USDC" },
                              { id: "above50", label: "> 50 USDC" },
                            ].map(opt => (
                              <button
                                key={opt.id}
                                onClick={() => setFilterPriceRange(opt.id as any)}
                                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border cursor-pointer active:scale-95 transition-all ${
                                  filterPriceRange === opt.id 
                                    ? "bg-slate-900 border-slate-900 text-white" 
                                    : "bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase mb-2 block">Sort by Price</span>
                          <div className="flex gap-1.5">
                            {[
                              { id: "none", label: "Default" },
                              { id: "lowToHigh", label: "Lowest" },
                              { id: "highToLow", label: "Highest" },
                            ].map(opt => (
                              <button
                                key={opt.id}
                                onClick={() => setSortByPrice(opt.id as any)}
                                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border cursor-pointer active:scale-95 transition-all ${
                                  sortByPrice === opt.id 
                                    ? "bg-slate-900 border-slate-900 text-white" 
                                    : "bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setFilterPriceRange("All");
                            setSortByPrice("none");
                            setShowFilter(false);
                          }}
                          className="w-full py-2.5 text-[10px] font-extrabold text-rose-500 uppercase tracking-widest border border-rose-100 bg-rose-50/20 rounded-xl hover:bg-rose-50 cursor-pointer active:scale-[0.98] transition-all"
                        >
                          Reset Filters
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Category Tab Selector - Segmented design matching the Inbox screen */}
            <div className="px-5 mt-6 relative z-20">
              <div className="bg-slate-100 p-1 rounded-2xl flex items-center relative gap-1 shadow-inner border border-slate-200/35">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab("Digital")}
                  className={`flex-1 py-3 px-3 rounded-xl font-bold text-[13px] transition-all relative z-10 border-none cursor-pointer ${
                    selectedCategoryTab === "Digital"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 bg-transparent"
                  }`}
                >
                  Digital Wallet
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab("RealWorld")}
                  className={`flex-1 py-3 px-3 rounded-xl font-bold text-[13px] transition-all relative z-10 border-none cursor-pointer ${
                    selectedCategoryTab === "RealWorld"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 bg-transparent"
                  }`}
                >
                  RWA
                </button>
              </div>
            </div>

            {selectedCategoryTab === "Digital" ? (
              <div className="px-5 mt-8 space-y-10 relative z-10">
                <div>
                  <div className="flex justify-between items-end mb-6 px-1">
                    <div>
                      <h3 className="font-black text-[18px] text-slate-900 tracking-tight">
                        {searchQuery ? `Search Results (${filteredProducts.length})` : "NFT Collections"}
                      </h3>
                      <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {searchQuery ? "Based on your search" : "Arc Native Digital Inventory"}
                      </p>
                    </div>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200/60 shadow-sm">
                      <Package size={36} className="text-slate-300 mx-auto mb-4" />
                      <h2 className="font-black text-slate-700 text-sm uppercase tracking-wider mb-1">No digital assets listed</h2>
                      <p className="text-[12px] text-slate-400 max-w-[200px] mx-auto font-medium">Use the Merchant Console or Mint option to publish a new NFT.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 pb-12">
                      {filteredProducts.map(p => (
                        <div 
                          key={p.id} 
                          className="bg-white rounded-[24px] p-3 flex flex-col border border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all relative group" 
                          onClick={() => handleProductSelect(p)}
                        >
                          <div className="h-36 w-full mb-3.5 overflow-hidden rounded-2xl bg-slate-50 flex items-center justify-center relative">
                            <SafeProductImage src={p.image} name={p.name} category={p.category} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute top-2 right-2 bg-slate-900/85 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border border-white/10">
                              L1 NFT
                            </div>
                          </div>
                          <span className="font-black text-[13.5px] text-slate-900 mb-1 leading-tight line-clamp-1 px-1">{p.name}</span>
                          <span className="font-bold text-[11px] text-slate-400 mb-3 px-1 block uppercase tracking-wide truncate">{p.desc}</span>
                          
                          <div className="mt-auto flex justify-between items-center px-1 pt-1.5 border-t border-slate-50">
                             <div className="flex flex-col text-left">
                               <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Price</span>
                               <span className="font-black text-[14.5px] text-slate-900 tracking-tight leading-none">{p.price} <span className="text-[10px] text-slate-500">USDC</span></span>
                             </div>
                             <button 
                               onClick={(e) => { e.stopPropagation(); updateQuantity(p.id, 1); displayToast("Added NFT to Cart"); }} 
                               className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-850 flex items-center justify-center text-white active:scale-90 transition-all border-0 shadow-lg shadow-slate-200 cursor-pointer">
                               <Plus size={14} strokeWidth={3} />
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-5 mt-8 space-y-10 relative z-10">
                <div>
                  <div className="flex justify-between items-end mb-6 px-1">
                    <div>
                      <h3 className="font-black text-[18px] text-slate-900 tracking-tight">
                        {searchQuery ? `Search RWA (${filteredProducts.length})` : "Real World Assets"}
                      </h3>
                      <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {searchQuery ? "Based on your search" : "Arc Verified Assets"}
                      </p>
                    </div>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200/60 shadow-sm">
                      <Lock size={36} className="text-slate-300 mx-auto mb-4" />
                      <h2 className="font-black text-slate-700 text-sm uppercase tracking-wider mb-1">No RWA Assets listed</h2>
                      <p className="text-[12px] text-slate-400 max-w-[200px] mx-auto font-medium">Verified merchants only can list Real World Assets.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 pb-12">
                      {filteredProducts.map(p => (
                        <div 
                          key={p.id} 
                          className="bg-white rounded-[24px] p-3 flex flex-col border border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all relative group" 
                          onClick={() => handleProductSelect(p)}
                        >
                          <div className="h-36 w-full mb-3.5 overflow-hidden rounded-2xl bg-blue-50/30 flex items-center justify-center relative">
                            <SafeProductImage src={p.image} name={p.name} category={p.category} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border border-white/10">
                              SECURE RWA
                            </div>
                          </div>
                          <span className="font-black text-[13.5px] text-slate-900 mb-1 leading-tight line-clamp-1 px-1">{p.name}</span>
                          <span className="font-bold text-[11px] text-slate-400 mb-3 px-1 block uppercase tracking-wide truncate">{p.desc}</span>
                          
                          <div className="mt-auto flex justify-between items-center px-1 pt-1.5 border-t border-slate-50">
                             <div className="flex flex-col text-left">
                               <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Price</span>
                               <span className="font-black text-[14.5px] text-slate-900 tracking-tight leading-none">{p.price < 1000 ? p.price : (p.price / 1000).toFixed(0) + "k"} <span className="text-[10px] text-slate-500">USDC</span></span>
                             </div>
                             <button 
                               onClick={(e) => { e.stopPropagation(); updateQuantity(p.id, 1); displayToast("Added RWA to Cart"); }} 
                               className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white active:scale-90 transition-all border-0 shadow-lg shadow-blue-100 cursor-pointer">
                               <Plus size={14} strokeWidth={3} />
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {viewState === "detail" && (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute inset-0 bg-white z-30 flex flex-col"
          >
            <div className="px-6 pt-10 pb-4 flex items-center justify-between shrink-0 bg-white border-b border-slate-100">
              <button 
                onClick={() => setViewState("list")} 
                className="w-10 h-10 bg-white flex items-center justify-center rounded-full shadow-sm hover:scale-[1.03] active:scale-95 transition-all text-slate-800 border-[1.5px] border-slate-100 cursor-pointer"
              >
                 <ChevronDown size={20} className="text-slate-800 rotate-90" strokeWidth={3} />
              </button>
              <span className="font-black text-[12px] uppercase tracking-[0.2em] text-slate-400">Product Details</span>
              <button 
                onClick={handleCopyProduct}
                className="w-10 h-10 bg-white flex items-center justify-center rounded-full shadow-sm active:scale-95 transition-all text-slate-400 border-[1.5px] border-slate-100 cursor-pointer"
              >
                 <Copy size={18} strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-6 bg-white">
               <div className="w-full px-6 mt-4 flex justify-center">
                  <div className="w-full max-w-[320px] aspect-square rounded-[24px] overflow-hidden shadow-sm relative group bg-slate-50 border-[1.5px] border-slate-100 flex items-center justify-center">
                     <SafeProductImage src={selectedProduct?.image} name={selectedProduct?.name || "Product"} category={selectedProduct?.category || "General"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-30 pointer-events-none"></div>
                     <div className="absolute bottom-4 left-4">
                        <span className="bg-emerald-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-md">In Stock</span>
                     </div>
                  </div>
               </div>

               <div className="p-6">
                  <div className="flex justify-between items-start mb-5">
                     <div>
                       <h2 className="text-[22px] font-black text-slate-900 leading-tight mb-1">{selectedProduct?.name}</h2>
                       <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{selectedProduct?.category}</p>
                     </div>
                     <div className="bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100 text-right">
                       <span className="text-[18px] font-black text-slate-900 tracking-tight block leading-none">{selectedProduct?.price}</span>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block mt-0.5">USDC</span>
                     </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center mb-5 border border-slate-100">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-md relative shrink-0">
                           <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center ring-2 ring-slate-900"><span className="text-white font-black text-[9px]">A</span></div>
                        </div>
                        <div>
                           <span className="font-black text-[13px] text-slate-900 block">Arc Market Admin</span>
                           <span className="text-[10px] font-bold text-slate-400">Verified Seller</span>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button 
                          onClick={() => { updateQuantity(selectedProduct.id, 1); displayToast("Added to cart"); }}
                          className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 active:scale-90 transition-all cursor-pointer"
                        >
                          <ShoppingCart size={16} strokeWidth={2.5}/>
                        </button>
                        <button 
                          onClick={handleShareProduct}
                          className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 active:scale-90 transition-all cursor-pointer"
                        >
                           <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                        </button>
                     </div>
                  </div>

                  <div className="mb-4">
                     <h3 className="font-black text-[13px] uppercase tracking-wider text-slate-400 mb-2">Product Info</h3>
                     <p className="text-[13px] text-slate-600 font-medium leading-relaxed">{selectedProduct?.desc}</p>
                  </div>
               </div>
            </div>

            {/* Seamless, unblockable sticky action bar with blur effect */}
            <div className="bg-white/95 backdrop-blur-md border-t border-slate-100 p-4 px-6 shrink-0 z-40">
              <button 
                onClick={() => { updateQuantity(selectedProduct.id, 1); displayToast("Added to cart"); setViewState("checkout"); }} 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[15px] py-3.5 rounded-2xl shadow-xl shadow-slate-100 active:scale-[0.98] transition-all border-0 cursor-pointer"
              >
                Buy Now with USDC
              </button>
            </div>
          </motion.div>
        )}

        {viewState === "checkout" && (
          <motion.div 
            key="checkout"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="absolute inset-0 bg-slate-50 z-50 flex flex-col"
          >
             <div className="px-6 pt-10 pb-6 flex items-center justify-between shrink-0">
              <button 
                onClick={() => setViewState(selectedProduct ? "detail" : "list")} 
                className="w-10 h-10 bg-white flex items-center justify-center rounded-xl shadow-sm active:scale-95 transition-all text-slate-800 border-[1.5px] border-slate-100 cursor-pointer"
              >
                 <ChevronDown size={20} className="text-slate-800 rotate-90" strokeWidth={3} />
              </button>
              <h1 className="font-black text-[17px] text-slate-900 tracking-tight">Review Order</h1>
              <button className="w-10 h-10"></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-32">
               <div className="space-y-4 mb-8">
                  {(Object.entries(cartQuantities) as Array<[string, number]>).filter(([_, q]) => q > 0).length === 0 && (
                     <div className="text-center p-12 bg-white rounded-[32px] border border-dashed border-slate-200 text-slate-400 font-bold text-[14px]">Your cart is empty.</div>
                   )}
                  {(Object.entries(cartQuantities) as Array<[string, number]>).filter(([_, q]) => q > 0).map(([id, qty]) => {
                    const p = products.find(prod => prod.id === Number(id));
                    if (!p) return null;
                    return (
                      <div key={id} className="rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-sm p-4">
                         <div className="flex gap-4 items-center">
                            <div className="w-[84px] h-[84px] bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                              <SafeProductImage src={p.image} name={p.name} category={p.category} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                               <div className="flex justify-between items-start mb-0.5">
                                 <h4 className="font-black text-[15px] text-slate-900 line-clamp-1">{p.name}</h4>
                                 <button onClick={() => updateQuantity(p.id, -qty)} className="text-slate-300 hover:text-red-500 active:scale-90 transition-all border-0 bg-transparent p-1 cursor-pointer">
                                   <Plus size={16} className="rotate-45" strokeWidth={3} />
                                 </button>
                               </div>
                               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 block">In Stock</span>
                               <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1.5 px-3 border border-slate-100">
                                     <button onClick={() => updateQuantity(p.id, -1)} className="text-slate-800 active:scale-90 border-0 bg-transparent cursor-pointer p-0"><Minus size={14} strokeWidth={3}/></button>
                                     <span className="font-black text-[13px] text-slate-900 w-4 text-center">{qty}</span>
                                     <button onClick={() => updateQuantity(p.id, 1)} className="text-slate-800 active:scale-90 border-0 bg-transparent cursor-pointer p-0"><Plus size={14} strokeWidth={3}/></button>
                                  </div>
                                  <span className="font-black text-[15px] text-slate-900">{(Number(p.price) * qty).toFixed(2)} USDC</span>
                               </div>
                            </div>
                         </div>
                      </div>
                    );
                  })}
               </div>

               <div className="bg-white rounded-[32px] p-7 shadow-sm border border-slate-100 mb-6">
                  <div className="flex items-center mb-8 bg-slate-50 rounded-2xl p-1.5 border border-slate-100 shadow-inner">
                     <div className="flex-1">
                        <input 
                          type="text" 
                          placeholder="Promo code" 
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          className="w-full bg-transparent border-none outline-none font-bold text-[14px] px-4 py-2 text-slate-800 placeholder-slate-300 uppercase tracking-widest" 
                        />
                     </div>
                     <button 
                      onClick={applyPromoCode}
                      className="font-black text-slate-900 px-6 text-[11px] uppercase tracking-widest hover:bg-slate-200 rounded-xl py-2 transition-all border-0 bg-transparent cursor-pointer"
                     >
                       Apply
                     </button>
                  </div>

                  <div className="space-y-4">
                     <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-400 font-bold uppercase tracking-widest">Subtotal</span>
                        <span className="font-black text-slate-900">{(getCartTotal() + discount).toFixed(2)} USDC</span>
                     </div>
                     {discount > 0 && (
                        <div className="flex justify-between items-center text-[13px]">
                          <span className="text-emerald-500 font-bold uppercase tracking-widest">Discount (LOUNGE10)</span>
                          <span className="font-black text-emerald-500">-{discount.toFixed(2)} USDC</span>
                        </div>
                     )}
                     <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-400 font-bold uppercase tracking-widest">Platform Fee (1.5%)</span>
                        <span className="font-black text-slate-900">{(getCartTotal() * 0.015).toFixed(2)} USDC</span>
                     </div>
                     <div className="w-full h-px border-t border-slate-100 my-2"></div>
                     <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-black text-[12px] uppercase tracking-[0.2em]">Total Settlement</span>
                        <span className="font-black text-[22px] text-slate-900 tracking-tighter">{(getCartTotal() * 1.015).toFixed(2)} <span className="text-[12px] text-slate-400">USDC</span></span>
                     </div>
                  </div>

                  <div className="mt-10">
                     <button 
                       disabled={isPurchasing || getCartTotal() === 0}
                       onClick={executePurchase} 
                       className={`w-full font-black text-[16px] py-4 rounded-3xl shadow-xl transition-all flex items-center justify-center gap-3 border-0 cursor-pointer ${
                         isPurchasing || getCartTotal() === 0 
                           ? "bg-slate-100 text-slate-300 shadow-none" 
                           : "bg-slate-900 text-white shadow-slate-200 active:scale-[0.98] hover:bg-slate-800"
                       }`}
                     >
                       {isPurchasing ? (
                         <>
                           <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                           <span>Broadcasting...</span>
                         </>
                       ) : "Confirm & Purchase"}
                     </button>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {viewState === "list" && <BottomNav />}
    </div>
  );
}
