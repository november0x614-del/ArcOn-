import { AppKit, BridgeChain } from "@circle-fin/app-kit";
import { createCircleWalletsAdapter, CircleWalletsAdapter } from "@circle-fin/adapter-circle-wallets";
import * as crypto from "crypto";
import { getSupabaseAdmin } from "../config/supabase.js";

let appKitInstance: AppKit | null = null;
let appKitAdapter: CircleWalletsAdapter | null = null;

/**
 * Fetches the active Gas Fee Strategy from the database settings.
 */
async function getGasFeeStrategy(): Promise<"SPONSORED" | "USER_PAID_USDC"> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "GAS_FEE_STRATEGY")
      .maybeSingle();
    return (data?.value as any) || "SPONSORED";
  } catch (err) {
    console.error("[AppKit Service] Failed to fetch gas strategy:", err);
    return "SPONSORED";
  }
}

/**
 * Helper to build the AppKit fee config based on the database GAS_FEE_STRATEGY.
 */
async function getAppKitFeeConfig(): Promise<any> {
  const strategy = await getGasFeeStrategy();
  if (strategy === "SPONSORED") {
    return {
      type: "SPONSORED"
    };
  }
  return {
    type: "level",
    config: {
      feeLevel: "MEDIUM"
    }
  };
}

/**
 * Initializes the Server-Side App Kit using Developer Controlled Wallets.
 */
export const getAppKit = () => {
  if (appKitInstance) return { appKit: appKitInstance, adapter: appKitAdapter! };

  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
  const kitKey = process.env.KIT_KEY;

  if (!apiKey || !entitySecret) {
    throw new Error("Missing Circle API keys for AppKit");
  }

  if (!kitKey) {
    throw new Error("Missing KIT_KEY in environment variables. Expected format: KIT_KEY:<keyId>:<keySecret>");
  }

  const adapter = createCircleWalletsAdapter({
    apiKey,
    entitySecret,
    // @ts-ignore
    walletSetId: process.env.CIRCLE_WALLET_SET_ID || "not-set"
  } as any);
  
  appKitAdapter = adapter;
 
  appKitInstance = new AppKit({
    kitKey,
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
  const kitKey = process.env.KIT_KEY;
  const fee = await getAppKitFeeConfig();

  const txHash = await appKit.send({
    from: {
      adapter,
      chain: "Arc_Testnet",
      address: walletAddress
    },
    to: destinationAddress,
    amount: amount.toString(),
    token: "USDC",
    fee,
    config: {
      kitKey
    }
  } as any);
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
  const kitKey = process.env.KIT_KEY;
  const fee = await getAppKitFeeConfig();
  
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
    fee,
    config: {
      kitKey
    }
  } as any);
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
  const kitKey = process.env.KIT_KEY;
  const fee = await getAppKitFeeConfig();
  
  const txHash = await appKit.swap({
    from: {
      adapter,
      chain: "Arc_Testnet",
      address: walletAddress
    },
    amountIn: amount.toString(),
    tokenIn: fromToken,
    tokenOut: toToken,
    fee,
    config: {
      kitKey
    }
  } as any);
  return txHash;
}
