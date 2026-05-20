import React, { useState } from 'react';
import { ArrowLeft, Search, ShoppingBag, Heart, Plus, Wallet } from 'lucide-react';

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
      <div className="w-full h-full bg-white relative flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-300 z-50 text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={40} className="text-[#005faa]" strokeWidth={2.5} />
        </div>
        <h2 className="text-[22px] font-bold text-slate-800 mb-2">Pembelian Berhasil!</h2>
        <p className="text-[14px] text-slate-500 mb-8 leading-relaxed px-4">
          Anda telah berhasil membeli <span className="font-bold text-slate-800">{selectedProduct?.name}</span> seharga <span className="font-bold text-[#005faa]">{selectedProduct?.price} USDC</span> via Arc Network.
        </p>
        <button 
          onClick={onBack}
          className="w-full bg-[#005faa] text-white font-bold py-3.5 rounded-full hover:bg-[#004780] transition-colors"
        >
          Kembali ke Beranda
        </button>
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
              placeholder="Cari produk impian Anda..." 
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

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-[18px] text-slate-800 tracking-tight">Marketplace Khusus USDC</h3>
          <span className="text-[11px] font-bold text-[#005faa] bg-blue-50 px-2 py-1 rounded">ARC NETWORK</span>
        </div>

        {/* Hero Banner */}
        <div className="w-full h-36 bg-gradient-to-br from-slate-900 to-[#005faa] rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-blue-900/10 mb-4">
           <div className="relative z-10">
              <h4 className="text-white font-bold text-[18px] leading-tight mb-1">Flash Sale!<br/>Diskon 20% USDC</h4>
              <p className="text-white/70 text-[11px] mb-3">Gunakan Arc Wallet untuk belanja hemat.</p>
              <button className="bg-white text-[#005faa] font-bold text-[11px] px-4 py-1.5 rounded-full hover:bg-slate-100 transition-colors">
                Lihat Promo
              </button>
           </div>
           <div className="absolute right-[-10px] bottom-[-20px] opacity-20">
              <ShoppingBag size={120} className="text-white" strokeWidth={1} />
           </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 gap-4 pb-10">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100 group">
              <div className="relative h-40 overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur shadow-sm p-1.5 rounded-full">
                  <Heart size={14} className="text-slate-300" />
                </div>
              </div>
              <div className="p-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.category}</span>
                <h4 className="font-bold text-slate-800 text-[14px] mb-2 truncate">{product.name}</h4>
                <div className="flex items-center justify-between mt-auto pt-1">
                  <div>
                    <span className="text-[10px] font-bold text-[#005faa] block -mb-1">HARGA</span>
                    <span className="font-bold text-[15px] text-slate-800">{product.price} <span className="text-[10px] text-slate-400">USDC</span></span>
                  </div>
                  <button 
                    onClick={() => handlePurchase(product)}
                    className="w-10 h-10 bg-[#005faa] text-white rounded-full flex items-center justify-center hover:bg-[#004780] active:scale-95 transition-all shadow-md shadow-blue-900/20"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading Overlay */}
      {isPurchasing && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-[60] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
           <div className="relative mb-6">
              <div className="w-16 h-16 border-[3px] border-slate-100 border-t-[#005faa] rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Wallet size={20} className="text-[#005faa]/60" />
              </div>
           </div>
           <h3 className="font-bold text-slate-800 text-[18px] mb-2">Memproses Pembayaran Arc</h3>
           <p className="text-slate-400 text-[13px] leading-relaxed">
             Sedang memverifikasi transaksi <span className="font-bold text-slate-700">Circle SDK</span> di jaringan <span className="font-bold text-slate-700">Arc Testnet</span>...
           </p>
        </div>
      )}
    </div>
  );
}
