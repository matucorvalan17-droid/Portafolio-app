'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Zap, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { debounce } from '@/lib/utils';
import type { SearchResult, Portfolio } from '@/types';

interface AddTransactionModalProps {
  isOpen:       boolean;
  onClose:      () => void;
  portfolioId?: string;          // optional — if omitted, a selector is shown
  portfolios?:  Portfolio[];     // list to pick from when portfolioId not set
  onSuccess:    () => void;
}

const TYPES = [
  { value: 'buy',      label: 'Compra',    icon: <TrendingUp   className="w-3.5 h-3.5" />, color: 'border-gain/40  bg-gain/10  text-gain'  },
  { value: 'sell',     label: 'Venta',     icon: <TrendingDown className="w-3.5 h-3.5" />, color: 'border-loss/40  bg-loss/10  text-loss'  },
  { value: 'dividend', label: 'Dividendo', icon: <DollarSign   className="w-3.5 h-3.5" />, color: 'border-primary/40 bg-primary/10 text-primary' },
];

const ASSET_TYPES = [
  { value: 'stock',  label: 'Stock'  },
  { value: 'etf',    label: 'ETF'    },
  { value: 'crypto', label: 'Crypto' },
  { value: 'fund',   label: 'Fund'   },
];

const today = () => new Date().toISOString().split('T')[0];

export function AddTransactionModal({ isOpen, onClose, portfolioId: fixedPortfolioId, portfolios, onSuccess }: AddTransactionModalProps) {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(fixedPortfolioId ?? '');
  const [txType,         setTxType]         = useState('buy');
  const [searchQuery,    setSearchQuery]     = useState('');
  const [searchResults,  setSearchResults]   = useState<SearchResult[]>([]);
  const [searchLoading,  setSearchLoading]   = useState(false);
  const [selectedTicker, setSelectedTicker]  = useState('');
  const [selectedName,   setSelectedName]    = useState('');
  const [assetType,      setAssetType]       = useState('stock');
  const [date,           setDate]            = useState(today);
  const [shares,         setShares]          = useState('');
  const [price,          setPrice]           = useState('');
  const [priceLoading,   setPriceLoading]    = useState(false);
  const [priceAutoFilled,setPriceAutoFilled] = useState(false);
  const [fee,            setFee]             = useState('');
  const [broker,         setBroker]          = useState('');
  const [notes,          setNotes]           = useState('');
  const [loading,        setLoading]         = useState(false);
  const [error,          setError]           = useState('');
  const [showDropdown,   setShowDropdown]    = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchTickers = useCallback(
    debounce(async (query: string) => {
      if (!query || query.length < 1) { setSearchResults([]); setSearchLoading(false); return; }
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) { setSearchResults(await res.json()); setShowDropdown(true); }
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 400),
    [],
  );

  useEffect(() => { searchTickers(searchQuery); }, [searchQuery, searchTickers]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectTicker = async (result: SearchResult) => {
    setSelectedTicker(result.symbol);
    setSelectedName(result.name);
    setSearchQuery(result.symbol);
    setAssetType(result.type || 'stock');
    setShowDropdown(false);
    setSearchResults([]);

    setPriceLoading(true);
    setPriceAutoFilled(false);
    try {
      const res = await fetch(`/api/prices?tickers=${encodeURIComponent(result.symbol)}`);
      if (res.ok) {
        const data = await res.json();
        const livePrice = data[result.symbol]?.price;
        if (livePrice && livePrice > 0) { setPrice(livePrice.toFixed(2)); setPriceAutoFilled(true); }
      }
    } catch { /* ignore */ }
    finally { setPriceLoading(false); }
  };

  const reset = () => {
    setSelectedPortfolioId(fixedPortfolioId ?? '');
    setTxType('buy'); setSearchQuery(''); setSelectedTicker(''); setSelectedName('');
    setAssetType('stock'); setDate(today); setShares(''); setPrice('');
    setPriceAutoFilled(false); setFee(''); setBroker(''); setNotes(''); setError('');
    setSearchResults([]); setShowDropdown(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const portfolioId = fixedPortfolioId || selectedPortfolioId;
    if (!portfolioId) { setError('Seleccioná un portfolio'); return; }
    const ticker = selectedTicker || searchQuery.toUpperCase().trim();
    if (!ticker) { setError('Seleccioná un ticker'); return; }
    if (!shares || parseFloat(shares) <= 0) { setError('Ingresá una cantidad válida'); return; }
    if (!price  || parseFloat(price)  <  0) { setError('Ingresá un precio válido');    return; }

    setLoading(true);
    try {
      const txShares = parseFloat(shares);
      const txPrice  = parseFloat(price);
      const txFee    = parseFloat(fee) || 0;

      const res = await fetch('/api/transactions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId: fixedPortfolioId || selectedPortfolioId,
          ticker,
          name:      selectedName || ticker,
          type:      txType,
          shares:    txShares,
          price:     txPrice,
          total:     txShares * txPrice,
          fee:       txFee,
          date:      date || today(),
          broker:    broker || undefined,
          notes:     notes || undefined,
          assetType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al registrar la operación');
        return;
      }

      onSuccess();
      handleClose();
    } catch {
      setError('Error al registrar la operación. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const txShares = parseFloat(shares) || 0;
  const txPrice  = parseFloat(price)  || 0;
  const txFee    = parseFloat(fee)    || 0;
  const total    = txShares * txPrice + (txType === 'buy' ? txFee : -txFee);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar Operación" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Portfolio selector — only shown when not pre-set */}
        {!fixedPortfolioId && portfolios && portfolios.length > 0 && (
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1.5">Portfolio</label>
            <select
              value={selectedPortfolioId}
              onChange={(e) => setSelectedPortfolioId(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Seleccioná un portfolio…</option>
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Transaction type */}
        <div className="flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => { setTxType(t.value); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl border-2 flex items-center justify-center gap-1.5 transition-all ${
                txType === t.value
                  ? t.color
                  : 'border-border bg-surface text-text-muted hover:border-border/80'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Ticker search */}
        <div className="relative" ref={dropdownRef}>
          <label className="text-sm font-medium text-text-secondary block mb-1.5">Ticker</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {searchLoading
                ? <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                : <Search className="w-4 h-4" />}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (selectedTicker) { setSelectedTicker(''); setSelectedName(''); setPriceAutoFilled(false); }
              }}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              placeholder="AAPL, BTC-USD, SPY…"
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-9 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autoComplete="off"
            />
            {searchQuery && (
              <button type="button" onClick={() => { setSearchQuery(''); setSelectedTicker(''); setSelectedName(''); setPriceAutoFilled(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {selectedTicker && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-text-muted">Seleccionado:</span>
              <Badge variant={assetType as 'stock' | 'crypto' | 'etf' | 'fund'}>{selectedTicker}</Badge>
            </div>
          )}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-20 top-full mt-1 w-full bg-surface-2 border border-border rounded-xl shadow-card overflow-hidden">
              {searchResults.map((r) => (
                <button key={r.symbol} type="button" onClick={() => handleSelectTicker(r)}
                  className="flex items-center justify-between w-full px-4 py-3 hover:bg-primary/5 transition-colors text-left border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{r.symbol}</p>
                    <p className="text-xs text-text-muted truncate max-w-[200px]">{r.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.exchange && <span className="text-xs text-text-muted">{r.exchange}</span>}
                    <Badge variant={r.type as 'stock' | 'crypto' | 'etf' | 'fund' | 'default'}>{r.type}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Name */}
        <Input label="Nombre del activo" type="text" placeholder="e.g. S&P 500 ETF"
          value={selectedName} onChange={(e) => setSelectedName(e.target.value)} />

        {/* Asset type — only relevant for buys (creates holding) */}
        {txType === 'buy' && (
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1.5">Tipo de activo</label>
            <div className="flex gap-2">
              {ASSET_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => setAssetType(t.value)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    assetType === t.value
                      ? 'bg-primary/10 border-primary/40 text-primary'
                      : 'bg-surface border-border text-text-muted hover:border-border/80'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date */}
        <div>
          <label className="text-sm font-medium text-text-secondary block mb-1.5">Fecha</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={today()}
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
        </div>

        {/* Shares + Price */}
        <div className="grid grid-cols-2 gap-3">
          <Input label={txType === 'dividend' ? 'Cantidad (opcional)' : 'Acciones / Unidades'}
            type="number" placeholder="10.5" value={shares}
            onChange={(e) => setShares(e.target.value)} step="any" min="0"
            required={txType !== 'dividend'} />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-text-secondary">
                {txType === 'dividend' ? 'Total recibido' : 'Precio / Unidad'}
              </label>
              {priceLoading && <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
              {priceAutoFilled && !priceLoading && (
                <span className="flex items-center gap-1 text-xs text-primary font-medium">
                  <Zap className="w-3 h-3" /> Live
                </span>
              )}
            </div>
            <input type="number" placeholder="150.00" value={price}
              onChange={(e) => { setPrice(e.target.value); setPriceAutoFilled(false); }}
              step="any" min="0" required
              className={`w-full bg-surface border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                priceAutoFilled ? 'border-primary/40 bg-primary/5' : 'border-border'}`} />
          </div>
        </div>

        {/* Fee */}
        {txType !== 'dividend' && (
          <Input label="Comisión / Fee (opcional)" type="number" placeholder="0.00"
            value={fee} onChange={(e) => setFee(e.target.value)} step="any" min="0" />
        )}

        {/* Broker */}
        <Input label="Broker (opcional)" type="text" placeholder="Robinhood, Binance…"
          value={broker} onChange={(e) => setBroker(e.target.value)} />

        {/* Preview */}
        {txShares > 0 && txPrice > 0 && (
          <div className={`rounded-xl p-3 border ${
            txType === 'buy'
              ? 'bg-loss/5 border-loss/20'
              : txType === 'sell'
              ? 'bg-gain/5 border-gain/20'
              : 'bg-primary/5 border-primary/20'
          }`}>
            <p className="text-xs text-text-muted mb-1">
              {txType === 'buy' ? 'Total a pagar' : txType === 'sell' ? 'Total a recibir' : 'Total dividendo'}
            </p>
            <p className={`text-sm font-bold ${txType === 'buy' ? 'text-loss' : 'text-gain'}`}>
              ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {txFee > 0 && (
              <p className="text-xs text-text-muted mt-0.5">
                {txType === 'buy' ? `incluye $${txFee.toFixed(2)} de comisión` : `menos $${txFee.toFixed(2)} de comisión`}
              </p>
            )}
          </div>
        )}

        {error && <p className="text-loss text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Confirmar operación</Button>
        </div>
      </form>
    </Modal>
  );
}
