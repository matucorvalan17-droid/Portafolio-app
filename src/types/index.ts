// WealthTrack — TypeScript Types
// This file defines the shapes of all your data objects.
// You don't need to edit this unless you add new database fields.

// ─── DATABASE MODELS ─────────────────────────────────────────────────────────

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  image?: string | null;
  userId: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  holdings?: Holding[];
}

export interface Holding {
  id: string;
  portfolioId: string;
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  purchaseDate?: string | null;
  broker?: string | null;
  assetType: AssetType;
  currency: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  portfolioId: string;
  ticker: string;
  name: string;
  type: TransactionType;
  shares: number;
  price: number;
  total: number;
  fee: number;
  date: string;
  broker?: string | null;
  notes?: string | null;
  createdAt: string;
  portfolio?: Portfolio;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  ticker: string;
  name: string;
  notes?: string | null;
  alertPrice?: number | null;
  createdAt: string;
}

// ─── ENUMS ───────────────────────────────────────────────────────────────────

export type AssetType = 'stock' | 'etf' | 'crypto' | 'fund' | 'other';
export type TransactionType = 'buy' | 'sell' | 'dividend';

// ─── MARKET DATA (from Yahoo Finance) ────────────────────────────────────────

export interface Quote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  name: string;
  marketCap?: number;
  volume?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  score?: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  change?: number;
}

export interface AllocationDataPoint {
  name: string;
  value: number;
  percentage: number;
  color: string;
  ticker: string;
}

// ─── COMPUTED STATS ──────────────────────────────────────────────────────────

export interface HoldingWithQuote extends Holding {
  currentPrice?: number;
  currentValue?: number;
  gainLoss?: number;
  gainLossPercent?: number;
  dayChange?: number;
  dayChangePercent?: number;
  allocation?: number;
  quote?: Quote;
}

export interface PortfolioWithStats extends Portfolio {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  holdingsCount: number;
}

export interface CSVHolding {
  ticker: string;
  shares: number;
  avgCost: number;
  broker?: string;
  name?: string;
  assetType?: string;
}

// ─── NEXTAUTH TYPE EXTENSIONS ─────────────────────────────────────────────────

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
    };
  }
  interface User {
    id: string;
    email: string;
    name: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}
