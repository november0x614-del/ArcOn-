import React, { useState } from 'react';
import { ArrowLeft, UserCheck, Wallet, ScanFace, Eye, EyeOff } from 'lucide-react';
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
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [willVerify, setWillVerify] = useState(false);
  
  const [isCreating, setIsCreating] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  React.useEffect(() => {
    if (step === 4 && willVerify) {
        // give it time to simulate scanning
        const timer = setTimeout(() => {
            setStep(5);
        }, 2000);
        return () => clearTimeout(timer);
    } else if (step === 4 && !willVerify) {
        setStep(5);
    }
  }, [step, willVerify]);

  const [resendTimer, setResendTimer] = useState(0);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSignUp = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      });

      if (authError) throw authError;
      
      setStep(2);
      setResendTimer(60); // Start 60s countdown
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError(null);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (resendError) throw resendError;
      setResendTimer(60);
      setError('Kode baru telah dikirim ke email Anda.');
      setTimeout(() => setError(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim ulang kode.');
    }
  };

  const handleVerifyOtp = async () => {
    setIsVerifyingOtp(true);
    setError(null);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      });

      if (verifyError) throw verifyError;
      
      // Verifikasi berhasil, lanjut ke biometrik info
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'OTP tidak valid atau kadaluarsa.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const createWallet = async () => {
    if (isCreating) return;
    setIsCreating(true);
    setError(null);
    try {
      // Get current user to ensure we have the UID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User session not found");

      const userId = user.id;

      // Call backend to create Circle Wallet
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
          console.error("JSON Parse Error:", e);
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
        }
      } else {
        throw new Error(responseText || `Server error: ${response.status}`);
      }
      
      if (!response.ok) {
         throw new Error(data?.error || `Request failed with status ${response.status}`);
      }

      onComplete({ 
        username: username || 'Arcreal', 
        email: email || 'user@example.com', 
        isVerified: willVerify,
        walletId: data.walletId,
        walletAddress: data.address,
        supabaseUid: userId,
        registrationDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
      });
    } catch (err: any) {
      console.error("Wallet/Auth Creation Error:", err);
      let msg = err.message || 'Failed to complete registration.';
      if (msg.includes('rate limit')) msg = 'Supabase Rate Limit: Maksimal 2 email per jam.';
      setError(msg);
      setIsCreating(false);
    }
  };

  React.useEffect(() => {
    if (step === 5) {
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
              <div className="relative group">
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
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-[#005faa] transition-colors"
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-auto pt-6 pb-6">
            {error && <p className="text-red-500 text-[12px] mb-2 text-center">{error}</p>}
            <button 
              disabled={!username || !email || !password || isCreating}
              onClick={handleSignUp}
              className="w-full bg-[#005faa] text-white font-bold py-[14px] rounded-full hover:bg-[#004780] transition-colors active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 p-6 flex flex-col pt-8 animate-in fade-in duration-300">
          <h3 className="text-[26px] tracking-tight font-extrabold text-slate-800 leading-tight mb-2">Check Your<br/>Inbox</h3>
          <p className="text-[14.5px] text-slate-500 mb-8 mt-2">We've sent a 6-digit verification code to <span className="font-bold text-slate-700">{email}</span>.</p>
          
          <div className="space-y-6">
            <div>
              <label className="text-[12.5px] font-bold text-[#005faa] mb-1 block">Verification Code</label>
              <input 
                type="text" 
                maxLength={6}
                value={otp} 
                onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))} 
                className="w-full border-b-[2px] border-slate-200 py-2 outline-none focus:border-[#005faa] text-[24px] font-mono font-bold text-slate-800 tracking-[0.5em] transition-colors text-center" 
                placeholder="000000" 
              />
            </div>
            {error && <p className="text-red-500 text-[12px] text-center">{error}</p>}
          </div>
          
          <div className="mt-auto pt-6 pb-6">
            <button 
              disabled={otp.length !== 6 || isVerifyingOtp}
              onClick={handleVerifyOtp}
              className="w-full bg-[#005faa] text-white font-bold py-[14px] rounded-full hover:bg-[#004780] transition-colors active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isVerifyingOtp ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : 'Verify Account'}
            </button>
            <button 
              disabled={resendTimer > 0}
              onClick={handleResendOtp}
              className={`w-full py-4 text-[13px] font-bold transition-colors ${resendTimer > 0 ? 'text-slate-300' : 'text-[#005faa] hover:text-[#004780]'}`}
            >
              {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend Code'}
            </button>
            
            <p className="text-[11px] text-slate-400 text-center mt-2 px-4 leading-relaxed">
              Jika tidak ada di Inbox, mohon periksa folder <b>Spam</b>. Supabase memerlukan waktu beberapa menit untuk pengiriman email.
            </p>
          </div>
        </div>
      )}

      {step === 3 && (
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
              onClick={() => { setWillVerify(true); setStep(4); }}
              className="w-full bg-[#005faa] text-white font-bold py-[14px] rounded-full hover:bg-[#004780] transition-colors active:scale-[0.98]"
            >
              Start Verification & Connect
            </button>
            <button 
              onClick={() => { setWillVerify(false); setStep(4); }}
              className="w-full bg-slate-100 text-slate-500 font-bold py-[14px] border border-slate-200 rounded-full hover:bg-slate-200 transition-colors active:scale-[0.98]"
            >
              Skip (Verify Later)
            </button>
          </div>
        </div>
      )}

      {step === 4 && willVerify && (
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

      {step === 5 && (
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
