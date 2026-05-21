import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ViewState, ShortcutItem, UserIdentity, Transaction } from '../types';
import { defaultSelectedShortcuts, defaultAvailableShortcuts } from '../components/screens/ManageFavoritesScreen';

interface AppState {
  // Navigation & UI
  viewState: ViewState;
  setViewState: (state: ViewState) => void;
  receiptSource: ViewState;
  setReceiptSource: (source: ViewState) => void;
  showBalance: boolean;
  setShowBalance: (show: boolean) => void;
  
  // User & Auth
  registeredUser: UserIdentity | null;
  setRegisteredUser: (user: UserIdentity | null) => void;
  isBiometricVerified: boolean;
  setIsBiometricVerified: (verified: boolean) => void;
  
  // Financials
  balance: number;
  setBalance: (balance: number | ((prev: number) => number)) => void;
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  selectedTransaction: Transaction | null;
  setSelectedTransaction: (tx: Transaction | null) => void;
  
  // Market & Inbox logic
  visibleTokenCodes: string[];
  setVisibleTokenCodes: (codes: string[]) => void;
  readReceiptIds: string[];
  markAsRead: (id: string) => void;
  
  // Shortcuts & Contacts
  selectedShortcuts: ShortcutItem[];
  setSelectedShortcuts: (shortcuts: ShortcutItem[]) => void;
  availableShortcuts: ShortcutItem[];
  setAvailableShortcuts: (shortcuts: ShortcutItem[]) => void;
  selectedContact: any;
  setSelectedContact: (contact: any) => void;
  transferAmount: string;
  setTransferAmount: (amount: string) => void;

  // Toast
  toast: { message: string; visible: boolean };
  displayToast: (message: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // UI States
      viewState: 'splash',
      setViewState: (state) => set({ viewState: state }),
      receiptSource: 'home',
      setReceiptSource: (source) => set({ receiptSource: source }),
      showBalance: false,
      setShowBalance: (show) => set({ showBalance: show }),
      
      // User States
      registeredUser: null,
      setRegisteredUser: (user) => set({ registeredUser: user }),
      isBiometricVerified: false,
      setIsBiometricVerified: (verified) => set({ isBiometricVerified: verified }),
      
      // Financials
      balance: 1134.66,
      setBalance: (balance) => set((state) => ({ 
        balance: typeof balance === 'function' ? balance(state.balance) : balance 
      })),
      transactions: [
        {
          id: 'tx-1', type: 'deposit', title: 'Top Up from Bank', amount: '+50.00', currency: 'USDC', timestamp: '2 hours ago', status: 'success', txHash: '0x8f...39a'
        },
        {
           id: 'tx-2', type: 'purchase', title: 'Spotify Premium', amount: '-12.99', currency: 'USDC', timestamp: 'Yesterday', status: 'success', txHash: '0x2a...11f'
        }
      ],
      addTransaction: (tx) => set((state) => {
        const newTx: Transaction = {
          ...tx,
          id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: 'Just now'
        };
        return { transactions: [newTx, ...state.transactions] };
      }),
      selectedTransaction: null,
      setSelectedTransaction: (tx) => set({ selectedTransaction: tx }),
      
      // Feature Persistence
      visibleTokenCodes: ["USDC", "ARC", "ETH", "SOL", "BTC"],
      setVisibleTokenCodes: (codes) => set({ visibleTokenCodes: codes }),
      readReceiptIds: [],
      markAsRead: (id) => set((state) => ({
        readReceiptIds: state.readReceiptIds.includes(id) ? state.readReceiptIds : [...state.readReceiptIds, id]
      })),
      
      // Integration
      selectedShortcuts: defaultSelectedShortcuts,
      setSelectedShortcuts: (shortcuts) => set({ selectedShortcuts: shortcuts }),
      availableShortcuts: defaultAvailableShortcuts,
      setAvailableShortcuts: (shortcuts) => set({ availableShortcuts: shortcuts }),
      selectedContact: null,
      setSelectedContact: (contact) => set({ selectedContact: contact }),
      transferAmount: '0',
      setTransferAmount: (amount) => set({ transferAmount: amount }),

      // Toast
      toast: { message: '', visible: false },
      displayToast: (message) => {
        set({ toast: { message, visible: true } });
        setTimeout(() => set({ toast: { message: '', visible: false } }), 3000);
      },
    }),
    {
      name: 'arc-commerce-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        registeredUser: state.registeredUser,
        balance: state.balance,
        showBalance: state.showBalance,
        visibleTokenCodes: state.visibleTokenCodes,
        readReceiptIds: state.readReceiptIds,
        transactions: state.transactions,
        selectedShortcuts: state.selectedShortcuts,
        availableShortcuts: state.availableShortcuts,
      }),
    }
  )
);
