'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Briefcase, ChevronRight } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { PortfolioWithStats } from '@/types';

interface PortfolioCardProps {
  portfolio: PortfolioWithStats;
}

export function PortfolioCard({ portfolio }: PortfolioCardProps) {
  const isPositive = portfolio.totalGainLoss >= 0;

  return (
    <Link href={`/portfolio/${portfolio.id}`} className="block group">
      <div className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/30 hover:bg-surface-2/50 transition-all duration-200 group-hover:shadow-card">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary text-sm">{portfolio.name}</h3>
              <p className="text-text-muted text-xs">
                {portfolio.holdingsCount} {portfolio.holdingsCount === 1 ? 'holding' : 'holdings'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
        </div>

        {/* Value */}
        <div className="mb-3">
          <p className="text-2xl font-bold text-text-primary font-mono-num">
            {formatCurrency(portfolio.totalValue, portfolio.currency, true)}
          </p>
        </div>

        {/* Gain/Loss */}
        <div className="flex items-center justify-between">
          <div
            className={`flex items-center gap-1.5 text-sm font-medium ${
              isPositive ? 'text-gain' : 'text-loss'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>
              {isPositive ? '+' : ''}
              {formatCurrency(portfolio.totalGainLoss, portfolio.currency)}
            </span>
          </div>

          <span
            className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
              isPositive
                ? 'bg-gain/10 text-gain'
                : 'bg-loss/10 text-loss'
            }`}
          >
            {formatPercent(portfolio.totalGainLossPercent)}
          </span>
        </div>
      </div>
    </Link>
  );
}
