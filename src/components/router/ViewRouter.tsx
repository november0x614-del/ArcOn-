import React from "react";
import { motion, AnimatePresence, Variants } from "motion/react";
import { ViewState } from "../../types";
import { useApp } from "../../contexts/AppContext";
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
import { BatchTransferScreen } from "../screens/BatchTransferScreen";
import { WithdrawScreen } from "../screens/WithdrawScreen";
import { BridgeScreen } from "../screens/BridgeScreen";
import { TransactionHistoryScreen } from "../screens/TransactionHistoryScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { AdminDashboardScreen } from "../screens/AdminDashboardScreen";
import { supabase } from "../../lib/supabaseClient";
import { BackendClient } from "../../services/api/index";
import { useContacts } from "../../hooks/useContacts";
import { ShieldAlert } from "lucide-react";

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
            setPlatformConfig(data);
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
