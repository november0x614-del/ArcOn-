import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { 
  ArrowLeft, 
  Copy, 
  Send, 
  Receipt, 
  Plus, 
  CreditCard, 
  Search, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft,
  Coins,
  Eye,
  Lock,
  Settings
} from 'lucide-react';

interface AccountDetailScreenProps {
  onBack: () => void;
  onTransfer: () => void;
  onTopup: () => void;
  onPayVA?: () => void;
  onTransactionClick?: () => void;
  userName?: string;
}

export function AccountDetailScreen({ 
  onBack, 
  onTransfer, 
  onTopup,
  onPayVA,
  onTransactionClick,
  userName = "ALEXANDER D"
}: AccountDetailScreenProps) {
  const [activeTab, setActiveTab] = useState<'transaksi' | 'token'>('transaksi');
  const [showCard, setShowCard] = useState(false);
  
  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50 animate-in slide-in-from-right duration-300 overflow-hidden">
      {/* Top Header Section - Blue Gradient */}
      <div className="bg-gradient-to-b from-[#3FA2F6] to-blue-600 pt-12 pb-24 px-4 relative shrink-0 z-10 flex flex-col items-center overflow-hidden w-full">
        {/* Background abstract curves */}
        <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-30px] left-[-30px] w-[150px] h-[150px] bg-blue-400/30 rounded-full blur-xl"></div>
        
        <button onClick={onBack} className="absolute left-4 top-10 p-2 hover:bg-white/10 rounded-full transition-colors z-20">
          <ArrowLeft size={24} className="text-white" />
        </button>

        {/* Header Title */}
        <div className="w-full flex justify-center items-center z-10 h-10 mt-[-4px]">
           <h2 className="text-white text-[16px] font-semibold tracking-wide">USDC Savings</h2>
        </div>

        {/* Wallet Address & Balance Content */}
        <div className="flex flex-col items-center mt-6 z-10">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 mb-3 hover:bg-white/20 transition-colors cursor-pointer">
            <span className="text-white/90 text-[13px] font-mono tracking-wider">0x742d...f44e</span>
            <Copy size={13} className="text-white/80" />
          </div>

          <div className="flex items-baseline gap-1 mt-1">
             <span className="text-blue-100 text-[16px] font-semibold mb-1">USDC</span>
             <h1 className="text-white text-[42px] font-bold tracking-tight leading-none drop-shadow-sm">
               1,134<span className="text-[20px] text-white/90 font-semibold">.66</span>
             </h1>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex justify-center gap-[18px] mt-6 w-full z-10 px-2">
          <DetailActionButton icon={<Send size={20} />} label={`Transfer\nUSDC`} onClick={onTransfer} />
          <DetailActionButton icon={<Receipt size={20} />} label={`Pay/VA`} badge="VA" onClick={onPayVA} />
          <DetailActionButton icon={<Plus size={22} />} label="Top-up" onClick={onTopup} />
          <DetailActionButton icon={<CreditCard size={20} />} label={`Card`} isGlow onClick={() => setShowCard(true)} />
        </div>
      </div>

      {/* Main Content Area - White background overlaps the blue */}
      <div className="flex-1 bg-white rounded-t-[32px] -mt-8 z-20 relative overflow-hidden flex flex-col shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        
        <div className="px-6 pt-6 pb-2 shrink-0 border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-6">
             <div 
               className={`flex flex-col items-center border-b-[2.5px] pb-1.5 cursor-pointer transition-colors ${activeTab === 'token' ? 'border-slate-800' : 'border-transparent'}`}
               onClick={() => setActiveTab('token')}
             >
               <h3 className={`font-bold text-[15px] ${activeTab === 'token' ? 'text-slate-800' : 'text-slate-400'}`}>Tokens</h3>
             </div>
             <div 
               className={`flex flex-col items-center border-b-[2.5px] pb-1.5 cursor-pointer transition-colors ${activeTab === 'transaksi' ? 'border-slate-800' : 'border-transparent'}`}
               onClick={() => setActiveTab('transaksi')}
             >
               <h3 className={`font-bold text-[15px] ${activeTab === 'transaksi' ? 'text-slate-800' : 'text-slate-400'}`}>Transactions</h3>
             </div>
           </div>
           {activeTab === 'transaksi' && <button className="text-[#3FA2F6] font-bold text-[13px]">e-Statement</button>}
        </div>

        {activeTab === 'transaksi' && (
          <>
            <div className="flex items-center px-4 py-3 shrink-0 justify-between">
               <div className="flex gap-4 overflow-x-auto scrollbar-hide py-1 text-[14px] text-slate-500 font-medium">
                 <button className="whitespace-nowrap px-1">February</button>
                 <button className="whitespace-nowrap px-1">March</button>
                 <button className="whitespace-nowrap px-1">April</button>
                 <button className="whitespace-nowrap px-1 text-slate-800 font-bold border-b-[2.5px] border-slate-800 pb-1">May</button>
               </div>
               <div className="flex items-center gap-3 ml-2 shrink-0">
                  <button className="text-[#3FA2F6] bg-blue-50 p-2 rounded-full"><Search size={16} strokeWidth={2.5} /></button>
                  <button className="text-slate-400 p-2 rounded-full bg-slate-50"><Calendar size={16} strokeWidth={2.5} /></button>
               </div>
            </div>

            {/* Transactions List */}
            <div className="flex-1 overflow-y-auto px-4 pb-24 flex flex-col pt-2">
               
               <div className="flex flex-col">
                  <h4 className="text-[12px] font-bold text-slate-400 tracking-wider mb-2">May 18, 2026</h4>
                  <DetailTransactionItem 
                    icon={<div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-slate-400 flex items-center justify-center shrink-0 mt-0.5"><ArrowUpRight size={12} className="text-slate-400" /></div>}
                    title="Transfer USDC"
                    desc={`Transfer to Other Wallet\n0x8823...32a1`}
                    amount="- 6.25 USDC"
                    amountColor="text-slate-800"
                    onClick={onTransactionClick}
                  />
                  <DetailTransactionItem 
                    icon={<div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-slate-400 flex items-center justify-center shrink-0 mt-0.5"><div className="w-[8px] h-[8px] bg-slate-400 rounded-full"></div></div>}
                    title="Gas Fee"
                    desc="Arc network fee"
                    amount="- 0.40 USDC"
                    amountColor="text-slate-800"
                    hideSeparator
                  />
               </div>

               <div className="flex flex-col mt-4">
                  <h4 className="text-[12px] font-bold text-slate-400 tracking-wider mb-2">May 13, 2026</h4>
                  <DetailTransactionItem 
                    icon={<div className="w-[18px] h-[18px] rounded-full bg-[#e6f4fc] flex items-center justify-center shrink-0 mt-0.5"><Receipt size={10} className="text-[#008fcd]" /></div>}
                    title="Bill Settlement"
                    desc={`API Credit Purchase\nCircle Web3 Services`}
                    amount="- 7.87 USDC"
                    amountColor="text-slate-800"
                    badge="+ 1 pts"
                  />
                  <DetailTransactionItem 
                    icon={<div className="w-[18px] h-[18px] rounded-full bg-[#e6f4fc] flex items-center justify-center shrink-0 mt-0.5"><Receipt size={10} className="text-[#008fcd]" /></div>}
                    title="Purchase"
                    desc={`NFT Collection Purchase\n0x66f...b29a`}
                    amount="- 28.75 USDC"
                    amountColor="text-slate-800"
                    badge="+ 1 pts"
                    hideSeparator
                  />
               </div>

               <div className="flex flex-col mt-4">
                  <h4 className="text-[12px] font-bold text-slate-400 tracking-wider mb-2">May 7, 2026</h4>
                  <DetailTransactionItem 
                    icon={<div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-slate-400 flex items-center justify-center shrink-0 mt-0.5"><div className="w-[8px] h-[8px] bg-slate-400 rounded-full"></div></div>}
                    title="Fee"
                    desc={`Bank transaction fee\nGoPay Customer Payment\n082173022116`}
                    amount="- Rp 1.000"
                    amountColor="text-slate-800"
                  />
                  <DetailTransactionItem 
                    icon={<div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-[#008fcd] flex items-center justify-center shrink-0 mt-0.5"><ArrowDownLeft size={12} className="text-[#008fcd]" /></div>}
                    title="Transfer USDC"
                    desc={`Deposit from External Wallet\n0x112b...fca9`}
                    amount="+ 391.31 USDC"
                    amountColor="text-[#008fcd]"
                  />
               </div>

               <div className="flex flex-col mt-4">
                  <h4 className="text-[12px] font-bold text-slate-400 tracking-wider mb-2">May 4, 2026</h4>
                  <DetailTransactionItem 
                    icon={<div className="w-[18px] h-[18px] rounded-full bg-[#e6f4fc] flex items-center justify-center shrink-0 mt-0.5"><Receipt size={10} className="text-[#008fcd]" /></div>}
                    title="Staking"
                    desc={`Deposit to Arc Liquidity Pool\n0x9ad...e92f`}
                    amount="- 48.75 USDC"
                    amountColor="text-slate-800"
                    badge="+ 1 pts"
                  />
                  <DetailTransactionItem 
                    icon={<div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-slate-400 flex items-center justify-center shrink-0 mt-0.5"><div className="w-[8px] h-[8px] bg-slate-400 rounded-full"></div></div>}
                    title="Fee"
                    desc={`Bank transaction fee\nGoPay Customer Payment\n082173022116`}
                    amount="- Rp 1.000"
                    amountColor="text-slate-800"
                    hideSeparator
                  />
               </div>

            </div>
          </>
        )}

        {activeTab === 'token' && (
          <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 flex flex-col gap-4 bg-slate-50/50">
            {/* USDC Token Card */}
            <div className="bg-white rounded-2xl p-4 flex justify-between items-center shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-inner">
                  <Coins size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[16px] text-slate-800 leading-tight">USDC</span>
                  <span className="text-[12px] text-slate-500 font-medium">USD Coin</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-bold text-[16px] text-slate-800">1,134.66</span>
                <span className="text-[12px] text-slate-400 font-medium tracking-wide">~$1,134.66</span>
              </div>
            </div>

            {/* ARC Token Card */}
            <div className="bg-white rounded-2xl p-4 flex justify-between items-center shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-inner relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/40 via-transparent to-blue-500/40"></div>
                   <span className="font-bold text-[10px] tracking-wider italic z-10">ARC</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[16px] text-slate-800 leading-tight">ARC</span>
                  <span className="text-[12px] text-slate-500 font-medium">Arc Network</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-bold text-[16px] text-slate-800">12,450.00</span>
                <span className="text-[12px] text-slate-400 font-medium tracking-wide">~$249.00</span>
              </div>
            </div>

            {/* Empty State / Add Token */}
            <button className="mt-2 w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-[#3FA2F6] hover:border-blue-200 hover:bg-blue-50/50 transition-all font-semibold">
              <Plus size={18} />
              <span className="text-[14px]">Import Token</span>
            </button>
          </div>
        )}
      </div>

      {showCard && (
        <div className="absolute inset-0 z-[100] flex flex-col justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in" 
            onClick={() => setShowCard(false)}
          ></div>
          
          <div className="bg-white rounded-t-[32px] w-full flex flex-col items-center relative z-10 animate-in slide-in-from-bottom-[100%] duration-300 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
            
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mt-4 mb-6"></div>
            
            <div className="px-6 w-full flex flex-col items-center">
              <h3 className="font-bold text-[18px] text-slate-800 mb-6">Your Virtual Card</h3>
              
              {/* Card Design */}
              <VirtualCard userName={userName} />
              
              {/* Card Actions */}
              <div className="flex justify-around w-full mt-8 border-t border-slate-100 pt-6">
                <div className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#3FA2F6] group-active:scale-95 transition-transform">
                    <Eye size={20} />
                  </div>
                  <span className="text-[12px] font-medium text-slate-600">View CVC</span>
                </div>
                
                <div className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-active:scale-95 transition-transform border border-slate-200">
                    <Lock size={20} />
                  </div>
                  <span className="text-[12px] font-medium text-slate-600">Block</span>
                </div>
                
                <div className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-active:scale-95 transition-transform border border-slate-200">
                    <Settings size={20} />
                  </div>
                  <span className="text-[12px] font-medium text-slate-600">Set Limit</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DetailActionButtonProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  onClick?: () => void;
  isGlow?: boolean;
}

export function VirtualCard({ userName }: { userName: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);
  
  const glareOpacity = useTransform(mouseYSpring, [-0.5, 0.5], [0, 0.3]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["-100%", "100%"]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div style={{ perspective: 1000 }} className="w-full">
    <motion.div 
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d"
      }}
      className="w-full aspect-[1.586/1] rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-xl shadow-blue-500/20 bg-gradient-to-br from-slate-900 via-[#1e293b] to-slate-800"
    >
       {/* Glare effect */}
       <motion.div 
         className="absolute inset-0 bg-white/20 pointer-events-none blur-2xl rounded-full"
         style={{
            opacity: glareOpacity,
            y: glareY,
            x: "-20%",
            scale: 2,
            transformStyle: "preserve-3d",
            translateZ: "30px"
         }}
       />

       {/* Abstract patterns */}
       <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" style={{ transform: "translateZ(10px)" }}></div>
       <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" style={{ transform: "translateZ(10px)" }}></div>
       
       <div className="flex justify-between items-start z-10" style={{ transform: "translateZ(30px)" }}>
         <div className="flex items-center gap-1 opacity-90">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <span className="text-white font-bold text-[14px] tracking-widest italic ml-1 font-mono">arc</span>
         </div>
         
         {/* Contactless icon */}
         <div className="flex flex-col gap-1 opacity-80">
            <div className="w-1 h-3 border-r-2 border-white rounded-[50%] rotate-[20deg] ml-2"></div>
            <div className="w-2 h-4 border-r-2 border-white rounded-[50%] rotate-[20deg] ml-1.5 -mt-2"></div>
            <div className="w-3 h-5 border-r-2 border-white rounded-[50%] rotate-[20deg] ml-0.5 -mt-3"></div>
         </div>
       </div>
       
       <div className="flex flex-col z-10 w-full mt-2" style={{ transform: "translateZ(35px)" }}>
         <div className="flex items-center gap-4 text-white/50 mb-1">
           <div className="w-9 h-6 bg-[#ffb700] rounded-sm opacity-90 relative overflow-hidden flex flex-col">
              {/* EMV Chip mockup */}
              <div className="w-full h-[1px] bg-black/20 mt-1"></div>
              <div className="w-full h-[1px] bg-black/20 mt-1"></div>
              <div className="w-full h-[1px] bg-black/20 mt-1"></div>
              <div className="absolute inset-x-3 inset-y-0 border-x border-black/20"></div>
           </div>
           <span className="text-[12px] font-mono tracking-widest text-white/70">Virtual Card</span>
         </div>
         <p className="font-mono text-white text-[22px] tracking-[0.1em] font-semibold drop-shadow-md mt-2">
           4123 5431 8892 4434
         </p>
       </div>
       
       <div className="flex justify-between items-end z-10 mt-1" style={{ transform: "translateZ(40px)" }}>
         <div className="flex flex-col">
           <span className="text-white/60 text-[10px] uppercase font-bold tracking-wider mb-0.5">Card Holder</span>
           <span className="text-white text-[15px] font-medium tracking-wide truncate max-w-[120px] uppercase">{userName}</span>
         </div>
         
         <div className="flex flex-col items-end">
           <div className="flex gap-4">
             <div className="flex flex-col">
                <span className="text-white/60 text-[9px] uppercase font-bold tracking-wider mb-0.5">Valid Thru</span>
                <span className="text-white text-[13px] font-mono tracking-wide">12/28</span>
             </div>
             <div className="flex flex-col">
                <span className="text-white/60 text-[9px] uppercase font-bold tracking-wider mb-0.5">CVC</span>
                <span className="text-white text-[13px] font-mono tracking-wide">•••</span>
             </div>
           </div>
           
           {/* Mastercard/Visa logo mock */}
           <div className="flex -space-x-3 mt-3">
             <div className="w-8 h-8 rounded-full bg-red-500/80 mix-blend-screen"></div>
             <div className="w-8 h-8 rounded-full bg-orange-400/80 mix-blend-screen"></div>
           </div>
         </div>
       </div>
    </motion.div>
    </div>
  );
}

function DetailActionButton({ icon, label, badge, onClick, isGlow }: DetailActionButtonProps) {
  return (
    <div className="flex flex-col items-center gap-2 group cursor-pointer w-16" onClick={onClick}>
      <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.1)] group-active:scale-95 transition-all relative
        ${isGlow ? 'text-blue-600 shadow-[inset_0_0_12px_rgba(63,162,246,0.3),0_4px_12px_rgba(0,0,0,0.1)] border border-blue-50/50' : 'text-[#3FA2F6]'}`}>
        {icon}
        {badge && (
          <div className="absolute -top-[2px] -right-[6px] bg-yellow-400 text-slate-800 text-[9px] font-bold px-1 py-[1px] rounded-[4px] border border-white leading-none">
            {badge}
          </div>
        )}
      </div>
      <span className="text-white text-[11px] font-medium text-center leading-tight whitespace-pre-line tracking-wide opacity-95">
        {label}
      </span>
    </div>
  );
}

interface DetailTransactionItemProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  amount: string;
  amountColor?: string;
  badge?: string;
  hideSeparator?: boolean;
  onClick?: () => void;
}

function DetailTransactionItem({ 
  icon, 
  title, 
  desc, 
  amount, 
  amountColor = "text-slate-800",
  badge,
  hideSeparator,
  onClick
}: DetailTransactionItemProps) {
  return (
    <div className="flex gap-4 p-2 cursor-pointer group active:scale-[0.98] transition-all my-1 text-left w-full" onClick={onClick}>
       <div className="mt-1 w-6 shrink-0 flex justify-center">
          {icon}
       </div>
       <div className={`flex flex-col flex-1 pb-4 ${hideSeparator ? '' : 'border-b border-slate-100'}`}>
          <div className="flex justify-between items-start mb-1">
             <h5 className="font-bold text-[14px] text-slate-800 group-hover:text-[#3FA2F6] transition-colors">{title}</h5>
             <div className="flex flex-col items-end">
                <span className={`font-bold text-[14px] ${amountColor} flex`}>
                  {amount}
                  <span className="text-[9px] mt-0.5 ml-0.5">00</span>
                </span>
             </div>
          </div>
          <p className="text-[12px] text-slate-500 leading-snug whitespace-pre-line max-w-[85%] mt-1">{desc}</p>
          {badge && (
             <div className="mt-2.5 inline-flex items-center gap-1 bg-emerald-55 text-emerald-600 px-2 pt-0.5 pb-1 rounded-full w-fit border border-emerald-100">
                <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center">
                   <span className="text-white text-[8px] font-bold">L</span>
                </div>
                <span className="text-[11px] font-bold tracking-tight">{badge}</span>
             </div>
          )}
       </div>
    </div>
  );
}
export { DetailActionButton, DetailTransactionItem };
