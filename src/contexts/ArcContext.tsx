import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { createPublicClient, http, formatUnits } from "viem";
import { useStore } from "../store/useStore";

interface FeeEstimate {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  display: string;
  usdValue: number;
}

interface ArcContextType {
  balance: string;
  address: string | null;
  chainId: number;
  rpcUrl: string;
  refreshBalance: () => Promise<void>;
  getFeeEstimate: (gasLimit?: bigint) => Promise<FeeEstimate | null>;
  executeArcTransaction: (params: {
    type: string;
    metadata: {
      name: string;
      description: string;
      image: string;
    };
  }) => Promise<{ success: boolean; txHash?: string }>;
}

const ARC_TESTNET_CONFIG = {
  chainId: 5042002,
  rpcUrl: "https://rpc.testnet.arc.network",
  usdcContract: "0x3600000000000000000000000000000000000000",
  decimals: 18,
};

const ArcContext = createContext<ArcContextType | undefined>(undefined);

const publicClient = createPublicClient({
  chain: {
    id: ARC_TESTNET_CONFIG.chainId,
    name: "Arc Testnet",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
    rpcUrls: {
      default: { http: [ARC_TESTNET_CONFIG.rpcUrl] },
      public: { http: [ARC_TESTNET_CONFIG.rpcUrl] },
    },
    blockExplorers: {
      default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
    },
  },
  transport: http(),
});

export { publicClient };

export const ArcProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [balance, setBalance] = useState("0.00");
  const registeredUser = useStore((state) => state.registeredUser);
  const address = registeredUser?.walletAddress || null;
  const userId = registeredUser?.supabaseUid || null;

  const refreshBalance = useCallback(async () => {
    if (!address) return;

    try {
      // 1. Fetch balance in 18-decimal wei
      const balanceWei = await publicClient.getBalance({
        address: address as `0x${string}`,
      });

      // 2. Format with 18 decimals
      const formatted = formatUnits(balanceWei, 18);

      // 3. Keep 6 decimals for display
      const displayFormatted = Number(formatted).toFixed(6);

      setBalance(displayFormatted);
      console.log(
        `[ArcContext] Refreshing balance for ${address}: ${displayFormatted} USDC`,
      );
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  }, []);

  const getFeeEstimate = useCallback(async (gasLimit: bigint = 21000n) => {
    try {
      const latestBlock = await publicClient.getBlock();
      const baseFee = latestBlock.baseFeePerGas;
      if (!baseFee) return null;

      // 2x base fee is generous—Arc's EWMA smoothing keeps fees stable
      const maxFeePerGas = baseFee * 2n;

      // Priority fee of 0 is acceptable on Arc
      const maxPriorityFeePerGas = 0n;

      const maxCostWei = gasLimit * maxFeePerGas;
      // USDC has 18 decimals as the native gas token on Arc
      const usdValue = Number(formatUnits(maxCostWei, 18));

      let display = "";
      if (usdValue < 0.01) {
        display = "< $0.01";
      } else {
        display = `~$${usdValue.toFixed(2)}`;
      }

      return {
        maxFeePerGas,
        maxPriorityFeePerGas,
        display,
        usdValue,
      };
    } catch (error) {
      console.error("Failed to estimate fees:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (address) {
      refreshBalance();

      // Real-time polling
      const interval = setInterval(refreshBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [address, refreshBalance]);

  const executeArcTransaction = useCallback(async (params: {
    type: string;
    metadata: {
      name: string;
      description: string;
      image: string;
    };
  }) => {
    try {
      if (!userId || !address) {
        throw new Error("Local wallet credentials not found.");
      }

      console.log("[ArcContext] Initiating executeArcTransaction backend call:", params);
      const response = await fetch("/api/nft/mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          walletAddress: address,
          name: params.metadata.name,
          description: params.metadata.description,
          image: params.metadata.image,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to mint NFT");
      }

      const data = await response.json();
      return {
        success: true,
        txHash: data.txHash || data.txId,
      };
    } catch (err: any) {
      console.error("[ArcContext] executeArcTransaction failed:", err);
      return {
        success: false,
      };
    }
  }, []);

  const value = {
    balance,
    address,
    chainId: ARC_TESTNET_CONFIG.chainId,
    rpcUrl: ARC_TESTNET_CONFIG.rpcUrl,
    refreshBalance,
    getFeeEstimate,
    executeArcTransaction,
  };

  return <ArcContext.Provider value={value}>{children}</ArcContext.Provider>;
};

export const useArc = () => {
  const context = useContext(ArcContext);
  if (context === undefined) {
    throw new Error("useArc must be used within an ArcProvider");
  }
  return context;
};
