import React, { useState } from 'react';
import { ArrowLeft, Search, UserPlus, Plus, Users, Star, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useContacts } from '../../hooks/useContacts';

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
  isAddingFavorite?: boolean;
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
  isAddingFavorite,
  onToggleFavorite,
  isFavorite,
  isManageContacts,
  isSelected,
  onSelectManage
}: ContactItemProps) {
  return (
    <div className="flex flex-col mb-4 bg-white relative z-10 w-full">
      <div 
        className="flex items-center gap-4 cursor-pointer hover:bg-slate-50 p-1 -ml-1 rounded-xl transition-colors group" 
        onClick={isManageContacts ? undefined : (isAddingFavorite ? onToggle : (isExpanded ? onSelect : onToggle))}
      >
         <div className="w-[46px] h-[46px] rounded-full bg-[#f8fafc] flex items-center justify-center font-bold text-slate-700 shadow-sm border border-slate-100 shrink-0 group-hover:border-slate-200 transition-colors text-[13px] relative z-20">
            {initials}
         </div>
         <span className={`font-extrabold text-[14px] mt-0.5 relative z-20 ${isManageContacts ? 'text-slate-400' : 'text-slate-800'}`}>{name}</span>
      </div>
      
      {(isExpanded || isManageContacts) && (
        <div 
          onClick={isAddingFavorite ? undefined : (isManageContacts ? onSelectManage : onSelect)}
          className={`-mx-5 px-5 mt-[-10px] pt-5 pb-3 ${isManageContacts ? 'pl-[24px] bg-white border-b border-slate-50 pb-[10px]' : 'pl-[74px] bg-[#f1f5f9] hover:bg-[#e2e8f0] shadow-inner'} overflow-visible ${(!isAddingFavorite && !isManageContacts) ? 'cursor-pointer' : ''} transition-colors relative z-0 flex justify-between items-center ${isManageContacts ? 'cursor-pointer' : ''}`}
        >
           <div className={`flex items-center ${isManageContacts ? 'gap-3' : ''}`}>
             {isManageContacts && (
               <div className={`w-5 h-5 rounded-[4px] border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-slate-800 border-slate-800' : 'border-slate-300 bg-white'}`}>
                  {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3.5 h-3.5 text-white" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
               </div>
             )}
             <div className="text-left">
               <p className={`font-bold text-[14px] ${isManageContacts ? 'text-slate-600' : 'text-slate-800'}`}>{network}</p>
               <p className={`text-[13px] font-medium mt-0.5 tracking-wide ${isManageContacts ? 'text-slate-400' : 'text-slate-505'}`}>{address}</p>
             </div>
           </div>
           
           {isAddingFavorite && (
             <button 
               onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }} 
               className="p-2 mr-6 z-10 hover:scale-110 transition-transform active:scale-95 border-0 bg-transparent flex items-center justify-center cursor-pointer"
             >
               {isFavorite ? (
                 <Star className="text-yellow-400 fill-yellow-400" size={24} />
               ) : (
                 <Star className="text-slate-400" size={24} />
               )}
             </button>
           )}

           {isManageContacts && isFavorite && (
              <div className="mr-2">
                 <Star className="text-yellow-400 fill-yellow-400" size={18} />
              </div>
           )}
        </div>
      )}
    </div>
  );
}

export function TransferScreen({ onBack, onNewTransfer, onSelectContact, onBatchTransfer }: TransferScreenProps) {
  const { fetchTransactions } = useApp();
  const { realContacts: allContacts } = useContacts();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);
  const [isEditFavorites, setIsEditFavorites] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<any | null>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [deletedContactIds, setDeletedContactIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('deleted_contact_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveDeletedContactIds = (ids: string[]) => {
    setDeletedContactIds(ids);
    try {
      localStorage.setItem('deleted_contact_ids', JSON.stringify(ids));
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const realContacts = React.useMemo(() => {
    return allContacts.filter(c => !deletedContactIds.includes(c.id));
  }, [allContacts, deletedContactIds]);


  const handleToggleFavorite = (contact: any) => {
    setIsAddingFavorite(false);
    setExpandedId(null);
    setIsLoadingFavorite(true);
    
    setTimeout(() => {
      setFavorites(prev => {
        const isFav = prev.some(f => f.id === contact.id);
        if (isFav) {
          return prev.filter(f => f.id !== contact.id);
        } else {
          return [...prev, contact];
        }
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
          <button onClick={() => isAddingFavorite ? setIsAddingFavorite(false) : onBack()} className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h2 className="font-bold text-[16px] text-white ml-2">TRANSFER</h2>
        </div>
        {!isAddingFavorite && (
          <button 
            onClick={onBatchTransfer}
            className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full flex items-center text-[12px] font-bold gap-1.5 hover:bg-slate-200 transition-colors active:scale-95 border border-slate-200"
          >
            <Users size={16} strokeWidth={2.5}/> Batch Transfer
          </button>
        )}
      </div>

       {/* Sub Content area */}
       <div className="flex-1 w-full flex flex-col overflow-hidden relative">
          
          {/* Search Bar Container */}
          <div className="px-5 pt-6 pb-4 shrink-0">
             <div className="bg-white border border-slate-200 rounded-full px-4 py-3.5 flex items-center gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] focus-within:border-slate-400 transition-colors">
                <Search className="text-slate-400" size={20}/>
                <input 
                  type="text" 
                  placeholder="Search account number or receiver name" 
                  className="flex-1 outline-none text-slate-700 text-[13px] placeholder:text-slate-400 font-medium bg-transparent" 
                />
             </div>
          </div>

          {/* Scrollable List Area */}
          <div className="flex-1 overflow-y-auto w-full px-5 pb-24 scrollbar-hide">
              
             {/* Favorites Section */}
             {!isAddingFavorite && (
               <div className="mb-4">
                 {(favorites.length > 0 || isLoadingFavorite) && (
                   <div className="flex justify-between items-end mb-4 pr-1 mt-6">
                     <h3 className="text-slate-400 font-semibold text-[15px]">Favorites</h3>
                     <button 
                       onClick={() => setIsEditFavorites(!isEditFavorites)}
                       className="text-slate-600 text-[13px] font-semibold hover:text-slate-800 transition-colors"
                     >
                       {isEditFavorites ? "Done" : "Manage"}
                     </button>
                   </div>
                 )}

                 {isEditFavorites && favorites.length > 0 && (
                   <p className="text-slate-800 text-[12px] font-medium text-center -mx-5 py-2 mb-4">
                     Tap and drag icons to reorder
                   </p>
                 )}
                 
                 {isLoadingFavorite ? (
                   <div className="flex justify-center items-center py-6 h-[80px]">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-transparent border-t-slate-800 border-l-slate-800"></div>
                   </div>
                 ) : (
                   <div className="flex gap-4 overflow-x-auto scrollbar-hide mt-4 mb-2">
                     {favorites.map(fav => (
                       <div 
                         key={fav.id} 
                         className="flex flex-col items-center w-max gap-2 cursor-pointer group relative" 
                         onClick={() => {
                           if (isEditFavorites) {
                             setContactToDelete(fav);
                           } else {
                             onSelectContact({ name: fav.name, bank: fav.network, account: fav.account, initials: fav.initials });
                           }
                         }}
                       >
                          {isEditFavorites && (
                            <div className="absolute top-0 left-0 w-5 h-5 bg-slate-800 rounded-full text-white flex items-center justify-center -translate-x-1 border border-white shadow-sm z-10">
                              <X size={12} strokeWidth={4} />
                            </div>
                          )}
                          <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center font-bold shadow-sm shrink-0 text-[14px] transition-colors
                            ${isEditFavorites ? 'bg-[#f1f5f9] text-slate-700' : 'bg-slate-100 border border-slate-200 text-slate-700'}`}>
                             {fav.initials}
                          </div>
                          <span className={`text-[11px] font-semibold text-center w-16 line-clamp-2 leading-tight ${isEditFavorites ? 'text-slate-500' : 'text-slate-800'}`}>
                            {fav.name.split(' ')[0]}
                          </span>
                       </div>
                     ))}
                     
                     {!isEditFavorites && (
                       <div className="flex flex-col items-center w-min gap-2 cursor-pointer group" onClick={() => setIsAddingFavorite(true)}>
                          <div className="relative w-[52px] h-[52px] rounded-full border border-slate-200 flex items-center justify-center text-slate-600 group-hover:bg-slate-100 transition-colors bg-white shadow-sm">
                             <Plus size={24} strokeWidth={2} />
                          </div>
                          <span className="text-slate-500 text-[11px] font-semibold text-center leading-tight whitespace-nowrap">Add<br/>Favorite</span>
                       </div>
                     )}
                   </div>
                 )}
               </div>
             )}

             {/* Transfer List Header */}
             <div className="flex justify-between items-end mb-4 pr-1 mt-6">
                 <h3 className="text-slate-400 font-semibold text-[15px]">Transfer List</h3>
                 {!isAddingFavorite && (
                   <button 
                     onClick={() => {
                       setIsManageContacts(!isManageContacts);
                       setSelectedContacts([]);
                     }}
                     className="text-slate-600 text-[13px] font-semibold hover:text-slate-800 transition-colors"
                   >
                     {isManageContacts ? 'Done' : 'Manage'}
                   </button>
                 )}
              </div>

              {/* Tab Pill */}
              <div className="bg-[#f1f5f9] text-slate-500 px-4 py-1.5 rounded-full w-max text-[12px] font-semibold mb-6">
                 Other Accounts
              </div>

              {/* Contacts */}
              <div className="flex flex-col w-full relative pb-[80px]">
                 {/* Vertical line connector */}
                 <div className="absolute left-[23px] top-8 bottom-0 w-[1px] bg-slate-100 z-0"></div>
                 
                 {realContacts.map(contact => (
                    <ContactItem 
                      key={contact.id}
                      initials={contact.initials} 
                      name={contact.name} 
                      network={contact.network}
                      address={contact.account}
                      isExpanded={expandedId === contact.id}
                      onToggle={() => setExpandedId(expandedId === contact.id ? null : contact.id)}
                      onSelect={() => onSelectContact({ name: contact.name, bank: contact.network, account: contact.account, initials: contact.initials })}
                      isAddingFavorite={isAddingFavorite}
                      onToggleFavorite={() => handleToggleFavorite(contact)}
                      isFavorite={favorites.some(f => f.id === contact.id)}
                      isManageContacts={isManageContacts}
                      isSelected={selectedContacts.includes(contact.id)}
                      onSelectManage={() => {
                        setSelectedContacts(prev => prev.includes(contact.id) ? prev.filter(id => id !== contact.id) : [...prev, contact.id]);
                      }}
                    />
                 ))}
              </div>
          </div>

          {/* Floating Action Button */}
          {(!isEditFavorites && !contactToDelete) && (
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
                 <button onClick={onNewTransfer} className="w-full bg-slate-900 text-white py-[14px] rounded-full font-bold text-[14px] shadow-lg flex items-center justify-center gap-2.5 hover:bg-slate-800 transition-all active:scale-[0.98]">
                    <UserPlus size={18} strokeWidth={2.5}/> Transfer to New Recipient
                 </button>
               )}
            </div>
          )}
       </div>

       {/* Delete Contact Modal (Manage Mode) */}
       {showDeleteModal && (
         <div className="absolute inset-0 z-[60] bg-black/40 flex flex-col justify-end transition-opacity overflow-hidden">
            <div className="bg-white rounded-t-[24px] w-full flex flex-col pb-8 pt-6 shadow-2xl animate-in slide-in-from-bottom duration-300 relative">
               <button onClick={() => setShowDeleteModal(false)} className="absolute right-4 top-4 text-slate-400 p-1 hover:bg-slate-100 rounded-full transition-colors bg-transparent border-0">
                 <X size={24} strokeWidth={2}/>
               </button>
               
               <div className="px-5 flex items-start gap-3 mb-4 mt-2">
                  <div className="w-[28px] h-[28px] min-w-[28px] rounded-full border-[2.5px] border-slate-900 text-slate-900 flex items-center justify-center font-extrabold text-[15px]">
                     !
                  </div>
                  <h3 className="font-bold text-[18px] text-slate-900 pt-0.5">Delete this contact?</h3>
               </div>
               <div className="px-5 flex flex-col gap-2">
                 <p className="text-slate-600 text-[14px] mb-8 font-medium leading-relaxed pr-2 text-left">
                   This contact will also be removed from Quick Pick on the Homepage and login page. It will not delete your Scheduled Transfers to this account.
                 </p>
                 <button 
                   onClick={() => {
                      const newlyDeleted = [...deletedContactIds, ...selectedContacts];
                      saveDeletedContactIds(newlyDeleted);
                      setFavorites(prev => prev.filter(f => !selectedContacts.includes(f.id)));
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
