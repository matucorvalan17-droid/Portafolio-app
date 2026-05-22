import YahooFinanceClass from 'yahoo-finance2';
import type { Quote, SearchResult, ChartDataPoint } from '@/types';

// Create an instance to use for method calls
const yf = new YahooFinanceClass();

export async function getQuotes(tickers: string[]): Promise<Record<string, Quote>> {
  if (!tickers.length) return {};

  const results: Record<string, Quote> = {};

  await Promise.allSettled(
    tickers.map(async (ticker) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const quote = await (yf as any).quote(ticker);
        if (quote) {
          results[ticker] = {
            ticker,
            price: quote.regularMarketPrice ?? 0,
            change: quote.regularMarketChange ?? 0,
            changePercent: quote.regularMarketChangePercent ?? 0,
            currency: quote.currency ?? 'USD',
            name: quote.longName ?? quote.shortName ?? ticker,
            marketCap: quote.marketCap,
            volume: quote.regularMarketVolume,
          };
        }
      } catch {
        // If we can't get a quote, return zeros
        results[ticker] = {
          ticker,
          price: 0,
          change: 0,
          changePercent: 0,
          currency: 'USD',
          name: ticker,
        };
      }
    })
  );

  return results;
}

export async function getQuote(ticker: string): Promise<Quote | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quote = await (yf as any).quote(ticker);
    if (!quote) return null;

    return {
      ticker,
      price: quote.regularMarketPrice ?? 0,
      change: quote.regularMarketChange ?? 0,
      changePercent: quote.regularMarketChangePercent ?? 0,
      currency: quote.currency ?? 'USD',
      name: quote.longName ?? quote.shortName ?? ticker,
      marketCap: quote.marketCap,
      volume: quote.regularMarketVolume,
    };
  } catch {
    return null;
  }
}

export async function searchTickers(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 1) return [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchResults = await (yf as any).autoc(query);

    const results: SearchResult[] = [];

    if (searchResults?.Result) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const item of searchResults.Result as any[]) {
        if (item.symbol) {
          results.push({
            symbol: item.symbol,
            name: item.name ?? item.symbol,
            exchange: item.exch ?? item.exchDisp ?? '',
            type: mapType(item.typeDisp ?? item.type ?? ''),
          });
        }
      }
    }

    return results.slice(0, 10);
  } catch {
    // Fall back to an empty result on error
    return [];
  }
}

function mapType(typeStr: string): string {
  const t = typeStr.toLowerCase();
  if (t.includes('etf')) return 'etf';
  if (t.includes('mutual') || t.includes('fund')) return 'fund';
  if (t.includes('crypto') || t.includes('currency')) return 'crypto';
  return 'stock';
}

export async function getHistoricalData(
  ticker: string,
  period: '1mo' | '3mo' | '6mo' | '1y' = '3mo'
): Promise<ChartDataPoint[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '1mo':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3mo':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6mo':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const historical: any[] = await (yf as any).historical(ticker, {
      period1: startDate.toISOString().split('T')[0],
      period2: endDate.toISOString().split('T')[0],
      interval: '1d',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (historical || []).map((item: any) => ({
      date: new Date(item.date).toISOString().split('T')[0],
      value: item.close ?? item.adjClose ?? 0,
    }));
  } catch {
    return [];
  }
}
