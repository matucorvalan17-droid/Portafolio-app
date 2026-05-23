import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');

    if (!portfolioId) {
      return NextResponse.json({ error: 'portfolioId is required' }, { status: 400 });
    }

    // Verify portfolio belongs to user
    const portfolio = await db.portfolio.findFirst({
      where: { id: portfolioId, userId: session.user.id },
    });

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const holdings = await db.holding.findMany({
      where: { portfolioId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(holdings);
  } catch (error) {
    console.error('GET /api/holdings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { portfolioId, ticker, name, shares, avgCost, purchaseDate, broker, assetType, currency, notes } = body;

    if (!portfolioId || !ticker || !name || shares === undefined || avgCost === undefined) {
      return NextResponse.json(
        { error: 'portfolioId, ticker, name, shares, and avgCost are required' },
        { status: 400 }
      );
    }

    // Verify portfolio belongs to user
    const portfolio = await db.portfolio.findFirst({
      where: { id: portfolioId, userId: session.user.id },
    });

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const normalizedTicker = ticker.toUpperCase().trim();
    const newShares  = parseFloat(shares);
    const newAvgCost = parseFloat(avgCost);

    // Merge with existing holding of same ticker (weighted avg cost)
    const existing = await db.holding.findFirst({
      where: { portfolioId, ticker: normalizedTicker },
    });

    let holding;
    if (existing) {
      const totalShares  = existing.shares + newShares;
      const weightedCost = (existing.shares * existing.avgCost + newShares * newAvgCost) / totalShares;
      holding = await db.holding.update({
        where: { id: existing.id },
        data: {
          shares:  totalShares,
          avgCost: weightedCost,
          // Update name/broker/notes if provided
          ...(name        && { name: name.trim() }),
          ...(broker      && { broker: broker.trim() }),
          ...(notes       && { notes: notes.trim() }),
          ...(assetType   && { assetType }),
          purchaseDate: purchaseDate ? new Date(purchaseDate) : existing.purchaseDate,
        },
      });
    } else {
      holding = await db.holding.create({
        data: {
          portfolioId,
          ticker: normalizedTicker,
          name: name.trim(),
          shares:  newShares,
          avgCost: newAvgCost,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          broker: broker?.trim() || null,
          assetType: assetType || 'stock',
          currency: currency || portfolio.currency || 'USD',
          notes: notes?.trim() || null,
        },
      });
    }

    return NextResponse.json(holding, { status: 201 });
  } catch (error) {
    console.error('POST /api/holdings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
