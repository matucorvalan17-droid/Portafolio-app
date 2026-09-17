'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import type { ChartDataPoint } from '@/types';

interface PerformanceChartProps {
  data: ChartDataPoint[];
  currency?: string;
  isLoading?: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-2 border border-border rounded-xl px-4 py-3 shadow-card">
        <p className="text-text-muted text-xs mb-1">{label}</p>
        <p className="text-text-primary font-semibold">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

interface BenchmarkTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

const BenchmarkTooltip = ({ active, payload, label }: BenchmarkTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-border rounded-xl px-4 py-3 shadow-card min-w-[160px]">
      <p className="text-text-muted text-xs mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="text-xs" style={{ color: p.color }}>{p.name}</span>
          <span className="text-xs font-semibold" style={{ color: p.color }}>
            {p.value >= 0 ? '+' : ''}{p.value.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
};

const PERIODS = [
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
] as const;

type Period = '1mo' | '3mo' | '6mo' | '1y';

interface PerformanceChartWithPeriodProps {
  ticker?: string;
  totalValue: number;
  currency?: string;
  initialPeriod?: Period;
}

interface BenchmarkPoint {
  date: string;
  portfolio: number;
  sp500: number;
}

export function PerformanceChart({ data, isLoading }: PerformanceChartProps) {
  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-text-muted text-sm">
        No historical data available
      </div>
    );
  }

  const isPositive = data.length > 1 ? data[data.length - 1].value >= data[0].value : true;
  const color = isPositive ? '#22c55e' : '#ef4444';

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#8888a8', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          tickFormatter={(val: string) => {
            const d = new Date(val);
            return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`;
          }}
        />
        <YAxis
          tick={{ fill: '#8888a8', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(val: number) => `$${(val / 1000).toFixed(0)}k`}
          width={50}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill="url(#colorValue)"
          dot={false}
          activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function normalize(points: ChartDataPoint[]): { date: string; pct: number }[] {
  if (!points.length) return [];
  const base = points[0].value;
  if (base === 0) return [];
  return points.map((p) => ({ date: p.date, pct: ((p.value - base) / base) * 100 }));
}

function mergeBenchmark(
  portfolio: { date: string; pct: number }[],
  sp500: { date: string; pct: number }[],
): BenchmarkPoint[] {
  const sp500Map = new Map(sp500.map((p) => [p.date, p.pct]));
  return portfolio.map((p) => ({
    date: p.date,
    portfolio: parseFloat(p.pct.toFixed(2)),
    sp500: parseFloat((sp500Map.get(p.date) ?? sp500Map.get(
      [...sp500Map.keys()].reduce((best, k) =>
        Math.abs(new Date(k).getTime() - new Date(p.date).getTime()) <
        Math.abs(new Date(best).getTime() - new Date(p.date).getTime()) ? k : best
      )
    ) ?? 0).toFixed(2)),
  }));
}

export function PerformanceChartWithPeriod({ ticker, totalValue, currency = 'USD', initialPeriod = '3mo' }: PerformanceChartWithPeriodProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBenchmark, setShowBenchmark] = useState(true);

  const fetchData = async (p: Period) => {
    if (!ticker) return;
    setLoading(true);
    try {
      const [portfolioRes, sp500Res] = await Promise.all([
        fetch(`/api/prices/historical?ticker=${ticker}&period=${p}`),
        fetch(`/api/prices/historical?ticker=SPY&period=${p}`),
      ]);
      if (portfolioRes.ok && sp500Res.ok) {
        const [portfolioJson, sp500Json]: [ChartDataPoint[], ChartDataPoint[]] = await Promise.all([
          portfolioRes.json(),
          sp500Res.json(),
        ]);
        const merged = mergeBenchmark(normalize(portfolioJson), normalize(sp500Json));
        setBenchmarkData(merged);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Auto-load on mount when ticker is available
  useEffect(() => {
    if (ticker) fetchData(initialPeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  const isPositive = benchmarkData.length > 1
    ? benchmarkData[benchmarkData.length - 1].portfolio >= 0
    : true;
  const portfolioColor = isPositive ? '#22c55e' : '#ef4444';
  const sp500Color = '#6366f1';

  const tickFmt = (val: string) => {
    const d = new Date(val);
    return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => {
                setPeriod(p.value);
                fetchData(p.value);
              }}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                period === p.value
                  ? 'bg-primary/20 text-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowBenchmark((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors border ${
            showBenchmark
              ? 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10'
              : 'border-border text-text-muted bg-surface-2'
          }`}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: sp500Color }} />
          S&P 500
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : benchmarkData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-text-muted text-sm">
          Select a period to load chart
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={benchmarkData} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#8888a8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tickFormatter={tickFmt}
            />
            <YAxis
              tick={{ fill: '#8888a8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`}
              width={52}
            />
            <Tooltip content={<BenchmarkTooltip />} />
            <Line
              type="monotone"
              dataKey="portfolio"
              name="Cartera"
              stroke={portfolioColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            {showBenchmark && (
              <Line
                type="monotone"
                dataKey="sp500"
                name="S&P 500"
                stroke={sp500Color}
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}

      {benchmarkData.length > 0 && (
        <div className="flex items-center gap-4 mt-3 justify-end">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded" style={{ background: portfolioColor, display: 'inline-block' }} />
            <span className="text-xs text-text-muted">Cartera</span>
            <span className={`text-xs font-semibold ml-1 ${benchmarkData[benchmarkData.length - 1].portfolio >= 0 ? 'text-gain' : 'text-loss'}`}>
              {benchmarkData[benchmarkData.length - 1].portfolio >= 0 ? '+' : ''}{benchmarkData[benchmarkData.length - 1].portfolio.toFixed(2)}%
            </span>
          </div>
          {showBenchmark && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded" style={{ background: sp500Color, display: 'inline-block' }} />
              <span className="text-xs text-text-muted">S&P 500</span>
              <span className={`text-xs font-semibold ml-1 ${benchmarkData[benchmarkData.length - 1].sp500 >= 0 ? 'text-gain' : 'text-loss'}`}>
                {benchmarkData[benchmarkData.length - 1].sp500 >= 0 ? '+' : ''}{benchmarkData[benchmarkData.length - 1].sp500.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
