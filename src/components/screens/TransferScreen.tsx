import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, Smartphone, CreditCard as CardIcon, Send, Search, Star, Edit3, Trash2, CheckCircle2, ChevronRight, X, AlertCircle } from 'lucide-react';
import { Contact } from '../../types';

export function TransferScreen({ onBack, onNewTransfer, onSelectContact }: { onBack: () => void, onNewTransfer: () => void, onSelectContact: (contact: Contact) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);
  const [isEditFavorites, setIsEditFavorites] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [favorites, setFavorites] = useState<Contact[]>([]);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);

  const handleToggleFavorite = (contact: Contact) => {
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

  const [realContacts, setRealContacts] = useState([
    { id: '1', letter: 'A', name: 'ANNISA PATRIA', network: 'EVM (Arc Testnet)', account: '0x1A2bc...3c4A', initials: 'AP' },
    { id: '2', letter: 'A', name: 'ARGA SATYAGRAHA', network: 'EVM (Arc Testnet)', account: '0x9F8eA...2d1B', initials: 'AS' },
    { id: '3', letter: 'H', name: 'HERU SALAM', network: 'EVM (Arc Testnet)', account: '0x4E5fC...6a7C', initials: 'HS' },
    { id: '4', letter: 'I', name: 'IDA RIDAWATI', network: 'EVM (Arc Testnet)', account: '0x7FaZ...9A2b', initials: 'IR' },
    { id: '5', letter: 'L', name: 'LIGAR WENINGGALIH', network: 'EVM (Arc Testnet)', account: '0x2B3cD...4D5e', initials: 'LW' }
  ]);
  const [isManageContacts, setIsManageContacts] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const groupedContacts = realContacts.reduce<Record<string, typeof realContacts>>((acc, contact) => {
    if (!acc[contact.letter]) {
      acc[contact.letter] = [];
    }
    acc[contact.letter].push(contact);
    return acc;
  }, {});

  return (
    <div className="w-full h-full bg-[#6366f1] relative flex flex-col items-center overflow-hidden z-50">
      {/* Top Header Section - Blue Gradient */}
      <div className="pt-12 pb-6 px-4 relative shrink-0 z-10 flex flex-col items-center overflow-hidden w-full">
        {/* Background abstract curves */}
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-white/5 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>
        
        <button onClick={onBack} className="absolute left-2 top-11 p-2 hover:bg-white/10 rounded-full transition-colors z-20">
          <ArrowLeft size={24} className="text-white" />
        </button>

        <h2 className="text-white text-[16px] font-semibold mt-1 tracking-wide z-10 w-full text-center pr-8">Transfer</h2>
      </div>

      {/* Main Content Area */}
      <div className="bg-white z-20 flex flex-col flex-1 w-full rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.08)] relative overflow-hidden">
        {/* Loading overlay for favorites */}
        {isLoadingFavorite && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-50 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#6366f1]/30 border-t-[#6366f1] rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Fixed Top Section Inside White Area */}
        <div className="shrink-0 px-5 pt-8 pb-4 bg-white/95 backdrop-blur-md z-30 shadow-sm border-b border-slate-50">
           {/* Transfer Action Grid */}
           <div className="grid grid-cols-4 gap-4 mb-2 -mt-2">
              <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={onNewTransfer}>
                 <div className="w-[52px] h-[52px] rounded-full bg-green-50 flex items-center justify-center text-green-500 shadow-sm border border-green-100 group-hover:scale-105 transition-transform group-hover:bg-green-100/80">
                    <Send size={24} />
                 </div>
                 <span className="text-[11px] font-semibold text-slate-700 text-center leading-[1.1] w-[60px]">Transfer<br/>Baru</span>
              </div>
              <div className="flex flex-col items-center gap-2 cursor-pointer group pointer-events-none opacity-40">
                 <div className="w-[52px] h-[52px] rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 transition-transform">
                    <RefreshCw size={24} />
                 </div>
                 <span className="text-[11px] font-semibold text-slate-400 text-center leading-[1.1] w-[60px]">Transfer<br/>Berkala</span>
              </div>
           </div>
        </div>

        {/* Scrollable List Section */}
        <div className="flex-1 overflow-y-auto w-full relative z-20">
          
           {favorites.length > 0 && !isManageContacts && (
              <div className="px-5 pt-5 pb-2">
                 <div className="flex justify-between items-center mb-3">
                   <h3 className="text-[15px] font-extrabold text-slate-800 flex items-center gap-1.5 shadow-sm bg-white pb-1">
                     <span className="bg-yellow-100 text-yellow-600 p-1 rounded-md shadow-sm border border-yellow-200/50">
                       <Star size={14} className="fill-yellow-500" strokeWidth={2.5}/>
                     </span>
                     Favorit
                   </h3>
                   <div className="flex gap-3 text-slate-400 font-semibold text-[13px]">
                     {isAddingFavorite ? (
                       <button onClick={() => setIsAddingFavorite(false)} className="text-[#6366f1] hover:text-blue-700">Opsi</button>
                     ) : isEditFavorites ? (
                       <button onClick={() => setIsEditFavorites(false)} className="text-[#6366f1] hover:text-blue-700">Opsi</button>
                     ) : null}
                     {(!isAddingFavorite && !isEditFavorites) && (
                       <>
                         <button onClick={() => setIsAddingFavorite(true)} className="hover:text-slate-600 transition-colors">Tambah</button>
                         <button onClick={() => setIsEditFavorites(true)} className="hover:text-slate-600 transition-colors">Edit</button>
                       </>
                     )}
                   </div>
                 </div>

                 <div className="flex flex-col mb-4">
                    {favorites.map(fav => (
                       <div key={fav.id} className="flex flex-col relative w-full border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-xl transition-colors">
                          <div 
                            className="flex items-center justify-between p-2 cursor-pointer group"
                            onClick={() => {
                              if (!isEditFavorites) {
                                onSelectContact({ id: fav.id, name: fav.name, bank: fav.network || fav.bank, accountNumber: fav.account || fav.address || fav.accountNumber, initials: fav.initials });
                              }
                            }}
                          >
                             <div className="flex items-center gap-4">
                                <div className="w-[44px] h-[44px] rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center font-bold text-white shadow-md border border-yellow-400/50 shrink-0 text-[13px] group-hover:scale-105 transition-transform">
                                   {fav.initials}
                                </div>
                                <div className="flex flex-col pt-0.5">
                                   <span className="font-extrabold text-[13.5px] text-slate-800 tracking-tight leading-tight">{fav.name}</span>
                                   <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[12px] font-semibold text-[#6366f1]">{fav.network}</span>
                                      <span className="text-slate-300 text-[10px]">&bull;</span>
                                      <span className="text-[12.5px] font-medium text-slate-500 tracking-wide">{fav.address || fav.account || fav.accountNumber}</span>
                                   </div>
                                </div>
                             </div>
                             
                             {isEditFavorites && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setContactToDelete(fav);
                                    setTimeout(() => handleToggleFavorite(fav), 300); // Simulate removing
                                  }}
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors mr-1"
                                >
                                   <Trash2 size={16} strokeWidth={2.5}/>
                                </button>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           )}

           <div className={`px-5 relative pb-32 pt-2 ${favorites.length > 0 ? 'border-t-[8px] border-slate-50' : ''}`}>
              {/* Fake sticky header logic applied natively via sticky class */}
              <div className="flex justify-between items-center mb-5 sticky top-0 bg-white/95 backdrop-blur-md pt-4 pb-2 z-30">
                 <h3 className="text-[16px] font-extrabold text-slate-800 tracking-tight">Daftar Kontak</h3>
                 <div className="flex gap-4">
                    <button className="text-slate-400 font-semibold hover:text-slate-600 transition-colors cursor-pointer"><Search size={22} strokeWidth={2.5}/></button>
                    {isManageContacts ? (
                      <button onClick={() => {setIsManageContacts(false); setSelectedContacts([]);}} className="text-[#6366f1] text-[13.5px] font-bold hover:text-blue-700 transition-colors cursor-pointer mt-0.5">Batal</button>
                    ) : (
                      <button onClick={() => {setIsManageContacts(true); setIsAddingFavorite(false); setExpandedId(null);}} className="text-slate-400 font-semibold hover:text-slate-600 transition-colors cursor-pointer mt-0.5"><Edit3 size={20} strokeWidth={2.5}/></button>
                    )}
                 </div>
              </div>

              {favorites.length === 0 && !isAddingFavorite && !isManageContacts && (
                 <div 
                   onClick={() => setIsAddingFavorite(true)}
                   className="mb-8 border-[1.5px] border-dashed border-yellow-300 rounded-[14px] bg-yellow-50/50 p-4 flex gap-4 items-center cursor-pointer hover:bg-yellow-50 transition-colors"
                 >
                   <div className="w-[42px] h-[42px] rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">
                      <Star size={20} className="fill-yellow-500" />
                   </div>
                   <div className="flex flex-col">
                     <span className="font-extrabold text-[14px] text-slate-800">Tambah Favorit</span>
                     <span className="text-[12.5px] text-slate-500 font-medium">Biar transaksi makin cepet & gampang!</span>
                   </div>
                 </div>
              )}

              <div className="relative">
                {/* A Line container styling */}
                <div className="absolute left-[23px] top-8 bottom-0 w-[1px] bg-slate-100 z-0"></div>
                
                {(Object.entries(groupedContacts) as [string, typeof realContacts][]).map(([letter, groupContacts]) => (
                  <React.Fragment key={letter}>
                    <ContactDivider letter={letter} />
                    {groupContacts.map(contact => (
                      <ContactItem 
                        key={contact.id}
                        initials={contact.initials} 
                        name={contact.name} 
                        network={contact.network}
                        address={contact.account}
                        isExpanded={expandedId === contact.id}
                        onToggle={() => setExpandedId(expandedId === contact.id ? null : contact.id)}
                        onSelect={() => onSelectContact({ id: contact.id, name: contact.name, bank: contact.network, accountNumber: contact.account, initials: contact.initials })}
                        isAddingFavorite={isAddingFavorite}
                        onToggleFavorite={() => handleToggleFavorite(contact)}
                        isFavorite={favorites.some(f => f.id === contact.id)}
                        isManageContacts={isManageContacts}
                        isSelected={selectedContacts.includes(contact.id)}
                        onSelectManage={() => {
                          setSelectedContacts(prev => 
                            prev.includes(contact.id) 
                              ? prev.filter(id => id !== contact.id)
                              : [...prev, contact.id]
                          );
                        }}
                      />
                    ))}
                  </React.Fragment>
                ))}
              </div>
           </div>
        </div>
      </div>
      
      {/* Bottom Action bar for Manage Contacts */}
      {isManageContacts && selectedContacts.length > 0 && (
         <div className="absolute bottom-6 left-5 right-5 bg-slate-800 text-white rounded-[16px] p-4 flex justify-between items-center z-50 shadow-[0_10px_25px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom border border-slate-700">
            <span className="font-bold text-[14px] ml-1">{selectedContacts.length} Kontak Terpilih</span>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="text-red-400 font-bold flex items-center gap-1.5 hover:text-red-300 transition-colors"
            >
              <Trash2 size={18} /> Hapus
            </button>
         </div>
      )}

      {showDeleteModal && (
         <div className="absolute inset-0 bg-slate-900/60 z-[100] flex items-center justify-center px-6 animate-in fade-in transition-all">
            <div className="bg-white rounded-[24px] p-6 flex flex-col w-full shadow-2xl animate-in zoom-in-95 duration-200 max-w-sm">
               <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-4 mx-auto">
                 <AlertCircle size={28} strokeWidth={2.5}/>
               </div>
               <h3 className="font-extrabold text-[18px] text-slate-800 text-center mb-2">Hapus {selectedContacts.length} Kontak?</h3>
               <p className="text-slate-500 text-[14px] text-center mb-8 px-2 font-medium leading-relaxed">
                 Kontak yang dipilih akan dihapus secara permanen dari daftar kontak Anda.
               </p>
               <div className="flex gap-3">
                 <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3.5 rounded-[12px] text-[#6366f1] font-bold bg-indigo-50/50 hover:bg-indigo-50 transition-colors text-[15px]">
                   Batal
                 </button>
                 <button 
                   onClick={() => {
                     setRealContacts(prev => prev.filter(c => !selectedContacts.includes(c.id)));
                     setFavorites(prev => prev.filter(f => !selectedContacts.includes(f.id)));
                     setSelectedContacts([]);
                     setShowDeleteModal(false);
                     setIsManageContacts(false);
                   }} 
                   className="flex-1 py-3.5 rounded-[12px] bg-red-500 text-white font-bold hover:bg-red-600 shadow-[0_4px_12px_rgba(239,68,68,0.3)] transition-colors text-[15px]"
                 >
                   Hapus
                 </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

function ContactDivider({ letter }: { letter: string }) {
  return (
    <div className="text-slate-400 font-semibold mb-4 text-[13px] bg-white w-max pr-2 py-1 relative z-10">
      {letter}
    </div>
  )
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
}: { 
  key?: React.Key,
  initials: string, 
  name: string,
  network: string,
  address: string,
  isExpanded: boolean,
  onToggle: () => void,
  onSelect: () => void,
  isAddingFavorite?: boolean,
  onToggleFavorite?: () => void,
  isFavorite?: boolean,
  isManageContacts?: boolean,
  isSelected?: boolean,
  onSelectManage?: () => void
}) {
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
          className={`-mx-5 px-5 mt-[-10px] pt-5 pb-3 ${isManageContacts ? 'pl-[24px] bg-white border-b border-slate-50 pb-5' : 'pl-[74px] bg-[#f1f5f9] hover:bg-[#e2e8f0] shadow-inner'} overflow-hidden ${(!isAddingFavorite && !isManageContacts) ? 'cursor-pointer' : ''} transition-colors relative z-0 flex justify-between items-center ${isManageContacts ? 'cursor-pointer' : ''}`}
        >
           <div className={`flex items-center ${isManageContacts ? 'gap-3' : ''}`}>
             {isManageContacts && (
               <div className={`w-5 h-5 rounded-[4px] border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-[#6366f1] border-[#6366f1]' : 'border-slate-300 bg-white'}`}>
                  {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3.5 h-3.5 text-white" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
               </div>
             )}
             <div>
               <p className={`font-bold text-[14px] ${isManageContacts ? 'text-slate-600' : 'text-slate-800'}`}>{network}</p>
               <p className={`text-[13px] font-medium mt-0.5 tracking-wide ${isManageContacts ? 'text-slate-400' : 'text-slate-500'}`}>{address}</p>
             </div>
           </div>
           
           {isAddingFavorite && (
             <button 
               onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }} 
               className="p-2 mr-2 z-10 hover:scale-110 transition-transform active:scale-95"
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
  )
}
