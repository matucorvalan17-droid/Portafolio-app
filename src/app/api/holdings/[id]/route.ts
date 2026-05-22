import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

async function getHoldingForUser(id: string, userId: string) {
  return db.holding.findFirst({
    where: {
      id,
      portfolio: { userId },
    },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const holding = await getHoldingForUser(params.id, session.user.id);
    if (!holding) {
      return NextResponse.json({ error: 'Holding not found' }, { status: 404 });
    }

    return NextResponse.json(holding);
  } catch (error) {
    console.error('GET /api/holdings/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await getHoldingForUser(params.id, session.user.id);
    if (!existing) {
      return NextResponse.json({ error: 'Holding not found' }, { status: 404 });
    }

    const body = await request.json();
    const { ticker, name, shares, avgCost, broker, assetType, currency, notes } = body;

    const updated = await db.holding.update({
      where: { id: params.id },
      data: {
        ...(ticker && { ticker: ticker.toUpperCase().trim() }),
        ...(name && { name: name.trim() }),
        ...(shares !== undefined && { shares: parseFloat(shares) }),
        ...(avgCost !== undefined && { avgCost: parseFloat(avgCost) }),
        broker: broker?.trim() || null,
        ...(assetType && { assetType }),
        ...(currency && { currency }),
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/holdings/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await getHoldingForUser(params.id, session.user.id);
    if (!existing) {
      return NextResponse.json({ error: 'Holding not found' }, { status: 404 });
    }

    await db.holding.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Holding deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/holdings/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
