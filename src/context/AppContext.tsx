import React, { createContext, useContext, ReactNode } from 'react';
import { useStore } from '../store/useStore';
import { Check } from 'lucide-react';

const AppContext = createContext<any>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const store = useStore();

  return (
    <AppContext.Provider value={store}>
      {children}
      
      {/* Toast Notification */}
      {store.toast.visible && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] z-[999] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
           <div className="bg-emerald-50 text-emerald-700 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-emerald-100 rounded-[12px] px-4 py-3 flex items-center gap-3 w-full">
              <div className="bg-emerald-500 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                <Check size={12} strokeWidth={3} className="text-white" />
              </div>
              <span className="font-semibold text-[13.5px] leading-snug">{store.toast.message}</span>
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
