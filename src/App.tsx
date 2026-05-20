/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { ManageFavoritesScreen, defaultSelectedShortcuts, defaultAvailableShortcuts, ShortcutItem } from './components/screens/ManageFavoritesScreen';
import { ConnectEWalletScreen } from './components/screens/ConnectEWalletScreen';
import { PasswordScreen } from './components/screens/PasswordScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { RegisterWeb3Screen } from './components/screens/RegisterWeb3Screen';
import { RegisterSuccessScreen } from './components/screens/RegisterSuccessScreen';
import { TopUpScreen } from './components/screens/TopUpScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { InstantAccessScreen } from './components/screens/InstantAccessScreen';
import { PusatNotifikasiScreen } from './components/screens/PusatNotifikasiScreen';
import { NamaPanggilanScreen } from './components/screens/NamaPanggilanScreen';
import { EmailScreen } from './components/screens/EmailScreen';
import { OtherAccountsScreen } from './components/screens/OtherAccountsScreen';
import { BayarVAScreen } from './components/screens/BayarVAScreen';
import { EcommerceScreen } from './components/screens/EcommerceScreen';
import { SwapScreen } from './components/screens/SwapScreen';
import { InboxScreen } from './components/screens/InboxScreen';
import { AccountDetailScreen } from './components/screens/AccountDetailScreen';
import { DepositQRScreen } from './components/screens/DepositQRScreen';
import { SuccessScreen } from './components/screens/SuccessScreen';
import { AmountInputScreen } from './components/screens/AmountInputScreen';
import { NewTransferScreen } from './components/screens/NewTransferScreen';
import { TransferScreen } from './components/screens/TransferScreen';
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
  UserCheck,
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
  MessageCircle,
  Scan,
  ArrowDownLeft,
  Calendar,
  Pencil,
  SlidersHorizontal,
  ArrowLeftRight,
  Heart
} from 'lucide-react';

export default function App() {
  const [viewState, setViewState] = useState<'splash' | 'register' | 'registerSuccess' | 'swap' | 'ecommerce' | 'bayarVA' | 'otherAccounts' | 'password' | 'inputName' | 'home' | 'transfer' | 'newTransfer' | 'amountInput' | 'processing' | 'success' | 'settings' | 'inbox' | 'accountDetail' | 'instantAccess' | 'pusatNotifikasi' | 'namaPanggilan' | 'email' | 'manageFavorites' | 'connectEWallet' | 'topup'>('splash');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [transferAmount, setTransferAmount] = useState('0');
  const [showDepositWithdrawModal, setShowDepositWithdrawModal] = useState(false);
  const [showDepositOptions, setShowDepositOptions] = useState(false);
  const [showDepositResult, setShowDepositResult] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userName, setUserName] = useState('RAKYAN INUKERTAPATI');
  const [selectedShortcuts, setSelectedShortcuts] = useState<ShortcutItem[]>(defaultSelectedShortcuts);
  const [availableShortcuts, setAvailableShortcuts] = useState<ShortcutItem[]>(defaultAvailableShortcuts);
  const [showToast, setShowToast] = useState(false);

  const [activeRekeningTab, setActiveRekeningTab] = useState(0);
  const [showBalance, setShowBalance] = useState(false);
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
      <div className="w-full max-w-[400px] h-[100dvh] sm:h-[850px] bg-[#EAF3FA] sm:rounded-[40px] relative shadow-2xl overflow-hidden flex flex-col border-[8px] border-slate-800 animate-in fade-in duration-500">
        
        {/* Toast Notification */}
        {showToast && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
             <div className="bg-emerald-50 text-emerald-700 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-emerald-100 rounded-[12px] px-4 py-3 flex items-center gap-3 w-full">
                <div className="bg-emerald-500 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={3} className="text-white" />
                </div>
                <span className="text-[13px] font-bold tracking-tight">Pengaturan berhasil disimpan.</span>
             </div>
          </div>
        )}

        {viewState === 'splash' && (
          <LoginScreen onLogin={() => setViewState('password')} onRegister={() => setViewState('register')} />
        )}
        
        {viewState === 'register' && (
          <RegisterWeb3Screen onBack={() => setViewState('splash')} onComplete={() => setViewState('registerSuccess')} />
        )}
        
        {viewState === 'registerSuccess' && (
          <RegisterSuccessScreen onContinue={() => setViewState('home')} />
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

        {viewState === 'ecommerce' && (
          <EcommerceScreen onBack={() => setViewState('home')} />
        )}

        {viewState === 'bayarVA' && (
          <BayarVAScreen onBack={() => setViewState('home')} />
        )}

        {viewState === 'email' && (
          <EmailScreen onBack={() => setViewState('settings')} />
        )}

        {viewState === 'otherAccounts' && (
          <OtherAccountsScreen onBack={() => setViewState('home')} />
        )}

        {viewState === 'swap' && (
          <SwapScreen onBack={() => setViewState('home')} />
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
            initialSelected={selectedShortcuts}
            initialAvailable={availableShortcuts}
            onBack={() => setViewState('home')}
            onSave={(selected, available) => {
               setSelectedShortcuts(selected);
               setAvailableShortcuts(available);
               setViewState('home');
               setShowToast(true);
               setTimeout(() => setShowToast(false), 3000);
            }}
          />
        )}

        {viewState === 'connectEWallet' && (
          <ConnectEWalletScreen onBack={() => setViewState('home')} />
        )}

        {viewState === 'topup' && (
          <TopUpScreen onBack={() => setViewState('home')} />
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
             <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 animate-bounce">
                <div className="w-6 h-6 border-4 border-[#008fcd] border-t-transparent rounded-full animate-spin"></div>
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
        {/* Top Header - Light Blue */}
        <header className="bg-[#3FA2F6] text-white px-5 pt-12 pb-16 flex justify-between items-start rounded-b-[32px] z-10 shrink-0">
          <div className="flex items-center gap-3 cursor-pointer">
             <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-[#3FA2F6] font-[900] text-lg shadow-sm uppercase">
                {userName ? userName.slice(0, 2) : "UN"}
             </div>
             <div className="flex flex-col">
                <h1 className="font-bold text-[15px] tracking-wide relative after:content-[''] after:absolute after:right-[-20px] after:top-0 after:bottom-0 after:w-8 after:bg-gradient-to-r after:from-transparent after:to-[#3FA2F6]">
                   {userName ? (userName.length > 18 ? userName.slice(0, 15) + '...' : userName).toUpperCase() : 'USER NAME'}
                </h1>
                <div className="flex items-center gap-1 mt-0.5 hover:opacity-80 transition-opacity">
                   <span className="text-yellow-300 font-bold text-xs tracking-wide">521</span>
                   <span className="text-xs font-semibold italic text-white/90">livin'poin</span>
                   <ChevronRight size={12} className="text-white/80" />
                 </div>
             </div>
          </div>
          <div className="flex gap-4 items-center">
            <button className="hover:opacity-80 transition-opacity bg-transparent border-0 p-0 relative" onClick={() => setViewState('inbox')}>
               <Mail size={22} className="text-white" />
               <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-[1.5px] border-[#3FA2F6]"></span>
            </button>
            <button className="hover:opacity-80 transition-opacity bg-transparent border-0 p-0" onClick={() => setViewState('settings')}>
               <Settings size={22} className="text-white" />
            </button>
            <button className="hover:opacity-80 transition-opacity bg-transparent border-0 p-0" onClick={() => setShowLogoutConfirm(true)}>
               <LogOut size={22} className="text-white" />
            </button>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto pb-28 -mt-8 pt-0 scrollbar-hide z-20">
          
          {/* Accounts Section */}
          <section className="bg-white rounded-[24px] p-5 shadow-sm mb-4 mx-4 border border-blue-50/50">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Rekening</h2>
              <div className="flex items-center gap-4 text-[#3FA2F6] text-[12px] font-semibold">
                <button onClick={() => setShowBalance(!showBalance)} className="flex items-center gap-1 hover:text-blue-600 transition-colors bg-transparent border-0">
                  Saldo {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button className="flex items-center gap-1 hover:text-blue-600 transition-colors bg-transparent border-0">
                  Atur <Settings2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex overflow-x-auto gap-6 pt-1 pb-3 mb-4 scrollbar-hide text-[12px] font-medium border-b border-slate-100">
              {[
                { name: 'My Wallet', icon: <Wallet size={20} /> },
                { name: 'E-commerce', icon: <ShoppingBag size={20} /> },
                { name: 'Swap', icon: <ArrowLeftRight size={20} /> },
                { name: 'History', icon: <CalendarClock size={20} /> }
              ].map((tab, i) => (
                <div 
                  key={tab.name} 
                  onClick={() => setActiveRekeningTab(i)}
                  className={`px-1 pb-2 flex flex-col items-center gap-1.5 whitespace-nowrap min-w-max cursor-pointer transition-colors ${
                  activeRekeningTab === i 
                  ? 'text-[#f59e0b] border-b-[3px] border-[#f59e0b] font-bold' 
                  : 'text-slate-500 hover:text-slate-800 border-b-[3px] border-transparent hover:border-slate-300'
                }`}>
                  {tab.icon}
                  <span>{tab.name}</span>
                </div>
              ))}
            </div>
            
            {activeRekeningTab === 0 && (
              /* My Wallet Card (Slim Web3 Look) */
              <div 
                 className="bg-slate-900 rounded-2xl p-4 text-white shadow-xl relative overflow-hidden mb-3 cursor-pointer hover:shadow-blue-900/10 transition-all active:scale-[0.98] group border border-slate-700 animate-in fade-in duration-300"
                 onClick={() => setViewState('accountDetail')}
              >
                {/* Background Glow */}
                <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-10 transition-opacity group-hover:opacity-20"></div>
                
                <div className="flex justify-between items-center z-10 relative">
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-[11px] text-slate-500 uppercase tracking-widest">Arc Wallet</h3>
                      <div className="px-1 py-0.5 bg-blue-500/10 rounded-sm border border-blue-500/20">
                        <span className="text-[7px] font-bold text-blue-400 uppercase">Testnet</span>
                      </div>
                    </div>
                    
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-[24px] font-bold tracking-tight text-white">
                        {showBalance ? "1,134.66" : "•••••"}
                      </p>
                      <span className="text-[12px] font-medium text-slate-500 tracking-wide">USDC</span>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                       <span className="text-[10px] text-slate-500 font-medium">Network Active</span>
                    </div>
                  </div>

                  {/* Slim Virtual Card Art */}
                  <div className="w-16 h-10 bg-gradient-to-br from-slate-800 to-slate-950 rounded-md border border-slate-700/50 shadow-lg relative overflow-hidden shrink-0 group-hover:rotate-3 transition-transform duration-500">
                     <div className="absolute top-1 left-1 w-3 h-2 bg-yellow-500/20 rounded-sm border border-yellow-500/20"></div>
                     <div className="absolute bottom-1 right-1">
                        <span className="text-[5px] font-bold text-slate-600">ARC</span>
                     </div>
                     <div className="absolute -right-2 -bottom-2 w-6 h-6 bg-blue-500/10 rounded-full blur-sm"></div>
                  </div>
                </div>
              </div>
            )}

            {activeRekeningTab === 1 && (
              /* E-commerce Card */
              <div 
                 className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-5 text-slate-800 shadow-sm relative overflow-hidden mb-3 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] border border-blue-100 animate-in fade-in duration-300"
                 onClick={() => setViewState('ecommerce')}
              >
                 <div className="flex justify-between items-center z-10 relative">
                    <div className="text-left">
                       <h3 className="font-bold text-[15px] text-slate-800">Arc Marketplace</h3>
                       <p className="text-[12px] text-slate-500 mt-1">Belanja produk premium dengan USDC</p>
                       <div className="flex items-center gap-2 mt-3">
                          <span className="text-[11px] font-bold text-[#005faa] bg-blue-100 px-2 py-0.5 rounded">E-commerce ready</span>
                       </div>
                    </div>
                    <ShoppingBag size={48} className="text-[#005faa] opacity-10 absolute -right-2 top-0" />
                    <ChevronRight size={20} className="text-[#3FA2F6]" />
                 </div>
              </div>
            )}

            {activeRekeningTab === 2 && (
              /* Swap Card */
              <div 
                 className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-5 text-slate-800 shadow-sm relative overflow-hidden mb-3 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] border border-orange-100 animate-in fade-in duration-300"
                 onClick={() => setViewState('swap')}
              >
                 <div className="flex justify-between items-center z-10 relative">
                    <div className="text-left">
                       <h3 className="font-bold text-[15px] text-slate-800">Swap USDC Ke ARC</h3>
                       <p className="text-[12px] text-slate-500 mt-1">Konversi aset instan & biaya rendah</p>
                       <div className="flex items-center gap-2 mt-3">
                          <span className="text-[11px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">Best Rates</span>
                       </div>
                    </div>
                    <ArrowLeftRight size={48} className="text-orange-500 opacity-10 absolute -right-2 top-0" />
                    <ChevronRight size={20} className="text-orange-500" />
                 </div>
              </div>
            )}

            {activeRekeningTab === 3 && (
               /* History Card */
               <div className="bg-slate-50 rounded-2xl p-7 border border-slate-200 border-dashed animate-in fade-in duration-300 mb-3">
                  <div className="flex flex-col items-center justify-center text-center">
                     <CalendarClock size={28} className="text-slate-300 mb-3" />
                     <p className="text-[13px] font-bold text-slate-500">Belum ada riwayat transaksi</p>
                     <p className="text-[11px] text-slate-400 mt-1">Aktivitas di Arc Testnet akan muncul di sini.</p>
                  </div>
               </div>
            )}
            
            <button 
              onClick={() => setViewState('otherAccounts')}
              className="w-full text-center text-[#3FA2F6] text-[12px] font-bold mt-1 py-1.5 hover:bg-blue-50 rounded-lg transition-colors flex justify-center items-center gap-1.5 opacity-90 border-0 bg-transparent"
            >
              Other Personal Savings & Checking <PlusCircleIcon size={14} />
            </button>
          </section>

          {/* Favorite Transactions Section */}
          <section className="bg-white rounded-[24px] p-5 shadow-sm mb-4 mx-4">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Transaksi Favorit</h2>
              <button 
                className="text-[#3FA2F6] text-[13px] font-semibold flex items-center gap-1.5 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors border-0 bg-transparent"
                onClick={() => setViewState('manageFavorites')}
              >
                Atur <Settings2 size={14} strokeWidth={1.5} />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-y-7 gap-x-2">
              {selectedShortcuts.map((item) => (
                 <MenuIcon 
                   key={item.id}
                   icon={item.icon} 
                   label={item.label} 
                   color={item.color} 
                   bgCircle={item.bgCircle}
                   badge={item.badge}
                   badgeColor={item.badgeColor}
                   isTextIcon={item.isTextIcon}
                   textIcon={item.textIcon}
                   onClick={() => {
                     if (item.label === "Transfer USDC" || item.label === "Transfer Rupiah") setViewState('transfer');
                     if (item.label === "Setor/Tarik") setShowDepositWithdrawModal(true);
                     if (item.label === "Top-up") setViewState('topup');
                     if (item.label === "Bayar/VA") setViewState('bayarVA');
                   }}
                 />
              ))}
            </div>

            <div className="mt-6 bg-blue-50/70 py-3 px-4 rounded-xl flex items-center justify-center gap-3 border border-blue-100 relative">
               {/* Tooltip triangle */}
               <div className="absolute -top-2 right-10 w-4 h-4 bg-blue-50/70 border-l border-t border-blue-100 rotate-45"></div>
               <Headphones size={18} className="text-[#3FA2F6]" />
               <span className="text-[13px] font-semibold text-[#3FA2F6]">Use Livin' Call by Mandiri</span>
            </div>
          </section>

          {/* Special For You (Promo Banner) */}
          <section className="bg-white rounded-[24px] overflow-hidden shadow-sm mb-4 mx-4 pb-4 border border-x-transparent border-t-transparent border-b-slate-50">
            <div className="px-5 pt-5 pb-3">
              <h2 className="text-[17px] font-bold text-slate-800 tracking-tight mb-0 text-left">Spesial Untuk Anda</h2>
            </div>
            <div className="flex overflow-x-auto gap-4 px-5 scrollbar-hide snap-x">
              <div className="min-w-[280px] h-[140px] bg-gradient-to-r from-blue-700 to-blue-800 rounded-2xl p-4 snap-center relative overflow-hidden text-white flex flex-col justify-center shadow-inner text-left">
                <div className="absolute right-0 top-0 h-full w-1/2 bg-[url('https://images.unsplash.com/photo-1556740714-a82f3a479426?q=80&w=150&auto=format&fit=crop')] bg-cover mix-blend-overlay opacity-30"></div>
                <h3 className="font-bold text-[15px] leading-tight w-2/3 relative z-10">Opening a Checking Account is Easier...</h3>
                <button className="mt-3 bg-white text-[#005faa] text-xs font-bold px-3 py-1.5 rounded-lg w-max relative z-10 border-0">Open Now</button>
              </div>
              <div className="min-w-[280px] h-[140px] bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 snap-center relative overflow-hidden text-white flex flex-col justify-center shadow-inner text-left">
                <h3 className="font-bold text-[15px] leading-tight w-2/3 relative z-10">Disburse Loan Up To Rp 50 Million</h3>
                <button className="mt-3 bg-white text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-lg w-max relative z-10 border-0">Check Limit</button>
              </div>
            </div>
            {/* Pagination dots */}
            <div className="flex justify-center gap-1.5 mt-4">
              <div className="w-5 h-1.5 bg-[#3FA2F6] rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
            </div>
          </section>

          {/* e-Wallet */}
          <section className="bg-white rounded-[24px] p-5 shadow-sm mb-4 mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">e-Wallet</h2>
              <button onClick={() => setViewState('connectEWallet')} className="text-[#3FA2F6] text-sm font-semibold hover:text-blue-600 transition-colors bg-transparent border-0">Connect <ChevronRight size={14} className="inline -mt-0.5" /></button>
            </div>
            <div className="flex justify-between gap-2 overflow-x-auto scrollbar-hide py-1">
              {['ShopeePay', 'LinkAja', 'DANA', 'GoPay', 'OVO'].map((wallet, i) => (
                <div key={wallet} className="flex flex-col items-center gap-2 min-w-[64px]">
                  <div className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center shadow-sm bg-white">
                    <Wallet className={`size-6 ${
                      i === 0 ? 'text-orange-500' :
                      i === 1 ? 'text-red-600' :
                      i === 2 ? 'text-blue-500' :
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
            <div className="mb-4 text-left">
              <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Investasi Saham</h2>
              <p className="text-xs text-slate-400 mt-1">Terakhir diperbarui 18 Mei 2026 10:23:59 WIB</p>
            </div>
            
            <div className="flex items-center gap-2 mb-4 text-[#3FA2F6] font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
              <TrendingUp size={16} /> Top Value
            </div>

            <div className="flex flex-col gap-4">
              <StockRow code="BMRI" name="Bank Mandiri (Persero) Tbk" price="4,110" change="90" percent="-2.14%" isDown />
              <StockRow code="BBCA" name="Bank Central Asia Tbk" price="5,900" change="200" percent="-3.28%" isDown />
              <StockRow code="BBRI" name="Bank Rakyat Indonesia (Persero) Tbk" price="3,020" change="100" percent="-3.21%" isDown />
              <StockRow code="ANTM" name="Aneka Tambang Tbk." price="3,110" change="390" percent="-11.14%" isDown />
              <StockRow code="BUMI" name="Bumi Resources Tbk" price="204" change="10" percent="-4.67%" isDown />
            </div>
            
            <p className="text-[10px] text-slate-400 mt-5 leading-relaxed bg-slate-50 p-2 rounded-lg text-left">
              Bank Mandiri through Mandiri Sekuritas has obtained permission from the Indonesia Stock Exchange to display the above data.
            </p>
          </section>

          {/* Selected Products */}
          <section className="bg-white rounded-[24px] p-5 shadow-sm mx-4 mb-8">
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight mb-4 text-left">Pilihan Produk</h2>
            <div className="grid grid-cols-2 gap-3">
              <ProductCard title="Pinjaman Cash Back" desc="Kredit dengan agunan deposito." icon={<Wallet size={20} className="text-blue-500" />} />
              <ProductCard title="KPR Livin'" desc="Rumah idaman dengan bunga kompetitif." icon={<Percent size={20} className="text-blue-500" />} />
              <ProductCard title="Kredit Kendaraan" desc="Cicilan ringan untuk kendaraan idaman Anda." icon={<Smartphone size={20} className="text-blue-500" />} />
              <ProductCard title="Tabungan Next-G" desc="Berbagi akses dengan anak atau kerabat." icon={<CalendarDays size={20} className="text-blue-500" />} />
            </div>
          </section>

        </div>

        {/* Aesthetic Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 h-[80px] bg-white/80 backdrop-blur-xl border-t border-slate-100/50 px-6 pb-2 flex items-center justify-between z-40 shadow-[0_-10px_25px_rgba(0,0,0,0.03)] sm:rounded-b-[40px]">
          <NavItem icon={<Home size={22} />} label="Beranda" active />
          <NavItem icon={<MessageCircle size={22} />} label="Pesan" />
          
          {/* Floating Action Button (QR/Pay) */}
          <div className="relative -mt-10 group cursor-pointer h-full flex flex-col items-center justify-center pt-2">
            <div className="absolute inset-0 bg-[#3FA2F6] rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative w-15 h-15 bg-gradient-to-tr from-[#004780] to-[#3FA2F6] rounded-[22px] flex flex-col items-center justify-center text-white shadow-xl border-2 border-white transform transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1 active:scale-95 group-active:translate-y-0">
               <Scan size={26} strokeWidth={2.5} />
               <span className="text-[8px] font-black uppercase mt-0.5 tracking-tighter opacity-80">Bayar</span>
            </div>
            <div className="mt-2.5 h-1.5 w-1.5 rounded-full bg-[#3FA2F6] opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          
          <NavItem icon={<ShoppingBag size={22} />} label="Lifestyle" />
          
          <div className="flex flex-col items-center gap-1 group cursor-pointer opacity-40 hover:opacity-100 transition-all">
            <div className="p-1 rounded-xl text-slate-500 transition-colors group-hover:bg-slate-50">
              <div className="w-5 h-5 flex flex-col justify-center items-center gap-1">
                <div className="w-4 h-0.5 bg-current rounded-full"></div>
                <div className="w-4 h-0.5 bg-current rounded-full"></div>
                <div className="w-4 h-0.5 bg-current rounded-full"></div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-500 tracking-tight">Menu</span>
          </div>
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
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all text-left bg-transparent border-0"
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
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all text-left bg-transparent border-0"
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
              
              <div className="px-6 flex justify-center items-center mb-4 mt-2 relative w-full">
                 <h3 className="font-bold text-[16px] text-slate-800">Cari</h3>
                 <button onClick={() => setShowDepositOptions(false)} className="absolute right-6 p-1 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200 bg-transparent border-0">
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
                <div className="px-4 mb-2 text-left">
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
                      <div className="w-5 h-5 rounded-full bg-[#2775ca] flex items-center justify-center text-white text-[8px] font-bold">USDC</div>
                      <span className="text-[13px] font-bold text-slate-700">USDC</span>
                   </button>
                </div>
                
                <div className="px-4 mb-2 text-left">
                   <span className="text-[13px] font-bold text-slate-800">Populer</span>
                </div>

                <div className="flex flex-col">
                  <button 
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-all text-left bg-transparent border-0 group"
                    onClick={() => {
                      setShowDepositOptions(false);
                      setShowDepositResult(true);
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#2775ca] flex items-center justify-center font-bold text-white text-[10px] shadow-sm shrink-0">
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
              <div className="flex justify-between items-center mb-4 mt-2 w-full">
                 <h3 className="font-bold text-[20px] text-slate-800">Ingin log out?</h3>
                 <button onClick={() => setShowLogoutConfirm(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200 bg-transparent border-0">
                   <X size={22} className="text-slate-500" strokeWidth={2.5} />
                 </button>
              </div>
              
              <p className="text-slate-600 text-[14px] leading-relaxed mb-8 text-left">
                Pastikan semua aktivitas sudah selesai, ya. Terima kasih telah mengakses Livin' hari ini.
              </p>
              
              <button 
                className="w-full bg-[#008fcd] text-white font-bold text-[16px] py-3.5 rounded-full shadow-[0_4px_14px_rgba(0,143,205,0.3)] hover:bg-[#007dba] active:scale-[0.98] transition-all"
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

// Subcomponents helper functions

interface MenuIconProps {
  key?: string | number;
  icon: React.ReactNode;
  label: string;
  color: string;
  badge?: string;
  bgCircle?: string;
  badgeColor?: string;
  isTextIcon?: boolean;
  textIcon?: string;
  onClick?: () => void;
}

function MenuIcon({ icon, label, color, badge, bgCircle, badgeColor = "bg-green-500", isTextIcon = false, textIcon = "", onClick }: MenuIconProps) {
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
        <div className="w-8 h-8 rounded-full bg-blue-50 text-[#3FA2F6] flex justify-center items-center text-xs font-bold border border-blue-100">
           {code.substring(0, 1)}
        </div>
        <div className="text-left">
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
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 relative overflow-hidden group cursor-pointer hover:bg-blue-50 hover:border-blue-100 transition-colors">
      <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center shadow-sm mb-3">
         {icon}
      </div>
      <h3 className="font-bold text-slate-800 text-[13px] mb-1 text-left">{title}</h3>
      <p className="text-[11px] text-slate-500 leading-snug text-left">{desc}</p>
      
      <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-blue-100/50 rounded-full blur-xl group-hover:bg-blue-200/50 transition-colors"></div>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 cursor-pointer transition-colors w-14 ${active ? 'text-[#3FA2F6]' : 'text-slate-400 hover:text-slate-600'}`}>
      <div className={`${active ? '-translate-y-0.5' : ''} transition-transform`}>
        {icon}
      </div>
      <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </div>
  );
}
