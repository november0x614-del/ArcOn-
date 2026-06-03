import React, { useState } from "react";
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Heart,
  Home,
  Wallet,
  Settings,
  CheckCircle2,
  ChevronDown,
  Minus,
  Plus
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";

interface EcommerceScreenProps {
  onBack: () => void;
}

export function EcommerceScreen({ onBack }: EcommerceScreenProps) {
  const {
    fetchBalance,
    fetchTransactions,
    displayToast,
    registeredUser,
  } = useApp();

  const [viewState, setViewState] = useState<"list" | "detail" | "checkout" | "success">("list");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [transactionMetadata, setTransactionMetadata] = useState<any>(null);
  const [showHapticFlash, setShowHapticFlash] = useState(false);
  const [cartQuantities, setCartQuantities] = useState<Record<number, number>>({});

  const products = [
    {
      id: 1,
      name: "Zipper Hoodie",
      price: "45.00",
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600",
      category: "Fashion",
      desc: "Premium cotton blend zipper hoodie in deep black. Features a relaxed fit, custom modern hardware, and ribbed cuffs. Perfect for casual comfort and layering.",
      dateLabel: "02.01-07.01"
    },
    {
      id: 2,
      name: "Adidas Shorts",
      price: "25.00",
      image: "https://images.unsplash.com/photo-1608667508764-33cf0726b13a?auto=format&fit=crop&q=80&w=600",
      category: "Activewear",
      desc: "Lightweight performance shorts with breathable mesh panels.",
      dateLabel: "02.01-07.01"
    },
    {
      id: 3,
      name: "Nike Air Max",
      price: "120.00",
      image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&q=80&w=600",
      category: "Footwear",
      desc: "Iconic comfort and sleek style. Featuring updated cushioning and premium materials.",
      dateLabel: "02.01-07.01"
    },
    {
      id: 4,
      name: "Hazelnut & Cocoa",
      price: "12.00",
      image: "https://images.unsplash.com/photo-1579619572182-3d8e578ebcfa?auto=format&fit=crop&q=80&w=600",
      category: "Groceries",
      desc: "Delicious hazelnut spread with premium cocoa.",
      dateLabel: "27.12-05.01"
    },
    {
      id: 5,
      name: "Marseille Detergent",
      price: "14.50",
      image: "https://images.unsplash.com/photo-1584824486509-112e4181f1b6?auto=format&fit=crop&q=80&w=600",
      category: "Household",
      desc: "Authentic liquid detergent based on traditional recipe.",
      dateLabel: "27.12-05.01"
    },
    {
      id: 6,
      name: "Small glass vase",
      price: "22.00",
      image: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&q=80&w=600",
      category: "Home",
      desc: "Minimalist clear glass vase for subtle floral arrangements.",
      dateLabel: "27.12-05.01"
    },
    {
      id: 7,
      name: "Minimal Lamp",
      price: "45.00",
      image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=600",
      category: "Home",
      desc: "Sleek and modern desk lamp with warm LED glow.",
      dateLabel: "27.12-05.01"
    }
  ];

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setViewState("detail");
  };

  const updateQuantity = (id: number, delta: number) => {
    setCartQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const getCartTotal = () => {
    return products.reduce((sum, p) => {
      return sum + (Number(p.price) * (cartQuantities[p.id] || 0));
    }, 0);
  };

  const getCartCount = () => {
    return Object.values(cartQuantities).reduce((a, b) => a + b, 0);
  };

  const executePurchase = async () => {
    setIsPurchasing(true);

    try {
      let totalToPay = getCartTotal();
      if (totalToPay === 0 && selectedProduct) {
        totalToPay = Number(selectedProduct.price);
      }
      
      const serviceFee = totalToPay * 0.015; // 1.5% App Profit
      const finalAmount = totalToPay + serviceFee;

      const response = await fetch("/api/ecommerce/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: registeredUser?.supabaseUid,
          productId: selectedProduct?.id || 0,
          amount: finalAmount,
          memo: selectedProduct?.name || "Cart Checkout",
        }),
      });

      if (!response.ok) throw new Error("Purchase failed");

      const data = await response.json();

      await fetchBalance();
      await fetchTransactions();

      setShowHapticFlash(true);
      setTimeout(() => setShowHapticFlash(false), 600);

      setIsPurchasing(false);
      setViewState("success");

      const voucherCode = Array.from({ length: 4 }, () =>
        Math.random().toString(36).substring(3, 7).toUpperCase(),
      ).join("-");

      setTransactionMetadata({
        txHash: data.txHash || "0x" + Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join(""),
        voucherCode,
        serviceFee: serviceFee.toFixed(2),
        totalPaid: finalAmount.toFixed(2),
      });

      displayToast("Payment Confirmed on Arc Testnet! 🎉");
      setCartQuantities({});
    } catch (err) {
      console.error(err);
      setIsPurchasing(false);
      displayToast("Purchase failed");
    }
  };

  if (viewState === "success") {
    return (
      <div className="w-full h-full bg-[#EAF0DE] flex flex-col z-50 animate-in slide-in-from-bottom duration-300 overflow-hidden relative font-sans">
        <div className="p-6 pt-12 text-center flex flex-col h-full z-10 justify-center items-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
              <CheckCircle2 size={40} className="text-black" />
            </div>
            <h2 className="text-[28px] font-bold text-slate-800 mb-2">Order placed!</h2>
            <p className="text-slate-600 mb-8 max-w-[250px]">Your premium items will be shipped soon. Paid via ARC USDC.</p>
            
            <div className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-sm mb-12 text-left space-y-4">
              <div className="flex justify-between items-center text-[15px]">
                <span className="text-slate-500">Total Paid</span>
                <span className="font-bold text-slate-800">{transactionMetadata?.totalPaid} USDC</span>
              </div>
              <div className="flex justify-between items-center text-[15px]">
                <span className="text-slate-500">Order Ref</span>
                <span className="font-mono font-bold text-slate-800">{transactionMetadata?.voucherCode}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setViewState("list");
                setSelectedProduct(null);
                setCartQuantities({});
              }}
              className="bg-black text-white w-full max-w-xs font-bold py-4 rounded-full shadow-lg active:scale-95 transition-all text-[16px]"
            >
              Back to Shop
            </button>
        </div>
      </div>
    );
  }

  const BottomNav = () => (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black rounded-[32px] px-6 py-4 flex items-center justify-between shadow-xl z-50 transition-all duration-300 w-[90%] max-w-sm">
      <button onClick={() => setViewState("list")} className={`p-2 rounded-[20px] transition-colors shrink-0 ${viewState === 'detail' || viewState === 'list' && getCartCount() === 0 ? 'hover:bg-white/10' : ''}`}>
        <Home size={22} className={viewState === 'detail' || viewState === 'list' && getCartCount() === 0 ? "text-white" : "text-white"} strokeWidth={1.5} />
      </button>
      <button className="p-2 hover:bg-white/10 rounded-[20px] transition-colors shrink-0">
        <Wallet size={22} className="text-white" strokeWidth={1.5} />
      </button>
      <button 
        onClick={() => setViewState("checkout")}
        className={`rounded-[20px] px-5 py-2 flex items-center space-x-2 font-bold cursor-pointer transition-colors shrink-0 ${
          viewState === 'checkout' 
            ? 'bg-[#CEEC98] text-black hover:bg-[#c0E67A]' 
            : 'text-white hover:bg-white/10 p-2 px-3'
        }`}
      >
        <ShoppingCart size={20} strokeWidth={viewState === 'checkout' ? 2 : 1.5} />
        {viewState === 'checkout' && <span>list</span>}
      </button>
      <button className={`p-2 rounded-[20px] transition-colors shrink-0 flex gap-2 items-center text-[15px] font-bold ${viewState === 'list' && getCartCount() === 0 ? "bg-[#CEEC98] text-black hover:bg-[#c0E67A] px-5" : "text-white hover:bg-white/10"}`}>
        <svg fill="currentColor" viewBox="0 0 24 24" className="w-[18px] h-[18px]"><path d="M7 11V15H9V11H7ZM11 11V15H13V11H11ZM15 11V15H17V11H15ZM5 7H19V9H5V7ZM5 17H19V19H5V17Z"></path></svg>
        {viewState === 'list' && getCartCount() === 0 && <span>Bons</span>}
      </button>
    </div>
  );

  return (
    <div className="w-full h-full bg-[#EAF0DE] relative flex flex-col z-40 overflow-hidden font-sans">
      
      {viewState === "list" && (
        <div className="flex-1 overflow-y-auto pb-32 animate-in fade-in duration-300 scrollbar-hide">
          <div className="px-5 pt-10 pb-4 sticky top-0 bg-[#EAF0DE]/90 backdrop-blur-md z-20">
            <div className="flex items-center justify-between mb-8">
              <button onClick={onBack} className="w-12 h-12 bg-white flex items-center justify-center rounded-full shadow-sm hover:scale-[1.03] active:scale-95 transition-all">
                <ChevronDown size={22} className="text-slate-800 rotate-90" strokeWidth={2.5} />
              </button>
              <h1 className="font-bold text-[18px] text-slate-800 mr-2">Good deals</h1>
              <div className="w-10 h-12 flex items-center justify-center"></div>
            </div>
            
            <div className="flex gap-3 items-center">
              <div className="bg-white rounded-[24px] p-1.5 pl-4 flex items-center shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex-1">
                <Search size={22} className="text-slate-400 shrink-0" strokeWidth={2} />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-transparent border-0 py-2.5 flex-1 ml-3 outline-none text-[16px] font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
              <button className="w-14 h-14 bg-white flex items-center justify-center rounded-[24px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] active:scale-95 shrink-0 text-slate-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="8" r="2"></circle><line x1="2" y1="8" x2="8" y2="8"></line><line x1="12" y1="8" x2="22" y2="8"></line><circle cx="14" cy="16" r="2"></circle><line x1="2" y1="16" x2="12" y2="16"></line><line x1="16" y1="16" x2="22" y2="16"></line></svg>
              </button>
            </div>
          </div>

          <div className="px-5 space-y-10 mt-4">
            <div>
              <div className="flex justify-between items-center mb-5 px-1">
                <h3 className="font-bold text-[18px] text-slate-800 tracking-tight">Lost of saving</h3>
                <span className="text-[13px] text-slate-500 font-semibold cursor-pointer">See more</span>
              </div>
              <div className="flex overflow-x-auto gap-4 -mx-5 px-5 scrollbar-hide pb-2">
                {[...products].slice(3, 5).map(p => (
                  <div key={p.id} className="min-w-[160px] max-w-[160px] bg-white rounded-[28px] p-4 flex flex-col shadow-[0_2px_10px_rgba(0,0,0,0.02)] cursor-pointer hover:shadow-md transition-all active:scale-[0.98]" onClick={() => handleProductSelect(p)}>
                    <div className="h-32 w-full mb-4 overflow-hidden rounded-xl bg-[#F8F9F3] flex items-center justify-center">
                       <img src={p.image} className="h-[75%] object-contain mix-blend-multiply" alt={p.name} />
                    </div>
                    <span className="font-bold text-[14px] text-[#222] mb-1.5 leading-tight line-clamp-1">{p.name}</span>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-extrabold text-[15px] text-[#222]">{p.price} €</span>
                      <span className="text-[12px] text-slate-400 font-medium line-through">3.59 €</span>
                    </div>
                    <div className="mt-auto flex justify-between items-center text-slate-400">
                       <div className="flex items-center text-[10px] font-semibold gap-1"><CheckCircle2 size={10} /> {p.dateLabel}</div>
                       <button 
                         onClick={(e) => { e.stopPropagation(); updateQuantity(p.id, 1); displayToast("Added to list"); }} 
                         className="w-8 h-8 rounded-full border-[1.5px] border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
                         <ShoppingCart size={13} strokeWidth={2.5} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-5 px-1">
                <h3 className="font-bold text-[18px] text-slate-800 tracking-tight">Gain purchasing power</h3>
                <span className="text-[13px] text-slate-500 font-semibold cursor-pointer">See more</span>
              </div>
              <div className="flex overflow-x-auto gap-4 -mx-5 px-5 scrollbar-hide pb-4">
                {[...products].slice(5, 7).map(p => (
                  <div key={p.id} className="min-w-[160px] max-w-[160px] bg-white rounded-[28px] p-4 flex flex-col shadow-[0_2px_10px_rgba(0,0,0,0.02)] cursor-pointer hover:shadow-md transition-all active:scale-[0.98]" onClick={() => handleProductSelect(p)}>
                    <div className="h-32 w-full mb-4 overflow-hidden rounded-xl bg-slate-50/50 flex items-center justify-center">
                       <img src={p.image} className="h-[80%] object-contain mix-blend-multiply" alt={p.name} />
                    </div>
                    <span className="font-bold text-[14px] text-[#222] mb-1.5 leading-tight line-clamp-1">{p.name}</span>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-extrabold text-[15px] text-[#222]">{p.price} €</span>
                      {p.id === 6 && <span className="text-[12px] text-slate-400 font-medium line-through">3.59 €</span>}
                    </div>
                    <div className="mt-auto flex justify-between items-center text-slate-400">
                      {p.id === 6 && <div className="flex items-center text-[10px] font-semibold gap-1"><CheckCircle2 size={10} /> {p.dateLabel}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <BottomNav />
        </div>
      )}

      {viewState === "detail" && (
        <div className="absolute inset-0 bg-[#EAF0DE] z-30 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="px-5 pt-10 pb-4 flex items-center justify-between shrink-0">
            <button onClick={() => setViewState("list")} className="w-12 h-12 bg-white flex items-center justify-center rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:scale-[1.03] active:scale-95 transition-all">
               <ChevronDown size={22} className="text-slate-800 rotate-90" strokeWidth={2.5} />
            </button>
            <h1 className="font-bold text-[18px] text-slate-800">Special offers</h1>
            <div className="w-12 h-12"></div>
          </div>

          <div className="flex-1 overflow-y-auto pb-40">
             <div className="w-full h-[320px] relative flex items-center justify-center mb-8">
                <div className="w-[80%] h-full flex items-center justify-center relative">
                   <div className="absolute bottom-6 w-[90%] h-4 bg-black/10 blur-xl rounded-[100%]"></div>
                   <div className="absolute -bottom-2 w-[110%] h-[1px] bg-slate-300 rounded-[100%] shadow-[0_10px_20px_rgba(0,0,0,0.1)]"></div>
                   <img src={selectedProduct?.image} className="w-[90%] h-[90%] object-contain drop-shadow-2xl z-10" alt={selectedProduct?.name} />
                   <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black text-white rounded-full px-2 py-0.5 text-[10px] font-bold z-20 flex items-center gap-1">
                      <ChevronDown size={14} className="rotate-90"/> <ChevronDown size={14} className="-rotate-90"/>
                   </div>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                   <div className="w-2 h-2 rounded-full border-2 border-black relative">
                     <div className="absolute inset-[2px] bg-black rounded-full ring-2 ring-black"></div>
                   </div>
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                </div>
             </div>

             <div className="flex gap-4 justify-center mb-10 px-5">
               <div className="w-[72px] h-[72px] bg-white rounded-[20px] shadow-sm p-2"><img src={selectedProduct?.image} className="w-full h-full object-contain opacity-60" /></div>
               <div className="w-[72px] h-[72px] bg-[#222] rounded-[20px] shadow-md p-2"><img src={selectedProduct?.image} className="w-full h-full object-contain" /></div>
               <div className="w-[72px] h-[72px] bg-white rounded-[20px] shadow-sm p-2"><img src={selectedProduct?.image} className="w-full h-full object-contain opacity-60" /></div>
             </div>

             <div className="bg-white rounded-[40px] rounded-b-none min-h-[400px] p-6 shadow-sm w-full relative">
                <div className="flex justify-between items-start mb-6 pt-2">
                   <h2 className="text-[26px] font-bold text-slate-900 leading-tight w-1/2">{selectedProduct?.name}<br/><span className="text-[22px]">(Black)</span></h2>
                   <div className="text-[24px] font-black text-slate-900 mt-2">{selectedProduct?.price} €</div>
                </div>

                <div className="bg-[#F8F9F3] rounded-[24px] p-4 flex justify-between items-center mb-8">
                   <div className="flex flex-col items-center gap-1">
                      <div className="w-[52px] h-[52px] bg-[#1a1a1a] rounded-[18px] flex items-center justify-center shadow-md relative">
                         <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center"><span className="text-white font-black text-[12px]">L</span></div>
                         <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-[#1a1a1a]"></div>
                      </div>
                      <span className="font-bold text-[13px] text-slate-800 mt-1">E.Leclerc</span>
                   </div>
                   <div className="flex gap-4 px-2">
                      <button className="flex flex-col items-center gap-2"><div className="w-[46px] h-[46px] bg-transparent border-[1px] border-slate-200 rounded-[16px] flex items-center justify-center text-slate-700 active:bg-slate-100"><ShoppingCart size={20} strokeWidth={1.5}/></div><span className="text-[12px] font-bold text-slate-800">Remove</span></button>
                      <button className="flex flex-col items-center gap-2"><div className="w-[46px] h-[46px] bg-transparent border-[1px] border-slate-200 rounded-[16px] flex items-center justify-center text-slate-700 active:bg-slate-100"><Search size={20} strokeWidth={1.5}/></div><span className="text-[12px] font-bold text-slate-800">Catalog</span></button>
                      <button className="flex flex-col items-center gap-2"><div className="w-[46px] h-[46px] bg-transparent border-[1px] border-slate-200 rounded-[16px] flex items-center justify-center text-slate-700 active:bg-slate-100">
                         <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                      </div><span className="text-[12px] font-bold text-slate-800">Share</span></button>
                   </div>
                </div>

                <div className="mb-8">
                   <div className="flex justify-between items-center mb-3">
                     <h3 className="font-bold text-[18px] text-slate-900">Description</h3>
                     <span className="text-[13px] text-slate-500 font-semibold flex items-center gap-1 cursor-pointer">Show more <ChevronDown size={14}/></span>
                   </div>
                </div>

                <button 
                  onClick={() => { updateQuantity(selectedProduct.id, 1); displayToast("Added to list"); setViewState("checkout"); }} 
                  className="w-full bg-[#CEEC98] text-slate-900 font-bold text-[16px] py-4 rounded-[20px] shadow-sm active:scale-[0.98] transition-all"
                >
                  Add to list
                </button>
             </div>
          </div>
        </div>
      )}

      {viewState === "checkout" && (
        <div className="absolute inset-0 bg-[#EAF0DE] z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
           <div className="px-5 pt-10 pb-6 flex items-center justify-between shrink-0">
            <button onClick={() => setViewState("detail")} className="w-12 h-12 bg-white flex items-center justify-center rounded-[18px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:scale-[1.03] active:scale-95 transition-all">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="16" y2="6"></line><line x1="8" y1="12" x2="20" y2="12"></line><line x1="4" y1="18" x2="12" y2="18"></line></svg>
            </button>
            <h1 className="font-bold text-[18px] text-slate-800 mr-2">Shipping list</h1>
            <button className="w-12 h-12 bg-transparent flex items-center justify-center rounded-[18px] active:scale-95 transition-all text-slate-600">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-32">
             <div className="space-y-4 mb-6 relative">
                {(Object.entries(cartQuantities).filter(([_, q]) => q > 0)).map(([id, qty], index) => {
                  const p = products.find(prod => prod.id === Number(id));
                  if (!p) return null;
                  const isDeletable = index === 1; // Simulate one item being swiped
                  return (
                    <div key={id} className="relative rounded-[28px] overflow-hidden bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                       {/* Red swipe background behind item */}
                       {isDeletable && (
                         <div className="absolute inset-0 bg-[#FFD1D1] flex justify-end items-center pr-6">
                           <button onClick={() => updateQuantity(p.id, -qty)} className="w-10 h-10 rounded-full border-2 border-red-500 text-red-500 flex items-center justify-center">
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                           </button>
                         </div>
                       )}
                       
                       <div className={`bg-white p-4 flex gap-4 items-center relative transition-transform ${isDeletable ? '-translate-x-16' : ''}`}>
                         <div className="w-[72px] h-[72px] bg-[#F8F9F3] rounded-[20px] overflow-hidden flex items-center justify-center shrink-0">
                           <img src={p.image} className="w-[80%] h-[80%] object-contain" />
                         </div>
                         <div className="flex-1 pr-1">
                            <div className="flex justify-between items-start mb-0.5">
                              <h4 className="font-bold text-[15px] text-slate-900">{p.name}</h4>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 mt-1"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-3"> <CheckCircle2 size={10} strokeWidth={3}/> {p.dateLabel}</span>
                            <div className="flex justify-between items-center">
                               <div className="flex items-center gap-2 bg-white rounded-full border-[1.5px] border-slate-100 p-1 px-2 shadow-[0_2px_5px_rgba(0,0,0,0.01)]">
                                  <button onClick={() => updateQuantity(p.id, -1)} className="text-slate-800 active:scale-90"><Minus size={14} strokeWidth={2.5}/></button>
                                  <span className="font-bold text-[13px] text-slate-900 w-5 text-center">{qty}</span>
                                  <button onClick={() => updateQuantity(p.id, 1)} className="text-slate-800 active:scale-90"><Plus size={14} strokeWidth={2.5}/></button>
                               </div>
                               <span className="font-extrabold text-[15px] text-[#222]">{(Number(p.price) * qty).toFixed(1)} €</span>
                            </div>
                         </div>
                       </div>
                    </div>
                  );
                })}
             </div>

             <div className="bg-white rounded-[32px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] mb-6">
                <div className="flex items-center mb-6 bg-[#F8F9F3] rounded-[20px] p-2">
                   <div className="flex-1">
                      <input type="text" placeholder="Enter your discount code" className="w-full bg-transparent border-none outline-none font-semibold text-[14px] px-3 py-2 text-slate-800 placeholder-slate-400" />
                   </div>
                   <button className="font-bold text-slate-900 px-4 text-[14px]">Apply</button>
                </div>
                
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-[14px]">
                      <span className="text-slate-400 font-bold">Subtotal</span>
                      <span className="font-bold text-[#222]">{getCartTotal().toFixed(2)} €</span>
                   </div>
                   <div className="w-full h-px border-t border-dashed border-slate-200"></div>
                   <div className="flex justify-between items-center text-[15px]">
                      <span className="text-slate-400 font-bold">Total</span>
                      <span className="font-black text-[18px] text-[#222]">{(getCartTotal()).toFixed(2)} €</span>
                   </div>
                </div>

                <div className="mt-8">
                   <button 
                     disabled={isPurchasing || getCartTotal() === 0}
                     onClick={executePurchase} 
                     className={`w-full font-bold text-[16px] py-4 rounded-[20px] shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                       isPurchasing || getCartTotal() === 0 ? "bg-slate-200 text-slate-400" : "bg-[#CEEC98] text-slate-900 hover:bg-[#c6d9a1]"
                     }`}
                   >
                     {isPurchasing ? "Processing..." : "Make a purchase"}
                   </button>
                </div>
             </div>
          </div>
          <BottomNav />
        </div>
      )}

      {showHapticFlash && (
        <div className="fixed inset-0 z-[1000] bg-white/40 pointer-events-none animate-in fade-in out-fade-out duration-300"></div>
      )}
    </div>
  );
}
