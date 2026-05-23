'use client';
// WealthTrack — Select Dropdown Component
// A styled dropdown select. You don't need to edit this file.

import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-text-secondary block">{label}</label>
      )}
      <select
        className={cn(
          'w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary',
          'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50',
          'transition-colors appearance-none cursor-pointer',
          error && 'border-loss focus:ring-loss/50',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-loss">{error}</p>}
    </div>
  );
}
