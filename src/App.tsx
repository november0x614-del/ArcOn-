import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { useApp } from "./contexts/AppContext";
import { useStore } from "./store/useStore";
import { supabase } from "./lib/supabaseClient";
import { ViewRouter } from "./components/router/ViewRouter";
import { ArcProvider } from "./contexts/ArcContext";

export default function App() {
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [loginEmail, setLoginEmail] = React.useState("");
  const {
    viewState,
    setViewState,
    fetchBalance,
    fetchTransactions,
    registeredUser,
    setRegisteredUser,
    resetState,
  } = useStore(
    useShallow((state) => ({
      viewState: state.viewState,
      setViewState: state.setViewState,
      fetchBalance: state.fetchBalance,
      fetchTransactions: state.fetchTransactions,
      registeredUser: state.registeredUser,
      setRegisteredUser: state.setRegisteredUser,
      resetState: state.resetState,
    })),
  );

  const handleUserSession = React.useCallback(
    async (user: any) => {
      try {
        let walletInfo: any = null;
        let isProvisioning = false;

        // 1. Initial check for existing wallet
        try {
          const response = await fetch(`/api/debug-wallet/${user.id}`);
          if (response.ok) {
            walletInfo = await response.json();
          }
        } catch (err) {
          console.warn(
            "Wallet lookup failed, will attempt provisioning if needed.",
            err,
          );
        }

        const currentView = useStore.getState().viewState;

        // 2. INTERRUPTED REGISTRATION RECOVERY (Auto-Provisioning)
        // If we have a user but no wallet, and we're not explicitly in the middle of a registration screen
        const needsWallet =
          !walletInfo || !walletInfo.wallet_id || !walletInfo.wallet_address;
        const isNotRegistering =
          currentView !== "register" && currentView !== "registerSuccess";

        if (needsWallet && isNotRegistering) {
          isProvisioning = true;
          // Set a temporary loading state if we're coming from splash/login
          if (currentView === "splash" || currentView === "password") {
            // We'll keep them on splash or a similar loading indicator
          }

          try {
            console.log(
              "Starting auto-provisioning for interrupted registration...",
            );
            const createRes = await fetch("/api/wallets/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user.id }),
            });

            if (createRes.ok) {
              const newData = await createRes.json();
              walletInfo = {
                wallet_id: newData.walletId || newData.wallet_id,
                wallet_address: newData.address || newData.wallet_address,
              };
              console.log(
                "Auto-provisioning successful:",
                walletInfo.wallet_address,
              );
            } else {
              const errorData = await createRes.json();
              console.error("Auto-provisioning failed:", errorData);
              // If it fails, we keep state empty and potentially show error later
            }
          } catch (createErr) {
            console.error("System error during auto-provisioning:", createErr);
          }
        }

        // 3. SECURE REDIRECT GUARD
        // Only proceed if we have a wallet or if we're in the middle of registration flow
        const hasValidWallet =
          walletInfo?.wallet_id && walletInfo?.wallet_address;

        if (hasValidWallet) {
          setRegisteredUser({
            username:
              user.user_metadata?.full_name ||
              user.user_metadata?.username ||
              "Arc User",
            email: user.email || "",
            isVerified: true,
            walletId: walletInfo.wallet_id,
            walletAddress: walletInfo.wallet_address,
            supabaseUid: user.id,
            registrationDate: user.created_at ? new Date(user.created_at).toLocaleDateString("id-ID") : "N/A",
          });

          // Only navigate to home if we were stuck on entry points
          if (currentView === "splash" || currentView === "password") {
            setViewState("home");
          }
        } else if (isNotRegistering) {
          // If no wallet and not registering, and auto-provisioning failed, we might need a logout or error screen
          console.error(
            "Critical: User Logged In but No Wallet Found and Provisioning Failed.",
          );
          useStore.getState().displayToast("Your account wallet could not be loaded. Missing Server Environment Variables (Vercel) or API Error.");
        }

      } catch (e) {
        console.error("Critical handleUserSession failure:", e);
      } finally {
        // Always clear loading states at the end
        setIsLoggingIn(false);
      }
    },
    [setRegisteredUser, setViewState],
  );

  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          // If it's an auth error specifically about session validity, just reset
          if (
            (error.message?.toLowerCase() || "").includes("refresh token") ||
            error.status === 400
          ) {
            await supabase.auth.signOut().catch(() => {});
            resetState();
          } else {
            console.warn("Auth initialization warning:", error.message);
          }
        } else if (session) {
          handleUserSession(session.user);
        }
      } catch (err) {
        // Absolute suppression of session check failures
        console.debug("Silent session check failure");
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === "TOKEN_REFRESHED" && !session) {
        supabase.auth.signOut().catch(() => {});
        resetState();
      } else if (_event === "SIGNED_OUT") {
        resetState();
      } else if (session) {
        handleUserSession(session.user);
      } else {
        resetState();
      }
    });

    return () => subscription.unsubscribe();
  }, [handleUserSession, resetState]);

  React.useEffect(() => {
    if (registeredUser?.supabaseUid) {
      fetchBalance();
      fetchTransactions();

      const txSubscription = supabase
        .channel("user-transactions")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "transactions",
            filter: `user_id=eq.${registeredUser.supabaseUid}`,
          },
          (payload) => {
            useStore
              .getState()
              .addLog(
                `Real-time update received for transaction: ${payload.eventType}`,
              );
            fetchBalance();
            fetchTransactions();
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            useStore.getState().addLog("Real-time sync ready for transactions");
          }
        });

      const balanceSubscription = supabase
        .channel("user-balances")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "balances",
            filter: `user_id=eq.${registeredUser.supabaseUid}`,
          },
          (payload) => {
            useStore
              .getState()
              .addLog(
                `Real-time update received for balance: ${payload.eventType}`,
              );
            fetchBalance();
            fetchTransactions();
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            useStore.getState().addLog("Real-time sync ready for balances");
          }
        });

      return () => {
        supabase.removeChannel(txSubscription);
        supabase.removeChannel(balanceSubscription);
      };
    }
  }, [registeredUser?.supabaseUid, fetchBalance, fetchTransactions]);

  return (
    <ArcProvider>
      <div className="bg-[#EAF3FA] h-[100dvh] w-full overflow-hidden flex flex-col">
        {/* Full screen responsive web application wrapper */}
        <div className="w-full h-full bg-[#EAF3FA] relative overflow-hidden flex flex-col animate-in fade-in duration-500">
          <ViewRouter
            isLoggingIn={isLoggingIn}
            loginEmail={loginEmail}
            setLoginEmail={setLoginEmail}
            setIsLoggingIn={setIsLoggingIn}
          />
        </div>
      </div>
    </ArcProvider>
  );
}
