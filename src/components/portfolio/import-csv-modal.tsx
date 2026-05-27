'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, CheckCircle, XCircle, AlertCircle, ChevronDown, Copy, Check, FileSpreadsheet } from 'lucide-react';
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
  const h = header.toLowerCase().trim().replace(/[_\s\-\.]/g, '');
  const map: Record<string, string> = {
    ticker:        'ticker',
    symbol:        'ticker',
    asset:         'ticker',
    stock:         'ticker',
    codigo:        'ticker',
    activo:        'ticker',
    shares:        'shares',
    quantity:      'shares',
    qty:           'shares',
    units:         'shares',
    cantidad:      'shares',
    acciones:      'shares',
    unidades:      'shares',
    avgcost:       'avgCost',
    averagecost:   'avgCost',
    avgprice:      'avgCost',
    averageprice:  'avgCost',
    costbasis:     'avgCost',
    purchaseprice: 'avgCost',
    preciopromedio:'avgCost',
    costobase:     'avgCost',
    preciodecompra:'avgCost',
    broker:        'broker',
    account:       'broker',
    brokerage:     'broker',
    cuenta:        'broker',
    name:          'name',
    nombre:        'name',
    assettype:     'assetType',
    type:          'assetType',
    category:      'assetType',
    tipo:          'assetType',
  };
  return map[h] || h;
}

function rowsFromData(data: Record<string, string>[]): ParsedRow[] {
  const rows: ParsedRow[] = [];
  for (const row of data) {
    const ticker    = (row.ticker || '').toUpperCase().trim();
    const sharesRaw = row.shares || row.units || '';
    const avgCostRaw= row.avgCost || row.cost || '';
    const broker    = row.broker?.trim()    || undefined;
    const name      = row.name?.trim()      || ticker;
    const assetType = row.assetType?.toLowerCase().trim() || 'stock';

    const shares  = parseFloat(sharesRaw);
    const avgCost = parseFloat(avgCostRaw.toString().replace(',', '.'));

    if (!ticker) {
      rows.push({ ticker: '?', shares: 0, avgCost: 0, valid: false, error: 'Falta ticker' });
      continue;
    }
    if (isNaN(shares) || shares <= 0) {
      rows.push({ ticker, shares: 0, avgCost: 0, valid: false, error: 'Acciones inválidas' });
      continue;
    }
    if (isNaN(avgCost) || avgCost < 0) {
      rows.push({ ticker, shares, avgCost: 0, valid: false, error: 'Costo inválido' });
      continue;
    }
    rows.push({ ticker, shares, avgCost, broker, name, assetType, valid: true });
  }
  return rows;
}

const AI_PROMPT = `Necesito que conviertas un archivo de mi broker a un CSV con este formato exacto:

ticker,shares,avgCost,broker,name,assetType

Definiciones:
- ticker: símbolo del activo (AAPL, BTC-USD, SPY, MELI, etc.)
- shares: cantidad de acciones/unidades (número decimal, ej: 10.5)
- avgCost: precio promedio de compra por acción en USD (número decimal, ej: 150.30)
- broker: nombre del broker (opcional)
- name: nombre del activo (opcional, ej: "Apple Inc.")
- assetType: "stock", "etf", "crypto" o "fund" (opcional, default: stock)

Reglas:
1. Solo incluí posiciones activas (shares > 0)
2. Usá punto como separador decimal (no coma)
3. No incluyas el símbolo $ en los números
4. La primera fila debe ser el encabezado exacto: ticker,shares,avgCost,broker,name,assetType
5. Respondé SOLO con el contenido del CSV, sin explicaciones ni bloques de código

Acá te pego el contenido de mi archivo de broker:

[PEGAR AQUÍ EL CONTENIDO DE TU ARCHIVO O COPIAR/PEGAR LA TABLA]`;

export function ImportCSVModal({ isOpen, onClose, portfolioId, onSuccess }: ImportCSVModalProps) {
  const [parsedRows,    setParsedRows]    = useState<ParsedRow[]>([]);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [imported,      setImported]      = useState(false);
  const [error,         setError]         = useState('');
  const [fileName,      setFileName]      = useState('');
  const [promptOpen,    setPromptOpen]    = useState(false);
  const [copied,        setCopied]        = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseRows = (data: Record<string, string>[]) => {
    const rows = rowsFromData(data);
    setParsedRows(rows);
    if (rows.length === 0) setError('No se encontraron filas válidas en el archivo');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setImportResults([]);
    setImported(false);
    setFileName(file.name);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const wb   = XLSX.read(ev.target?.result, { type: 'array' });
          const ws   = wb.Sheets[wb.SheetNames[0]];
          const raw  = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
          // Normalize headers
          const normalized = raw.map((row) => {
            const out: Record<string, string> = {};
            for (const [k, v] of Object.entries(row)) {
              out[normalizeHeader(k)] = String(v);
            }
            return out;
          });
          parseRows(normalized);
        } catch {
          setError('No se pudo leer el archivo Excel');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: normalizeHeader,
        complete: (results) => parseRows(results.data),
        error: () => setError('No se pudo leer el archivo CSV'),
      });
    }
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => r.valid);
    if (validRows.length === 0) return;

    setLoading(true);
    try {
      const holdings: CSVHolding[] = validRows.map((r) => ({
        ticker:    r.ticker,
        shares:    r.shares,
        avgCost:   r.avgCost,
        broker:    r.broker,
        name:      r.name,
        assetType: r.assetType,
      }));

      const res = await fetch('/api/import', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ portfolioId, holdings }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al importar');
        return;
      }

      const data = await res.json();
      setImportResults(data.results);
      setImported(true);
      if (data.successCount > 0) onSuccess();
    } catch {
      setError('Error al importar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setParsedRows([]);
    setImportResults([]);
    setImported(false);
    setError('');
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(AI_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const validCount   = parsedRows.filter((r) => r.valid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar posiciones" size="xl">
      <div className="space-y-4">

        {/* AI Prompt helper — collapsible */}
        <div className="border border-primary/20 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setPromptOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-primary/5 hover:bg-primary/8 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                <span className="text-primary text-xs font-bold">AI</span>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">¿Tenés el archivo del broker pero no está en el formato correcto?</p>
                <p className="text-xs text-text-muted">Copiá este prompt, pegalo en ChatGPT o Claude con tu archivo y listo</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ml-3 ${promptOpen ? 'rotate-180' : ''}`} />
          </button>

          {promptOpen && (
            <div className="px-4 pb-4 pt-3 space-y-3 border-t border-primary/15">
              <div className="relative">
                <pre className="text-xs text-text-secondary font-mono bg-background rounded-xl p-3 border border-border overflow-y-auto max-h-52 whitespace-pre-wrap leading-relaxed">
                  {AI_PROMPT}
                </pre>
              </div>
              <Button variant="outline" size="sm" onClick={copyPrompt} className="w-full gap-2">
                {copied
                  ? <><Check className="w-3.5 h-3.5 text-gain" /> ¡Copiado!</>
                  : <><Copy className="w-3.5 h-3.5" /> Copiar prompt</>}
              </Button>
              <p className="text-xs text-text-muted text-center">
                Pegá el resultado de la IA directamente como archivo <span className="text-text-secondary">.csv</span> o copiá el texto y guardalo con extensión .csv
              </p>
            </div>
          )}
        </div>

        {/* Format reference */}
        <div className="bg-surface rounded-xl px-4 py-3 border border-border">
          <p className="text-xs text-text-muted mb-1.5 font-medium">Formato requerido:</p>
          <code className="text-xs text-text-secondary font-mono">
            ticker, shares, avgCost, broker<span className="text-text-muted"> (opcional)</span>, name<span className="text-text-muted"> (opcional)</span>, assetType<span className="text-text-muted"> (opcional)</span>
          </code>
          <p className="text-xs text-text-muted mt-1 font-mono">AAPL, 10, 150.00, Robinhood, Apple Inc., stock</p>
        </div>

        {/* File upload */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-3 py-7 border-2 border-dashed border-border hover:border-primary/40 rounded-2xl transition-colors group"
          >
            <div className="w-11 h-11 bg-surface-2 group-hover:bg-primary/10 rounded-xl flex items-center justify-center transition-colors">
              {fileName
                ? <FileSpreadsheet className="w-5 h-5 text-primary" />
                : <Upload className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />}
            </div>
            <div className="text-center">
              {fileName
                ? <p className="text-text-primary text-sm font-medium">{fileName}</p>
                : <p className="text-text-primary text-sm font-medium">Subir archivo</p>}
              <p className="text-text-muted text-xs mt-0.5">CSV, Excel (.xlsx) o .txt — comas o puntos y coma</p>
            </div>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-loss text-sm bg-loss/5 border border-loss/20 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Preview table */}
        {parsedRows.length > 0 && !imported && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-text-primary">
                Vista previa
              </p>
              <div className="flex items-center gap-2 text-xs">
                {validCount > 0 && <span className="text-gain">{validCount} válidas</span>}
                {invalidCount > 0 && <span className="text-loss">{invalidCount} con error</span>}
              </div>
            </div>
            <div className="border border-border rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs text-text-muted font-medium">Ticker</th>
                    <th className="text-right px-3 py-2 text-xs text-text-muted font-medium">Acciones</th>
                    <th className="text-right px-3 py-2 text-xs text-text-muted font-medium">Precio prom.</th>
                    <th className="text-left px-3 py-2 text-xs text-text-muted font-medium">Broker</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, i) => (
                    <tr key={i} className={`border-t border-border/40 ${!row.valid ? 'opacity-50' : ''}`}>
                      <td className="px-3 py-2 text-text-primary font-medium">{row.ticker}</td>
                      <td className="px-3 py-2 text-right text-text-secondary font-mono-num">{row.valid ? row.shares : '—'}</td>
                      <td className="px-3 py-2 text-right text-text-secondary font-mono-num">{row.valid ? `$${row.avgCost}` : '—'}</td>
                      <td className="px-3 py-2 text-text-muted text-xs">{row.broker || '—'}</td>
                      <td className="px-3 py-2 text-center">
                        {row.valid
                          ? <CheckCircle className="w-4 h-4 text-gain mx-auto" />
                          : <div className="flex items-center gap-1 justify-center">
                              <XCircle className="w-4 h-4 text-loss shrink-0" />
                              <span className="text-loss text-xs">{row.error}</span>
                            </div>}
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
            <p className="text-sm font-medium text-text-primary mb-2">Resultado</p>
            <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {importResults.map((result, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 last:border-0">
                  <span className="text-sm text-text-primary font-medium">{result.ticker}</span>
                  {result.success
                    ? <div className="flex items-center gap-1.5 text-gain text-sm"><CheckCircle className="w-4 h-4" /> Importado</div>
                    : <div className="flex items-center gap-1.5 text-loss text-sm"><XCircle className="w-4 h-4" />{result.error || 'Error'}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            {imported ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!imported && (
            <Button
              type="button"
              onClick={handleImport}
              loading={loading}
              disabled={validCount === 0}
              className="flex-1"
            >
              Importar {validCount > 0 ? `${validCount} activos` : ''}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
