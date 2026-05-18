import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function PasswordScreen({ onBack, onLogin }: { onBack: () => void, onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        // Supabase rate limit or local setup might require email confirmation, 
        // but let's assume auto-confirm or successful login for preview.
        onLogin();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLogin();
      }
    } catch (err: any) {
      // Provide a fallback development mode if supabase is not connected
      if (err.message.includes("URL") || err.message.includes("key")) {
         console.warn("Supabase not configured. Bypassing auth for dev mode.");
         onLogin();
      } else {
         setErrorMsg(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#f6f8fb] relative flex flex-col items-center justify-center overflow-hidden">
      {/* Soft blurred background matching the image */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[25%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-400/40 rounded-full blur-[60px] mix-blend-multiply"></div>
        <div className="absolute top-[35%] right-1/4 w-48 h-48 bg-blue-400/30 rounded-full blur-[50px] mix-blend-multiply"></div>
        <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[120%] h-48 bg-[#60a5fa] opacity-40 blur-[50px]"></div>
      </div>

      {/* Close button */}
      <button 
        onClick={onBack}
        className="absolute top-6 right-6 z-20 text-slate-500 hover:text-slate-700 transition-colors"
      >
        <X size={26} strokeWidth={2} />
      </button>

      {/* Content wrapper */}
      <div className="z-10 flex flex-col items-center w-full px-8 mt-[-10%]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10 relative">
           <h1 className="text-[52px] font-black italic text-[#6366f1] drop-shadow-sm leading-none tracking-tighter">ArcOn</h1>
           <p className="text-[11px] font-bold text-[#6366f1] mt-0 tracking-wide translate-x-4">by circle</p>
        </div>

        {errorMsg && (
          <div className="w-full bg-red-100 text-red-600 text-[12px] font-semibold py-2 px-4 rounded-xl mb-4 text-center">
            {errorMsg}
          </div>
        )}

        {/* Email Input */}
        <div className="w-full relative mb-4 group">
          <input 
            type="email" 
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#f6f8fb] border-[1.5px] border-[#6366f1]/50 rounded-full py-4 px-6 text-slate-700 text-[15px] font-medium placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-100/50 focus:border-[#6366f1] shadow-sm transition-all"
          />
        </div>

        {/* Password Input */}
        <div className="w-full relative mb-6 group">
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#f6f8fb] border-[1.5px] border-[#6366f1]/50 rounded-full py-4 px-6 text-slate-700 text-[15px] font-medium placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-100/50 focus:border-[#6366f1] shadow-sm transition-all"
          />
          <button 
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-[#6366f1] hover:text-indigo-700 transition-colors"
          >
            {showPassword ? <Eye size={20} strokeWidth={2.5} /> : <EyeOff size={20} strokeWidth={2.5} />}
          </button>
        </div>

        {/* Login Action Button */}
        <button 
          onClick={(email.length > 0 && password.length > 0) ? handleAuth : undefined}
          disabled={loading}
          className={`w-full font-bold text-[16px] py-4 rounded-full transition-all duration-300 flex items-center justify-center
            ${(email.length > 0 && password.length > 0 && !loading) 
              ? 'bg-[#6366f1] text-white shadow-[0_4px_14px_rgba(99,102,241,0.3)] hover:bg-[#4f46e5] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] hover:-translate-y-0.5' 
              : 'bg-slate-200/70 text-slate-400 cursor-not-allowed shadow-none'}`}
        >
          {loading ? (
             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
             isSignup ? 'Daftar Sekarang' : 'Login'
          )}
        </button>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button 
             onClick={() => { setIsSignup(!isSignup); setErrorMsg(''); }}
             className="text-[#6366f1] font-bold text-[14px] hover:text-indigo-700 transition-colors"
          >
            {isSignup ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}
          </button>
          
          {!isSignup && (
            <button className="text-slate-500 font-medium text-[13px] hover:text-slate-800 transition-colors">
              Lupa Password?
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
