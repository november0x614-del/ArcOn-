import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Contact } from '../types';

export function useContacts() {
  const { transactions } = useStore();

  const realContacts = useMemo(() => {
    // Generate contacts from transaction history - real data!
    const contactMap = new Map<string, Contact>();
    
    if (transactions && transactions.length > 0) {
      transactions.forEach((tx) => {
        if (tx.type === 'transfer' || tx.type === 'payment') {
          const recipientAddress = tx.metadata?.destinationAddress || (tx.type === 'payment' ? tx.internal_ref : undefined);
          const recipientName = tx.metadata?.recipientName || (tx.type === 'payment' ? `Merchant ${tx.id.substring(0, 4)}` : undefined);
          
          if (recipientAddress && recipientName) {
            const cleanAddr = recipientAddress.trim();
            const initials = recipientName.trim() 
              ? recipientName.trim().split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() 
              : '??';
              
            contactMap.set(cleanAddr.toLowerCase(), {
              id: tx.id || cleanAddr,
              letter: recipientName.trim()[0]?.toUpperCase() || '?',
              name: recipientName.toUpperCase(),
              network: 'EVM (Arc Testnet)',
              number: cleanAddr,
              initials: initials,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(recipientName)}&background=random`
            });
          }
        }
      });
    }
    
    return Array.from(contactMap.values());
  }, [transactions]);

  return { realContacts };
}
