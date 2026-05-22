import { useState } from "react";
import { useApp } from "../../context/AppContext";

export const useUSDCBalance = () => {
  const { balance, fetchBalance, showBalance } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  const refreshBalance = async () => {
    setIsLoading(true);
    await fetchBalance();
    setIsLoading(false);
  };
  
  return {
    balance,
    showBalance,
    refreshBalance,
    isLoading,
    formattedBalance: showBalance 
      ? balance.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "••••••"
  };
};
