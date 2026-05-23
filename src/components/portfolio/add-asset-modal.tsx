'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Zap } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { debounce } from '@/lib/utils';
import type { SearchResult } from '@/types';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioId: string;
  onSuccess: () => void;
}

const ASSET_TYPES = [
  { value: 'stock',  label: 'Stock'  },
  { value: 'etf',    label: 'ETF'    },
  { value: 'crypto', label: 'Crypto' },
  { value: 'fund',   label: 'Fund'   },
];

const today = () => new Date().toISOString().split('T')[0];

export function AddAssetModal({ isOpen, onClose, portfolioId, onSuccess }: AddAssetModalProps) {
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchResults,  setSearchResults]  = useState<SearchResult[]>([]);
  const [searchLoading,  setSearchLoading]  = useState(false);
  const [selectedTicker, setSelectedTicker] = useState('');
  const [selectedName,   setSelectedName]   = useState('');
  const [assetType,      setAssetType]      = useState('stock');
  const [purchaseDate,   setPurchaseDate]   = useState(today);
  const [shares,         setShares]         = useState('');
  const [avgCost,        setAvgCost]        = useState('');
  const [priceLoading,   setPriceLoading]   = useState(false);
  const [priceAutoFilled,setPriceAutoFilled]= useState(false);
  const [broker,         setBroker]         = useState('');
  const [notes,          setNotes]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [showDropdown,   setShowDropdown]   = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchTickers = useCallback(
    debounce(async (query: string) => {
      if (!query || query.length < 1) {
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const results = await res.json();
          setSearchResults(results);
          setShowDropdown(true);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400),
    []
  );

  useEffect(() => {
    searchTickers(searchQuery);
  }, [searchQuery, searchTickers]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTicker = async (result: SearchResult) => {
    setSelectedTicker(result.symbol);
    setSelectedName(result.name);
    setSearchQuery(result.symbol);
    setAssetType(result.type || 'stock');
    setShowDropdown(false);
    setSearchResults([]);

    // Auto-fetch current price
    setPriceLoading(true);
    setPriceAutoFilled(false);
    try {
      const res = await fetch(`/api/prices?tickers=${encodeURIComponent(result.symbol)}`);
      if (res.ok) {
        const data = await res.json();
        const price = data[result.symbol]?.price;
        if (price && price > 0) {
          setAvgCost(price.toFixed(2));
          setPriceAutoFilled(true);
        }
      }
    } catch {
      // ignore — user can enter manually
    } finally {
      setPriceLoading(false);
    }
  };

  const handleClearTicker = () => {
    setSelectedTicker('');
    setSelectedName('');
    setSearchQuery('');
    setSearchResults([]);
    setAvgCost('');
    setPriceAutoFilled(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedTicker && !searchQuery) {
      setError('Please search and select a ticker');
      return;
    }

    const ticker = selectedTicker || searchQuery.toUpperCase().trim();
    const name   = selectedName   || ticker;

    if (!shares || parseFloat(shares) <= 0) {
      setError('Please enter a valid number of shares');
      return;
    }
    if (!avgCost || parseFloat(avgCost) < 0) {
      setError('Please enter a valid average cost');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId,
          ticker,
          name,
          shares:       parseFloat(shares),
          avgCost:      parseFloat(avgCost),
          purchaseDate: purchaseDate || undefined,
          broker:       broker || undefined,
          assetType,
          notes:        notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to add asset');
        return;
      }

      onSuccess();
      handleClose();
    } catch {
      setError('Failed to add asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedTicker('');
    setSelectedName('');
    setAssetType('stock');
    setPurchaseDate(today);
    setShares('');
    setAvgCost('');
    setPriceAutoFilled(false);
    setBroker('');
    setNotes('');
    setError('');
    setSearchResults([]);
    setShowDropdown(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Asset" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ticker search */}
        <div className="relative" ref={dropdownRef}>
          <label className="text-sm font-medium text-text-secondary block mb-1.5">
            Search Ticker
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {searchLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (selectedTicker) {
                  setSelectedTicker('');
                  setSelectedName('');
                  setPriceAutoFilled(false);
                }
              }}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              placeholder="Search stocks, ETFs, crypto... (e.g. AAPL, BTC-USD)"
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-9 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autoComplete="off"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearTicker}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selected ticker badge */}
          {selectedTicker && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-text-muted">Selected:</span>
              <Badge variant={assetType as 'stock' | 'crypto' | 'etf' | 'fund'}>
                {selectedTicker}
              </Badge>
              <span className="text-xs text-text-secondary">{selectedName}</span>
            </div>
          )}

          {/* Search results dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-20 top-full mt-1 w-full bg-surface-2 border border-border rounded-xl shadow-card overflow-hidden">
              {searchResults.map((result) => (
                <button
                  key={result.symbol}
                  type="button"
                  onClick={() => handleSelectTicker(result)}
                  className="flex items-center justify-between w-full px-4 py-3 hover:bg-primary/5 transition-colors text-left border-b border-border/50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{result.symbol}</p>
                    <p className="text-xs text-text-muted truncate max-w-[200px]">{result.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.exchange && (
                      <span className="text-xs text-text-muted">{result.exchange}</span>
                    )}
                    <Badge variant={result.type as 'stock' | 'crypto' | 'etf' | 'fund' | 'default'}>
                      {result.type}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Asset type */}
        <div>
          <label className="text-sm font-medium text-text-secondary block mb-1.5">Asset Type</label>
          <div className="flex gap-2">
            {ASSET_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setAssetType(type.value)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  assetType === type.value
                    ? 'bg-primary/10 border-primary/40 text-primary'
                    : 'bg-surface border-border text-text-muted hover:border-border-2'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Purchase date */}
        <div>
          <label className="text-sm font-medium text-text-secondary block mb-1.5">
            Purchase Date
          </label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            max={today()}
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Shares and avg cost */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Shares / Units"
            type="number"
            placeholder="10.5"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            step="any"
            min="0"
            required
          />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-text-secondary">Avg Cost / Unit</label>
              {priceLoading && (
                <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              )}
              {priceAutoFilled && !priceLoading && (
                <span className="flex items-center gap-1 text-xs text-primary font-medium">
                  <Zap className="w-3 h-3" />
                  Live price
                </span>
              )}
            </div>
            <input
              type="number"
              placeholder="150.00"
              value={avgCost}
              onChange={(e) => { setAvgCost(e.target.value); setPriceAutoFilled(false); }}
              step="any"
              min="0"
              required
              className={`w-full bg-surface border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                priceAutoFilled ? 'border-primary/40 bg-primary/5' : 'border-border'
              }`}
            />
          </div>
        </div>

        {/* Broker */}
        <Input
          label="Broker (optional)"
          type="text"
          placeholder="e.g. Robinhood, Fidelity"
          value={broker}
          onChange={(e) => setBroker(e.target.value)}
        />

        {/* Notes */}
        <div>
          <label className="text-sm font-medium text-text-secondary block mb-1.5">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this holding..."
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            rows={2}
          />
        </div>

        {error && <p className="text-loss text-sm">{error}</p>}

        {/* Preview */}
        {shares && avgCost && (
          <div className="bg-surface rounded-xl p-3 border border-border">
            <p className="text-xs text-text-muted mb-1">Cost basis preview</p>
            <p className="text-sm font-semibold text-text-primary">
              ${(parseFloat(shares || '0') * parseFloat(avgCost || '0')).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Add Asset
          </Button>
        </div>
      </form>
    </Modal>
  );
}
