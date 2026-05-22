import { create } from 'zustand';
import { ViewState, ShortcutItem, UserIdentity, Transaction, SourceAccount } from '../types';
import { defaultSelectedShortcuts, defaultAvailableShortcuts } from '../components/screens/ManageFavoritesScreen';

export type TransactionFilter = 'All' | 'Received' | 'Sent' | 'Swaps';

interface AppState {
  // Navigation & UI
  viewState: ViewState;
  setViewState: (state: ViewState) => void;
  receiptSource: ViewState;
  setReceiptSource: (source: ViewState) => void;
  showBalance: boolean;
  setShowBalance: (show: boolean) => void;
  activeFilter: TransactionFilter;
  setActiveFilter: (filter: TransactionFilter) => void;
  
  // User & Auth
  registeredUser: UserIdentity | null;
  setRegisteredUser: (user: UserIdentity | null) => void;
  
  // Financials
  balance: number;
  setBalance: (balance: number | ((prev: number) => number)) => void;
  fetchBalance: () => Promise<void>;
  pnlValue: number;
  setPnlValue: (value: number) => void;
  pnlPercentage: number;
  setPnlPercentage: (percentage: number) => void;
  transactions: Transaction[];
  fetchTransactions: () => Promise<void>;
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

  // Settings
  language: string;
  setLanguage: (lang: string) => void;
  network: string;
  setNetwork: (network: string) => void;
  walletConnectSessions: number;
  setWalletConnectSessions: (count: number) => void;
  contractAllowances: number;
  setContractAllowances: (count: number) => void;
  sourceAccount: SourceAccount;
  setSourceAccount: (account: SourceAccount) => void;
  resetState: () => void;
}


export const useStore = create<AppState>()(
  (set) => ({
      // UI States
      viewState: 'splash',
      setViewState: (state) => set({ viewState: state }),
      receiptSource: 'home',
      setReceiptSource: (source) => set({ receiptSource: source }),
      showBalance: false,
      setShowBalance: (show) => set({ showBalance: show }),
      activeFilter: 'All',
      setActiveFilter: (filter) => set({ activeFilter: filter }),
      
      // User States
      registeredUser: null,
      setRegisteredUser: (user) => set({ registeredUser: user }),
      
      // Financials
      balance: 0,
      setBalance: (balance) => set((state) => ({ 
        balance: typeof balance === 'function' ? balance(state.balance) : balance 
      })),
      fetchBalance: async () => {
        const user = useStore.getState().registeredUser;
        if (!user?.supabaseUid) return;
        
        try {
          const response = await fetch(`/api/balance/${user.supabaseUid}`);
          if (!response.ok) {
            console.error(`Balance fetch failed with status: ${response.status}`);
            return;
          }
          const text = await response.text();
          if (!text) return;
          const data = JSON.parse(text);
          const newBalance = data.balance || 0;
          
          const state = useStore.getState();
          let totalDeposit = 0;
          state.transactions.forEach((tx) => {
            if (tx.type === 'deposit' || tx.type === 'receive') {
              const amt = Math.abs(parseFloat(tx.amount.replace(/[+-]/g, ''))) || 0;
              totalDeposit += amt;
            }
          });
          
          const pnlValue = totalDeposit > 0 ? newBalance - totalDeposit : 0;
          const pnlPercentage = totalDeposit > 0 ? (pnlValue / totalDeposit) * 100 : 0;

          set({ balance: newBalance, pnlValue, pnlPercentage });
        } catch (error) {
          console.error('Failed to fetch balance', error);
        }
      },
      pnlValue: 0,
      setPnlValue: (value) => set({ pnlValue: value }),
      pnlPercentage: 0,
      setPnlPercentage: (percentage) => set({ pnlPercentage: percentage }),
      transactions: [], // Start empty
      fetchTransactions: async () => {
        const user = useStore.getState().registeredUser;
        if (!user?.supabaseUid) return;
        
        try {
          const response = await fetch(`/api/transactions/${user.supabaseUid}`);
          if (!response.ok) {
            console.error(`Transactions fetch failed with status: ${response.status}`);
            return;
          }
          const text = await response.text();
          if (!text) return;
          const dbTransactions = JSON.parse(text);
          
          if (!Array.isArray(dbTransactions)) return;

          const transactions: Transaction[] = dbTransactions.map((tx: any) => {
            const rawAmount = parseFloat(tx.amount) || 0;
            const sign = tx.type === 'receive' || tx.type === 'deposit' ? '+' : '-';
            return {
              id: tx.id || tx.internal_ref,
              type: tx.type,
              title: tx.type === 'receive' ? 'Inbound Transfer' : tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
              amount: sign + Math.abs(rawAmount).toString(),
              currency: 'USDC',
              timestamp: new Date(tx.created_at).toLocaleString(),
              status: tx.status,
              txHash: tx.metadata?.txHash
            };
          });
          
          const state = useStore.getState();
          let totalDeposit = 0;
          transactions.forEach((tx) => {
            if (tx.type === 'deposit' || tx.type === 'receive') {
              const amt = Math.abs(parseFloat(tx.amount.replace(/[+-]/g, ''))) || 0;
              totalDeposit += amt;
            }
          });
          
          const pnlValue = totalDeposit > 0 ? state.balance - totalDeposit : 0;
          const pnlPercentage = totalDeposit > 0 ? (pnlValue / totalDeposit) * 100 : 0;

          set({ transactions, pnlValue, pnlPercentage });
        } catch (error) {
          console.error('Failed to fetch transactions', error);
        }
      },
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
      // Settings
      language: 'English',
      setLanguage: (lang) => set({ language: lang }),
      network: 'ARC TESTNET',
      setNetwork: (net) => set({ network: net }),
      walletConnectSessions: 0,
      setWalletConnectSessions: (count) => set({ walletConnectSessions: count }),
      contractAllowances: 0,
      setContractAllowances: (count) => set({ contractAllowances: count }),
      sourceAccount: {
        name: 'Savings NOW IDR',
        accountNumber: '1820014780589',
        balance: 18261185,
        currency: 'IDR'
      },
      setSourceAccount: (account) => set({ sourceAccount: account }),
      resetState: () => set({
        viewState: 'splash',
        registeredUser: null,
        balance: 0,
        transactions: [],
        pnlValue: 0,
        pnlPercentage: 0,
        readReceiptIds: [],
      }),
    }),
);
