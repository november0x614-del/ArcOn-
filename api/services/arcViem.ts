import { createPublicClient, http, parseAbi, getAddress, isAddress, defineChain, encodeFunctionData, toHex, pad, keccak256, type Address } from "viem";

/**
 * Arc Testnet Chain Definition
 */
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network"] },
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
export const USDC_ADDRESS = (process.env.ARC_USDC_CONTRACT || "0x3600000000000000000000000000000000000000") as `0x${string}`;
export const TOKEN_MESSENGER = "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA" as `0x${string}`;
export const MESSAGE_TRANSMITTER = "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as `0x${string}`;

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
  const MESSAGE_SENT_TOPIC = "0x2fa9ca894982930190727e75500a97d8dc500233a5065e0f3126c48fbe0343c0";
  const log = logs.find((l) => l.topics[0] === MESSAGE_SENT_TOPIC);
  
  if (!log) throw new Error("CCTP MessageSent event not found in logs");
  
  const messageBytes = log.data;
  const messageHash = keccak256(messageBytes);
  
  return { messageBytes, messageHash };
}

/**
 * Encodes 'depositForBurn' call for outbound bridging from Arc.
 */
export function encodeDepositForBurn(amount: bigint, destinationDomain: number, mintRecipient: string) {
  const recipientBytes32 = formatRecipientForCCTP(mintRecipient);
  
  return encodeFunctionData({
    abi: parseAbi([
      "function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken) returns (uint64)"
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
      "function receiveMessage(bytes message, bytes attestation) returns (bool)"
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
 * Checks if an address is blocklisted by the Arc Protocol.
 */
export async function isBlocklisted(address: string): Promise<boolean> {
  try {
    const blocked = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: parseAbi(["function isBlacklisted(address) view returns (bool)"]),
      functionName: "isBlacklisted",
      args: [address as `0x${string}`],
    } as any);
    return !!blocked;
  } catch (error) {
    console.error(`[ArcViem] Failed to check blocklist for ${address}:`, error);
    throw new Error(`Could not verify blocklist status for ${address}`);
  }
}

/**
 * Estimates the gas cost for a standard USDC transfer (ERC-20).
 */
export async function estimateTransferGas(from: `0x${string}`, to: `0x${string}`, amount: bigint) {
  try {
    const data = encodeFunctionData({
      abi: parseAbi(["function transfer(address to, uint256 amount) returns (bool)"]),
      functionName: "transfer",
      args: [to, amount],
    });

    const [gasUnits, gasPrice] = await Promise.all([
      publicClient.estimateGas({
        account: from,
        to: USDC_ADDRESS,
        data,
      } as any),
      publicClient.getGasPrice(),
    ]);

    const totalCostWei = gasUnits * gasPrice;
    const costHuman = Number(totalCostWei) / 1e18;

    return {
      gasUnits,
      gasPrice,
      totalCostWei,
      costHuman,
      data
    };
  } catch (error) {
    console.error("[ArcViem] Gas estimation failed:", error);
    throw new Error("Failed to estimate gas for transaction");
  }
}

/**
 * Encodes data for compliance memo transfers.
 */
export function encodeMemoTransfer(to: `0x${string}`, amount: bigint, memoText: string) {
  const memoHex = typeof memoText === 'string' ? toHex(memoText) : memoText;
  
  return encodeFunctionData({
    abi: parseAbi(["function sendWithMemo(address to, uint256 amount, bytes memo)"]),
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
    hash: hash as `0x${string}` 
  });

  if (receipt.status !== "success") {
    throw new Error(`Transaction ${hash} reverted on-chain`);
  }

  return receipt;
}

/**
 * Fetches the raw USDC balance (6 decimals).
 */
export async function getUSDCBalance(address: string): Promise<bigint> {
  return publicClient.readContract({
    address: USDC_ADDRESS,
    abi: parseAbi(["function balanceOf(address account) view returns (uint256)"]),
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  } as any) as Promise<bigint>;
}

/**
 * Fetches the native gas balance (18 decimals USDC).
 */
export async function getNativeBalance(address: string): Promise<bigint> {
  return publicClient.getBalance({ address: address as `0x${string}` });
}
