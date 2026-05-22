'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Upload, Trash2, RefreshCw, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AssetTable } from '@/components/portfolio/asset-table';
import { AddAssetModal } from '@/components/portfolio/add-asset-modal';
import { EditAssetModal } from '@/components/portfolio/edit-asset-modal';
import { ImportCSVModal } from '@/components/portfolio/import-csv-modal';
import { AllocationChart } from '@/components/charts/allocation-chart';
import { Button } from '@/components/ui/button';
import { LoadingPage, Spinner } from '@/components/ui/loading';
import { formatCurrency, formatPercent, ALLOCATION_COLORS } from '@/lib/utils';
import type { Portfolio, Holding, Quote, AllocationDataPoint } from '@/types';

export default function PortfolioPage() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = params.id as string;

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);

  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await fetch(`/api/portfolios/${portfolioId}`);
      if (!res.ok) {
        router.push('/dashboard');
        return;
      }
      const data = await res.json();
      setPortfolio(data);
    } catch {
      router.push('/dashboard');
    }
  }, [portfolioId, router]);

  const fetchHoldings = useCallback(async () => {
    try {
      const res = await fetch(`/api/holdings?portfolioId=${portfolioId}`);
      if (res.ok) {
        const data = await res.json();
        setHoldings(data);
        return data as Holding[];
      }
    } catch {
      // ignore
    }
    return [];
  }, [portfolioId]);

  const fetchPrices = useCallback(async (holdingList: Holding[]) => {
    if (holdingList.length === 0) return;
    setPricesLoading(true);
    try {
      const tickers = Array.from(new Set(holdingList.map((h) => h.ticker)));
      const res = await fetch(`/api/prices?tickers=${tickers.join(',')}`);
      if (res.ok) {
        const data = await res.json();
        setQuotes(data);
      }
    } catch {
      // ignore
    } finally {
      setPricesLoading(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await fetchPortfolio();
      const h = await fetchHoldings();
      await fetchPrices(h);
    } finally {
      setLoading(false);
    }
  }, [fetchPortfolio, fetchHoldings, fetchPrices]);

  useEffect(() => {
    loadAll();
    // Auto-refresh prices every 30 seconds
    const interval = setInterval(() => {
      if (holdings.length > 0) fetchPrices(holdings);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadAll]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrices(holdings);
    setRefreshing(false);
  };

  const handleDeleteHolding = async (holding: Holding) => {
    const res = await fetch(`/api/holdings/${holding.id}`, { method: 'DELETE' });
    if (res.ok) {
      setHoldings((prev) => prev.filter((h) => h.id !== holding.id));
    }
  };

  const handleHoldingSuccess = async () => {
    const h = await fetchHoldings();
    await fetchPrices(h);
  };

  const handleDeletePortfolio = async () => {
    if (!confirm(`Delete portfolio "${portfolio?.name}"? This will remove all holdings.`)) return;
    const res = await fetch(`/api/portfolios/${portfolioId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/dashboard');
    }
  };

  // Calculate portfolio stats
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
  const isPositive = totalGainLoss >= 0;

  // Build allocation data
  const allocationData: AllocationDataPoint[] = holdings
    .map((holding, index) => {
      const quote = quotes[holding.ticker];
      const currentPrice = quote?.price ?? 0;
      const value = currentPrice > 0 ? currentPrice * holding.shares : holding.avgCost * holding.shares;
      return {
        name: holding.name,
        ticker: holding.ticker,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
        color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
      };
    })
    .sort((a, b) => b.value - a.value);

  if (loading) {
    return <LoadingPage />;
  }

  if (!portfolio) {
    return null;
  }

  return (
    <div className="animate-fade-in">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{portfolio.name}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {holdings.length} {holdings.length === 1 ? 'holding' : 'holdings'} · {portfolio.currency}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)}>
            <Upload className="w-4 h-4" />
            Import CSV
          </Button>
          <Button size="sm" onClick={() => setAddModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Asset
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDeletePortfolio} className="text-text-muted hover:text-loss hover:bg-loss/10">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Total value */}
        <div className="bg-surface border border-border rounded-2xl p-5 col-span-1 md:col-span-1 relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] opacity-10 ${isPositive ? 'bg-gain' : 'bg-loss'}`} />
          <p className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-2">Total Value</p>
          <p className="text-3xl font-bold text-text-primary font-mono-num">
            {formatCurrency(totalValue, portfolio.currency, true)}
          </p>
          <div className={`flex items-center gap-1.5 mt-2 text-sm font-medium ${isPositive ? 'text-gain' : 'text-loss'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>
              {isPositive ? '+' : ''}{formatCurrency(totalGainLoss, portfolio.currency)}
            </span>
            <span className="opacity-70">({formatPercent(totalGainLossPercent)})</span>
          </div>
        </div>

        {/* Cost basis */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-2">Cost Basis</p>
          <p className="text-3xl font-bold text-text-primary font-mono-num">
            {formatCurrency(totalCost, portfolio.currency, true)}
          </p>
          <p className="text-text-muted text-sm mt-2">Total invested</p>
        </div>

        {/* Allocation chart */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-text-secondary text-xs font-medium uppercase tracking-wider mb-3">Allocation</p>
          {holdings.length > 0 ? (
            <AllocationChart data={allocationData} currency={portfolio.currency} />
          ) : (
            <div className="flex items-center justify-center h-16 text-text-muted text-sm">
              No holdings yet
            </div>
          )}
        </div>
      </div>

      {/* Holdings table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-text-primary">Holdings</h2>
            {pricesLoading && <Spinner size="sm" />}
          </div>
          <Button size="sm" variant="ghost" onClick={() => setAddModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add
          </Button>
        </div>
        <AssetTable
          holdings={holdings}
          quotes={quotes}
          loading={pricesLoading}
          onEdit={(holding) => { setEditingHolding(holding); setEditModalOpen(true); }}
          onDelete={handleDeleteHolding}
        />
      </div>

      {/* Modals */}
      <AddAssetModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        portfolioId={portfolioId}
        onSuccess={handleHoldingSuccess}
      />

      <EditAssetModal
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditingHolding(null); }}
        holding={editingHolding}
        onSuccess={handleHoldingSuccess}
      />

      <ImportCSVModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        portfolioId={portfolioId}
        onSuccess={handleHoldingSuccess}
      />
    </div>
  );
}
