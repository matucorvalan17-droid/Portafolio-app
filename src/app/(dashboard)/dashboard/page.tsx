'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, TrendingUp } from 'lucide-react';
import { TotalValueCard } from '@/components/dashboard/total-value-card';
import { PortfolioCard } from '@/components/dashboard/portfolio-card';
import { SkeletonCard } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import type { Portfolio, Holding, Quote, PortfolioWithStats } from '@/types';

export default function DashboardPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newPortfolioOpen, setNewPortfolioOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioCurrency, setNewPortfolioCurrency] = useState('USD');
  const [creating, setCreating] = useState(false);

  const fetchPortfolios = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolios');
      if (res.ok) {
        const data = await res.json();
        setPortfolios(data);
        return data as Portfolio[];
      }
    } catch {
      // ignore
    }
    return [];
  }, []);

  const fetchPrices = useCallback(async (portfolioList: Portfolio[]) => {
    const allHoldings = portfolioList.flatMap((p) => p.holdings || []);
    const tickers = Array.from(new Set(allHoldings.map((h: Holding) => h.ticker)));

    if (tickers.length === 0) return;

    try {
      const res = await fetch(`/api/prices?tickers=${tickers.join(',')}`);
      if (res.ok) {
        const data = await res.json();
        setQuotes(data);
      }
    } catch {
      // ignore
    }
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
    } finally {
      setRefreshing(false);
    }
  }, [fetchPortfolios, fetchPrices]);

  useEffect(() => {
    loadAll();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchPrices(portfolios);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadAll]); // eslint-disable-line react-hooks/exhaustive-deps

  const portfoliosWithStats: PortfolioWithStats[] = portfolios.map((portfolio) => {
    const holdings = portfolio.holdings || [];
    let totalValue = 0;
    let totalCost = 0;

    for (const holding of holdings) {
      const quote = quotes[holding.ticker];
      const currentPrice = quote?.price ?? 0;
      totalValue += currentPrice > 0 ? currentPrice * holding.shares : holding.avgCost * holding.shares;
      totalCost += holding.avgCost * holding.shares;
    }

    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return {
      ...portfolio,
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      holdingsCount: holdings.length,
    };
  });

  const dashboardStats = portfoliosWithStats.reduce(
    (acc, p) => ({
      totalValue: acc.totalValue + p.totalValue,
      totalCost: acc.totalCost + p.totalCost,
      totalGainLoss: acc.totalGainLoss + p.totalGainLoss,
    }),
    { totalValue: 0, totalCost: 0, totalGainLoss: 0 }
  );

  const totalGainLossPercent =
    dashboardStats.totalCost > 0
      ? (dashboardStats.totalGainLoss / dashboardStats.totalCost) * 100
      : 0;

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolioName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPortfolioName.trim(), currency: newPortfolioCurrency }),
      });
      if (res.ok) {
        const data = await res.json();
        setPortfolios((prev) => [...prev, data]);
        setNewPortfolioOpen(false);
        setNewPortfolioName('');
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">Your complete financial overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button size="sm" onClick={() => setNewPortfolioOpen(true)}>
            <Plus className="w-4 h-4" />
            New Portfolio
          </Button>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <SkeletonCard />
      ) : (
        <div className="mb-8">
          <TotalValueCard
            totalValue={dashboardStats.totalValue}
            totalCost={dashboardStats.totalCost}
            totalGainLoss={dashboardStats.totalGainLoss}
            totalGainLossPercent={totalGainLossPercent}
          />
        </div>
      )}

      {/* Portfolios grid */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-text-primary mb-1">Portfolios</h2>
        <p className="text-text-secondary text-sm">
          {portfoliosWithStats.length} portfolio{portfoliosWithStats.length !== 1 ? 's' : ''} tracked
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : portfoliosWithStats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfoliosWithStats.map((portfolio) => (
            <PortfolioCard key={portfolio.id} portfolio={portfolio} />
          ))}
          {/* Add portfolio card */}
          <button
            onClick={() => setNewPortfolioOpen(true)}
            className="border-2 border-dashed border-border hover:border-primary/40 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-text-muted hover:text-primary transition-all duration-200 min-h-[140px]"
          >
            <div className="w-10 h-10 bg-surface-2 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">Add Portfolio</span>
          </button>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-surface-2 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-10 h-10 text-text-muted" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">No portfolios yet</h3>
          <p className="text-text-secondary text-sm mb-8 max-w-sm mx-auto">
            Create your first portfolio to start tracking your investments
          </p>
          <Button onClick={() => setNewPortfolioOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Portfolio
          </Button>
        </div>
      )}

      {/* New Portfolio Modal */}
      <Modal
        isOpen={newPortfolioOpen}
        onClose={() => { setNewPortfolioOpen(false); setNewPortfolioName(''); }}
        title="New Portfolio"
        size="sm"
      >
        <form onSubmit={handleCreatePortfolio} className="space-y-4">
          <Input
            label="Portfolio name"
            type="text"
            placeholder="e.g. Robinhood, Crypto, Retirement"
            value={newPortfolioName}
            onChange={(e) => setNewPortfolioName(e.target.value)}
            required
            autoFocus
          />
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1.5">Currency</label>
            <select
              value={newPortfolioCurrency}
              onChange={(e) => setNewPortfolioCurrency(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="JPY">JPY - Japanese Yen</option>
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setNewPortfolioOpen(false); setNewPortfolioName(''); }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" loading={creating} className="flex-1">
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
