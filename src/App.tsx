import React from "react";
import { motion, AnimatePresence } from "motion/react";
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
  } = useApp();

  const handleUserSession = React.useCallback(
    async (user: any) => {
      try {
        let walletInfo: any = null;

        try {
          const response = await fetch(`/api/debug-wallet/${user.id}`);
          if (response.ok) {
            walletInfo = await response.json();
          }
        } catch (err) {
          console.warn(
            "Failed fetching wallet mapping, trying to provision...",
            err,
          );
        }

        const currentView = useStore.getState().viewState;

        // Auto-Create Wallet on Login if missing (Recovery Mode)
        // Only if we're not currently in the register flow where it's explicitly handled
        if ((!walletInfo || !walletInfo.wallet_id) && currentView !== "register" && currentView !== "registerSuccess") {
          try {
            const createRes = await fetch("/api/wallets/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user.id }),
            });

            if (createRes.ok) {
              const newData = await createRes.json();
              walletInfo = {
                wallet_id: newData.walletId,
                wallet_address: newData.address,
              };
            } else {
              const errorData = await createRes.json();
              console.error("Wallet creation failed:", errorData);
            }
          } catch (createErr) {
            console.error("Failed to auto-create wallet:", createErr);
          }
        }

        // Save to localStorage for ArcProvider to pick up
        if (walletInfo?.wallet_address) {
          localStorage.setItem("arc_wallet_address", walletInfo.wallet_address);
        }
        localStorage.setItem("arc_user_id", user.id);

        setRegisteredUser({
          username: user.user_metadata?.full_name || "Arc User",
          email: user.email || "",
          isVerified: true,
          walletId: walletInfo?.wallet_id || "",
          walletAddress: walletInfo?.wallet_address || "",
          supabaseUid: user.id,
          registrationDate: new Date(user.created_at).toLocaleDateString(
            "id-ID",
          ),
        });

        // Navigate to home only if not already in a logged in screen or processing a login/signup
        if (currentView === "splash" || currentView === "password") {
          setViewState("home");
        }
      } catch (e) {
        console.error(e);
        const currentView = useStore.getState().viewState;
        if (currentView === "splash" || currentView === "password") {
          setViewState("home");
        }
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
        localStorage.removeItem("arc_wallet_address");
        localStorage.removeItem("arc_user_id");
      } else if (session) {
        handleUserSession(session.user);
      } else {
        resetState();
        localStorage.removeItem("arc_wallet_address");
        localStorage.removeItem("arc_user_id");
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
          <AnimatePresence mode="wait">
            <motion.div
              key={viewState}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full h-full relative"
            >
              <ViewRouter
                isLoggingIn={isLoggingIn}
                loginEmail={loginEmail}
                setLoginEmail={setLoginEmail}
                setIsLoggingIn={setIsLoggingIn}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </ArcProvider>
  );
}
