import React, { useState } from 'react';
import { ArrowLeft, Search, ShoppingBag, Heart, Wallet, CheckCircle2, Copy } from 'lucide-react';

interface EcommerceScreenProps {
  onBack: () => void;
}

export function EcommerceScreen({ onBack }: EcommerceScreenProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const products = [
    { id: 1, name: "Premium Hoodie", price: "45.00", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=300&auto=format&fit=crop", category: "Apparel" },
    { id: 2, name: "Arc Gen-1 Sneakers", price: "120.00", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=300&auto=format&fit=crop", category: "Footwear" },
    { id: 3, name: "Digital Watch X", price: "299.00", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=300&auto=format&fit=crop", category: "Electronics" },
    { id: 4, name: "Travel Backpack", price: "85.00", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=300&auto=format&fit=crop", category: "Accessories" }
  ];

  const handlePurchase = (product: any) => {
    setSelectedProduct(product);
    setIsPurchasing(true);
    setTimeout(() => {
      setIsPurchasing(false);
      setPurchaseSuccess(true);
    }, 3000);
  };

  if (purchaseSuccess) {
    return (
      <div className="w-full h-full bg-slate-50 relative flex flex-col z-50 animate-in slide-in-from-bottom duration-500 overflow-y-auto">
        <div className="bg-[#005faa] pt-12 pb-24 px-6 text-center text-white relative">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto backdrop-blur-sm">
             <CheckCircle2 size={32} className="text-white" />
          </div>
          <h2 className="text-[22px] font-bold mb-1">Payment Successful</h2>
          <p className="text-white/80 text-[13px]">Via M-Banking & Circle Wallet</p>
        </div>

      <div className="flex-1 px-4 lg:px-10 max-w-2xl mx-auto w-full -mt-16 pb-10">
           <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col relative">
              
              <div className="flex flex-col items-center mb-6 border-b border-dashed border-slate-200 pb-6">
                 <span className="text-[12px] text-slate-400 font-bold tracking-wider uppercase mb-2">Total Payment</span>
                 <span className="text-[32px] font-extrabold text-slate-800">{selectedProduct?.price} <span className="text-[16px] text-slate-400">USDC</span></span>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-start">
                   <span className="text-[13px] text-slate-500">Item:</span>
                   <span className="text-[13px] font-bold text-slate-800 text-right">{selectedProduct?.name}</span>
                 </div>
                 <div className="flex justify-between items-start">
                   <span className="text-[13px] text-slate-500">Network:</span>
                   <span className="text-[13px] font-bold text-slate-800 text-right flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Arc Testnet</span>
                 </div>
                 <div className="flex justify-between items-start">
                   <span className="text-[13px] text-slate-500">Merchant:</span>
                   <span className="text-[13px] font-bold text-slate-800 text-right">Arc Marketplace</span>
                 </div>
                 <div className="flex justify-between items-start bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                   <span className="text-[12px] text-slate-500 font-mono self-center">TxHash:</span>
                   <div className="flex items-center gap-2">
                     <span className="text-[12px] font-mono font-bold text-[#005faa] truncate max-w-[120px]">0x7F2a...B49c</span>
                     <Copy size={14} className="text-slate-400" />
                   </div>
                 </div>
              </div>
              
              <div className="absolute -left-3 top-28 w-6 h-6 bg-slate-50 rounded-full"></div>
              <div className="absolute -right-3 top-28 w-6 h-6 bg-slate-50 rounded-full"></div>
           </div>

           <button 
             onClick={onBack}
             className="w-full bg-[#005faa] text-white font-bold py-4 rounded-full hover:bg-[#004780] transition-colors mt-8 shadow-lg shadow-blue-900/20"
           >
             Back to Home
           </button>
           <button className="w-full text-[#005faa] font-bold py-4 rounded-full hover:bg-blue-50 transition-colors mt-2 text-[14px]">
             View Receipt on Block Explorer
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-50 relative flex flex-col z-40 animate-in slide-in-from-bottom duration-500">
      {/* Search Header */}
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm relative z-10 w-full">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-800" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search for products..." 
              className="w-full bg-slate-100 border-none rounded-full py-2.5 pl-10 pr-4 text-[14px] outline-none focus:ring-2 ring-[#005faa]/20 font-medium"
            />
          </div>
        </div>
        
        {/* Categories */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
          {['All', 'Apparel', 'Footwear', 'Electronics', 'Home'].map((cat, i) => (
            <span key={cat} className={`text-[13px] font-bold whitespace-nowrap pb-2 px-1 transition-colors cursor-pointer ${
              i === 0 ? 'text-[#005faa] border-b-2 border-[#005faa]' : 'text-slate-400 hover:text-slate-600'
            }`}>
              {cat}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-6 pb-24 max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-[18px] text-slate-800 tracking-tight">USDC Exclusive Marketplace</h3>
          <span className="text-[11px] font-bold text-[#005faa] bg-blue-50 px-2 py-1 rounded">ARC NETWORK</span>
        </div>

        {/* Hero Banner */}
        <div className="w-full h-36 bg-gradient-to-br from-slate-900 to-[#005faa] rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-blue-900/10 mb-4">
           <div className="relative z-10">
              <h4 className="text-white font-bold text-[18px] leading-tight mb-1">Flash Sale!<br/>20% Discount with USDC</h4>
              <p className="text-white/70 text-[11px] mb-3">Use Arc Wallet for affordable shopping.</p>
              <button className="bg-white text-[#005faa] font-bold text-[11px] px-4 py-1.5 rounded-full hover:bg-slate-100 transition-colors">
                View Promo
              </button>
           </div>
           <div className="absolute right-[-10px] bottom-[-20px] opacity-20">
              <ShoppingBag size={120} className="text-white" strokeWidth={1} />
           </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100 group">
              <div className="relative h-40 overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur shadow-sm p-1.5 rounded-full">
                  <Heart size={14} className="text-slate-300" />
                </div>
              </div>
              <div className="p-3 flex flex-col h-full">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.category}</span>
                <h4 className="font-bold text-slate-800 text-[14px] mb-2 truncate">{product.name}</h4>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-[10px] font-bold text-[#005faa] block -mb-0.5">PRICE</span>
                    <span className="font-bold text-[16px] text-slate-800">{product.price} <span className="text-[10px] text-slate-400 font-normal">USDC</span></span>
                  </div>
                </div>
                <button 
                  onClick={() => handlePurchase(product)}
                  className="w-full mt-3 bg-slate-800 text-white rounded-xl py-2 flex items-center justify-center gap-1.5 hover:bg-slate-700 active:scale-95 transition-all shadow-sm text-[12px] font-bold"
                >
                  <Wallet size={14} className="text-blue-400" /> Buy via Arc
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading Overlay */}
      {isPurchasing && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
           <div className="relative mb-6">
              <div className="w-16 h-16 border-[3px] border-slate-100 border-t-[#005faa] rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Wallet size={20} className="text-[#005faa]" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 bg-white rounded-full shadow-sm">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              </div>
           </div>
           <h3 className="font-bold text-slate-800 text-[18px] mb-2">Processing Smart Contract</h3>
           <p className="text-slate-500 text-[13px] leading-relaxed max-w-[280px]">
             Connecting <span className="font-bold text-slate-700">Circle Wallet</span> to <span className="font-bold text-slate-700">Arc Testnet</span> to complete the payment...
           </p>
        </div>
      )}
    </div>
  );
}
