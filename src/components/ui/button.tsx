'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-40 disabled:cursor-not-allowed rounded-full';

    const variants = {
      primary:
        'bg-primary hover:bg-primary-hover active:bg-primary-deep text-white focus:ring-primary',
      secondary:
        'bg-surface-2 hover:bg-[#1e2024] text-text-primary border border-[rgba(255,255,255,0.10)] hover:border-[rgba(255,255,255,0.18)] focus:ring-border',
      ghost:
        'bg-transparent hover:bg-surface-2 text-text-secondary hover:text-text-primary focus:ring-border',
      danger:
        'bg-loss hover:bg-[#c0262f] active:bg-[#a01e26] text-white focus:ring-loss',
      outline:
        'bg-transparent border border-[rgba(255,255,255,0.18)] hover:border-[rgba(255,255,255,0.35)] text-text-secondary hover:text-white focus:ring-primary',
    };

    const sizes = {
      sm: 'text-xs px-4 py-1.5 h-8',
      md: 'text-sm px-5 py-2 h-10',
      lg: 'text-base px-7 py-3 h-12',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
