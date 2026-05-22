/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ManageFavoritesScreen } from "./components/screens/ManageFavoritesScreen";
import { ConnectEWalletScreen } from "./components/screens/ConnectEWalletScreen";
import { PasswordScreen } from "./components/screens/PasswordScreen";
import { ForgotPasswordScreen } from "./components/screens/ForgotPasswordScreen";
import { LoginScreen } from "./components/screens/LoginScreen";
import { RegisterWeb3Screen } from "./components/screens/RegisterWeb3Screen";
import { RegisterSuccessScreen } from "./components/screens/RegisterSuccessScreen";
import { TopUpScreen } from "./components/screens/TopUpScreen";
import { ScanQRScreen } from "./components/screens/ScanQRScreen";
import { AIAgentScreen } from "./components/screens/AIAgentScreen";
import { SettingsScreen } from "./components/screens/SettingsScreen";
import { NamaPanggilanScreen } from "./components/screens/NamaPanggilanScreen";
import { EmailScreen } from "./components/screens/EmailScreen";
import { OtherAccountsScreen } from "./components/screens/OtherAccountsScreen";
import { BayarVAScreen } from "./components/screens/BayarVAScreen";
import { EcommerceScreen } from "./components/screens/EcommerceScreen";
import { MerchantScreen } from "./components/screens/MerchantScreen";
import { FaucetScreen } from "./components/screens/FaucetScreen";
import { SwapScreen } from "./components/screens/SwapScreen";
import { DepositQRScreen } from "./components/screens/DepositQRScreen";
import { StablestakeScreen } from "./components/screens/StablestakeScreen";
import { DepositOptionsScreen } from "./components/screens/DepositOptionsScreen";
import { ReceiveVAScreen } from "./components/screens/ReceiveVAScreen";
import { ReceiveQRISScreen } from "./components/screens/ReceiveQRISScreen";
import { LogoutScreen } from "./components/screens/LogoutScreen";
import { ArcSwapScreen } from "./components/screens/ArcSwapScreen";
import { ArcBirdScreen } from "./components/screens/ArcBirdScreen";
import { InboxScreen } from "./components/screens/InboxScreen";
import { ReceiptScreen } from "./components/screens/ReceiptScreen";
import { AccountDetailScreen } from "./components/screens/AccountDetailScreen";
import { SuccessScreen } from "./components/screens/SuccessScreen";
import { AmountInputScreen } from "./components/screens/AmountInputScreen";
import { NewTransferScreen } from "./components/screens/NewTransferScreen";
import { TransferScreen } from "./components/screens/TransferScreen";
import { TransactionHistoryScreen } from "./components/screens/TransactionHistoryScreen";
import { HomeScreen } from "./components/screens/HomeScreen";
import { BiometricVerifyScreen } from "./components/screens/BiometricVerifyScreen";
import { BatchTransferScreen } from "./components/screens/BatchTransferScreen";
import { WithdrawScreen } from "./components/screens/WithdrawScreen";
import { BridgeScreen } from "./components/screens/BridgeScreen";
import { useApp } from "./context/AppContext";
import { supabase } from "./lib/supabaseClient";

export default function App() {
  const {
    viewState,
    setViewState,
    registeredUser,
    setRegisteredUser,
    isBiometricVerified,
    setIsBiometricVerified,
    receiptSource,
    setReceiptSource,
    selectedContact,
    setSelectedContact,
    transferAmount,
    setTransferAmount,
    selectedShortcuts,
    setSelectedShortcuts,
    availableShortcuts,
    setAvailableShortcuts,
    setSelectedTransaction,
    displayToast,
    balance,
    setBalance,
    addTransaction
  } = useApp();

  // Handle Supabase Auth Session
  React.useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleUserSession(session.user);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        handleUserSession(session.user);
      } else {
        setRegisteredUser(null);
        localStorage.removeItem("arc_commerce_user");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserSession = async (user: any) => {
    try {
      // Try to fetch wallet mapping from Supabase
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('supabase_uid', user.id)
        .single();

      if (data && !error) {
        const userData = {
          username: user.user_metadata?.username || user.email?.split('@')[0].toUpperCase(),
          email: user.email,
          isVerified: true,
          walletId: data.circle_wallet_id,
          walletAddress: data.wallet_address,
          supabaseUid: user.id,
          registrationDate: new Date(user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
        };
        setRegisteredUser(userData);
        localStorage.setItem("arc_commerce_user", JSON.stringify(userData));
        if (viewState === 'splash' || viewState === 'password') {
          setViewState('home');
        }
      }
    } catch (err) {
      console.error("Error fetching session wallet:", err);
    }
  };

  const userName = registeredUser?.username || "RAKYAN INUKERTAPATI";

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
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full h-full relative"
          >
            {viewState === "splash" && (
              <LoginScreen
                hasIdentity={!!registeredUser}
                onShowToast={displayToast}
                onLogin={() => setViewState("password")}
                onRegister={() => setViewState("register")}
              />
            )}

            {viewState === "register" && (
              <RegisterWeb3Screen
                onBack={() => setViewState("splash")}
                onComplete={(data) => {
                  setRegisteredUser(data);
                  localStorage.setItem(
                    "arc_commerce_user",
                    JSON.stringify(data),
                  );
                  setIsBiometricVerified(data.isVerified);
                  setViewState("registerSuccess");
                }}
              />
            )}

            {viewState === "registerSuccess" && (
              <RegisterSuccessScreen
                username={registeredUser?.username}
                email={registeredUser?.email}
                onContinue={() => setViewState("home")}
              />
            )}

            {viewState === "password" && (
              <PasswordScreen
                onBack={() => setViewState("splash")}
                onLogin={async (email, password) => {
                  const { data, error } = await supabase.auth.signInWithPassword({ 
                    email, 
                    password 
                  });
                  
                  if (error) {
                    displayToast(error.message);
                    return;
                  }

                  if (data.user) {
                    setIsBiometricVerified(true);
                    await handleUserSession(data.user);
                  }
                }}
                onForgotPassword={() => setViewState("forgotPassword")}
              />
            )}

            {viewState === "forgotPassword" && (
              <ForgotPasswordScreen onBack={() => setViewState("password")} />
            )}

            {viewState === "settings" && (
              <SettingsScreen
                onBack={() => setViewState("home")}
                onNamaPanggilan={() => setViewState("namaPanggilan")}
                onEmail={() => setViewState("email")}
                onShowToast={displayToast}
                isBiometricVerified={isBiometricVerified}
                onVerifyBiometric={() => {
                  setViewState("biometricVerify");
                }}
              />
            )}

            {viewState === "namaPanggilan" && (
              <NamaPanggilanScreen onBack={() => setViewState("settings")} />
            )}

            {viewState === "ecommerce" && (
              <EcommerceScreen onBack={() => setViewState("home")} />
            )}

            {viewState === "merchant" && (
              <MerchantScreen onBack={() => setViewState("home")} />
            )}

            {viewState === "faucet" && (
              <FaucetScreen onBack={() => setViewState("home")} />
            )}

            {viewState === "bayarVA" && (
              <BayarVAScreen onBack={() => setViewState("home")} />
            )}

            {viewState === "email" && (
              <EmailScreen onBack={() => setViewState("settings")} />
            )}

            {viewState === "otherAccounts" && (
              <OtherAccountsScreen onBack={() => setViewState("home")} />
            )}

            {viewState === "swap" && (
              <SwapScreen onBack={() => setViewState("home")} />
            )}

            {viewState === "receive" && (
              <DepositQRScreen onBack={() => setViewState("home")} />
            )}

            {viewState === "stablestake" && (
              <StablestakeScreen onBack={() => setViewState("home")} />
            )}

            {viewState === "depositOptions" && (
              <DepositOptionsScreen
                onBack={() => setViewState("home")}
                onSelectUSDC={() => setViewState("receive")}
                onSelectVA={() => setViewState("receiveVA")}
                onSelectQRIS={() => setViewState("receiveQRIS")}
                onSelectWithdraw={() => setViewState("withdraw")}
              />
            )}

            {viewState === "receiveVA" && (
              <ReceiveVAScreen onBack={() => setViewState("depositOptions")} />
            )}

            {viewState === "receiveQRIS" && (
              <ReceiveQRISScreen
                onBack={() => setViewState("depositOptions")}
              />
            )}

            {viewState === "logout" && (
              <LogoutScreen
                onBack={() => setViewState("home")}
                onLogout={async () => {
                  await supabase.auth.signOut();
                  setViewState("splash");
                }}
              />
            )}

            {viewState === "arcswap" && (
              <ArcSwapScreen onBack={() => setViewState("home")} />
            )}

            {viewState === "arcbird" && (
              <ArcBirdScreen onBack={() => setViewState("home")} />
            )}

            {viewState === "inbox" && (
              <InboxScreen
                onBack={() => setViewState("home")}
                onTransactionClick={(tx) => {
                  setSelectedTransaction(tx);
                  setReceiptSource("inbox");
                  setViewState("receipt");
                }}
              />
            )}

            {viewState === "accountDetail" && (
              <AccountDetailScreen
                userName={userName}
                onBack={() => setViewState("home")}
                onTransfer={() => setViewState("transfer")}
                onReceive={() => setViewState("receive")}
                onTransactionClick={() => {
                  setReceiptSource("accountDetail");
                  setViewState("receipt");
                }}
              />
            )}

            {viewState === "receipt" && (
              <ReceiptScreen onBack={() => setViewState(receiptSource)} />
            )}

            {viewState === "manageFavorites" && (
              <ManageFavoritesScreen
                initialSelected={selectedShortcuts}
                initialAvailable={availableShortcuts}
                onBack={() => setViewState("home")}
                onSave={(selected, available) => {
                  setSelectedShortcuts(selected);
                  setAvailableShortcuts(available);
                  setViewState("home");
                  displayToast("Pengaturan berhasil disimpan.");
                }}
              />
            )}

            {viewState === "connectEWallet" && (
              <ConnectEWalletScreen onBack={() => setViewState("home")} />
            )}

            {viewState === "topup" && (
              <TopUpScreen onBack={() => setViewState("home")} />
            )}

            {viewState === "scanQR" && (
              <ScanQRScreen
                onBack={() => setViewState("home")}
                onScanResult={(contact) => {
                  setSelectedContact(contact);
                  setViewState("amountInput");
                }}
              />
            )}

            {viewState === "aiAgent" && (
              <AIAgentScreen onBack={() => setViewState("home")} />
            )}

            {viewState === "transfer" && (
              <TransferScreen
                onBack={() => setViewState("home")}
                onNewTransfer={() => setViewState("newTransfer")}
                onSelectContact={(contact) => {
                  setSelectedContact(contact);
                  setViewState("amountInput");
                }}
                onBatchTransfer={() => setViewState("batchTransfer")}
              />
            )}

            {viewState === "newTransfer" && (
              <NewTransferScreen
                onBack={() => setViewState("transfer")}
                onSelectContact={(contact) => {
                  setSelectedContact(contact);
                  setViewState("amountInput");
                }}
              />
            )}

            {viewState === "amountInput" && selectedContact && (
              <AmountInputScreen
                contact={selectedContact}
                onBack={() => setViewState("transfer")}
                onNext={(amount) => {
                  const numAmount = parseFloat(amount);
                  if (numAmount > balance) {
                    displayToast("Insufficient balance.");
                    return;
                  }
                  
                  setTransferAmount(amount);
                  setViewState("processing");
                  
                  setTimeout(() => {
                    // Update global state
                    setBalance(prev => prev - numAmount);
                    addTransaction({
                      type: 'transfer',
                      title: `Transfer to ${selectedContact.name}`,
                      amount: `-${numAmount.toFixed(2)}`,
                      currency: 'USDC',
                      status: 'success',
                      txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`
                    });
                    setViewState("success");
                  }, 1500);
                }}
              />
            )}

            {viewState === "processing" && (
              <div className="w-full h-full bg-black flex flex-col items-center justify-center relative z-50">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 animate-bounce">
                  <div className="w-6 h-6 border-4 border-[#008fcd] border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
            )}

            {viewState === "success" && selectedContact && (
              <SuccessScreen
                contact={selectedContact}
                amount={transferAmount}
                onClose={() => setViewState("home")}
              />
            )}

            {viewState === "batchTransfer" && (
              <BatchTransferScreen
                onBack={() => setViewState("transfer")}
                contacts={registeredUser ? [
                  { id: '1', letter: 'A', name: 'ANNISA PATRIA', network: 'EVM (Arc Testnet)', account: '0x1A2bc...3c4A', initials: 'AP' },
                  { id: '2', letter: 'A', name: 'ARGA SATYAGRAHA', network: 'EVM (Arc Testnet)', account: '0x9F8eA...2d1B', initials: 'AS' },
                  { id: '3', letter: 'H', name: 'HERU SALAM', network: 'EVM (Arc Testnet)', account: '0x4E5fC...6a7C', initials: 'HS' },
                  { id: '4', letter: 'I', name: 'IDA RIDAWATI', network: 'EVM (Arc Testnet)', account: '0x7FaZ...9A2b', initials: 'IR' },
                  { id: '5', letter: 'L', name: 'LIGAR WENINGGALIH', network: 'EVM (Arc Testnet)', account: '0x2B3cD...4D5e', initials: 'LW' }
                ] : []}
              />
            )}

            {viewState === "withdraw" && (
              <WithdrawScreen 
                onBack={() => setViewState("depositOptions")}
                onSuccess={() => setViewState("home")}
              />
            )}

            {viewState === "bridge" && (
              <BridgeScreen 
                onBack={() => setViewState("home")}
                onSuccess={() => setViewState("home")}
              />
            )}

            {viewState === "biometricVerify" && (
              <BiometricVerifyScreen
                onVerify={() => {
                  setIsBiometricVerified(true);
                  displayToast("Biometric authentication successful");
                  setViewState("home");
                }}
                onCancel={() => setViewState("home")}
              />
            )}

            {viewState === "transactionHistory" && (
              <TransactionHistoryScreen onBack={() => setViewState("home")} />
            )}

            {viewState === "home" && (
              <HomeScreen
                userName={userName}
                selectedShortcuts={selectedShortcuts}
                onNavigate={(view) => setViewState(view)}
                isBiometricVerified={isBiometricVerified}
                onRequireVerification={() => setViewState("biometricVerify")}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
