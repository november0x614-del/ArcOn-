import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';

interface PasswordScreenProps {
  onBack: () => void;
  onLogin: () => void;
}

export function PasswordScreen({ onBack, onLogin }: PasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full h-full bg-[#f6f8fb] relative flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[25%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-400/40 rounded-full blur-[60px] mix-blend-multiply"></div>
        <div className="absolute top-[35%] right-1/4 w-48 h-48 bg-blue-400/30 rounded-full blur-[50px] mix-blend-multiply"></div>
        <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[120%] h-48 bg-[#60a5fa] opacity-40 blur-[50px]"></div>
      </div>

      <button 
        onClick={onBack}
        className="absolute top-6 right-6 z-20 text-slate-500 hover:text-slate-700 transition-colors"
      >
        <X size={26} strokeWidth={2} />
      </button>

      <div className="z-10 flex flex-col items-center w-full px-8 mt-[-30%]">
        <div className="flex flex-col items-center mb-14 relative">
           <h1 className="text-[52px] font-black italic text-[#3FA2F6] drop-shadow-sm leading-none tracking-tighter">livin<span className="text-[#f59e0b]">'</span></h1>
           <p className="text-[11px] font-bold text-[#3FA2F6] mt-0 tracking-wide translate-x-4">by mandiri</p>
        </div>

        <div className="w-full relative mb-4 group">
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#f6f8fb] border-[1.5px] border-[#3FA2F6] rounded-full py-4 px-6 text-slate-700 text-[15px] font-medium placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-100/50 shadow-sm transition-all"
          />
          <button 
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-[#3FA2F6] hover:text-blue-700 transition-colors"
          >
            {showPassword ? <Eye size={20} strokeWidth={2.5} /> : <EyeOff size={20} strokeWidth={2.5} />}
          </button>
        </div>

        <button 
          onClick={password.length > 0 ? onLogin : undefined}
          className={`w-full font-bold text-[16px] py-4 rounded-full transition-all duration-300
            ${password.length > 0 
              ? 'bg-[#3FA2F6] text-white shadow-[0_4px_14px_rgba(63,162,246,0.3)] hover:bg-[#2b88d8] hover:shadow-[0_6px_20px_rgba(63,162,246,0.4)] hover:-translate-y-0.5' 
              : 'bg-slate-200/70 text-slate-400 cursor-not-allowed shadow-none'}`}
        >
          Login
        </button>

        <button className="mt-8 text-[#3FA2F6] font-bold text-[14px] hover:text-blue-700 transition-colors">
          Forgot Password?
        </button>
      </div>
    </div>
  )
}
