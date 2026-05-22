import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getHistoricalData } from '@/lib/yahoo-finance';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const period = (searchParams.get('period') || '3mo') as '1mo' | '3mo' | '6mo' | '1y';

    if (!ticker) {
      return NextResponse.json({ error: 'ticker is required' }, { status: 400 });
    }

    const validPeriods = ['1mo', '3mo', '6mo', '1y'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
    }

    const data = await getHistoricalData(ticker, period);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('GET /api/prices/historical error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
