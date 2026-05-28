import React from "react";
import { Search, ChevronRight } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  wallet: string;
  walletId: string;
  createdAt: string;
  status: string;
}

interface UsersTabProps {
  users: AdminUser[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectUser: (u: AdminUser) => void;
}

export function UsersTab({
  users,
  loading,
  searchQuery,
  setSearchQuery,
  onSelectUser,
}: UsersTabProps) {
  const filteredUsers = users.filter(
    (u) =>
      (u.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (u.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (u.wallet?.toLowerCase() || "").includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="mb-4">
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50 transition-all shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Filter users by identity, email or hex address..."
            className="bg-transparent flex-1 outline-none font-semibold text-[14px] placeholder:text-slate-400 text-slate-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-1 rounded-md uppercase"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/80 sticky top-0 z-10">
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100">Identity</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 hidden md:table-cell">Wallet Identifier</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-[13px] font-bold animate-pulse">
                    SYNCING GLOBAL USER STORE...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-[13px] font-bold">
                    NO USER RECORDS FOUND
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, i) => (
                  <tr 
                    key={u.id} 
                    onClick={() => u.id !== "00000000-0000-0000-0000-000000000000" && onSelectUser(u)}
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[11px] border border-slate-200">
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 text-[13px] tracking-tight truncate max-w-[140px] md:max-w-none">{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-medium truncate max-w-[140px] md:max-w-none">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 hidden md:table-cell">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-mono text-slate-500 font-bold tracking-tighter">
                          {u.wallet.substring(0, 12)}...{u.wallet.substring(u.wallet.length - 8)}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium mt-0.5">Circle Developer-Controlled</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-tight ${
                        u.status === "Blocked" ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}>
                        {u.status === "Blocked" ? "Inactive" : "Normal"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {u.id !== "00000000-0000-0000-0000-000000000000" ? (
                        <div className="inline-flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl font-bold text-[11px] opacity-0 group-hover:opacity-100 transition-all active:scale-95">
                          Inspect <ChevronRight size={12} />
                        </div>
                      ) : (
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic pr-2">System</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
