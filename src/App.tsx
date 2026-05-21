/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ManageFavoritesScreen } from './components/screens/ManageFavoritesScreen';
import { ConnectEWalletScreen } from './components/screens/ConnectEWalletScreen';
import { PasswordScreen } from './components/screens/PasswordScreen';
import { ForgotPasswordScreen } from './components/screens/ForgotPasswordScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { RegisterWeb3Screen } from './components/screens/RegisterWeb3Screen';
import { RegisterSuccessScreen } from './components/screens/RegisterSuccessScreen';
import { TopUpScreen } from './components/screens/TopUpScreen';
import { ScanQRScreen } from './components/screens/ScanQRScreen';
import { AIAgentScreen } from './components/screens/AIAgentScreen';
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
import { ReceiptScreen } from './components/screens/ReceiptScreen';
import { AccountDetailScreen } from './components/screens/AccountDetailScreen';
import { SuccessScreen } from './components/screens/SuccessScreen';
import { AmountInputScreen } from './components/screens/AmountInputScreen';
import { NewTransferScreen } from './components/screens/NewTransferScreen';
import { TransferScreen } from './components/screens/TransferScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { useApp } from './context/AppContext';

export default function App() {
  const {
    viewState, setViewState,
    registeredUser, setRegisteredUser,
    isBiometricVerified, setIsBiometricVerified,
    receiptSource, setReceiptSource,
    selectedContact, setSelectedContact,
    transferAmount, setTransferAmount,
    selectedShortcuts, setSelectedShortcuts,
    availableShortcuts, setAvailableShortcuts,
    displayToast
  } = useApp();
  
  const userName = registeredUser?.username || 'RAKYAN INUKERTAPATI';

  return (
    <div className="bg-[#EAF3FA] sm:bg-slate-900 min-h-screen sm:p-4 md:p-8 flex items-center justify-center">
      {/* Responsive Device Frame */}
      <div className="w-full max-w-[400px] md:max-w-2xl lg:max-w-5xl xl:max-w-6xl h-[100dvh] sm:h-[850px] lg:h-[90vh] bg-[#EAF3FA] sm:rounded-[40px] relative shadow-2xl overflow-hidden flex flex-col sm:border-[8px] border-slate-800 animate-in fade-in duration-500">
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={viewState}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full h-full relative"
          >
            {viewState === 'splash' && (
              <LoginScreen 
                hasIdentity={!!registeredUser}
                onShowToast={displayToast}
                onLogin={() => setViewState('password')} 
                onRegister={() => setViewState('register')} 
              />
            )}
            
            {viewState === 'register' && (
              <RegisterWeb3Screen 
                onBack={() => setViewState('splash')} 
                onComplete={(data) => {
                  setRegisteredUser(data);
                  localStorage.setItem('arc_commerce_user', JSON.stringify(data));
                  setIsBiometricVerified(data.isVerified);
                  setViewState('registerSuccess');
                }} 
              />
            )}
            
            {viewState === 'registerSuccess' && (
              <RegisterSuccessScreen 
                username={registeredUser?.username}
                email={registeredUser?.email}
                onContinue={() => setViewState('home')} 
              />
            )}
            
            {viewState === 'password' && (
              <PasswordScreen 
                onBack={() => setViewState('splash')} 
                onLogin={() => {
                  setIsBiometricVerified(true); // Simulate already verified if login with PIN
                  setViewState('home')
                }} 
                onForgotPassword={() => setViewState('forgotPassword')}
              />
            )}
            
            {viewState === 'forgotPassword' && (
              <ForgotPasswordScreen onBack={() => setViewState('password')} />
            )}
            
            {viewState === 'settings' && (
              <SettingsScreen 
                onBack={() => setViewState('home')} 
                onInstantAccess={() => setViewState('instantAccess')} 
                onPusatNotifikasi={() => setViewState('pusatNotifikasi')} 
                onNamaPanggilan={() => setViewState('namaPanggilan')} 
                onEmail={() => setViewState('email')}
                onShowToast={displayToast}
                isBiometricVerified={isBiometricVerified}
                onVerifyBiometric={() => {
                  displayToast('Biometric verified successfully!');
                  setIsBiometricVerified(true);
                }}
              />
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
              <InboxScreen 
                onBack={() => setViewState('home')} 
                onTransactionClick={() => {
                  setReceiptSource('inbox');
                  setViewState('receipt');
                }}
              />
            )}

            {viewState === 'accountDetail' && (
              <AccountDetailScreen 
                userName={userName}
                onBack={() => setViewState('home')} 
                onTransfer={() => setViewState('transfer')}
                onTopup={() => setViewState('home')} // Handle inside home
                onTransactionClick={() => {
                  setReceiptSource('accountDetail');
                  setViewState('receipt');
                }}
              />
            )}

            {viewState === 'receipt' && (
              <ReceiptScreen onBack={() => setViewState(receiptSource)} />
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
                   displayToast('Pengaturan berhasil disimpan.');
                }}
              />
            )}

            {viewState === 'connectEWallet' && (
              <ConnectEWalletScreen onBack={() => setViewState('home')} />
            )}

            {viewState === 'topup' && (
              <TopUpScreen onBack={() => setViewState('home')} />
            )}
            
            {viewState === 'scanQR' && (
              <ScanQRScreen 
                onBack={() => setViewState('home')}
                onScanResult={(contact) => {
                  setSelectedContact(contact);
                  setViewState('amountInput');
                }}
              />
            )}

            {viewState === 'aiAgent' && (
              <AIAgentScreen onBack={() => setViewState('home')} />
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
              <div className="w-full h-full bg-black flex flex-col items-center justify-center relative z-50">
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
                isBiometricVerified={isBiometricVerified}
                onRequireVerification={() => setViewState('settings')}
              />
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}

