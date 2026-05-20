import React from 'react';
import { Wallet, ShieldCheck, ChevronRight } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
  onRegister?: () => void;
}

export function LoginScreen({ onLogin, onRegister }: LoginScreenProps) {
  return (
    <div className="w-full h-full bg-white relative flex flex-col justify-between overflow-hidden">
      {/* Top Graphic Area */}
      <div className="relative h-[55%] bg-gradient-to-b from-[#3FA2F6] to-blue-600 rounded-b-[40px] flex flex-col justify-center items-center px-6 overflow-hidden shrink-0">
        {/* Decorative elements */}
        <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-30px] left-[-30px] w-[150px] h-[150px] bg-blue-400/30 rounded-full blur-xl"></div>
        
        <div className="z-10 bg-white/20 p-4 rounded-3xl backdrop-blur-md mb-6 border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
           <div className="bg-white text-[#3FA2F6] p-3 rounded-2xl shadow-sm">
             <Wallet size={36} strokeWidth={2.5}/>
           </div>
        </div>
        
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2 text-center drop-shadow-sm">Arc Commerce</h1>
        <p className="text-blue-100 text-center text-[13px] font-medium px-6 leading-relaxed">
          Kelola aset digital dan nikmati pengalaman transaksi Web3 yang aman & instan.
        </p>

        {/* Security Badge */}
        <div className="mt-8 flex items-center gap-1.5 bg-black/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
          <ShieldCheck size={16} className="text-green-300" />
          <span className="text-[11px] text-white/90 font-medium tracking-wide">Secured by Arc Network</span>
        </div>
      </div>

      {/* Bottom Area: Login Controls */}
      <div className="flex-1 px-6 pt-8 pb-10 flex flex-col justify-end bg-white">
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={onLogin}
            className="w-full bg-[#3FA2F6] hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_8px_20px_rgba(63,162,246,0.25)] flex justify-center items-center gap-2 active:scale-[0.98] border-0"
          >
            Akses Akun <ChevronRight size={18} strokeWidth={2.5} />
          </button>
          
          <button 
            onClick={onRegister}
            className="w-full bg-blue-50 hover:bg-blue-100 text-[#3FA2F6] font-bold py-4 rounded-2xl transition-all flex justify-center items-center active:scale-[0.98] border-0"
          >
            Buat Identitas Baru
          </button>
        </div>

        <p className="text-[11px] text-center text-slate-400 font-medium mt-10 leading-relaxed">
           Dengan masuk atau mendaftar, Anda menyetujui <br/>
           <span className="text-[#3FA2F6] cursor-pointer hover:underline">Syarat Ketentuan</span> dan <span className="text-[#3FA2F6] cursor-pointer hover:underline">Kebijakan Privasi</span> kami.
        </p>
      </div>
    </div>
  )
}
