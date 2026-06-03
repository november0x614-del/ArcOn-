import React from "react";
import { motion, AnimatePresence, Variants } from "motion/react";
import { ViewState } from "../../types";
import { useApp } from "../../contexts/AppContext";
import { useStore } from "../../store/useStore";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterWeb3Screen } from "../screens/RegisterWeb3Screen";
import { RegisterSuccessScreen } from "../screens/RegisterSuccessScreen";
import { PasswordScreen } from "../screens/PasswordScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { NamaPanggilanScreen } from "../screens/NamaPanggilanScreen";
import { EmailScreen } from "../screens/EmailScreen";
import { OtherAccountsScreen } from "../screens/OtherAccountsScreen";
import { TransferSuccessScreen } from "../screens/TransferSuccessScreen";
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
import { MintNFTScreen } from "../screens/MintNFTScreen";
import { TransactionHistoryScreen } from "../screens/TransactionHistoryScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { AdminDashboardScreen } from "../screens/AdminDashboardScreen";
import { supabase } from "../../lib/supabaseClient";
import { BackendClient } from "../../services/api/index";
import { useContacts } from "../../hooks/useContacts";
import {
  ShieldAlert,
  Home,
  Mail,
  Scan,
  Settings,
  LogOut,
  Bot,
  ChevronRight,
  ShoppingCart,
  Package,
} from "lucide-react";

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
      transactions,
      readReceiptIds,
    } = useApp();

    const { realContacts } = useContacts();

    const onNavigate = React.useCallback(
      (view: ViewState) => {
        if (view === "home" && window.innerWidth >= 1024) {
          setViewState("transfer");
        } else {
          setViewState(view);
        }
      },
      [setViewState],
    );

    const userName = registeredUser?.username || "Account Holder";

    const [platformConfig, setPlatformConfig] = React.useState<any>(null);
    const [transferSuccessData, setTransferSuccessData] = React.useState<any>(null);

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

    const isAuthenticatedView =
      registeredUser &&
      ![
        "splash",
        "register",
        "registerSuccess",
        "password",
        "forgotPassword",
        "namaPanggilan",
      ].includes(viewState);

    const unreadCount = React.useMemo(() => {
      if (!Array.isArray(transactions)) return 0;
      return transactions.filter(
        (tx) => (tx.status === "success" || tx.status === "failed") && !readReceiptIds.includes(tx.id)
      ).length;
    }, [transactions, readReceiptIds]);

    const { cart: cartQuantities } = useStore();
    const cartCount = React.useMemo(() => {
      return Object.values(cartQuantities).reduce((a, b) => (a as number) + (b as number), 0) as number;
    }, [cartQuantities]);

    const [ecommerceInnerView, setEcommerceInnerView] = React.useState<"list" | "detail" | "checkout" | "success">("list");

    React.useEffect(() => {
      const handleViewChange = (e: Event) => {
        const customEvent = e as CustomEvent<"list" | "detail" | "checkout" | "success">;
        setEcommerceInnerView(customEvent.detail);
      };

      window.addEventListener("ecommerce-view-state-changed", handleViewChange);
      return () => {
        window.removeEventListener("ecommerce-view-state-changed", handleViewChange);
      };
    }, []);

    const [isDesktop, setIsDesktop] = React.useState(false);
    React.useEffect(() => {
      const checkDesktop = () => {
        const currentZoom = parseFloat((document.documentElement.style as any).zoom || "1");
        const w = window.innerWidth * currentZoom;
        const h = window.innerHeight * currentZoom;
        
        // Horizontal tablet: landscape with physical width between 768 and 1220
        const isHorizontalTablet = w > h && w >= 768 && w < 1220;
        
        const targetZoom = isHorizontalTablet ? "0.75" : "1";
        if ((document.documentElement.style as any).zoom !== targetZoom) {
          (document.documentElement.style as any).zoom = targetZoom;
          setTimeout(checkDesktop, 0);
          return;
        }

        setIsDesktop(window.innerWidth >= 1024 || (window.innerWidth > window.innerHeight && window.innerWidth >= 768));
      };
      checkDesktop();
      window.addEventListener("resize", checkDesktop);
      return () => {
        window.removeEventListener("resize", checkDesktop);
        try {
          (document.documentElement.style as any).zoom = "1";
        } catch (_) {}
      };
    }, []);

    React.useEffect(() => {
      if (viewState === "home" && isDesktop) {
        setViewState("transfer");
      }
    }, [viewState, isDesktop, setViewState]);

    const desktopFeatures = [
      "transfer",
      "newTransfer",
      "amountInput",
      "batchTransfer",
      "receive",
      "depositOptions",
      "receiveVA",
      "receiveQRIS",
      "bayarVA",
      "scanQR",
      "swap",
      "stablestake",
      "bridge",
      "mintNFT",
      "transactionHistory",
      "inbox",
      "settings",
      "namaPanggilan",
      "email",
      "otherAccounts",
      "manageFavorites",
      "receipt",
    ];

    const isDesktopFeatureView =
      isDesktop && desktopFeatures.includes(viewState);
    const motionKey = isDesktopFeatureView ? "home" : viewState;

    const renderLayoutWrapper = (children: React.ReactNode) => {
      if (!isAuthenticatedView) {
        return (
          <div className="flex w-full h-[100dvh] bg-[#ecf5fc] text-left justify-center items-center p-4">
            <div className={`w-full h-full flex flex-col relative overflow-hidden bg-white font-sans transition-all duration-300 ${isDesktop ? "max-w-[480px] h-[92%] rounded-[32px] shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-slate-200/50" : "sm:max-w-[480px] sm:h-[92%] sm:rounded-[32px] sm:shadow-xl sm:border border-slate-100"}`}>
              {children}
            </div>
          </div>
        );
      }

      return (
        <div className="flex w-full h-full bg-[#ecf5fc] text-left justify-center">
          {/* Desktop/Tablet Landscape Sidebar */}
          <div className={`${isDesktop ? "flex" : "hidden"} w-[260px] flex-col bg-white border-r border-slate-200 shrink-0 h-full relative z-[100] p-6 text-left shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}>
            <div className="mb-8">
              <h2 className="text-2xl font-black italic tracking-tight text-slate-800">
                Lounge
              </h2>
            </div>
            <nav className="flex-1 flex flex-col gap-2">
              <button
                onClick={() => onNavigate(isDesktop ? "transfer" : "home")}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl ${(["home", ...desktopFeatures].includes(viewState) && !["inbox", "scanQR", "settings", "namaPanggilan", "email", "otherAccounts", "receipt"].includes(viewState)) || (viewState === "receipt" && receiptSource !== "inbox") ? "bg-slate-900 text-white shadow-[0_4px_12px_rgba(15,23,42,0.15)] shadow-slate-900/20" : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"} font-bold transition-all text-left border-0 cursor-pointer active:scale-95`}
              >
                <Home size={20} />
                <span className="text-[14px]">Home</span>
              </button>
              <button
                onClick={() => onNavigate("inbox")}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl ${viewState === "inbox" || (viewState === "receipt" && receiptSource === "inbox") ? "bg-slate-900 text-white shadow-[0_4px_12px_rgba(15,23,42,0.15)] shadow-slate-900/20" : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"} font-bold transition-all text-left border-0 relative cursor-pointer active:scale-95`}
              >
                <Mail size={20} />
                <span className="text-[14px]">Inbox</span>
                {unreadCount > 0 && (
                  <span className="absolute right-4 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black border border-white leading-none">
                    {unreadCount}
                  </span>
                )}
              </button>
              {(!platformConfig || platformConfig.scanQrEnabled !== false) && (
                <button
                  onClick={() => onNavigate("scanQR")}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl ${viewState === "scanQR" ? "bg-slate-900 text-white shadow-[0_4px_12px_rgba(15,23,42,0.15)] shadow-slate-900/20" : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"} font-bold transition-all text-left border-0 relative cursor-pointer active:scale-95`}
                >
                  <Scan size={20} />
                  <span className="text-[14px]">Scan QR/Pay</span>
                </button>
              )}
              <button
                onClick={() => onNavigate("settings")}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl ${["settings", "namaPanggilan", "email", "otherAccounts"].includes(viewState) ? "bg-slate-900 text-white shadow-[0_4px_12px_rgba(15,23,42,0.15)] shadow-slate-900/20" : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"} font-bold transition-all text-left border-0 relative cursor-pointer active:scale-95`}
              >
                <Settings size={20} />
                <span className="text-[14px]">Settings</span>
              </button>

              <button
                onClick={() => {
                  onNavigate("ecommerce");
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent("ecommerce-navigate-list"));
                  }, 50);
                }}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl ${viewState === "ecommerce" ? "bg-slate-900 text-white shadow-[0_4px_12px_rgba(15,23,42,0.15)] shadow-slate-900/20" : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"} font-bold transition-all text-left border-0 relative cursor-pointer active:scale-95`}
              >
                <Package size={20} />
                <span className="text-[14px]">Marketplace</span>
              </button>

              {viewState === "ecommerce" && (
                <div className="flex flex-col gap-1 pl-4 border-l-2 border-slate-100 ml-6 my-1 animate-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("ecommerce-navigate-list"));
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-bold transition-all border-0 cursor-pointer text-left ${
                      ecommerceInnerView !== "checkout"
                        ? "bg-slate-100 text-slate-900"
                        : "bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <span>All Products</span>
                  </button>
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("ecommerce-navigate-checkout"));
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-bold transition-all border-0 cursor-pointer text-left w-full ${
                      ecommerceInnerView === "checkout"
                        ? "bg-slate-100 text-slate-900"
                        : "bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingCart size={14} />
                      <span>Shopping Cart</span>
                    </span>
                    {cartCount > 0 && (
                      <span className="bg-emerald-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full">
                        {cartCount}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </nav>

            <div className="mt-auto">
              {(!platformConfig || platformConfig.aiAgentEnabled !== false) && (
                <div className="mb-4">
                  <div
                    className="bg-gradient-to-r from-indigo-50 to-blue-50 py-2.5 px-4 rounded-xl flex items-center justify-between gap-3 border border-indigo-100 relative cursor-pointer hover:bg-indigo-100/50 transition-colors w-full active:scale-95"
                    onClick={() => onNavigate("aiAgent")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-1.5 rounded-lg text-slate-800 shrink-0 border border-indigo-50 shadow-sm flex items-center justify-center w-[30px] h-[30px]">
                        <Bot size={18} />
                      </div>
                      <span className="text-[14px] font-bold text-slate-800">
                        Lounge Assistant
                      </span>
                    </div>
                    <div className="bg-white rounded-full p-1 shadow-sm text-slate-800 shrink-0 border border-indigo-50 flex items-center justify-center w-5 h-5">
                      <ChevronRight size={12} />
                    </div>
                  </div>
                </div>
              )}
              <div className="w-full h-[1px] bg-slate-100 mb-4"></div>
              <button
                onClick={() => onNavigate("logout")}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-slate-50 text-slate-600 font-bold hover:bg-red-50 hover:text-red-600 transition-all border-0 cursor-pointer active:scale-95"
              >
                <LogOut size={18} />
                <span className="text-[14px]">Logout</span>
              </button>
            </div>
          </div>

          {/* Main Content Dashboard Container */}
          <div className="flex-1 flex justify-center h-full relative w-full items-start bg-[#ecf5fc]">
            <div className={`w-full h-full flex flex-col relative overflow-hidden bg-white font-sans transition-all duration-300 ${isDesktop ? "lg:max-w-[1200px] border-x border-slate-200/50 shadow-xl" : "sm:max-w-[680px] md:max-w-[720px] sm:shadow-lg sm:border-x sm:border-slate-100 sm:h-full"}`}>
              {children}
            </div>
          </div>
        </div>
      );
    };

    const activeViewComponent = (
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

              const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
              });

              if (error) {
                displayToast(error.message);
                setIsLoggingIn(false);
                return;
              }

              // Explicitly wait for wallet info to provide immediate feedback instead of hanging on the Loading screen
              try {
                if (data.session?.user) {
                  const user = data.session.user;
                  const response = await fetch(`/api/debug-wallet/${user.id}`);
                  if (response.ok) {
                    const walletInfo = await response.json();
                    
                    // Immediate store sync for fast transition
                    const { setRegisteredUser } = useStore.getState();
                    setRegisteredUser({
                      username: user.user_metadata?.full_name || user.user_metadata?.username || "Arc User",
                      email: user.email || "",
                      isVerified: true,
                      walletId: walletInfo.wallet_id,
                      walletAddress: walletInfo.wallet_address,
                      supabaseUid: user.id
                    });
                  }
                }
              } catch (e) {
                console.warn("Could not pre-fetch wallet during login", e);
              }

              setIsLoggingIn(false);
              setViewState("home");
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
            <EcommerceScreen onBack={() => setViewState("home")} isDesktop={isDesktop} />
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
            <ReceiveQRISScreen onBack={() => setViewState("depositOptions")} />
          ))}

        {viewState === "logout" && (
          <LogoutScreen
            onBack={() => setViewState("home")}
            onLogout={async () => {
              await supabase.auth.signOut();
            }}
          />
        )}

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

        {viewState === "transferSuccess" && transferSuccessData && (
          <TransferSuccessScreen
            txId={transferSuccessData.txId}
            amount={transferSuccessData.amount}
            recipientName={transferSuccessData.recipientName}
            fee={transferSuccessData.fee}
            onBack={() => { setViewState("home"); fetchTransactions(); }}
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
              hideBack={isDesktop}
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

              // Dynamic Check: Minimum Transfer
              const minTransfer = parseFloat(
                platformConfig?.minTransferAmount || "1",
              );
              if (numAmount < minTransfer) {
                displayToast(`Minimum transfer amount is ${minTransfer} USDC.`);
                return;
              }

              // Dynamic Check: Fees
              let fee = 0;
              if (platformConfig?.withdrawFee) {
                fee =
                  parseFloat(
                    platformConfig.withdrawFee.replace(/[^0-9.]/g, ""),
                  ) || 0;
              }

              const totalWithFee = numAmount + fee;
              if (totalWithFee > balance) {
                displayToast(
                  `Insufficient USDC balance. Need ${totalWithFee.toFixed(2)} USDC ${fee > 0 ? `(includes ${fee.toFixed(2)} Platform Fee)` : ""}.`,
                );
                return;
              }

              setTransferAmount(amount);
              setTransferMemo(memo);

              try {
                const result = await BackendClient.sendUnifiedBalance(
                  numAmount,
                  selectedContact.account,
                  memo,
                  selectedContact.name,
                );

                await fetchBalance();
                await fetchTransactions();

                setTransferSuccessData({
                  txId: result.txId || `send_${Math.random().toString(36).substring(7)}`,
                  amount: numAmount.toString(),
                  recipientName: selectedContact.name,
                  fee: fee > 0 ? fee.toFixed(2) : undefined
                });
                setViewState("transferSuccess");

                displayToast(`Transfer to ${selectedContact.name} initiated!`);
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
                setSelectedTransaction({
                  internal_ref: txId,
                  type: "batchTransfer",
                } as any);
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
              hideBack={isDesktop}
              onBack={() => setViewState("depositOptions")}
              onSuccess={() => {
                fetchBalance();
                fetchTransactions();
                // No navigation to home - stay in withdraw or show success state within withdraw
              }}
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
              onSuccess={() => {
                fetchBalance();
                fetchTransactions();
                // Stay in feature
              }}
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

        {viewState === "mintNFT" && (
          <MintNFTScreen onBack={() => setViewState("home")} />
        )}

        {viewState === "home" && !isDesktopFeatureView && (
          <HomeScreen
            userName={userName}
            selectedShortcuts={selectedShortcuts}
            onNavigate={onNavigate}
            platformConfig={platformConfig}
            activeView={viewState}
            isDesktop={isDesktop}
          />
        )}
      </>
    );

    return renderLayoutWrapper(
      <>
        <AnimatePresence mode="wait">
          <motion.div
            key={motionKey}
            variants={slideFadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-full flex flex-col transform-gpu will-change-transform animate-in fade-in duration-300 ease-out"
          >
            {isDesktopFeatureView ? (
              <HomeScreen
                userName={userName}
                selectedShortcuts={selectedShortcuts}
                onNavigate={onNavigate}
                platformConfig={platformConfig}
                activeView={viewState}
                isDesktop={isDesktop}
                desktopRightColumn={
                  <div className="w-full h-full relative flex-1 flex flex-col font-sans">
                    {activeViewComponent}
                  </div>
                }
              />
            ) : (
              activeViewComponent
            )}
          </motion.div>
        </AnimatePresence>
      </>,
    );
  },
);
