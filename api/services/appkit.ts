import { AppKit, BridgeChain } from "@circle-fin/app-kit";
import {
  createCircleWalletsAdapter,
  CircleWalletsAdapter,
} from "@circle-fin/adapter-circle-wallets";

let appKitInstance: AppKit | null = null;
let appKitAdapter: CircleWalletsAdapter | null = null;

const getValidKitKey = () => {
  let kitKey = process.env.KIT_KEY || process.env.VITE_KIT_KEY;
  if (kitKey && kitKey.includes("KIT_KEY:") && kitKey.split("KIT_KEY:").length > 2) {
    const parts = kitKey.split("KIT_KEY:").filter((p) => p.trim() !== "");
    if (parts.length > 0) {
      kitKey = "KIT_KEY:" + parts[0].replace(/:$/, "");
    }
  }
  return kitKey;
}

/**
 * Initializes the Server-Side App Kit using Developer Controlled Wallets.
 */
export const getAppKit = () => {
  if (appKitInstance)
    return { appKit: appKitInstance, adapter: appKitAdapter! };

  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

  const kitKey = getValidKitKey();

  if (!apiKey || !entitySecret || !kitKey) {
    throw new Error("Missing Circle API keys or KIT_KEY for AppKit");
  }

  const adapter = createCircleWalletsAdapter({
    apiKey,
    entitySecret,
    // @ts-ignore
    walletSetId: process.env.CIRCLE_WALLET_SET_ID || "not-set",
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
  const { appKit, adapter } = getAppKit();
  const kitKey = getValidKitKey();
  
  const result = await appKit.send({
    from: {
      adapter,
      chain: "Arc_Testnet",
      address: walletAddress,
    },
    to: destinationAddress,
    amount: amount.toString(),
    token: "USDC",
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
  const { appKit, adapter } = getAppKit();
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
    token: "USDC",
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
  const { appKit, adapter } = getAppKit();
  const kitKey = getValidKitKey();

  const result = await appKit.swap({
    from: {
      adapter,
      chain: "Arc_Testnet",
      address: walletAddress,
    },
    amountIn: amount.toString(),
    tokenIn: fromToken,
    tokenOut: toToken,
    config: {
      kitKey: kitKey as string,
    }
  } as any);
  return result.txHash;
}
