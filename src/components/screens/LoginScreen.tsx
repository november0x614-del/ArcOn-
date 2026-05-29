import React, { useState } from "react";
import { Wallet, ShieldCheck, ChevronRight, Loader2 } from "lucide-react";

interface LoginScreenProps {
  onLogin: (email: string) => void;
  onRegister?: () => void;
  hasIdentity?: boolean;
  onShowToast?: (msg: string) => void;
  isLoading?: boolean;
}

export function LoginScreen({
  onLogin,
  onRegister,
  isLoading,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const handleRegisterClick = () => {
    if (isLoading) return;
    if (onRegister) {
      onRegister();
    }
  };
  return (
    <div className="w-full h-full bg-white relative flex flex-col justify-between overflow-hidden">
      {/* Top Graphic Area */}
      <div className="relative h-[55%] bg-gradient-to-b from-slate-800 to-slate-900 rounded-b-[40px] flex flex-col justify-center items-center px-6 overflow-hidden shrink-0">
        {/* Decorative elements */}
        <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-30px] left-[-30px] w-[150px] h-[150px] bg-blue-400/30 rounded-full blur-xl"></div>

        <div className="z-10 bg-white/20 p-4 rounded-3xl backdrop-blur-md mb-6 border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
          <div className="bg-white rounded-2xl shadow-sm w-[80px] h-[80px] overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white tracking-tight mb-2 text-center drop-shadow-sm">
          Lounge
        </h1>
        <p className="text-blue-100 text-center text-[13px] font-medium px-6 leading-relaxed">
          Shop seamlessly with ultra-fast, secure digital payments.
        </p>

        {/* Security Badge */}
        <div className="mt-8 flex items-center gap-1.5 bg-black/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
          <ShieldCheck size={16} className="text-green-300" />
          <span className="text-[11px] text-white/90 font-medium tracking-wide">
            Secured by Arc Network
          </span>
        </div>
      </div>

      {/* Bottom Area: Login Controls */}
      <div className="flex-1 px-6 pt-8 pb-10 flex flex-col justify-end bg-white">
        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            disabled={isLoading}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#f8fafc] border-[1.5px] border-slate-200 rounded-2xl py-4 px-5 text-slate-800 text-[15px] font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100/50 shadow-sm transition-all"
          />

          <button
            onClick={() => onLogin(email)}
            disabled={isLoading || !email}
            className={`w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_8px_20px_rgba(63,162,246,0.25)] flex justify-center items-center gap-2 active:scale-[0.98] border-0 ${isLoading || !email ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Access Account <ChevronRight size={18} strokeWidth={2.5} />
              </>
            )}
          </button>

          <button
            onClick={handleRegisterClick}
            disabled={isLoading}
            className={`w-full font-bold py-4 rounded-2xl transition-all flex justify-center items-center active:scale-[0.98] border-0 bg-slate-100 hover:bg-slate-200 text-slate-800
              ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            Sign Up
          </button>
        </div>

        <p className="text-[11px] text-center text-slate-400 font-medium mt-10 leading-relaxed">
          By logging in or registering, you agree to our <br />
          <span className="text-slate-800 cursor-pointer hover:underline">
            Terms of Service
          </span>{" "}
          and{" "}
          <span className="text-slate-800 cursor-pointer hover:underline">
            Privacy Policy
          </span>
          .
        </p>
      </div>
    </div>
  );
}
