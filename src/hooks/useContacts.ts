import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Contact } from '../types';

export function useContacts() {
  const { transactions } = useStore();

  const realContacts = useMemo(() => {
    // Generate contacts from transaction history - real data!
    const contactMap = new Map<string, Contact>();
    
    // Default base contacts for Arc Testnet exploration
    const defaultContacts: any[] = [
      { id: '1', letter: 'A', name: 'ANNISA PATRIA', network: 'EVM (Arc Testnet)', number: '0x1A2bc2f35497B6CEAc40eEb29037C9F306633c4A', initials: 'AP', avatar: 'https://ui-avatars.com/api/?name=Annisa+Patria' },
      { id: '2', letter: 'A', name: 'ARGA SATYAGRAHA', network: 'EVM (Arc Testnet)', number: '0x9F8eA5260cc7C3A899986326Eee2eEBE4fBe2d1B', initials: 'AS', avatar: 'https://ui-avatars.com/api/?name=Arga+Satyagraha' },
    ];
    
    defaultContacts.forEach(c => {
      contactMap.set(c.number.toLowerCase(), c as Contact);
    });
    
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
