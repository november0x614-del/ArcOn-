import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Search,
  Filter,
  Wallet,
  ArrowRight,
  ArrowDownLeft,
  Info,
  Layers,
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";

interface InboxScreenProps {
  onBack: () => void;
  onTransactionClick?: (tx: any) => void;
}

export function InboxScreen({ onBack, onTransactionClick }: InboxScreenProps) {
  const { transactions, readReceiptIds, markAsRead } = useApp();
  const [activeTab, setActiveTab] = useState<"receipts" | "notifications">(
    "receipts",
  );
  const [selectedNotification, setSelectedNotification] = useState<{
    title: string;
    desc: string;
    date: string;
  } | null>(null);

  const getReceipts = () => {
    return transactions.filter(
      (t) => {
        if (t.status === "failed") return true;
        if (t.status === "success") {
           const possibleHash = t.metadata?.txHash || t.txHash || (t as any).tx_hash || t.id;
           if (!possibleHash || typeof possibleHash !== "string") return false;
           const clean = possibleHash.trim().toLowerCase();
           if (
             clean.includes("send_") ||
             clean.includes("swap_") ||
             clean.includes("bridge_") ||
             clean.includes("stake_") ||
             clean.includes("withdraw_") ||
             clean.includes("pay_") ||
             clean.includes("receive_")
           ) {
             return false;
           }
           return clean.startsWith("0x");
        }
        return false;
      }
    );
  };

  const handleReceiptClick = (tx: any) => {
    markAsRead(tx.id);
    onTransactionClick?.(tx);
  };

  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50 animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full justify-between shrink-0">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent -ml-2"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h2 className="font-bold text-[16px] text-white ml-2">INBOX</h2>
        </div>
      </div>

      {/* Segmented Tabs Control */}
      <div className="px-4 py-2 shrink-0 border-b border-slate-100 bg-white">
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center relative gap-1">
          <button
            onClick={() => setActiveTab("receipts")}
            className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] transition-all relative z-10 ${
              activeTab === "receipts"
                ? "bg-white text-slate-850 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Receipts
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] transition-all relative z-10 ${
              activeTab === "notifications"
                ? "bg-white text-slate-850 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Notifications
          </button>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "receipts" && (
          <ResiContent
            transactions={getReceipts()}
            onTransactionClick={handleReceiptClick}
            readReceiptIds={readReceiptIds}
          />
        )}
        {activeTab === "notifications" && (
          <NotifikasiContent
            onNotificationClick={(title, desc, date) =>
              setSelectedNotification({ title, desc, date })
            }
          />
        )}
      </div>

      {/* Notification Modal */}
      {selectedNotification && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
            onClick={() => setSelectedNotification(null)}
          ></div>
          <div className="bg-white rounded-[24px] p-6 w-full max-w-[320px] relative z-10 flex flex-col animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  {selectedNotification.date}
                </span>
                <h3 className="font-bold text-[18px] text-slate-800 leading-tight pr-4">
                  {selectedNotification.title}
                </h3>
              </div>
            </div>
            <p className="text-[14px] text-slate-600 leading-relaxed pb-6 border-b border-slate-100">
              {selectedNotification.desc}
            </p>
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
  readReceiptIds = [],
}: {
  transactions: any[];
  onTransactionClick?: (tx: any) => void;
  readReceiptIds?: string[];
}) {
  const [showFilter, setShowFilter] = useState(false);
  const [filterState, setFilterState] = useState({
    status: "All",
    type: "All",
  });
  
  const filterOptions = {
    status: ["All", "Success", "Failed"],
    type: ["All", "Transfer", "Receive", "Swap", "Batch Transfer", "Mint NFT", "Purchase"]
  };

  const visibleTransactions = transactions.filter((t) => {
    // Status check
    const statusMatch = filterState.status === "All" || 
      (filterState.status === "Success" && t.status === "success") ||
      (filterState.status === "Failed" && t.status === "failed");
    
    if (!statusMatch) return false;

    // Type check
    if (filterState.type === "All") return true;
    
    const typeMap: { [key: string]: string[] } = {
       "Transfer": ["transfer", "withdraw", "send"],
       "Receive": ["receive", "deposit"],
       "Swap": ["swap"],
       "Batch Transfer": ["batchTransfer"],
       "Mint NFT": ["mintNFT"],
       "Purchase": ["purchase"]
    };

    const targetTypes = typeMap[filterState.type] || [];
    return targetTypes.some(type => t.type === type || t.title.toLowerCase().includes(filterState.type.toLowerCase()));
  });

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 mt-12 animate-in fade-in">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
          <Info size={32} />
        </div>
        <h3 className="font-bold text-[16px] text-slate-800 mb-1">
          No receipts yet
        </h3>
        <p className="text-[13px] text-slate-500 text-center">
          New transaction receipts will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-300 relative">
      <div className="flex items-center justify-between px-4 mt-6">
        <div>
          <h3 className="font-extrabold text-[18px] text-slate-800 tracking-tight">
            Recent Receipts
          </h3>
          {/* removed status/type labels */}
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowFilter(!showFilter)}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all border-0 flex shrink-0 cursor-pointer ${
              showFilter || filterState.status !== "All" || filterState.type !== "All"
                ? "bg-slate-900 text-white" 
                : "bg-white text-slate-400 hover:bg-slate-50 border border-slate-100"
            }`}
          >
            <Filter size={16} strokeWidth={2.5}/>
          </button>

          <AnimatePresence>
            {showFilter && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60]" 
                  onClick={() => setShowFilter(false)}
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ type: "spring", duration: 0.3 }}
                  className="absolute right-0 top-14 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 z-[70] flex flex-col"
                >
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-3 block">Transaction Status</label>
                      <div className="flex flex-wrap gap-2">
                         {filterOptions.status.map(s => (
                           <button
                             key={s}
                             onClick={() => setFilterState(prev => ({ ...prev, status: s }))}
                             className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                               filterState.status === s 
                                 ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                                 : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                             }`}
                           >
                             {s}
                           </button>
                         ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-3 block">Transaction Type</label>
                      <div className="flex flex-wrap gap-2">
                         {filterOptions.type.map(t => (
                           <button
                             key={t}
                             onClick={() => setFilterState(prev => ({ ...prev, type: t }))}
                             className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                               filterState.type === t 
                                 ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                                 : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                             }`}
                           >
                             {t}
                           </button>
                         ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setFilterState({ status: "All", type: "All" });
                        setShowFilter(false);
                      }}
                      className="w-full py-2.5 text-[11px] font-black text-rose-500 uppercase tracking-widest border border-rose-100 rounded-xl hover:bg-rose-50 transition-all cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4">
        {visibleTransactions.length === 0 ? (
           <div className="py-20 text-center">
              <p className="text-slate-400 font-bold text-[13px]">No matching records found.</p>
           </div>
        ) : (
          visibleTransactions.map((tx: any) => {
            const isRead = readReceiptIds.includes(tx.id);
            const isIncoming =
              tx.type === "receive" ||
              tx.type === "deposit" ||
              tx.title.includes("Inbound");

            let icon;
            let iconBgClass = "";

            if (tx.type === "batchTransfer") {
              icon = <Layers size={22} className="text-indigo-500" />;
            } else if (tx.type === "purchase" || tx.type === "transfer") {
              icon = <Wallet size={22} className="text-slate-800" />;
            } else if (isIncoming) {
              icon = <ArrowDownLeft size={20} className="text-emerald-500" />;
              iconBgClass = "bg-emerald-50"; 
            } else {
              icon = <ArrowRight size={22} className="text-slate-400" />;
            }

            return (
              <div key={tx.id} className="relative">
                <TransactionItem
                  id={tx.id}
                  icon={icon}
                  iconBgClass={iconBgClass}
                  title={tx.title}
                  status={tx.status === "success" ? "Successful" : "Failed"}
                  amount={`${tx.amount} ${tx.currency}`}
                  onClick={() => onTransactionClick?.(tx)}
                  isRead={isRead}
                />
                {!isRead && (
                  <div className="absolute top-2 left-10 w-2 h-2 bg-slate-900 rounded-full border border-white z-20"></div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

interface TransactionItemProps {
  key?: React.Key;
  id?: string;
  icon: React.ReactNode;
  iconBgClass?: string;
  title: string;
  status: string;
  amount: string;
  onClick?: () => void;
  isRead?: boolean;
}

function TransactionItem({
  icon,
  iconBgClass,
  title,
  status,
  amount,
  onClick,
  isRead,
}: TransactionItemProps) {
  return (
    <div
      className="flex items-start justify-between bg-white cursor-pointer active:scale-[0.98] transition-all group p-1 rounded-xl"
      onClick={onClick}
    >
      <div className="flex gap-3 items-start pr-4">
        <div
          className={`mt-0.5 w-8 h-8 flex items-center justify-center shrink-0 transition-colors rounded-full ${iconBgClass ? iconBgClass : (!isRead ? "bg-slate-100/30" : "group-hover:bg-slate-100")}`}
        >
          {icon}
        </div>
        <div className="flex flex-col">
          <h5
            className={`font-medium text-[14px] leading-snug mb-1 transition-colors ${!isRead ? "text-slate-950 font-bold" : "text-slate-700"}`}
          >
            {title}
          </h5>
          <span
            className={`text-[12px] font-medium ${status === "Failed" ? "text-rose-500" : "text-emerald-500"}`}
          >
            {status}
          </span>
        </div>
      </div>
      <div className="flex shrink-0">
        <span
          className={`font-medium text-[14px] transition-colors ${!isRead ? "text-slate-900 font-bold" : "text-slate-600"}`}
        >
          {amount}
        </span>
        <span className="text-[10px] font-bold text-slate-400 mt-0.5 ml-0.5">
          00
        </span>
      </div>
    </div>
  );
}

function NotifikasiContent({
  onNotificationClick,
}: {
  onNotificationClick?: (title: string, desc: string, date: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 mt-12 animate-in fade-in duration-300">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
        <Info size={32} />
      </div>
      <h3 className="font-bold text-[16px] text-slate-800 mb-1">
        No Notifications
      </h3>
      <p className="text-[13px] text-slate-500 text-center">
        You don't have any new notifications.
      </p>
    </div>
  );
}

function PromoContent() {
  return null;
}

export { TransactionItem };
