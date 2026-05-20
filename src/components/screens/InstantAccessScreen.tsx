import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Settings, 
  QrCode, 
  Nfc, 
  ArrowDownToLine, 
  CreditCard, 
  Zap 
} from 'lucide-react';

interface InstantAccessScreenProps {
  onBack: () => void;
}

export function InstantAccessScreen({ onBack }: InstantAccessScreenProps) {
  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-center relative py-4 shrink-0 shadow-sm z-10 bg-white">
        <button onClick={onBack} className="absolute left-4 p-1 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-700" />
        </button>
        <h2 className="font-bold text-[16px] text-slate-800">Instant Access</h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-10 bg-white">
        <div className="px-6 pt-6 pb-6 flex flex-col items-center text-center w-full">
          <p className="text-[14px] text-slate-600 leading-[1.6]">
            Perform favorite transactions without logging in. Let's activate it to save time!
          </p>
          <div className="w-full max-w-[200px] h-[200px] mt-6 mb-2">
             <img src="https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&q=80&w=300&h=300" className="w-full h-full object-cover mix-blend-multiply opacity-90" alt="illustration" />
          </div>
        </div>

        <div className="flex flex-col">
           <InstantAccessItem 
             icon={<Search size={22} className="text-[#3FA2F6]" />}
             title="Peek Balance"
             desc="Check savings balance, credit card remaining limit, and transaction mutations."
             enabled={true}
             hasSettings={true}
           />
           <InstantAccessItem 
             icon={<QrCode size={22} className="text-[#3FA2F6]" />}
             title="QR Pay"
             desc="Pay QR by scanning or uploading codes more practically without logging in!"
             enabled={false}
           />
           <InstantAccessItem 
             icon={<Nfc size={22} className="text-[#3FA2F6]" />}
             title="Tap to Pay"
             desc="Tap phone to enter and exit public transport or to shop."
             enabled={false}
           />
           <InstantAccessItem 
             icon={<ArrowDownToLine size={22} className="text-[#3FA2F6]" />}
             title="Deposit or Withdraw"
             desc="Create tokens faster for cardless deposits or cash withdrawals at Mandiri ATMs."
             enabled={true}
             hasSettings={true}
           />
           <InstantAccessItem 
             icon={<CreditCard size={22} className="text-[#3FA2F6]" />}
             title="Instant e-money"
             desc="Top up favorite e-money card balances for a smooth trip."
             enabled={false}
           />
           <InstantAccessItem 
             icon={<Zap size={22} className="text-[#3FA2F6]" />}
             title="Quick Pick"
             desc="Transfer, top-up, and pay favorite bills succinctly."
             enabled={false}
           />
           <InstantAccessItem 
             icon={<Nfc size={22} className="text-[#3FA2F6]" />}
             title="Tap & Pay"
             desc="Pay this and that by bringing your phone closer to..."
             enabled={false}
           />
        </div>
      </div>
    </div>
  );
}

interface InstantAccessItemProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  enabled: boolean;
  hasSettings?: boolean;
}

function InstantAccessItem({ icon, title, desc, enabled, hasSettings }: InstantAccessItemProps) {
  const [isOn, setIsOn] = useState(enabled);
  return (
    <div className="flex items-start gap-4 px-5 py-5 border-b border-slate-100/60 bg-white">
      <div className="shrink-0 pt-0.5">
        {icon}
      </div>
      <div className="flex-1 flex flex-col gap-1">
         <div className="flex items-start justify-between mb-1">
            <h4 className="font-bold text-[15px] text-slate-800">{title}</h4>
            <div 
              role="button"
              className={`rounded-full flex items-center shrink-0 ml-4 px-[2px] cursor-pointer transition-colors duration-300 ${isOn ? 'bg-[#3FA2F6]' : 'bg-slate-300'}`}
              onClick={() => setIsOn(!isOn)}
              style={{ width: '46px', height: '24px' }}
            >
              <div className={`w-[20px] h-[20px] bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isOn ? 'translate-x-[22px]' : 'translate-x-0'}`}></div>
            </div>
         </div>
         <p className="text-[13px] text-slate-500 leading-[1.5] pr-8">{desc}</p>
         {hasSettings && isOn && (
           <button className="flex items-center gap-1.5 mt-3 px-3 py-1.5 border border-[#3FA2F6]/30 text-[#3FA2F6] rounded-full w-max bg-blue-50/40 hover:bg-blue-50 transition-colors">
              <Settings size={14} />
              <span className="font-bold text-[12px] pr-0.5">Manage</span>
           </button>
         )}
      </div>
    </div>
  );
}
