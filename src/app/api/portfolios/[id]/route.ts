// WealthTrack — Portfolio [id] API
// GET    /api/portfolios/:id  → get a single portfolio with its holdings
// PUT    /api/portfolios/:id  → update portfolio name/description/currency
// DELETE /api/portfolios/:id  → delete portfolio and all its holdings
// You don't need to edit this file.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

async function getPortfolioForUser(id: string, userId: string) {
  return db.portfolio.findFirst({
    where:   { id, userId },
    include: { holdings: { orderBy: { createdAt: 'asc' } } },
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
    const portfolio = await getPortfolioForUser(id, session.user.id);
    if (!portfolio) return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    return NextResponse.json(portfolio);
  } catch (error) {
    console.error('GET /api/portfolios/[id] error:', error);
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
    const existing = await getPortfolioForUser(id, session.user.id);
    if (!existing) return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });

    const { name, currency, description, image } = await req.json();

    const updated = await db.portfolio.update({
      where: { id },
      data: {
        ...(name        && { name: name.trim() }),
        ...(currency    && { currency }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(image       !== undefined && { image: image || null }),
      },
      include: { holdings: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/portfolios/[id] error:', error);
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
    const existing = await getPortfolioForUser(id, session.user.id);
    if (!existing) return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });

    await db.portfolio.delete({ where: { id } });
    return NextResponse.json({ message: 'Portfolio deleted' });
  } catch (error) {
    console.error('DELETE /api/portfolios/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
