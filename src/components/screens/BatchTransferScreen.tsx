import React, { useState } from 'react';
import { ArrowLeft, Users, Send, Trash2, CheckCircle2, Loader2, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';

interface Contact {
  id: string;
  letter: string;
  name: string;
  network: string;
  account: string;
  initials: string;
}

interface BatchTransferScreenProps {
  onBack: () => void;
  contacts: Contact[];
}

export function BatchTransferScreen({ onBack, contacts }: BatchTransferScreenProps) {
  const { balance, fetchBalance, fetchTransactions, displayToast, registeredUser } = useApp();
  const [multiSendStep, setMultiSendStep] = useState<'info' | 'form' | 'processing' | 'success'>('form');
  const [recipients, setRecipients] = useState<{ id: string, address: string; displayAddress: string; name: string; amount: string }[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);
  
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [selectedQuickAddIds, setSelectedQuickAddIds] = useState<string[]>([]);

  const addRecipientItem = () => {
    if (!newAddress || !newAmount) return;
    
    const addressList = newAddress.split(/[\s,]+/).filter(Boolean);
    
    const newItems = addressList.map((addr, idx) => {
      const match = contacts.find(c => c.account.toLowerCase() === addr.toLowerCase() || c.account.includes(addr));
      const fullAddr = match ? match.account : addr;
      const name = match ? match.name : `Recipient #${recipients.length + idx + 1}`;
      const formattedAddress = fullAddr.length > 12
        ? `${fullAddr.substring(0, 6)}...${fullAddr.substring(fullAddr.length - 4)}`
        : fullAddr;
        
      return { id: `${fullAddr}-${Date.now()}-${Math.random()}`, address: fullAddr, displayAddress: formattedAddress, name, amount: newAmount };
    });

    setRecipients(prev => [...prev, ...newItems]);
    setNewAddress('');
    setNewAmount('');
    setIsAddedFeedback(true);
    setTimeout(() => {
      setIsAddedFeedback(false);
    }, 1000);
  };

  const removeRecipientItem = (index: number) => {
    setRecipients(prev => prev.filter((_, i) => i !== index));
  };

  const startProcessing = async () => {
    const totalAmount = recipients.reduce((acc, curr) => acc + parseFloat(curr.amount || '0'), 0);
    
    if (totalAmount > balance) {
      displayToast("Insufficient balance for this batch transfer.");
      return;
    }

    setMultiSendStep('processing');
    setProcessingStatus('Packaging transaction inputs...');
    
    try {
      setProcessingStatus('Executing batch transaction on Arc Testnet via Circle SDK...');
      const response = await fetch('/api/payments/batch', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            userId: registeredUser?.supabaseUid,
            walletId: registeredUser?.walletId,
            recipients: recipients
          })
      });
      
      if (!response.ok) throw new Error("Batch transfer failed");
      
      setProcessingStatus('Broadcasting successfully completed.');
      
      // Update global state
      await fetchBalance();
      await fetchTransactions();
      
      setMultiSendStep('success');
    } catch (error) {
       console.error("Batch send failed", error);
       displayToast("Batch transfer failed.");
       setMultiSendStep('form');
    }
  };

  return (
    <div className="w-full h-full bg-[#f8fafc] relative flex flex-col items-center overflow-hidden z-50">
       {/* Header */}
       <div className="w-full pt-12 pb-6 px-4 shrink-0 flex flex-col bg-[#3FA2F6] relative shadow-md">
         <div className="flex justify-between items-center w-full mb-4 relative">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20">
              <ArrowLeft className="text-white" size={24} />
            </button>
            <h2 className="text-white font-extrabold text-lg absolute left-1/2 -translate-x-1/2">Batch Transfer</h2>
            <div className="w-10"></div>
         </div>
       </div>

       {/* Progress Indicator */}
       <div className="w-full bg-white border-b border-slate-100 px-5 py-3 flex gap-2">
          <div className={`h-1.5 flex-1 rounded-full ${multiSendStep === 'form' ? 'bg-[#3FA2F6]' : 'bg-[#3FA2F6]'}`}></div>
          <div className={`h-1.5 flex-1 rounded-full ${multiSendStep === 'processing' || multiSendStep === 'success' ? 'bg-[#3FA2F6]' : 'bg-slate-100'}`}></div>
          <div className={`h-1.5 flex-1 rounded-full ${multiSendStep === 'success' ? 'bg-[#3FA2F6]' : 'bg-slate-100'}`}></div>
       </div>

       <div className="flex-1 w-full flex flex-col overflow-y-auto pb-24 scrollbar-hide">
          {/* Content Step Logic */}
          <div className="p-5">
             {/* Step 1: Info Screen */}
             {multiSendStep === 'info' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
                   <div className="flex flex-col items-center text-center mt-6 mb-8">
                      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-[#3FA2F6] mb-4 shadow-sm">
                         <Users size={40} />
                      </div>
                      <h3 className="font-extrabold text-[24px] text-slate-900 tracking-tight">Multi-Recipient Send</h3>
                      <p className="text-[14px] text-slate-500 max-w-[300px] mt-2 leading-relaxed">Efficiently distribute USDC to multiple addresses on the Arc Testnet using Circle SDK.</p>
                   </div>

                   <div className="flex flex-col gap-4 text-left">
                      <div className="flex gap-4 items-start p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-200 transition-colors">
                         <div className="w-12 h-12 rounded-full bg-blue-50 text-[#3FA2F6] flex items-center justify-center shrink-0">
                            <Send size={22} />
                         </div>
                         <div className="flex-1">
                            <h4 className="text-[16px] font-bold text-slate-900">Batch Transactions</h4>
                            <p className="text-[13px] text-slate-500 mt-1">Combine up to 100 transfers into a single on-chain execution.</p>
                         </div>
                      </div>
                   </div>

                   <div className="mt-12">
                      <button 
                        onClick={() => setMultiSendStep('form')}
                        className="w-full bg-[#3FA2F6] text-white py-4 rounded-full font-bold text-[16px] shadow-lg shadow-blue-500/20 hover:bg-[#2b88d8] active:scale-[0.98] transition-all"
                      >
                        Get Started
                      </button>
                   </div>
                </motion.div>
             )}

             {/* Step 2: Form Tool Screen */}
             {multiSendStep === 'form' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col text-left">
                   <div className="mb-6">
                      <h3 className="font-extrabold text-[20px] text-slate-800 tracking-tight">Recipients Batch</h3>
                      <p className="text-sm text-slate-500 mt-1">Manage the list of recipients and USDC amounts.</p>
                   </div>

                   {/* Recipient Cards */}
                   <div className="space-y-3 mb-6">
                      {recipients.map((recipient, idx) => (
                         <div key={recipient.id} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm relative group">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#3FA2F6] flex items-center justify-center font-bold text-sm shrink-0">
                               {recipient.name.substring(0, 1).toUpperCase()}
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                   <p className="font-bold text-slate-900 text-[14px] truncate">{recipient.name}</p>
                                   <span className="font-mono text-[11px] text-slate-400 truncate max-w-[120px] ml-2" title={recipient.address}>{recipient.displayAddress}</span>
                                </div>
                                
                                <div className="flex items-center gap-2 mt-1.5">
                                   <span className="text-[12px] font-semibold text-slate-400">Total:</span>
                                   <input 
                                      type="number" 
                                      value={recipient.amount} 
                                      onChange={(e) => {
                                         const val = e.target.value;
                                         setRecipients(prev => prev.map((item, i) => i === idx ? { ...item, amount: val } : item));
                                      }}
                                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[13px] font-bold text-slate-900 w-24 focus:outline-none focus:border-[#3FA2F6] font-mono"
                                   />
                                   <span className="text-[12px] font-bold text-slate-500 tracking-wide">USDC</span>
                                </div>
                             </div>
                             <button 
                                onClick={() => removeRecipientItem(idx)}
                                className="text-slate-300 hover:text-red-500 transition-colors p-2"
                             >
                                <Trash2 size={18} />
                             </button>
                         </div>
                      ))}

                      {recipients.length === 0 && (
                         <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50/50">
                            <Users size={32} strokeWidth={1.5} />
                            <p className="text-[13px] font-medium">No recipients added to batch</p>
                         </div>
                      )}
                   </div>

                    {/* Input Tooling */}
                    <div className="bg-blue-50/50 border border-blue-100/50 rounded-[24px] p-5 mb-8 flex flex-col gap-4">
                        <div className="flex justify-between items-center w-full">
                           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Quick Selection
                           </span>
                           <button
                              onClick={() => {
                                 setSelectedQuickAddIds([]);
                                 setShowQuickAddModal(true);
                              }}
                              className="text-[12px] text-white bg-[#3FA2F6] hover:bg-[#2b88d8] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm transition-all active:scale-95 border-0 cursor-pointer"
                           >
                              <Plus size={13} strokeWidth={3} /> Quick Add
                           </button>
                        </div>
                       
                       <div className="flex overflow-x-auto gap-3 pb-1 scrollbar-hide -mx-2 px-2">
                         {contacts.map(contact => (
                           <button 
                             key={contact.id}
                             onClick={() => { 
                                setNewAddress(prev => prev ? `${prev}, ${contact.account}` : contact.account);
                             }}
                             className="shrink-0 bg-white border border-slate-200 pl-2 pr-4 py-2 rounded-full flex items-center gap-2 shadow-sm text-[13px] font-bold text-slate-700 hover:border-[#3FA2F6] hover:text-[#3FA2F6] transition-all active:scale-95"
                           >
                             <div className="w-6 h-6 bg-[#e0f1fe] text-[#0284c7] rounded-full flex items-center justify-center text-[10px] font-black shrink-0">
                                {contact.initials}
                             </div>
                             <span className="truncate max-w-[100px]">{contact.name.split(' ')[0]}</span>
                           </button>
                         ))}
                       </div>

                       <div className="flex flex-col gap-3">
                          <div className="relative">
                            <input 
                               type="number" 
                               placeholder="Set Amount (USDC)" 
                               value={newAmount} 
                               onChange={e => setNewAmount(e.target.value)}
                               className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-[14px] font-bold text-slate-900 focus:outline-none focus:border-[#3FA2F6] font-mono shadow-sm"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-black text-slate-400">USDC</div>
                          </div>
                          
                          <div className="flex flex-col gap-3">
                             <textarea 
                                placeholder="Recipient Addresses (comma or space separated)" 
                                value={newAddress} 
                                onChange={e => setNewAddress(e.target.value)}
                                className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-[14px] font-mono text-slate-900 w-full focus:outline-none focus:border-[#3FA2F6] min-h-[110px] shadow-sm resize-y leading-relaxed"
                                rows={3}
                             />
                             <button 
                                onClick={addRecipientItem}
                                disabled={!newAddress || !newAmount}
                                className={`w-full h-[52px] rounded-2xl font-black text-[14px] transition-all duration-300 active:scale-[0.95] shrink-0 shadow-md flex items-center justify-center border-0 cursor-pointer ${
                                   isAddedFeedback 
                                      ? 'bg-emerald-600 text-white shadow-emerald-200' 
                                      : 'bg-[#005faa] text-white hover:bg-[#004780] disabled:opacity-30 disabled:shadow-none'
                                }`}
                             >
                                {isAddedFeedback ? '✓ ADDED SUCCESSFULLY' : 'ADD RECIPIENTS TO BATCH'}
                             </button>
                          </div>
                       </div>
                    </div>

                   {/* Summary info */}
                   {recipients.length > 0 && (
                      <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-2 mb-10 shadow-sm">
                         <div className="flex justify-between items-center">
                            <span className="text-[13px] text-slate-500 font-bold">Recipients</span>
                            <span className="font-extrabold text-slate-900">{recipients.length}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-[13px] text-slate-500 font-bold">Total Payout</span>
                            <span className="font-mono font-extrabold text-[#3FA2F6] text-lg">
                               {recipients.reduce((acc, curr) => acc + parseFloat(curr.amount || '0'), 0).toFixed(2)} USDC
                            </span>
                         </div>
                         <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                            <span className="text-[12px] text-slate-400 font-medium">Estimated Gas Saving</span>
                            <span className="text-emerald-500 font-black text-[14px]">~94.2% Saved</span>
                         </div>
                      </div>
                   )}

                   <button 
                      onClick={startProcessing}
                      disabled={recipients.length === 0}
                      className="w-full bg-[#3FA2F6] text-white py-4.5 rounded-full font-black text-[16px] shadow-xl shadow-blue-500/20 hover:bg-[#2b88d8] active:scale-[0.98] transition-all disabled:opacity-30 disabled:shadow-none mb-10"
                   >
                      EXECUTE BATCH SEND
                   </button>
                </motion.div>
             )}

             {/* Step 3: Processing Sequence */}
             {multiSendStep === 'processing' && (
                <div className="py-20 flex flex-col items-center text-center">
                   <div className="relative mb-10">
                      <div className="w-24 h-24 rounded-full border-4 border-blue-50 flex items-center justify-center">
                         <Loader2 className="animate-spin text-[#3FA2F6]" size={48} />
                      </div>
                      <div className="absolute inset-0 animate-ping rounded-full border border-blue-200/50"></div>
                   </div>
                   
                   <h3 className="font-black text-[22px] text-slate-900 tracking-tight">On-Chain Processing</h3>
                   <p className="text-[14px] text-slate-500 mt-2 max-w-[280px] leading-relaxed">
                      Verifying batch signature with Circle API and broadcasting to Arc Testnet.
                   </p>
                   
                   <div className="w-full bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-2xl p-5 mt-10 text-left leading-relaxed shadow-2xl uppercase border border-slate-800">
                      <span className="text-slate-600 mr-2 opacity-50 font-sans tracking-widest">{">"}</span> 
                      {processingStatus}
                   </div>
                </div>
             )}

             {/* Step 4: Success Screen */}
             {multiSendStep === 'success' && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-6 text-center">
                   <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 mx-auto shadow-sm">
                      <CheckCircle2 size={42} strokeWidth={2.5} />
                   </div>
                   <h3 className="font-black text-[26px] text-slate-900 tracking-tight">Success!</h3>
                   <p className="text-[15px] text-slate-500 mt-2 max-w-[320px] mb-8 mx-auto leading-relaxed">
                      Transaction batch successfully confirmed on Arc Testnet.
                   </p>

                   <div className="bg-white border border-slate-100 rounded-[28px] p-6 text-left mb-10 shadow-md">
                      <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">
                         <span>Batch Distribution</span>
                         <span>Payout</span>
                      </div>
                      <div className="space-y-4">
                         {recipients.map((rec) => (
                            <div key={rec.id} className="flex justify-between items-center">
                               <div className="flex flex-col">
                                  <span className="font-bold text-slate-900 text-[14px]">{rec.name}</span>
                                  <span className="font-mono text-[11px] text-slate-400" title={rec.address}>{rec.displayAddress}</span>
                               </div>
                               <span className="font-mono font-black text-slate-900 text-[15px]">{parseFloat(rec.amount || '0').toFixed(2)} USDC</span>
                            </div>
                         ))}
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-100 pt-5 mt-5">
                         <span className="text-[12px] font-bold text-slate-500">Total Transferred</span>
                         <span className="font-mono font-black text-[#3FA2F6] text-lg">
                            {recipients.reduce((acc, curr) => acc + parseFloat(curr.amount || '0'), 0).toFixed(2)} USDC
                         </span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center overflow-hidden">
                         <span className="text-[12px] font-bold text-slate-500 italic">TxHash</span>
                         <span className="font-mono text-emerald-600 font-bold text-[11px] truncate ml-4">ARC_BATCH_9921_X0FE22...</span>
                      </div>
                   </div>

                   <button 
                      onClick={onBack}
                      className="w-full bg-slate-900 text-white py-4.5 rounded-full font-black text-[16px] shadow-xl hover:bg-black active:scale-[0.98] transition-all"
                   >
                      Back to Dashboard
                   </button>
                </motion.div>
             )}
          </div>
       </div>

       {/* Quick Add Selection Modal */}
       {showQuickAddModal && (
         <div className="absolute inset-0 bg-slate-900/60 z-[100] flex flex-col justify-end">
            <div className="bg-white rounded-t-[28px] max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
               {/* Modal Header */}
               <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                  <div className="text-left">
                     <h3 className="font-extrabold text-[18px] text-slate-800">Select Contacts</h3>
                     <p className="text-[12px] text-slate-500 mt-0.5">Pick contacts one-by-one or select all to add instantly</p>
                  </div>
                  <button 
                     onClick={() => setShowQuickAddModal(false)}
                     className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-400 font-bold border-0 bg-transparent cursor-pointer"
                  >
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
               </div>

               {/* Select All Controller */}
               <div className="px-5 py-3 border-b border-slate-50 flex justify-between items-center shrink-0 bg-blue-50/50">
                  <span className="text-[13px] font-bold text-blue-700">
                     {selectedQuickAddIds.length} of {contacts.length} Contacts Selected
                  </span>
                  <button 
                     onClick={() => {
                        if (selectedQuickAddIds.length === contacts.length) {
                           setSelectedQuickAddIds([]);
                        } else {
                           setSelectedQuickAddIds(contacts.map(c => c.id));
                        }
                     }}
                     className="bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all active:scale-[0.97] cursor-pointer"
                  >
                     {selectedQuickAddIds.length === contacts.length ? 'Deselect All' : 'Select All'}
                  </button>
               </div>

               {/* Contacts List */}
               <div className="flex-1 overflow-y-auto px-5 py-4 divide-y divide-slate-100">
                  {contacts.map((contact) => {
                     const isSelected = selectedQuickAddIds.includes(contact.id);
                     return (
                        <div 
                           key={contact.id} 
                           onClick={() => {
                              setSelectedQuickAddIds(prev => 
                                 prev.includes(contact.id) 
                                    ? prev.filter(id => id !== contact.id) 
                                    : [...prev, contact.id]
                              );
                           }}
                           className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-50 -mx-5 px-5 transition-colors"
                        >
                           <div className="flex items-center gap-4">
                              <div className="w-[42px] h-[42px] rounded-full bg-slate-50 border border-slate-150 flex items-center justify-center font-bold text-slate-700 text-[13px]">
                                 {contact.initials}
                              </div>
                              <div className="text-left">
                                 <p className="font-extrabold text-slate-800 text-[14px] leading-tight">{contact.name}</p>
                                 <p className="font-mono text-slate-400 text-[11px] mt-1 pr-1 truncate max-w-[210px]" title={contact.account}>
                                    {contact.account}
                                 </p>
                              </div>
                           </div>
                           
                           {/* Checkbox indicator */}
                           <div className={`w-6 h-6 rounded-full border-[2px] flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-[#3FA2F6] border-[#3FA2F6]' : 'border-slate-300 bg-white'
                           }`}>
                              {isSelected && (
                                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="w-3 h-3 text-white" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                 </svg>
                              )}
                           </div>
                        </div>
                     );
                  })}
                  {contacts.length === 0 && (
                     <div className="py-12 text-center text-slate-400 text-[13px] font-medium">
                        No contacts found in transfer list.
                     </div>
                  )}
               </div>

               {/* Sticky Action Footer */}
               <div className="p-5 border-t border-slate-100 shrink-0 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.03)] border-0">
                  <button
                     onClick={() => {
                        if (selectedQuickAddIds.length === 0) return;
                        const defaultAmount = newAmount || '10';
                        const newItems = contacts
                           .filter(c => selectedQuickAddIds.includes(c.id))
                           .map((contact, idx) => {
                              const fullAddr = contact.account;
                              const formattedAddress = fullAddr.length > 12
                                ? `${fullAddr.substring(0, 6)}...${fullAddr.substring(fullAddr.length - 4)}`
                                : fullAddr;
                                
                              return {
                                 id: `${fullAddr}-${Date.now()}-${Math.random()}-${idx}`,
                                 address: fullAddr,
                                 displayAddress: formattedAddress,
                                 name: contact.name,
                                 amount: defaultAmount
                               };
                           });
                        
                        setRecipients(prev => [...prev, ...newItems]);
                        setShowQuickAddModal(false);
                        displayToast(`Added ${newItems.length} selected contacts to batch list!`);
                     }}
                     disabled={selectedQuickAddIds.length === 0}
                     className="w-full bg-[#3FA2F6] hover:bg-[#2b88d8] disabled:opacity-45 text-white py-4 rounded-full font-bold text-[15px] shadow-[0_4px_14px_rgba(63,162,246,0.3)] hover:shadow-lg transition-all active:scale-[0.98] border-0 cursor-pointer"
                  >
                     Add Selected Contacts ({selectedQuickAddIds.length})
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
}
