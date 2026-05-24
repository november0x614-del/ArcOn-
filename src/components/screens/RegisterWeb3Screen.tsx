import React, { useState } from 'react';
import { ArrowLeft, Wallet, Eye, EyeOff, ShieldCheck, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabaseClient';

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

export function RegisterWeb3Screen({ onBack, onComplete }: RegisterWeb3ScreenProps) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWallet = async () => {
    if (isCreating) return;
    
    // Validasi Dasar Frontend
    if (!email.includes('@')) {
      setError('Format email tidak valid.');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      let userId;
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (!signInError && signInData?.user) {
        // User already exists and we logged them in
        userId = signInData.user.id;
      } else {
        // 1. Supabase Auth SignUp
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: username }
          }
        });

        if (authError) throw authError;

        // Supabase security feature: if email exists, it returns a user with empty identities
        if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
          throw new Error('Email sudah terdaftar. Coba gunakan password yang benar untuk login.');
        }
        
        if (!authData.user || !authData.user.id) {
          throw new Error('Pendaftaran gagal. Silakan coba kembali.');
        }

        userId = authData.user.id;
        
        const { error: newSignInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (newSignInError) throw new Error('Silakan konfirmasi email Anda terlebih dahulu, lalu login.');
      }

      // 2. Call backend to create Circle Wallet
      // Status update untuk UX
      const response = await fetch('/api/wallets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      let data;
      const contentType = response.headers.get("content-type");
      const responseText = await response.text();
      
      if (contentType && contentType.includes("application/json")) {
        try {
          data = responseText ? JSON.parse(responseText) : null;
        } catch (e) {
          throw new Error('Gagal memproses respon server.');
        }
      } else {
        throw new Error(responseText || `Server error: ${response.status}`);
      }
      
      if (!response.ok) {
         throw new Error(data?.error || 'Pembuatan wallet gagal.');
      }

      onComplete({ 
        username: username || 'User', 
        email: email, 
        isVerified: false,
        walletId: data.walletId,
        walletAddress: data.address,
        supabaseUid: userId,
        registrationDate: new Date().toLocaleDateString('id-ID')
      });
    } catch (err: any) {
      console.error("Wallet/Auth Creation Error:", err);
      let msg = err.message || 'Maaf, terjadi kesalahan sistem. Silakan coba kembali.';
      if (err.message?.includes('rate limit')) msg = 'Terlalu banyak percobaan. Silakan coba lagi nanti.';
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
    <div className="w-full h-full bg-white relative flex flex-col z-50 overflow-hidden font-sans">
      {/* Background Gradients (Atmospheric) */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-slate-50 to-white -z-10" />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -z-10" />

      {/* Header */}
      <div className="flex items-center px-6 pt-12 pb-6 relative z-10">
        <button 
          onClick={onBack} 
          className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="ml-4">
          <p className="text-[10px] font-black text-[#1AA3FF] uppercase tracking-[0.2em]">Circle Infrastructure</p>
          <h2 className="font-black text-[15px] text-slate-900">Registration</h2>
        </div>
      </div>
      
      {step === 1 && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 p-6 flex flex-col pt-4"
        >
          {/* Custom UI Header Style from Docs */}
          <div className="mb-10 text-left">
            <h3 className="text-[32px] font-black leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#B090F5] to-[#1AA3FF] pb-1">
              Set up your<br/>Web3 Account
            </h3>
            <div className="w-12 h-1 bg-gradient-to-r from-[#B090F5] to-[#1AA3FF] rounded-full mt-2" />
            <p className="text-[14px] text-slate-500 mt-5 leading-relaxed font-medium">
              Initialize your secure, <span className="text-[#1AA3FF] font-bold">Circle-powered</span> developer-controlled wallet.
            </p>
          </div>
          
          <div className="space-y-5">
            <div className="group">
              <label className="text-[11px] font-black text-slate-400 mb-2 block uppercase tracking-wider group-focus-within:text-[#1AA3FF] transition-colors">Personal Username</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  className="w-full bg-slate-50/50 border border-slate-100 px-5 py-4 rounded-2xl outline-none focus:border-[#1AA3FF] focus:bg-white focus:ring-4 focus:ring-blue-50 text-[15px] font-bold text-slate-800 transition-all placeholder:text-slate-300" 
                  placeholder="e.g. Satoshi_25" 
                />
              </div>
            </div>

            <div className="group">
              <label className="text-[11px] font-black text-slate-400 mb-2 block uppercase tracking-wider group-focus-within:text-[#1AA3FF] transition-colors">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full bg-slate-50/50 border border-slate-100 px-5 py-4 rounded-2xl outline-none focus:border-[#1AA3FF] focus:bg-white focus:ring-4 focus:ring-blue-50 text-[15px] font-bold text-slate-800 transition-all placeholder:text-slate-300" 
                  placeholder="name@company.com" 
                />
              </div>
            </div>

            <div className="group relative">
              <label className="text-[11px] font-black text-slate-400 mb-2 block uppercase tracking-wider group-focus-within:text-[#1AA3FF] transition-colors">Wallet Password & Security</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full bg-slate-50/50 border border-slate-100 px-5 py-4 rounded-2xl outline-none focus:border-[#1AA3FF] focus:bg-white focus:ring-4 focus:ring-blue-50 text-[15px] font-bold text-slate-800 transition-all placeholder:text-slate-300 pr-12" 
                  placeholder="Create strong password" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="mt-2 flex items-center gap-1.5 px-1">
                 <Lock size={10} className="text-slate-300" />
                 <span className="text-[10px] font-bold text-slate-400">Minimum 6 characters recommended</span>
              </div>
            </div>
          </div>
          
          <div className="mt-auto pt-8 pb-10">
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 flex items-start gap-4">
               <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <ShieldCheck size={16} className="text-[#1AA3FF]" />
               </div>
               <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                 By proceeding, you agree to initialize a <span className="text-slate-900 font-bold">non-custodial infrastructure</span> on the Arc Testnet via Circle.
               </p>
            </div>

            <button 
              disabled={!username || !email || !password}
              onClick={() => setStep(2)}
              className="w-full bg-[#1AA3FF] text-white font-black py-5 rounded-[22px] shadow-xl shadow-blue-500/20 hover:bg-[#0088e0] transition-all active:scale-[0.98] disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-2 group"
            >
              Initialize Wallet
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <ArrowLeft size={18} className="rotate-180" />
              </motion.div>
            </button>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 p-8 flex flex-col items-center justify-center text-center -mt-10"
        >
          {!error ? (
            <>
              <div className="relative mb-10">
                 <div className="w-24 h-24 border-4 border-slate-50 border-t-[#1AA3FF] border-r-[#B090F5] rounded-full animate-spin shadow-inner"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: [0.8, 1.1, 0.8] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Wallet size={32} className="text-[#1AA3FF]" />
                    </motion.div>
                 </div>
                 
                 {/* Decorative pulses like docs aesthetics */}
                 <div className="absolute inset-0 -z-10 bg-blue-100 rounded-full blur-xl scale-150 opacity-30" />
              </div>
              
              <h3 className="text-[24px] font-black text-slate-900 mb-3 tracking-tight">Initializing Infrastructure</h3>
              <div className="flex flex-col gap-2 max-w-[280px]">
                <div className="flex items-center justify-center gap-2">
                   <CheckCircle2 size={12} className="text-emerald-500" />
                   <span className="text-[12px] font-extrabold text-slate-400 uppercase tracking-widest">Generating Entity Secrets</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                   <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
                     <div className="w-2 h-2 rounded-full border border-[#1AA3FF] border-t-transparent" />
                   </motion.div>
                   <span className="text-[12px] font-extrabold text-slate-800 uppercase tracking-widest">Provisions Arc Wallet</span>
                </div>
              </div>
              
              <p className="text-[13px] text-slate-400 mt-10 font-medium leading-loose px-4">
                 Our system is securely communicating with <span className="text-[#1AA3FF] font-bold">Circle Web3 Nodes</span> to generate your unique address.
              </p>
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full px-4"
            >
              <div className="w-20 h-20 bg-red-50 rounded-[28px] flex items-center justify-center mb-8 mx-auto border border-red-100 shadow-sm">
                <AlertCircle size={36} className="text-red-500" />
              </div>
              <h3 className="text-[26px] font-black text-slate-900 mb-3 tracking-tight">Setup Interrupted</h3>
              <p className="text-[14px] text-slate-500 font-medium mb-8">We encountered an issue during secure provisioning.</p>
              
              <div className="bg-red-50 border border-red-100 p-6 rounded-[32px] mb-10 text-left">
                <p className="text-[11px] font-black text-red-300 uppercase tracking-widest mb-2">Technical Logs</p>
                <p className="text-[13px] text-red-600 font-mono font-bold leading-relaxed break-words line-clamp-4">
                  {error}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => createWallet()}
                  className="w-full bg-[#1AA3FF] text-white font-black py-5 rounded-[22px] shadow-lg shadow-blue-500/20 hover:bg-[#0088e0] transition-all active:scale-[0.98]"
                >
                  Retry Secure Handshake
                </button>
                <button 
                  onClick={() => setStep(1)}
                  className="w-full bg-white text-slate-400 font-black py-5 rounded-[22px] border border-slate-100 hover:text-slate-600 transition-all active:scale-[0.98]"
                >
                  Return to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}
