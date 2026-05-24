import { useQuery } from '@tanstack/react-query';
import { ArcAppKitAdapter } from '../services/arc-app-kit/adapter';
import { useStore } from '../store/useStore';

export const useBalances = () => {
  const setBalance = useStore((state) => state.setBalance);

  return useQuery({
    queryKey: ['balances'],
    queryFn: async () => {
      const data = await ArcAppKitAdapter.getBalance();
      setBalance(data.balance);
      return data;
    },
    staleTime: 2000,
    refetchInterval: 10000, // Poll setiap 10 detik tetap aman sebagai fallback
  });
};
