import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// One-time backfill: creates a "buy" transaction for every holding
// that has no transactions yet. Safe to call multiple times (idempotent).
// DELETE this file after running it.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const holdings = await db.holding.findMany({
      where: { portfolio: { userId: session.user.id } },
      include: { portfolio: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const created: string[] = [];
    const skipped: string[] = [];

    for (const holding of holdings) {
      const existingTx = await db.transaction.findFirst({
        where: { portfolioId: holding.portfolioId, ticker: holding.ticker },
      });

      if (existingTx) {
        skipped.push(`${holding.ticker} (${holding.portfolio.name})`);
        continue;
      }

      await db.transaction.create({
        data: {
          portfolioId: holding.portfolioId,
          ticker:      holding.ticker,
          name:        holding.name,
          type:        'buy',
          shares:      holding.shares,
          price:       holding.avgCost,
          total:       holding.shares * holding.avgCost,
          fee:         0,
          date:        holding.purchaseDate ?? holding.createdAt,
          broker:      holding.broker ?? null,
          notes:       holding.notes ?? null,
        },
      });

      created.push(`${holding.ticker} (${holding.portfolio.name})`);
    }

    return NextResponse.json({
      ok: true,
      created: created.length,
      skipped: skipped.length,
      detail: { created, skipped },
    });
  } catch (error) {
    console.error('backfill-transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
