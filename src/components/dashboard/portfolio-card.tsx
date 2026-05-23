'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { getBrokerLogoUrl, getBrokerInitial } from '@/lib/broker-logos';
import type { PortfolioWithStats } from '@/types';

interface PortfolioCardProps {
  portfolio: PortfolioWithStats;
}

function BrokerChip({ broker }: { broker: string }) {
  const logoUrl = getBrokerLogoUrl(broker);
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="w-6 h-6 rounded-full border-2 border-surface bg-surface-2 flex items-center justify-center overflow-hidden flex-shrink-0 -ml-1.5 first:ml-0 ring-1 ring-border"
      title={broker}
    >
      {logoUrl && !imgError ? (
        <img
          src={logoUrl}
          alt={broker}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-[9px] font-bold text-text-secondary leading-none">
          {getBrokerInitial(broker)}
        </span>
      )}
    </div>
  );
}

export function PortfolioCard({ portfolio }: PortfolioCardProps) {
  const isPositive = portfolio.totalGainLoss >= 0;

  // Unique brokers from holdings
  const brokers = Array.from(
    new Set(
      (portfolio.holdings ?? [])
        .map((h) => h.broker)
        .filter((b): b is string => !!b?.trim())
    )
  );
  const visibleBrokers = brokers.slice(0, 4);
  const extraBrokers   = brokers.length - visibleBrokers.length;

  return (
    <Link href={`/portfolio/${portfolio.id}`} className="block group">
      <div className={`
        relative bg-surface border rounded-2xl p-5 overflow-hidden
        transition-all duration-200
        hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.3),0_4px_24px_hsl(var(--primary)/0.08)]
        group-hover:border-primary/30
        ${isPositive ? 'border-border' : 'border-border'}
      `}>
        {/* Colored top accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${isPositive ? 'bg-gain' : 'bg-loss'} opacity-60`} />

        {/* Ambient glow */}
        <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-[0.07] ${isPositive ? 'bg-gain' : 'bg-loss'}`} />

        {/* Header */}
        <div className="flex items-start justify-between mb-4 relative">
          <div className="flex items-center gap-3">
            {/* Portfolio logo or initials */}
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-border">
              {portfolio.image ? (
                <img
                  src={portfolio.image}
                  alt={portfolio.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="text-base font-bold text-primary">
                    {portfolio.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-text-primary text-sm leading-tight">{portfolio.name}</h3>
              <p className="text-text-muted text-xs mt-0.5">
                {portfolio.holdingsCount} {portfolio.holdingsCount === 1 ? 'holding' : 'holdings'}
                {portfolio.currency !== 'USD' && ` · ${portfolio.currency}`}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors mt-0.5" />
        </div>

        {/* Total value */}
        <div className="mb-1 relative">
          <p className="text-2xl font-bold text-text-primary font-mono-num tracking-tight">
            {formatCurrency(portfolio.totalValue, portfolio.currency, true)}
          </p>
        </div>

        {/* Cost basis */}
        <p className="text-xs text-text-muted mb-3">
          Cost basis {formatCurrency(portfolio.totalCost, portfolio.currency, true)}
        </p>

        {/* Gain/Loss + brokers row */}
        <div className="flex items-center justify-between relative">
          {/* Gain/Loss */}
          <div className={`flex items-center gap-1.5 text-sm font-medium ${isPositive ? 'text-gain' : 'text-loss'}`}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{isPositive ? '+' : ''}{formatCurrency(portfolio.totalGainLoss, portfolio.currency)}</span>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${isPositive ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'}`}>
              {formatPercent(portfolio.totalGainLossPercent)}
            </span>
          </div>

          {/* Broker logos */}
          {brokers.length > 0 && (
            <div className="flex items-center">
              {visibleBrokers.map((broker) => (
                <BrokerChip key={broker} broker={broker} />
              ))}
              {extraBrokers > 0 && (
                <div className="w-6 h-6 rounded-full border-2 border-surface bg-surface-2 flex items-center justify-center -ml-1.5 ring-1 ring-border">
                  <span className="text-[9px] font-bold text-text-muted">+{extraBrokers}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
