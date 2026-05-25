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
import { useApp } from '../../context/AppContext';

interface InboxScreenProps {
  onBack: () => void;
  onTransactionClick?: (tx: any) => void;
}

export function InboxScreen({ onBack, onTransactionClick }: InboxScreenProps) {
  const { transactions, readReceiptIds, markAsRead } = useApp();
  const [activeTab, setActiveTab] = useState<'resi' | 'notifikasi' | 'promo'>('resi');
  const [selectedNotification, setSelectedNotification] = useState<{title: string, desc: string, date: string} | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletedIds, setDeletedIds] = useState<Record<string, boolean>>({});

  // Mendefinisikan fungsi receipts untuk mengambil daftar resi transaksi yang aktif
  const getReceipts = () => {
    return transactions.filter(t => !deletedIds[t.id] && (t.status === 'success' || t.status === 'failed'));
  };

  const handleToggleSelect = (id: string) => {
    // Check if it's an unread receipt
    if (activeTab === 'resi' && !readReceiptIds.includes(id)) {
      // Allow selection but maybe we won't let it be deleted? 
      // The requirement says "tidak bisa di hapus", so maybe we shouldn't even allow selection
      // But usually it's better to allow selection and then block deletion or show warning.
      // However, "tidak bisa di hapus" is strict. Let's prevent selection or filter it out.
      return; 
    }
    
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const confirmDelete = () => {
    const newDeleted = { ...deletedIds };
    selectedIds.forEach(id => {
      newDeleted[id] = true;
    });
    setDeletedIds(newDeleted);
    setIsSelectionMode(false);
    setSelectedIds([]);
    setShowDeleteConfirm(false);
  };

  const handleSelectAll = () => {
    let allIds: string[] = [];
    if (activeTab === 'resi') {
      allIds = transactions
        .filter(t => !deletedIds[t.id] && readReceiptIds.includes(t.id) && (t.status === 'success' || t.status === 'failed'))
        .map(t => t.id);
    } else if (activeTab === 'notifikasi') {
      // Mock IDs for notifications as they are hardcoded in the component
      allIds = ['n1', 'n2', 'n3', 'n4', 'n5'].filter(id => !deletedIds[id]);
    } else if (activeTab === 'promo') {
      allIds = ['p1'].filter(id => !deletedIds[id]);
    }
    
    if (selectedIds.length === allIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds([]);
  };

  const handleReceiptClick = (tx: any) => {
    markAsRead(tx.id);
    if (true) {
      onTransactionClick?.(tx);
    } else {
      /* dead branch */
    }
  };

  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50 animate-in slide-in-from-bottom duration-300">
      {/* Search & Back Header */}
      <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full justify-between shrink-0">
        {isSelectionMode ? (
          <div className="flex items-center justify-between w-full">
            <button onClick={toggleSelectionMode} className="text-slate-300 font-bold text-[14px] hover:text-white transition-colors cursor-pointer border-0 bg-transparent">Cancel</button>
            <button 
              onClick={handleSelectAll}
              className="text-slate-900 font-bold text-[14px] px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              {selectedIds.length > 0 ? "Deselect All" : "Select All"}
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(true)} 
              disabled={selectedIds.length === 0}
              className={`font-bold text-[14px] transition-colors bg-transparent border-0 cursor-pointer ${selectedIds.length > 0 ? "text-red-400" : "text-slate-400"}`}
            >
              Delete ({selectedIds.length})
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center">
              <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent -ml-2">
                <ArrowLeft size={20} className="text-white" />
              </button>
              <h2 className="font-bold text-[16px] text-white ml-2">INBOX</h2>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-white bg-white/10 p-2.5 rounded-full hover:bg-white/20 transition-colors border-0 cursor-pointer"><Search size={18} strokeWidth={2.5} /></button>
              <button onClick={toggleSelectionMode} className="text-slate-300 p-2.5 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-colors border-0 cursor-pointer"><Trash2 size={18} /></button>
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
                activeTab === 'resi' ? 'bg-white text-slate-850 shadow-sm' : 'text-slate-500 hover:text-slate-800'
             }`}
          >
             Resi
          </button>
          <button 
             onClick={() => setActiveTab('notifikasi')}
             className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] transition-all relative z-10 ${
                activeTab === 'notifikasi' ? 'bg-white text-slate-850 shadow-sm' : 'text-slate-500 hover:text-slate-800'
             }`}
          >
             Notifikasi
          </button>
          <button 
             onClick={() => setActiveTab('promo')}
             className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] transition-all relative z-10 ${
                activeTab === 'promo' ? 'bg-white text-slate-850 shadow-sm' : 'text-slate-500 hover:text-slate-800'
             }`}
          >
             Promo
          </button>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="flex-1 overflow-y-auto">
         {activeTab === 'resi' && <ResiContent transactions={getReceipts()} onTransactionClick={handleReceiptClick} isSelectionMode={isSelectionMode} selectedIds={selectedIds} onToggleSelect={handleToggleSelect} readReceiptIds={readReceiptIds} />}
         {activeTab === 'notifikasi' && <NotifikasiContent onNotificationClick={(title, desc, date) => setSelectedNotification({title, desc, date})} isSelectionMode={isSelectionMode} selectedIds={selectedIds} onToggleSelect={handleToggleSelect} deletedIds={deletedIds} />}
         {activeTab === 'promo' && <PromoContent isSelectionMode={isSelectionMode} selectedIds={selectedIds} onToggleSelect={handleToggleSelect} deletedIds={deletedIds} />}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in"></div>
          <div className="bg-white rounded-[28px] p-8 w-full max-w-[340px] relative z-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-200 shadow-2xl border border-slate-100">
             <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <Trash2 size={32} className="text-red-500" />
             </div>
             <h3 className="font-black text-[20px] text-slate-800 mb-2">Delete Items?</h3>
             <p className="text-[14px] text-slate-500 leading-relaxed mb-8">
               Are you sure you want to delete <span className="font-bold text-slate-800">{selectedIds.length}</span> selected items? This action cannot be undone.
             </p>
             <div className="flex flex-col w-full gap-3">
                <button 
                   onClick={confirmDelete}
                   className="w-full py-4 bg-red-500 text-white font-black text-[15px] rounded-2xl hover:bg-red-600 active:scale-[0.98] transition-all shadow-lg shadow-red-500/20"
                >
                   Yes, Delete
                </button>
                <button 
                   onClick={() => setShowDeleteConfirm(false)}
                   className="w-full py-4 bg-slate-100 text-slate-700 font-bold text-[15px] rounded-2xl hover:bg-slate-200 active:scale-[0.98] transition-all"
                >
                   Cancel
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {selectedNotification && !isSelectionMode && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedNotification(null)}></div>
          <div className="bg-white rounded-[24px] p-6 w-full max-w-[320px] relative z-10 flex flex-col animate-in zoom-in-95 duration-200 shadow-2xl">
             <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">{selectedNotification.date}</span>
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
  transactions,
  onTransactionClick, 
  isSelectionMode,
  selectedIds = [],
  onToggleSelect,
  deletedIds = {},
  readReceiptIds = []
}: { 
  transactions: any[],
  onTransactionClick?: (tx: any) => void, 
  isSelectionMode?: boolean,
  selectedIds?: string[],
  onToggleSelect?: (id: string) => void,
  deletedIds?: Record<string, boolean>,
  readReceiptIds?: string[]
}) {
  const visibleTransactions = transactions.filter(t => !deletedIds[t.id] && (t.status === 'success' || t.status === 'failed'));

  if (visibleTransactions.length === 0) {
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

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between px-4 mt-6">
         <h3 className="font-extrabold text-[18px] text-slate-800 tracking-tight">Recent</h3>
         <button className="text-slate-400 p-2 rounded-full bg-slate-50"><Calendar size={18} /></button>
      </div>

      <div className="flex flex-col gap-4 px-4">
        {visibleTransactions.map((tx: any) => {
          const isRead = readReceiptIds.includes(tx.id);
          return (
            <div key={tx.id} className="relative">
              <TransactionItem 
                id={tx.id}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.includes(tx.id)}
                onToggleSelect={onToggleSelect}
                icon={tx.type === 'purchase' || tx.type === 'transfer' ? <Wallet size={22} className="text-slate-800" /> : <ArrowRight size={22} className="text-emerald-500" />}
                title={tx.title}
                status={tx.status === 'success' ? 'Successful' : 'Failed'}
                amount={`${tx.amount} ${tx.currency}`}
                onClick={() => onTransactionClick?.(tx)}
                isRead={isRead}
                disabledSelection={!isRead}
              />
              {!isRead && !isSelectionMode && (
                <div className="absolute top-2 left-10 w-2 h-2 bg-slate-900 rounded-full border border-white z-20"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TransactionItemProps {
  key?: React.Key;
  id?: string;
  icon: React.ReactNode;
  title: string;
  status: string;
  amount: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onClick?: () => void;
  isRead?: boolean;
  disabledSelection?: boolean;
}

function TransactionItem({ id, icon, title, status, amount, isSelectionMode, isSelected, onToggleSelect, onClick, isRead, disabledSelection }: TransactionItemProps) {
  const handleClick = () => {
    if (isSelectionMode && id) {
      if (disabledSelection) return;
      onToggleSelect?.(id);
    } else {
      onClick?.();
    }
  };

  return (
    <div 
      className={`flex items-start justify-between bg-white cursor-pointer active:scale-[0.98] transition-all group p-1 rounded-xl ${isSelectionMode && disabledSelection ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}
      onClick={handleClick}
    >
      <div className="flex gap-3 items-start pr-4">
         {isSelectionMode && (
           <div className="mt-1 shrink-0 w-6 flex items-center justify-center -mr-1">
             {isSelected ? <CheckSquare size={20} className="text-slate-600" /> : <Square size={20} className={`text-slate-300 ${disabledSelection ? 'text-slate-100' : ''}`} />}
           </div>
         )}
         <div className={`mt-0.5 w-8 h-8 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition-colors rounded-full ${!isRead && !isSelectionMode ? 'bg-slate-100/30' : ''}`}>{icon}</div>
         <div className="flex flex-col">
            <h5 className={`font-medium text-[14px] leading-snug mb-1 transition-colors ${!isRead && !isSelectionMode ? 'text-slate-950 font-bold' : 'text-slate-700'}`}>{title}</h5>
            <span className={`text-[12px] font-medium ${status === 'Failed' ? 'text-rose-500' : 'text-emerald-500'}`}>{status}</span>
         </div>
      </div>
      <div className="flex shrink-0">
         <span className={`font-medium text-[14px] transition-colors ${!isRead && !isSelectionMode ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>{amount}</span>
         <span className="text-[10px] font-bold text-slate-400 mt-0.5 ml-0.5">00</span>
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
           <button onClick={markAllRead} className="text-slate-800 text-[13px] font-bold px-2 py-1 hover:bg-slate-100 rounded-lg transition-colors">Mark as Read</button>
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
           {isSelected ? <CheckSquare size={20} className="text-slate-600" /> : <Square size={20} className="text-slate-300" />}
         </div>
       )}
       <div className="mt-1 shrink-0 relative">
          {icon}
          {!isRead && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>}
       </div>
       <div className="flex flex-col flex-1 border-b border-slate-100 pb-5 pt-1">
          <div className="flex justify-between items-start mb-1 gap-2">
             <h5 className={`font-bold text-[14px] transition-colors leading-tight ${isRead ? 'text-slate-600' : 'text-slate-800'} group-hover:text-slate-600`}>{title}</h5>
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
             {selectedIds.includes('p1') ? <CheckSquare size={20} className="text-slate-600 cursor-pointer" /> : <Square size={20} className="text-slate-300 cursor-pointer" />}
           </div>
         )}
         <div className="flex-1 rounded-[16px] overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] relative bg-white group cursor-pointer" onClick={handleClick}>
            <div className="bg-gradient-to-tr from-blue-100 to-indigo-50 h-[170px] relative overflow-hidden group-hover:opacity-90 transition-opacity">
               {/* Banner Abstract Image block */}
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[120%] h-[120%] bg-slate-800/10 rounded-full blur-2xl absolute -top-10 -right-10"></div>
                  <div className="w-[150%] h-[150%] bg-indigo-900/5 mix-blend-multiply opacity-50 absolute inset-0 rotate-12 scale-150 border-[50px] border-dashed border-indigo-200/30 rounded-full"></div>
               </div>
               
               <div className="absolute top-3 left-3 bg-[#f59e0b] text-white text-[11px] font-bold px-2 py-0.5 rounded flex items-center shadow-sm z-10">
                  New
               </div>
            </div>
            
            <div className="p-5 bg-white relative">
               <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center mb-3 -mt-10 relative z-10 border-4 border-white shadow-sm">
                  <Info size={18} className="fill-blue-600 text-white" />
               </div>
               
               <h4 className="font-bold text-[17px] text-slate-800 mb-4 leading-snug pr-4 group-hover:text-slate-600 transition-colors">Looking for Assets at the Best Prices? 😉</h4>
               
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
         <div className="w-6 h-1.5 bg-slate-900 rounded-full"></div>
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
