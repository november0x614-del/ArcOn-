import React from "react";
import { motion, AnimatePresence, Variants } from "motion/react";
import { ViewState } from "../../types";
import { useApp } from "../../context/AppContext";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterWeb3Screen } from "../screens/RegisterWeb3Screen";
import { RegisterSuccessScreen } from "../screens/RegisterSuccessScreen";
import { PasswordScreen } from "../screens/PasswordScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { NamaPanggilanScreen } from "../screens/NamaPanggilanScreen";
import { EmailScreen } from "../screens/EmailScreen";
import { OtherAccountsScreen } from "../screens/OtherAccountsScreen";
import { BayarVAScreen } from "../screens/BayarVAScreen";
import { EcommerceScreen } from "../screens/EcommerceScreen";
import { MerchantScreen } from "../screens/MerchantScreen";
import { FaucetScreen } from "../screens/FaucetScreen";
import { SwapScreen } from "../screens/SwapScreen";
import { DepositQRScreen } from "../screens/DepositQRScreen";
import { StablestakeScreen } from "../screens/StablestakeScreen";
import { DepositOptionsScreen } from "../screens/DepositOptionsScreen";
import { ReceiveVAScreen } from "../screens/ReceiveVAScreen";
import { ReceiveQRISScreen } from "../screens/ReceiveQRISScreen";
import { LogoutScreen } from "../screens/LogoutScreen";
import { ArcBirdScreen } from "../screens/ArcBirdScreen";
import { InboxScreen } from "../screens/InboxScreen";
import { AccountDetailScreen } from "../screens/AccountDetailScreen";
import { ReceiptScreen } from "../screens/ReceiptScreen";
import { ManageFavoritesScreen } from "../screens/ManageFavoritesScreen";
import { ConnectEWalletScreen } from "../screens/ConnectEWalletScreen";
import { ScanQRScreen } from "../screens/ScanQRScreen";
import { AIAgentScreen } from "../screens/AIAgentScreen";
import { TransferScreen } from "../screens/TransferScreen";
import { NewTransferScreen } from "../screens/NewTransferScreen";
import { AmountInputScreen } from "../screens/AmountInputScreen";
import { SuccessScreen } from "../screens/SuccessScreen";
import { BatchTransferScreen } from "../screens/BatchTransferScreen";
import { WithdrawScreen } from "../screens/WithdrawScreen";
import { BridgeScreen } from "../screens/BridgeScreen";
import { TransactionHistoryScreen } from "../screens/TransactionHistoryScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { supabase } from "../../lib/supabaseClient";
import { ArcAppKitAdapter } from "../../services/arc-app-kit/adapter";
import { useContacts } from "../../hooks/useContacts";

const slideFadeVariants: Variants = {
  initial: {
    opacity: 0,
    x: 16,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.28,
      ease: [0.16, 1, 0.3, 1], // easeOutExpo
    }
  },
  exit: {
    opacity: 0,
    x: -16,
    transition: {
      duration: 0.22,
      ease: [0.7, 0, 0.84, 0], // easeInQuad
    }
  }
};

interface ViewRouterProps {
  isLoggingIn: boolean;
  loginEmail: string;
  setLoginEmail: (email: string) => void;
  setIsLoggingIn: (loading: boolean) => void;
}

export const ViewRouter = React.memo(({ isLoggingIn, loginEmail, setLoginEmail, setIsLoggingIn }: ViewRouterProps) => {
  const {
    viewState,
    setViewState,
    registeredUser,
    setRegisteredUser,
    receiptSource,
    setReceiptSource,
    selectedContact,
    setSelectedContact,
    transferAmount,
    setTransferAmount,
    setTransferMemo,
    selectedShortcuts,
    setSelectedShortcuts,
    availableShortcuts,
    setAvailableShortcuts,
    setSelectedTransaction,
    displayToast,
    balance,
    fetchBalance,
    fetchTransactions
  } = useApp();

  const { realContacts } = useContacts();

  const onNavigate = React.useCallback((view: ViewState) => setViewState(view), [setViewState]);

  const userName = registeredUser?.username || "RAKYAN INUKERTAPATI";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewState}
        variants={slideFadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full h-full flex flex-col transform-gpu will-change-transform animate-in fade-in duration-300 ease-out"
      >
        {viewState === "splash" && (
        <LoginScreen
          hasIdentity={!!registeredUser}
          onShowToast={displayToast}
          isLoading={isLoggingIn}
          onLogin={async (email) => {
            setLoginEmail(email);
            setViewState("password");
          }}
          onRegister={() => setViewState("register")}
        />
      )}

      {viewState === "register" && (
        <RegisterWeb3Screen
          onBack={() => setViewState("splash")}
          onComplete={(data) => {
            setRegisteredUser(data);
            setViewState("registerSuccess");
          }}
        />
      )}

      {viewState === "registerSuccess" && (
        <RegisterSuccessScreen
          username={registeredUser?.username}
          email={registeredUser?.email}
          walletAddress={registeredUser?.walletAddress}
          onContinue={() => setViewState("home")}
        />
      )}

      {viewState === "password" && (
        <PasswordScreen
          email={loginEmail}
          onBack={() => setViewState("splash")}
          isLoading={isLoggingIn}
          onLogin={async (email, password) => {
            setIsLoggingIn(true);

            const { error } = await supabase.auth.signInWithPassword({
              email,
              password
            });

            if (error) {
              displayToast(error.message);
              setIsLoggingIn(false);
              return;
            }
            
            setIsLoggingIn(false);
            setViewState("home");
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
          }}
        />
      )}

      {viewState === "arcswap" && (
        <SwapScreen onBack={() => setViewState("home")} />
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
          onTransactionClick={(tx) => {
            setSelectedTransaction(tx);
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
          onNext={async (amount, memo) => {
            const numAmount = parseFloat(amount);
            if (numAmount < 1) {
              displayToast("Minimum transfer amount is 1 USDC.");
              return;
            }
            if (numAmount > balance) {
              displayToast("Insufficient USDC for transfer or gas.");
              return;
            }
            
            setTransferAmount(amount);
            setTransferMemo(memo);
            setViewState("processing");
            
            try {
              await ArcAppKitAdapter.sendUnifiedBalance(numAmount, selectedContact.account, memo);
              
              await fetchBalance();
              await fetchTransactions();
              setViewState("success");
            } catch (error) {
              console.error(error);
              displayToast("Transfer failed. Please try again.");
              setViewState("transfer");
            }
          }}
        />
      )}

      {viewState === "processing" && (
        <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center relative z-50">
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 border-2 border-[#008fcd] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] font-bold text-[#008fcd] italic">arc</span>
            </div>
            
            <h3 className="text-white font-bold text-[18px] tracking-tight mb-2">Broadcasting to Arc</h3>
            <div className="flex flex-col items-center gap-1 opacity-60">
              <span className="text-blue-400 text-[10px] font-mono tracking-widest uppercase">Under 1s Finality Expected</span>
              <div className="flex gap-1 mt-2">
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>

            <div className="mt-12 max-w-[200px] text-center">
              <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic">
                Arc uses deterministic finality, meaning your transaction is immutable after a single confirmation.
              </p>
            </div>
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
          contacts={realContacts}
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

      {viewState === "transactionHistory" && (
        <TransactionHistoryScreen onBack={() => setViewState("home")} />
      )}

      {viewState === "home" && (
        <HomeScreen
          userName={userName}
          selectedShortcuts={selectedShortcuts}
          onNavigate={onNavigate}
        />
      )}
      </motion.div>
    </AnimatePresence>
  );
});
