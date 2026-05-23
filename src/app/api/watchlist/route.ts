// WealthTrack — Watchlist API
// GET    /api/watchlist       → list all watchlist items for current user
// POST   /api/watchlist       → add a ticker to watchlist
// You don't need to edit this file.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const items = await db.watchlistItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /api/watchlist error:', error);
    return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { ticker, name, notes, alertPrice } = await req.json();

    if (!ticker) return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });

    const item = await db.watchlistItem.create({
      data: {
        userId:     session.user.id,
        ticker:     ticker.toUpperCase(),
        name:       name || ticker.toUpperCase(),
        notes:      notes || null,
        alertPrice: alertPrice ? parseFloat(alertPrice) : null,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: unknown) {
    // Unique constraint = already in watchlist
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Already in your watchlist' }, { status: 409 });
    }
    console.error('POST /api/watchlist error:', error);
    return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
  }
}
