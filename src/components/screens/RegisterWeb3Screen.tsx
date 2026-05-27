import React, { useState } from "react";
import { ArrowLeft, Wallet, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

interface RegisterWeb3ScreenProps {
  onBack: () => void;
  onComplete: (data: {
    username: string;
    email: string;
    isVerified: boolean;
    walletId?: string;
    walletAddress?: string;
    supabaseUid?: string;
    registrationDate?: string;
  }) => void;
}

export function RegisterWeb3Screen({
  onBack,
  onComplete,
}: RegisterWeb3ScreenProps) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [walletData, setWalletData] = useState<any>(null);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      setError("Please enter a valid OTP code.");
      return;
    }
    setIsVerifying(true);
    setError(null);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup",
      });

      if (verifyError) {
        throw verifyError;
      }

      if (walletData) {
        onComplete({ ...walletData, isVerified: true });
      } else {
        throw new Error("Missing account data.");
      }
    } catch (err: any) {
      console.error("OTP Verification Error:", err);
      setError(err.message || "Invalid OTP code. Please try again.");
      setIsVerifying(false);
    }
  };

  const createWallet = async () => {
    if (isCreating) return;

    // Validasi Dasar Frontend
    if (!email.includes("@")) {
      setError("Invalid email format.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      // 1. Supabase Auth SignUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: username },
        },
      });

      if (authError) throw authError;

      // Supabase security feature: if email exists, it returns a user with empty identities
      if (
        authData.user &&
        authData.user.identities &&
        authData.user.identities.length === 0
      ) {
        throw new Error(
          "Email already registered. Please go back to login with your password.",
        );
      }

      if (!authData.user || !authData.user.id) {
        throw new Error("Registration failed. Please try again.");
      }

      const userId = authData.user.id;

      // 2. Call backend to create Circle Wallet FIRST (before any session checks)
      const response = await fetch("/api/wallets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      const responseText = await response.text();

      if (contentType && contentType.includes("application/json")) {
        try {
          data = responseText ? JSON.parse(responseText) : null;
        } catch (e) {
          throw new Error("Failed to process server response.");
        }
      } else {
        throw new Error(responseText || `Server error: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data?.error || "Wallet creation failed.");
      }

      // Check if email confirmation is required by looking at session
      let needsEmailConfirmation = false;
      if (!authData.session) {
        // Attempt a quiet sign in to verify if they can get a session (if auto-confirm is off)
        const { error: newSignInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });
        if (newSignInError) {
          needsEmailConfirmation = true;
        }
      }

      const completeData = {
        username: username || "User",
        email: email,
        isVerified: !needsEmailConfirmation,
        walletId: data.walletId,
        walletAddress: data.address,
        supabaseUid: userId,
        registrationDate: new Date().toLocaleDateString("en-US"),
      };

      if (needsEmailConfirmation) {
        setWalletData(completeData);
        setError(null);
        setStep(3);
      } else {
        onComplete(completeData);
      }
    } catch (err: any) {
      console.error("Wallet/Auth Creation Error:", err);
      let msg =
        err.message || "Sorry, a system error occurred. Please try again.";
      if (err.message?.includes("rate limit"))
        msg = "Too many attempts. Please try again later.";
      setError(msg);
      setIsCreating(false);
    }
  };

  React.useEffect(() => {
    if (step === 2) {
      createWallet();
    }
  }, [step]);

  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full justify-between shrink-0">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h2 className="font-bold text-[16px] text-white ml-2">
            OPEN NEW ACCOUNT
          </h2>
        </div>
      </div>

      {step === 1 && (
        <div className="flex-1 p-6 flex flex-col pt-8">
          <h3 className="text-[26px] tracking-tight font-extrabold text-slate-800 leading-tight mb-2">
            Start Your
            <br />
            Easy Steps
          </h3>
          <p className="text-[14.5px] text-slate-500 mb-8 mt-2">
            Enter your details to create your secure Lounge account.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-[13px] font-medium text-slate-700 mb-1.5 block ml-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#005faa]/20 focus:border-[#005faa] focus:bg-white text-[15px] font-medium text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-normal"
                placeholder="Enter Username"
              />
            </div>
            <div className="relative">
              <label className="text-[13px] font-medium text-slate-700 mb-1.5 block ml-1">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pr-10 outline-none focus:ring-2 focus:ring-[#005faa]/20 focus:border-[#005faa] focus:bg-white text-[15px] font-medium text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-normal"
                  placeholder="name@email.com"
                />
                {email.includes("@") && email.includes(".") && (
                  <CheckCircle2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />
                )}
              </div>
            </div>
            <div className="relative">
              <label className="text-[13px] font-medium text-slate-700 mb-1.5 block ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-16 py-3.5 outline-none focus:ring-2 focus:ring-[#005faa]/20 focus:border-[#005faa] focus:bg-white text-[15px] font-medium text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-normal"
                  placeholder="••••••••"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                  {password.length >= 6 && (
                    <CheckCircle2 size={18} className="text-green-500 mr-1" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 pb-6 space-y-3">
            <button
              disabled={!username || !email || !password || isCreating}
              onClick={() => setStep(2)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_8px_20px_rgba(63,162,246,0.25)] flex justify-center items-center gap-2 active:scale-[0.98] border-0 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating..." : "Create Lounge Account"}
            </button>

            <p className="text-[11px] text-slate-400 text-center mt-4">
              By continuing, you agree to Lounge Terms and Security
              Guidelines.
            </p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
          {!error ? (
            <>
              <div className="relative mb-10 mt-[-10vh] flex items-center justify-center">
                {/* Outer Glow */}
                <div className="absolute w-28 h-28 bg-slate-900/5 rounded-full animate-pulse"></div>
                
                {/* Outer Ring */}
                <div className="absolute w-24 h-24 border-[3px] border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
                
                {/* Inner Ring (Reverse Spin) */}
                <div className="absolute w-20 h-20 border-[2px] border-transparent border-b-slate-400/30 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }}></div>
                
                {/* Center Icon Container */}
                <div className="relative z-10 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-50">
                  <Wallet size={26} className="text-slate-800" />
                </div>
              </div>
              <h3 className="text-[22px] font-bold text-slate-900 mb-3 tracking-tight">
                Creating Account...
              </h3>
              <p className="text-[14.5px] text-slate-500 px-8 leading-relaxed max-w-xs mx-auto">
                Initializing your secure Lounge account. Please wait a moment.
              </p>
            </>
          ) : (
            <div className="mt-[-10vh] px-4 w-full">
              <div className="relative mb-8 mx-auto w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 bg-red-500/10 rounded-full animate-pulse"></div>
                <div className="relative z-10 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(239,68,68,0.15)] border border-red-100">
                  <Wallet size={28} className="text-red-500" />
                </div>
              </div>
              <h3 className="text-[22px] font-bold text-slate-900 mb-4 tracking-tight">
                Registration Failed
              </h3>
              <div className="bg-red-50/80 border border-red-100/80 p-4 rounded-2xl mb-8 px-5">
                <p className="text-[13.5px] text-red-600 font-medium text-center break-words overflow-auto max-h-[150px]">
                  {error}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => createWallet()}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_8px_20px_rgba(15,23,42,0.2)] flex justify-center items-center gap-2 active:scale-[0.98] border-0"
                >
                  Retry Creation
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="w-full bg-slate-50 text-slate-600 font-bold py-4 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-colors active:scale-[0.98]"
                >
                  Back to Form
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="flex-1 p-6 flex flex-col pt-12 animate-in slide-in-from-right duration-300">
          <div className="mb-8">
            <h3 className="text-[26px] tracking-tight font-extrabold text-slate-800 leading-tight mb-2">
              Verify your
              <br />
              Email Address
            </h3>
            <p className="text-[14.5px] text-slate-500 mb-8 mt-2">
              We've sent a confirmation code to{" "}
              <span className="font-bold text-slate-700">{email}</span>.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[13px] font-medium text-slate-700 mb-1.5 block ml-1">
                Security Code (OTP)
              </label>
              <input
                type="text"
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="000000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#005faa]/20 focus:border-[#005faa] focus:bg-white text-[24px] tracking-[0.5em] text-center font-bold text-slate-900 transition-all placeholder:text-slate-300"
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-100 p-3 rounded-xl mt-2">
                <p className="text-[13px] text-red-600 font-medium text-center">
                  {error}
                </p>
              </div>
            )}
          </div>

          <div className="mt-auto pt-6 pb-6 space-y-4">
            <button
              disabled={otp.length < 6 || isVerifying}
              onClick={handleVerifyOtp}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_8px_20px_rgba(63,162,246,0.25)] flex justify-center items-center gap-2 active:scale-[0.98] border-0 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isVerifying ? "Verifying..." : "Confirm & Complete"}
            </button>
            <button
              onClick={() => onComplete(walletData)}
              className="w-full bg-transparent text-slate-500 font-bold py-4 transition-colors hover:text-slate-800"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
