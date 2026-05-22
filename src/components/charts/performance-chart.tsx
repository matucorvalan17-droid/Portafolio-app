'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
  payload?: Array<{ value: number }>;
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

export function PerformanceChartWithPeriod({ ticker, totalValue, currency = 'USD' }: PerformanceChartWithPeriodProps) {
  const [period, setPeriod] = useState<Period>('3mo');
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async (p: Period) => {
    if (!ticker) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/prices/historical?ticker=${ticker}&period=${p}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-1 mb-4">
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
      <PerformanceChart data={data} currency={currency} isLoading={loading} />
    </div>
  );
}
