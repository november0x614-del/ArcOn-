import React, { useState } from 'react';
import { ChevronLeft, Eye, EyeOff, ShieldCheck, Wallet } from 'lucide-react';

interface PasswordScreenProps {
  onBack: () => void;
  onLogin: (email: string, pass: string) => void;
  onForgotPassword?: () => void;
}

export function PasswordScreen({ onBack, onLogin, onForgotPassword }: PasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-white relative flex flex-col justify-between overflow-hidden">
      {/* Top Graphic Area */}
      <div className="relative h-[35%] bg-gradient-to-b from-[#3FA2F6] to-blue-600 rounded-b-[40px] flex flex-col justify-center items-center px-6 overflow-hidden shrink-0 shadow-lg">
        {/* Decorative elements */}
        <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-30px] left-[-30px] w-[150px] h-[150px] bg-blue-400/30 rounded-full blur-xl"></div>
        
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 z-20 w-10 h-10 bg-black/10 rounded-full flex items-center justify-center text-white hover:bg-black/20 transition-colors backdrop-blur-sm border border-white/10"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>

        <div className="z-10 bg-white/20 p-3 rounded-2xl backdrop-blur-md mb-3 border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
           <div className="bg-white text-[#3FA2F6] p-2 rounded-xl shadow-sm">
             <Wallet size={28} strokeWidth={2.5}/>
           </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1 text-center drop-shadow-sm">Welcome Back</h1>
        <p className="text-blue-100 text-center text-[11px] font-medium px-6 leading-relaxed">
          Access your Arc Commerce decentralized account.
        </p>
      </div>

      {/* Bottom Area: Login Form */}
      <div className="flex-1 px-8 pt-6 pb-10 flex flex-col bg-white overflow-y-auto">
        <div className="flex flex-col justify-center">
            <h2 className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">Identity Authentication</h2>
            
            <div className="space-y-4 mb-4">
              {errorMsg && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-xl mb-2 animate-in fade-in slide-in-from-top-2">
                  <p className="text-[12px] text-red-600 font-medium text-center">{errorMsg}</p>
                </div>
              )}
              <div className="w-full relative group">
                <input 
                    type="email" 
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#f8fafc] border-[1.5px] border-slate-200 focus:border-[#3FA2F6] rounded-2xl py-4 px-5 text-slate-800 text-[15px] font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100/50 shadow-sm transition-all"
                />
              </div>

              <div className="w-full relative group">
                <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#f8fafc] border-[1.5px] border-slate-200 focus:border-[#3FA2F6] rounded-2xl py-4 px-5 text-slate-800 text-[15px] font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100/50 shadow-sm transition-all"
                />
                <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#3FA2F6] transition-colors p-1"
                >
                    {showPassword ? <Eye size={20} strokeWidth={2} /> : <EyeOff size={20} strokeWidth={2} />}
                </button>
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={isLoading || email.length === 0 || password.length === 0}
              className={`w-full font-bold text-[15px] py-4 rounded-2xl transition-all duration-300 flex justify-center items-center gap-2 border-0 active:scale-[0.98]
                  ${(email.length > 0 && password.length > 0 && !isLoading)
                  ? 'bg-[#3FA2F6] text-white shadow-[0_8px_20px_rgba(63,162,246,0.25)] hover:bg-[#2b88d8]' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Login to Account'
              )}
            </button>

            <div className="mt-8 flex justify-center">
                <button 
                  onClick={onForgotPassword}
                  className="text-[#3FA2F6] font-semibold text-[13px] hover:text-blue-700 transition-colors"
                >
                Forgot password?
                </button>
            </div>
        </div>
      </div>
    </div>
  )
}

