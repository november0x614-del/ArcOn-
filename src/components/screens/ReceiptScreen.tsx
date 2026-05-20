import React from 'react';
import { ArrowLeft, Share2, Download, Receipt as ReceiptIcon, Copy } from 'lucide-react';

interface ReceiptScreenProps {
  onBack: () => void;
}

export function ReceiptScreen({ onBack }: ReceiptScreenProps) {
  return (
    <div className="w-full h-full bg-[#f8fafc] relative flex flex-col z-50 animate-in fade-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="bg-[#3FA2F6] flex items-center justify-between px-4 py-4 z-10 shrink-0 text-white shadow-md">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={24} />
            </button>
            <span className="font-bold text-[16px] tracking-wide">Transaction Receipt</span>
        </div>
        <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
               <Download size={20} />
            </button>
            <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
               <Share2 size={20} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 flex flex-col items-center">
        {/* Receipt Ticket Design */}
        <div className="bg-white rounded-3xl w-full max-w-[320px] shadow-sm border border-slate-100 flex flex-col relative drop-shadow-xl overflow-hidden mt-4">
            
            {/* Ticket Header Graphic */}
            <div className="bg-gradient-to-br from-[#3FA2F6] to-blue-600 p-6 flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-[-30px] right-[-30px] w-[100px] h-[100px] bg-white/20 rounded-full blur-xl"></div>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#3FA2F6] shadow-md z-10 mb-3">
                   <ReceiptIcon size={32} />
                </div>
                <h2 className="text-white font-bold text-[18px] z-10">Transfer Successful</h2>
                <span className="text-blue-100 text-[12px] z-10">May 18, 2026 • 15:42</span>
            </div>

            {/* Jagged edge divider (simulated with CSS circles) */}
            <div className="relative h-4 bg-white overflow-hidden flex transform -translate-y-2">
                <div className="absolute inset-0 flex justify-between space-x-[2px]">
                   {[...Array(20)].map((_, i) => (
                      <div key={i} className="w-3 h-3 bg-[#f8fafc] rounded-full -mt-2"></div>
                   ))}
                </div>
            </div>

            {/* Amount */}
            <div className="flex flex-col items-center pt-2 pb-6 border-b border-dashed border-slate-200 mx-6">
                <span className="text-slate-500 text-[13px] font-medium mb-1">Total Amount</span>
                <h1 className="text-slate-800 text-[32px] font-bold tracking-tight">6.25 <span className="text-[16px] text-slate-500">USDC</span></h1>
            </div>

            {/* Details Table */}
            <div className="px-6 py-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <span className="text-[13px] text-slate-500 font-medium">Transaction Type</span>
                    <span className="text-[13px] font-bold text-slate-800 text-right">Outgoing Transfer</span>
                </div>
                <div className="flex justify-between items-start">
                    <span className="text-[13px] text-slate-500 font-medium">Recipient</span>
                    <div className="flex flex-col items-end">
                        <span className="text-[13px] font-bold text-slate-800">Alexander D</span>
                        <span className="text-[11px] font-mono text-slate-500">0x8823...32a1</span>
                    </div>
                </div>
                <div className="flex justify-between items-start">
                    <span className="text-[13px] text-slate-500 font-medium">Source of Funds</span>
                    <span className="text-[13px] font-bold text-slate-800">USDC Savings</span>
                </div>
                <div className="flex justify-between items-start">
                    <span className="text-[13px] text-slate-500 font-medium">Network Fee</span>
                    <span className="text-[13px] font-bold text-slate-800">0.40 USDC</span>
                </div>
                <div className="flex justify-between items-start">
                    <span className="text-[13px] text-slate-500 font-medium">Reference Number</span>
                    <div className="flex items-center gap-1.5">
                       <span className="text-[11px] font-mono font-bold text-slate-700">TX-9982A1K</span>
                       <Copy size={12} className="text-[#3FA2F6]" />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-medium text-center uppercase tracking-widest">Powered by Arc Network</span>
            </div>
        </div>
      </div>
    </div>
  );
}
