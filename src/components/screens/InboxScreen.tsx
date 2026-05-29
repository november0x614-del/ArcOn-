import React, { useState } from "react";
import {
  ArrowLeft,
  Search,
  Calendar,
  Wallet,
  ArrowRight,
  Shield,
  Smartphone,
  Circle,
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
  const [activeTab, setActiveTab] = useState<
    "receipts" | "notifications" | "promos"
  >("receipts");
  const [selectedNotification, setSelectedNotification] = useState<{
    title: string;
    desc: string;
    date: string;
  } | null>(null);

  const getReceipts = () => {
    return transactions.filter(
      (t) => t.status === "success" || t.status === "failed",
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
          <button
            onClick={() => setActiveTab("promos")}
            className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] transition-all relative z-10 ${
              activeTab === "promos"
                ? "bg-white text-slate-850 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Promos
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
        {activeTab === "promos" && <PromoContent />}
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
  const [sortOrder, setSortOrder] = React.useState<"desc" | "asc">("desc");
  const visibleTransactions = transactions.filter(
    (t) => t.status === "success" || t.status === "failed",
  );

  const sortedTransactions =
    sortOrder === "asc"
      ? [...visibleTransactions].reverse()
      : visibleTransactions;

  if (visibleTransactions.length === 0) {
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
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between px-4 mt-6">
        <h3 className="font-extrabold text-[18px] text-slate-800 tracking-tight">
          Recent {sortOrder === "asc" && "(Oldest First)"}
        </h3>
        <button
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          className={`p-2 rounded-full transition-colors cursor-pointer border-0 ${sortOrder === "asc" ? "bg-emerald-100 text-emerald-600" : "text-slate-400 bg-slate-50 hover:bg-slate-100"}`}
        >
          <Calendar size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-4 px-4">
        {sortedTransactions.map((tx: any) => {
          const isRead = readReceiptIds.includes(tx.id);
          return (
            <div key={tx.id} className="relative">
              <TransactionItem
                id={tx.id}
                icon={
                  tx.type === "batchTransfer" ? (
                    <Layers size={22} className="text-indigo-500" />
                  ) : tx.type === "purchase" || tx.type === "transfer" ? (
                    <Wallet size={22} className="text-slate-800" />
                  ) : (
                    <ArrowRight size={22} className="text-emerald-500" />
                  )
                }
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
  onClick?: () => void;
  isRead?: boolean;
}

function TransactionItem({
  icon,
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
          className={`mt-0.5 w-8 h-8 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition-colors rounded-full ${!isRead ? "bg-slate-100/30" : ""}`}
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
  const [readIds, setReadIds] = useState<string[]>([]);

  const handleClick = (
    id: string,
    title: string,
    desc: string,
    date: string,
  ) => {
    if (!readIds.includes(id)) {
      setReadIds((prev) => [...prev, id]);
    }
    onNotificationClick?.(title, desc, date);
  };

  const markAllRead = () => {
    setReadIds(["n1", "n2", "n3", "n4", "n5"]);
  };

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 px-4 mt-6">
        <h3 className="font-bold text-[18px] text-slate-800 tracking-tight mb-2">
          Priority
        </h3>
        <NotificationItem
          id="n1"
          isRead={readIds.includes("n1")}
          icon={
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Shield size={16} className="text-amber-500 fill-amber-100" />
            </div>
          }
          title="Complete Your TIN Data Now, Y..."
          desc="Complete the registration process by entering your Tax Identification Number (TIN) data first."
          date="10/03/2025"
          onClick={() =>
            handleClick(
              "n1",
              "Let's Complete Your TIN Data Now!",
              "Complete the registration process by entering your Tax Identification Number (TIN) data first to meet regulatory requirements and unlock all features of Lounge.",
              "10/03/2025",
            )
          }
        />
      </div>

      <div className="w-full h-2 bg-slate-50 mt-4 border-y border-slate-100"></div>

      <div className="flex flex-col gap-4 mt-2 px-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-[18px] text-slate-800 tracking-tight">
            Account Info
          </h3>
          <button
            onClick={markAllRead}
            className="text-slate-800 text-[13px] font-bold px-2 py-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Mark as Read
          </button>
        </div>

        <NotificationItem
          id="n2"
          isRead={readIds.includes("n2")}
          icon={
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <span className="w-3 h-3 bg-yellow-400 rounded-sm"></span>
            </div>
          }
          title="GoPay Is No Longer Connected"
          desc="Your GoPay account is no longer connected to Lounge. Reconnect your GoPay account anytime th..."
          date="27 Apr"
          onClick={() =>
            handleClick(
              "n2",
              "GoPay Is No Longer Connected",
              "Your GoPay account is no longer connected to Lounge. Reconnect your GoPay account anytime through the Settings menu.",
              "27 Apr",
            )
          }
        />

        <NotificationItem
          id="n3"
          isRead={readIds.includes("n3")}
          icon={
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <Smartphone size={16} className="text-slate-500" />
            </div>
          }
          title="Mobile Number Change Success..."
          desc="The number connected to the Lounge application has been changed to 6281318056437. Henceforth, all..."
          date="27 Apr"
          onClick={() =>
            handleClick(
              "n3",
              "Mobile Number Change Successful",
              "The number connected to the Lounge application has been changed to 6281318056437. Henceforth, all notifications will be sent to this number.",
              "27 Apr",
            )
          }
        />

        <NotificationItem
          id="n4"
          isRead={readIds.includes("n4")}
          icon={
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Circle
                size={16}
                className="text-amber-500 fill-amber-500"
                strokeWidth={0}
              />
            </div>
          }
          title="SiAap Cash Withdrawal Token Used"
          desc="Here is your Cash Withdrawal Token. Fast use it at the nearest ATM before its validity expires..."
          date="10 Mar"
          onClick={() =>
            handleClick(
              "n4",
              "SiAap Cash Withdrawal Token Used",
              "Here is your Cash Withdrawal Token. Immediately use it at the nearest ATM before its validity expires at 15:00 UTC.",
              "10 Mar",
            )
          }
        />

        <NotificationItem
          id="n5"
          isRead={readIds.includes("n5")}
          icon={
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Circle
                size={16}
                className="text-amber-500 fill-amber-500"
                strokeWidth={0}
              />
            </div>
          }
          title="Cash Withdrawal Transaction Succes..."
          desc="Here are the details of your cash withdrawal transaction at Mandiri ATM. Withdrawal Token - 602765 Amount ..."
          date="10 Mar"
          onClick={() =>
            handleClick(
              "n5",
              "Cash Withdrawal Transaction Successful!",
              "Here are the details of your cash withdrawal transaction at Mandiri ATM. Withdrawal Token - 602765 Amount 50.00 USDC.",
              "10 Mar",
            )
          }
        />
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
  onClick?: () => void;
}

function NotificationItem({
  icon,
  title,
  desc,
  date,
  isRead,
  onClick,
}: NotificationItemProps) {
  return (
    <div
      className={
        "flex items-start gap-4 mb-2 cursor-pointer group transition-opacity " +
        (isRead ? "opacity-60" : "opacity-100")
      }
      onClick={onClick}
    >
      <div className="mt-1 shrink-0 relative">
        {icon}
        {!isRead && (
          <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
        )}
      </div>
      <div className="flex flex-col flex-1 border-b border-slate-100 pb-5 pt-1">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h5
            className={`font-bold text-[14px] transition-colors leading-tight ${isRead ? "text-slate-600" : "text-slate-800"} group-hover:text-slate-600`}
          >
            {title}
          </h5>
          <span className="text-[12px] text-slate-500 shrink-0 font-medium">
            {date}
          </span>
        </div>
        <p className="text-[12px] text-slate-600/90 leading-[1.6] line-clamp-2 pr-2">
          {desc}
        </p>
      </div>
    </div>
  );
}

function PromoContent() {
  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center px-4 mt-6">
        <h3 className="font-bold text-[18px] text-slate-800 tracking-tight">
          Exclusive for You
        </h3>
      </div>

      <div className="px-4 flex items-start gap-3">
        <div className="flex-1 rounded-[16px] overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] relative bg-white group cursor-pointer">
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

            <h4 className="font-bold text-[17px] text-slate-800 mb-4 leading-snug pr-4 group-hover:text-slate-600 transition-colors">
              Looking for Assets at the Best Prices? 😉
            </h4>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50/80 border border-slate-100 rounded-[8px] mb-4">
              <span className="text-[14px]">⌛</span>
              <span className="text-[11px] font-bold text-slate-700">
                Valid Until
              </span>
              <span className="text-[12px] font-medium text-slate-500 ml-1">
                May 31, 2026
              </span>
            </div>

            <p className="text-[13px] text-slate-600 leading-[1.6]">
              A wide selection of assets are available, ranging from properties
              to vehicles with attractive deals!
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
        <h3 className="font-bold text-[18px] text-slate-800 tracking-tight">
          Only on Lounge
        </h3>
      </div>
    </div>
  );
}
export { NotificationItem, TransactionItem };
