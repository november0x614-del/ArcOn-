import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ViewState, ShortcutItem } from '../types';
import { defaultSelectedShortcuts, defaultAvailableShortcuts } from '../components/screens/ManageFavoritesScreen';
import { Check } from 'lucide-react';

interface UserIdentity {
  username: string;
  email: string;
  isVerified: boolean;
}

interface AppContextType {
  viewState: ViewState;
  setViewState: (state: ViewState) => void;
  registeredUser: UserIdentity | null;
  setRegisteredUser: (user: UserIdentity | null) => void;
  isBiometricVerified: boolean;
  setIsBiometricVerified: (verified: boolean) => void;
  showBalance: boolean;
  setShowBalance: (show: boolean) => void;
  receiptSource: ViewState;
  setReceiptSource: (source: ViewState) => void;
  selectedContact: any;
  setSelectedContact: (contact: any) => void;
  transferAmount: string;
  setTransferAmount: (amount: string) => void;
  selectedShortcuts: ShortcutItem[];
  setSelectedShortcuts: (shortcuts: ShortcutItem[]) => void;
  availableShortcuts: ShortcutItem[];
  setAvailableShortcuts: (shortcuts: ShortcutItem[]) => void;
  displayToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [viewState, setViewState] = useState<ViewState>('splash');
  
  const [registeredUser, setRegisteredUser] = useState<UserIdentity | null>(() => {
    const saved = localStorage.getItem('arc_commerce_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isBiometricVerified, setIsBiometricVerified] = useState(false);
  
  const [showBalance, setShowBalanceState] = useState(() => {
    const saved = localStorage.getItem('arc_commerce_show_balance');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const setShowBalance = (val: boolean) => {
    setShowBalanceState(val);
    localStorage.setItem('arc_commerce_show_balance', JSON.stringify(val));
  };

  const [receiptSource, setReceiptSource] = useState<ViewState>('home');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [transferAmount, setTransferAmount] = useState('0');
  
  const [selectedShortcuts, setSelectedShortcuts] = useState<ShortcutItem[]>(defaultSelectedShortcuts);
  const [availableShortcuts, setAvailableShortcuts] = useState<ShortcutItem[]>(defaultAvailableShortcuts);
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const displayToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <AppContext.Provider value={{
      viewState, setViewState,
      registeredUser, setRegisteredUser,
      isBiometricVerified, setIsBiometricVerified,
      showBalance, setShowBalance,
      receiptSource, setReceiptSource,
      selectedContact, setSelectedContact,
      transferAmount, setTransferAmount,
      selectedShortcuts, setSelectedShortcuts,
      availableShortcuts, setAvailableShortcuts,
      displayToast
    }}>
      {/* 
        Must wrap children in relative container to ensure absolute positioned toast works perfectly 
        like in App.tsx. Or we can just render it. We'll rely on App.tsx UI.
      */}
      {children}
      
      {/* Toast Notification */}
      {showToast && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] z-[999] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
           <div className="bg-emerald-50 text-emerald-700 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-emerald-100 rounded-[12px] px-4 py-3 flex items-center gap-3 w-full">
              <div className="bg-emerald-500 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                <Check size={12} strokeWidth={3} className="text-white" />
              </div>
              <span className="font-semibold text-[13.5px] leading-snug">{toastMessage}</span>
           </div>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
