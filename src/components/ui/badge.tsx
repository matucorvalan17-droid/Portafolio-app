import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'stock' | 'crypto' | 'etf' | 'fund' | 'default' | 'gain' | 'loss';
  className?: string;
}

const variantStyles = {
  stock: 'bg-primary/10 text-primary border-primary/20',
  crypto: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  etf: 'bg-gain/10 text-gain border-gain/20',
  fund: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  gain: 'bg-gain/10 text-gain border-gain/20',
  loss: 'bg-loss/10 text-loss border-loss/20',
  default: 'bg-surface-2 text-text-secondary border-border',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
