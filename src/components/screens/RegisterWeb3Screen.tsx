import React, { useState } from 'react';
import { ArrowLeft, Wallet, Eye, EyeOff, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useArcWallet } from '../../lib/useArcWallet';

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

  const { status, address: externalAddress, connect: connectExternal, isBusy: isExternalBusy } = useArcWallet();

  const handleExternalConnect = async () => {
    await connectExternal();
  };

  React.useEffect(() => {
    if (status === 'connected' && externalAddress) {
      onComplete({
        username: username || 'User',
        email: email || `${externalAddress.slice(0, 6)}@arc.io`,
        isVerified: true,
        walletId: 'external',
        walletAddress: externalAddress,
        supabaseUid: 'external-user',
        registrationDate: new Date().toLocaleDateString('id-ID')
      });
    }
  }, [status, externalAddress]);

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
    <div className="w-full h-full bg-white relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full justify-between shrink-0">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h2 className="font-bold text-[16px] text-white ml-2">OPEN NEW ACCOUNT</h2>
        </div>
      </div>
      
      {step === 1 && (
        <div className="flex-1 p-6 flex flex-col pt-8">
          <h3 className="text-[26px] tracking-tight font-extrabold text-slate-800 leading-tight mb-2">Start Your<br/>Easy Steps</h3>
          <p className="text-[14.5px] text-slate-500 mb-8 mt-2">Prepare your ID Card and enter details to create your Web3 Wallet.</p>
          
          <div className="space-y-6">
            <div>
              <label className="text-[12.5px] font-bold text-slate-800 mb-1 block">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border-b-[2px] border-slate-200 py-2 outline-none focus:border-[#005faa] text-[16px] font-bold text-slate-800 transition-colors" placeholder="Enter Username" />
            </div>
            <div>
              <label className="text-[12.5px] font-bold text-slate-800 mb-1 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border-b-[2px] border-slate-200 py-2 outline-none focus:border-[#005faa] text-[16px] font-bold text-slate-800 transition-colors" placeholder="name@email.com" />
            </div>
            <div className="relative">
              <label className="text-[12.5px] font-bold text-slate-800 mb-1 block">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full border-b-[2px] border-slate-200 py-2 pr-10 outline-none focus:border-[#005faa] text-[16px] font-bold text-slate-800 transition-colors" 
                  placeholder="••••••••" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-auto pt-6 pb-6 space-y-3">
            <button 
              disabled={!username || !email || !password || isCreating}
              onClick={() => setStep(2)}
              className="w-full bg-[#005faa] text-white font-bold py-[14px] rounded-full hover:bg-[#004780] transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Managed Wallet'}
            </button>
            
            <div className="relative flex items-center justify-center py-2">
               <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
               </div>
               <span className="relative px-3 bg-white text-[11px] font-bold text-slate-400 uppercase tracking-widest">Or Secure via Arc</span>
            </div>

            <button 
              onClick={handleExternalConnect}
              disabled={isExternalBusy}
              className="w-full bg-slate-900 text-white font-bold py-[14px] rounded-full hover:bg-black transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Zap size={18} className="text-[#008fcd]" />
              {isExternalBusy ? 'Connecting...' : 'Connect External Wallet'}
            </button>
            
            <p className="text-[11px] text-slate-400 text-center mt-4">
               By continuing, you agree to Arc Commerce Terms and Security Guidelines.
            </p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
          {!error ? (
            <>
              <div className="relative mb-8 mt-[-10vh]">
                 <div className="w-20 h-20 border-[3px] border-slate-100 border-t-[#005faa] rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                   <Wallet size={24} className="text-slate-800" />
                 </div>
              </div>
              <h3 className="text-[20px] font-bold text-slate-800 mb-3">Creating Web3 Wallet...</h3>
              <p className="text-[14px] text-slate-500 px-6 leading-relaxed">
                Initializing <span className="font-semibold text-slate-700">Circle Developer-Controlled Wallet</span> on <span className="font-semibold text-slate-700">Arc Testnet</span>. Please wait a moment.
              </p>
            </>
          ) : (
            <div className="mt-[-10vh] px-4">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto border border-red-100">
                <Wallet size={32} className="text-red-500" />
              </div>
              <h3 className="text-[20px] font-bold text-slate-800 mb-3">Registration Failed</h3>
              <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl mb-8">
                <p className="text-[13px] text-red-600 font-mono text-left break-words overflow-auto max-h-[150px]">
                  {error}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => createWallet()}
                  className="w-full bg-[#005faa] text-white font-bold py-[14px] rounded-full hover:bg-[#004780] transition-colors active:scale-[0.98]"
                >
                  Retry Creation
                </button>
                <button 
                  onClick={() => setStep(1)}
                  className="w-full bg-slate-100 text-slate-500 font-bold py-[14px] border border-slate-200 rounded-full hover:bg-slate-200 transition-colors active:scale-[0.98]"
                >
                  Back to Form
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
