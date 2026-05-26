import { formatUnits, parseUnits } from 'viem';

/**
 * Arc Specific Utilities
 * Handles the unique "Dual USDC Interface" of the Arc Network.
 */

export const ARC_USDC_NATIVE_DECIMALS = 18;
export const ARC_USDC_ERC20_DECIMALS = 6;

/**
 * Converts native Arc USDC balance (18 decimals) to a human-readable string.
 */
export function formatArcNativeBalance(balance: bigint): string {
  return formatUnits(balance, ARC_USDC_NATIVE_DECIMALS);
}

/**
 * Converts ERC20 Arc USDC balance (6 decimals) to a human-readable string.
 */
export function formatArcERC20Balance(balance: bigint): string {
  return formatUnits(balance, ARC_USDC_ERC20_DECIMALS);
}

/**
 * Normalizes a balance string to 18 decimals for storage or comparison.
 */
export function normalizeToArcNative(amount: string, fromDecimals: number = ARC_USDC_ERC20_DECIMALS): bigint {
  const parsed = parseUnits(amount, fromDecimals);
  if (fromDecimals === ARC_USDC_ERC20_DECIMALS) {
    // 6 -> 18: multiply by 10^12
    return parsed * BigInt(10 ** 12);
  }
  return parsed;
}

/**
 * Checks if a transaction is finalized on Arc (1 confirmation).
 */
export function isArcFinalized(confirmations: number): boolean {
  return confirmations >= 1;
}
