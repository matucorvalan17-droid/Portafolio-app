/**
 * Backfill: creates a "buy" transaction for every holding that has no transactions yet.
 * Run once with: npx tsx scripts/backfill-transactions.ts
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const holdings = await db.holding.findMany({
    include: { portfolio: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${holdings.length} holdings\n`);

  let created = 0;
  let skipped = 0;

  for (const holding of holdings) {
    const existingTx = await db.transaction.findFirst({
      where: { portfolioId: holding.portfolioId, ticker: holding.ticker },
    });

    if (existingTx) {
      console.log(`  SKIP  ${holding.ticker} (${holding.portfolio.name}) — ya tiene transacciones`);
      skipped++;
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

    console.log(`  ✓  ${holding.ticker} (${holding.portfolio.name}) — ${holding.shares} acciones @ $${holding.avgCost}`);
    created++;
  }

  console.log(`\n✅  Listo: ${created} transacciones creadas, ${skipped} omitidas`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
