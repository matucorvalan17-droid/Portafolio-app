import yahooFinance from 'yahoo-finance2';
import type { Quote, SearchResult, ChartDataPoint } from '@/types';

// Suppress yahoo-finance2 validation notices
yahooFinance.setGlobalConfig({
  validation: {
    logErrors: false,
    logOptionsErrors: false,
  },
});

export async function getQuotes(tickers: string[]): Promise<Record<string, Quote>> {
  if (!tickers.length) return {};

  const results: Record<string, Quote> = {};

  await Promise.allSettled(
    tickers.map(async (ticker) => {
      try {
        const quote = await yahooFinance.quote(ticker, {}, { validateResult: false });
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
        // If we can't get a quote, skip it silently
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
    const quote = await yahooFinance.quote(ticker, {}, { validateResult: false });
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
    const searchResults = await yahooFinance.search(query, {}, { validateResult: false });

    const results: SearchResult[] = [];

    if (searchResults.quotes) {
      for (const item of searchResults.quotes) {
        if (item.symbol && item.quoteType !== 'OPTION' && item.quoteType !== 'CURRENCY') {
          results.push({
            symbol: item.symbol,
            name: item.longname ?? item.shortname ?? item.symbol,
            exchange: item.exchDisp ?? item.exchange ?? '',
            type: mapQuoteType(item.quoteType ?? ''),
            score: item.score,
          });
        }
      }
    }

    return results.slice(0, 10);
  } catch {
    return [];
  }
}

function mapQuoteType(quoteType: string): string {
  switch (quoteType.toUpperCase()) {
    case 'EQUITY':
      return 'stock';
    case 'ETF':
      return 'etf';
    case 'MUTUALFUND':
      return 'fund';
    case 'CRYPTOCURRENCY':
      return 'crypto';
    default:
      return 'stock';
  }
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

    const historical = await yahooFinance.historical(
      ticker,
      {
        period1: startDate.toISOString().split('T')[0],
        period2: endDate.toISOString().split('T')[0],
        interval: '1d',
      },
      { validateResult: false }
    );

    return historical.map((item) => ({
      date: item.date.toISOString().split('T')[0],
      value: item.close ?? item.adjClose ?? 0,
    }));
  } catch {
    return [];
  }
}
