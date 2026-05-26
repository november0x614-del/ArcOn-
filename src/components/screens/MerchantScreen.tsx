import React, { useState } from 'react';
import { ArrowLeft, Box, PlusCircle, BarChart3, Settings, MoreVertical, Search, Wallet, TrendingUp, Tags, Download, Eye, ExternalLink } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface MerchantScreenProps {
  onBack: () => void;
}

export function MerchantScreen({ onBack }: MerchantScreenProps) {
  const { registeredUser } = useApp();
  const address = registeredUser?.walletAddress || "No Wallet Created Yet";
  const [activeTab, setActiveTab] = useState<'products' | 'dashboard' | 'settings'>('products');
  
  const [products] = useState([
    { id: 1, name: 'Spotify Premium (1M)', price: 4.5, stock: 120, image: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&q=80&w=200&h=200', category: 'Subscription', sales: 45 },
    { id: 2, name: 'MLBB 500 Diamonds', price: 8.9, stock: 50, image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=200&h=200', category: 'Game Voucher', sales: 128 },
    { id: 3, name: 'Netflix Voucher $15', price: 15.0, stock: 25, image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=200&h=200', category: 'Entertainment', sales: 22 },
  ]);

  const [recentSales] = useState([
    { id: 'tx-881', product: 'Spotify Premium', amount: 4.5, fee: 0.07, status: 'Settled', time: '10m ago', buyer: '0x7A...2b' },
    { id: 'tx-882', product: 'MLBB 500 Diamonds', amount: 8.9, fee: 0.13, status: 'Escrowed', time: 'Just now', buyer: '0x3B...9f' },
  ]);

  return (
    <div className="w-full h-full bg-[#FAFAFA] relative flex flex-col z-40 animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm relative z-10 w-full flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors -ml-2 bg-transparent border-0 text-slate-800">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-[18px] font-extrabold text-slate-900 tracking-tight leading-tight">Arc Merchant</h1>
            <p className="text-[12px] text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-0.5">Verified Partner</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
            <img src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=100&h=100" alt="avatar" className="w-full h-full object-cover" />
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="flex px-2 bg-white border-b border-slate-100 shrink-0 shadow-sm relative z-10">
        <button 
          className={`flex-1 py-3.5 text-[13px] font-bold border-b-[3px] transition-colors bg-transparent ${activeTab === 'products' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
          onClick={() => setActiveTab('products')}
        >
          <div className="flex items-center justify-center gap-2">
            <Box size={16} /> Products
          </div>
        </button>
        <button 
          className={`flex-1 py-3.5 text-[13px] font-bold border-b-[3px] transition-colors bg-transparent ${activeTab === 'dashboard' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="flex items-center justify-center gap-2">
            <BarChart3 size={16} /> Dashboard
          </div>
        </button>
        <button 
          className={`flex-1 py-3.5 text-[13px] font-bold border-b-[3px] transition-colors bg-transparent ${activeTab === 'settings' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
          onClick={() => setActiveTab('settings')}
        >
          <div className="flex items-center justify-center gap-2">
            <Settings size={16} /> Settings
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full pb-6 scrollbar-hide flex flex-col p-4 content-body">
        
        {activeTab === 'products' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
              <div className="relative flex-1 mr-3">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input type="text" placeholder="Search inventory..." className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-[13px] font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm" />
              </div>
              <button className="flex items-center justify-center gap-1.5 text-[13px] font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 shrink-0 whitespace-nowrap">
                <PlusCircle size={16} /> Add 
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              {products.map((product, idx) => (
                <div key={product.id} className="bg-white p-3 rounded-[20px] border border-slate-100 flex items-center shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow group animate-in slide-in-from-bottom-[10px]" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="w-[80px] h-[80px] rounded-[14px] overflow-hidden shrink-0 bg-slate-100 relative shadow-inner">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {!product.active && (
                       <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                         <span className="text-[9px] font-black tracking-wider bg-slate-800 text-white px-2 py-1 rounded">INACTIVE</span>
                       </div>
                    )}
                  </div>
                  
                  <div className="ml-3.5 flex-1 py-1 flex flex-col h-full justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-[14px] leading-tight mb-1">{product.name}</h3>
                      <p className="text-[14px] font-black text-slate-900">{product.price} <span className="text-[11px] font-semibold text-slate-500">USDC</span></p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                       <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${product.stock < 10 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                         <Box size={10} /> {product.stock} in stock
                       </span>
                       <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          <TrendingUp size={10} /> {product.sales} sold
                       </span>
                    </div>
                  </div>
                  
                  <button className="p-2 ml-2 text-slate-400 hover:text-slate-800 bg-transparent border-0 rounded-full hover:bg-slate-50 transition-colors self-start">
                    <MoreVertical size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in duration-300 flex flex-col gap-4">
            
            <div className="bg-slate-900 rounded-[24px] p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                 <Wallet size={120} strokeWidth={1} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[13px] font-medium text-slate-400 flex items-center gap-1.5"><TrendingUp size={14} className="text-emerald-400" /> Total Revenue (30d)</h3>
                  <button className="bg-white/10 p-1.5 rounded-lg hover:bg-white/20 transition-colors"><Download size={14} className="text-white" /></button>
                </div>
                <div className="flex items-baseline gap-2 mb-6">
                  <p className="text-[40px] font-black tracking-tight leading-none">1,240</p>
                  <span className="text-[18px] font-bold text-slate-400">USDC</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/10 backdrop-blur-sm">
                    <p className="text-[11px] text-slate-400 mb-1 flex items-center gap-1"><Tags size={12} /> Orders</p>
                    <p className="text-[18px] font-bold">24 <span className="text-[11px] text-emerald-400 font-medium ml-1">+12%</span></p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/10 backdrop-blur-sm">
                    <p className="text-[11px] text-slate-400 mb-1 flex items-center gap-1"><Eye size={12} /> Store Views</p>
                    <p className="text-[18px] font-bold">1,892 <span className="text-[11px] text-emerald-400 font-medium ml-1">+5%</span></p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-slate-800 text-[15px]">Recent Sales</h3>
                 <button className="text-[12px] font-bold text-slate-800 hover:text-blue-700 bg-transparent border-0 p-0">View All</button>
               </div>
               
               <div className="flex flex-col gap-4">
                 {recentSales.map((sale) => (
                   <div key={sale.id}>
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className={`w-[42px] h-[42px] rounded-xl flex items-center justify-center font-bold text-[11px] border shadow-sm ${sale.status === 'Escrowed' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                           {sale.buyer.substring(0, 4)}
                         </div>
                         <div>
                           <p className="font-bold text-[14px] text-slate-800 mb-0.5">{sale.product}</p>
                           <div className="flex items-center gap-2">
                             <p className="text-[11px] font-medium text-slate-500">{sale.time}</p>
                             <span className="text-[10px] text-slate-300">•</span>
                             <p className="text-[11px] font-bold text-slate-600">Fee: {sale.fee} USDC</p>
                           </div>
                         </div>
                       </div>
                       <div className="text-right">
                         <span className="font-bold text-[15px] text-slate-900 block">+{sale.amount} USDC</span>
                         <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                           sale.status === 'Escrowed' 
                             ? 'bg-orange-100 text-orange-700 animate-pulse' 
                             : 'bg-emerald-100 text-emerald-700'
                         }`}>
                           {sale.status}
                         </span>
                       </div>
                     </div>
                     {sale.status === 'Escrowed' && (
                       <button className="w-full mt-3 py-2 bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-sm hover:bg-slate-800 transition-all active:scale-95 border-0">
                         Finalize Arc Settlement (Release Funds)
                       </button>
                     )}
                     <div className="w-full h-[1px] bg-slate-50 mt-4 last:hidden"></div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-in fade-in duration-300 flex flex-col gap-4">
            <div className="bg-white rounded-[24px] border border-slate-100 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-50 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-[15px] mb-1">Store Profile</h3>
                <p className="text-[12px] text-slate-500">Manage your merchant identity and preferences</p>
              </div>
              
              <div className="p-5 flex flex-col gap-5">
                <div>
                  <label className="text-[12px] font-bold text-slate-700 block mb-2 uppercase tracking-wide">Store Name</label>
                  <input type="text" defaultValue="Arc Genesis Store" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-inner" />
                </div>
                <div>
                   <div className="flex items-center justify-between mb-2">
                     <label className="text-[12px] font-bold text-slate-700 block uppercase tracking-wide">Settlement Wallet (Arc L1)</label>
                     <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">CONNECTED</span>
                   </div>
                   <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 shadow-inner">
                     <span className="text-[13px] font-mono font-medium text-slate-600 truncate flex-1 leading-none">{address}</span>
                     <ExternalLink size={14} className="text-slate-400 ml-2 shrink-0" />
                   </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                   <div>
                      <h4 className="font-bold text-[13px] text-slate-800">Accept Auto-Settlement</h4>
                      <p className="text-[11px] text-slate-500">Automatically convert to local currency</p>
                   </div>
                   <div className="w-10 h-6 bg-slate-200 rounded-full relative cursor-pointer shadow-inner">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                   </div>
                </div>
                
                <button className="w-full bg-slate-900 text-white font-bold text-[14px] py-3.5 rounded-xl mt-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95 border-0">
                  Save Changes
                </button>
              </div>
            </div>
            
            <button className="w-full max-w-xs mx-auto py-3 text-[13px] font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
               Disconnect Store
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
