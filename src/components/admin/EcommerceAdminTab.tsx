import React, { useState, useEffect } from "react";
import { 
  ShoppingCart, 
  Split, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  FileCheck, 
  RefreshCw,
  Search,
  Lock,
  Unlock,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  User,
  CreditCard,
  Settings,
  Scale,
  Save,
  Percent
} from "lucide-react";
import { apiFetch } from "../../lib/api";

interface EcommerceOrder {
  id: string;
  buyer_id: string;
  seller_address: string;
  product_id: number;
  product_name: string;
  amount: number;
  status: string;
  memo: string;
  tx_hash: string;
  created_at: string;
}

export function EcommerceAdminTab() {
  const [orders, setOrders] = useState<EcommerceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const [feePercent, setFeePercent] = useState("5.0");
  const [fixedFee, setFixedFee] = useState("0.0");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const orderRes = await apiFetch("/api/ecommerce/admin/escrows");
      if (orderRes.ok) {
        const data = await orderRes.json();
        setOrders(data);
      }

      const configRes = await apiFetch("/api/admin/config");
      if (configRes.ok) {
        const config = await configRes.json();
        setFeePercent(config.ecommerceFeePercent || "5.0");
        setFixedFee(config.ecommerceFixedFee || "0.0");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateFees = async () => {
    setSaveLoading(true);
    try {
      const response = await apiFetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ecommerceFeePercent: feePercent,
          ecommerceFixedFee: fixedFee
        }),
      });

      if (response.ok) {
        alert("Fee settings updated successfully");
      } else {
        alert("Failed to update fees");
      }
    } catch (err) {
      alert("Error updating fees");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRelease = async (order: EcommerceOrder) => {
    if (!window.confirm(`Release ${order.amount} USDC to ${order.seller_address}?`)) return;
    
    setActionLoading(order.id);
    try {
      const response = await apiFetch("/api/ecommerce/release-escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          sellerAddress: order.seller_address,
          totalAmount: order.amount
        }),
      });

      if (response.ok) {
        await fetchOrders();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Release failed");
      }
    } catch (err) {
      alert("Network error occurred during release");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    const productName = o.product_name || "";
    const memo = o.memo || "";
    const sellerAddress = o.seller_address || "";

    const matchesSearch = productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          memo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sellerAddress.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ESCROWED": return "bg-blue-50 text-blue-600 border-blue-100";
      case "RELEASED": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "PENDING_ESCROW": return "bg-amber-50 text-amber-600 border-amber-100";
      default: return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  const totalVolume = orders.filter(o => o.status === "ESCROWED" || o.status === "RELEASED").reduce((sum, o) => sum + (o.amount || 0), 0).toFixed(2);
  const platformFees = (parseFloat(totalVolume) * (parseFloat(feePercent) / 100)).toFixed(2);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">E-Commerce & Escrow Management</h3>
          <button onClick={fetchOrders} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <RefreshCw size={16} className={`text-slate-600 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <p className="text-sm text-slate-500 max-w-2xl">
          Manage platform fees, monitor escrow contracts (split-payments), and oversee marketplace transactions. The Platform Treasury acts as the Escrow Agent holding funds until order fulfillment.
        </p>
      </div>

      {/* Stats Widget */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm overflow-hidden relative">
           <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50/50 rounded-bl-full -z-0"></div>
           <div className="relative z-10">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Transaction Volume</div>
              <div className="text-[20px] font-black text-slate-900 tracking-tight">
                {totalVolume} <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">USDC</span>
              </div>
           </div>
        </div>
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm overflow-hidden relative">
           <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50/50 rounded-bl-full -z-0"></div>
           <div className="relative z-10">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Service Fee Revenue ({feePercent}%)</div>
              <div className="text-[20px] font-black text-emerald-600 tracking-tight">
                {platformFees} <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">USDC</span>
              </div>
           </div>
        </div>
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm overflow-hidden relative">
           <div className="absolute top-0 right-0 w-16 h-16 bg-rose-50/50 rounded-bl-full -z-0"></div>
           <div className="relative z-10">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Disputed Escrows</div>
              <div className="text-[20px] font-black text-slate-900 tracking-tight">
                0 <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Orders</span>
              </div>
           </div>
        </div>
      </div>

      {/* Revenue Configuration Panel */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
           <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <Settings size={20} strokeWidth={2.5}/>
           </div>
           <div>
              <h4 className="text-[15px] font-black text-slate-900 tracking-tight leading-tight">Revenue & Fee Configuration</h4>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Control marketplace economics and network maintenance</p>
           </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-5">
              <div className="space-y-2">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Service Fee (%)</label>
                 <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                       <Percent size={14} strokeWidth={3}/>
                    </div>
                    <input 
                      type="number" 
                      step="0.1"
                      value={feePercent}
                      onChange={(e) => setFeePercent(e.target.value)}
                      placeholder="e.g. 5.0"
                      className="w-full pl-10 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                 </div>
                 <p className="text-[10px] font-medium text-slate-400 px-1 italic">
                    Dikenakan pada setiap penyelesaian transaksi e-commerce (Escrow Release). 
                 </p>
              </div>

              <div className="space-y-2">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Network Handling Fee (Fixed)</label>
                 <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                       <Scale size={14} strokeWidth={3}/>
                    </div>
                    <input 
                      type="number" 
                      step="0.01"
                      value={fixedFee}
                      onChange={(e) => setFixedFee(e.target.value)}
                      placeholder="e.g. 0.0"
                      className="w-full pl-10 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 uppercase">USDC</div>
                 </div>
                 <p className="text-[10px] font-medium text-slate-400 px-1 italic">
                    Biaya operasional tetap untuk manajemen gas/treasury on-chain.
                 </p>
              </div>
           </div>

           <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 h-full flex flex-col">
              <h5 className="text-[12px] font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <ShieldCheck size={14} className="text-emerald-500" />
                 Simulation Analysis
              </h5>
              <div className="space-y-3 flex-1">
                 <div className="flex justify-between items-center text-[13px]">
                    <span className="text-slate-500 font-medium">Estimated Commission per 100 USDC</span>
                    <span className="font-bold text-slate-900">{(100 * (parseFloat(feePercent) / 100) + parseFloat(fixedFee)).toFixed(2)} USDC</span>
                 </div>
                 <div className="flex justify-between items-center text-[13px]">
                    <span className="text-slate-500 font-medium">Merchant Share</span>
                    <span className="font-bold text-slate-900">{(100 - (100 * (parseFloat(feePercent) / 100) + parseFloat(fixedFee))).toFixed(2)} USDC</span>
                 </div>
                 <div className="pt-3 border-t border-slate-200 mt-2">
                    <div className="flex justify-between items-center text-[13px]">
                       <span className="text-slate-900 font-black">Net Platform Yield</span>
                       <span className="font-black text-emerald-600">{(parseFloat(feePercent) || 0)}% + {fixedFee} USDC</span>
                    </div>
                 </div>
              </div>
              
              <button 
                onClick={handleUpdateFees}
                disabled={saveLoading}
                className="mt-6 w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.1em] shadow-lg shadow-slate-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {saveLoading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Save size={16} />
                )}
                Save Configuration
              </button>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by ID, Seller, or Product..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
           </div>
           <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 overflow-x-auto">
              {["ALL", "ESCROWED", "RELEASED", "PENDING_ESCROW"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    filterStatus === status ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {status === "PENDING_ESCROW" ? "Incoming" : status}
                </button>
              ))}
           </div>
        </div>

        <div className="overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <div className="p-20 text-center">
              <Package size={40} className="mx-auto text-slate-100 mb-4" />
              <div className="text-slate-300 font-bold uppercase tracking-widest text-[11px]">No orders found matching criteria</div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order & Asset</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Participants</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                            <Package size={20} strokeWidth={2.5}/>
                         </div>
                         <div className="min-w-0">
                            <div className="text-[13.5px] font-bold text-slate-900 leading-tight mb-0.5 truncate max-w-[200px]">{order.product_name}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tight truncate max-w-[200px]">{order.memo}</div>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <div className="inline-flex flex-col items-center justify-center">
                          <span className="text-[15px] font-black text-slate-900 tracking-tight">{order.amount?.toFixed(2)}</span>
                          <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">USDC</span>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-[11px]">
                       <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                             <User size={12} className="text-slate-400"/>
                             <span className="font-bold text-slate-600 truncate max-w-[120px]" title={order.buyer_id}>{order.buyer_id?.slice(0, 8)}...</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                             <CreditCard size={12} className="text-slate-400"/>
                             <span className="font-mono text-slate-400 truncate max-w-[120px]" title={order.seller_address}>{order.seller_address?.slice(0, 8)}...</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${getStatusColor(order.status)}`}>
                          {order.status === "ESCROWED" && <Clock size={10} className="animate-pulse" />}
                          {order.status === "RELEASED" && <ShieldCheck size={10} />}
                          {order.status?.replace("_", " ")}
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       {order.status === "ESCROWED" ? (
                        <button 
                          onClick={() => handleRelease(order)}
                          disabled={!!actionLoading}
                          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-slate-100 active:scale-95 transition-all hover:bg-slate-800 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 ml-auto"
                        >
                           {actionLoading === order.id ? (
                             <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                           ) : <Unlock size={14} />}
                           Release
                        </button>
                       ) : order.status === "RELEASED" ? (
                        <div className="flex items-center justify-end gap-1.5 text-emerald-500">
                           <CheckCircle2 size={16} strokeWidth={3}/>
                           <span className="text-[11px] font-black uppercase tracking-widest">Settled</span>
                        </div>
                       ) : (
                         <div className="flex items-center justify-end gap-1.5 text-slate-300">
                            <AlertCircle size={14} />
                            <span className="text-[11px] font-bold uppercase tracking-widest">Verify</span>
                         </div>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
