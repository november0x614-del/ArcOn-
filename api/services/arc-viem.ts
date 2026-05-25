import { createPublicClient, createWalletClient, http, formatUnits, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const ARC_RPC_URL = process.env.VITE_ARC_RPC_URL || "https://rpc.testnet.arc.network";
// Based on Arc docs, USDC acts as GAS native token
// But it also exists as an ERC-20 token for full compatibility. 
// However, Arc's native gas balance is 18 decimals and ERC20 is 6 decimals.
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000"; 

export const publicClient = createPublicClient({
  transport: http(ARC_RPC_URL)
});

export function getBackendWallet() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) return null;
  const account = privateKeyToAccount(pk.startsWith('0x') ? pk as `0x${string}` : `0x${pk}`);
  
  const walletClient = createWalletClient({
    account,
    transport: http(ARC_RPC_URL)
  });
  
  return { account, walletClient };
}

export async function getArcBalances(address: string) {
  try {
    // Read native balance (USDC as gas, 18 decimals)
    const nativeBalance = await publicClient.getBalance({ address: address as `0x${string}` });
    
    // Read ERC20 USDC balance (6 decimals)
    const usdcErc20Balance = await (publicClient as any).readContract({
      address: USDC_ADDRESS,
      abi: [{
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: 'balance', type: 'uint256' }]
      }],
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    }) as bigint;

    return {
      nativeArcUsdc: formatUnits(nativeBalance, 18),
      erc20Usdc: formatUnits(usdcErc20Balance, 6)
    };
  } catch (error) {
    console.error("Failed to read arc balances on-chain:", error);
    return { nativeArcUsdc: "0", erc20Usdc: "0" };
  }
}

export async function sendArcTransaction(destination: string, amountBase: string) {
  const wallet = getBackendWallet();
  if (!wallet) throw new Error("No backend private key configured for real-time EVM transactions.");
  
  // We send native USDC on Arc Testnet
  const amountToWei = parseUnits(amountBase, 18); // Native transfer uses 18 decimals
  
  const hash = await (wallet.walletClient as any).sendTransaction({
    to: destination as `0x${string}`,
    value: amountToWei
  });
  
  // Await 1 confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  return {
    txId: receipt.transactionHash,
    status: receipt.status
  };
}
