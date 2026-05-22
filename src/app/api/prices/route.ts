import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getQuotes } from '@/lib/yahoo-finance';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tickersParam = searchParams.get('tickers');

    if (!tickersParam) {
      return NextResponse.json({ error: 'tickers query param is required' }, { status: 400 });
    }

    const tickers = tickersParam.split(',').map((t) => t.trim()).filter(Boolean);

    if (tickers.length === 0) {
      return NextResponse.json({});
    }

    if (tickers.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 tickers per request' },
        { status: 400 }
      );
    }

    const quotes = await getQuotes(tickers);

    return NextResponse.json(quotes, {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('GET /api/prices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
