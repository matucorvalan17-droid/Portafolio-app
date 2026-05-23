// WealthTrack — Demo Data Seed
// This script creates a demo user with realistic portfolio data.
// Run it with: npm run db:seed
// ⚠️  Only run this ONCE after setting up your database.
// It will NOT overwrite existing data if the demo user already exists.

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  // Check if demo user already exists
  const existing = await db.user.findUnique({ where: { email: 'demo@wealthtrack.app' } });
  if (existing) {
    console.log('✅ Demo user already exists. Skipping seed.');
    return;
  }

  console.log('🌱 Seeding demo data...');

  const passwordHash = await hash('demo123456', 12);

  // Create demo user
  const user = await db.user.create({
    data: {
      email:    'demo@wealthtrack.app',
      password: passwordHash,
      name:     'Demo User',
      currency: 'USD',
    },
  });

  // ── Portfolio 1: Growth Stocks ───────────────────────────────
  const growth = await db.portfolio.create({
    data: {
      name:        'Growth Portfolio',
      description: 'Tech-focused long-term holdings',
      userId:      user.id,
      currency:    'USD',
    },
  });

  await db.holding.createMany({
    data: [
      { portfolioId: growth.id, ticker: 'AAPL',  name: 'Apple Inc.',         shares: 25,   avgCost: 158.50, assetType: 'stock',  broker: 'Robinhood' },
      { portfolioId: growth.id, ticker: 'MSFT',  name: 'Microsoft Corp.',    shares: 10,   avgCost: 385.00, assetType: 'stock',  broker: 'Robinhood' },
      { portfolioId: growth.id, ticker: 'GOOGL', name: 'Alphabet Inc.',      shares: 8,    avgCost: 165.00, assetType: 'stock',  broker: 'Robinhood' },
      { portfolioId: growth.id, ticker: 'NVDA',  name: 'NVIDIA Corporation', shares: 15,   avgCost: 480.00, assetType: 'stock',  broker: 'Fidelity'  },
      { portfolioId: growth.id, ticker: 'AMZN',  name: 'Amazon.com Inc.',    shares: 12,   avgCost: 185.00, assetType: 'stock',  broker: 'Fidelity'  },
    ],
  });

  // ── Portfolio 2: ETF Portfolio ───────────────────────────────
  const etf = await db.portfolio.create({
    data: {
      name:        'Index ETFs',
      description: 'Passive index fund strategy',
      userId:      user.id,
      currency:    'USD',
    },
  });

  await db.holding.createMany({
    data: [
      { portfolioId: etf.id, ticker: 'SPY',  name: 'SPDR S&P 500 ETF',       shares: 20,  avgCost: 472.00, assetType: 'etf',   broker: 'Schwab' },
      { portfolioId: etf.id, ticker: 'QQQ',  name: 'Invesco QQQ Trust',       shares: 15,  avgCost: 425.00, assetType: 'etf',   broker: 'Schwab' },
      { portfolioId: etf.id, ticker: 'VTI',  name: 'Vanguard Total Mkt ETF',  shares: 30,  avgCost: 238.00, assetType: 'etf',   broker: 'Schwab' },
      { portfolioId: etf.id, ticker: 'ARKK', name: 'ARK Innovation ETF',      shares: 50,  avgCost: 42.00,  assetType: 'etf',   broker: 'Schwab' },
    ],
  });

  // ── Portfolio 3: Crypto ──────────────────────────────────────
  const crypto = await db.portfolio.create({
    data: {
      name:        'Crypto',
      description: 'Digital assets',
      userId:      user.id,
      currency:    'USD',
    },
  });

  await db.holding.createMany({
    data: [
      { portfolioId: crypto.id, ticker: 'BTC-USD', name: 'Bitcoin',   shares: 0.15, avgCost: 45000.00, assetType: 'crypto', broker: 'Coinbase' },
      { portfolioId: crypto.id, ticker: 'ETH-USD', name: 'Ethereum',  shares: 1.5,  avgCost: 2800.00,  assetType: 'crypto', broker: 'Coinbase' },
      { portfolioId: crypto.id, ticker: 'SOL-USD', name: 'Solana',    shares: 10,   avgCost: 120.00,   assetType: 'crypto', broker: 'Coinbase' },
    ],
  });

  // ── Sample Transactions ──────────────────────────────────────
  const now = new Date();
  await db.transaction.createMany({
    data: [
      { portfolioId: growth.id, ticker: 'AAPL',  name: 'Apple Inc.',      type: 'buy',  shares: 25,   price: 158.50, total: 3962.50,  fee: 0,  date: new Date(now.getTime() - 90 * 86400000), broker: 'Robinhood' },
      { portfolioId: growth.id, ticker: 'MSFT',  name: 'Microsoft Corp.', type: 'buy',  shares: 10,   price: 385.00, total: 3850.00,  fee: 0,  date: new Date(now.getTime() - 60 * 86400000), broker: 'Robinhood' },
      { portfolioId: growth.id, ticker: 'NVDA',  name: 'NVIDIA Corp.',    type: 'buy',  shares: 15,   price: 480.00, total: 7200.00,  fee: 0,  date: new Date(now.getTime() - 45 * 86400000), broker: 'Fidelity'  },
      { portfolioId: etf.id,    ticker: 'SPY',   name: 'S&P 500 ETF',     type: 'buy',  shares: 20,   price: 472.00, total: 9440.00,  fee: 0,  date: new Date(now.getTime() - 120 * 86400000), broker: 'Schwab' },
      { portfolioId: crypto.id, ticker: 'BTC-USD',name: 'Bitcoin',        type: 'buy',  shares: 0.15, price: 45000,  total: 6750.00,  fee: 25, date: new Date(now.getTime() - 30 * 86400000), broker: 'Coinbase' },
      { portfolioId: growth.id, ticker: 'AAPL',  name: 'Apple Inc.',      type: 'dividend', shares: 0, price: 0.24, total: 6.00, fee: 0, date: new Date(now.getTime() - 15 * 86400000), broker: 'Robinhood' },
    ],
  });

  // ── Watchlist ────────────────────────────────────────────────
  await db.watchlistItem.createMany({
    data: [
      { userId: user.id, ticker: 'META',    name: 'Meta Platforms Inc.', notes: 'AI + VR growth story' },
      { userId: user.id, ticker: 'TSLA',    name: 'Tesla Inc.',          notes: 'Watching for dip entry', alertPrice: 180 },
      { userId: user.id, ticker: 'PLTR',    name: 'Palantir Technologies', notes: 'AI platform play' },
      { userId: user.id, ticker: 'AVGO',    name: 'Broadcom Inc.',        notes: 'Semiconductor diversification' },
    ],
  });

  console.log('');
  console.log('✅ Demo data seeded successfully!');
  console.log('');
  console.log('📧 Demo login:');
  console.log('   Email:    demo@wealthtrack.app');
  console.log('   Password: demo123456');
  console.log('');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => db.$disconnect());
