import React, { useState } from "react";
import { ChevronLeft, Eye, EyeOff, ShieldCheck, Wallet } from "lucide-react";

interface PasswordScreenProps {
  onBack: () => void;
  email: string;
  onLogin: (email: string, password: string) => void;
  onForgotPassword?: () => void;
  isLoading?: boolean;
}

export function PasswordScreen({
  onBack,
  email,
  onLogin,
  onForgotPassword,
  isLoading,
}: PasswordScreenProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full h-full bg-white relative flex flex-col justify-between overflow-hidden">
      {/* Top Graphic Area */}
      <div className="relative h-[45%] bg-gradient-to-b from-slate-800 to-slate-900 rounded-b-[40px] flex flex-col justify-center items-center px-6 overflow-hidden shrink-0 shadow-lg">
        {/* Decorative elements */}
        <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-30px] left-[-30px] w-[150px] h-[150px] bg-blue-400/30 rounded-full blur-xl"></div>

        {/* Back Button */}
        <button
          onClick={onBack}
          disabled={isLoading}
          className="absolute top-6 left-6 z-20 w-10 h-10 bg-black/10 rounded-full flex items-center justify-center text-white hover:bg-black/20 transition-colors backdrop-blur-sm border border-white/10"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>

        <div className="z-10 bg-white/20 p-4 rounded-3xl backdrop-blur-md mb-4 border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
          <div className="bg-white text-slate-800 p-3 rounded-2xl shadow-sm">
            <Wallet size={36} strokeWidth={2.5} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-1 text-center drop-shadow-sm">
          Welcome Back
        </h1>
        <p className="text-blue-100 text-center text-[13px] font-medium px-6 leading-relaxed">
          Enter your password to access your Lounge account.
        </p>

        {/* Security Badge */}
        <div className="mt-4 flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
          <ShieldCheck size={14} className="text-green-300" />
          <span className="text-[10px] text-white/90 font-medium tracking-wide">
            Secured by Arc Network
          </span>
        </div>
      </div>

      {/* Bottom Area: Password Form */}
      <div className="flex-1 px-8 pt-8 pb-10 flex flex-col bg-white">
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-[16px] font-bold text-slate-800 mb-6 text-center">
            Authentication
          </h2>

          <div className="w-full relative mb-6 group">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              disabled={isLoading}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#f8fafc] border-[1.5px] border-slate-200 focus:border-slate-900 rounded-2xl py-4 px-5 text-slate-800 text-[15px] font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100/50 shadow-sm transition-all"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition-colors p-1"
            >
              {showPassword ? (
                <Eye size={22} strokeWidth={2} />
              ) : (
                <EyeOff size={22} strokeWidth={2} />
              )}
            </button>
          </div>

          <button
            onClick={() =>
              password.length > 0 && !isLoading && onLogin(email, password)
            }
            disabled={isLoading || password.length === 0}
            className={`w-full font-bold text-[15px] py-4 rounded-2xl transition-all duration-300 flex justify-center items-center gap-2 border-0 active:scale-[0.98]
                ${
                  password.length > 0 && !isLoading
                    ? "bg-slate-900 text-white shadow-[0_8px_20px_rgba(63,162,246,0.25)] hover:bg-slate-800"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                }
                ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isLoading ? "Authenticating..." : "Login to Account"}
          </button>

          <div className="mt-8 flex justify-center">
            <button
              onClick={onForgotPassword}
              disabled={isLoading}
              className="text-slate-800 font-semibold text-[13px] hover:text-blue-700 transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
