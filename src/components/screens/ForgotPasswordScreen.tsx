import React, { useState } from 'react';
import { ArrowLeft, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

export function ForgotPasswordScreen({ onBack }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleReset = () => {
    if (!email) return;
    setIsSent(true);
  };

  return (
    <div className="w-full h-full bg-white relative flex flex-col justify-between overflow-hidden z-50">
      {/* Top Graphic Area */}
      <div className="relative h-[45%] bg-gradient-to-b from-slate-800 to-slate-900 rounded-b-[40px] flex flex-col justify-center items-center px-6 overflow-hidden shrink-0 shadow-lg">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-20%] right-[-10%] w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-50 blur-2xl pointer-events-none"></div>
        <div className="absolute top-10 left-10 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl pointer-events-none"></div>
        
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-1 text-center drop-shadow-sm">Reset Password</h1>
        <p className="text-blue-100 text-center text-[13px] font-medium px-6 leading-relaxed">
          {isSent ? "Periksa email Anda untuk instruksi pemulihan." : "Masukkan email terdaftar Anda untuk menerima tautan reset."}
        </p>

        <div className="mt-4 flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
          <ShieldCheck size={14} className="text-green-300" />
          <span className="text-[10px] text-white/90 font-medium tracking-wide">Secured by Arc Network</span>
        </div>
      </div>

      <button onClick={onBack} className="absolute top-8 left-6 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all shadow-sm z-50">
        <ArrowLeft size={22} strokeWidth={2.5} className="-ml-0.5" />
      </button>

      {/* Bottom Area: Form */}
      <div className="flex-1 px-8 pt-8 pb-10 flex flex-col bg-white">
        
        <div className="flex-1 flex flex-col justify-center">
            {isSent ? (
               <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
                     <CheckCircle2 size={32} />
                  </div>
                  <h2 className="text-[16px] font-bold text-slate-800 mb-2">Tautan Terkirim</h2>
                  <p className="text-slate-500 text-[13px] mb-8">
                     Kami telah mengirimkan instruksi pemulihan password ke <br/><b className="text-slate-700">{email}</b>
                  </p>
                  <button 
                     onClick={onBack}
                     className="w-full font-bold text-[15px] py-4 rounded-2xl transition-all duration-300 flex justify-center items-center gap-2 border-0 active:scale-[0.98] bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                     Kembali ke Login
                  </button>
               </div>
            ) : (
               <div className="animate-in fade-in duration-300">
                  <h2 className="text-[16px] font-bold text-slate-800 mb-6 text-center">Pemulihan Akun</h2>
                  
                  <div className="w-full relative mb-6 group">
                  <input 
                     type="email" 
                     placeholder="Alamat Email"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="w-full bg-[#f8fafc] border-[1.5px] border-slate-200 focus:border-slate-900 rounded-2xl py-4 px-5 pl-12 text-slate-800 text-[15px] font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100/50 shadow-sm transition-all"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                     <Mail size={20} strokeWidth={2} />
                  </div>
                  </div>

                  <button 
                  onClick={email.length > 0 ? handleReset : undefined}
                  className={`w-full font-bold text-[15px] py-4 rounded-2xl transition-all duration-300 flex justify-center items-center gap-2 border-0 active:scale-[0.98]
                     ${email.length > 0 
                     ? 'bg-slate-900 text-white shadow-[0_8px_20px_rgba(63,162,246,0.25)] hover:bg-slate-800' 
                     : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}
                  >
                  Kirim Tautan Reset
                  </button>
               </div>
            )}
        </div>
      </div>
    </div>
  )
}
