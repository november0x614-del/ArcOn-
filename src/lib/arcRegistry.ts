export interface ArcTokenMetadata {
  symbol: string;
  name: string;
  decimals: number;
  contractAddress: string;
  logoUrl?: string;
  isNative?: boolean;
}

// Simulates a centralized token registry synchronized from ArcScan
export const ARC_TOKEN_REGISTRY: Record<string, ArcTokenMetadata> = {
  // Use lowercase for contract address keys
  "0x3600000000000000000000000000000000000000": {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    contractAddress: "0x3600000000000000000000000000000000000000",
    isNative: false,
  },
  "arc-native": {
    symbol: "ARC",
    name: "Arc Network Native Gas Token",
    decimals: 18,
    contractAddress: "native",
    logoUrl: "https://cryptologos.cc/logos/aragon-ant-logo.png", // Mock ARC logo
    isNative: true,
  },
  "0x89b50855aa3be2f677cd6303cec089b5f319d72a": {
    symbol: "EURC",
    name: "Euro Coin",
    decimals: 6,
    contractAddress: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    isNative: false,
  },
  "0xe9185f0c5f296ed1797aae4238d26ccabeadb86c": {
    symbol: "USYC",
    name: "Yield-bearing USDC",
    decimals: 6,
    contractAddress: "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C",
    isNative: false,
  },
  "0x07f1ea50e30d47376c0dfb3eb853fd40e3a8907a": {
    symbol: "cirBTC",
    name: "Circle Bitcoin",
    decimals: 8,
    contractAddress: "0x07f1ea50e30d47376c0dfb3eb853fd40e3a8907a",
    logoUrl: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
    isNative: false,
  },
};

export const syncTokenWithArcScan = (
  contractAddress: string | undefined,
  originalSymbol: string,
): ArcTokenMetadata | null => {
  if (!contractAddress && originalSymbol !== "ARC") return null;

  if (contractAddress) {
    const key = contractAddress.toLowerCase();
    if (ARC_TOKEN_REGISTRY[key]) {
      return ARC_TOKEN_REGISTRY[key];
    }
  }

  if (originalSymbol === "ARC" || contractAddress === "native") {
    return ARC_TOKEN_REGISTRY["arc-native"];
  }

  return null; // Not found in trusted registry
};
