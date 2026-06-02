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
import { BackendClient } from "../services/api";
import { MOCK_PRODUCTS } from "../data/mockProducts";

export type TransactionFilter = "All" | "Received" | "Sent" | "Swaps" | "Bridge";

interface AppState {
  // ... existing state definitions ...
  viewState: ViewState;
  setViewState: (state: ViewState) => void;
  receiptSource: ViewState;
  setReceiptSource: (source: ViewState) => void;
  showBalance: boolean;
  setShowBalance: (show: boolean) => void;
  activeFilter: TransactionFilter;
  setActiveFilter: (filter: TransactionFilter) => void;
  importedTokens: ImportedToken[];
  importToken: (token: ImportedToken) => Promise<void>;
  removeToken: (symbol: string) => Promise<void>;
  fetchImportedTokens: () => Promise<void>;
  registeredUser: UserIdentity | null;
  setRegisteredUser: (user: UserIdentity | null) => void;
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
  visibleTokenCodes: string[];
  setVisibleTokenCodes: (codes: string[]) => void;
  readReceiptIds: string[];
  markAsRead: (id: string) => void;
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
  toast: { message: string; visible: boolean };
  displayToast: (message: string) => void;
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
  products: any[];
  setProducts: (products: any[]) => void;
  fetchProducts: () => Promise<void>;
  saveProduct: (product: any) => Promise<void>;
  removeProduct: (productId: string | number) => Promise<void>;
  cart: Record<number, number>;
  setCart: (cart: Record<number, number>) => void;
  addToCart: (productId: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  mintedNfts: any[];
  setMintedNfts: (nfts: any[]) => void;
  addMintedNft: (nft: any) => void;
  favorites: any[];
  setFavorites: (favs: any[] | ((prev: any[]) => any[])) => void;
  deletedContactIds: string[];
  setDeletedContactIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  arcbirdHighscore: number;
  setArcbirdHighscore: (score: number) => void;
  savePreferences: (updates: any) => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updateProductStockAndSales: (productId: number, quantityBought: number) => void;
  resetState: () => void;
}

let activePollSessionId = 0;

export const useStore = create<AppState>()((set) => ({
  // UI States
  viewState: "splash",
  setViewState: (state) => set({ viewState: state }),
  receiptSource: "home",
  setReceiptSource: (source) => set({ receiptSource: source }),
  showBalance: true,
  setShowBalance: (show) => set({ showBalance: show }),
  activeFilter: "All",
  setActiveFilter: (filter) => set({ activeFilter: filter }),

  // User States
  registeredUser: null,
  setRegisteredUser: (user) => {
    set({ registeredUser: user });
    if (user?.supabaseUid) {
      useStore.getState().fetchImportedTokens();
      useStore.getState().fetchProducts();
      useStore.getState().fetchPreferences();
    } else {
      set({
        readReceiptIds: [],
        selectedShortcuts: defaultSelectedShortcuts,
        mintedNfts: [],
        favorites: [],
        deletedContactIds: [],
        arcbirdHighscore: 0,
        products: MOCK_PRODUCTS,
      });
    }
  },

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
      const data = await BackendClient.getBalance();
      const newBalance = data.balance || 0;

      const state = useStore.getState();

      // Calculate PnL locally based on current transactions
      let totalDeposit = 0;
      state.transactions.forEach((tx) => {
        if (tx.type === "deposit" || tx.type === "receive") {
          const amt = Math.abs(parseFloat(tx.amount.replace(/[+-]/g, ""))) || 0;
          totalDeposit += amt;
        }
      });

      const pnlValue = totalDeposit > 0 ? newBalance - totalDeposit : 0;
      const pnlPercentage =
        totalDeposit > 0 ? (pnlValue / totalDeposit) * 100 : 0;

      // Only update if balance changed to save renders
      if (
        state.balance !== newBalance ||
        state.allBalances.length !== (data.allBalances?.length || 0)
      ) {
        set({
          balance: newBalance,
          allBalances: data.allBalances || [],
          pnlValue,
          pnlPercentage,
        });
      }
    } catch (error: any) {
      // Errors handled inside apiRequest usually
    }
  },
  pnlValue: 0,
  setPnlValue: (value) => set({ pnlValue: value }),
  pnlPercentage: 0,
  setPnlPercentage: (percentage) => set({ pnlPercentage: percentage }),
  transactions: [],
  isSyncing: false,
  lastSyncTime: null,
  fetchTransactions: async () => {
    const user = useStore.getState().registeredUser;
    if (!user?.supabaseUid) return;

    try {
      const url = `/api/transactions/${user.supabaseUid}`;
      const response = await fetch(url);
      if (!response.ok) return;

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
        if (tx.type === "bridge")
          title =
            direction === "inbound"
              ? "CCTP Inbound Bridge"
              : "CCTP Outbound Bridge";

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

      // Skip update if length and first/last ID are same (basic heuristic for "identitcal")
      if (
        state.transactions.length === transactions.length &&
        state.transactions[0]?.id === transactions[0]?.id &&
        state.transactions[0]?.status === transactions[0]?.status
      ) {
        return;
      }

      set({ transactions });
    } catch (error) {}
  },

  startSyncPolling: () => {
    const state = useStore.getState();
    if (state.isSyncing) return;

    set({ isSyncing: true });
    activePollSessionId++;
    const sessionId = activePollSessionId;

    const poll = async () => {
      const currentState = useStore.getState();
      if (!currentState.isSyncing || activePollSessionId !== sessionId) return;

      try {
        await Promise.all([
          currentState.fetchBalance(),
          currentState.fetchTransactions(),
        ]);
        set({ lastSyncTime: new Date() });
      } catch (err) {}

      const hasPending = useStore
        .getState()
        .transactions.some(
          (tx) => tx.status === "pending" || tx.status === "pending_approval",
        );

      // Industrial standard: Relaxed polling unless something is happening
      const nextDelay = hasPending ? 3000 : 20000; // 20s if idle, 3s if pending

      if (useStore.getState().isSyncing && activePollSessionId === sessionId) {
        setTimeout(poll, nextDelay);
      }
    };

    poll();
  },

  stopSyncPolling: () => {
    activePollSessionId++;
    set({ isSyncing: false });
  },

  selectedTransaction: null,
  setSelectedTransaction: (tx) => set({ selectedTransaction: tx }),

  visibleTokenCodes: ["USDC", "EURC", "USDT", "USDe", "DAI", "PYUSD", "cirBTC"],
  setVisibleTokenCodes: (codes) => set({ visibleTokenCodes: codes }),
  readReceiptIds: [],
  markAsRead: (id) =>
    set((state) => {
      const newList = state.readReceiptIds.includes(id)
        ? state.readReceiptIds
        : [...state.readReceiptIds, id];
      if (state.registeredUser?.supabaseUid) {
        try {
          localStorage.setItem(`receipts_${state.registeredUser.supabaseUid}`, JSON.stringify(newList));
        } catch (e) {}
      }
      return { readReceiptIds: newList };
    }),

  importedTokens: [],
  importToken: async (token) => {
    const state = useStore.getState();
    const uppercaseSymbol = token.symbol.toUpperCase();
    if (
      state.importedTokens.some(
        (t) => t.symbol.toUpperCase() === uppercaseSymbol,
      )
    )
      return;

    // Local update
    set((state) => ({ importedTokens: [...state.importedTokens, token] }));

    // Sync to backend
    if (state.registeredUser?.supabaseUid) {
      try {
        await BackendClient.saveImportedToken(
          state.registeredUser.supabaseUid,
          token,
        );
      } catch (e) {
        console.error("Failed to sync imported token to database", e);
      }
    }
  },
  removeToken: async (symbol) => {
    const state = useStore.getState();
    const tokenToRemove = state.importedTokens.find(
      (t) => t.symbol.toUpperCase() === symbol.toUpperCase(),
    );

    // Local updates
    set((state) => ({
      importedTokens: state.importedTokens.filter(
        (t) => t.symbol.toUpperCase() !== symbol.toUpperCase(),
      ),
    }));

    // Sync to backend
    if (state.registeredUser?.supabaseUid && tokenToRemove?.contractAddress) {
      try {
        await BackendClient.removeImportedToken(
          state.registeredUser.supabaseUid,
          tokenToRemove.contractAddress,
        );
      } catch (e) {
        console.error("Failed to remove imported token from database", e);
      }
    }
  },
  fetchImportedTokens: async () => {
    const user = useStore.getState().registeredUser;
    if (!user?.supabaseUid) return;

    try {
      const tokens = await BackendClient.getImportedTokens(user.supabaseUid);
      if (Array.isArray(tokens)) {
        set({ importedTokens: tokens });
      }
    } catch (e) {
      console.error("Failed to fetch imported tokens from database", e);
    }
  },

  selectedShortcuts: defaultSelectedShortcuts,
  setSelectedShortcuts: (shortcuts) => set((state) => {
    if (state.registeredUser?.supabaseUid) {
      try {
        localStorage.setItem(`shortcuts_${state.registeredUser.supabaseUid}`, JSON.stringify(shortcuts));
      } catch (e) {}
    }
    return { selectedShortcuts: shortcuts };
  }),
  availableShortcuts: defaultAvailableShortcuts,
  setAvailableShortcuts: (shortcuts) => set({ availableShortcuts: shortcuts }),
  selectedContact: null,
  setSelectedContact: (contact) => set({ selectedContact: contact }),
  transferAmount: "0",
  setTransferAmount: (amount) => set({ transferAmount: amount }),
  transferMemo: "",
  setTransferMemo: (memo) => set({ transferMemo: memo }),

  toast: { message: "", visible: false },
  displayToast: (message) => {
    set({ toast: { message, visible: true } });
    setTimeout(() => set({ toast: { message: "", visible: false } }), 3000);
  },
  language: "English",
  setLanguage: (lang) => set({ language: lang }),
  network: "ARC TESTNET",
  setNetwork: (net) => set({ network: net }),
  platformConfig: null,
  setPlatformConfig: (config) => {
    set({ platformConfig: config });
    if (config) {
      try {
        localStorage.setItem("arc_platform_config", JSON.stringify(config));
      } catch (e) {}
    }
  },
  fetchPlatformConfig: async () => {
    // Try localStorage first
    try {
      const cached = localStorage.getItem("arc_platform_config");
      if (cached) {
        set({ platformConfig: JSON.parse(cached) });
      }
    } catch (e) {}

    try {
      const res = await fetch("/api/admin/config");
      if (res.ok) {
        const data = await res.json();
        set({ platformConfig: data });
        localStorage.setItem("arc_platform_config", JSON.stringify(data));
      }
    } catch (e) {}
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
  products: MOCK_PRODUCTS,
  setProducts: (products) => {
    set({ products });
  },
  fetchProducts: async () => {
    try {
      const products = await BackendClient.getProducts();
      if (Array.isArray(products) && products.length > 0) {
        set({ products });
      } else {
        set({ products: MOCK_PRODUCTS });
      }
    } catch (e) {
      set({ products: MOCK_PRODUCTS });
    }
  },
  saveProduct: async (product) => {
    try {
      const saved = await BackendClient.saveProduct(product);
      set((state) => ({ products: [saved, ...state.products] }));
    } catch (e) {
      set((state) => ({ products: [product, ...state.products] }));
    }
  },
  removeProduct: async (productId) => {
    try {
      await BackendClient.deleteProduct(productId);
      set((state) => ({
        products: state.products.filter((p) => p.id !== productId),
      }));
    } catch (e) {
      set((state) => ({
        products: state.products.filter((p) => p.id !== productId),
      }));
    }
  },
  cart: (() => {
    try {
      const cached = localStorage.getItem("lounge_cart");
      return cached ? JSON.parse(cached) : {};
    } catch (e) {
      return {};
    }
  })(),
  setCart: (cart) => {
    set({ cart });
    localStorage.setItem("lounge_cart", JSON.stringify(cart));
  },
  addToCart: (productId) =>
    set((state) => {
      const newCart = {
        ...state.cart,
        [productId]: (state.cart[productId] || 0) + 1,
      };
      localStorage.setItem("lounge_cart", JSON.stringify(newCart));
      return { cart: newCart };
    }),
  removeFromCart: (productId) =>
    set((state) => {
      const newCart = { ...state.cart };
      if (newCart[productId] > 1) {
        newCart[productId] -= 1;
      } else {
        delete newCart[productId];
      }
      localStorage.setItem("lounge_cart", JSON.stringify(newCart));
      return { cart: newCart };
    }),
  clearCart: () => {
    localStorage.removeItem("lounge_cart");
    set({ cart: {} });
  },
  mintedNfts: [],
  setMintedNfts: (nfts) => {
    set({ mintedNfts: nfts });
    useStore.getState().savePreferences({ mintedNfts: nfts });
  },
  addMintedNft: (nft) =>
    set((state) => {
      const newList = [nft, ...state.mintedNfts];
      useStore.getState().savePreferences({ mintedNfts: newList });
      return { mintedNfts: newList };
    }),
  favorites: [],
  setFavorites: (favorites) => {
    set((state) => {
      const newList =
        typeof favorites === "function" ? favorites(state.favorites) : favorites;
      useStore.getState().savePreferences({ favorites: newList });
      return { favorites: newList };
    });
  },
  deletedContactIds: [],
  setDeletedContactIds: (ids) => {
    set((state) => {
      const newList =
        typeof ids === "function" ? ids(state.deletedContactIds) : ids;
      useStore.getState().savePreferences({ deletedContactIds: newList });
      return { deletedContactIds: newList };
    });
  },
  arcbirdHighscore: 0,
  setArcbirdHighscore: (score) => {
    set({ arcbirdHighscore: score });
    useStore.getState().savePreferences({ arcbirdHighscore: score });
  },
  savePreferences: async (updates) => {
    const user = useStore.getState().registeredUser;
    if (!user?.supabaseUid) return;
    try {
      await BackendClient.updatePreferences(updates);
    } catch (e) {
      console.error("Failed to sync preferences to backend", e);
    }
  },
  fetchPreferences: async () => {
    const user = useStore.getState().registeredUser;
    if (!user?.supabaseUid) return;
    try {
      const prefs = await BackendClient.getPreferences();
      if (prefs) {
        set({
          favorites: prefs.favorites || [],
          deletedContactIds: prefs.deletedContactIds || [],
          arcbirdHighscore: prefs.arcbirdHighscore || 0,
          mintedNfts: prefs.mintedNfts || [],
        });
      }
    } catch (e) {
      console.error("Failed to fetch preferences from backend", e);
    }
  },
  updateProductStockAndSales: (productId, quantityBought) => {
    set((state) => {
      const updated = state.products.map((p) => {
        if (p.id === productId) {
          const updatedProduct = {
            ...p,
            stock: Math.max(0, p.stock - quantityBought),
            sales: p.sales + quantityBought,
          };
          // Async update backend
          BackendClient.updateProduct(productId, {
            stock: updatedProduct.stock,
            sales: updatedProduct.sales,
          }).catch(() => {});
          return updatedProduct;
        }
        return p;
      });
      return { products: updated };
    });
  },
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
