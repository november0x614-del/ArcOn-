import React from "react";
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
import { ArcSwapScreen } from "../screens/ArcSwapScreen";
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

interface ViewRouterProps {
  isLoggingIn: boolean;
  loginEmail: string;
  setLoginEmail: (email: string) => void;
  setIsLoggingIn: (loading: boolean) => void;
}

export function ViewRouter({ isLoggingIn, loginEmail, setLoginEmail, setIsLoggingIn }: ViewRouterProps) {
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

  const userName = registeredUser?.username || "RAKYAN INUKERTAPATI";

  return (
    <>
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
          onNext={async (amount) => {
            const numAmount = parseFloat(amount);
            if (numAmount < 1) {
              displayToast("Minimum transfer amount is 1 USDC.");
              return;
            }
            if (numAmount > balance) {
              displayToast("Insufficient balance.");
              return;
            }
            
            setTransferAmount(amount);
            setViewState("processing");
            
            try {
              const response = await fetch('/api/payments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  walletId: registeredUser?.walletId || 'default-wallet', 
                  destinationAddress: selectedContact.account,
                  amount: amount,
                  userId: registeredUser?.supabaseUid 
                }),
              });
              
              if (!response.ok) throw new Error('Transfer failed');
              
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

      {viewState === "transactionHistory" && (
        <TransactionHistoryScreen onBack={() => setViewState("home")} />
      )}

      {viewState === "home" && (
        <HomeScreen
          userName={userName}
          selectedShortcuts={selectedShortcuts}
          onNavigate={(view) => setViewState(view)}
        />
      )}
    </>
  );
}
