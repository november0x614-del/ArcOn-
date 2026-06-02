import { AppKit, BridgeChain } from "@circle-fin/app-kit";
import {
  createCircleWalletsAdapter,
  CircleWalletsAdapter,
} from "@circle-fin/adapter-circle-wallets";

let appKitInstance: AppKit | null = null;
let appKitAdapter: CircleWalletsAdapter | null = null;

const getValidKitKey = () => {
  let kitKey = process.env.KIT_KEY || process.env.VITE_KIT_KEY || null;
  if (!kitKey) return null;

  // Clean up if double-pasted or contains redundant prefixes
  // Expected format: KIT_KEY:<id>:<secret>
  if (kitKey.includes("KIT_KEY:") && (kitKey.match(/KIT_KEY:/g) || []).length > 1) {
    const parts = kitKey.split("KIT_KEY:").filter(p => !!p.trim());
    if (parts.length > 0) {
      const segmentParts = parts[0].split(':').filter(p => !!p.trim());
      if (segmentParts.length >= 2) {
        return `KIT_KEY:${segmentParts[0]}:${segmentParts[1]}`;
      }
    }
  }
  return kitKey;
}

const NATIVE_USDC_ARC = "0x3600000000000000000000000000000000000000";

const normalizeToken = (token: any) => {
  if (!token) return "USDC";
  let addressOrSymbol = typeof token === 'object' ? (token.contractAddress || token.symbol) : token;
  
  if (typeof addressOrSymbol === 'string') {
    if (addressOrSymbol.toLowerCase() === NATIVE_USDC_ARC.toLowerCase()) {
      return "USDC";
    }
  }
  return addressOrSymbol;
};

/**
 * Initializes the Server-Side App Kit using Developer Controlled Wallets.
 */
export const getAppKit = async () => {
  if (appKitInstance)
    return { appKit: appKitInstance, adapter: appKitAdapter! };

  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

  const kitKey = getValidKitKey();

  const { resolveWalletSetId } = await import("./circleClient");
  const walletSetId = await resolveWalletSetId();

  if (!apiKey || !entitySecret || !kitKey || !walletSetId) {
    throw new Error(
      "Missing Circle Configurations. Ensure CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET, KIT_KEY, and CIRCLE_WALLET_SET_ID are set in environment variables."
    );
  }

  const adapter = createCircleWalletsAdapter({
    apiKey,
    entitySecret,
    // @ts-ignore
    walletSetId: walletSetId,
  } as any);

  appKitAdapter = adapter;

  appKitInstance = new AppKit({
    // @ts-ignore
    adapter,
  } as any);

  return { appKit: appKitInstance, adapter };
};

/**
 * Executes an AppKit transfer (Send).
 */
export async function executeAppKitSend(
  walletAddress: string,
  amount: number,
  destinationAddress: string,
) {
  const { appKit, adapter } = await getAppKit();
  const kitKey = getValidKitKey();
  
  const result = await appKit.send({
    from: {
      adapter,
      chain: "Arc_Testnet",
      address: walletAddress,
    },
    to: destinationAddress,
    amount: amount.toString(),
    token: normalizeToken("USDC"),
    config: {
      kitKey: kitKey as string,
    }
  } as any);
  return result.txHash;
}

/**
 * Executes an AppKit Bridge.
 */
export async function executeAppKitBridge(
  walletAddress: string,
  amount: number,
  destinationAddress: string,
  targetChain: any,
) {
  const { appKit, adapter } = await getAppKit();
  const kitKey = getValidKitKey();

  const result = await appKit.bridge({
    from: {
      adapter,
      chain: "Arc_Testnet",
      address: walletAddress,
    },
    to: {
      chain: targetChain,
      recipientAddress: destinationAddress,
      useForwarder: true, // Forwarder will mint implicitly if no destination adapter
    },
    amount: amount.toString(),
    token: normalizeToken("USDC"),
    config: {
      kitKey: kitKey as string,
    }
  } as any);
  return result.steps?.find((s: any) => s.txHash)?.txHash || "bridge-successful";
}

/**
 * Executes an AppKit Swap.
 */
export async function executeAppKitSwap(
  walletAddress: string,
  amount: number,
  fromToken: any,
  toToken: any,
) {
  const { appKit, adapter } = await getAppKit();
  const kitKey = getValidKitKey();

  const result = await appKit.swap({
    from: {
      adapter,
      chain: "Arc_Testnet",
      address: walletAddress,
    },
    amountIn: amount.toString(),
    tokenIn: normalizeToken(fromToken),
    tokenOut: normalizeToken(toToken),
    config: {
      kitKey: kitKey as string,
    }
  } as any);
  return result.txHash;
}
