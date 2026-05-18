/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import {
  LogOut,
  Mail,
  Settings,
  ChevronRight,
  Send,
  Receipt,
  PlusCircle,
  CreditCard,
  ArrowDownToLine,
  Globe,
  Nfc,
  Coins,
  QrCode,
  LayoutGrid,
  Home,
  Box,
  ShoppingBag,
  Award,
  Eye,
  EyeOff,
  Headphones,
  TrendingDown,
  TrendingUp,
  Wallet,
  Smartphone,
  ShieldCheck,
  CalendarDays,
  Percent,
  PlusCircle as PlusCircleIcon,
  Settings2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Zap,
  X,
  ArrowLeft,
  CalendarClock,
  Search,
  Star,
  UserPlus,
  Plus,
  Landmark,
  AtSign,
  CheckCircle2,
  Check,
  Edit3,
  Info,
  ArrowUpRight,
  HeadphonesIcon,
  LogIn,
  Bell,
  UserCircle,
  Lock,
  Shield,
  Fingerprint,
  RefreshCw,
  Key,
  CreditCard as CardIcon,
  FileText,
  Filter,
  Building2,
  Building,
  Circle,
  Copy,
  ArrowDownLeft,
  Calendar,
  Pencil
} from 'lucide-react';

export default function App() {
  const [viewState, setViewState] = useState<'splash' | 'password' | 'inputName' | 'home' | 'transfer' | 'newTransfer' | 'amountInput' | 'processing' | 'success' | 'settings' | 'inbox' | 'accountDetail' | 'instantAccess' | 'pusatNotifikasi' | 'namaPanggilan' | 'email' | 'manageFavorites'>('splash');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [transferAmount, setTransferAmount] = useState('0');
  const [showDepositWithdrawModal, setShowDepositWithdrawModal] = useState(false);
  const [showDepositOptions, setShowDepositOptions] = useState(false);
  const [showDepositResult, setShowDepositResult] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userName, setUserName] = useState('RAKYAN INUKERTAPATI');
  const [favoriteIds, setFavoriteIds] = useState(['transfer', 'pay', 'topup', 'emoney', 'deposit', 'fx', 'tap', 'request', 'qr_receive']);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // App mounted
  }, []);

  const startYRef = React.useRef(0);
  const currentYRef = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (closeFn: () => void) => {
    const diff = currentYRef.current - startYRef.current;
    if (diff > 50 && currentYRef.current !== 0) {
      closeFn();
    }
    startYRef.current = 0;
    currentYRef.current = 0;
  };

  return (
    <div className="bg-slate-900 min-h-screen sm:p-4 flex items-center justify-center">
      {/* Mobile Device Frame */}
      <div className="w-full max-w-[400px] h-[100dvh] sm:h-[850px] bg-slate-50 sm:rounded-[40px] relative shadow-2xl overflow-hidden flex flex-col border-[8px] border-slate-800">
        
        {viewState === 'splash' && (
          <LoginScreen onLogin={() => setViewState('password')} />
        )}
        
        {viewState === 'password' && (
          <PasswordScreen 
            onBack={() => setViewState('splash')} 
            onLogin={() => setViewState('home')} 
          />
        )}
        
        {viewState === 'settings' && (
          <SettingsScreen onBack={() => setViewState('home')} onInstantAccess={() => setViewState('instantAccess')} onPusatNotifikasi={() => setViewState('pusatNotifikasi')} onNamaPanggilan={() => setViewState('namaPanggilan')} onEmail={() => setViewState('email')} />
        )}
        
        {viewState === 'instantAccess' && (
          <InstantAccessScreen onBack={() => setViewState('settings')} />
        )}

        {viewState === 'pusatNotifikasi' && (
          <PusatNotifikasiScreen onBack={() => setViewState('settings')} />
        )}

        {viewState === 'namaPanggilan' && (
          <NamaPanggilanScreen onBack={() => setViewState('settings')} />
        )}

        {viewState === 'email' && (
          <EmailScreen onBack={() => setViewState('settings')} />
        )}
        
        {viewState === 'inbox' && (
          <InboxScreen onBack={() => setViewState('home')} />
        )}

        {viewState === 'accountDetail' && (
          <AccountDetailScreen 
            onBack={() => setViewState('home')} 
            onTransfer={() => setViewState('transfer')}
            onTopup={() => setShowDepositWithdrawModal(true)}
          />
        )}

        {viewState === 'manageFavorites' && (
          <ManageFavoritesScreen 
             onBack={() => setViewState('home')}
             initialFavorites={favoriteIds}
             onSave={(newFavorites) => {
               setFavoriteIds(newFavorites);
               setViewState('home');
               setShowToast(true);
               setTimeout(() => setShowToast(false), 3000);
             }}
          />
        )}
        
        {viewState === 'transfer' && (
          <TransferScreen 
            onBack={() => setViewState('home')} 
            onNewTransfer={() => setViewState('newTransfer')}
            onSelectContact={(contact) => {
              setSelectedContact(contact);
              setViewState('amountInput');
            }}
          />
        )}

        {viewState === 'newTransfer' && (
          <NewTransferScreen 
            onBack={() => setViewState('transfer')} 
            onSelectContact={(contact) => {
              setSelectedContact(contact);
              setViewState('amountInput');
            }}
          />
        )}

        {viewState === 'amountInput' && selectedContact && (
          <AmountInputScreen 
            contact={selectedContact} 
            onBack={() => setViewState('transfer')} 
            onNext={(amount) => {
              setTransferAmount(amount);
              setViewState('processing');
              setTimeout(() => {
                setViewState('success');
              }, 1500);
            }}
          />
        )}

        {viewState === 'processing' && (
          <div className="w-full h-full bg-black flex flex-col items-center justify-center relative z-50 animate-in fade-in duration-300">
             <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4">
                <div className="w-6 h-6 border-4 border-[#4f46e5] border-t-transparent rounded-full animate-spin"></div>
             </div>
          </div>
        )}

        {viewState === 'success' && selectedContact && (
          <SuccessScreen 
            contact={selectedContact} 
            amount={transferAmount} 
            onClose={() => setViewState('home')} 
          />
        )}

        {viewState === 'home' && (
          <>
        {/* Toast Notification */}
        {showToast && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
            <div className="bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <CheckCircle2 size={16} className="text-white shrink-0 fill-emerald-400" />
              <span className="text-[13px] font-bold">Pengaturan berhasil disimpan.</span>
            </div>
          </div>
        )}

        {/* Top Header - Light Blue */}
        <header className="bg-[#6366f1] text-white px-5 pt-12 pb-16 flex justify-between items-start rounded-b-[32px] z-10 shrink-0">
          <div className="flex items-center gap-3 cursor-pointer">
             <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-[#6366f1] font-bold text-lg shadow-sm uppercase">
                {userName ? userName.slice(0, 2) : "UN"}
             </div>
             <div className="flex flex-col">
                <h1 className="font-bold text-[15px] tracking-wide relative after:content-[''] after:absolute after:right-[-20px] after:top-0 after:bottom-0 after:w-8 after:bg-gradient-to-r after:from-transparent after:to-[#6366f1]">
                   {userName ? (userName.length > 18 ? userName.slice(0, 15) + '...' : userName).toUpperCase() : 'USER NAME'}
                </h1>
                <div className="flex items-center gap-1 mt-0.5 hover:opacity-80 transition-opacity">
                   <span className="text-yellow-300 font-bold text-xs tracking-wide">521</span>
                   <span className="text-xs font-semibold italic text-white/90">Arc Points</span>
                   <ChevronRight size={12} className="text-white/80" />
                </div>
             </div>
          </div>
          <div className="flex gap-4 items-center">
            <button className="hover:opacity-80 transition-opacity relative" onClick={() => setViewState('inbox')}>
              <Mail size={22} className="text-white" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-[1.5px] border-[#6366f1]"></span>
            </button>
            <button className="hover:opacity-80 transition-opacity" onClick={() => setViewState('settings')}>
              <Settings size={22} className="text-white" />
            </button>
            <button className="hover:opacity-80 transition-opacity" onClick={() => setShowLogoutConfirm(true)}>
              <LogOut size={22} className="text-white" />
            </button>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto pb-28 -mt-8 pt-0 scrollbar-hide z-20">
          
          {/* Accounts Section */}
          <section className="bg-white rounded-[24px] p-5 shadow-sm mb-4 mx-4 border border-blue-50/50">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Accounts</h2>
              <div className="flex items-center gap-4 text-[#6366f1] text-[12px] font-semibold">
                <button className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                  Balance <EyeOff size={14} />
                </button>
                <button className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                  Manage <Settings2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex overflow-x-auto gap-6 pt-1 pb-3 mb-4 scrollbar-hide text-[12px] font-medium border-b border-slate-100">
              {[
                { name: 'My Wallet', icon: <Wallet size={20} /> },
                { name: 'E-commerce', icon: <ShoppingBag size={20} /> },
                { name: 'Subscriptions', icon: <RefreshCw size={20} /> },
                { name: 'History', icon: <CalendarClock size={20} /> }
              ].map((tab, i) => (
                <div key={tab.name} className={`px-1 pb-2 flex flex-col items-center gap-1.5 whitespace-nowrap min-w-max cursor-pointer transition-colors ${
                  i === 0 
                  ? 'text-[#10b981] border-b-[3px] border-[#10b981] font-bold' 
                  : 'text-slate-500 hover:text-slate-800 border-b-[3px] border-transparent hover:border-slate-300'
                }`}>
                  {tab.icon}
                  <span>{tab.name}</span>
                </div>
              ))}
            </div>
            
            {/* Tabungan NOW Card */}
            <div 
               className="bg-gradient-to-r from-blue-50 to-white border border-slate-100 rounded-xl p-4 text-slate-800 shadow-sm relative overflow-hidden mb-3 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
               onClick={() => setViewState('accountDetail')}
            >
              <div className="flex justify-between items-start z-10 relative">
                <div>
                  <h3 className="font-semibold text-[15px] text-slate-700">USDC Savings</h3>
                  <div className="flex items-center mt-1 gap-2">
                    <p className="text-2xl font-bold tracking-tight text-slate-900">1,500.00 <span className="text-base font-semibold text-slate-500">USDC</span></p>
                  </div>
                </div>
                {/* Simulated Card Artwork */}
                <div className="w-20 h-12 bg-white rounded-md flex items-center justify-center overflow-hidden border border-slate-200">
                   <div className="w-full h-full bg-orange-100 relative">
                      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1614031679233-a3d8b2d184eb?q=80&w=150&auto=format&fit=crop')" }}></div>
                      <div className="absolute top-1 right-1 px-1 bg-white/80 rounded-[2px]">
                         <span className="text-[6px] font-bold text-blue-800">arc</span>
                      </div>
                      <div className="absolute bottom-1 right-1">
                         <span className="text-[7px] font-bold text-white drop-shadow-md">VISA</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>
            
            <button className="w-full text-center text-[#6366f1] text-[12px] font-bold mt-1 py-1.5 hover:bg-indigo-50 rounded-lg transition-colors flex justify-center items-center gap-1.5 opacity-90">
              Other Personal Savings & Checking <PlusCircleIcon size={14} />
            </button>
          </section>

          {/* Favorite Transactions Section */}
          <section className="bg-white rounded-[24px] p-5 shadow-sm mb-4 mx-4">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Favorite Transactions</h2>
              <button 
                onClick={() => setViewState('manageFavorites')}
                className="text-[#6366f1] text-[12px] font-semibold flex items-center gap-1 hover:text-indigo-600 transition-colors"
              >
                Manage <Settings2 size={14} strokeWidth={1.5} />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-y-7 gap-x-2">
              {favoriteIds.map(id => {
                const item = ALL_TRANSACTION_MENUS.find(m => m.id === id);
                if (!item) return null;
                return (
                  <MenuIcon 
                    key={item.id}
                    icon={item.icon} 
                    label={item.label} 
                    color={item.color} 
                    badge={item.badge}
                    badgeColor={item.badgeColor}
                    bgCircle={item.bgCircle}
                    isTextIcon={item.isTextIcon}
                    textIcon={item.textIcon}
                    onClick={() => {
                      if (item.id === 'transfer') setViewState('transfer');
                      else if (item.id === 'deposit') setShowDepositWithdrawModal(true);
                    }} 
                  />
                );
              })}
              <MenuIcon icon={<LayoutGrid size={24} />} label="View All" color="text-blue-400" />
            </div>

            <div className="mt-6 bg-indigo-50/70 py-3 px-4 rounded-xl flex items-center justify-center gap-3 border border-blue-100 relative">
               {/* Tooltip triangle */}
               <div className="absolute -top-2 right-10 w-4 h-4 bg-indigo-50/70 border-l border-t border-blue-100 rotate-45"></div>
               <Headphones size={18} className="text-[#6366f1]" />
               <span className="text-[13px] font-semibold text-[#6366f1]">Use Arc Web3 Support</span>
            </div>
          </section>

          {/* Special For You (Promo Banner) */}
          <section className="bg-white rounded-[24px] overflow-hidden shadow-sm mb-4 mx-4 pb-4 border border-x-transparent border-t-transparent border-b-slate-50">
            <div className="px-5 pt-5 pb-3">
              <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Special For You</h2>
            </div>
            <div className="flex overflow-x-auto gap-4 px-5 scrollbar-hide snap-x">
              <div className="min-w-[280px] h-[140px] bg-gradient-to-r from-blue-700 to-blue-800 rounded-2xl p-4 snap-center relative overflow-hidden text-white flex flex-col justify-center shadow-inner">
                <div className="absolute right-0 top-0 h-full w-1/2 bg-[url('https://images.unsplash.com/photo-1556740714-a82f3a479426?q=80&w=150&auto=format&fit=crop')] bg-cover mix-blend-overlay opacity-30"></div>
                <h3 className="font-bold text-[15px] leading-tight w-2/3 relative z-10">Opening a Checking Account is Easier...</h3>
                <button className="mt-3 bg-white text-[#4338ca] text-xs font-bold px-3 py-1.5 rounded-lg w-max relative z-10">Open Now</button>
              </div>
              <div className="min-w-[280px] h-[140px] bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 snap-center relative overflow-hidden text-white flex flex-col justify-center shadow-inner">
                <h3 className="font-bold text-[15px] leading-tight w-2/3 relative z-10">Disburse Loan Up To Rp 50 Million</h3>
                <button className="mt-3 bg-white text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-lg w-max relative z-10">Check Limit</button>
              </div>
            </div>
            {/* Pagination dots */}
            <div className="flex justify-center gap-1.5 mt-4">
              <div className="w-5 h-1.5 bg-[#6366f1] rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
            </div>
          </section>

          {/* e-Wallet */}
          <section className="bg-white rounded-[24px] p-5 shadow-sm mb-4 mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">e-Wallet</h2>
              <button className="text-[#6366f1] text-sm font-semibold">Connect <ChevronRight size={14} className="inline -mt-0.5" /></button>
            </div>
            <div className="flex justify-between gap-2 overflow-x-auto scrollbar-hide py-1">
              {['ShopeePay', 'LinkAja', 'DANA', 'GoPay', 'OVO'].map((wallet, i) => (
                <div key={wallet} className="flex flex-col items-center gap-2 min-w-[64px]">
                  <div className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center shadow-sm bg-white">
                    <Wallet className={`size-6 ${
                      i === 0 ? 'text-orange-500' :
                      i === 1 ? 'text-red-600' :
                      i === 2 ? 'text-indigo-500' :
                      i === 3 ? 'text-green-500' :
                      'text-purple-600'
                    }`} />
                  </div>
                  <span className="text-[11px] font-medium text-slate-600">{wallet}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Direct Stock Investment Here */}
          <section className="bg-white rounded-[24px] p-5 shadow-sm mx-4 mb-4">
            <div className="mb-4">
              <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Direct Stock Investment Here</h2>
              <p className="text-xs text-slate-400 mt-1">Last updated 18 May 2026 10:23:59 WIB</p>
            </div>
            
            <div className="flex items-center gap-2 mb-4 text-[#6366f1] font-bold text-sm bg-indigo-50 px-3 py-1.5 rounded-lg w-fit">
              <TrendingUp size={16} /> Top Value
            </div>

            <div className="flex flex-col gap-4">
              <StockRow code="ARCN" name="ArcOn Protocol" price="4,110" change="90" percent="-2.14%" isDown />
              <StockRow code="BBCA" name="Bank Central Asia Tbk" price="5,900" change="200" percent="-3.28%" isDown />
              <StockRow code="BBRI" name="Bank Rakyat Indonesia (Persero) Tbk" price="3,020" change="100" percent="-3.21%" isDown />
              <StockRow code="ANTM" name="Aneka Tambang Tbk." price="3,110" change="390" percent="-11.14%" isDown />
              <StockRow code="BUMI" name="Bumi Resources Tbk" price="204" change="10" percent="-4.67%" isDown />
            </div>
            
            <p className="text-[10px] text-slate-400 mt-5 leading-relaxed bg-slate-50 p-2 rounded-lg">
              ArcOn through Circle API has obtained permission from the Indonesia Stock Exchange to display the above data.
            </p>
          </section>

          {/* Selected Products */}
          <section className="bg-white rounded-[24px] p-5 shadow-sm mx-4 mb-8">
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight mb-4">Selected Products</h2>
            <div className="grid grid-cols-2 gap-3">
              <ProductCard title="Cash Back Loan" desc="Deposit-backed Credit Loan." icon={<Wallet size={20} className="text-indigo-500" />} />
              <ProductCard title="Mortgage" desc="Dream house with competitive interest." icon={<Percent size={20} className="text-indigo-500" />} />
              <ProductCard title="Vehicle Loan" desc="Light installments for your dream vehicle." icon={<Smartphone size={20} className="text-indigo-500" />} />
              <ProductCard title="Next-G Savings" desc="Share access with children or relatives." icon={<CalendarDays size={20} className="text-indigo-500" />} />
            </div>
          </section>

        </div>

        {/* Bottom Navigation */}
        <nav className="bg-white/95 backdrop-blur-md border-t border-slate-100 flex justify-between items-end px-5 pb-5 pt-3 absolute bottom-0 w-full z-30 rounded-b-[32px] sm:rounded-b-[40px] shadow-[0_-15px_30px_rgba(0,0,0,0.05)]">
          <NavItem icon={<Home size={22} />} label="Home" active />
          <NavItem icon={<Box size={22} />} label="Products" />
          
          {/* Main QRIS Button - Restyled based on reference */}
          <div className="flex flex-col items-center justify-center -mt-6 relative z-40 px-3 cursor-pointer group">
            <div className="bg-[#6366f1] w-[64px] h-[64px] rounded-[18px] text-white flex flex-col justify-center items-center shadow-lg transform group-hover:-translate-y-1 transition-all duration-300">
               <span className="text-[9px] font-medium tracking-wide mb-0.5 opacity-80">Pay/Scan</span>
               <QrCode size={28} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold text-[#6366f1] mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">QRIS</span>
          </div>
          
          <NavItem icon={<ShoppingBag size={22} />} label="Services" />
          <NavItem icon={<Award size={22} />} label="Loyalty" />
        </nav>

       {/* Deposit/Withdraw Initial Modal */}
       {showDepositWithdrawModal && (
         <div className="absolute inset-0 z-20 flex items-end animate-in fade-in duration-200">
           <div className="absolute inset-0 bg-slate-900/40" onClick={() => setShowDepositWithdrawModal(false)}></div>
           <div 
             className="bg-white w-full rounded-t-[32px] z-10 relative flex flex-col pt-6 pb-[100px] px-6 animate-in slide-in-from-bottom duration-300"
             onTouchStart={handleTouchStart}
             onTouchMove={handleTouchMove}
             onTouchEnd={() => handleTouchEnd(() => setShowDepositWithdrawModal(false))}
           >
             <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 absolute top-3 left-1/2 -translate-x-1/2 cursor-grab"></div>
             <h3 className="font-bold text-[16px] text-center text-slate-800 mb-6 mt-2">Pilih metode deposit</h3>
             
             <div className="flex flex-col gap-1">
               <button 
                 className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all text-left"
                 onClick={() => {
                   setShowDepositWithdrawModal(false);
                   setShowDepositOptions(true);
                 }}
               >
                  <div className="w-8 h-8 rounded-full border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <ArrowDownToLine size={16} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[14px] text-slate-800">Deposit Kripto</h4>
                    <p className="text-[12px] text-slate-500 mt-0.5">Transfer kripto dari wallet on-chain atau bursa.</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
               </button>

               <button 
                 className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all text-left"
                 onClick={() => {
                   setShowDepositWithdrawModal(false);
                 }}
               >
                  <div className="w-8 h-8 rounded-full border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <ArrowUpRight size={16} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[14px] text-slate-800">Tarik / Withdraw</h4>
                    <p className="text-[12px] text-slate-500 mt-0.5">Transfer dana ke dompet pribadi Anda.</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Deposit Options Modal */}
       {showDepositOptions && (
         <div className="absolute inset-0 z-20 flex items-end animate-in fade-in duration-200">
           <div className="absolute inset-0 bg-slate-900/40" onClick={() => setShowDepositOptions(false)}></div>
           <div 
             className="bg-white w-full rounded-t-[32px] z-10 relative flex flex-col pt-6 pb-[90px] animate-in slide-in-from-bottom duration-300 h-[70%]"
             onTouchStart={handleTouchStart}
             onTouchMove={handleTouchMove}
             onTouchEnd={() => handleTouchEnd(() => setShowDepositOptions(false))}
           >
             <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2 absolute top-3 left-1/2 -translate-x-1/2 cursor-grab"></div>
             
             <div className="px-6 flex justify-center items-center mb-4 mt-2 relative">
                <h3 className="font-bold text-[16px] text-slate-800">Cari</h3>
                <button onClick={() => setShowDepositOptions(false)} className="absolute right-6 p-1 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200">
                  <X size={20} className="text-slate-500" strokeWidth={2.5} />
                </button>
             </div>

             <div className="px-6 mb-4">
               <div className="bg-slate-100/80 rounded-[12px] flex items-center px-4 py-2.5">
                  <Search size={18} className="text-slate-500 mr-2 shrink-0" />
                  <input type="text" placeholder="Cari" className="bg-transparent border-none outline-none text-[14px] w-full text-slate-800" readOnly />
               </div>
             </div>

             <div className="flex-1 overflow-y-auto w-full pb-6 scrollbar-hide px-2">
               <div className="px-4 mb-2">
                  <span className="text-[13px] font-bold text-slate-800">Terbaru</span>
               </div>
               
               <div className="flex gap-2 px-4 mb-6">
                  <button 
                     className="bg-slate-50 border border-slate-200 rounded-[16px] py-1.5 px-3 flex items-center gap-1.5 active:bg-slate-100 transition-colors"
                     onClick={() => {
                        setShowDepositOptions(false);
                        setShowDepositResult(true);
                     }}
                  >
                     <div className="w-5 h-5 rounded-full bg-[#4f46e5] flex items-center justify-center text-white text-[8px] font-bold">USDC</div>
                     <span className="text-[13px] font-bold text-slate-700">USDC</span>
                  </button>
               </div>
               
               <div className="px-4 mb-2">
                  <span className="text-[13px] font-bold text-slate-800">Populer</span>
               </div>

               <div className="flex flex-col">
                 <button 
                   className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-all text-left group"
                   onClick={() => {
                     setShowDepositOptions(false);
                     setShowDepositResult(true);
                   }}
                 >
                   <div className="w-8 h-8 rounded-full bg-[#4f46e5] flex items-center justify-center font-bold text-white text-[10px] shadow-sm shrink-0">
                     USDC
                   </div>
                   <div className="flex-1">
                     <h4 className="font-bold text-[14px] text-slate-800">USDC</h4>
                     <p className="text-[12px] text-slate-500 mt-0.5">USD Coin</p>
                   </div>
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Deposit QR Modal View */}
       {showDepositResult && (
         <DepositQRScreen onBack={() => setShowDepositResult(false)} />
       )}

       {/* Logout Confirmation Modal */}
       {showLogoutConfirm && (
         <div className="absolute inset-0 z-[100] flex items-end animate-in fade-in duration-200">
           <div className="absolute inset-0 bg-slate-900/60" onClick={() => setShowLogoutConfirm(false)}></div>
           <div className="bg-white w-full rounded-t-[24px] z-10 relative flex flex-col pt-6 pb-8 px-6 animate-in slide-in-from-bottom duration-300">
             <div className="flex justify-between items-center mb-4 mt-2">
                <h3 className="font-bold text-[20px] text-slate-800">Ingin log out?</h3>
                <button onClick={() => setShowLogoutConfirm(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200">
                  <X size={22} className="text-slate-500" strokeWidth={2.5} />
                </button>
             </div>
             
             <p className="text-slate-600 text-[14px] leading-relaxed mb-8">
               Pastikan semua aktivitas sudah selesai, ya. Terima kasih telah mengakses ArcOn hari ini.
             </p>
             
             <button 
               className="w-full bg-[#4f46e5] text-white font-bold text-[16px] py-3.5 rounded-full shadow-[0_4px_14px_rgba(0,143,205,0.3)] hover:bg-[#3730a3] active:scale-[0.98] transition-all"
               onClick={() => {
                 setShowLogoutConfirm(false);
                 setViewState('splash');
               }}
             >
               Log Out
             </button>
           </div>
         </div>
       )}

          </>
        )}
      </div>
    </div>
  );
}

// Subcomponents

import { PasswordScreen } from './components/screens/PasswordScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { TransferScreen } from './components/screens/TransferScreen';
import { AmountInputScreen } from './components/screens/AmountInputScreen';
import { NewTransferScreen } from './components/screens/NewTransferScreen';
import { SuccessScreen } from './components/screens/SuccessScreen';
import { AccountDetailScreen } from './components/screens/AccountDetailScreen';

import { SettingsScreen } from './components/screens/SettingsScreen';
import { DepositQRScreen } from './components/screens/DepositQRScreen';
import { InboxScreen } from './components/screens/InboxScreen';
import { InstantAccessScreen } from './components/screens/InstantAccessScreen';
import { PusatNotifikasiScreen } from './components/screens/PusatNotifikasiScreen';
import { NamaPanggilanScreen } from './components/screens/NamaPanggilanScreen';
import { EmailScreen } from './components/screens/EmailScreen';
import { ManageFavoritesScreen } from './components/screens/ManageFavoritesScreen';
import { ALL_TRANSACTION_MENUS } from './data/favoriteTransactions';

function MenuIcon({ icon, label, color, badge, bgCircle, badgeColor = "bg-green-500", isTextIcon = false, textIcon = "", onClick }: { 
  key?: React.Key,
  icon: React.ReactNode, 
  label: string, 
  color: string, 
  badge?: string,
  bgCircle?: string,
  badgeColor?: string,
  isTextIcon?: boolean,
  textIcon?: string,
  onClick?: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer group relative" onClick={onClick}>
      <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm
        ${bgCircle ? bgCircle : 'bg-slate-50 border border-slate-100'} 
        ${color}
      `}>
        {isTextIcon ? (
           <span className={`font-black text-sm italic ${color}`}>{textIcon}</span>
        ) : icon}
      </div>
      {badge && (
        <span className={`absolute -top-1 right-0 ${badgeColor} text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-10 border border-white`}>
          {badge}
        </span>
      )}
      <span className="text-[11px] font-medium text-slate-600 text-center leading-[1.1] max-w-[64px]">
        {label}
      </span>
    </div>
  );
}

function StockRow({ code, name, price, change, percent, isDown }: { code: string, name: string, price: string, change: string, percent: string, isDown: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-lg -mx-2 px-2 transition-colors cursor-pointer">
      <div className="flex gap-3 items-center">
        <div className="w-8 h-8 rounded-full bg-indigo-50 text-[#6366f1] flex justify-center items-center text-xs font-bold border border-blue-100">
           {code.substring(0, 1)}
        </div>
        <div>
          <h4 className="font-bold text-slate-800 text-[15px]">{code}</h4>
          <p className="text-[11px] text-slate-500 max-w-[120px] truncate">{name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-slate-800 text-[15px]">{price}</p>
        <p className={`text-[12px] font-semibold flex items-center justify-end gap-1 ${isDown ? 'text-red-500' : 'text-green-500'}`}>
          {isDown ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
          {change} ({percent})
        </p>
      </div>
    </div>
  );
}

function ProductCard({ title, desc, icon }: { title: string, desc: string, icon: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 relative overflow-hidden group cursor-pointer hover:bg-indigo-50 hover:border-blue-100 transition-colors">
      <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center shadow-sm mb-3">
         {icon}
      </div>
      <h3 className="font-bold text-slate-800 text-[13px] mb-1">{title}</h3>
      <p className="text-[11px] text-slate-500 leading-snug">{desc}</p>
      
      <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-blue-100/50 rounded-full blur-xl group-hover:bg-blue-200/50 transition-colors"></div>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 cursor-pointer transition-colors w-14 ${active ? 'text-[#6366f1]' : 'text-slate-400 hover:text-slate-600'}`}>
      <div className={`${active ? '-translate-y-0.5' : ''} transition-transform`}>
        {icon}
      </div>
      <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </div>
  );
}

