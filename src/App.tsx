import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "./context/AppContext";
import { supabase } from "./lib/supabaseClient";
import { ViewRouter } from "./components/router/ViewRouter";

export default function App() {
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [loginEmail, setLoginEmail] = React.useState('');
  const {
    viewState,
    setViewState,
    fetchBalance,
  } = useApp();

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setViewState("home");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setViewState("home");
      } else {
        setViewState("splash");
      }
    });

    return () => subscription.unsubscribe();
  }, [setViewState]);

  React.useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

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
  );
}
