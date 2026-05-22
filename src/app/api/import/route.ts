import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import type { CSVHolding } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { portfolioId, holdings } = body as { portfolioId: string; holdings: CSVHolding[] };

    if (!portfolioId) {
      return NextResponse.json({ error: 'portfolioId is required' }, { status: 400 });
    }

    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      return NextResponse.json({ error: 'No holdings to import' }, { status: 400 });
    }

    // Verify portfolio belongs to user
    const portfolio = await db.portfolio.findFirst({
      where: { id: portfolioId, userId: session.user.id },
    });

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const results: Array<{ ticker: string; success: boolean; error?: string }> = [];

    for (const holding of holdings) {
      try {
        if (!holding.ticker || holding.shares === undefined || holding.avgCost === undefined) {
          results.push({ ticker: holding.ticker || 'unknown', success: false, error: 'Missing required fields' });
          continue;
        }

        const shares = parseFloat(String(holding.shares));
        const avgCost = parseFloat(String(holding.avgCost));

        if (isNaN(shares) || isNaN(avgCost)) {
          results.push({ ticker: holding.ticker, success: false, error: 'Invalid numeric values' });
          continue;
        }

        if (shares <= 0) {
          results.push({ ticker: holding.ticker, success: false, error: 'Shares must be positive' });
          continue;
        }

        await db.holding.create({
          data: {
            portfolioId,
            ticker: holding.ticker.toUpperCase().trim(),
            name: holding.name?.trim() || holding.ticker.toUpperCase().trim(),
            shares,
            avgCost,
            broker: holding.broker?.trim() || null,
            assetType: holding.assetType || 'stock',
            currency: portfolio.currency || 'USD',
          },
        });

        results.push({ ticker: holding.ticker, success: true });
      } catch (err) {
        results.push({
          ticker: holding.ticker || 'unknown',
          success: false,
          error: err instanceof Error ? err.message : 'Failed to import',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      message: `Imported ${successCount} of ${holdings.length} holdings`,
      results,
      successCount,
      failCount: holdings.length - successCount,
    });
  } catch (error) {
    console.error('POST /api/import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
