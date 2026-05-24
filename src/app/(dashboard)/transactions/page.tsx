'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, ChevronRight, TrendingUp, TrendingDown, DollarSign, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/loading';
import { AddTransactionModal } from '@/components/portfolio/add-transaction-modal';
import { formatCurrency, formatShares } from '@/lib/utils';
import type { Transaction, Portfolio } from '@/types';

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  buy:      { label: 'Compra',    color: 'bg-gain/10 text-gain border-gain/20',         icon: <TrendingUp   className="w-3 h-3" /> },
  sell:     { label: 'Venta',     color: 'bg-loss/10 text-loss border-loss/20',          icon: <TrendingDown className="w-3 h-3" /> },
  dividend: { label: 'Dividendo', color: 'bg-primary/10 text-primary border-primary/20', icon: <DollarSign   className="w-3 h-3" /> },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface PortfolioGroup {
  portfolio: Portfolio;
  transactions: Transaction[];
  totalBought: number;
  totalSold: number;
}

function PortfolioSection({
  group,
  expanded,
  onToggle,
  onDelete,
  deletingId,
}: {
  group: PortfolioGroup;
  expanded: boolean;
  onToggle: () => void;
  onDelete: (tx: Transaction) => void;
  deletingId: string | null;
}) {
  const { portfolio, transactions, totalBought, totalSold } = group;
  const net = totalSold - totalBought;

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Portfolio header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-surface-2/50 transition-colors text-left"
      >
        {/* Logo / initial */}
        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-border">
          {portfolio.image ? (
            <img src={portfolio.image} alt={portfolio.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {portfolio.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Name + count */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">{portfolio.name}</p>
          <p className="text-xs text-text-muted mt-0.5">
            {transactions.length} operación{transactions.length !== 1 ? 'es' : ''}
          </p>
        </div>

        {/* Summary */}
        <div className="hidden sm:flex items-center gap-4 mr-2">
          {totalBought > 0 && (
            <div className="text-right">
              <p className="text-xs text-text-muted">Comprado</p>
              <p className="text-sm font-semibold text-loss font-mono-num">−{formatCurrency(totalBought)}</p>
            </div>
          )}
          {totalSold > 0 && (
            <div className="text-right">
              <p className="text-xs text-text-muted">Vendido</p>
              <p className="text-sm font-semibold text-gain font-mono-num">+{formatCurrency(totalSold)}</p>
            </div>
          )}
          {(totalBought > 0 || totalSold > 0) && (
            <div className="text-right">
              <p className="text-xs text-text-muted">Neto</p>
              <p className={`text-sm font-bold font-mono-num ${net >= 0 ? 'text-gain' : 'text-loss'}`}>
                {net >= 0 ? '+' : ''}{formatCurrency(net)}
              </p>
            </div>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight
          className={`w-4 h-4 text-text-muted flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Expandable transaction table */}
      {expanded && (
        <div className="border-t border-border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 bg-surface-2/40">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wider">Fecha</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wider">Activo</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wider">Tipo</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wider">Acciones</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wider">Precio</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wider">Comisión</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wider">Total</th>
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const cfg = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.buy;
                return (
                  <tr key={tx.id} className="border-b border-border/30 last:border-0 hover:bg-surface-2/40 transition-colors group">
                    <td className="px-5 py-3 text-sm text-text-secondary whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-text-primary">{tx.ticker}</p>
                      <p className="text-xs text-text-muted truncate max-w-[140px]">{tx.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-mono-num text-text-primary">
                      {formatShares(tx.shares)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-mono-num text-text-secondary">
                      {formatCurrency(tx.price)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-mono-num text-text-muted">
                      {tx.fee > 0 ? formatCurrency(tx.fee) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-semibold font-mono-num ${tx.type === 'buy' ? 'text-loss' : 'text-gain'}`}>
                        {tx.type === 'buy' ? '−' : '+'}{formatCurrency(tx.total + (tx.type === 'buy' ? tx.fee : 0))}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onDelete(tx)}
                        disabled={deletingId === tx.id}
                        className="p-1.5 text-text-muted hover:text-loss hover:bg-loss/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      >
                        {deletingId === tx.id ? <Spinner size="sm" /> : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  const [transactions,  setTransactions]  = useState<Transaction[]>([]);
  const [portfolios,    setPortfolios]    = useState<Portfolio[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [deletingId,    setDeletingId]    = useState<string | null>(null);
  const [addModalOpen,  setAddModalOpen]  = useState(false);
  const [expanded,      setExpanded]      = useState<Set<string>>(new Set());
  const [filterType,    setFilterType]    = useState<string>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, pRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/portfolios'),
      ]);
      if (txRes.ok) {
        const txs: Transaction[] = await txRes.json();
        setTransactions(txs);
        // Auto-expand all portfolios that have transactions
        const ids = new Set(txs.map((t) => t.portfolioId ?? (t.portfolio as { id: string })?.id).filter(Boolean) as string[]);
        setExpanded(ids);
      }
      if (pRes.ok) setPortfolios(await pRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (tx: Transaction) => {
    if (!confirm(`¿Eliminar transacción de ${tx.ticker}? Esto actualizará el holding automáticamente.`)) return;
    setDeletingId(tx.id);
    try {
      await fetch(`/api/transactions/${tx.id}`, { method: 'DELETE' });
      setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
    } finally {
      setDeletingId(null);
    }
  };

  const togglePortfolio = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleExport = async () => {
    const rows = ['Date,Portfolio,Ticker,Name,Type,Shares,Price,Fee,Total,Broker'];
    for (const tx of transactions) {
      const pName = portfolios.find((p) => p.id === tx.portfolioId)?.name ?? '';
      rows.push([
        new Date(tx.date).toISOString().split('T')[0],
        pName, tx.ticker, tx.name, tx.type,
        tx.shares, tx.price, tx.fee, tx.total,
        tx.broker ?? '',
      ].join(','));
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `transacciones-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Group filtered transactions by portfolio, ordered by portfolio name
  const groups = useMemo<PortfolioGroup[]>(() => {
    const filtered = filterType === 'all' ? transactions : transactions.filter((t) => t.type === filterType);
    const map = new Map<string, PortfolioGroup>();

    for (const tx of filtered) {
      const pId = tx.portfolioId ?? (tx.portfolio as { id: string } | undefined)?.id ?? '';
      if (!map.has(pId)) {
        const portfolio = portfolios.find((p) => p.id === pId);
        if (!portfolio) continue;
        map.set(pId, { portfolio, transactions: [], totalBought: 0, totalSold: 0 });
      }
      const g = map.get(pId)!;
      g.transactions.push(tx);
      if (tx.type === 'buy')  g.totalBought += tx.total + tx.fee;
      if (tx.type === 'sell') g.totalSold   += tx.total;
    }

    return Array.from(map.values()).sort((a, b) => a.portfolio.name.localeCompare(b.portfolio.name));
  }, [transactions, portfolios, filterType]);

  const totals = useMemo(() => transactions.reduce((acc, t) => {
    if (t.type === 'buy')      acc.bought    += t.total + t.fee;
    if (t.type === 'sell')     acc.sold      += t.total;
    if (t.type === 'dividend') acc.dividends += t.total;
    return acc;
  }, { bought: 0, sold: 0, dividends: 0 }), [transactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Transacciones</h1>
          <p className="text-text-secondary text-sm mt-1">
            {transactions.length} operación{transactions.length !== 1 ? 'es' : ''} en {portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {transactions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4" /> Exportar
            </Button>
          )}
          <Button size="sm" onClick={() => setAddModalOpen(true)}>
            <Plus className="w-4 h-4" /> Nueva Operación
          </Button>
        </div>
      </div>

      {/* Summary */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total invertido', value: totals.bought,    color: 'text-loss',    sign: '−' },
            { label: 'Total vendido',   value: totals.sold,      color: 'text-gain',    sign: '+' },
            { label: 'Dividendos',      value: totals.dividends, color: 'text-primary', sign: '+' },
          ].map((s) => (
            <div key={s.label} className="bg-surface border border-border rounded-2xl p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{s.label}</p>
              <p className={`text-xl font-bold font-mono-num ${s.color}`}>
                {s.sign}{formatCurrency(s.value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      {transactions.length > 0 && (
        <div className="flex items-center gap-2">
          {[
            { key: 'all',      label: 'Todas' },
            { key: 'buy',      label: 'Compras'    },
            { key: 'sell',     label: 'Ventas'     },
            { key: 'dividend', label: 'Dividendos' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterType === f.key
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border text-text-muted hover:text-text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Portfolio groups */}
      {groups.length === 0 ? (
        <div className="text-center py-24 bg-surface border border-border rounded-2xl">
          <div className="w-16 h-16 bg-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-text-primary font-semibold mb-2">Sin transacciones</h3>
          <p className="text-text-muted text-sm mb-6">Registrá tu primera operación para empezar el historial</p>
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="w-4 h-4" /> Nueva Operación
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <PortfolioSection
              key={group.portfolio.id}
              group={group}
              expanded={expanded.has(group.portfolio.id)}
              onToggle={() => togglePortfolio(group.portfolio.id)}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          ))}
        </div>
      )}

      <AddTransactionModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        portfolios={portfolios}
        onSuccess={() => { setAddModalOpen(false); loadData(); }}
      />
    </div>
  );
}
