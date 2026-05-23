'use client';
// WealthTrack — Transactions Page
// Shows all buy, sell, and dividend records.
// You can add transactions manually or they log automatically when you trade.

import { useState, useEffect, useCallback } from 'react';
import { Plus, Filter, Download, History, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { SkeletonCard } from '@/components/ui/loading';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { Transaction, Portfolio } from '@/types';

const TYPE_COLORS = {
  buy:      { bg: 'bg-gain/10',    text: 'text-gain',    icon: TrendingUp,   label: 'Buy'      },
  sell:     { bg: 'bg-loss/10',    text: 'text-loss',    icon: TrendingDown, label: 'Sell'     },
  dividend: { bg: 'bg-warning/10', text: 'text-warning', icon: DollarSign,   label: 'Dividend' },
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [portfolios, setPortfolios]     = useState<Portfolio[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filterType, setFilterType]     = useState<string>('all');
  const [addOpen, setAddOpen]           = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  const [form, setForm] = useState({
    portfolioId: '',
    ticker:      '',
    name:        '',
    type:        'buy' as 'buy' | 'sell' | 'dividend',
    shares:      '',
    price:       '',
    fee:         '0',
    date:        new Date().toISOString().split('T')[0],
    broker:      '',
    notes:       '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, pRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/portfolios'),
      ]);
      if (txRes.ok) setTransactions(await txRes.json());
      if (pRes.ok)  setPortfolios(await pRes.json());
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.portfolioId || !form.ticker || !form.shares || !form.price) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          shares: parseFloat(form.shares),
          price:  parseFloat(form.price),
          fee:    parseFloat(form.fee) || 0,
          total:  parseFloat(form.shares) * parseFloat(form.price),
        }),
      });
      if (res.ok) {
        toast.success('Transaction added!');
        setAddOpen(false);
        setForm({ portfolioId: '', ticker: '', name: '', type: 'buy', shares: '', price: '', fee: '0', date: new Date().toISOString().split('T')[0], broker: '', notes: '' });
        loadData();
      } else {
        toast.error('Failed to add transaction');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/export?type=transactions');
      if (!res.ok) { toast.error('Export failed'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wealthtrack-transactions-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Transactions exported!');
    } catch { toast.error('Export failed'); }
  };

  const filtered = filterType === 'all'
    ? transactions
    : transactions.filter((t) => t.type === filterType);

  const totals = transactions.reduce((acc, t) => {
    if (t.type === 'buy')      acc.bought  += t.total;
    if (t.type === 'sell')     acc.sold    += t.total;
    if (t.type === 'dividend') acc.dividends += t.total;
    return acc;
  }, { bought: 0, sold: 0, dividends: 0 });

  if (loading) return (
    <div className="space-y-4">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Transactions</h1>
          <p className="text-text-secondary text-sm mt-1">Your complete trade history</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Bought', value: totals.bought,    color: 'text-gain',    bg: 'bg-gain/10'    },
          { label: 'Total Sold',   value: totals.sold,      color: 'text-loss',    bg: 'bg-loss/10'    },
          { label: 'Dividends',    value: totals.dividends, color: 'text-warning', bg: 'bg-warning/10' },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-5 border border-border/50">
            <p className="text-text-secondary text-sm mb-1">{s.label}</p>
            <p className={`text-2xl font-bold font-mono-num ${s.color}`}>
              {formatCurrency(s.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-text-muted" />
        {['all', 'buy', 'sell', 'dividend'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize
              ${filterType === t ? 'bg-primary text-white' : 'bg-surface-2 text-text-secondary hover:text-text-primary border border-border'}`}
          >
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-sm text-text-muted">{filtered.length} transactions</span>
      </div>

      {/* Transactions List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No transactions yet</h3>
          <p className="text-text-secondary text-sm mb-6 max-w-xs mx-auto">
            Start logging your trades to build a complete history of your investment activity.
          </p>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Your First Transaction
          </Button>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-surface-2/50">
                  {['Date', 'Type', 'Asset', 'Shares', 'Price', 'Total', 'Portfolio'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx, i) => {
                  const config = TYPE_COLORS[tx.type as keyof typeof TYPE_COLORS] ?? TYPE_COLORS.buy;
                  const Icon = config.icon;
                  return (
                    <tr
                      key={tx.id}
                      className={`border-b border-border/30 hover:bg-primary/5 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}
                    >
                      <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${config.bg} ${config.text}`}>
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-semibold text-text-primary">{tx.ticker}</p>
                        <p className="text-xs text-text-muted truncate max-w-[140px]">{tx.name}</p>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-text-primary font-mono-num">
                        {tx.shares.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-text-primary font-mono-num">
                        {formatCurrency(tx.price)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-sm font-semibold font-mono-num ${config.text}`}>
                          {tx.type === 'sell' ? '-' : '+'}{formatCurrency(tx.total)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-text-muted truncate max-w-[120px]">
                        {tx.portfolio?.name ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Transaction" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium text-text-secondary block mb-1.5">Portfolio *</label>
              <select
                value={form.portfolioId}
                onChange={(e) => setForm({ ...form, portfolioId: e.target.value })}
                required
                className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select portfolio...</option>
                {portfolios.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-text-secondary block mb-1.5">Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'buy' | 'sell' | 'dividend' })}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
                <option value="dividend">Dividend</option>
              </select>
            </div>

            <Input
              label="Date *"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />

            <Input
              label="Ticker Symbol *"
              placeholder="e.g. AAPL"
              value={form.ticker}
              onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
              required
            />

            <Input
              label="Asset Name"
              placeholder="e.g. Apple Inc."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <Input
              label="Shares *"
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={form.shares}
              onChange={(e) => setForm({ ...form, shares: e.target.value })}
              required
            />

            <Input
              label="Price per Share *"
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />

            <Input
              label="Broker Fee"
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={form.fee}
              onChange={(e) => setForm({ ...form, fee: e.target.value })}
            />

            <Input
              label="Broker / Platform"
              placeholder="e.g. Robinhood"
              value={form.broker}
              onChange={(e) => setForm({ ...form, broker: e.target.value })}
            />
          </div>

          {form.shares && form.price && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm">
              <span className="text-text-secondary">Total: </span>
              <span className="text-primary font-semibold font-mono-num">
                {formatCurrency(parseFloat(form.shares || '0') * parseFloat(form.price || '0'))}
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={submitting} className="flex-1">
              Add Transaction
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
