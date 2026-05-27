import { formatUnits, parseUnits } from "viem";

/**
 * Arc Specific Utilities
 * Handles the unique "Dual USDC Interface" of the Arc Network.
 */

export const ARC_INTERNAL_DECIMALS = 18;
export const ARC_DISPLAY_DECIMALS = 6;
export const ARC_DECIMAL_FACTOR = 10n ** 12n; // Factor between 6 and 18 decimals

/**
 * Converts internal Arc balance (18 decimals) to a human-readable display string (6 decimals).
 */
export function toDisplayAmount(internalAmount: bigint): string {
  return formatUnits(internalAmount, ARC_INTERNAL_DECIMALS);
}

/**
 * Converts a display amount string to internal Arc balance (18 decimals).
 */
export function toInternalAmount(displayAmount: string): bigint {
  return parseUnits(displayAmount, ARC_INTERNAL_DECIMALS);
}

/**
 * Normalizes 6-decimal units to 18-decimal internal balance.
 */
export function normalizeToInternal(units6: bigint): bigint {
  return units6 * ARC_DECIMAL_FACTOR;
}

/**
 * Scales down 18-decimal internal balance to 6-decimal units.
 */
export function toUnits6(internalAmount: bigint): bigint {
  return internalAmount / ARC_DECIMAL_FACTOR;
}

/**
 * Checks if a transaction is finalized on Arc (1 confirmation).
 */
export function isArcFinalized(confirmations: number): boolean {
  return confirmations >= 1;
}
