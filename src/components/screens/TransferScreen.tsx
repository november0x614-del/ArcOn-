import React, { useState, useEffect } from "react";
import { ArrowLeft, UserPlus, Users, Star, X, Settings2, Copy, Check } from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useContacts } from "../../hooks/useContacts";
import { BackendClient } from "../../services/api";
import { useStore } from "../../store/useStore";

interface TransferScreenProps {
  onBack: () => void;
  onNewTransfer: () => void;
  onSelectContact: (contact: any) => void;
  onBatchTransfer: () => void;
  hideBack?: boolean;
}

interface ContactItemProps {
  key?: string;
  initials: string;
  name: string;
  network: string;
  address: string;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  isManageContacts?: boolean;
  isSelected?: boolean;
  onSelectManage?: () => void;
}

function ContactItem({
  initials,
  name,
  network,
  address,
  isExpanded,
  onToggle,
  onSelect,
  onToggleFavorite,
  isFavorite,
  isManageContacts,
  isSelected,
  onSelectManage,
}: ContactItemProps) {
  const [copied, setCopied] = useState(false);
  const displayToast = useStore((state) => state.displayToast);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopied(true);
    displayToast("Address copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert default dynamic heavy user names into human-friendly, beautiful minimalist lower addresses
  const displayName = React.useMemo(() => {
    if (name.toUpperCase().startsWith("USER_0X")) {
      const addrHex = name.substring(5); // removes USER_
      return addrHex.toLowerCase();
    }
    return name;
  }, [name]);

  // Clean initials rendering: display a beautiful generic Wallet/User vector icon for numeric hex fallback avatars
  const isDigitOnly = /^\d+$/.test(initials);
  const avatarEl = React.useMemo(() => {
    if (isDigitOnly || displayName.startsWith("0x")) {
      return (
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-100 shrink-0">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 border border-slate-100 shrink-0 text-[12px]">
        {initials}
      </div>
    );
  }, [initials, isDigitOnly, displayName]);

  return (
    <div className="flex flex-col mb-3 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_12px_rgba(15,23,42,0.02)] p-3 relative z-10 w-full hover:shadow-[0_8px_20px_rgba(15,23,42,0.04)] hover:border-slate-200 transition-all duration-300">
      <div
        className="flex items-center gap-3.5 cursor-pointer rounded-xl group"
        onClick={
          isManageContacts ? onSelectManage : isExpanded ? onSelect : onToggle
        }
      >
        {avatarEl}
        <span
          className={`font-semibold text-[13.5px] tracking-tight relative z-20 ${
            isManageContacts
              ? isSelected
                ? "text-slate-900 font-bold"
                : "text-slate-600 font-medium"
              : "text-slate-800"
          }`}
        >
          {displayName}
        </span>
      </div>

      {(isExpanded || isManageContacts) && (
        <div
          onClick={isManageContacts ? onSelectManage : onSelect}
          className="mt-3 pt-3 border-t border-slate-100/70 flex justify-between items-center w-full cursor-pointer animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2 w-full">
            {isManageContacts && (
              <div
                className={`w-5 h-5 rounded-[4px] border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-slate-800 border-slate-800" : "border-slate-300 bg-white"}`}
              >
                {isSelected && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="w-3.5 h-3.5 text-white"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
            )}
            <div className="text-left w-full overflow-hidden flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {network}
              </span>
              <div className="flex items-center gap-1.5 mt-1 w-full justify-between">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {!isManageContacts && isExpanded && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite?.();
                      }}
                      className="p-1 -ml-1 z-10 shrink-0 hover:scale-110 transition-transform active:scale-95 border-0 bg-transparent flex items-center justify-center cursor-pointer"
                    >
                      {isFavorite ? (
                        <Star
                          className="text-yellow-400 fill-yellow-400"
                          size={15}
                        />
                      ) : (
                        <Star className="text-slate-400" size={15} />
                      )}
                    </button>
                  )}

                  <p className="text-[12px] font-mono font-medium text-slate-500 truncate">
                    {address}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors border-0 bg-transparent flex items-center justify-center cursor-pointer shrink-0 z-10"
                  title="Copy Address"
                >
                  {copied ? (
                    <Check className="text-emerald-500 stroke-[3]" size={12} />
                  ) : (
                    <Copy size={12} strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TransferScreen({
  onBack,
  onNewTransfer,
  onSelectContact,
  onBatchTransfer,
  hideBack,
}: TransferScreenProps) {
  const { startSyncPolling, stopSyncPolling } = useApp();
  const { realContacts: allContacts } = useContacts();
  const { 
    favorites, 
    setFavorites,
    deletedContactIds, 
    deleteContacts 
  } = useStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [contactToDelete, setContactToDelete] = useState<any | null>(null);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);

  React.useEffect(() => {
    startSyncPolling();
    return () => stopSyncPolling();
  }, [startSyncPolling, stopSyncPolling]);

  const realContacts = React.useMemo(() => {
    const deletedSet = new Set(deletedContactIds.map(id => String(id).toLowerCase().trim()));
    return allContacts.filter((c) => {
      const cId = String(c.id || c.number || "").toLowerCase().trim();
      return !deletedSet.has(cId);
    });
  }, [allContacts, deletedContactIds]);

  const realFavorites = React.useMemo(() => {
    const deletedSet = new Set(deletedContactIds.map(id => String(id).toLowerCase().trim()));
    return favorites.filter((f) => {
      const fId = String(f.id || f.number || "").toLowerCase().trim();
      return fId && !deletedSet.has(fId);
    });
  }, [favorites, deletedContactIds]);

  const handleToggleFavorite = (contact: any) => {
    const contactIdClean = String(contact.id || contact.number || "").toLowerCase().trim();
    const isFav = favorites.some((f) => String(f.id || f.number || "").toLowerCase().trim() === contactIdClean);
    const newFavs = isFav
      ? favorites.filter((f) => String(f.id || f.number || "").toLowerCase().trim() !== contactIdClean)
      : [...favorites, contact];
    
    setFavorites(newFavs);
  };

  const [isManageContacts, setIsManageContacts] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <div className="w-full h-full bg-[#ecf5fc] relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex justify-center bg-slate-900 shadow-md relative z-10 shrink-0 w-full">
        <div className="flex items-center px-4 pt-6 pb-3 w-full max-w-[500px] justify-between">
          <div className="flex items-center">
            {!hideBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent mr-2 flex items-center justify-center animate-in fade-in"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
            )}
            <h2 className="font-bold text-[16px] text-white tracking-wide uppercase">
              {isManageContacts ? "Manage Accounts" : "Transfer"}
            </h2>
          </div>
          <button
            onClick={onBatchTransfer}
            className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full flex items-center text-[12px] font-bold gap-1.5 hover:bg-slate-200 transition-colors active:scale-95 border border-slate-200"
          >
            <Users size={16} strokeWidth={2.5} /> Batch Transfer
          </button>
        </div>
      </div>

      {/* Sub Content area */}
      <div className="flex-1 w-full flex flex-col overflow-hidden relative">
        {/* Scrollable List Area */}
        <div className="flex-1 overflow-y-auto w-full px-4 md:px-6 pb-24 scrollbar-hide">
          <div className="w-full max-w-[500px] mx-auto flex flex-col relative">
            {/* Favorites Section */}
          {!isManageContacts && (realFavorites.length > 0 || isLoadingFavorite) && (
            <div className="mb-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-end mb-4 pr-1 mt-6">
                <h3 className="text-slate-400 font-semibold text-[15px]">
                  Favorites
                </h3>
              </div>

              {isLoadingFavorite ? (
                <div className="flex justify-center items-center py-6 h-[80px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-transparent border-t-slate-800 border-l-slate-800"></div>
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto scrollbar-hide mt-4 mb-2">
                  {realFavorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="flex flex-col items-center w-max gap-2 cursor-pointer group relative active:scale-95 transition-all"
                      onClick={() => {
                        onSelectContact({
                          name: fav.name,
                          bank: fav.network,
                          account: fav.number,
                          initials: fav.initials,
                        });
                      }}
                    >
                      <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center font-bold shadow-sm shrink-0 text-[14px] transition-colors bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200">
                        {fav.initials}
                      </div>
                      <span className="text-[11px] font-semibold text-center w-16 line-clamp-2 leading-tight text-slate-800">
                        {fav.name.split(" ")[0]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Transfer List Header */}
          <div className="flex justify-between items-end mb-4 pr-1 mt-6">
            <h3 className="text-slate-400 font-semibold text-[15px]">
              Transfer List
            </h3>
            <button
              onClick={() => {
                setIsManageContacts(!isManageContacts);
                setSelectedContacts([]);
              }}
              className={`p-2 rounded-full transition-all active:scale-95 ${isManageContacts ? "text-red-500 bg-red-50" : "text-slate-900 bg-slate-100"}`}
            >
              {isManageContacts ? (
                <X size={20} />
              ) : (
                <Settings2 size={20} strokeWidth={2} />
              )}
            </button>
          </div>

          {/* Tab Pill */}
          <div className="bg-[#f1f5f9] text-slate-500 px-4 py-1.5 rounded-full w-max text-[12px] font-semibold mb-6">
            Other Accounts
          </div>

          {/* Contacts */}
          <div className="flex flex-col w-full relative pb-[80px]">
            {realContacts.length === 0 ? (
              <div className="py-12 px-4 text-center flex flex-col items-center animate-in fade-in duration-300">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-100/50 shadow-sm">
                  <UserPlus size={20} />
                </div>
                <p className="text-[14px] text-slate-700 font-semibold">No Contacts Found</p>
                <p className="text-[12px] text-slate-400 mt-1 max-w-[245px] leading-relaxed">
                  Start sending transfer transactions or create scheduled payment items to populate your ledger.
                </p>
              </div>
            ) : (
              <>
                {/* Vertical line connector */}
                <div className="absolute left-[23px] top-8 bottom-0 w-[1px] bg-slate-100 z-0"></div>

                {realContacts.map((contact) => (
                  <ContactItem
                    key={contact.id}
                    initials={contact.initials || "??"}
                    name={contact.name}
                    network={contact.network}
                    address={contact.number}
                    isExpanded={expandedId === contact.id}
                    onToggle={() =>
                      setExpandedId(expandedId === contact.id ? null : contact.id)
                    }
                    onSelect={() =>
                      onSelectContact({
                        name: contact.name,
                        bank: contact.network,
                        account: contact.number,
                        initials: contact.initials,
                      })
                    }
                    onToggleFavorite={() => handleToggleFavorite(contact)}
                    isFavorite={realFavorites.some((f) => String(f.id || f.number || "").toLowerCase().trim() === String(contact.id || contact.number || "").toLowerCase().trim())}
                    isManageContacts={isManageContacts}
                    isSelected={selectedContacts.includes(contact.id)}
                    onSelectManage={() => {
                      setSelectedContacts((prev) =>
                        prev.includes(contact.id)
                          ? prev.filter((id) => id !== contact.id)
                          : [...prev, contact.id],
                      );
                    }}
                  />
                ))}
              </>
            )}
          </div>
          </div>
        </div>

        {/* Floating Action Button */}
        {!contactToDelete && (
          <div className="absolute bottom-7 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-[460px] z-20 transition-all duration-300">
            {isManageContacts ? (
              <button
                onClick={() => {
                  if (selectedContacts.length > 0) {
                    setShowDeleteModal(true);
                  }
                }}
                disabled={selectedContacts.length === 0}
                className={`w-full py-[14px] rounded-full font-bold text-[14px] shadow-lg transition-all active:scale-[0.98] duration-300 border-0 cursor-pointer flex items-center justify-center gap-2 ${
                  selectedContacts.length > 0
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-red-200/40"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                }`}
              >
                {selectedContacts.length > 0
                  ? `Delete Selected (${selectedContacts.length})`
                  : "Select Contacts to Delete"}
              </button>
            ) : (
              <button
                onClick={onNewTransfer}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-[14px] rounded-full font-bold text-[14px] shadow-lg flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer border-0"
              >
                <UserPlus size={18} strokeWidth={2.5} /> Transfer to New Recipient
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete Contact Modal (Manage Mode) */}
      {showDeleteModal && (
        <div className="absolute inset-0 z-[60] bg-black/40 flex flex-col justify-end transition-opacity overflow-hidden">
          <div className="bg-white rounded-t-[24px] w-full flex flex-col pb-8 pt-6 shadow-2xl animate-in slide-in-from-bottom duration-300 relative">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute right-4 top-4 text-slate-400 p-1 hover:bg-slate-100 rounded-full transition-colors bg-transparent border-0 cursor-pointer"
            >
              <X size={24} strokeWidth={2} />
            </button>

            <div className="px-5 flex items-start gap-3 mb-4 mt-2">
              <div className="w-[28px] h-[28px] min-w-[28px] rounded-full border-[2.5px] border-slate-900 text-slate-900 flex items-center justify-center font-extrabold text-[15px]">
                !
              </div>
              <h3 className="font-bold text-[18px] text-slate-900 pt-0.5">
                {selectedContacts.length > 1 ? "Delete designated contacts?" : "Delete this contact?"}
              </h3>
            </div>
            <div className="px-5 flex flex-col gap-2">
              <p className="text-slate-600 text-[14px] mb-8 font-medium leading-relaxed pr-2 text-left">
                {selectedContacts.length > 1
                  ? "Selected contacts will be completely hidden from your transfer list and favorites. This action is fully reversible."
                  : "This contact will also be removed from your Favorites list and completely hidden from your transfer history. You can still initiate manual transfers to this address anytime."}
              </p>
              <button
                onClick={async () => {
                  await deleteContacts(selectedContacts);
                  setSelectedContacts([]);
                  setShowDeleteModal(false);
                  setIsManageContacts(false);
                }}
                className="w-full bg-red-500 hover:bg-red-600 active:scale-[0.98] transition-all text-white py-4 rounded-full font-bold text-[15px] shadow-lg mb-2 cursor-pointer border-0"
              >
                Delete ({selectedContacts.length})
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full bg-transparent hover:bg-slate-100 text-slate-500 py-3 rounded-full font-bold text-[14px] transition-all active:scale-[0.98] cursor-pointer border-0 uppercase tracking-wider"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Favorite Modal */}
    </div>
  );
}
export default TransferScreen;
