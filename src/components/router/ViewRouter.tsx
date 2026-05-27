import React from "react";
import { motion, AnimatePresence, Variants } from "motion/react";
import { ViewState } from "../../types";
import { useApp } from "../../contexts/AppContext";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterWeb3Screen } from "../screens/RegisterWeb3Screen";
import { RegisterSuccessScreen } from "../screens/RegisterSuccessScreen";
import { PasswordScreen } from "../screens/PasswordScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { SwapScreen } from "../screens/SwapScreen";
import { DepositQRScreen } from "../screens/DepositQRScreen";
import { DepositOptionsScreen } from "../screens/DepositOptionsScreen";
import { LogoutScreen } from "../screens/LogoutScreen";
import { InboxScreen } from "../screens/InboxScreen";
import { AccountDetailScreen } from "../screens/AccountDetailScreen";
import { ReceiptScreen } from "../screens/ReceiptScreen";
import { TransferScreen } from "../screens/TransferScreen";
import { NewTransferScreen } from "../screens/NewTransferScreen";
import { AmountInputScreen } from "../screens/AmountInputScreen";
import { SuccessScreen } from "../screens/SuccessScreen";
import { WithdrawScreen } from "../screens/WithdrawScreen";
import { BridgeScreen } from "../screens/BridgeScreen";
import { TransactionHistoryScreen } from "../screens/TransactionHistoryScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { AdminDashboardScreen } from "../screens/AdminDashboardScreen";
import { supabase } from "../../lib/supabaseClient";
import { ArcAppKitAdapter } from "../../services/arc-app-kit/adapter";
import { ShieldAlert } from "lucide-react";

const slideFadeVariants: Variants = {
  initial: { opacity: 0, x: 16, },
  animate: { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1], } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.22, ease: [0.7, 0, 0.84, 0], } }
};

interface ViewRouterProps {
  isLoggingIn: boolean;
  loginEmail: string;
  setLoginEmail: (email: string) => void;
  setIsLoggingIn: (loading: boolean) => void;
}

export const ViewRouter = React.memo(({ isLoggingIn, loginEmail, setLoginEmail, setIsLoggingIn }: ViewRouterProps) => {
  const {
    viewState, setViewState, registeredUser, setRegisteredUser, receiptSource, setReceiptSource,
    selectedContact, setSelectedContact, transferAmount, setTransferAmount, setTransferMemo,
    selectedShortcuts, setSelectedTransaction, displayToast, balance, fetchBalance, fetchTransactions
  } = useApp();

  const onNavigate = React.useCallback((view: ViewState) => setViewState(view), [setViewState]);
  const userName = registeredUser?.username || "RAKYAN INUKERTAPATI";
  const [platformConfig, setPlatformConfig] = React.useState<any>(null);

  React.useEffect(() => {
    const shouldFetch = registeredUser !== null || viewState === 'home';
    if (!shouldFetch) return;

    const controller = new AbortController();
    const loadConfig = async () => {
      try {
        const res = await fetch("/api/admin/config", { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setPlatformConfig(data);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') console.debug("Transient config fetch failure:", err.message);
      }
    };

    loadConfig();
    const interval = setInterval(loadConfig, 15000);
    return () => { controller.abort(); clearInterval(interval); };
  }, [registeredUser, viewState]);

  const renderLockedScreen = (title: string, description: string) => (
    <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
      <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mb-4 text-amber-500 shadow-sm animate-pulse">
        <ShieldAlert size={28} />
      </div>
      <h2 className="text-base font-extrabold text-slate-800 leading-tight">{title}</h2>
      <p className="text-xs text-slate-500 mt-2 max-w-[280px] leading-relaxed">{description}</p>
      <div className="mt-4 p-2.5 bg-slate-100 border border-slate-200/60 rounded-xl text-[10.5px] text-slate-500 font-medium font-mono">
        POLICY_CODE: ADM_FORBIDDEN_SCREEN
      </div>
      <button onClick={() => setViewState("home")} className="mt-6 px-6 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold text-[12px] rounded-xl active:scale-95 transition-all shadow-sm cursor-pointer">
        Kembali ke Beranda
      </button>
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div key={viewState} variants={slideFadeVariants} initial="initial" animate="animate" exit="exit" className="w-full h-full flex flex-col transform-gpu will-change-transform animate-in fade-in duration-300 ease-out">
        {viewState === "splash" && (
        <LoginScreen
          hasIdentity={!!registeredUser}
          onShowToast={displayToast}
          isLoading={isLoggingIn}
          onLogin={async (email) => { setLoginEmail(email); setViewState("password"); }}
          onRegister={() => setViewState("register")}
        />
        )}
        {viewState === "register" && (
          <RegisterWeb3Screen onBack={() => setViewState("splash")} onComplete={(data) => { setRegisteredUser(data); setViewState("registerSuccess"); }} />
        )}
        {viewState === "registerSuccess" && (
          <RegisterSuccessScreen username={registeredUser?.username} email={registeredUser?.email} walletAddress={registeredUser?.walletAddress} onContinue={() => setViewState("home")} />
        )}
        {viewState === "password" && (
          <PasswordScreen email={loginEmail} onBack={() => setViewState("splash")} isLoading={isLoggingIn} onLogin={async (email, password) => {
            setIsLoggingIn(true);
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) { displayToast(error.message); setIsLoggingIn(false); return; }
            setIsLoggingIn(false);
            setViewState("home");
          }} onForgotPassword={() => {}} />
        )}
        {viewState === "settings" && <SettingsScreen onBack={() => setViewState("home")} onNamaPanggilan={() => {}} onEmail={() => {}} onShowToast={displayToast} />}
        {viewState === "swap" && (platformConfig && platformConfig.swapEnabled === false ? renderLockedScreen("Fitur Swap Pool USDC", "Layanan pertukaran aset dibekukan sementara oleh Admin untuk penyeimbangan likuiditas.") : <SwapScreen onBack={() => setViewState("home")} />)}
        {viewState === "receive" && <DepositQRScreen onBack={() => setViewState("home")} />}
        {viewState === "depositOptions" && <DepositOptionsScreen onBack={() => setViewState("home")} onSelectUSDC={() => setViewState("receive")} onSelectVA={() => {}} onSelectQRIS={() => {}} onSelectWithdraw={() => setViewState("withdraw")} platformConfig={platformConfig} />}
        {viewState === "logout" && <LogoutScreen onBack={() => setViewState("home")} onLogout={async () => { await supabase.auth.signOut(); }} />}
        {viewState === "inbox" && <InboxScreen onBack={() => setViewState("home")} onTransactionClick={(tx) => { setSelectedTransaction(tx); setReceiptSource("inbox"); setViewState("receipt"); }} />}
        {viewState === "accountDetail" && <AccountDetailScreen userName={userName} onBack={() => setViewState("home")} onTransfer={() => setViewState("transfer")} onReceive={() => setViewState("receive")} onTransactionClick={(tx) => { setSelectedTransaction(tx); setReceiptSource("accountDetail"); setViewState("receipt"); }} />}
        {viewState === "receipt" && <ReceiptScreen onBack={() => setViewState(receiptSource)} />}
        {viewState === "transfer" && (platformConfig && platformConfig.transferEnabled === false ? renderLockedScreen("Kirim Saldo & Transfer", "Transfer Peer-to-Peer ditutup sementara karena adanya pemeliharaan jaringan.") : <TransferScreen onBack={() => setViewState("home")} onNewTransfer={() => setViewState("newTransfer")} onSelectContact={(contact) => { setSelectedContact(contact); setViewState("amountInput"); }} onBatchTransfer={() => {}} />)}
        {viewState === "newTransfer" && (platformConfig && platformConfig.transferEnabled === false ? renderLockedScreen("Kirim Saldo & Transfer", "Transfer Peer-to-Peer ditutup sementara karena adanya pemeliharaan jaringan.") : <NewTransferScreen onBack={() => setViewState("transfer")} onSelectContact={(contact) => { setSelectedContact(contact); setViewState("amountInput"); }} />)}
        {viewState === "amountInput" && selectedContact && (
          <AmountInputScreen contact={selectedContact} onBack={() => setViewState("transfer")} onNext={async (amount, memo) => {
            const numAmount = parseFloat(amount);
            if (numAmount < 1) { displayToast("Minimum transfer amount is 1 USDC."); return; }
            if (numAmount > balance) { displayToast("Insufficient USDC for transfer or gas."); return; }
            setTransferAmount(amount); setTransferMemo(memo); setViewState("processing");
            try { 
              await ArcAppKitAdapter.sendUnifiedBalance(numAmount, selectedContact.account, memo);
              await fetchBalance(); await fetchTransactions(); setViewState("success"); 
            } catch (error) { 
              console.error(error); displayToast("Transfer failed. Please try again."); setViewState("transfer"); 
            }
          }} />
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
            </div>
          </div>
        )}
        {viewState === "success" && selectedContact && <SuccessScreen contact={selectedContact} amount={transferAmount} onClose={() => setViewState("home")} />}
        {viewState === "withdraw" && (platformConfig && platformConfig.withdrawEnabled === false ? renderLockedScreen("Tarik Saldo (Withdraw)", "Penarikan USDC keluar ekosistem ditangguhkan sementara demi keamanan audit kas.") : <WithdrawScreen onBack={() => setViewState("depositOptions")} onSuccess={() => setViewState("home")} />)}
        {viewState === "bridge" && (platformConfig && platformConfig.bridgeEnabled === false ? renderLockedScreen("CCTP Bridge Lintas Rantai", "Jembatan pembakaran & pencetakan USDC Circle sedang dinonaktifkan sementara.") : <BridgeScreen onBack={() => setViewState("home")} onSuccess={() => setViewState("home")} />)}
        {viewState === "transactionHistory" && <TransactionHistoryScreen onBack={() => setViewState("home")} />}
        {viewState === "adminDashboard" && <AdminDashboardScreen onBack={() => setViewState("home")} onNavigate={setViewState} />}
        {viewState === "home" && <HomeScreen userName={userName} selectedShortcuts={selectedShortcuts} onNavigate={onNavigate} platformConfig={platformConfig} />}
      </motion.div>
    </AnimatePresence>
  );
});
