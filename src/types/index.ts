export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Portfolio {
  id: string;
  name: string;
  userId: string;
  currency: string;
  createdAt: Date;
  holdings?: Holding[];
}

export interface Holding {
  id: string;
  portfolioId: string;
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  broker?: string | null;
  assetType: string;
  currency: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  name: string;
  marketCap?: number;
  volume?: number;
}

export interface HoldingWithQuote extends Holding {
  currentPrice?: number;
  currentValue?: number;
  gainLoss?: number;
  gainLossPercent?: number;
  quote?: Quote;
}

export interface PortfolioWithStats extends Portfolio {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  holdingsCount: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  score?: number;
}

export interface CSVHolding {
  ticker: string;
  shares: number;
  avgCost: number;
  broker?: string;
  name?: string;
  assetType?: string;
}

export type AssetType = 'stock' | 'crypto' | 'etf' | 'fund';

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

export interface DashboardStats {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  portfolios: PortfolioWithStats[];
}

// NextAuth type extensions
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
