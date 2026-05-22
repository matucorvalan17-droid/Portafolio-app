import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { searchTickers } from '@/lib/yahoo-finance';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 1) {
      return NextResponse.json([]);
    }

    const results = await searchTickers(query.trim());

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('GET /api/search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
