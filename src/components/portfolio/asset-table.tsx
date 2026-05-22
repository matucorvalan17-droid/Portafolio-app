'use client';

import { useState } from 'react';
import { Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
            <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Asset</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Type</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Broker</th>
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
            <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Gain/Loss</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Return</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => {
            const quote = quotes[holding.ticker];
            const currentPrice = quote?.price ?? 0;
            const currentValue = currentPrice * holding.shares;
            const costBasis = holding.avgCost * holding.shares;
            const gainLoss = currentValue - costBasis;
            const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
            const isPositive = gainLoss >= 0;
            const priceChange = quote?.changePercent ?? 0;
            const isDeleting = deletingId === holding.id;

            return (
              <tr
                key={holding.id}
                className="border-b border-border/40 table-row-hover transition-colors"
              >
                {/* Asset name */}
                <td className="px-4 py-3.5">
                  <div>
                    <p className="font-semibold text-text-primary text-sm">{holding.ticker}</p>
                    <p className="text-text-muted text-xs truncate max-w-[140px]">{holding.name}</p>
                  </div>
                </td>

                {/* Type badge */}
                <td className="px-4 py-3.5">
                  <Badge variant={holding.assetType as 'stock' | 'crypto' | 'etf' | 'fund'}>
                    {holding.assetType.charAt(0).toUpperCase() + holding.assetType.slice(1)}
                  </Badge>
                </td>

                {/* Broker */}
                <td className="px-4 py-3.5">
                  <span className="text-text-muted text-xs">{holding.broker || '—'}</span>
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
                  ) : (
                    <div>
                      <p className="text-text-primary text-sm font-mono-num">
                        {currentPrice > 0 ? formatCurrency(currentPrice) : '—'}
                      </p>
                      {currentPrice > 0 && (
                        <p className={`text-xs font-mono-num ${priceChange >= 0 ? 'text-gain' : 'text-loss'}`}>
                          {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                        </p>
                      )}
                    </div>
                  )}
                </td>

                {/* Current value */}
                <td className="px-4 py-3.5 text-right">
                  <span className="text-text-primary text-sm font-semibold font-mono-num">
                    {currentPrice > 0 ? formatCurrency(currentValue) : '—'}
                  </span>
                </td>

                {/* Gain/Loss $ */}
                <td className="px-4 py-3.5 text-right">
                  {currentPrice > 0 ? (
                    <div className={`flex items-center justify-end gap-1 text-sm font-medium ${isPositive ? 'text-gain' : 'text-loss'}`}>
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span className="font-mono-num">
                        {isPositive ? '+' : ''}{formatCurrency(gainLoss)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-text-muted text-sm">—</span>
                  )}
                </td>

                {/* Return % */}
                <td className="px-4 py-3.5 text-right">
                  {currentPrice > 0 ? (
                    <span
                      className={`text-sm font-semibold px-2 py-0.5 rounded-full font-mono-num ${
                        isPositive ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'
                      }`}
                    >
                      {formatPercent(gainLossPercent)}
                    </span>
                  ) : (
                    <span className="text-text-muted text-sm">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1 justify-end">
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
                      {isDeleting ? (
                        <Spinner size="sm" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
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
