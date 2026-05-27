'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, ChevronRight, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { getBrokerLogoUrl, getBrokerInitial } from '@/lib/broker-logos';
import type { PortfolioWithStats } from '@/types';

interface PortfolioCardProps {
  portfolio: PortfolioWithStats;
  index?: number;
}

function BrokerChip({ broker }: { broker: string }) {
  const logoUrl = getBrokerLogoUrl(broker);
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className="w-6 h-6 rounded-full border-2 border-surface bg-surface-2 flex items-center justify-center overflow-hidden flex-shrink-0 -ml-1.5 first:ml-0 ring-1 ring-[rgba(255,255,255,0.08)]"
      title={broker}
    >
      {logoUrl && !imgError ? (
        <img src={logoUrl} alt={broker} className="w-full h-full object-cover" onError={() => setImgError(true)} />
      ) : (
        <span className="text-[9px] font-bold text-text-secondary leading-none">{getBrokerInitial(broker)}</span>
      )}
    </div>
  );
}

export function PortfolioCard({ portfolio, index = 0 }: PortfolioCardProps) {
  const isPositive = portfolio.totalGainLoss >= 0;
  const gainPct    = portfolio.totalCost > 0
    ? Math.min(100, Math.max(0, (portfolio.totalValue / (portfolio.totalCost || 1)) * 50))
    : 50;

  const brokers        = Array.from(new Set((portfolio.holdings ?? []).map((h) => h.broker).filter((b): b is string => !!b?.trim())));
  const visibleBrokers = brokers.slice(0, 4);
  const extraBrokers   = brokers.length - visibleBrokers.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
    >
      <Link href={`/portfolio/${portfolio.id}`} className="block group cursor-pointer">
        <div className={`
          relative bg-surface-2 border rounded-[20px] p-5 overflow-hidden h-full
          transition-all duration-200
          border-[rgba(255,255,255,0.08)]
          group-hover:border-primary/35
          group-hover:shadow-[0_0_0_1px_rgba(73,79,223,0.2),0_8px_32px_rgba(0,0,0,0.5)]
        `}>

          {/* Top accent line — gain=cobalt, loss=red */}
          <div className={`absolute top-0 left-0 right-0 h-[2px] ${isPositive ? 'bg-primary' : 'bg-loss'} opacity-70`} />

          {/* Ambient radial behind the value */}
          <div className={`pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl
            ${isPositive ? 'bg-primary/8' : 'bg-loss/8'}`} />

          {/* Header row */}
          <div className="flex items-start justify-between mb-5 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-[rgba(255,255,255,0.08)]">
                {portfolio.image ? (
                  <img src={portfolio.image} alt={portfolio.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/15 flex items-center justify-center">
                    <span className="text-base font-bold text-primary">{portfolio.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-text-primary text-sm leading-tight">{portfolio.name}</h3>
                <p className="text-text-muted text-xs mt-0.5 flex items-center gap-1">
                  <BarChart2 className="w-3 h-3" />
                  {portfolio.holdingsCount} {portfolio.holdingsCount === 1 ? 'activo' : 'activos'}
                  {portfolio.currency !== 'USD' && ` · ${portfolio.currency}`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-0.5 shrink-0" />
          </div>

          {/* Value */}
          <div className="mb-1 relative">
            <p className="text-[1.6rem] font-bold text-text-primary font-mono-num tracking-tight leading-none">
              {formatCurrency(portfolio.totalValue, portfolio.currency, true)}
            </p>
          </div>
          <p className="text-xs text-text-muted mb-4">
            Base {formatCurrency(portfolio.totalCost, portfolio.currency, true)}
          </p>

          {/* Progress bar — visual representation of gain/loss */}
          <div className="mb-4 h-1 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isPositive ? 'bg-primary' : 'bg-loss'}`}
              initial={{ width: 0 }}
              animate={{ width: `${gainPct}%` }}
              transition={{ duration: 0.6, delay: index * 0.07 + 0.3, ease: 'easeOut' }}
            />
          </div>

          {/* Gain/loss + brokers */}
          <div className="flex items-center justify-between relative">
            <div className={`flex items-center gap-1.5 text-sm font-semibold ${isPositive ? 'text-gain' : 'text-loss'}`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{isPositive ? '+' : ''}{formatCurrency(portfolio.totalGainLoss, portfolio.currency)}</span>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${isPositive ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'}`}>
                {formatPercent(portfolio.totalGainLossPercent)}
              </span>
            </div>
            {brokers.length > 0 && (
              <div className="flex items-center">
                {visibleBrokers.map((broker) => <BrokerChip key={broker} broker={broker} />)}
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
    </motion.div>
  );
}
