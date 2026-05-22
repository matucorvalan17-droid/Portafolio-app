import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const portfolios = await db.portfolio.findMany({
      where: { userId: session.user.id },
      include: {
        holdings: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(portfolios);
  } catch (error) {
    console.error('GET /api/portfolios error:', error);
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
    const { name, currency = 'USD' } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Portfolio name is required' }, { status: 400 });
    }

    const portfolio = await db.portfolio.create({
      data: {
        name: name.trim(),
        currency,
        userId: session.user.id,
      },
      include: {
        holdings: true,
      },
    });

    return NextResponse.json(portfolio, { status: 201 });
  } catch (error) {
    console.error('POST /api/portfolios error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
