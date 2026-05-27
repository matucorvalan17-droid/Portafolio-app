import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'stock' | 'crypto' | 'etf' | 'fund' | 'default' | 'gain' | 'loss';
  className?: string;
}

const variantStyles = {
  stock:   'bg-primary/10 text-primary border-primary/25',
  crypto:  'bg-[#ec7e00]/10 text-[#ec7e00] border-[#ec7e00]/25',
  etf:     'bg-gain/10 text-gain border-gain/25',
  fund:    'bg-[#007bc2]/10 text-[#007bc2] border-[#007bc2]/25',
  gain:    'bg-gain/10 text-gain border-gain/25',
  loss:    'bg-loss/10 text-loss border-loss/25',
  default: 'bg-[rgba(255,255,255,0.06)] text-text-secondary border-[rgba(255,255,255,0.10)]',
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
