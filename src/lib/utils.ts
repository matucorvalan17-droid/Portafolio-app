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

// Allocation chart palette — Revolut-inspired, vivid on dark backgrounds
export const ALLOCATION_COLORS = [
  '#494fdf', // cobalt violet  (brand primary)
  '#00a87e', // accent-teal
  '#ec7e00', // accent-warning / orange
  '#e61e49', // accent-pink
  '#007bc2', // accent-light-blue
  '#7b7ff5', // cobalt-violet light
  '#4fc3f7', // sky blue
  '#428619', // accent-light-green
  '#e23b4a', // accent-danger / red
  '#b09000', // accent-yellow
  '#936d62', // accent-brown / copper
  '#00c896', // teal-bright
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
