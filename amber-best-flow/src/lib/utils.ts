import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Truncates a number to specified decimal places without rounding
 * @param num - Number to truncate
 * @param decimals - Number of decimal places
 * @returns Truncated number
 */
function truncateToDecimals(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.floor(num * factor) / factor;
}

/**
 * Formats a truncated number to string with fixed decimal places
 * @param num - Number to format
 * @param decimals - Number of decimal places
 * @returns Formatted string with trailing zeros if needed
 */
function formatTruncated(num: number, decimals: number): string {
  const truncated = truncateToDecimals(num, decimals);
  return truncated.toFixed(decimals);
}

/**
 * Formats currency value in lakhs or crores
 * @param value - Value in lakhs
 * @param decimals - Number of decimal places (default: 1)
 * @param format - 'lakhs' or 'crores' (default: 'lakhs')
 * @returns Formatted string: ₹X.XL or ₹X.XCr (exact value, no rounding)
 */
export function formatCurrency(value: number, decimals: number = 1, format: 'lakhs' | 'crores' = 'lakhs'): string {
  if (format === 'crores') {
    const crores = value / 100;
    // Always show 2 decimal places for crores (truncated, not rounded)
    return `₹${formatTruncated(crores, 2)}Cr`;
  }
  // For lakhs: if value is less than 1 crore (100L), show with 2 decimals
  // If value is >= 1 crore, still show in lakhs but with decimals
  if (value < 100) {
    // Less than 1 crore, show with 2 decimals when in lakhs format (truncated, not rounded)
    return `₹${formatTruncated(value, 2)}L`;
  }
  // 1 crore or more, still show in lakhs with decimals (truncated, not rounded)
  return `₹${formatTruncated(value, decimals)}L`;
}

/**
 * Formats a date string to a readable format
 * @param dateString - ISO date string or date string
 * @param format - 'short' (Nov 20, 2025) or 'long' (November 20, 2025) (default: 'short')
 * @returns Formatted date string
 */
export function formatDate(dateString: string | undefined | null, format: 'short' | 'long' = 'short'): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    if (format === 'long') {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    return 'Invalid Date';
  }
}