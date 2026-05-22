import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

async function getPortfolioForUser(id: string, userId: string) {
  return db.portfolio.findFirst({
    where: { id, userId },
    include: { holdings: true },
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

    const portfolio = await getPortfolioForUser(params.id, session.user.id);
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    return NextResponse.json(portfolio);
  } catch (error) {
    console.error('GET /api/portfolios/[id] error:', error);
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

    const existing = await getPortfolioForUser(params.id, session.user.id);
    if (!existing) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, currency } = body;

    const updated = await db.portfolio.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(currency && { currency }),
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
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await getPortfolioForUser(params.id, session.user.id);
    if (!existing) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    await db.portfolio.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Portfolio deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/portfolios/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
