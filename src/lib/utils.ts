import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  currency: string = 'USD',
  compact: boolean = false
): string {
  if (compact && Math.abs(value) >= 1000000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(value);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals: number = 4): string {
  if (Math.abs(value) >= 1000000) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatShares(value: number): string {
  if (value >= 1000) {
    return formatNumber(value, 2);
  }
  if (value < 0.001) {
    return value.toFixed(8);
  }
  return value.toFixed(4).replace(/\.?0+$/, '');
}

export function getAssetTypeColor(assetType: string): string {
  switch (assetType.toLowerCase()) {
    case 'stock':  return '#00e676';
    case 'crypto': return '#ffb300';
    case 'etf':    return '#00bfa5';
    case 'fund':   return '#64b5f6';
    default:       return '#555555';
  }
}

export function getAssetTypeLabel(assetType: string): string {
  switch (assetType.toLowerCase()) {
    case 'stock':
      return 'Stock';
    case 'crypto':
      return 'Crypto';
    case 'etf':
      return 'ETF';
    case 'fund':
      return 'Fund';
    default:
      return assetType;
  }
}

// Allocation chart palette — vivid on dark backgrounds, green-anchored
export const ALLOCATION_COLORS = [
  '#00e676', // electric green  (brand)
  '#00b0ff', // bright blue
  '#ffb300', // gold / amber
  '#f06292', // hot pink
  '#4db6ac', // teal
  '#aed581', // light lime
  '#ff8a65', // coral
  '#ce93d8', // lavender
  '#4fc3f7', // sky blue
  '#ffcc02', // yellow
  '#69f0ae', // mint green
  '#ff6e40', // deep orange
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
