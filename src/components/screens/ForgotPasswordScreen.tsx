import React, { useState } from "react";
import { ArrowLeft, Mail, ShieldCheck, CheckCircle2, Lock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface ForgotPasswordScreenProps {
  onBack: () => void;
  initialEmail?: string;
}

export function ForgotPasswordScreen({ onBack, initialEmail = "" }: ForgotPasswordScreenProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      if (resetError) throw resetError;
      
      setStep(2);
    } catch (err: any) {
      console.error("Reset Password Error:", err);
      setError(err.message || "Failed to send reset code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      setError("Please enter a valid code.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "recovery",
      });
      if (verifyError) throw verifyError;
      
      // OTP verified successfully, user is temporarily authenticated and can update password
      setStep(3);
    } catch (err: any) {
      console.error("Verify OTP Error:", err);
      setError(err.message || "Invalid or expired code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
      
      setStep(4);
    } catch (err: any) {
      console.error("Update Password Error:", err);
      setError(err.message || "Failed to update password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-white relative flex flex-col justify-between overflow-hidden z-50">
      {/* Top Graphic Area */}
      <div className="relative h-[35%] bg-gradient-to-b from-slate-800 to-slate-900 rounded-b-[40px] flex flex-col justify-end items-center px-6 pb-6 overflow-hidden shrink-0 shadow-lg">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-20%] right-[-10%] w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-50 blur-2xl pointer-events-none"></div>
        <div className="absolute top-10 left-10 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl pointer-events-none"></div>

        <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight text-center drop-shadow-sm mb-2 relative z-10">
          {step === 1 && "Reset Password"}
          {step === 2 && "Verification"}
          {step === 3 && "New Password"}
          {step === 4 && "Success"}
        </h1>
        
        {step !== 4 && (
          <div className="mt-2 flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm relative z-10">
            <ShieldCheck size={14} className="text-green-400" />
            <span className="text-[10px] text-white/90 font-medium tracking-wide">
              Secured Connection
            </span>
          </div>
        )}
      </div>

      <button
        onClick={onBack}
        className="absolute top-8 left-6 w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all z-50"
      >
        <ArrowLeft size={22} strokeWidth={2.5} className="-ml-0.5" />
      </button>

      {/* Bottom Area: Form */}
      <div className="flex-1 px-8 pt-8 pb-10 flex flex-col bg-white">
        <div className="flex-1 flex flex-col">
          
          {step === 1 && (
            <div className="animate-in slide-in-from-right duration-300 flex-1 flex flex-col">
              <p className="text-[14.5px] text-slate-500 mb-8 mt-2 text-center">
                We will send a password reset confirmation code to your registered email address.
              </p>

              <div className="w-full relative mb-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  readOnly
                  className="w-full bg-[#f1f5f9] border-[1.5px] border-slate-200 rounded-2xl py-4 px-5 pl-12 text-slate-500 text-[15px] font-semibold focus:outline-none transition-all cursor-not-allowed"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={20} strokeWidth={2} />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-xl mb-4">
                  <p className="text-[13px] text-red-600 font-medium text-center">
                    {error}
                  </p>
                </div>
              )}

              <div className="mt-auto pt-6">
                <button
                  onClick={handleSendOtp}
                  disabled={isLoading || !email}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_8px_20px_rgba(63,162,246,0.25)] flex justify-center items-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed border-0"
                >
                  {isLoading ? "Sending..." : "Send Reset Code"}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right duration-300 flex-1 flex flex-col">
              <p className="text-[14.5px] text-slate-500 mb-8 mt-2 text-center">
                We've sent a code to <span className="font-bold text-slate-700">{email}</span>.
              </p>

              <div className="mb-4">
                <input
                  type="text"
                  maxLength={8}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-[#005faa]/20 focus:border-[#005faa] focus:bg-white text-[24px] tracking-[0.5em] text-center font-bold text-slate-900 transition-all placeholder:text-slate-300"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-xl mb-4">
                  <p className="text-[13px] text-red-600 font-medium text-center">
                    {error}
                  </p>
                </div>
              )}

              <div className="mt-auto pt-6 space-y-3">
                <button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length < 6}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_8px_20px_rgba(63,162,246,0.25)] flex justify-center items-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed border-0"
                >
                  {isLoading ? "Verifying..." : "Verify Code"}
                </button>
                <button
                  onClick={() => { setStep(1); setOtp(""); setError(null); }}
                  className="w-full bg-transparent text-slate-500 font-bold py-3 transition-colors hover:text-slate-800 text-[14px]"
                >
                  Mistyped email? Change here
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in slide-in-from-right duration-300 flex-1 flex flex-col">
              <p className="text-[14.5px] text-slate-500 mb-8 mt-2 text-center">
                Create a new strong password for your account.
              </p>

              <div className="w-full relative mb-4">
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#f8fafc] border-[1.5px] border-slate-200 focus:border-slate-900 rounded-2xl py-4 px-5 pl-12 text-slate-800 text-[15px] font-semibold placeholder:text-slate-400 focus:outline-none transition-all"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={20} strokeWidth={2} />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-xl mb-4">
                  <p className="text-[13px] text-red-600 font-medium text-center">
                    {error}
                  </p>
                </div>
              )}

              <div className="mt-auto pt-6">
                <button
                  onClick={handleUpdatePassword}
                  disabled={isLoading || newPassword.length < 6}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_8px_20px_rgba(63,162,246,0.25)] flex justify-center items-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed border-0"
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300 h-full">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-[20px] font-bold text-slate-800 mb-2">
                Password Updated!
              </h2>
              <p className="text-slate-500 text-[14px] mb-10 px-4 leading-relaxed">
                Your password has been successfully reset. You can now use your new password to log in.
              </p>
              <button
                onClick={onBack}
                className="w-full font-bold text-[15px] py-4 rounded-2xl transition-all duration-300 flex justify-center items-center gap-2 border-0 active:scale-[0.98] bg-slate-900 text-white hover:bg-slate-800 shadow-md"
              >
                Back to Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

