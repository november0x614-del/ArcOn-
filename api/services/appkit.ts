import { AppKit, BridgeChain } from "@circle-fin/app-kit";
import { createCircleWalletsAdapter, CircleWalletsAdapter } from "@circle-fin/adapter-circle-wallets";

let appKitInstance: AppKit | null = null;
let appKitAdapter: CircleWalletsAdapter | null = null;

/**
 * Initializes the Server-Side App Kit using Developer Controlled Wallets.
 */
export const getAppKit = () => {
  if (appKitInstance) return { appKit: appKitInstance, adapter: appKitAdapter! };

  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

  if (!apiKey || !entitySecret) {
    throw new Error("Missing Circle API keys for AppKit");
  }

  const adapter = createCircleWalletsAdapter({
    apiKey,
    entitySecret,
    // @ts-ignore
    walletSetId: process.env.CIRCLE_WALLET_SET_ID || "not-set"
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
  destinationAddress: string
) {
  const { appKit, adapter } = getAppKit();
  const txHash = await appKit.send({
    from: {
      adapter,
      chain: "Arc_Testnet",
      address: walletAddress
    },
    to: destinationAddress,
    amount: amount.toString(),
    token: "USDC"
  });
  return txHash;
}

/**
 * Executes an AppKit Bridge.
 */
export async function executeAppKitBridge(
  walletAddress: string,
  amount: number,
  destinationAddress: string,
  targetChain: any 
) {
  const { appKit, adapter } = getAppKit();
  
  const txHash = await appKit.bridge({
    from: {
      adapter,
      chain: "Arc_Testnet",
      address: walletAddress
    },
    to: {
      chain: targetChain,
      recipientAddress: destinationAddress,
      useForwarder: true // Forwarder will mint implicitly if no destination adapter
    },
    amount: amount.toString(),
    token: "USDC",
  });
  return txHash;
}

/**
 * Executes an AppKit Swap.
 */
export async function executeAppKitSwap(
  walletAddress: string,
  amount: number,
  fromToken: any,
  toToken: any
) {
  const { appKit, adapter } = getAppKit();
  
  const txHash = await appKit.swap({
    from: {
      adapter,
      chain: "Arc_Testnet",
      address: walletAddress
    },
    amountIn: amount.toString(),
    tokenIn: fromToken,
    tokenOut: toToken,
  } as any);
  return txHash;
}
