// WealthTrack — Holding [id] API
// GET    /api/holdings/:id  → get a single holding
// PUT    /api/holdings/:id  → update a holding (shares, avg cost, etc.)
// DELETE /api/holdings/:id  → delete a holding
// You don't need to edit this file.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

async function getHoldingForUser(id: string, userId: string) {
  return db.holding.findFirst({
    where: { id, portfolio: { userId } },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const holding = await getHoldingForUser(id, session.user.id);
    if (!holding) return NextResponse.json({ error: 'Holding not found' }, { status: 404 });
    return NextResponse.json(holding);
  } catch (error) {
    console.error('GET /api/holdings/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await getHoldingForUser(id, session.user.id);
    if (!existing) return NextResponse.json({ error: 'Holding not found' }, { status: 404 });

    const { ticker, name, shares, avgCost, broker, assetType, currency, notes } = await req.json();

    const updated = await db.holding.update({
      where: { id },
      data: {
        ...(ticker   && { ticker: ticker.toUpperCase().trim() }),
        ...(name     && { name: name.trim() }),
        ...(shares   !== undefined && { shares: parseFloat(shares) }),
        ...(avgCost  !== undefined && { avgCost: parseFloat(avgCost) }),
        broker:    broker?.trim() || null,
        ...(assetType  && { assetType }),
        ...(currency   && { currency }),
        notes:     notes?.trim() || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/holdings/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await getHoldingForUser(id, session.user.id);
    if (!existing) return NextResponse.json({ error: 'Holding not found' }, { status: 404 });

    await db.holding.delete({ where: { id } });
    return NextResponse.json({ message: 'Holding deleted' });
  } catch (error) {
    console.error('DELETE /api/holdings/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
