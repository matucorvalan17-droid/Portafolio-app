// WealthTrack — Transactions API
// GET  /api/transactions  → returns all transactions for the logged-in user
// POST /api/transactions  → creates a new transaction record
// You don't need to edit this file.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const portfolioId = request.nextUrl.searchParams.get('portfolioId') ?? undefined;

  try {
    const transactions = await db.transaction.findMany({
      where: {
        portfolio: { userId: session.user.id },
        ...(portfolioId ? { portfolioId } : {}),
      },
      include: {
        portfolio: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('GET /api/transactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { portfolioId, ticker, name, type, shares, price, total, fee, date, broker, notes } = body;

    if (!portfolioId || !ticker || !type || shares == null || price == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Make sure this portfolio belongs to the current user
    const portfolio = await db.portfolio.findFirst({
      where: { id: portfolioId, userId: session.user.id },
    });
    if (!portfolio) return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });

    const transaction = await db.transaction.create({
      data: {
        portfolioId,
        ticker:  ticker.toUpperCase(),
        name:    name || ticker.toUpperCase(),
        type,
        shares:  parseFloat(shares),
        price:   parseFloat(price),
        total:   parseFloat(total) || parseFloat(shares) * parseFloat(price),
        fee:     parseFloat(fee) || 0,
        date:    new Date(date),
        broker:  broker || null,
        notes:   notes || null,
      },
      include: {
        portfolio: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('POST /api/transactions error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
