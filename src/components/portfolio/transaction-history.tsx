'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Spinner } from '@/components/ui/loading';
import { formatCurrency, formatShares } from '@/lib/utils';

interface Transaction {
  id: string;
  ticker: string;
  name: string;
  type: string;
  shares: number;
  price: number;
  total: number;
  fee: number;
  date: string;
  broker: string | null;
  notes: string | null;
}

interface TransactionHistoryProps {
  portfolioId: string;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  buy:      { label: 'Compra',    color: 'bg-gain/10 text-gain border-gain/20',    icon: <TrendingUp  className="w-3 h-3" /> },
  sell:     { label: 'Venta',     color: 'bg-loss/10 text-loss border-loss/20',    icon: <TrendingDown className="w-3 h-3" /> },
  dividend: { label: 'Dividendo', color: 'bg-primary/10 text-primary border-primary/20', icon: <DollarSign className="w-3 h-3" /> },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function TransactionHistory({ portfolioId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions?portfolioId=${portfolioId}`);
      if (res.ok) setTransactions(await res.json());
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleDelete = async (tx: Transaction) => {
    if (!confirm(`¿Eliminar esta transacción de ${tx.ticker}?`)) return;
    setDeletingId(tx.id);
    try {
      await fetch(`/api/transactions/${tx.id}`, { method: 'DELETE' });
      setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="md" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-text-primary font-semibold mb-2">Sin transacciones</h3>
        <p className="text-text-muted text-sm">Las transacciones aparecerán aquí cuando agregues activos</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Fecha</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Activo</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Tipo</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Acciones</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Precio</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Comisión</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Total</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Broker</th>
            <th className="px-4 py-3 w-12" />
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const cfg        = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.buy;
            const isDeleting = deletingId === tx.id;
            return (
              <tr key={tx.id} className="border-b border-border/40 hover:bg-surface-2/40 transition-colors group">
                {/* Date */}
                <td className="px-4 py-3.5">
                  <span className="text-text-secondary text-sm">{formatDate(tx.date)}</span>
                </td>

                {/* Asset */}
                <td className="px-4 py-3.5">
                  <p className="font-bold text-text-primary text-sm">{tx.ticker}</p>
                  <p className="text-text-muted text-xs truncate max-w-[140px]">{tx.name}</p>
                </td>

                {/* Type */}
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </td>

                {/* Shares */}
                <td className="px-4 py-3.5 text-right">
                  <span className="text-text-primary text-sm font-mono-num">{formatShares(tx.shares)}</span>
                </td>

                {/* Price */}
                <td className="px-4 py-3.5 text-right">
                  <span className="text-text-secondary text-sm font-mono-num">{formatCurrency(tx.price)}</span>
                </td>

                {/* Fee */}
                <td className="px-4 py-3.5 text-right">
                  {tx.fee > 0 ? (
                    <span className="text-text-muted text-sm font-mono-num">{formatCurrency(tx.fee)}</span>
                  ) : (
                    <span className="text-text-muted text-xs">—</span>
                  )}
                </td>

                {/* Total */}
                <td className="px-4 py-3.5 text-right">
                  <span className={`text-sm font-semibold font-mono-num ${tx.type === 'buy' ? 'text-loss' : 'text-gain'}`}>
                    {tx.type === 'buy' ? '−' : '+'}{formatCurrency(tx.total + tx.fee)}
                  </span>
                </td>

                {/* Broker */}
                <td className="px-4 py-3.5">
                  <span className="text-text-muted text-xs">{tx.broker || '—'}</span>
                </td>

                {/* Delete */}
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => handleDelete(tx)}
                    disabled={isDeleting}
                    className="p-1.5 text-text-muted hover:text-loss hover:bg-loss/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  >
                    {isDeleting ? <Spinner size="sm" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
