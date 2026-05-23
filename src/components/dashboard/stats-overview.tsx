'use client';
// WealthTrack — Stats Overview Cards
// The 4 big summary cards at the top of the dashboard.
// Shows total value, total gain/loss, day change, and portfolio count.

import { TrendingUp, TrendingDown, DollarSign, Briefcase } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StatsOverviewProps {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  portfolioCount: number;
  holdingsCount: number;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  positive,
  delay,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  positive?: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card rounded-2xl p-5 border border-border/50 hover:border-border-2 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-text-secondary text-sm font-medium">{title}</p>
        <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-text-primary font-mono-num mb-1">{value}</p>
      <p className={`text-sm font-medium ${positive === undefined ? 'text-text-secondary' : positive ? 'text-gain' : 'text-loss'}`}>
        {subtitle}
      </p>
    </motion.div>
  );
}

export function StatsOverview({
  totalValue,
  totalCost,
  totalGainLoss,
  totalGainLossPercent,
  portfolioCount,
  holdingsCount,
}: StatsOverviewProps) {
  const isGain = totalGainLoss >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Portfolio Value"
        value={formatCurrency(totalValue)}
        subtitle={`${formatCurrency(totalCost)} invested`}
        icon={DollarSign}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        delay={0}
      />
      <StatCard
        title="Total Gain / Loss"
        value={formatCurrency(totalGainLoss)}
        subtitle={formatPercent(totalGainLossPercent) + ' all time'}
        icon={isGain ? TrendingUp : TrendingDown}
        iconBg={isGain ? 'bg-gain/10' : 'bg-loss/10'}
        iconColor={isGain ? 'text-gain' : 'text-loss'}
        positive={isGain}
        delay={0.05}
      />
      <StatCard
        title="Portfolios"
        value={String(portfolioCount)}
        subtitle={`${holdingsCount} total holdings`}
        icon={Briefcase}
        iconBg="bg-purple-500/10"
        iconColor="text-purple-400"
        delay={0.1}
      />
      <StatCard
        title="Unrealized P&L"
        value={formatPercent(totalGainLossPercent)}
        subtitle={totalGainLoss >= 0 ? 'You\'re in profit 🎉' : 'Keep holding 💪'}
        icon={TrendingUp}
        iconBg={isGain ? 'bg-gain/10' : 'bg-warning/10'}
        iconColor={isGain ? 'text-gain' : 'text-warning'}
        positive={isGain}
        delay={0.15}
      />
    </div>
  );
}
