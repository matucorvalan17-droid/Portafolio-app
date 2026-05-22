'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Holding } from '@/types';

interface EditAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  holding: Holding | null;
  onSuccess: () => void;
}

const ASSET_TYPES = [
  { value: 'stock', label: 'Stock' },
  { value: 'etf', label: 'ETF' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'fund', label: 'Fund' },
];

export function EditAssetModal({ isOpen, onClose, holding, onSuccess }: EditAssetModalProps) {
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState('stock');
  const [shares, setShares] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [broker, setBroker] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (holding) {
      setTicker(holding.ticker);
      setName(holding.name);
      setAssetType(holding.assetType);
      setShares(String(holding.shares));
      setAvgCost(String(holding.avgCost));
      setBroker(holding.broker || '');
      setNotes(holding.notes || '');
    }
  }, [holding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holding) return;
    setError('');

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
      const res = await fetch(`/api/holdings/${holding.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: ticker.trim(),
          name: name.trim(),
          shares: parseFloat(shares),
          avgCost: parseFloat(avgCost),
          broker: broker || undefined,
          assetType,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update asset');
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError('Failed to update asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!holding) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${holding.ticker}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Ticker"
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            required
          />
          <Input
            label="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Shares / Units"
            type="number"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            step="any"
            min="0"
            required
          />
          <Input
            label="Avg Cost / Unit"
            type="number"
            value={avgCost}
            onChange={(e) => setAvgCost(e.target.value)}
            step="any"
            min="0"
            required
          />
        </div>

        <Input
          label="Broker (optional)"
          type="text"
          placeholder="e.g. Robinhood, Fidelity"
          value={broker}
          onChange={(e) => setBroker(e.target.value)}
        />

        <div>
          <label className="text-sm font-medium text-text-secondary block mb-1.5">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            rows={2}
          />
        </div>

        {error && <p className="text-loss text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
