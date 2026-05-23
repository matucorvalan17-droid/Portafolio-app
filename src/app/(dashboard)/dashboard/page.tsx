'use client';
// WealthTrack — Dashboard Page
// The main overview page showing all portfolios and your total wealth.
// This page auto-refreshes prices every 30 seconds.

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, TrendingUp, Download } from 'lucide-react';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { PortfolioCard } from '@/components/dashboard/portfolio-card';
import { SkeletonCard } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { Portfolio, Holding, Quote, PortfolioWithStats } from '@/types';

export default function DashboardPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [quotes,     setQuotes]     = useState<Record<string, Quote>>({});
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newOpen,    setNewOpen]    = useState(false);
  const [formName,   setFormName]   = useState('');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [creating,   setCreating]   = useState(false);

  const fetchPortfolios = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolios');
      if (res.ok) {
        const data = await res.json();
        setPortfolios(data);
        return data as Portfolio[];
      }
    } catch { /* ignore */ }
    return [];
  }, []);

  const fetchPrices = useCallback(async (list: Portfolio[]) => {
    const tickers = Array.from(new Set(list.flatMap((p) => (p.holdings ?? []).map((h: Holding) => h.ticker))));
    if (!tickers.length) return;
    try {
      const res = await fetch(`/api/prices?tickers=${tickers.join(',')}`);
      if (res.ok) setQuotes(await res.json());
    } catch { /* ignore */ }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPortfolios();
      await fetchPrices(data);
    } finally {
      setLoading(false);
    }
  }, [fetchPortfolios, fetchPrices]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchPortfolios();
      await fetchPrices(data);
      toast.success('Prices refreshed!');
    } finally {
      setRefreshing(false);
    }
  }, [fetchPortfolios, fetchPrices]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(() => {
      if (portfolios.length) fetchPrices(portfolios);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadAll]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Compute stats for each portfolio ─────────────────────────
  const portfoliosWithStats: PortfolioWithStats[] = portfolios.map((p) => {
    const holdings = p.holdings ?? [];
    let totalValue = 0, totalCost = 0;
    for (const h of holdings) {
      const price = quotes[h.ticker]?.price ?? 0;
      totalValue += price > 0 ? price * h.shares : h.avgCost * h.shares;
      totalCost  += h.avgCost * h.shares;
    }
    const gl = totalValue - totalCost;
    return {
      ...p,
      totalValue,
      totalCost,
      totalGainLoss:        gl,
      totalGainLossPercent: totalCost > 0 ? (gl / totalCost) * 100 : 0,
      holdingsCount:        holdings.length,
    };
  });

  const grand = portfoliosWithStats.reduce(
    (acc, p) => ({ totalValue: acc.totalValue + p.totalValue, totalCost: acc.totalCost + p.totalCost, totalGainLoss: acc.totalGainLoss + p.totalGainLoss }),
    { totalValue: 0, totalCost: 0, totalGainLoss: 0 }
  );
  const grandPercent = grand.totalCost > 0 ? (grand.totalGainLoss / grand.totalCost) * 100 : 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), currency: formCurrency }),
      });
      if (res.ok) {
        const data = await res.json();
        setPortfolios((prev) => [...prev, data]);
        setNewOpen(false);
        setFormName('');
        toast.success(`Portfolio "${data.name}" created!`);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/export?type=holdings');
      if (!res.ok) { toast.error('Export failed'); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `wealthtrack-holdings-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Holdings exported!');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="animate-fade-in">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">Your complete financial overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleExport} title="Export all holdings as CSV">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <Plus className="w-4 h-4" />
            New Portfolio
          </Button>
        </div>
      </div>

      {/* ── Stats Overview ──────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="mb-8">
          <StatsOverview
            totalValue={grand.totalValue}
            totalCost={grand.totalCost}
            totalGainLoss={grand.totalGainLoss}
            totalGainLossPercent={grandPercent}
            portfolioCount={portfolios.length}
            holdingsCount={portfolios.reduce((s, p) => s + (p.holdings?.length ?? 0), 0)}
          />
        </div>
      )}

      {/* ── Portfolio Grid ───────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Your Portfolios</h2>
          <p className="text-text-secondary text-sm">
            {portfoliosWithStats.length} portfolio{portfoliosWithStats.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : portfoliosWithStats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfoliosWithStats.map((p) => (
            <PortfolioCard key={p.id} portfolio={p} />
          ))}
          {/* Add more portfolio card */}
          <button
            onClick={() => setNewOpen(true)}
            className="border-2 border-dashed border-border hover:border-primary/40 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-text-muted hover:text-primary transition-all duration-200 min-h-[140px]"
          >
            <div className="w-10 h-10 bg-surface-2 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">Add Portfolio</span>
          </button>
        </div>
      ) : (
        /* ── Empty State ──────────────────────────────────────── */
        <div className="text-center py-24">
          <div className="w-20 h-20 bg-surface-2 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-10 h-10 text-text-muted" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">No portfolios yet</h3>
          <p className="text-text-secondary text-sm mb-8 max-w-sm mx-auto">
            Create your first portfolio to start tracking your investments. You can add stocks, ETFs, crypto, and more.
          </p>
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Your First Portfolio
          </Button>
        </div>
      )}

      {/* ── New Portfolio Modal ──────────────────────────────── */}
      <Modal
        isOpen={newOpen}
        onClose={() => { setNewOpen(false); setFormName(''); }}
        title="Create New Portfolio"
        size="sm"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Portfolio name *"
            type="text"
            placeholder="e.g. Robinhood, Crypto, Retirement"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
            autoFocus
          />
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1.5">Currency</label>
            <select
              value={formCurrency}
              onChange={(e) => setFormCurrency(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="CAD">CAD — Canadian Dollar</option>
              <option value="AUD">AUD — Australian Dollar</option>
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => { setNewOpen(false); setFormName(''); }} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={creating} className="flex-1">
              Create Portfolio
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
