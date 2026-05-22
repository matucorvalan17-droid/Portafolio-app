'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import type { CSVHolding } from '@/types';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioId: string;
  onSuccess: () => void;
}

interface ParsedRow {
  ticker: string;
  shares: number;
  avgCost: number;
  broker?: string;
  name?: string;
  assetType?: string;
  valid: boolean;
  error?: string;
}

interface ImportResult {
  ticker: string;
  success: boolean;
  error?: string;
}

function normalizeHeader(header: string): string {
  const h = header.toLowerCase().trim().replace(/[_\s-]/g, '');
  const map: Record<string, string> = {
    ticker: 'ticker',
    symbol: 'ticker',
    asset: 'ticker',
    stock: 'ticker',
    shares: 'shares',
    quantity: 'shares',
    qty: 'shares',
    units: 'shares',
    avgcost: 'avgCost',
    averagecost: 'avgCost',
    avgprice: 'avgCost',
    averageprice: 'avgCost',
    costbasis: 'avgCost',
    purchaseprice: 'avgCost',
    broker: 'broker',
    account: 'broker',
    brokerage: 'broker',
    name: 'name',
    assettype: 'assetType',
    type: 'assetType',
    category: 'assetType',
  };
  return map[h] || h;
}

export function ImportCSVModal({ isOpen, onClose, portfolioId, onSuccess }: ImportCSVModalProps) {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setImportResults([]);
    setImported(false);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
      complete: (results) => {
        const rows: ParsedRow[] = [];

        for (const row of results.data as Record<string, string>[]) {
          const ticker = (row.ticker || '').toUpperCase().trim();
          const sharesRaw = row.shares || row.units || '';
          const avgCostRaw = row.avgCost || row.cost || '';
          const broker = row.broker?.trim() || undefined;
          const name = row.name?.trim() || ticker;
          const assetType = row.assetType?.toLowerCase().trim() || 'stock';

          const shares = parseFloat(sharesRaw);
          const avgCost = parseFloat(avgCostRaw);

          if (!ticker) {
            rows.push({ ticker: '?', shares: 0, avgCost: 0, valid: false, error: 'Missing ticker' });
            continue;
          }

          if (isNaN(shares) || shares <= 0) {
            rows.push({ ticker, shares: 0, avgCost: 0, valid: false, error: 'Invalid shares' });
            continue;
          }

          if (isNaN(avgCost) || avgCost < 0) {
            rows.push({ ticker, shares, avgCost: 0, valid: false, error: 'Invalid avg cost' });
            continue;
          }

          rows.push({ ticker, shares, avgCost, broker, name, assetType, valid: true });
        }

        setParsedRows(rows);

        if (rows.length === 0) {
          setError('No valid rows found in CSV');
        }
      },
      error: () => {
        setError('Failed to parse CSV file');
      },
    });
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => r.valid);
    if (validRows.length === 0) return;

    setLoading(true);
    try {
      const holdings: CSVHolding[] = validRows.map((r) => ({
        ticker: r.ticker,
        shares: r.shares,
        avgCost: r.avgCost,
        broker: r.broker,
        name: r.name,
        assetType: r.assetType,
      }));

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioId, holdings }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Import failed');
        return;
      }

      const data = await res.json();
      setImportResults(data.results);
      setImported(true);

      if (data.successCount > 0) {
        onSuccess();
      }
    } catch {
      setError('Import failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setParsedRows([]);
    setImportResults([]);
    setImported(false);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const validCount = parsedRows.filter((r) => r.valid).length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import from CSV" size="xl">
      <div className="space-y-5">
        {/* Instructions */}
        <div className="bg-surface rounded-xl p-4 border border-border">
          <p className="text-text-secondary text-sm font-medium mb-2">CSV Format</p>
          <p className="text-text-muted text-xs mb-2">
            Upload a CSV file with these columns (header names are flexible):
          </p>
          <div className="font-mono text-xs bg-background rounded-lg p-3 text-text-secondary border border-border/50">
            <p>ticker, shares, avgCost, broker (optional), name (optional), assetType (optional)</p>
            <p className="mt-1 text-text-muted">AAPL, 10, 150.00, Robinhood, Apple Inc., stock</p>
            <p className="text-text-muted">BTC-USD, 0.5, 40000, Coinbase, Bitcoin, crypto</p>
          </div>
        </div>

        {/* File upload */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed border-border hover:border-primary/40 rounded-xl transition-colors group"
          >
            <div className="w-12 h-12 bg-surface-2 group-hover:bg-primary/10 rounded-xl flex items-center justify-center transition-colors">
              <Upload className="w-6 h-6 text-text-muted group-hover:text-primary transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-text-primary text-sm font-medium">Click to upload CSV</p>
              <p className="text-text-muted text-xs mt-0.5">Supports comma and semicolon delimiters</p>
            </div>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-loss text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Preview table */}
        {parsedRows.length > 0 && !imported && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-text-primary">
                Preview ({validCount} valid, {parsedRows.length - validCount} invalid)
              </p>
            </div>
            <div className="border border-border rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface/80 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs text-text-muted font-medium">Ticker</th>
                    <th className="text-right px-3 py-2 text-xs text-text-muted font-medium">Shares</th>
                    <th className="text-right px-3 py-2 text-xs text-text-muted font-medium">Avg Cost</th>
                    <th className="text-left px-3 py-2 text-xs text-text-muted font-medium">Broker</th>
                    <th className="px-3 py-2 text-xs text-text-muted font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, i) => (
                    <tr key={i} className={`border-t border-border/40 ${!row.valid ? 'opacity-60' : ''}`}>
                      <td className="px-3 py-2 text-text-primary font-medium">{row.ticker}</td>
                      <td className="px-3 py-2 text-right text-text-secondary">{row.valid ? row.shares : '—'}</td>
                      <td className="px-3 py-2 text-right text-text-secondary">{row.valid ? `$${row.avgCost}` : '—'}</td>
                      <td className="px-3 py-2 text-text-muted text-xs">{row.broker || '—'}</td>
                      <td className="px-3 py-2">
                        {row.valid ? (
                          <CheckCircle className="w-4 h-4 text-gain" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <XCircle className="w-4 h-4 text-loss" />
                            <span className="text-loss text-xs">{row.error}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import results */}
        {imported && importResults.length > 0 && (
          <div>
            <p className="text-sm font-medium text-text-primary mb-3">Import Results</p>
            <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {importResults.map((result, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 last:border-0"
                >
                  <span className="text-sm text-text-primary font-medium">{result.ticker}</span>
                  {result.success ? (
                    <div className="flex items-center gap-1.5 text-gain text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Imported
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-loss text-sm">
                      <XCircle className="w-4 h-4" />
                      {result.error || 'Failed'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            {imported ? 'Done' : 'Cancel'}
          </Button>
          {!imported && (
            <Button
              type="button"
              onClick={handleImport}
              loading={loading}
              disabled={validCount === 0}
              className="flex-1"
            >
              Import {validCount > 0 ? `${validCount} Holdings` : ''}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
