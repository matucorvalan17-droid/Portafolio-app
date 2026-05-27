'use client';

import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface StatsOverviewProps {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  portfolioCount: number;
  holdingsCount: number;
}

function useCountUp(target: number, duration = 800, delay = 0) {
  const [current, setCurrent] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const start     = performance.now();
      const animate   = (now: number) => {
        const elapsed = now - start;
        const progress= Math.min(elapsed / duration, 1);
        const eased   = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
        setCurrent(target * eased);
        if (progress < 1) raf.current = requestAnimationFrame(animate);
      };
      raf.current = requestAnimationFrame(animate);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf.current); };
  }, [target, duration, delay]);

  return current;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentClass,
  positive,
  delay,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  accentClass: string;
  positive?: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative bg-surface-2 border border-[rgba(255,255,255,0.08)] rounded-[20px] p-5 overflow-hidden
        hover:border-[rgba(255,255,255,0.14)] transition-colors duration-200"
    >
      {/* Subtle ambient */}
      <div className={`pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-[0.12] ${accentClass}`} />

      <div className="flex items-start justify-between mb-4 relative">
        <p className="text-text-muted text-xs font-medium uppercase tracking-wider">{title}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accentClass} bg-opacity-[0.12]`}
          style={{ background: 'transparent' }}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-current opacity-10 absolute`} />
          <Icon className={`w-4 h-4 relative z-10 ${
            accentClass.includes('primary') ? 'text-primary' :
            accentClass.includes('gain')    ? 'text-gain'    :
            accentClass.includes('loss')    ? 'text-loss'    : 'text-warning'
          }`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-text-primary font-mono-num tracking-tight mb-1 relative">{value}</p>
      <p className={`text-sm font-medium relative ${
        positive === undefined ? 'text-text-muted' : positive ? 'text-gain' : 'text-loss'
      }`}>
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
  const isGain         = totalGainLoss >= 0;
  const animatedValue  = useCountUp(totalValue,     800,  80);
  const animatedGl     = useCountUp(Math.abs(totalGainLoss), 700, 160);
  const animatedPct    = useCountUp(Math.abs(totalGainLossPercent), 600, 200);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Valor total"
        value={formatCurrency(animatedValue)}
        subtitle={`${formatCurrency(totalCost)} invertido`}
        icon={DollarSign}
        accentClass="bg-primary"
        delay={0}
      />
      <StatCard
        title="Ganancia / Pérdida"
        value={(isGain ? '+' : '-') + formatCurrency(animatedGl)}
        subtitle={`${isGain ? '+' : '-'}${animatedPct.toFixed(2)}% total`}
        icon={isGain ? TrendingUp : TrendingDown}
        accentClass={isGain ? 'bg-gain' : 'bg-loss'}
        positive={isGain}
        delay={0.06}
      />
      <StatCard
        title="Portfolios"
        value={String(portfolioCount)}
        subtitle={`${holdingsCount} posiciones activas`}
        icon={LayoutGrid}
        accentClass="bg-primary"
        delay={0.12}
      />
      <StatCard
        title="P&L no realizado"
        value={(isGain ? '+' : '') + formatPercent(totalGainLossPercent)}
        subtitle={isGain ? 'Estás en ganancia' : 'Seguí manteniendo'}
        icon={TrendingUp}
        accentClass={isGain ? 'bg-gain' : 'bg-warning'}
        positive={isGain}
        delay={0.18}
      />
    </div>
  );
}
