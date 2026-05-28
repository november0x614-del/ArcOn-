import { create } from "zustand";
import {
  ViewState,
  ShortcutItem,
  UserIdentity,
  Transaction,
  SourceAccount,
  ImportedToken,
} from "../types";
import {
  defaultSelectedShortcuts,
  defaultAvailableShortcuts,
} from "../components/screens/ManageFavoritesScreen";

export type TransactionFilter = "All" | "Received" | "Sent" | "Swaps";

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

  // Imported Tokens state
  importedTokens: ImportedToken[];
  importToken: (token: ImportedToken) => void;
  removeToken: (symbol: string) => void;

  // User & Auth
  registeredUser: UserIdentity | null;
  setRegisteredUser: (user: UserIdentity | null) => void;

  // Financials
  balance: number;
  allBalances: any[];
  setBalance: (balance: number | ((prev: number) => number)) => void;
  fetchBalance: () => Promise<void>;
  pnlValue: number;
  setPnlValue: (value: number) => void;
  pnlPercentage: number;
  setPnlPercentage: (percentage: number) => void;
  transactions: Transaction[];
  fetchTransactions: () => Promise<void>;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  startSyncPolling: () => void;
  stopSyncPolling: () => void;
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
  transferMemo: string;
  setTransferMemo: (memo: string) => void;

  // Toast
  toast: { message: string; visible: boolean };
  displayToast: (message: string) => void;

  // Settings
  language: string;
  setLanguage: (lang: string) => void;
  network: string;
  setNetwork: (network: string) => void;
  platformConfig: any;
  setPlatformConfig: (config: any) => void;
  fetchPlatformConfig: () => Promise<void>;
  walletConnectSessions: number;
  setWalletConnectSessions: (count: number) => void;
  contractAllowances: number;
  setContractAllowances: (count: number) => void;
  sourceAccount: SourceAccount;
  setSourceAccount: (account: SourceAccount) => void;
  logs: string[];
  addLog: (log: string) => void;
  resetState: () => void;
}

let activePollSessionId = 0;

export const useStore = create<AppState>()((set) => ({
  // UI States
  viewState: "splash",
  setViewState: (state) => set({ viewState: state }),
  receiptSource: "home",
  setReceiptSource: (source) => set({ receiptSource: source }),
  showBalance: false,
  setShowBalance: (show) => set({ showBalance: show }),
  activeFilter: "All",
  setActiveFilter: (filter) => set({ activeFilter: filter }),

  // User States
  registeredUser: null,
  setRegisteredUser: (user) => set({ registeredUser: user }),

  // Financials
  balance: 0,
  allBalances: [],
  setBalance: (balance) =>
    set((state) => ({
      balance: typeof balance === "function" ? balance(state.balance) : balance,
    })),
  fetchBalance: async () => {
    const user = useStore.getState().registeredUser;
    if (!user?.supabaseUid) return;

    try {
      const url = `/api/balance/${user.supabaseUid}`;
      useStore.getState().addLog(`Fetching balance: GET ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        const errText = await response.text();
        useStore
          .getState()
          .addLog(`Balance fetch failed: ${url} Status: ${response.status} - ${errText}`);
        console.error(`Balance fetch failed with status: ${response.status} ${errText}`);
        return;
      }
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const text = await response.text();
        const data = JSON.parse(text);
        const newBalance = data.balance || 0;
        useStore
          .getState()
          .addLog(`Balance value: ${newBalance} (from ${url})`);

        const state = useStore.getState();
        let totalDeposit = 0;
        state.transactions.forEach((tx) => {
          if (tx.type === "deposit" || tx.type === "receive") {
            const amt =
              Math.abs(parseFloat(tx.amount.replace(/[+-]/g, ""))) || 0;
            totalDeposit += amt;
          }
        });

        const pnlValue = totalDeposit > 0 ? newBalance - totalDeposit : 0;
        const pnlPercentage =
          totalDeposit > 0 ? (pnlValue / totalDeposit) * 100 : 0;

        set({ balance: newBalance, allBalances: data.allBalances || [], pnlValue, pnlPercentage });
      } else {
        console.error(`Received non-JSON response for ${url}`);
      }
    } catch (error: any) {
      useStore.getState().addLog(`Balance fetch error: ${error}`);
      if (error.name !== "TypeError" || error.message !== "Failed to fetch") {
        console.error("Failed to fetch balance", error);
      }
    }
  },
  pnlValue: 0,
  setPnlValue: (value) => set({ pnlValue: value }),
  pnlPercentage: 0,
  setPnlPercentage: (percentage) => set({ pnlPercentage: percentage }),
  transactions: [], // Start empty
  isSyncing: false,
  lastSyncTime: null,
  fetchTransactions: async () => {
    const user = useStore.getState().registeredUser;
    if (!user?.supabaseUid) return;

    try {
      const url = `/api/transactions/${user.supabaseUid}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errText = await response.text();
        console.error("Backend error for transactions:", errText);
        useStore.getState().addLog(`Transactions Server Error: ${response.status} - ${errText}`);
        return;
      }
      const text = await response.text();
      if (!text) return;
      const dbTransactions = JSON.parse(text);

      if (!Array.isArray(dbTransactions)) return;

      const transactions: Transaction[] = dbTransactions.map((tx: any) => {
        const rawAmount = parseFloat(tx.amount) || 0;
        const direction =
          tx.metadata?.direction ||
          (tx.type === "receive" || tx.type === "deposit"
            ? "inbound"
            : "outbound");
        const sign = direction === "inbound" ? "+" : "-";

        let title = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
        if (tx.type === "receive") title = "Inbound Transfer";
        if (tx.type === "bridge") {
          title =
            direction === "inbound"
              ? "CCTP Inbound Bridge"
              : "CCTP Outbound Bridge";
        }

        return {
          id: tx.id || tx.internal_ref,
          type: tx.type,
          title,
          amount: sign + Math.abs(rawAmount).toString(),
          currency: "USDC",
          timestamp: new Date(tx.created_at).toLocaleString(),
          status: tx.status,
          txHash: tx.tx_hash || tx.metadata?.txHash || tx.internal_ref,
          explorerUrl:
            tx.metadata?.explorerUrl ||
            (tx.tx_hash || tx.internal_ref
              ? `https://testnet.arcscan.app/tx/${tx.tx_hash || tx.internal_ref}`
              : undefined),
          metadata: tx.metadata,
        };
      });

      const state = useStore.getState();
      let totalDeposit = 0;
      transactions.forEach((tx) => {
        if (tx.type === "deposit" || tx.type === "receive") {
          const amt = Math.abs(parseFloat(tx.amount.replace(/[+-]/g, ""))) || 0;
          totalDeposit += amt;
        }
      });

      const pnlValue = totalDeposit > 0 ? state.balance - totalDeposit : 0;
      const pnlPercentage =
        totalDeposit > 0 ? (pnlValue / totalDeposit) * 100 : 0;

      set({ transactions, pnlValue, pnlPercentage });
    } catch (error: any) {
      console.error("Failed to fetch transactions", error);
    }
  },

  startSyncPolling: () => {
    const state = useStore.getState();
    if (state.isSyncing) return;

    set({ isSyncing: true });
    state.addLog("REAL-TIME SYNC: Active (Industrial Standard)");

    activePollSessionId++;
    const sessionId = activePollSessionId;

    const poll = async () => {
      const currentState = useStore.getState();
      if (!currentState.isSyncing || activePollSessionId !== sessionId) {
        return;
      }

      try {
        await Promise.all([
          currentState.fetchBalance(),
          currentState.fetchTransactions(),
        ]);
        set({ lastSyncTime: new Date() });
      } catch (err) {
        console.error("Polling failed", err);
      }

      // If we have pending transactions, keep polling faster. 
      const hasPending = useStore.getState().transactions.some(tx => tx.status === "pending" || tx.status === "pending_approval");
      
      const nextDelay = hasPending ? 3000 : 8000;
      
      if (useStore.getState().isSyncing && activePollSessionId === sessionId) {
        setTimeout(poll, nextDelay);
      }
    };

    poll();
  },

  stopSyncPolling: () => {
    activePollSessionId++; // Invalidate running polls immediately
    set({ isSyncing: false });
    useStore.getState().addLog("REAL-TIME SYNC: Dormant");
  },

  selectedTransaction: null,
  setSelectedTransaction: (tx) => set({ selectedTransaction: tx }),

  // Feature Persistence
  visibleTokenCodes: ["USDC", "EURC", "USDT", "USDe", "DAI", "PYUSD", "cirBTC"],
  setVisibleTokenCodes: (codes) => set({ visibleTokenCodes: codes }),
  readReceiptIds: [],
  markAsRead: (id) =>
    set((state) => ({
      readReceiptIds: state.readReceiptIds.includes(id)
        ? state.readReceiptIds
        : [...state.readReceiptIds, id],
    })),

  // Imported Tokens
  importedTokens: [],
  importToken: (token) =>
    set((state) => {
      const uppercaseSymbol = token.symbol.toUpperCase();
      if (
        state.importedTokens.some(
          (t) => t.symbol.toUpperCase() === uppercaseSymbol,
        )
      ) {
        return state;
      }
      return { importedTokens: [...state.importedTokens, token] };
    }),
  removeToken: (symbol) =>
    set((state) => ({
      importedTokens: state.importedTokens.filter(
        (t) => t.symbol.toUpperCase() !== symbol.toUpperCase(),
      ),
    })),

  // Integration
  selectedShortcuts: defaultSelectedShortcuts,
  setSelectedShortcuts: (shortcuts) => set({ selectedShortcuts: shortcuts }),
  availableShortcuts: defaultAvailableShortcuts,
  setAvailableShortcuts: (shortcuts) => set({ availableShortcuts: shortcuts }),
  selectedContact: null,
  setSelectedContact: (contact) => set({ selectedContact: contact }),
  transferAmount: "0",
  setTransferAmount: (amount) => set({ transferAmount: amount }),
  transferMemo: "",
  setTransferMemo: (memo) => set({ transferMemo: memo }),

  // Toast
  toast: { message: "", visible: false },
  displayToast: (message) => {
    set({ toast: { message, visible: true } });
    setTimeout(() => set({ toast: { message: "", visible: false } }), 3000);
  },
  // Settings
  language: "English",
  setLanguage: (lang) => set({ language: lang }),
  network: "ARC TESTNET",
  setNetwork: (net) => set({ network: net }),
  platformConfig: null,
  setPlatformConfig: (config) => set({ platformConfig: config }),
  fetchPlatformConfig: async () => {
    try {
      const res = await fetch("/api/admin/config");
      if (res.ok) set({ platformConfig: await res.json() });
    } catch (e) {
      console.error("Failed to fetch platform config", e);
    }
  },
  walletConnectSessions: 0,
  setWalletConnectSessions: (count) => set({ walletConnectSessions: count }),
  contractAllowances: 0,
  setContractAllowances: (count) => set({ contractAllowances: count }),
  sourceAccount: {
    name: "Primary USDC Wallet",
    accountNumber: "0x...",
    balance: 0,
    currency: "USDC",
  },
  setSourceAccount: (account) => set({ sourceAccount: account }),
  logs: [],
  addLog: (log) =>
    set((state) => ({
      logs: [
        ...state.logs.slice(-49),
        `[${new Date().toLocaleTimeString()}] ${log}`,
      ],
    })),
  resetState: () =>
    set({
      viewState: "splash",
      registeredUser: null,
      balance: 0,
      transactions: [],
      pnlValue: 0,
      pnlPercentage: 0,
      readReceiptIds: [],
      logs: [],
    }),
}));
