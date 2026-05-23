'use client';

import { useState } from 'react';
import { Pencil, Trash2, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/loading';
import { formatCurrency, formatPercent, formatShares } from '@/lib/utils';
import type { Holding, Quote } from '@/types';

interface AssetTableProps {
  holdings: Holding[];
  quotes: Record<string, Quote>;
  loading: boolean;
  onEdit: (holding: Holding) => void;
  onDelete: (holding: Holding) => void;
}

function PerformanceBar({ percent }: { percent: number }) {
  const capped   = Math.min(Math.abs(percent), 100);
  const positive = percent >= 0;
  return (
    <div className="w-full h-1 bg-surface-2 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${positive ? 'bg-gain' : 'bg-loss'}`}
        style={{ width: `${Math.max(capped, 2)}%` }}
      />
    </div>
  );
}

export function AssetTable({ holdings, quotes, loading, onEdit, onDelete }: AssetTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (holding: Holding) => {
    if (!confirm(`Are you sure you want to delete ${holding.ticker}?`)) return;
    setDeletingId(holding.id);
    try {
      await onDelete(holding);
    } finally {
      setDeletingId(null);
    }
  };

  if (holdings.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-text-primary font-semibold mb-2">No holdings yet</h3>
        <p className="text-text-muted text-sm">Add your first asset to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider w-[200px]">Asset</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Type</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Shares</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Avg Cost</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
              {loading ? (
                <span className="flex items-center justify-end gap-1">
                  <Spinner size="sm" /> Price
                </span>
              ) : 'Price'}
            </th>
            <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Value</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">P&L</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Return</th>
            <th className="px-4 py-3 w-16" />
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => {
            const quote        = quotes[holding.ticker];
            const currentPrice = quote?.price ?? 0;
            const hasPrice     = currentPrice > 0;
            const currentValue = hasPrice ? currentPrice * holding.shares : holding.avgCost * holding.shares;
            const costBasis    = holding.avgCost * holding.shares;
            const gainLoss     = hasPrice ? currentValue - costBasis : 0;
            const gainLossPercent = hasPrice && costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
            const isPositive   = gainLoss >= 0;
            const dayChange    = quote?.changePercent ?? null;
            const isDeleting   = deletingId === holding.id;

            return (
              <tr
                key={holding.id}
                className="border-b border-border/40 transition-colors hover:bg-surface-2/40 group relative"
              >
                {/* Asset — left indicator lives here, absolute within the tr */}
                <td className="pl-5 pr-4 py-3.5 relative">
                  {/* Left-edge performance bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-r transition-opacity ${
                    !hasPrice ? 'opacity-0' : isPositive ? 'bg-gain opacity-70' : 'bg-loss opacity-70'
                  }`} />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-text-primary text-sm tracking-wide">{holding.ticker}</p>
                      {hasPrice && (
                        <span className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                          isPositive ? 'bg-gain/15 text-gain' : 'bg-loss/15 text-loss'
                        }`}>
                          {isPositive ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                          {formatPercent(Math.abs(gainLossPercent))}
                        </span>
                      )}
                    </div>
                    <p className="text-text-muted text-xs truncate max-w-[150px] leading-tight">{holding.name}</p>
                    {hasPrice && (
                      <PerformanceBar percent={gainLossPercent} />
                    )}
                  </div>
                </td>

                {/* Type */}
                <td className="px-4 py-3.5">
                  <Badge variant={holding.assetType as 'stock' | 'crypto' | 'etf' | 'fund'}>
                    {holding.assetType.charAt(0).toUpperCase() + holding.assetType.slice(1)}
                  </Badge>
                </td>

                {/* Shares */}
                <td className="px-4 py-3.5 text-right">
                  <span className="text-text-primary text-sm font-mono-num">{formatShares(holding.shares)}</span>
                </td>

                {/* Avg cost */}
                <td className="px-4 py-3.5 text-right">
                  <span className="text-text-secondary text-sm font-mono-num">
                    {formatCurrency(holding.avgCost)}
                  </span>
                </td>

                {/* Current price */}
                <td className="px-4 py-3.5 text-right">
                  {loading && !quote ? (
                    <Spinner size="sm" className="ml-auto" />
                  ) : hasPrice ? (
                    <div>
                      <p className="text-text-primary text-sm font-mono-num font-medium">
                        {formatCurrency(currentPrice)}
                      </p>
                      {dayChange !== null && (
                        <p className={`text-xs font-mono-num flex items-center justify-end gap-0.5 ${dayChange >= 0 ? 'text-gain' : 'text-loss'}`}>
                          {dayChange >= 0 ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                          {Math.abs(dayChange).toFixed(2)}% hoy
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-text-muted text-xs">Sin precio</span>
                  )}
                </td>

                {/* Value */}
                <td className="px-4 py-3.5 text-right">
                  <span className={`text-sm font-semibold font-mono-num ${hasPrice ? 'text-text-primary' : 'text-text-muted'}`}>
                    {formatCurrency(currentValue)}
                  </span>
                  {!hasPrice && (
                    <p className="text-xs text-text-muted">costo</p>
                  )}
                </td>

                {/* P&L $ */}
                <td className="px-4 py-3.5 text-right">
                  {hasPrice ? (
                    <div className={`flex items-center justify-end gap-1 text-sm font-semibold ${isPositive ? 'text-gain' : 'text-loss'}`}>
                      {isPositive
                        ? <TrendingUp className="w-3.5 h-3.5" />
                        : <TrendingDown className="w-3.5 h-3.5" />}
                      <span className="font-mono-num">
                        {isPositive ? '+' : ''}{formatCurrency(gainLoss)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1 text-text-muted text-sm">
                      <Minus className="w-3 h-3" />
                      <span className="text-xs">sin datos</span>
                    </div>
                  )}
                </td>

                {/* Return % — prominent badge */}
                <td className="px-4 py-3.5 text-right">
                  {hasPrice ? (
                    <span className={`inline-flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-lg font-mono-num ${
                      isPositive
                        ? 'bg-gain/15 text-gain border border-gain/20'
                        : 'bg-loss/15 text-loss border border-loss/20'
                    }`}>
                      {isPositive ? '+' : ''}{formatPercent(gainLossPercent)}
                    </span>
                  ) : (
                    <span className="text-text-muted text-sm">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(holding)}
                      className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(holding)}
                      disabled={isDeleting}
                      className="p-1.5 text-text-muted hover:text-loss hover:bg-loss/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {isDeleting ? <Spinner size="sm" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
