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
    <div className="p-4 space-y-4 animate-in fade-in duration-300">
      <div className="bg-white border text-[13px] border-slate-200 rounded-xl px-3 py-2.5 flex items-center gap-2 focus-within:border-slate-800 transition-colors shadow-sm">
        <Search size={16} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search users by email or address..."
          className="bg-transparent flex-1 outline-none font-medium placeholder:text-slate-400 text-slate-700"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <span>Account Details</span>
          <span>Network Status</span>
        </div>

        {loading && users.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-slate-500 font-medium">
            Retrieving user wallets directly from database cluster...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-slate-500 font-medium">
            No users matching query.
          </div>
        ) : (
          filteredUsers.map((u, i) => (
            <div
              key={i}
              onClick={() => {
                if (u.id !== "00000000-0000-0000-0000-000000000000") {
                  onSelectUser(u);
                }
              }}
              className={`px-4 py-3.5 border-b border-slate-50 flex justify-between items-center transition-colors ${
                u.id !== "00000000-0000-0000-0000-000000000000"
                  ? "cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/50"
                  : ""
              }`}
            >
              <div className="flex flex-col min-w-0 flex-1 pr-4">
                <span className="font-bold text-[14px] text-slate-800 tracking-tight leading-none mb-1">
                  {u.name}
                </span>
                <span className="text-[11px] text-slate-500 font-medium font-mono truncate">
                  {u.email}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                  Wallet Address: {u.wallet}
                </span>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="hidden sm:inline px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {u.id.substring(0, 8)}...
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.status === "Blocked" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                >
                  {u.status === "Archived"
                    ? "Terarsipkan"
                    : u.status === "Blocked"
                      ? "Tidak Aktif"
                      : "Aktif"}
                </span>
                {u.id !== "00000000-0000-0000-0000-000000000000" ? (
                  <div className="flex items-center gap-1 text-slate-400 ml-1.5 bg-slate-50 border border-slate-100 px-2 py-1 rounded-xl group-hover:text-slate-800 transition-colors">
                    <span className="text-[11px] font-bold text-slate-500">
                      Kelola
                    </span>
                    <ChevronRight size={13} />
                  </div>
                ) : (
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-100/60 border border-slate-200/50 px-2 py-1 rounded-lg ml-1.5">
                    Platform Admin
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
