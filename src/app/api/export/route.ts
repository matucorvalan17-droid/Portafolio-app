// WealthTrack — CSV Export API
// GET /api/export?type=holdings     → export all holdings as CSV
// GET /api/export?type=transactions → export all transactions as CSV
// You can open the CSV files in Excel or Google Sheets.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const type = req.nextUrl.searchParams.get('type') ?? 'holdings';

  try {
    if (type === 'transactions') {
      return exportTransactions(session.user.id);
    }
    return exportHoldings(session.user.id);
  } catch (error) {
    console.error('GET /api/export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

// ── Export Holdings ───────────────────────────────────────────────────────────
async function exportHoldings(userId: string) {
  const portfolios = await db.portfolio.findMany({
    where:   { userId },
    include: { holdings: true },
    orderBy: { name: 'asc' },
  });

  const rows = ['Portfolio,Ticker,Name,Shares,Avg Cost,Asset Type,Broker,Currency,Notes'];

  for (const p of portfolios) {
    for (const h of p.holdings) {
      rows.push([
        `"${p.name}"`,
        h.ticker,
        `"${h.name}"`,
        h.shares,
        h.avgCost,
        h.assetType,
        h.broker ? `"${h.broker}"` : '',
        h.currency,
        h.notes ? `"${h.notes}"` : '',
      ].join(','));
    }
  }

  return new NextResponse(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="wealthtrack-holdings-${today()}.csv"`,
    },
  });
}

// ── Export Transactions ───────────────────────────────────────────────────────
async function exportTransactions(userId: string) {
  const transactions = await db.transaction.findMany({
    where: { portfolio: { userId } },
    include: { portfolio: { select: { name: true } } },
    orderBy: { date: 'desc' },
  });

  const rows = ['Date,Portfolio,Type,Ticker,Name,Shares,Price,Total,Fee,Broker,Notes'];

  for (const t of transactions) {
    rows.push([
      new Date(t.date).toISOString().split('T')[0],
      `"${t.portfolio.name}"`,
      t.type,
      t.ticker,
      `"${t.name}"`,
      t.shares,
      t.price,
      t.total,
      t.fee,
      t.broker ? `"${t.broker}"` : '',
      t.notes ? `"${t.notes}"` : '',
    ].join(','));
  }

  return new NextResponse(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="wealthtrack-transactions-${today()}.csv"`,
    },
  });
}

function today() {
  return new Date().toISOString().split('T')[0];
}
