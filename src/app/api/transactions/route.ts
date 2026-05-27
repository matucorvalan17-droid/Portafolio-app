import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { reconcileHolding } from '@/lib/holding-reconciler';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const portfolioId = request.nextUrl.searchParams.get('portfolioId') ?? undefined;

  try {
    const transactions = await db.transaction.findMany({
      where: {
        portfolio: { userId: session.user.id },
        ...(portfolioId ? { portfolioId } : {}),
      },
      include: { portfolio: { select: { id: true, name: true } } },
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
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { portfolioId, ticker, name, type, shares, price, total, fee, date, broker, notes, assetType } = body;

    if (!portfolioId || !ticker || !type || shares == null || price == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const portfolio = await db.portfolio.findFirst({
      where: { id: portfolioId, userId: session.user.id },
    });
    if (!portfolio) return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });

    const normalizedTicker = (ticker as string).toUpperCase().trim();
    const txShares = parseFloat(shares);
    const txPrice  = parseFloat(price);
    const txFee    = parseFloat(fee) || 0;

    // Validate sell: must have enough shares
    if (type === 'sell') {
      const holding = await db.holding.findFirst({
        where: { portfolioId, ticker: normalizedTicker },
      });
      if (!holding) {
        return NextResponse.json(
          { error: `No tenés holdings de ${normalizedTicker} en este portfolio` },
          { status: 400 },
        );
      }
      if (txShares > holding.shares + 0.000001) {
        return NextResponse.json(
          { error: `Solo tenés ${holding.shares} acciones de ${normalizedTicker}` },
          { status: 400 },
        );
      }
    }

    // Persist the transaction
    const transaction = await db.transaction.create({
      data: {
        portfolioId,
        ticker: normalizedTicker,
        name:   (name as string | undefined) || normalizedTicker,
        type,
        shares: txShares,
        price:  txPrice,
        total:  parseFloat(total) || txShares * txPrice,
        fee:    txFee,
        date:   new Date(date),
        broker: (broker as string | undefined) || null,
        notes:  (notes as string | undefined) || null,
      },
      include: { portfolio: { select: { id: true, name: true } } },
    });

    // Reconcile the holding from all transactions (source of truth)
    // For buy we pass assetType so a new holding can be created with the right type
    const existing = await db.holding.findFirst({ where: { portfolioId, ticker: normalizedTicker } });
    if (!existing && type === 'buy') {
      // Pre-create the holding with assetType before reconcile
      await db.holding.create({
        data: {
          portfolioId,
          ticker:      normalizedTicker,
          name:        (name as string | undefined) || normalizedTicker,
          shares:      0,
          avgCost:     0,
          purchaseDate: new Date(date),
          broker:      (broker as string | undefined) || null,
          assetType:   (assetType as string | undefined) || 'stock',
          currency:    portfolio.currency || 'USD',
        },
      });
    }
    await reconcileHolding(portfolioId, normalizedTicker, db);

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('POST /api/transactions error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
