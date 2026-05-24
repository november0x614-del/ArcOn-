import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges tailwind classes using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Truncates a wallet address or account number
 * @param address The address to truncate
 * @param startLength Number of characters to keep at the start
 * @param endLength Number of characters to keep at the end
 */
export function truncateAddress(address: string, startLength = 6, endLength = 4) {
  if (!address) return '';
  if (address.length <= startLength + endLength) return address;
  return `${address.substring(0, startLength)}...${address.substring(
    address.length - endLength
  )}`;
}

/**
 * Formats a number as currency
 * @param value The value to format
 * @param currency The currency symbol or code (default: 'USDC')
 * @param decimals Number of decimal places
 */
export function formatCurrency(value: number | string, currency = 'USDC', decimals = 2) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return `0.00 ${currency}`;
  
  return `${num.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${currency}`;
}

/**
 * Formats a date string into a readable format
 */
export function formatDate(dateStr: string | Date) {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
