import React from "react";
import { motion, AnimatePresence, Variants } from "motion/react";
import { ViewState } from "../../types";
import { useApp } from "../../contexts/AppContext";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterWeb3Screen } from "../screens/RegisterWeb3Screen";
import { RegisterSuccessScreen } from "../screens/RegisterSuccessScreen";
import { PasswordScreen } from "../screens/PasswordScreen";
import { SwapScreen } from "../screens/SwapScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { supabase } from "../../lib/supabaseClient";
import { BackendClient } from "../../services/api/index";
import { useContacts } from "../../hooks/useContacts";
import { ShieldAlert, Loader2 } from "lucide-react";

// Lazy load secondary screens to improve initial load and rendering performance
const ForgotPasswordScreen = React.lazy(() => import("../screens/ForgotPasswordScreen").then(m => ({ default: m.ForgotPasswordScreen })));
const SettingsScreen = React.lazy(() => import("../screens/SettingsScreen").then(m => ({ default: m.SettingsScreen })));
const NamaPanggilanScreen = React.lazy(() => import("../screens/NamaPanggilanScreen").then(m => ({ default: m.NamaPanggilanScreen })));
const EmailScreen = React.lazy(() => import("../screens/EmailScreen").then(m => ({ default: m.EmailScreen })));
const OtherAccountsScreen = React.lazy(() => import("../screens/OtherAccountsScreen").then(m => ({ default: m.OtherAccountsScreen })));
const BayarVAScreen = React.lazy(() => import("../screens/BayarVAScreen").then(m => ({ default: m.BayarVAScreen })));
const EcommerceScreen = React.lazy(() => import("../screens/EcommerceScreen").then(m => ({ default: m.EcommerceScreen })));
const MerchantScreen = React.lazy(() => import("../screens/MerchantScreen").then(m => ({ default: m.MerchantScreen })));
const FaucetScreen = React.lazy(() => import("../screens/FaucetScreen").then(m => ({ default: m.FaucetScreen })));
const DepositQRScreen = React.lazy(() => import("../screens/DepositQRScreen").then(m => ({ default: m.DepositQRScreen })));
const StablestakeScreen = React.lazy(() => import("../screens/StablestakeScreen").then(m => ({ default: m.StablestakeScreen })));
const DepositOptionsScreen = React.lazy(() => import("../screens/DepositOptionsScreen").then(m => ({ default: m.DepositOptionsScreen })));
const ReceiveVAScreen = React.lazy(() => import("../screens/ReceiveVAScreen").then(m => ({ default: m.ReceiveVAScreen })));
const ReceiveQRISScreen = React.lazy(() => import("../screens/ReceiveQRISScreen").then(m => ({ default: m.ReceiveQRISScreen })));
const LogoutScreen = React.lazy(() => import("../screens/LogoutScreen").then(m => ({ default: m.LogoutScreen })));
const ArcBirdScreen = React.lazy(() => import("../screens/ArcBirdScreen").then(m => ({ default: m.ArcBirdScreen })));
const InboxScreen = React.lazy(() => import("../screens/InboxScreen").then(m => ({ default: m.InboxScreen })));
const AccountDetailScreen = React.lazy(() => import("../screens/AccountDetailScreen").then(m => ({ default: m.AccountDetailScreen })));
const ReceiptScreen = React.lazy(() => import("../screens/ReceiptScreen").then(m => ({ default: m.ReceiptScreen })));
const ManageFavoritesScreen = React.lazy(() => import("../screens/ManageFavoritesScreen").then(m => ({ default: m.ManageFavoritesScreen })));
const ConnectEWalletScreen = React.lazy(() => import("../screens/ConnectEWalletScreen").then(m => ({ default: m.ConnectEWalletScreen })));
const ScanQRScreen = React.lazy(() => import("../screens/ScanQRScreen").then(m => ({ default: m.ScanQRScreen })));
const AIAgentScreen = React.lazy(() => import("../screens/AIAgentScreen").then(m => ({ default: m.AIAgentScreen })));
const TransferScreen = React.lazy(() => import("../screens/TransferScreen").then(m => ({ default: m.TransferScreen })));
const NewTransferScreen = React.lazy(() => import("../screens/NewTransferScreen").then(m => ({ default: m.NewTransferScreen })));
const AmountInputScreen = React.lazy(() => import("../screens/AmountInputScreen").then(m => ({ default: m.AmountInputScreen })));
const BatchTransferScreen = React.lazy(() => import("../screens/BatchTransferScreen").then(m => ({ default: m.BatchTransferScreen })));
const WithdrawScreen = React.lazy(() => import("../screens/WithdrawScreen").then(m => ({ default: m.WithdrawScreen })));
const BridgeScreen = React.lazy(() => import("../screens/BridgeScreen").then(m => ({ default: m.BridgeScreen })));
const TransactionHistoryScreen = React.lazy(() => import("../screens/TransactionHistoryScreen").then(m => ({ default: m.TransactionHistoryScreen })));
const AdminDashboardScreen = React.lazy(() => import("../screens/AdminDashboardScreen").then(m => ({ default: m.AdminDashboardScreen })));

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
    },
  },
  exit: {
    opacity: 0,
    x: -16,
    transition: {
      duration: 0.22,
      ease: [0.7, 0, 0.84, 0], // easeInQuad
    },
  },
};

interface ViewRouterProps {
  isLoggingIn: boolean;
  loginEmail: string;
  setLoginEmail: (email: string) => void;
  setIsLoggingIn: (loading: boolean) => void;
}

export const ViewRouter = React.memo(
  ({
    isLoggingIn,
    loginEmail,
    setLoginEmail,
    setIsLoggingIn,
  }: ViewRouterProps) => {
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
      fetchTransactions,
    } = useApp();

    const { realContacts } = useContacts();

    const onNavigate = React.useCallback(
      (view: ViewState) => setViewState(view),
      [setViewState],
    );

    const userName = registeredUser?.username || "Account Holder";

    const [platformConfig, setPlatformConfig] = React.useState<any>(null);

    React.useEffect(() => {
      // Only fetch config if user is at least partially logged in or already at home
      const shouldFetch = registeredUser !== null || viewState === "home";
      if (!shouldFetch) return;

      const controller = new AbortController();
      const loadConfig = async () => {
        try {
          const res = await fetch("/api/admin/config", {
            signal: controller.signal,
          });
          if (res.ok) {
            const data = await res.json();
            // Only update if data is actually different to avoid unnecessary re-renders
            setPlatformConfig((prev: any) => {
              if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
              return data;
            });
          }
        } catch (err: any) {
          if (err.name !== "AbortError") {
            console.debug("Transient config fetch failure:", err.message);
          }
        }
      };

      loadConfig();
      const interval = setInterval(loadConfig, 15000);
      return () => {
        controller.abort();
        clearInterval(interval);
      };
    }, [registeredUser, viewState]);

    const renderLockedScreen = (title: string, description: string) => {
      return (
        <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mb-4 text-amber-500 shadow-sm animate-pulse">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-base font-extrabold text-slate-800 leading-tight">
            {title}
          </h2>
          <p className="text-xs text-slate-500 mt-2 max-w-[280px] leading-relaxed">
            {description}
          </p>
          <div className="mt-4 p-2.5 bg-slate-100 border border-slate-200/60 rounded-xl text-[10.5px] text-slate-500 font-medium font-mono">
            POLICY_CODE: ADM_FORBIDDEN_SCREEN
          </div>
          <button
            onClick={() => setViewState("home")}
            className="mt-6 px-6 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold text-[12px] rounded-xl active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      );
    };

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
          <React.Suspense fallback={
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
              <p className="mt-4 text-[13px] font-medium text-slate-500">Loading module...</p>
            </div>
          }>
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
              isVerified={registeredUser?.isVerified}
              walletAddress={registeredUser?.walletAddress}
              onContinue={() => {
                if (registeredUser?.isVerified === false) {
                  // Direct to splash/login if not verified
                  setViewState("splash");
                } else {
                  setViewState("home");
                }
              }}
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
                  password,
                });

                if (error) {
                  displayToast(error.message);
                  setIsLoggingIn(false);
                  return;
                }

                // We NO LONGER call setViewState("home") here.
                // The central handleUserSession in App.tsx will detect the new session,
                // verify/provision the wallet, and then navigate to "home" securely.
                // We keep setIsLoggingIn(true) so the loading spinner stays visible 
                // until the transition happens from App.tsx.
              }}
              onForgotPassword={() => setViewState("forgotPassword")}
            />
          )}

          {viewState === "forgotPassword" && (
            <ForgotPasswordScreen 
              onBack={() => setViewState("password")} 
              initialEmail={loginEmail}
            />
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

          {viewState === "ecommerce" &&
            (platformConfig && platformConfig.ecommerceEnabled === false ? (
              renderLockedScreen(
                "E-Commerce Marketplace Module",
                "Marketplace and product purchase features are temporarily disabled by the System Administrator.",
              )
            ) : (
              <EcommerceScreen onBack={() => setViewState("home")} />
            ))}

          {viewState === "merchant" &&
            (platformConfig && platformConfig.merchantEnabled === false ? (
              renderLockedScreen(
                "F&B Merchant POS Module",
                "Digital cashier features for merchant partners are temporarily disabled for regional restrictions.",
              )
            ) : (
              <MerchantScreen onBack={() => setViewState("home")} />
            ))}

          {viewState === "faucet" &&
            (platformConfig && platformConfig.faucetEnabled === false ? (
              renderLockedScreen(
                "Arc Testnet Faucet Claim",
                "Free gas token distribution is temporarily closed by the Devnet Warden.",
              )
            ) : (
              <FaucetScreen onBack={() => setViewState("home")} />
            ))}

          {viewState === "bayarVA" &&
            (platformConfig && platformConfig.vaEnabled === false ? (
              renderLockedScreen(
                "Virtual Account (VA) Payment Code",
                "VA bill payment service is temporarily suspended by Admin.",
              )
            ) : (
              <BayarVAScreen onBack={() => setViewState("home")} />
            ))}

          {viewState === "email" && (
            <EmailScreen onBack={() => setViewState("settings")} />
          )}

          {viewState === "otherAccounts" && (
            <OtherAccountsScreen onBack={() => setViewState("home")} />
          )}

          {viewState === "swap" &&
            (platformConfig && platformConfig.swapEnabled === false ? (
              renderLockedScreen(
                "USDC Swap Pool Feature",
                "Asset exchange service is temporarily frozen by Admin for liquidity balancing.",
              )
            ) : (
              <SwapScreen onBack={() => setViewState("home")} />
            ))}

          {viewState === "receive" && (
            <DepositQRScreen onBack={() => setViewState("home")} />
          )}

          {viewState === "stablestake" &&
            (platformConfig && platformConfig.stableStakeEnabled === false ? (
              renderLockedScreen(
                "Stablestake Deposit Yield",
                "Staking pool is currently locked for native-USDC interest consolidation.",
              )
            ) : (
              <StablestakeScreen onBack={() => setViewState("home")} />
            ))}

          {viewState === "depositOptions" && (
            <DepositOptionsScreen
              onBack={() => setViewState("home")}
              onSelectUSDC={() => setViewState("receive")}
              onSelectVA={() => setViewState("receiveVA")}
              onSelectQRIS={() => setViewState("receiveQRIS")}
              onSelectWithdraw={() => setViewState("withdraw")}
              platformConfig={platformConfig}
            />
          )}

          {viewState === "receiveVA" &&
            (platformConfig && platformConfig.vaEnabled === false ? (
              renderLockedScreen(
                "Virtual Account (VA)",
                "Bank Virtual Account deposits are currently out of service.",
              )
            ) : (
              <ReceiveVAScreen onBack={() => setViewState("depositOptions")} />
            ))}

          {viewState === "receiveQRIS" &&
            (platformConfig && platformConfig.qrisEnabled === false ? (
               renderLockedScreen(
                "Standard QRIS Deposit",
                "QRIS payment code generation gateway is temporarily disabled by the payment processor.",
              )
            ) : (
              <ReceiveQRISScreen
                onBack={() => setViewState("depositOptions")}
              />
            ))}

          {viewState === "logout" && (
            <LogoutScreen
              onBack={() => setViewState("home")}
              onLogout={async () => {
                await supabase.auth.signOut();
              }}
            />
          )}

          {viewState === "arcswap" &&
            (platformConfig && platformConfig.swapEnabled === false ? (
              renderLockedScreen(
                "USDC Swap Pool Feature",
                "Asset exchange service is temporarily frozen by Admin for liquidity balancing.",
              )
            ) : (
              <SwapScreen onBack={() => setViewState("home")} />
            ))}

          {viewState === "arcbird" &&
            (platformConfig && platformConfig.arcBirdEnabled === false ? (
              renderLockedScreen(
                "Arc Bird Game",
                "Arc Bird Mini-App game is currently suspended for seasonal leaderboard updates.",
              )
            ) : (
              <ArcBirdScreen onBack={() => setViewState("home")} />
            ))}

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
                displayToast("Settings saved successfully.");
              }}
            />
          )}

          {viewState === "connectEWallet" &&
            (platformConfig &&
            platformConfig.eWalletConnectionEnabled === false ? (
              renderLockedScreen(
                "e-Wallet Integration",
                "Local e-Wallet balance withdrawal gateway is temporarily redirected by Admin.",
              )
            ) : (
              <ConnectEWalletScreen onBack={() => setViewState("home")} />
            ))}

          {viewState === "scanQR" &&
            (platformConfig && platformConfig.scanQrEnabled === false ? (
              renderLockedScreen(
                "QR Code Scanner",
                "Backend camera scanning sensor is temporarily disabled for license upgrades.",
              )
            ) : (
              <ScanQRScreen
                onBack={() => setViewState("home")}
                onScanResult={(contact) => {
                  setSelectedContact(contact);
                  setViewState("amountInput");
                }}
              />
            ))}

          {viewState === "aiAgent" &&
            (platformConfig && platformConfig.aiAgentEnabled === false ? (
              renderLockedScreen(
                "AI Agent Co-Pilot",
                "Financial AI Assistant is temporarily disabled by admin for cognitive regulation adjustments.",
              )
            ) : (
              <AIAgentScreen onBack={() => setViewState("home")} />
            ))}

          {viewState === "transfer" &&
            (platformConfig && platformConfig.transferEnabled === false ? (
              renderLockedScreen(
                "Send Balance & Transfer",
                "Peer-to-Peer transfers are temporarily closed due to network maintenance.",
              )
            ) : (
              <TransferScreen
                onBack={() => setViewState("home")}
                onNewTransfer={() => setViewState("newTransfer")}
                onSelectContact={(contact) => {
                  setSelectedContact(contact);
                  setViewState("amountInput");
                }}
                onBatchTransfer={() => setViewState("batchTransfer")}
              />
            ))}

          {viewState === "newTransfer" &&
            (platformConfig && platformConfig.transferEnabled === false ? (
              renderLockedScreen(
                "Send Balance & Transfer",
                "Peer-to-Peer transfers are temporarily closed due to network maintenance.",
              )
            ) : (
              <NewTransferScreen
                onBack={() => setViewState("transfer")}
                onSelectContact={(contact) => {
                  setSelectedContact(contact);
                  setViewState("amountInput");
                }}
              />
            ))}

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
                const totalWithFee = numAmount + 0.10;
                if (totalWithFee > balance) {
                  displayToast(`Insufficient USDC balance. Need ${totalWithFee.toFixed(2)} USDC (includes 0.10 Platform Fee).`);
                  return;
                }

                setTransferAmount(amount);
                setTransferMemo(memo);
                
                try {
                  await BackendClient.sendUnifiedBalance(
                    numAmount,
                    selectedContact.account,
                    memo,
                    selectedContact.name
                  );

                  await fetchBalance();
                  await fetchTransactions();
                  displayToast(`Transfer to ${selectedContact.name} initiated!`);
                  setViewState("transfer");
                } catch (error) {
                  console.error(error);
                  displayToast("Transfer failed. Please try again.");
                }
              }}
            />
          )}

          {viewState === "batchTransfer" &&
            (platformConfig && platformConfig.batchTransferEnabled === false ? (
              renderLockedScreen(
                "Mass Transfer (Batch)",
                "Instant multi-transfer is temporarily disabled for gas hoarding prevention.",
              )
            ) : (
              <BatchTransferScreen
                onBack={() => setViewState("transfer")}
                onViewReceipt={(txId) => {
                  setSelectedTransaction({ internal_ref: txId, type: "batchTransfer" } as any);
                  setReceiptSource("home");
                  setViewState("receipt");
                  fetchTransactions();
                }}
                contacts={realContacts}
              />
            ))}

          {viewState === "withdraw" &&
            (platformConfig && platformConfig.withdrawEnabled === false ? (
              renderLockedScreen(
                "Withdraw Balance",
                "USDC withdrawals outside the ecosystem are temporarily suspended for cash audit security.",
              )
            ) : (
              <WithdrawScreen
                onBack={() => setViewState("depositOptions")}
                onSuccess={() => setViewState("home")}
              />
            ))}

          {viewState === "bridge" &&
            (platformConfig && platformConfig.bridgeEnabled === false ? (
              renderLockedScreen(
                "Cross-Chain CCTP Bridge",
                "Circle USDC burn & mint bridge is temporarily disabled.",
              )
            ) : (
              <BridgeScreen
                onBack={() => setViewState("home")}
                onSuccess={() => setViewState("home")}
              />
            ))}

          {viewState === "transactionHistory" && (
            <TransactionHistoryScreen onBack={() => setViewState("home")} />
          )}

            {viewState === "adminDashboard" && (
              <AdminDashboardScreen
                onBack={() => setViewState("home")}
                onNavigate={setViewState}
              />
            )}
          </React.Suspense>

          {viewState === "home" && (
            <HomeScreen
              userName={userName}
              selectedShortcuts={selectedShortcuts}
              onNavigate={onNavigate}
              platformConfig={platformConfig}
            />
          )}
        </motion.div>
      </AnimatePresence>
    );
  },
);
