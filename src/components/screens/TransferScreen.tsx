import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  UserPlus,
  Users,
  Star,
  X,
  Settings2,
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useContacts } from "../../hooks/useContacts";
import { BackendClient } from "../../services/api";

interface TransferScreenProps {
  onBack: () => void;
  onNewTransfer: () => void;
  onSelectContact: (contact: any) => void;
  onBatchTransfer: () => void;
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
  return (
    <div className="flex flex-col mb-4 bg-white relative z-10 w-full">
      <div
        className="flex items-center gap-4 cursor-pointer hover:bg-slate-50 p-1 -ml-1 rounded-xl transition-colors group"
        onClick={
          isManageContacts
            ? onSelectManage
            : isExpanded
              ? onSelect
              : onToggle
        }
      >
        <div className="w-[46px] h-[46px] rounded-full bg-[#f8fafc] flex items-center justify-center font-bold text-slate-700 shadow-sm border border-slate-100 shrink-0 group-hover:border-slate-200 transition-colors text-[13px] relative z-20">
          {initials}
        </div>
        <span
          className={`font-extrabold text-[14px] mt-0.5 relative z-20 ${isManageContacts ? "text-slate-400" : "text-slate-800"}`}
        >
          {name}
        </span>
      </div>

      {(isExpanded || isManageContacts) && (
        <div
          onClick={
          isManageContacts
            ? onSelectManage
            : onSelect
        }
        className={`-mx-5 px-5 mt-[-10px] pt-5 pb-3 ${isManageContacts ? "pl-[24px] bg-white border-b border-slate-50 pb-[10px]" : "pl-[74px] bg-[#f1f5f9] hover:bg-[#e2e8f0] shadow-inner"} overflow-visible ${!isManageContacts ? "cursor-pointer" : ""} transition-colors relative z-0 flex justify-between items-center ${isManageContacts ? "cursor-pointer" : ""}`}
        >
          <div
            className={`flex items-center ${isManageContacts ? "gap-3" : ""}`}
          >
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
            <div className="text-left w-full overflow-hidden">
              <p
                className={`font-bold text-[14px] ${isManageContacts ? "text-slate-600" : "text-slate-800"}`}
              >
                {network}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {isManageContacts && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite?.();
                    }}
                    className="p-1 -ml-1 z-10 shrink-0 hover:scale-110 transition-transform active:scale-95 border-0 bg-transparent flex items-center justify-center cursor-pointer"
                  >
                    {isFavorite ? (
                      <Star className="text-yellow-400 fill-yellow-400" size={16} />
                    ) : (
                      <Star className="text-slate-400" size={16} />
                    )}
                  </button>
                )}
                
                <p
                  className={`text-[13px] font-medium tracking-wide truncate ${isManageContacts ? "text-slate-400" : "text-slate-500"}`}
                >
                  {address}
                </p>
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
}: TransferScreenProps) {
  const { startSyncPolling, stopSyncPolling } = useApp();
  const { realContacts: allContacts } = useContacts();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [contactToDelete, setContactToDelete] = useState<any | null>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [deletedContactIds, setDeletedContactIds] = useState<string[]>([]);
  const [isPreferencesLoaded, setIsPreferencesLoaded] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const prefs = await BackendClient.getPreferences();
        if (prefs) {
          if (prefs.favorites) setFavorites(prefs.favorites);
          if (prefs.deletedContactIds) setDeletedContactIds(prefs.deletedContactIds);
        }
      } catch (e) {
        // Fallback to local storage if API fails
        try {
          const savedFavs = localStorage.getItem("favorites");
          if (savedFavs) setFavorites(JSON.parse(savedFavs));
          const savedDeleted = localStorage.getItem("deleted_contact_ids");
          if (savedDeleted) setDeletedContactIds(JSON.parse(savedDeleted));
        } catch {}
      } finally {
        setIsPreferencesLoaded(true);
      }
    }
    loadPreferences();
  }, []);

  const saveDeletedContactIds = async (ids: string[]) => {
    setDeletedContactIds(ids);
    try {
      localStorage.setItem("deleted_contact_ids", JSON.stringify(ids));
      await BackendClient.updatePreferences({ deletedContactIds: ids });
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    startSyncPolling();
    return () => stopSyncPolling();
  }, [startSyncPolling, stopSyncPolling]);

  const realContacts = React.useMemo(() => {
    return allContacts.filter((c) => !deletedContactIds.includes(c.id));
  }, [allContacts, deletedContactIds]);

  const handleToggleFavorite = (contact: any) => {
    setIsLoadingFavorite(true);

    setTimeout(() => {
      setFavorites((prev) => {
        const isFav = prev.some((f) => f.id === contact.id);
        const newFavs = isFav
          ? prev.filter((f) => f.id !== contact.id)
          : [...prev, contact];
        try {
          localStorage.setItem("favorites", JSON.stringify(newFavs));
          BackendClient.updatePreferences({ favorites: newFavs });
        } catch (e) {
          console.error(e);
        }
        return newFavs;
      });
      setIsLoadingFavorite(false);
    }, 1000);
  };

  const [isManageContacts, setIsManageContacts] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <div className="w-full h-full bg-slate-50 relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full justify-between shrink-0">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h2 className="font-bold text-[16px] text-white ml-2">TRANSFER</h2>
        </div>
          <button
            onClick={onBatchTransfer}
            className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full flex items-center text-[12px] font-bold gap-1.5 hover:bg-slate-200 transition-colors active:scale-95 border border-slate-200"
          >
            <Users size={16} strokeWidth={2.5} /> Batch Transfer
          </button>
        
      </div>

      {/* Sub Content area */}
      <div className="flex-1 w-full flex flex-col overflow-hidden relative">

        {/* Scrollable List Area */}
        <div className="flex-1 overflow-y-auto w-full px-5 pb-24 scrollbar-hide">
          {/* Favorites Section */}
            <div className="mb-4">
              {(favorites.length > 0 || isLoadingFavorite) && (
                <div className="flex justify-between items-end mb-4 pr-1 mt-6">
                  <h3 className="text-slate-400 font-semibold text-[15px]">
                    Favorites
                  </h3>
                </div>
              )}

              {isLoadingFavorite ? (
                <div className="flex justify-center items-center py-6 h-[80px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-transparent border-t-slate-800 border-l-slate-800"></div>
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto scrollbar-hide mt-4 mb-2">
                  {favorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="flex flex-col items-center w-max gap-2 cursor-pointer group relative"
                      onClick={() => {
                        onSelectContact({
                          name: fav.name,
                          bank: fav.network,
                          account: fav.number,
                          initials: fav.initials,
                        });
                      }}
                    >
                      <div
                        className="w-[52px] h-[52px] rounded-full flex items-center justify-center font-bold shadow-sm shrink-0 text-[14px] transition-colors bg-slate-100 border border-slate-200 text-slate-700"
                      >
                        {fav.initials}
                      </div>
                      <span
                        className="text-[11px] font-semibold text-center w-16 line-clamp-2 leading-tight text-slate-800"
                      >
                        {fav.name.split(" ")[0]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                {isManageContacts ? <X size={20} /> : <Settings2 size={20} strokeWidth={2} />}
              </button>
          </div>

          {/* Tab Pill */}
          <div className="bg-[#f1f5f9] text-slate-500 px-4 py-1.5 rounded-full w-max text-[12px] font-semibold mb-6">
            Other Accounts
          </div>

          {/* Contacts */}
          <div className="flex flex-col w-full relative pb-[80px]">
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
                isFavorite={favorites.some((f) => f.id === contact.id)}
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
          </div>
        </div>

        {/* Floating Action Button */}
        {!contactToDelete && (
          <div className="absolute bottom-7 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] z-20">
            {isManageContacts ? (
              selectedContacts.length > 0 && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full bg-slate-900 text-white py-[14px] rounded-full font-bold text-[14px] shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  Delete
                </button>
              )
            ) : (
              <button
                onClick={onNewTransfer}
                className="w-full bg-slate-900 text-white py-[14px] rounded-full font-bold text-[14px] shadow-lg flex items-center justify-center gap-2.5 hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                <UserPlus size={18} strokeWidth={2.5} /> Transfer to New
                Recipient
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
              className="absolute right-4 top-4 text-slate-400 p-1 hover:bg-slate-100 rounded-full transition-colors bg-transparent border-0"
            >
              <X size={24} strokeWidth={2} />
            </button>

            <div className="px-5 flex items-start gap-3 mb-4 mt-2">
              <div className="w-[28px] h-[28px] min-w-[28px] rounded-full border-[2.5px] border-slate-900 text-slate-900 flex items-center justify-center font-extrabold text-[15px]">
                !
              </div>
              <h3 className="font-bold text-[18px] text-slate-900 pt-0.5">
                Delete this contact?
              </h3>
            </div>
            <div className="px-5 flex flex-col gap-2">
              <p className="text-slate-600 text-[14px] mb-8 font-medium leading-relaxed pr-2 text-left">
                This contact will also be removed from Quick Pick on the
                Homepage and login page. It will not delete your Scheduled
                Transfers to this account.
              </p>
              <button
                onClick={() => {
                  const newlyDeleted = [
                    ...deletedContactIds,
                    ...selectedContacts,
                  ];
                  saveDeletedContactIds(newlyDeleted);
                  setFavorites((prev) => {
                    const newFavs = prev.filter((f) => !selectedContacts.includes(f.id));
                    try {
                      localStorage.setItem("favorites", JSON.stringify(newFavs));
                      BackendClient.updatePreferences({ favorites: newFavs });
                    } catch (e) {
                      console.error(e);
                    }
                    return newFavs;
                  });
                  setSelectedContacts([]);
                  setShowDeleteModal(false);
                  setIsManageContacts(false);
                }}
                className="w-full bg-red-500 text-white py-4 rounded-full font-bold text-[15px] shadow-lg hover:bg-red-600 active:scale-[0.98] transition-all"
              >
                Delete
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
