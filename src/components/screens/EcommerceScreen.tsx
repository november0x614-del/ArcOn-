import React, { useState } from "react";
import {
  ArrowLeft,
  Search,
  ShoppingBag,
  Heart,
  Wallet,
  CheckCircle2,
  Copy,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";

interface EcommerceScreenProps {
  onBack: () => void;
}

export function EcommerceScreen({ onBack }: EcommerceScreenProps) {
  const {
    balance,
    fetchBalance,
    fetchTransactions,
    displayToast,
    registeredUser,
  } = useApp();
  const [viewState, setViewState] = useState<
    "list" | "detail" | "checkout" | "success"
  >("list");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "preparing" | "broadcasting" | "settling"
  >("idle");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [transactionMetadata, setTransactionMetadata] = useState<any>(null);
  const [showHapticFlash, setShowHapticFlash] = useState(false);

  const products = [
    {
      id: 1,
      name: "Spotify Premium (1 Month)",
      price: "4.50",
      image:
        "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=300&auto=format&fit=crop",
      category: "Subscription",
      desc: "Nikmati musik tanpa iklan di semua perangkat. Aktivasi instan setelah pembayaran dikonfirmasi di jaringan Arc.",
    },
    {
      id: 2,
      name: "MLBB 500 Diamonds",
      price: "8.90",
      image:
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=300&auto=format&fit=crop",
      category: "Game Voucher",
      desc: "Top up diamond Mobile Legends instan. Masukkan ID user saat checkout untuk pengiriman otomatis via smart contract.",
    },
    {
      id: 3,
      name: "Netflix Card $15",
      price: "15.00",
      image:
        "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=300&auto=format&fit=crop",
      category: "Entertainment",
      desc: "Voucher saldo Netflix global. Kode voucher akan muncul di struk transaksi Anda segera setelah transaksi final.",
    },
    {
      id: 4,
      name: "Steam Wallet $20",
      price: "20.00",
      image:
        "https://images.unsplash.com/photo-1585644131013-176865239a2d?q=80&w=300&auto=format&fit=crop",
      category: "Game Voucher",
      desc: "Isi saldo Steam Wallet Anda untuk membeli game terbaru. Mendukung transaksi lintas negara menggunakan USDC.",
    },
  ];

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setViewState("detail");
  };

  const handleCheckoutInit = () => {
    setViewState("checkout");
  };

  const handleConfirmPurchase = () => {
    const totalWithFee = Number(selectedProduct.price) * 1.015;
    if (totalWithFee > balance) {
      displayToast(`Saldo tidak cukup. Dibutuhkan ${totalWithFee.toFixed(2)} USDC (termasuk 1.5% Platform Fee).`);
      return;
    }
    executePurchase();
  };

  const executePurchase = async () => {
    setIsPurchasing(true);
    setPaymentStatus("preparing");

    try {
      const price = Number(selectedProduct.price);
      const serviceFee = price * 0.015; // 1.5% App Profit
      const totalToPay = price + serviceFee;

      setPaymentStatus("broadcasting");

      const response = await fetch("/api/purchase/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: registeredUser?.supabaseUid,
          amount: totalToPay,
          product: selectedProduct.name,
        }),
      });

      if (!response.ok) throw new Error("Purchase failed");

      const data = await response.json();
      setPaymentStatus("settling");

      await fetchBalance();
      await fetchTransactions();

      setShowHapticFlash(true);
      setTimeout(() => setShowHapticFlash(false), 600);

      setIsPurchasing(false);
      setPaymentStatus("idle");
      setViewState("success");

      const voucherCode =
        selectedProduct.category === "Subscription"
          ? "AUTO_ACTIVATE_SYD_" +
            Math.random().toString(36).substring(2, 10).toUpperCase()
          : Array.from({ length: 4 }, () =>
              Math.random().toString(36).substring(3, 7).toUpperCase(),
            ).join("-");

      setTransactionMetadata({
        txHash: data.txHash,
        date: new Date().toISOString(),
        merchantBase: "0x32F9...41cA",
        voucherCode,
        serviceFee: serviceFee.toFixed(2),
        totalPaid: totalToPay.toFixed(2),
      });

      displayToast("Payment Confirmed on Arc Testnet! 🎉");
    } catch (err) {
      console.error(err);
      setIsPurchasing(false);
      setPaymentStatus("idle");
      displayToast("Purchase failed");
    }
  };

  if (viewState === "success") {
    return (
      <div className="w-full h-full bg-slate-50 relative flex flex-col z-50 animate-in slide-in-from-bottom duration-300 overflow-y-auto">
        <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full shrink-0 justify-between">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h2 className="font-bold text-[16px] text-white ml-2">
            Transaction Receipt
          </h2>
        </div>

        <div className="flex-1 p-6 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
          <div className="bg-white p-6 rounded-[32px] w-full max-w-sm shadow-xl flex flex-col items-center relative overflow-hidden">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-md animate-bounce">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h2 className="text-[20px] font-extrabold text-white mb-1">
              Payment Successful
            </h2>
            <p className="text-[13px] text-slate-500 mb-6 text-center">
              Your order has been paid securely via Arc Network.
            </p>

            <div className="w-full border-t border-dashed border-slate-200 pt-6 space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-[13px] font-medium text-slate-500">
                  Merchant
                </span>
                <div className="text-right">
                  <span className="text-[13px] font-bold text-slate-800 block">
                    Arc Marketplace
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {transactionMetadata?.merchantBase}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-[13px] font-medium text-slate-500">
                  Product
                </span>
                <span className="text-[13px] font-bold text-slate-800 text-right max-w-[150px] truncate">
                  {selectedProduct?.name}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-100/50 p-3 rounded-xl border border-slate-200/30">
                <span className="text-[13px] font-medium text-slate-500">
                  Total Paid (inc. fee)
                </span>
                <span className="text-[16px] font-black text-slate-800">
                  {transactionMetadata?.totalPaid} USDC
                </span>
              </div>

              {/* Digital Delivery Module */}
              <div className="bg-slate-100/50 rounded-2xl p-4 border border-slate-200/50 my-2 animate-in fade-in slide-in-from-top-2 duration-500 delay-200">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 block text-center">
                  Your Digital Product
                </span>
                {selectedProduct?.category === "Subscription" ? (
                  <div className="flex flex-col items-center py-1">
                    <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[11px] font-bold mb-1">
                      Status: Activated
                    </div>
                    <p className="text-[11px] text-slate-600 text-center font-medium leading-relaxed">
                      Akses {selectedProduct?.name} telah diaktifkan di email
                      akun Anda.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="bg-white border-2 border-dashed border-blue-200 rounded-xl px-4 py-3 w-full flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-[16px] text-slate-800 tracking-widest">
                        {transactionMetadata?.voucherCode}
                      </span>
                      <button
                        onClick={() => {
                          if (transactionMetadata?.voucherCode) {
                            navigator.clipboard.writeText(
                              transactionMetadata.voucherCode,
                            );
                            displayToast("Code Copied!");
                          }
                        }}
                        className="text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors border border-slate-200 bg-white"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center italic">
                      Cek Inbox (Struk) untuk melihat kode ini kapan saja.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[12px] font-medium text-slate-500">
                  Tx Hash
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-mono text-slate-800 font-bold truncate max-w-[120px]">
                    {transactionMetadata?.txHash}
                  </span>
                  <button className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-1 rounded-md shadow-sm border border-slate-200">
                    <Copy size={12} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-medium text-slate-500">
                  Network Fee
                </span>
                <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                  Sponsored by Arc Network
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onBack}
            className="w-full max-w-sm mt-8 bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors shadow-lg active:scale-95"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-50 relative flex flex-col z-40 animate-in slide-in-from-bottom duration-300">
      {/* Search Header (List View) */}
      <div
        className={`bg-white px-4 pt-6 pb-3 shadow-sm relative z-10 w-full transition-all duration-300 ${viewState !== "list" ? "hidden" : "block"}`}
      >
        <div className="flex items-center justify-between mb-4 mt-1">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
            >
              <ArrowLeft size={20} className="text-slate-800" />
            </button>
            <h1 className="font-bold text-[16px] text-slate-800 ml-2">
              E-COMMERCE
            </h1>
          </div>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors -mr-2 bg-transparent border-0">
            <Search size={20} className="text-white" />
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
          {[
            "All",
            "Game Voucher",
            "Subscription",
            "Entertainment",
            "Others",
          ].map((cat, i) => (
            <span
              key={cat}
              className={`text-[13px] font-bold whitespace-nowrap pb-2 px-1 transition-colors cursor-pointer ${
                i === 0
                  ? "text-slate-800 border-b-2 border-[#005faa]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Main List View */}
      {viewState === "list" && (
        <div className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-6 pb-24 max-w-5xl mx-auto w-full">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-[18px] text-slate-800 tracking-tight">
              USDC Exclusive
            </h3>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded">
              ARC MARKETPLACE
            </span>
          </div>

          {/* Hero Banner */}
          <div className="w-full h-36 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 relative overflow-hidden shadow-lg mb-4 cursor-pointer hover:shadow-xl transition-shadow">
            <div className="relative z-10">
              <h4 className="text-white font-bold text-[18px] leading-tight mb-2">
                Arc Paymaster Sale
                <br />
                <span className="text-blue-400">0 Gas Fees</span> on purchases
              </h4>
              <button className="bg-white text-slate-900 font-bold text-[12px] px-4 py-1.5 rounded-full hover:bg-slate-100 transition-colors">
                Shop Now
              </button>
            </div>
            <div className="absolute right-[-10px] bottom-[-20px] opacity-20 transform -rotate-12">
              <ShoppingBag size={120} className="text-white" strokeWidth={1} />
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
            {products.map((product, idx) => (
              <div
                key={product.id}
                onClick={() => handleProductSelect(product)}
                className="bg-white rounded-3xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 group cursor-pointer hover:shadow-md hover:border-slate-200 transition-all flex flex-col animate-in fade-in slide-in-from-bottom-[10px]"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div
                    className="absolute top-3 right-3 bg-white/90 backdrop-blur shadow-sm p-2 rounded-full hover:bg-white text-slate-400 hover:text-red-500 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Heart size={16} />
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    {product.category}
                  </span>
                  <h4 className="font-bold text-slate-800 text-[14px] mb-3 leading-snug">
                    {product.name}
                  </h4>
                  <div className="mt-auto">
                    <span className="font-black text-[18px] text-slate-900 block">
                      {product.price}{" "}
                      <span className="text-[12px] text-slate-500 font-semibold">
                        USDC
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Detail View */}
      {viewState === "detail" && (
        <div className="absolute inset-0 bg-white z-20 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="relative h-[45%] w-full bg-slate-100">
            <img
              src={selectedProduct?.image}
              alt={selectedProduct?.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-12 left-4 z-10 flex w-[calc(100%-2rem)] justify-between items-center">
              <button
                onClick={() => setViewState("list")}
                className="p-2.5 bg-white/80 backdrop-blur-md rounded-full shadow-md text-slate-800 hover:bg-white transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <button className="p-2.5 bg-white/80 backdrop-blur-md rounded-full shadow-md text-slate-800 hover:bg-white transition-colors">
                <Heart size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-t-[32px] -mt-8 relative z-10 p-6 flex flex-col shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-2">
              <span className="bg-slate-100 text-slate-800 text-[11px] px-2.5 py-1 rounded-full font-bold tracking-wide uppercase">
                {selectedProduct?.category}
              </span>
              <div className="flex items-center gap-1 text-slate-500 text-[12px] font-medium font-mono">
                <CheckCircle2 size={14} className="text-green-500" />
                Verified Merchant
              </div>
            </div>

            <h2 className="text-[28px] font-black text-slate-800 leading-tight mb-2 mt-2">
              {selectedProduct?.name}
            </h2>
            <div className="text-[24px] font-extrabold text-slate-800 mb-6">
              {selectedProduct?.price} USDC
            </div>

            <div className="mb-6">
              <h4 className="text-[14px] font-bold text-slate-800 mb-2">
                Description
              </h4>
              <p className="text-[14px] text-slate-500 leading-relaxed">
                {selectedProduct?.desc}
              </p>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100 flex items-center gap-4">
              <button
                onClick={handleCheckoutInit}
                className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <ShoppingBag size={18} /> Buy Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Bottom Sheet */}
      {viewState === "checkout" && (
        <div className="absolute inset-0 z-30 flex items-end animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => !isPurchasing && setViewState("detail")}
          ></div>
          <div className="bg-white w-full rounded-t-[32px] z-10 relative flex flex-col pt-6 pb-[40px] px-6 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
            <h3 className="font-bold text-[20px] text-slate-800 mb-6">
              Confirm Purchase
            </h3>

            <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6 items-center">
              <img
                src={selectedProduct?.image}
                alt="product"
                className="w-16 h-16 rounded-xl object-cover shadow-sm"
              />
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 text-[14px] mb-1">
                  {selectedProduct?.name}
                </h4>
                <span className="font-bold text-slate-800 text-[15px]">
                  {selectedProduct?.price} USDC
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-8 px-2">
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="font-bold text-slate-800">
                  {selectedProduct?.price} USDC
                </span>
              </div>
              <div className="flex justify-between items-center text-[14px]">
                <div className="flex flex-col">
                  <span className="text-slate-500 font-medium">
                    Platform Admin Fee (1.5%)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Menutupi biaya infrastruktur & Gas Station
                  </span>
                </div>
                <span className="font-bold text-slate-800">
                  {(Number(selectedProduct?.price) * 0.015).toFixed(2)} USDC
                </span>
              </div>
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-slate-500 font-medium">
                  Network Gas Fee (Arc)
                </span>
                <span className="font-bold text-[12px] bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase tracking-wider">
                  Free (Sponsored)
                </span>
              </div>
              <div className="w-full border-t border-dashed border-slate-200 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-800 font-bold text-[16px]">
                  Total Payment
                </span>
                <span className="font-black text-[22px] text-slate-800">
                  {(Number(selectedProduct?.price) * 1.015).toFixed(2)} USDC
                </span>
              </div>
            </div>

            <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex gap-3 mb-6 items-start">
              <Wallet size={20} className="text-slate-800 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-slate-800 text-[13px] mb-0.5">
                  Pay with Web3 Wallet
                </h5>
                <p className="text-[12px] text-slate-800/70 leading-relaxed">
                  Transactions are secured by Arc Testnet. Your current balance
                  is{" "}
                  <span className="font-bold text-slate-800">
                    {balance.toFixed(2)} USDC
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-start gap-3 mb-6">
              <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                <ShieldCheck size={18} className="text-slate-800" />
              </div>
              <div>
                <h4 className="text-[12px] font-bold text-slate-800">
                  Protected by Arc Protocol
                </h4>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  Transaksi dienkripsi secara end-to-end. Dana hanya diteruskan
                  ke merchant setelah verifikasi smart contract.
                </p>
              </div>
            </div>

            <button
              disabled={isPurchasing}
              onClick={handleConfirmPurchase}
              className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                isPurchasing
                  ? "bg-slate-800 text-white shadow-xl"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {isPurchasing ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                    <span className="text-[14px]">
                      {paymentStatus === "preparing" &&
                        "Preparing Arc Order..."}
                      {paymentStatus === "broadcasting" &&
                        "Broadcasting to Network..."}
                      {paymentStatus === "settling" &&
                        "Finalizing Settlement..."}
                    </span>
                  </div>
                  <div className="w-32 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-blue-400 transition-all duration-700 ${
                        paymentStatus === "preparing"
                          ? "w-1/4"
                          : paymentStatus === "broadcasting"
                            ? "w-2/3"
                            : "w-[95%]"
                      }`}
                    ></div>
                  </div>
                </div>
              ) : (
                <>Confirm & Pay</>
              )}
            </button>
          </div>
        </div>
      )}

      {showHapticFlash && (
        <div className="fixed inset-0 z-[1000] bg-emerald-400/20 pointer-events-none animate-in fade-in out-fade-out duration-300"></div>
      )}
    </div>
  );
}
