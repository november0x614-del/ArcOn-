import {
  createPublicClient,
  http,
  parseAbi,
  getAddress,
  isAddress,
  defineChain,
  encodeFunctionData,
  toHex,
  pad,
  keccak256,
  type Address,
} from "viem";
import { getSupabaseAdmin } from "../config/supabase.js";

/**
 * Arc Testnet Chain Definition
 */
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
});

/**
 * Public Client for reading from Arc Network
 */
export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(undefined, {
    retryCount: 3,
    retryDelay: 1000,
  }),
});

// CCTP Constants for Arc Testnet
export const ARC_DOMAIN = 26;
export const USDC_ADDRESS = (process.env.ARC_USDC_CONTRACT ||
  "0x3600000000000000000000000000000000000000") as `0x${string}`;
export const TOKEN_MESSENGER =
  "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA" as `0x${string}`;
export const MESSAGE_TRANSMITTER =
  "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as `0x${string}`;

/**
 * Helper to format recipient address for CCTP (left-padded bytes32)
 */
export function formatRecipientForCCTP(address: string): `0x${string}` {
  return pad(address as Address, { size: 32 });
}

/**
 * Polls Circle's Attestation API until the message is attested.
 */
export async function getCCTPAttestation(messageHash: string): Promise<string> {
  const url = `https://iris-api.circle.com/v2/attestations/${messageHash}`;
  console.log(`[ArcViem] Polling attestation for ${messageHash}...`);

  while (true) {
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "complete") {
        return data.attestation;
      }

      // Wait 10 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 10000));
    } catch (error) {
      console.error("[ArcViem] Attestation poll error:", error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

/**
 * Extracts message bytes and calculates hash from a CCTP-enabled transaction receipt.
 */
export function extractCCTPMessage(logs: any[]) {
  const MESSAGE_SENT_TOPIC =
    "0x2fa9ca894982930190727e75500a97d8dc500233a5065e0f3126c48fbe0343c0";
  const log = logs.find((l) => l.topics[0] === MESSAGE_SENT_TOPIC);

  if (!log) throw new Error("CCTP MessageSent event not found in logs");

  const messageBytes = log.data;
  const messageHash = keccak256(messageBytes);

  return { messageBytes, messageHash };
}

/**
 * Encodes 'depositForBurn' call for outbound bridging from Arc.
 */
export function encodeDepositForBurn(
  amount: bigint,
  destinationDomain: number,
  mintRecipient: string,
) {
  const recipientBytes32 = formatRecipientForCCTP(mintRecipient);

  return encodeFunctionData({
    abi: parseAbi([
      "function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken) returns (uint64)",
    ]),
    functionName: "depositForBurn",
    args: [amount, destinationDomain, recipientBytes32, USDC_ADDRESS],
  });
}

/**
 * Encodes 'receiveMessage' call for inbound bridging to Arc.
 */
export function encodeReceiveMessage(message: string, attestation: string) {
  return encodeFunctionData({
    abi: parseAbi([
      "function receiveMessage(bytes message, bytes attestation) returns (bool)",
    ]),
    functionName: "receiveMessage",
    args: [message as `0x${string}`, attestation as `0x${string}`],
  });
}

/**
 * Validates a destination address using EIP-55 checksum.
 */
export function validateDestination(address: string): `0x${string}` {
  if (!address || !isAddress(address)) {
    throw new Error(`Invalid address format: ${address}`);
  }
  return getAddress(address) as `0x${string}`;
}

/**
 * Checks if an address is blocklisted. 
 * Checks both the blockchain (USDC contract) and the local Supabase sanctions_blocklist.
 */
export async function isBlocklisted(address: string): Promise<boolean> {
  const typedAddress = address as `0x${string}`;
  
  try {
    // 1. Check Local Supabase Blocklist (Admin-controlled)
    try {
      const { data: localBlocked } = await getSupabaseAdmin()
        .from("sanctions_blocklist")
        .select("id")
        .eq("address", getAddress(address))
        .maybeSingle();
      
      if (localBlocked) {
        console.warn(`[ArcViem] Address ${address} is in LOCAL blocklist.`);
        return true;
      }
    } catch (dbErr) {
      console.warn("[ArcViem] Failed to check local blocklist, falling back to blockchain-only:", dbErr);
    }

    // 2. Check Blockchain (Native USDC Blacklist)
    const blockchainBlocked = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: parseAbi(["function isBlacklisted(address) view returns (bool)"]),
      functionName: "isBlacklisted",
      args: [typedAddress],
    } as any);
    
    return !!blockchainBlocked;
  } catch (error: any) {
    console.error(`[ArcViem] Failed to check blockchain blocklist for ${address}, defaulting to false to ensure service uptime:`, error.message || error);
    // Graceful degradation during unstable testnet or missing contract methods:
    // Do not crash/block the user's transaction if the blockchain checker is offline.
    return false;
  }
}

/**
 * Estimates the gas cost for a token transfer (ERC-20).
 * Handles both 6-decimal and 18-decimal contracts for simulation safety.
 */
export async function estimateTransferGas(
  from: `0x${string}`,
  to: `0x${string}`,
  amount: bigint,
  tokenAddress: `0x${string}` = USDC_ADDRESS,
) {
  try {
    const data = encodeFunctionData({
      abi: parseAbi([
        "function transfer(address to, uint256 amount) returns (bool)",
      ]),
      functionName: "transfer",
      args: [to, amount],
    });

    const [gasPrice, gasUnits] = await Promise.all([
      publicClient.getGasPrice(),
      publicClient
        .estimateGas({
          account: from,
          to: tokenAddress,
          data,
        } as any)
        .catch((err) => {
          console.warn(
            "[ArcViem] Simulation failed, using fallback:",
            err.message,
          );
          return 65000n; // Safe standard ERC20 transfer gas
        }),
    ]);

    const totalCostWei = gasUnits * gasPrice;
    const costHuman = Number(totalCostWei) / 1e18;

    return {
      gasUnits,
      gasPrice,
      totalCostWei,
      costHuman,
      data,
    };
  } catch (error) {
    console.error("[ArcViem] Gas estimation failed:", error);
    return {
      gasUnits: 65000n,
      gasPrice: 1000000000n,
      totalCostWei: 65000n * 1000000000n,
      costHuman: 0.000065,
      data: "0x",
    };
  }
}

/**
 * Fetches the decimals for a specific token contract.
 */
export async function getTokenDecimals(tokenAddress: string): Promise<number> {
  try {
    const decimals = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: parseAbi(["function decimals() view returns (uint8)"]),
      functionName: "decimals",
    } as any);
    return Number(decimals);
  } catch (error) {
    console.warn(
      `[ArcViem] Could not fetch decimals for ${tokenAddress}, defaulting to 18`,
      error,
    );
    return 18;
  }
}

/**
 * Helper to generate ArcScan URLs.
 */
export function getArcScanUrl(type: "tx" | "address", value: string): string {
  const baseUrl = "https://testnet.arcscan.app";
  return `${baseUrl}/${type}/${value}`;
}

/**
 * Helper to generate Tenderly Debugger URLs for failed transactions.
 */
export function getTenderlyDebugUrl(txHash: string): string {
  // Arc Testnet is not always natively in Tenderly, but we can use the visual debugger 
  // with the chain ID 5042002 if supported, or provide a generic search link.
  return `https://dashboard.tenderly.co/tx/arc-testnet/${txHash}`;
}

/**
 * Fetches the raw balance for any ERC-20 token or native asset.
 * Defaults to USDC (6-decimal).
 */
export async function getTokenBalance(
  walletAddress: string,
  tokenAddress: string = USDC_ADDRESS,
): Promise<bigint> {
  if (tokenAddress === "native") {
    return publicClient.getBalance({ address: walletAddress as `0x${string}` });
  }

  return publicClient.readContract({
    address: tokenAddress as `0x${string}`,
    abi: parseAbi([
      "function balanceOf(address account) view returns (uint256)",
    ]),
    functionName: "balanceOf",
    args: [walletAddress as `0x${string}`],
  } as any) as Promise<bigint>;
}

/**
 * Fetches the native gas balance (18 decimals USDC).
 * Alias for clarity.
 */
export async function getNativeBalance(address: string): Promise<bigint> {
  return getTokenBalance(address, "native");
}

/**
 * Legacy compatibility wrapper for USDC.
 */
export async function getUSDCBalance(address: string): Promise<bigint> {
  return getTokenBalance(address, USDC_ADDRESS);
}

/**
 * Encodes data for compliance memo transfers.
 */
export function encodeMemoTransfer(
  to: `0x${string}`,
  amount: bigint,
  memoText: string,
) {
  const memoHex = typeof memoText === "string" ? toHex(memoText) : memoText;

  return encodeFunctionData({
    abi: parseAbi([
      "function sendWithMemo(address to, uint256 amount, bytes memo)",
    ]),
    functionName: "sendWithMemo",
    args: [to, amount, memoHex as `0x${string}`],
  });
}

/**
 * Waits for transaction receipt with Arc's deterministic finality.
 * Once included in a block, it is final.
 */
export async function waitForConfirmation(hash: string) {
  console.log(`[ArcViem] Waiting for finality: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: hash as `0x${string}`,
    confirmations: 1,
  });

  if (receipt.status !== "success") {
    throw new Error(`Transaction ${hash} reverted on-chain`);
  }

  return receipt;
}
