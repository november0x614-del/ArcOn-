import { AppKit, BridgeChain } from "@circle-fin/app-kit";
import { createCircleWalletsAdapter } from "@circle-fin/adapter-circle-wallets";

let appKitInstance: AppKit | null = null;

/**
 * Initializes the Server-Side App Kit using Developer Controlled Wallets.
 */
export const getAppKit = () => {
  if (appKitInstance) return appKitInstance;

  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

  if (!apiKey || !entitySecret) {
    throw new Error("Missing Circle API keys for AppKit");
  }

  const adapter = createCircleWalletsAdapter({
    apiKey,
    entitySecret,
    walletSetId: process.env.CIRCLE_WALLET_SET_ID || "not-set"
  });

  appKitInstance = new AppKit({
    adapter,
  });

  return appKitInstance;
};

/**
 * Executes an AppKit transfer (Send).
 */
export async function executeAppKitSend(
  walletId: string,
  amount: number,
  destinationAddress: string
) {
  const appKit = getAppKit();
  const txHash = await appKit.send({
    account: walletId, 
    amount: amount.toString(),
    destination: destinationAddress,
    token: "USDC", // using alias
  });
  return txHash;
}

/**
 * Executes an AppKit Bridge.
 */
export async function executeAppKitBridge(
  walletId: string,
  amount: number,
  destinationAddress: string,
  targetChain: BridgeChain 
) {
  const appKit = getAppKit();
  const txHash = await appKit.bridge({
    account: walletId,
    amount: amount.toString(),
    destination: destinationAddress,
    destinationChain: targetChain,
    token: "USDC",
  });
  return txHash;
}

/**
 * Executes an AppKit Swap.
 */
export async function executeAppKitSwap(
  walletId: string,
  amount: number,
  fromToken: string,
  toToken: string
) {
  const appKit = getAppKit();
  
  // Note: Swap via AppKit uses Dex routers implicitly based on supported chains.
  // On Arc Testnet, Swap is supported for USDC, EURC, and cirBTC.
  const txHash = await appKit.swap({
    account: walletId,
    amount: amount.toString(),
    tokenIn: fromToken,
    tokenOut: toToken,
  });
  return txHash;
}
