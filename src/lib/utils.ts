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
    case 'stock':
      return '#6366f1';
    case 'crypto':
      return '#f59e0b';
    case 'etf':
      return '#22c55e';
    case 'fund':
      return '#8b5cf6';
    default:
      return '#8888a8';
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

export const ALLOCATION_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#a78bfa',
  '#22c55e',
  '#16a34a',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
  '#0891b2',
  '#14b8a6',
];

export function debounce<T extends (...args: unknown[]) => unknown>(
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
