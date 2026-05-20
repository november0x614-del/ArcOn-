import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Search, 
  Calendar, 
  Wallet, 
  ArrowRight, 
  Shield, 
  Smartphone, 
  Circle, 
  Info,
  CheckSquare,
  Square
} from 'lucide-react';

interface InboxScreenProps {
  onBack: () => void;
  onTransactionClick?: () => void;
}

export function InboxScreen({ onBack, onTransactionClick }: InboxScreenProps) {
  const [activeTab, setActiveTab] = useState<'resi' | 'notifikasi' | 'promo'>('resi');
  const [selectedNotification, setSelectedNotification] = useState<{title: string, desc: string, date: string} | null>(null);
  
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletedIds, setDeletedIds] = useState<Record<string, boolean>>({});

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    const newDeleted = { ...deletedIds };
    selectedIds.forEach(id => {
      newDeleted[id] = true;
    });
    setDeletedIds(newDeleted);
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds([]);
  };

  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50 animate-in slide-in-from-bottom duration-300">
      {/* Search & Back Header */}
      <div className="px-4 pt-12 pb-2 bg-white flex items-center justify-between shrink-0">
        {isSelectionMode ? (
          <div className="flex items-center justify-between w-full">
            <button onClick={toggleSelectionMode} className="text-slate-500 font-bold text-[14px]">Cancel</button>
            <div className="font-bold text-slate-800 tracking-tight">Select Items</div>
            <button 
              onClick={handleDeleteSelected} 
              disabled={selectedIds.length === 0}
              className={`font-bold text-[14px] transition-colors ${selectedIds.length > 0 ? "text-red-500" : "text-slate-300"}`}
            >
              Delete
            </button>
          </div>
        ) : (
          <>
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-slate-800" />
            </button>
            <div className="flex items-center gap-3">
              <button className="text-[#3FA2F6] bg-blue-50 p-2.5 rounded-full"><Search size={18} strokeWidth={2.5} /></button>
              <button onClick={toggleSelectionMode} className="text-slate-400 p-2.5 rounded-full bg-slate-50 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
            </div>
          </>
        )}
      </div>

      {/* Segmented Tabs Control */}
      <div className="px-4 py-2 shrink-0 border-b border-slate-100 bg-white">
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center relative gap-1">
          <button 
             onClick={() => setActiveTab('resi')}
             className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] transition-all relative z-10 ${
                activeTab === 'resi' ? 'bg-white text-[#3FA2F6] shadow-sm' : 'text-slate-400 hover:text-slate-600'
             }`}
          >
             Receipts
          </button>
          <button 
             onClick={() => setActiveTab('notifikasi')}
             className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] transition-all relative z-10 ${
                activeTab === 'notifikasi' ? 'bg-white text-[#3FA2F6] shadow-sm' : 'text-slate-400 hover:text-slate-600'
             }`}
          >
             Notifications
          </button>
          <button 
             onClick={() => setActiveTab('promo')}
             className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] transition-all relative z-10 ${
                activeTab === 'promo' ? 'bg-white text-[#3FA2F6] shadow-sm' : 'text-slate-400 hover:text-slate-600'
             }`}
          >
             Promos
          </button>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="flex-1 overflow-y-auto">
         {activeTab === 'resi' && <ResiContent onTransactionClick={onTransactionClick} isSelectionMode={isSelectionMode} selectedIds={selectedIds} onToggleSelect={handleToggleSelect} deletedIds={deletedIds} />}
         {activeTab === 'notifikasi' && <NotifikasiContent onNotificationClick={(title, desc, date) => setSelectedNotification({title, desc, date})} isSelectionMode={isSelectionMode} selectedIds={selectedIds} onToggleSelect={handleToggleSelect} deletedIds={deletedIds} />}
         {activeTab === 'promo' && <PromoContent isSelectionMode={isSelectionMode} selectedIds={selectedIds} onToggleSelect={handleToggleSelect} deletedIds={deletedIds} />}
      </div>

      {/* Notification Modal */}
      {selectedNotification && !isSelectionMode && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedNotification(null)}></div>
          <div className="bg-white rounded-[24px] p-6 w-full max-w-[320px] relative z-10 flex flex-col animate-in zoom-in-95 duration-200 shadow-2xl">
             <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-[#3FA2F6] uppercase tracking-wider">{selectedNotification.date}</span>
                  <h3 className="font-bold text-[18px] text-slate-800 leading-tight pr-4">{selectedNotification.title}</h3>
                </div>
             </div>
             <p className="text-[14px] text-slate-600 leading-relaxed pb-6 border-b border-slate-100">{selectedNotification.desc}</p>
             <button 
                onClick={() => setSelectedNotification(null)}
                className="mt-4 w-full py-3.5 bg-slate-100 text-slate-700 font-bold text-[14px] rounded-xl hover:bg-slate-200 active:scale-[0.98] transition-all"
             >
                Close
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResiContent({ 
  onTransactionClick, 
  isSelectionMode,
  selectedIds = [],
  onToggleSelect,
  deletedIds = {} 
}: { 
  onTransactionClick?: () => void, 
  isSelectionMode?: boolean,
  selectedIds?: string[],
  onToggleSelect?: (id: string) => void,
  deletedIds?: Record<string, boolean>
}) {
  if (deletedIds['allResiLuarBiasa']) {
    return (
      <div className="flex flex-col items-center justify-center p-8 mt-12 animate-in fade-in">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
          <Info size={32} />
        </div>
        <h3 className="font-bold text-[16px] text-slate-800 mb-1">No receipts yet</h3>
        <p className="text-[13px] text-slate-500 text-center">New transaction receipts will appear here.</p>
      </div>
    );
  }

  const resiSatu = !deletedIds['t1'];
  const resiDua = !deletedIds['t2'];
  const resiTiga = !deletedIds['t3'];
  const resiEmpat = !deletedIds['t4'];
  const resiLima = !deletedIds['t5'];

  if (!resiSatu && !resiDua && !resiTiga && !resiEmpat && !resiLima) {
     return (
      <div className="flex flex-col items-center justify-center p-8 mt-12 animate-in fade-in">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
          <Info size={32} />
        </div>
        <h3 className="font-bold text-[16px] text-slate-800 mb-1">All receipts deleted</h3>
        <p className="text-[13px] text-slate-500 text-center">No receipts left.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between px-4 mt-6">
         <h3 className="font-extrabold text-[18px] text-slate-800 tracking-tight">Recent</h3>
         <button className="text-slate-400 p-2 rounded-full bg-slate-50"><Calendar size={18} /></button>
      </div>

      {(resiSatu || resiDua) && (
        <div className="flex flex-col gap-4 px-4">
          <h4 className="text-[13px] font-bold text-slate-500 tracking-wide mt-2">18 Mei 2026</h4>
          {resiSatu && <TransactionItem 
            id="t1"
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds.includes('t1')}
            onToggleSelect={onToggleSelect}
            icon={<Wallet size={22} className="text-[#3FA2F6]" />}
            title="GoPay Customer - RAKYAN INUKERTAPATI"
            status="Successful"
            amount="- Rp 361.000"
            onClick={onTransactionClick}
          />}
          {resiDua && <TransactionItem 
            id="t2"
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds.includes('t2')}
            onToggleSelect={onToggleSelect}
            icon={<Wallet size={22} className="text-[#3FA2F6]" />}
            title="GoPay Customer - RAKYAN INUKERTAPATI"
            status="Successful"
            amount="- Rp 941.000"
            onClick={onTransactionClick}
          />}
        </div>
      )}

      {resiTiga && (
        <div className="flex flex-col gap-4 px-4">
          <h4 className="text-[13px] font-bold text-slate-500 tracking-wide mt-2">11 Mei 2026</h4>
          <TransactionItem 
            id="t3"
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds.includes('t3')}
            onToggleSelect={onToggleSelect}
            icon={<Wallet size={22} className="text-[#3FA2F6]" />}
            title="GoPay Customer - RAKYAN INUKERTAPATI"
            status="Successful"
            amount="- Rp 461.000"
            onClick={onTransactionClick}
          />
        </div>
      )}
      
      {resiEmpat && (
        <div className="flex flex-col gap-4 px-4">
          <h4 className="text-[13px] font-bold text-slate-500 tracking-wide mt-2">04 Mei 2026</h4>
          <TransactionItem 
            id="t4"
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds.includes('t4')}
            onToggleSelect={onToggleSelect}
            icon={<Wallet size={22} className="text-[#3FA2F6]" />}
            title="GoPay Customer - RAKYAN INUKERTAPATI"
            status="Successful"
            amount="- Rp 781.000"
            onClick={onTransactionClick}
          />
        </div>
      )}
      
      {resiLima && (
        <div className="flex flex-col gap-4 px-4">
          <h4 className="text-[13px] font-bold text-slate-500 tracking-wide mt-2">30 Apr 2026</h4>
          <TransactionItem 
            id="t5"
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds.includes('t5')}
            onToggleSelect={onToggleSelect}
            icon={<ArrowRight size={22} className="text-[#3FA2F6]" />}
            title="Bank Negara Indonesia - ARGA SATYAGRAHA"
            status="Successful"
            amount="- Rp 5.002.500"
            onClick={onTransactionClick}
          />
        </div>
      )}
    </div>
  );
}

interface TransactionItemProps {
  id?: string;
  icon: React.ReactNode;
  title: string;
  status: string;
  amount: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onClick?: () => void;
}

function TransactionItem({ id, icon, title, status, amount, isSelectionMode, isSelected, onToggleSelect, onClick }: TransactionItemProps) {
  const handleClick = () => {
    if (isSelectionMode && id) {
      onToggleSelect?.(id);
    } else {
      onClick?.();
    }
  };

  return (
    <div 
      className="flex items-start justify-between bg-white cursor-pointer active:scale-[0.98] transition-transform group"
      onClick={handleClick}
    >
      <div className="flex gap-3 items-start pr-4">
         {isSelectionMode && (
           <div className="mt-1 shrink-0 w-6 flex items-center justify-center -mr-1">
             {isSelected ? <CheckSquare size={20} className="text-blue-500" /> : <Square size={20} className="text-slate-300" />}
           </div>
         )}
         <div className="mt-0.5 w-8 h-8 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors rounded-full">{icon}</div>
         <div className="flex flex-col">
            <h5 className="font-medium text-[14px] text-slate-800 leading-snug mb-1">{title}</h5>
            <span className="text-[12px] text-emerald-500 font-medium">{status}</span>
         </div>
      </div>
      <div className="flex shrink-0">
         <span className="font-medium text-[14px] text-slate-800">{amount}</span>
         <span className="text-[10px] font-bold text-slate-700 mt-0.5 ml-0.5">00</span>
      </div>
    </div>
  );
}

function NotifikasiContent({ 
  onNotificationClick, 
  isSelectionMode,
  selectedIds = [],
  onToggleSelect,
  deletedIds = {}
}: { 
  onNotificationClick?: (title: string, desc: string, date: string) => void, 
  isSelectionMode?: boolean,
  selectedIds?: string[],
  onToggleSelect?: (id: string) => void,
  deletedIds?: Record<string, boolean>
}) {
  const [readIds, setReadIds] = useState<string[]>([]);

  const handleClick = (id: string, title: string, desc: string, date: string) => {
    if (!readIds.includes(id)) {
      setReadIds(prev => [...prev, id]);
    }
    onNotificationClick?.(title, desc, date);
  };

  const markAllRead = () => {
    setReadIds(['n1', 'n2', 'n3', 'n4', 'n5']);
  };

  if (deletedIds['allNotifikasiLuarBiasa']) {
    return (
      <div className="flex flex-col items-center justify-center p-8 mt-12 animate-in fade-in">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
          <Info size={32} />
        </div>
        <h3 className="font-bold text-[16px] text-slate-800 mb-1">No notifications yet</h3>
        <p className="text-[13px] text-slate-500 text-center">Your activity notifications will appear here.</p>
      </div>
    );
  }

  const notificationsLuarBiasaSatu = !deletedIds['n1'];
  const notificationsLuarBiasaDua = !deletedIds['n2'];
  const notificationsLuarBiasaTiga = !deletedIds['n3'];
  const notificationsLuarBiasaEmpat = !deletedIds['n4'];
  const notificationsLuarBiasaLima = !deletedIds['n5'];

  if (!notificationsLuarBiasaSatu && !notificationsLuarBiasaDua && !notificationsLuarBiasaTiga && !notificationsLuarBiasaEmpat && !notificationsLuarBiasaLima) {
     return (
      <div className="flex flex-col items-center justify-center p-8 mt-12 animate-in fade-in">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
          <Info size={32} />
        </div>
        <h3 className="font-bold text-[16px] text-slate-800 mb-1">All messages deleted</h3>
        <p className="text-[13px] text-slate-500 text-center">No notifications left.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 px-4 mt-6">
        <h3 className="font-bold text-[18px] text-slate-800 tracking-tight mb-2">Priority</h3>
        {notificationsLuarBiasaSatu && (
          <NotificationItem 
            id="n1"
            isRead={readIds.includes('n1')}
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds.includes('n1')}
            onToggleSelect={onToggleSelect}
            icon={<div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0"><Shield size={16} className="text-amber-500 fill-amber-100" /></div>}
            title="Complete Your TIN Data Now, Y..."
            desc="Complete the registration process by entering your Tax Identification Number (TIN) data first."
            date="10/03/2025"
            onClick={() => handleClick('n1', "Let's Complete Your TIN Data Now!", "Complete the registration process by entering your Tax Identification Number (TIN) data first to meet regulatory requirements and unlock all features of Arc Commerce.", "10/03/2025")}
          />
        )}
      </div>

      <div className="w-full h-2 bg-slate-50 mt-4 border-y border-slate-100"></div>

      <div className="flex flex-col gap-4 mt-2 px-4">
        <div className="flex justify-between items-center mb-2">
           <h3 className="font-bold text-[18px] text-slate-800 tracking-tight">Account Info</h3>
           <button onClick={markAllRead} className="text-[#3FA2F6] text-[13px] font-bold px-2 py-1 hover:bg-blue-50 rounded-lg transition-colors">Mark as Read</button>
        </div>
        
        {notificationsLuarBiasaDua && (
          <NotificationItem 
            id="n2"
            isRead={readIds.includes('n2')}
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds.includes('n2')}
            onToggleSelect={onToggleSelect}
            icon={<div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><span className="w-3 h-3 bg-yellow-400 rounded-sm"></span></div>}
            title="GoPay Is No Longer Connected"
            desc="Your GoPay account is no longer connected to Livin'. Reconnect your GoPay account anytime th..."
            date="27 Apr"
            onClick={() => handleClick('n2', "GoPay Is No Longer Connected", "Your GoPay account is no longer connected to Livin'. Reconnect your GoPay account anytime through the Settings menu.", "27 Apr")}
          />
        )}

        {notificationsLuarBiasaTiga && (
          <NotificationItem 
            id="n3"
            isRead={readIds.includes('n3')}
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds.includes('n3')}
            onToggleSelect={onToggleSelect}
            icon={<div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><Smartphone size={16} className="text-slate-500" /></div>}
            title="Mobile Number Change Success..."
            desc="The number connected to the Livin' application has been changed to 6281318056437. Henceforth, all..."
            date="27 Apr"
            onClick={() => handleClick('n3', "Mobile Number Change Successful", "The number connected to the Livin' application has been changed to 6281318056437. Henceforth, all notifications will be sent to this number.", "27 Apr")}
          />
        )}

        {notificationsLuarBiasaEmpat && (
          <NotificationItem 
            id="n4"
            isRead={readIds.includes('n4')}
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds.includes('n4')}
            onToggleSelect={onToggleSelect}
            icon={<div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0"><Circle size={16} className="text-amber-500 fill-amber-500" strokeWidth={0} /></div>}
            title="SiAap Cash Withdrawal Token Used"
            desc="Here is your Cash Withdrawal Token. Fast use it at the nearest ATM before its validity expires..."
            date="10 Mar"
            onClick={() => handleClick('n4', "SiAap Cash Withdrawal Token Used", "Here is your Cash Withdrawal Token. Immediately use it at the nearest ATM before its validity expires at 15:00 WIB.", "10 Mar")}
          />
        )}

        {notificationsLuarBiasaLima && (
          <NotificationItem 
            id="n5"
            isRead={readIds.includes('n5')}
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds.includes('n5')}
            onToggleSelect={onToggleSelect}
            icon={<div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0"><Circle size={16} className="text-amber-500 fill-amber-500" strokeWidth={0} /></div>}
            title="Cash Withdrawal Transaction Succes..."
            desc="Here are the details of your cash withdrawal transaction at Mandiri ATM. Withdrawal Token - 602765 Amount ..."
            date="10 Mar"
            onClick={() => handleClick('n5', "Cash Withdrawal Transaction Successful!", "Here are the details of your cash withdrawal transaction at Mandiri ATM. Withdrawal Token - 602765 Amount Rp 500.000.", "10 Mar")}
          />
        )}
      </div>
    </div>
  );
}

interface NotificationItemProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  date: string;
  isRead?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onClick?: () => void;
}

function NotificationItem({ id, icon, title, desc, date, isRead, isSelectionMode, isSelected, onToggleSelect, onClick }: NotificationItemProps) {
  const handleClick = () => {
    if (isSelectionMode) {
      onToggleSelect?.(id);
    } else {
      onClick?.();
    }
  };

  return (
    <div className={"flex items-start gap-4 mb-2 cursor-pointer group transition-opacity " + ((isRead && !isSelectionMode) ? "opacity-60" : "opacity-100")} onClick={handleClick}>
       {isSelectionMode && (
         <div className="mt-1.5 shrink-0 flex items-center justify-center -mr-1">
           {isSelected ? <CheckSquare size={20} className="text-blue-500" /> : <Square size={20} className="text-slate-300" />}
         </div>
       )}
       <div className="mt-1 shrink-0 relative">
          {icon}
          {!isRead && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>}
       </div>
       <div className="flex flex-col flex-1 border-b border-slate-100 pb-5 pt-1">
          <div className="flex justify-between items-start mb-1 gap-2">
             <h5 className={`font-bold text-[14px] transition-colors leading-tight ${isRead ? 'text-slate-600' : 'text-slate-800'} group-hover:text-blue-600`}>{title}</h5>
             <span className="text-[12px] text-slate-500 shrink-0 font-medium">{date}</span>
          </div>
          <p className="text-[12px] text-slate-600/90 leading-[1.6] line-clamp-2 pr-2">{desc}</p>
       </div>
    </div>
  );
}

function PromoContent({ 
  isSelectionMode,
  selectedIds = [],
  onToggleSelect,
  deletedIds = {}
}: { 
  isSelectionMode?: boolean,
  selectedIds?: string[],
  onToggleSelect?: (id: string) => void,
  deletedIds?: Record<string, boolean>
}) {
  if (deletedIds['allPromo'] || deletedIds['p1']) {
    return (
      <div className="flex flex-col items-center justify-center p-8 mt-12 animate-in fade-in">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
          <Info size={32} />
        </div>
        <h3 className="font-bold text-[16px] text-slate-800 mb-1">No promos yet</h3>
        <p className="text-[13px] text-slate-500 text-center">Look forward to exciting promos just for you.</p>
      </div>
    );
  }

  const handleClick = () => {
    if (isSelectionMode) {
      onToggleSelect?.('p1');
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center px-4 mt-6">
         <h3 className="font-bold text-[18px] text-slate-800 tracking-tight">Exclusive for You</h3>
      </div>
      
      <div className="px-4 flex items-start gap-3">
         {isSelectionMode && (
           <div className="mt-20 shrink-0 w-6 flex items-center justify-center -mr-1" onClick={handleClick}>
             {selectedIds.includes('p1') ? <CheckSquare size={20} className="text-blue-500 cursor-pointer" /> : <Square size={20} className="text-slate-300 cursor-pointer" />}
           </div>
         )}
         <div className="flex-1 rounded-[16px] overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] relative bg-white group cursor-pointer" onClick={handleClick}>
            <div className="bg-gradient-to-tr from-blue-100 to-indigo-50 h-[170px] relative overflow-hidden group-hover:opacity-90 transition-opacity">
               {/* Banner Abstract Image block */}
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[120%] h-[120%] bg-blue-600/10 rounded-full blur-2xl absolute -top-10 -right-10"></div>
                  <div className="w-[150%] h-[150%] bg-indigo-900/5 mix-blend-multiply opacity-50 absolute inset-0 rotate-12 scale-150 border-[50px] border-dashed border-indigo-200/30 rounded-full"></div>
               </div>
               
               <div className="absolute top-3 left-3 bg-[#f59e0b] text-white text-[11px] font-bold px-2 py-0.5 rounded flex items-center shadow-sm z-10">
                  New
               </div>
            </div>
            
            <div className="p-5 bg-white relative">
               <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 -mt-10 relative z-10 border-4 border-white shadow-sm">
                  <Info size={18} className="fill-blue-600 text-white" />
               </div>
               
               <h4 className="font-bold text-[17px] text-slate-800 mb-4 leading-snug pr-4 group-hover:text-blue-600 transition-colors">Looking for Assets at the Best Prices? 😉</h4>
               
               <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50/80 border border-slate-100 rounded-[8px] mb-4">
                  <span className="text-[14px]">⌛</span>
                  <span className="text-[11px] font-bold text-slate-700">Valid Until</span>
                  <span className="text-[12px] font-medium text-slate-500 ml-1">May 31, 2026</span>
               </div>
               
               <p className="text-[13px] text-slate-600 leading-[1.6]">
                  A wide selection of assets are available, ranging from properties to vehicles with attractive deals!
               </p>
            </div>
         </div>
      </div>
      
      <div className="flex justify-center mt-2 gap-1.5">
         <div className="w-6 h-1.5 bg-[#3FA2F6] rounded-full"></div>
         <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
         <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
         <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
      </div>
      
      <div className="w-full h-2 bg-slate-50 mt-2 border-y border-slate-100 z-10 relative"></div>
      
      <div className="flex justify-between items-center px-4 mt-2">
         <h3 className="font-bold text-[18px] text-slate-800 tracking-tight">Only on Arc Commerce</h3>
      </div>
    </div>
  );
}
export { NotificationItem, TransactionItem };
