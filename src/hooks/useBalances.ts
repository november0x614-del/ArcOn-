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
      if (data && typeof data.balance === 'number') {
        setBalance(data.balance);
      }
      return data;
    },
    staleTime: 2000,
    refetchInterval: 15000,
  });
};
