/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { ManageFavoritesScreen, defaultSelectedShortcuts, defaultAvailableShortcuts } from './components/screens/ManageFavoritesScreen';
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
import { SuccessScreen } from './components/screens/SuccessScreen';
import { AmountInputScreen } from './components/screens/AmountInputScreen';
import { NewTransferScreen } from './components/screens/NewTransferScreen';
import { TransferScreen } from './components/screens/TransferScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { ViewState, ShortcutItem } from './types';
import { Check } from 'lucide-react';

export default function App() {
  const [viewState, setViewState] = useState<ViewState>('splash');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [transferAmount, setTransferAmount] = useState('0');
  const userName = 'RAKYAN INUKERTAPATI';
  const [selectedShortcuts, setSelectedShortcuts] = useState<ShortcutItem[]>(defaultSelectedShortcuts);
  const [availableShortcuts, setAvailableShortcuts] = useState<ShortcutItem[]>(defaultAvailableShortcuts);
  const [showToast, setShowToast] = useState(false);

  return (
    <div className="bg-[#EAF3FA] sm:bg-slate-900 min-h-screen sm:p-4 md:p-8 flex items-center justify-center">
      {/* Responsive Device Frame */}
      <div className="w-full max-w-[400px] md:max-w-2xl lg:max-w-5xl xl:max-w-6xl h-[100dvh] sm:h-[850px] lg:h-[90vh] bg-[#EAF3FA] sm:rounded-[40px] relative shadow-2xl overflow-hidden flex flex-col sm:border-[8px] border-slate-800 animate-in fade-in duration-500">
        
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
            onTopup={() => setViewState('home')} // Handle inside home
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
          <HomeScreen
            userName={userName}
            selectedShortcuts={selectedShortcuts}
            onNavigate={(view) => setViewState(view)}
          />
        )}

      </div>
    </div>
  );
}

