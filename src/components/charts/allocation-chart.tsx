'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ALLOCATION_COLORS, formatCurrency, formatPercent } from '@/lib/utils';
import type { AllocationDataPoint } from '@/types';

interface AllocationChartProps {
  data: AllocationDataPoint[];
  currency?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: AllocationDataPoint;
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-surface-2 border border-border rounded-xl px-4 py-3 shadow-card">
        <p className="text-text-primary font-semibold text-sm mb-1">{item.ticker}</p>
        <p className="text-text-secondary text-xs mb-2">{item.name}</p>
        <p className="text-text-primary font-medium text-sm">{formatCurrency(item.value)}</p>
        <p className="text-text-secondary text-xs">{item.percentage.toFixed(1)}% of portfolio</p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ data }: { data: AllocationDataPoint[] }) => {
  const topItems = data.slice(0, 8);
  return (
    <div className="mt-4 space-y-2">
      {topItems.map((item, index) => (
        <div key={item.ticker} className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color || ALLOCATION_COLORS[index % ALLOCATION_COLORS.length] }}
            />
            <span className="text-xs text-text-secondary truncate">{item.ticker}</span>
          </div>
          <span className="text-xs text-text-muted ml-2 flex-shrink-0">{item.percentage.toFixed(1)}%</span>
        </div>
      ))}
      {data.length > 8 && (
        <p className="text-xs text-text-muted">+{data.length - 8} more</p>
      )}
    </div>
  );
};

export function AllocationChart({ data, currency = 'USD' }: AllocationChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-text-muted text-sm">
        No holdings to display
      </div>
    );
  }

  return (
    <div className="flex gap-6 items-start">
      <div className="flex-shrink-0" style={{ width: 200, height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.ticker}
                  fill={entry.color || ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 min-w-0">
        <CustomLegend data={data} />
      </div>
    </div>
  );
}
