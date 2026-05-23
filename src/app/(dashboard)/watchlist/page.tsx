'use client';
// WealthTrack — Watchlist Page
// Track stocks you're interested in but haven't bought yet.
// Prices update every 30 seconds from Yahoo Finance.

import { useState, useEffect, useCallback } from 'react';
import { Plus, Star, Trash2, RefreshCw, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { SkeletonCard } from '@/components/ui/loading';
import { formatCurrency, formatPercent, debounce } from '@/lib/utils';
import { toast } from 'sonner';
import type { WatchlistItem, Quote, SearchResult } from '@/types';

export default function WatchlistPage() {
  const [items, setItems]           = useState<WatchlistItem[]>([]);
  const [quotes, setQuotes]         = useState<Record<string, Quote>>({});
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addOpen, setAddOpen]       = useState(false);
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState<SearchResult[]>([]);
  const [searching, setSearching]   = useState(false);
  const [selected, setSelected]     = useState<SearchResult | null>(null);
  const [notes, setNotes]           = useState('');
  const [alertPrice, setAlertPrice] = useState('');
  const [adding, setAdding]         = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch('/api/watchlist');
      if (res.ok) return await res.json() as WatchlistItem[];
    } catch { /* ignore */ }
    return [];
  }, []);

  const fetchPrices = useCallback(async (watchlist: WatchlistItem[]) => {
    if (!watchlist.length) return;
    const tickers = watchlist.map((w) => w.ticker).join(',');
    try {
      const res = await fetch(`/api/prices?tickers=${tickers}`);
      if (res.ok) setQuotes(await res.json());
    } catch { /* ignore */ }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadItems();
      setItems(data);
      await fetchPrices(data);
    } finally {
      setLoading(false);
    }
  }, [loadItems, fetchPrices]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(() => {
      if (items.length) fetchPrices(items);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadAll]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await loadItems();
      setItems(data);
      await fetchPrices(data);
    } finally {
      setRefreshing(false);
    }
  };

  const searchTickers = useCallback(
    debounce(async (q: string) => {
      if (!q.trim() || q.length < 1) { setResults([]); return; }
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) setResults(await res.json());
      } finally {
        setSearching(false);
      }
    }, 300),
    []
  );

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelected(null);
    searchTickers(val);
  };

  const handleAdd = async () => {
    if (!selected) { toast.error('Please select a ticker'); return; }
    setAdding(true);
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker:     selected.symbol,
          name:       selected.name,
          notes,
          alertPrice: alertPrice ? parseFloat(alertPrice) : null,
        }),
      });
      if (res.ok) {
        toast.success(`${selected.symbol} added to watchlist!`);
        setAddOpen(false);
        setQuery('');
        setSelected(null);
        setNotes('');
        setAlertPrice('');
        loadAll();
      } else {
        const err = await res.json();
        toast.error(err.error ?? 'Already in watchlist');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string, ticker: string) => {
    try {
      const res = await fetch(`/api/watchlist/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        toast.success(`${ticker} removed from watchlist`);
      }
    } catch { toast.error('Failed to remove'); }
  };

  if (loading) return <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Watchlist</h1>
          <p className="text-text-secondary text-sm mt-1">
            Stocks you&apos;re watching — {items.length} tracked
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />
            Add to Watchlist
          </Button>
        </div>
      </div>

      {/* Watchlist Grid */}
      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Your watchlist is empty</h3>
          <p className="text-text-secondary text-sm mb-6 max-w-xs mx-auto">
            Track stocks you&apos;re interested in without adding them to a portfolio.
          </p>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Your First Stock
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const quote = quotes[item.ticker];
            const isUp  = (quote?.changePercent ?? 0) >= 0;
            return (
              <div
                key={item.id}
                className="glass-card rounded-2xl p-5 border border-border/50 hover:border-border-2 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-text-primary font-bold text-lg">{item.ticker}</p>
                    <p className="text-text-muted text-xs truncate max-w-[180px]">{item.name}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id, item.ticker)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-loss/10 text-text-muted hover:text-loss"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {quote ? (
                  <div>
                    <p className="text-2xl font-bold text-text-primary font-mono-num mb-1">
                      {formatCurrency(quote.price)}
                    </p>
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${isUp ? 'text-gain' : 'text-loss'}`}>
                      {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {formatCurrency(quote.change)} ({formatPercent(quote.changePercent)})
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="h-7 bg-surface-2 rounded animate-pulse w-28" />
                    <div className="h-4 bg-surface-2 rounded animate-pulse w-20" />
                  </div>
                )}

                {item.alertPrice && (
                  <div className="mt-3 pt-3 border-t border-border/50 text-xs text-text-muted flex items-center gap-1.5">
                    <span className="text-warning">🔔</span>
                    Alert at {formatCurrency(item.alertPrice)}
                    {quote && (
                      <span className={quote.price >= item.alertPrice ? 'text-gain' : 'text-text-muted'}>
                        {quote.price >= item.alertPrice ? ' — Reached!' : ''}
                      </span>
                    )}
                  </div>
                )}

                {item.notes && (
                  <p className="mt-2 text-xs text-text-muted italic truncate">{item.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add to Watchlist Modal */}
      <Modal isOpen={addOpen} onClose={() => { setAddOpen(false); setQuery(''); setSelected(null); }} title="Add to Watchlist" size="sm">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search ticker or company name..."
              value={query}
              onChange={handleQueryChange}
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
          </div>

          {/* Search Results */}
          {searching && (
            <div className="text-center py-4 text-text-muted text-sm">Searching...</div>
          )}
          {results.length > 0 && !selected && (
            <div className="bg-surface-2 rounded-xl border border-border overflow-hidden max-h-48 overflow-y-auto">
              {results.map((r) => (
                <button
                  key={r.symbol}
                  onClick={() => { setSelected(r); setQuery(r.symbol); setResults([]); }}
                  className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-primary/5 transition-colors text-left"
                >
                  <div>
                    <span className="text-sm font-semibold text-text-primary">{r.symbol}</span>
                    <span className="text-xs text-text-muted ml-2 truncate max-w-[200px] inline-block">{r.name}</span>
                  </div>
                  <span className="text-xs text-text-muted">{r.exchange}</span>
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-sm">
              <span className="font-semibold text-primary">{selected.symbol}</span>
              <span className="text-text-secondary ml-2">{selected.name}</span>
            </div>
          )}

          <Input
            label="Price Alert (optional)"
            type="number"
            step="any"
            placeholder="Notify me when price reaches..."
            value={alertPrice}
            onChange={(e) => setAlertPrice(e.target.value)}
          />

          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why are you watching this?"
              rows={2}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleAdd} loading={adding} disabled={!selected} className="flex-1">
              Add to Watchlist
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
