import React, { useState } from 'react';
import { ArrowLeft, UserCheck, Wallet, ScanFace } from 'lucide-react';
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
  const [willVerify, setWillVerify] = useState(false);
  
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  React.useEffect(() => {
    if (step === 3 && willVerify) {
        // give it time to simulate scanning
        const timer = setTimeout(() => {
            setStep(4);
        }, 2000);
        return () => clearTimeout(timer);
    } else if (step === 3 && !willVerify) {
        setStep(4);
    }
  }, [step, willVerify]);

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
      // 1. Supabase Auth SignUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username }
        }
      });

      if (authError) throw authError;
      const userId = authData.user?.id;

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
        isVerified: willVerify,
        walletId: data.walletId,
        walletAddress: data.address,
        supabaseUid: userId,
        registrationDate: new Date().toLocaleDateString('id-ID')
      });
    } catch (err: any) {
      console.error("Wallet/Auth Creation Error:", err);
      let msg = 'Maaf, terjadi kesalahan sistem. Silakan coba kembali.';
      if (err.message.includes('rate limit')) msg = 'Terlalu banyak percobaan. Silakan coba lagi nanti.';
      setError(msg);
      setIsCreating(false);
    }
  };

  React.useEffect(() => {
    if (step === 4) {
      createWallet();
    }
  }, [step]);

  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center px-4 pt-12 pb-4 border-b border-slate-100 shadow-sm relative z-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200">
          <ArrowLeft size={24} className="text-slate-800" />
        </button>
        <h2 className="font-bold text-[16px] text-slate-800 ml-2">Open New Account</h2>
      </div>
      
      {step === 1 && (
        <div className="flex-1 p-6 flex flex-col pt-8">
          <h3 className="text-[26px] tracking-tight font-extrabold text-slate-800 leading-tight mb-2">Start Your<br/>Easy Steps</h3>
          <p className="text-[14.5px] text-slate-500 mb-8 mt-2">Prepare your ID Card and enter details to create your Web3 Wallet.</p>
          
          <div className="space-y-6">
            <div>
              <label className="text-[12.5px] font-bold text-[#005faa] mb-1 block">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border-b-[2px] border-slate-200 py-2 outline-none focus:border-[#005faa] text-[16px] font-bold text-slate-800 transition-colors" placeholder="Enter Username" />
            </div>
            <div>
              <label className="text-[12.5px] font-bold text-[#005faa] mb-1 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border-b-[2px] border-slate-200 py-2 outline-none focus:border-[#005faa] text-[16px] font-bold text-slate-800 transition-colors" placeholder="name@email.com" />
            </div>
            <div>
              <label className="text-[12.5px] font-bold text-[#005faa] mb-1 block">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border-b-[2px] border-slate-200 py-2 outline-none focus:border-[#005faa] text-[16px] font-bold text-slate-800 transition-colors" placeholder="••••••••" />
            </div>
          </div>
          
          <div className="mt-auto pt-6 pb-6">
            <button 
              disabled={!username || !email || !password}
              onClick={() => setStep(2)}
              className="w-full bg-[#005faa] text-white font-bold py-[14px] rounded-full hover:bg-[#004780] transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center pb-12 animate-in fade-in duration-300">
          <div className="w-24 h-24 bg-blue-50/50 rounded-full flex items-center justify-center mb-6 border border-blue-100">
             <UserCheck size={48} className="text-[#005faa]" strokeWidth={1.5} />
          </div>
          <h3 className="text-[22px] font-bold text-slate-800 mb-3">Face Verification / Biometric</h3>
          <p className="text-[14.5px] text-slate-500 mb-8 px-2 leading-relaxed">
            We will scan your face to verify your identity according to your ID Card, and connect it with your device biometric.
          </p>
          <div className="mt-auto w-full pt-6 flex flex-col gap-3">
            <button 
              onClick={() => { setWillVerify(true); setStep(3); }}
              className="w-full bg-[#005faa] text-white font-bold py-[14px] rounded-full hover:bg-[#004780] transition-colors active:scale-[0.98]"
            >
              Start Verification & Connect
            </button>
            <button 
              onClick={() => { setWillVerify(false); setStep(3); }}
              className="w-full bg-slate-100 text-slate-500 font-bold py-[14px] border border-slate-200 rounded-full hover:bg-slate-200 transition-colors active:scale-[0.98]"
            >
              Skip (Verify Later)
            </button>
          </div>
        </div>
      )}

      {step === 3 && willVerify && (
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
          <div className="w-32 h-32 rounded-full border-4 border-[#005faa] flex items-center justify-center mb-6 overflow-hidden relative">
             <div className="absolute inset-0 bg-[#005faa]/10"></div>
             <ScanFace size={48} className="text-[#005faa] animate-pulse" />
             {/* scanning line */}
             <div className="absolute top-0 left-0 w-full h-[2px] bg-[#005faa] shadow-[0_0_8px_2px_#005faa] animate-[scan_2s_ease-in-out_infinite]"></div>
          </div>
          <h3 className="text-[22px] font-bold text-slate-800 mb-2">Scanning Face...</h3>
          <p className="text-[14px] text-slate-500">Please position your face within the frame.</p>

          <style>{`
            @keyframes scan {
              0% { top: 0%; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { top: 100%; opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {step === 4 && (
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
          {!error ? (
            <>
              <div className="relative mb-8 mt-[-10vh]">
                 <div className="w-20 h-20 border-[3px] border-slate-100 border-t-[#005faa] rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                   <Wallet size={24} className="text-[#005faa]" />
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
