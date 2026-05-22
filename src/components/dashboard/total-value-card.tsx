'use client';

import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface TotalValueCardProps {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  currency?: string;
}

export function TotalValueCard({
  totalValue,
  totalCost,
  totalGainLoss,
  totalGainLossPercent,
  currency = 'USD',
}: TotalValueCardProps) {
  const isPositive = totalGainLoss >= 0;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden">
      {/* Background glow */}
      <div
        className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-[60px] opacity-10 ${
          isPositive ? 'bg-gain' : 'bg-loss'
        }`}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <span className="text-text-secondary text-sm font-medium">Total Portfolio Value</span>
        </div>

        <p className="text-5xl font-bold text-text-primary font-mono-num mb-3">
          {formatCurrency(totalValue, currency, true)}
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <div
            className={`flex items-center gap-1.5 text-sm font-medium ${
              isPositive ? 'text-gain' : 'text-loss'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>
              {isPositive ? '+' : ''}
              {formatCurrency(totalGainLoss, currency)}
            </span>
            <span className="opacity-70">({formatPercent(totalGainLossPercent)})</span>
          </div>

          <span className="text-text-muted text-sm">
            vs. cost basis {formatCurrency(totalCost, currency, true)}
          </span>
        </div>
      </div>
    </div>
  );
}
