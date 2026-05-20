import React from 'react';
import { Wallet } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
  onRegister?: () => void;
}

export function LoginScreen({ onLogin, onRegister }: LoginScreenProps) {
  return (
    <div className="w-full h-full bg-[#0f172a] relative flex flex-col justify-between p-8 text-white">
      {/* Background Abstract Pattern */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 -left-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-[100px]"></div>
      </div>

      {/* Header/Brand */}
      <div className="z-10 mt-12 flex flex-col items-center">
        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
          <Wallet size={32} className="text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold tracking-tighter">Arc Portal</h1>
        <p className="text-slate-400 text-sm mt-1">Decentralized Asset Management</p>
      </div>

      {/* Buttons */}
      <div className="z-10 flex flex-col gap-4 mb-8">
        <button 
          onClick={onLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20"
        >
          Access Account
        </button>
        <button 
          onClick={onRegister}
          className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold py-4 rounded-xl transition-all"
        >
          Create Digital Identity
        </button>
      </div>
    </div>
  )
}
