import type { PrismaClient } from '@prisma/client';

/**
 * Replays all buy/sell transactions for a ticker in a portfolio and
 * updates (or deletes) the holding to match. Call this after any
 * transaction is created or deleted.
 */
export async function reconcileHolding(
  portfolioId: string,
  ticker: string,
  db: PrismaClient,
) {
  const normalizedTicker = ticker.toUpperCase();

  const txs = await db.transaction.findMany({
    where: {
      portfolioId,
      ticker: normalizedTicker,
      type:   { in: ['buy', 'sell'] },
    },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  });

  let shares    = 0;
  let totalCost = 0; // all-in cost basis (includes fees)

  for (const tx of txs) {
    if (tx.type === 'buy') {
      totalCost += tx.shares * tx.price + tx.fee;
      shares    += tx.shares;
    } else if (tx.type === 'sell') {
      if (shares > 0) {
        const costPerShare = totalCost / shares;
        totalCost -= tx.shares * costPerShare;
        shares    -= tx.shares;
      }
    }
  }

  // Floating-point safety
  shares    = Math.max(0, Math.round(shares    * 1e8) / 1e8);
  totalCost = Math.max(0, Math.round(totalCost * 1e8) / 1e8);

  const existing = await db.holding.findFirst({
    where: { portfolioId, ticker: normalizedTicker },
  });

  if (shares <= 0) {
    if (existing) await db.holding.delete({ where: { id: existing.id } });
    return null;
  }

  const avgCost = totalCost / shares;

  if (existing) {
    return db.holding.update({
      where: { id: existing.id },
      data:  { shares, avgCost },
    });
  }

  // Holding doesn't exist yet (new ticker via transactions tab) — create it
  // Derive metadata from the first buy transaction
  const firstBuy = txs.find((t) => t.type === 'buy');
  if (!firstBuy) return null;

  // Get assetType from existing holding in same portfolio (if any ticker match)
  // otherwise default to 'stock'
  return db.holding.create({
    data: {
      portfolioId,
      ticker:      normalizedTicker,
      name:        firstBuy.name,
      shares,
      avgCost,
      purchaseDate: firstBuy.date,
      broker:       firstBuy.broker ?? null,
      assetType:    'stock',
      currency:     'USD',
    },
  });
}
