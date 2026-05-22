import { useUSDCBalance } from './hooks';

export const useUnifiedBalanceKit = () => {
    const balanceKit = useUSDCBalance();
    
    return {
        unifiedBalance: {
            getBalance: () => balanceKit.balance,
            getFormattedBalance: () => balanceKit.formattedBalance,
            refreshBalance: balanceKit.refreshBalance
        }
    };
};
