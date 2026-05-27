import { cn } from '@/lib/utils';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ className, size = 'md' }: LoadingProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div
      className={cn(
        'rounded-full border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin',
        'border-border',
        sizes[size],
        className
      )}
      style={{ borderTopColor: '#494fdf' }}
    />
  );
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-text-secondary text-sm">Loading...</p>
      </div>
    </div>
  );
}

export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-2xl">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="md" />
        <p className="text-text-secondary text-sm">{message}</p>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 animate-pulse">
      <div className="h-4 bg-surface-2 rounded w-1/3 mb-4" />
      <div className="h-8 bg-surface-2 rounded w-2/3 mb-2" />
      <div className="h-4 bg-surface-2 rounded w-1/2" />
    </div>
  );
}
