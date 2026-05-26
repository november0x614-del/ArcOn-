import { useQuery } from '@tanstack/react-query';
import { ArcAppKitAdapter } from '../services/arc-app-kit/adapter';
import { useStore } from '../store/useStore';

export const useBalances = () => {
  const registeredUser = useStore((state) => state.registeredUser);
  const setBalance = useStore((state) => state.setBalance);

  return useQuery({
    queryKey: ['balances', registeredUser?.supabaseUid],
    enabled: !!registeredUser?.supabaseUid,
    queryFn: async () => {
      const data = await ArcAppKitAdapter.getBalance();
      
      // Update global store with the primary balance (usually USDC)
      if (data && typeof data.balance === 'number') {
        setBalance(data.balance);
      }
      
      // We can also compute or extract specific Arc-native balances if needed
      // but for now we follow the standard adapter structure.
      return {
        ...data,
        network: 'Arc Testnet',
        timestamp: new Date().toISOString()
      };
    },
    staleTime: 2000,
    refetchInterval: 15000,
  });
};
