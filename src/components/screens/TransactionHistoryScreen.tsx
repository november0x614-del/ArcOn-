import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  CheckCircle2,
  Receipt,
  ArrowUpRight,
  ArrowDownToLine,
  RefreshCw,
  ShoppingBag,
  X,
  Search,
  Layers,
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { ARC_TESTNET } from "../../lib/arcConfig";
import { Transaction } from "../../types";

interface TransactionHistoryScreenProps {
  onBack: () => void;
}

export function TransactionHistoryScreen({
  onBack,
}: TransactionHistoryScreenProps) {
  const { transactions } = useApp();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const getExplorerUrl = (txHash: string) => {
    return `${ARC_TESTNET.blockExplorers.default.url}/tx/${txHash}`;
  };

  const getTxIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownToLine size={20} className="text-emerald-500" />;
      case "withdraw":
        return <ArrowUpRight size={20} className="text-red-500" />;
      case "transfer":
        return <ArrowUpRight size={20} className="text-orange-500" />;
      case "batchTransfer":
        return <Layers size={20} className="text-indigo-500" />;
      case "purchase":
        return <ShoppingBag size={20} className="text-purple-500" />;
      case "swap":
        return <RefreshCw size={20} className="text-slate-600" />;
      default:
        return <Receipt size={20} className="text-slate-500" />;
    }
  };

  const getTxBg = (type: string) => {
    switch (type) {
      case "deposit":
        return "bg-emerald-50 border-emerald-100";
      case "withdraw":
        return "bg-red-50 border-red-100";
      case "transfer":
        return "bg-orange-50 border-orange-100";
      case "batchTransfer":
        return "bg-indigo-50 border-indigo-100";
      case "purchase":
        return "bg-purple-50 border-purple-100";
      case "swap":
        return "bg-slate-100 border-slate-200";
      default:
        return "bg-slate-50 border-slate-100";
    }
  };

  // Grouping and Filtering logic
  const filteredAndGroupedTransactions = useMemo(() => {
    const filtered = transactions.filter((tx) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        tx.title.toLowerCase().includes(searchLower) ||
        tx.amount.toLowerCase().includes(searchLower) ||
        tx.type.toLowerCase().includes(searchLower)
      );
    });

    const groups: { [key: string]: Transaction[] } = {};
    filtered.forEach((tx) => {
      // Assuming timestamp format is robust or derived from Date
      // "28/05/2026, 15:35:48" or similar
      const datePart = tx.timestamp.split(",")[0].trim();
      if (!groups[datePart]) groups[datePart] = [];
      groups[datePart].push(tx);
    });

    return Object.entries(groups).sort((a, b) => {
      // Basic reverse chronological sort for dates like DD/MM/YYYY
      const parseDate = (d: string) => {
        const [day, month, year] = d.split("/").map(Number);
        return new Date(year, month - 1, day).getTime();
      };
      return parseDate(b[0]) - parseDate(a[0]);
    });
  }, [transactions, searchQuery]);

  return (
    <div className="w-full h-full bg-[#f8fafc] relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex flex-col px-4 pt-6 pb-4 bg-slate-900 shadow-md relative z-10 w-full shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h2 className="font-bold text-[17px] text-white ml-2 tracking-tight">
              Transaction History
            </h2>
          </div>
        </div>

        {/* Search Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-white text-[13px] font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto w-full px-4">
        {!selectedTx ? (
          <div className="py-4 space-y-6">
            {filteredAndGroupedTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 mt-20">
                <Clock size={48} className="mb-4 opacity-50" />
                <p className="font-medium">
                  No results found matching your search.
                </p>
              </div>
            ) : (
              filteredAndGroupedTransactions.map(([date, txs]) => (
                <div key={date} className="space-y-3">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-2">
                    {date}
                  </h3>
                  <div className="space-y-3">
                    {txs.map((tx) => (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 active:scale-[0.98] transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-full border flex items-center justify-center ${getTxBg(tx.type)}`}
                          >
                            {getTxIcon(tx.type)}
                          </div>
                          <div>
                            <h3 className="font-bold text-[14px] text-slate-800 leading-tight">
                              {tx.title}
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                              {tx.timestamp.split(",")[1]?.trim() ||
                                tx.timestamp}{" "}
                              • {tx.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-bold text-[14px] ${tx.amount.startsWith("+") ? "text-emerald-500" : "text-slate-800"}`}
                          >
                            {tx.amount} {tx.currency}
                          </span>
                          {tx.status === "success" ? (
                            <div className="flex items-center gap-1 mt-1 text-emerald-500">
                              <CheckCircle2 size={12} />
                              <span className="text-[9px] font-extrabold uppercase tracking-widest">
                                Ok
                              </span>
                            </div>
                          ) : tx.status === "failed" ? (
                            <div className="flex items-center gap-1 mt-1 text-red-500">
                              <X size={12} />
                              <span className="text-[9px] font-extrabold uppercase tracking-widest">
                                Fail
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 mt-1 text-amber-500">
                              <Clock size={12} />
                              <span className="text-[9px] font-extrabold uppercase tracking-widest">
                                Wait
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="py-4 animate-in slide-in-from-right duration-300 h-full flex flex-col px-0">
            {/* Tx Detail View */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div
                className={`w-20 h-20 rounded-full border-[3px] flex items-center justify-center mb-6 ${getTxBg(selectedTx.type)}`}
              >
                {getTxIcon(selectedTx.type)}
              </div>
              <h2 className="text-[20px] font-black text-slate-900 mb-1 tracking-tight">
                {selectedTx.title}
              </h2>
              <div
                className={`text-[36px] font-black font-sans tracking-tight my-2 ${selectedTx.amount.startsWith("+") ? "text-emerald-500" : "text-slate-900"}`}
              >
                {selectedTx.amount}{" "}
                <span className="text-[14px] font-bold text-slate-400">
                  {selectedTx.currency}
                </span>
              </div>

              {selectedTx.status === "failed" ? (
                <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-4 py-2 rounded-full mt-2 border border-red-100 shadow-sm">
                  <X size={16} />
                  <span className="text-[12px] font-bold tracking-widest uppercase">
                    Execution Failed
                  </span>
                </div>
              ) : selectedTx.status === "success" ? (
                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full mt-2 border border-emerald-100 shadow-sm">
                  <CheckCircle2 size={16} />
                  <span className="text-[12px] font-bold tracking-widest uppercase">
                    Immutable & Final
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-4 py-2 rounded-full mt-2 border border-amber-100 shadow-sm">
                  <Clock size={16} />
                  <span className="text-[12px] font-bold tracking-widest uppercase">
                    Awaiting Arc Block
                  </span>
                </div>
              )}

              {/* Batch Recipients Breakdown in History Detail */}
              {(selectedTx.type === "batchTransfer" ||
                selectedTx.metadata?.isAtomicBatch) &&
                selectedTx.metadata?.recipients && (
                  <div className="w-full bg-slate-50 rounded-2xl p-4 mt-8 border border-slate-100 text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                      Distribution Summary
                    </p>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                      {(selectedTx.metadata.recipients as any[]).map(
                        (recipient, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-50 shadow-sm"
                          >
                            <div className="flex flex-col">
                              <span className="text-[12px] font-bold text-slate-800">
                                {recipient.name ||
                                  recipient.username ||
                                  "Unknown"}
                              </span>
                              <span className="text-[9px] font-mono text-slate-400">
                                0x...{recipient.address?.slice(-6)}
                              </span>
                            </div>
                            <span className="text-[12px] font-black text-slate-900">
                              {recipient.amount}{" "}
                              <span className="text-[9px] text-slate-400">
                                USDC
                              </span>
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              <div className="w-full h-px bg-slate-50 my-8"></div>

              <div className="w-full space-y-4 px-2">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                    Type
                  </span>
                  <span className="text-[14px] font-bold text-slate-700 capitalize">
                    {selectedTx.type}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                    Blockchain Ref
                  </span>
                  <span className="text-[12px] font-mono font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded">
                    {selectedTx.id.substring(0, 12)}...
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                    Execution Date
                  </span>
                  <span className="text-[13px] font-bold text-slate-800">
                    {selectedTx.timestamp}
                  </span>
                </div>
              </div>

              {selectedTx.txHash && (
                <div className="w-full bg-slate-900 rounded-3xl p-6 mt-8 flex flex-col gap-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                      Arc Network Consensus
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[10px] font-bold text-emerald-500">
                        Live
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono text-left opacity-80 select-all break-all leading-relaxed">
                    {selectedTx.txHash}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="mt-6 w-full bg-white text-slate-900 border border-slate-200 font-black py-4 rounded-[20px] text-[13px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
