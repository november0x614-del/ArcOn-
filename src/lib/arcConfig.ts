/**
 * Arc Testnet Configuration
 * Centralized constants for the Arc Network integration.
 */

export const ARC_TESTNET = {
  chainId: 5042002,
  name: "Arc Testnet",
  network: "arc-testnet",
  nativeCurrency: {
    name: "Arc USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        import.meta.env.VITE_ARC_RPC_URL || "https://rpc.testnet.arc.network",
      ],
    },
    public: {
      http: [
        import.meta.env.VITE_ARC_RPC_URL || "https://rpc.testnet.arc.network",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url:
        import.meta.env.VITE_ARC_EXPLORER_URL || "https://testnet.arcscan.app",
    },
  },
  contracts: {
    usdc: {
      address: "0x3600000000000000000000000000000000000000",
    },
    cctpMessenger: {
      address: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
      domain: 26,
    },
    memo: {
      address: "0x9702466268ccF55eAB64cdf484d272Ac08d3b75b",
    },
  },
} as const;

export const ARC_CHAIN_ID = ARC_TESTNET.chainId;
export const USDC_SYMBOL = "USDC";
export const ARC_SYMBOL = "ARC";
