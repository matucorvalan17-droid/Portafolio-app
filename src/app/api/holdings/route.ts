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
    const { portfolioId, ticker, name, shares, avgCost, broker, assetType, currency, notes } = body;

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

    const holding = await db.holding.create({
      data: {
        portfolioId,
        ticker: ticker.toUpperCase().trim(),
        name: name.trim(),
        shares: parseFloat(shares),
        avgCost: parseFloat(avgCost),
        broker: broker?.trim() || null,
        assetType: assetType || 'stock',
        currency: currency || portfolio.currency || 'USD',
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(holding, { status: 201 });
  } catch (error) {
    console.error('POST /api/holdings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
