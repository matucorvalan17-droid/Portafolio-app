import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { getDividendHistory } from '@/lib/yahoo-finance';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: portfolioId } = await params;

  const portfolio = await prisma.portfolio.findFirst({
    where: { id: portfolioId, userId: session.user.id },
  });
  if (!portfolio) {
    return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
  }

  const holdings = await prisma.holding.findMany({ where: { portfolioId } });
  if (!holdings.length) return NextResponse.json({ added: 0, dividends: [] });

  let totalAdded = 0;
  const added: Array<{ ticker: string; date: string; perShare: number; total: number }> = [];

  for (const holding of holdings) {
    // Find the earliest buy so we only look at dividends paid while owning the stock
    const firstBuy = await prisma.transaction.findFirst({
      where: { portfolioId, ticker: holding.ticker, type: 'buy' },
      orderBy: { date: 'asc' },
    });
    if (!firstBuy) continue;

    // Throttle Yahoo Finance calls slightly to avoid rate limiting
    await new Promise((r) => setTimeout(r, 150));

    const dividends = await getDividendHistory(holding.ticker, firstBuy.date);
    if (!dividends.length) continue;

    for (const div of dividends) {
      const divDate = new Date(div.date + 'T12:00:00Z');

      // Calculate shares owned at the time of this dividend by replaying buy/sell
      const txsBeforeDiv = await prisma.transaction.findMany({
        where: {
          portfolioId,
          ticker: holding.ticker,
          type: { in: ['buy', 'sell'] },
          date: { lte: divDate },
        },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      });

      let sharesAtDate = 0;
      for (const tx of txsBeforeDiv) {
        if (tx.type === 'buy') sharesAtDate += tx.shares;
        else sharesAtDate -= tx.shares;
      }
      sharesAtDate = Math.max(0, Math.round(sharesAtDate * 1e8) / 1e8);
      if (sharesAtDate <= 0) continue;

      // Deduplicate: skip if a dividend already exists for this ticker on this date
      const startOfDay = new Date(div.date + 'T00:00:00Z');
      const endOfDay   = new Date(div.date + 'T23:59:59Z');
      const exists = await prisma.transaction.findFirst({
        where: {
          portfolioId,
          ticker: holding.ticker,
          type: 'dividend',
          date: { gte: startOfDay, lte: endOfDay },
        },
      });
      if (exists) continue;

      const total = Math.round(sharesAtDate * div.amount * 1e4) / 1e4;

      await prisma.transaction.create({
        data: {
          portfolioId,
          ticker:  holding.ticker,
          name:    holding.name,
          type:    'dividend',
          shares:  sharesAtDate,
          price:   div.amount,
          total,
          fee:     0,
          date:    divDate,
          notes:   'Auto-sincronizado desde Yahoo Finance',
        },
      });

      totalAdded++;
      added.push({ ticker: holding.ticker, date: div.date, perShare: div.amount, total });
    }
  }

  return NextResponse.json({ added: totalAdded, dividends: added });
}
