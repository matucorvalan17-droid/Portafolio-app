import type { Quote, SearchResult, ChartDataPoint } from '@/types';

const YF = 'https://query1.finance.yahoo.com';
const YF2 = 'https://query2.finance.yahoo.com';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept: 'application/json',
};

async function chartFetch(ticker: string): Promise<Quote | null> {
  try {
    const url = `${YF}/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 30 } });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice ?? 0;
    if (!price) return null;
    return {
      ticker,
      price,
      change: meta.regularMarketChange ?? 0,
      changePercent: meta.regularMarketChangePercent ?? 0,
      currency: meta.currency ?? 'USD',
      name: meta.longName ?? meta.shortName ?? ticker,
    };
  } catch {
    return null;
  }
}

export async function getQuotes(tickers: string[]): Promise<Record<string, Quote>> {
  if (!tickers.length) return {};

  const settled = await Promise.allSettled(tickers.map((t) => chartFetch(t)));
  const results: Record<string, Quote> = {};
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value) {
      results[tickers[i]] = r.value;
    }
  });
  return results;
}

export async function getQuote(ticker: string): Promise<Quote | null> {
  return chartFetch(ticker);
}

export async function searchTickers(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 1) return [];
  try {
    const url = `${YF2}/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&enableFuzzyQuery=false`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];
    const json = await res.json();
    const quotes: SearchResult[] = [];
    for (const item of json?.quotes ?? []) {
      if (item.symbol) {
        quotes.push({
          symbol: item.symbol,
          name: item.longname ?? item.shortname ?? item.symbol,
          exchange: item.exchDisp ?? item.exchange ?? '',
          type: mapType(item.quoteType ?? item.typeDisp ?? ''),
        });
      }
    }
    return quotes.slice(0, 10);
  } catch {
    return [];
  }
}

function mapType(t: string): string {
  const s = t.toLowerCase();
  if (s.includes('etf')) return 'etf';
  if (s.includes('mutual') || s.includes('fund')) return 'fund';
  if (s.includes('crypto') || s.includes('currency')) return 'crypto';
  return 'stock';
}

export async function getHistoricalData(
  ticker: string,
  period: '1mo' | '3mo' | '6mo' | '1y' = '3mo',
): Promise<ChartDataPoint[]> {
  try {
    const end = Math.floor(Date.now() / 1000);
    const daysMap = { '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365 };
    const start = end - daysMap[period] * 86400;
    const url = `${YF}/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&period1=${start}&period2=${end}`;
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return [];
    const timestamps: number[] = result.timestamp ?? [];
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
    return timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      value: closes[i] ?? 0,
    })).filter((p) => p.value > 0);
  } catch {
    return [];
  }
}
