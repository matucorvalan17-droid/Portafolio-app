'use client';
// WealthTrack — Analytics Page
// Shows portfolio performance charts and detailed breakdowns.
// Charts are built with Recharts and update automatically.

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, TrendingDown, PieChart, Calendar } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/loading';
import { AllocationChart } from '@/components/charts/allocation-chart';
import { PerformanceChartWithPeriod } from '@/components/charts/performance-chart';
import { formatCurrency, formatPercent, getAssetTypeColor, getAssetTypeLabel, ALLOCATION_COLORS } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import type { Portfolio, Holding, Quote } from '@/types';

type HoldingEnriched = Holding & {
  currentPrice: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  dayChangePercent: number;
};

export default function AnalyticsPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [quotes,     setQuotes]     = useState<Record<string, Quote>>({});
  const [loading,    setLoading]    = useState(true);
  const [period,     setPeriod]     = useState<'1mo' | '3mo' | '6mo' | '1y'>('3mo');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portfolios');
      if (!res.ok) return;
      const data: Portfolio[] = await res.json();
      setPortfolios(data);

      const allTickers = Array.from(new Set(data.flatMap((p) => (p.holdings ?? []).map((h) => h.ticker))));
      if (allTickers.length) {
        const priceRes = await fetch(`/api/prices?tickers=${allTickers.join(',')}`);
        if (priceRes.ok) setQuotes(await priceRes.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const allHoldings = portfolios.flatMap((p) => p.holdings ?? []);

  const enriched: HoldingEnriched[] = allHoldings.map((h) => {
    const q            = quotes[h.ticker];
    const currentPrice = q?.price ?? h.avgCost;
    const currentValue = currentPrice * h.shares;
    const costBasis    = h.avgCost * h.shares;
    return {
      ...h,
      currentPrice,
      currentValue,
      gainLoss:        currentValue - costBasis,
      gainLossPercent: costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0,
      dayChangePercent: q?.changePercent ?? 0,
    };
  });

  const totalValue   = enriched.reduce((s, h) => s + h.currentValue, 0);
  const totalCost    = enriched.reduce((s, h) => s + h.avgCost * h.shares, 0);
  const totalGainLoss = totalValue - totalCost;

  // ── Allocation by asset type ──────────────────────────────────
  const byType = enriched.reduce<Record<string, number>>((acc, h) => {
    const t = h.assetType ?? 'stock';
    acc[t] = (acc[t] ?? 0) + h.currentValue;
    return acc;
  }, {});

  const allocationData = Object.entries(byType).map(([type, value], i) => ({
    name:       getAssetTypeLabel(type),
    ticker:     type,
    value,
    percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
    color:      getAssetTypeColor(type),
  }));

  // ── Top performers ────────────────────────────────────────────
  const sorted = [...enriched].sort((a, b) => b.gainLossPercent - a.gainLossPercent);
  const gainers = sorted.filter((h) => h.gainLossPercent >= 0).slice(0, 5);
  const losers  = sorted.filter((h) => h.gainLossPercent <  0).slice(-5).reverse();

  // ── Holdings for bar chart ────────────────────────────────────
  const holdingsBars = enriched
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 10)
    .map((h, i) => ({
      name:  h.ticker,
      value: h.currentValue,
      fill:  ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
    }));

  if (loading) return (
    <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>
  );

  if (allHoldings.length === 0) return (
    <div className="animate-fade-in text-center py-24">
      <div className="w-16 h-16 bg-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <BarChart3 className="w-8 h-8 text-text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">No data to analyze</h3>
      <p className="text-text-secondary text-sm max-w-xs mx-auto">
        Add holdings to your portfolios to see charts and analytics here.
      </p>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
          <p className="text-text-secondary text-sm mt-1">Portfolio performance at a glance</p>
        </div>
        {/* Period Selector */}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-text-muted" />
          {(['1mo', '3mo', '6mo', '1y'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${period === p ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary bg-surface-2 border border-border'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Portfolio Value', value: formatCurrency(totalValue), sub: `${formatCurrency(totalCost)} invested`, color: 'text-text-primary' },
          { label: 'Total Return',    value: formatCurrency(totalGainLoss), sub: formatPercent(totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0), color: totalGainLoss >= 0 ? 'text-gain' : 'text-loss' },
          { label: 'Holdings',        value: String(enriched.length), sub: `across ${portfolios.length} portfolio${portfolios.length !== 1 ? 's' : ''}`, color: 'text-text-primary' },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-5 border border-border/50">
            <p className="text-text-secondary text-sm mb-1">{s.label}</p>
            <p className={`text-2xl font-bold font-mono-num ${s.color}`}>{s.value}</p>
            <p className="text-text-muted text-xs mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-6">
          {enriched.length > 0 && (
            <div className="glass-card rounded-2xl p-6 border border-border/50">
              <h3 className="text-text-primary font-semibold mb-6">Portfolio Performance ({period})</h3>
              <PerformanceChartWithPeriod ticker={enriched[0].ticker} totalValue={totalValue} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="allocation" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6 border border-border/50">
              <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-primary" /> By Asset Type
              </h3>
              <AllocationChart data={allocationData} />
            </div>

            <div className="glass-card rounded-2xl p-6 border border-border/50">
              <h3 className="text-text-primary font-semibold mb-4">Type Breakdown</h3>
              <div className="space-y-3">
                {allocationData.map((item) => (
                  <div key={item.ticker}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-text-secondary">{item.name}</span>
                      <span className="text-sm font-semibold text-text-primary">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${item.percentage}%`, background: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="holdings" className="mt-6">
          <div className="glass-card rounded-2xl p-6 border border-border/50">
            <h3 className="text-text-primary font-semibold mb-6">Top 10 Holdings by Value</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={holdingsBars} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#8888a8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8888a8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: '12px', color: '#f8f8fc' }}
                  formatter={(v: number) => [formatCurrency(v), 'Value']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {holdingsBars.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>

      {/* Top Gainers & Losers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { title: 'Top Gainers', items: gainers, isGain: true  },
          { title: 'Top Losers',  items: losers,  isGain: false },
        ].map(({ title, items, isGain }) => (
          <div key={title} className="glass-card rounded-2xl p-6 border border-border/50">
            <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
              {isGain ? <TrendingUp className="w-4 h-4 text-gain" /> : <TrendingDown className="w-4 h-4 text-loss" />}
              {title}
            </h3>
            {items.length === 0 ? (
              <p className="text-text-muted text-sm">No data yet</p>
            ) : (
              <div className="space-y-3">
                {items.map((h) => (
                  <div key={h.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{h.ticker}</p>
                      <p className="text-xs text-text-muted">{formatCurrency(h.currentValue)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${isGain ? 'text-gain' : 'text-loss'}`}>
                        {formatPercent(h.gainLossPercent)}
                      </p>
                      <p className={`text-xs ${isGain ? 'text-gain' : 'text-loss'}`}>
                        {formatCurrency(h.gainLoss)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
