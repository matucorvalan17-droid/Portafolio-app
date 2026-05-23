# WealthTrack — Investment Portfolio Tracker

A premium, production-ready investment tracking app built with Next.js 15, TypeScript, TailwindCSS, Prisma, and Yahoo Finance.

---

## What This App Does

WealthTrack lets you:
- Track stocks, ETFs, crypto, and funds from all your brokers in one place
- See live prices from Yahoo Finance (auto-refreshes every 30 seconds)
- View portfolio analytics with beautiful charts
- Log your buy/sell/dividend transaction history
- Maintain a watchlist of stocks you want to buy
- Import holdings via CSV from any broker
- Export your data to CSV for Excel/Google Sheets

---

## Project Structure

```
wealthtrack/
│
├── prisma/
│   ├── schema.prisma      ← Database structure (edit to add columns)
│   └── seed.ts            ← Demo data (run once to populate test data)
│
├── src/
│   ├── app/
│   │   ├── page.tsx                    ← Landing page (edit text here)
│   │   ├── layout.tsx                  ← App metadata/SEO
│   │   ├── globals.css                 ← Global styles
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx          ← Login page
│   │   │   └── register/page.tsx       ← Register page
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/page.tsx      ← Main dashboard
│   │   │   ├── portfolio/[id]/page.tsx ← Individual portfolio view
│   │   │   ├── analytics/page.tsx      ← Charts & analytics
│   │   │   ├── transactions/page.tsx   ← Transaction history
│   │   │   ├── watchlist/page.tsx      ← Watchlist
│   │   │   └── settings/page.tsx       ← User settings
│   │   │
│   │   └── api/
│   │       ├── auth/         ← Login/register/session
│   │       ├── portfolios/   ← CRUD for portfolios
│   │       ├── holdings/     ← CRUD for holdings
│   │       ├── transactions/ ← CRUD for transactions
│   │       ├── watchlist/    ← CRUD for watchlist
│   │       ├── prices/       ← Live prices from Yahoo Finance
│   │       ├── search/       ← Ticker search
│   │       ├── import/       ← CSV import
│   │       └── export/       ← CSV export
│   │
│   ├── components/
│   │   ├── nav/              ← Sidebar & header
│   │   ├── dashboard/        ← Dashboard-specific components
│   │   ├── portfolio/        ← Portfolio & holdings components
│   │   ├── charts/           ← Chart components (Recharts)
│   │   └── ui/               ← Reusable UI components (Button, Input, etc.)
│   │
│   ├── lib/
│   │   ├── auth.ts           ← NextAuth configuration
│   │   ├── db.ts             ← Prisma database client
│   │   ├── utils.ts          ← Helper functions
│   │   └── yahoo-finance.ts  ← Yahoo Finance API calls
│   │
│   └── types/
│       └── index.ts          ← TypeScript type definitions
│
├── .env.local.example        ← Copy this to .env.local and fill in values
├── package.json              ← Dependencies and scripts
├── tailwind.config.ts        ← Colors, fonts, animations (edit to restyle)
└── README.md                 ← This file
```

---

## Files You May Want to Edit

| File | What to Edit |
|------|-------------|
| `src/app/page.tsx` | Landing page text, features, mock preview |
| `src/app/layout.tsx` | App title and SEO meta tags |
| `src/app/globals.css` | Global CSS, color variables |
| `tailwind.config.ts` | Color palette, fonts, shadows |
| `src/components/nav/sidebar.tsx` | Navigation menu items |
| `prisma/schema.prisma` | Database columns (advanced) |

---

## How to Deploy (Step by Step)

### Step 1 — Set Up a Free Database

You need a PostgreSQL database. Use **Neon** (free tier is generous):

1. Go to https://neon.tech and create a free account
2. Click **"New Project"** → give it any name (e.g. `wealthtrack`)
3. After it creates, click **"Connection Details"**
4. Copy the **"Connection string"** — it looks like:
   ```
   postgresql://username:password@host.neon.tech/dbname?sslmode=require
   ```
5. Save this — you'll need it in Step 3

> **Alternative:** Supabase (https://supabase.com) also works. Use the connection string from Settings → Database → Connection string → URI.

---

### Step 2 — Push to GitHub

1. Go to https://github.com and create a new **empty** repository
   - Name it `wealthtrack` (or anything you like)
   - Set it to **Private** (your portfolio data will be here)
   - Do NOT add README or .gitignore (the project already has them)

2. In your terminal, navigate to this project folder and run:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

3. Refresh GitHub — you should see all your files there

---

### Step 3 — Deploy on Vercel

1. Go to https://vercel.com and create a free account (sign up with GitHub)

2. Click **"New Project"**

3. Import your GitHub repository (select the `wealthtrack` repo)

4. Vercel will auto-detect it's a Next.js project — click **"Deploy"**
   - It will FAIL the first time because environment variables aren't set yet. That's OK.

5. After the failed deploy, go to your project in Vercel:
   - Click **"Settings"** tab
   - Click **"Environment Variables"** in the left sidebar

6. Add these **3 environment variables** (click "Add" for each):

   | Variable Name | Value |
   |--------------|-------|
   | `DATABASE_URL` | Your Neon/Supabase connection string from Step 1 |
   | `NEXTAUTH_URL` | `https://your-project-name.vercel.app` (your actual Vercel URL — find it in Project → Deployments) |
   | `NEXTAUTH_SECRET` | A random secret — visit https://generate-secret.vercel.app/32 to get one |

7. Go to **"Deployments"** and click **"Redeploy"** on the latest deployment

8. After deploy succeeds, your app is live! 🎉

---

### Step 4 — Set Up Your Database

After deploying, you need to create the database tables:

**Option A — Using Vercel (easiest):**
1. In Vercel, go to your project → **Settings** → **Functions**
2. Or, run locally with your production DATABASE_URL

**Option B — Run locally:**
1. Create a `.env.local` file (copy from `.env.local.example`)
2. Fill in your `DATABASE_URL` from Neon/Supabase
3. Run: `npm run db:push`
4. (Optional) Run demo data: `npm run db:seed`

**Option C — Vercel terminal:**
Go to your Vercel project → Settings → Functions → scroll down to see if there's a terminal option. Or connect via Vercel CLI:
```bash
npm i -g vercel
vercel env pull .env.local  # pulls production env vars
npm run db:push             # creates tables in production database
```

---

### Step 5 — Test Your App

1. Visit your Vercel URL
2. Click **"Get Started Free"**
3. Register with your email and a password
4. Create a portfolio and add some holdings!

**Demo account** (if you ran `npm run db:seed`):
- Email: `demo@wealthtrack.app`
- Password: `demo123456`

---

## Local Development

To run the app on your computer:

```bash
# 1. Install dependencies
npm install

# 2. Copy the example env file
cp .env.local.example .env.local
# Then edit .env.local with your values

# 3. Create database tables
npm run db:push

# 4. (Optional) Add demo data
npm run db:seed

# 5. Start the development server
npm run dev

# 6. Open http://localhost:3000
```

---

## Available Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start local development server |
| `npm run build` | Build for production |
| `npm run start` | Run production build locally |
| `npm run db:push` | Create/update database tables |
| `npm run db:studio` | Open Prisma Studio (visual database editor) |
| `npm run db:seed` | Add demo data to the database |

---

## How GitHub Auto-Deploy Works

Once you connect Vercel to GitHub:
- Every time you push to the `main` branch → Vercel automatically deploys
- Every time you push to other branches → Vercel creates a preview URL
- You can see all deployments in the Vercel dashboard

---

## Customizing the App

### Change the app name
Search for `WealthTrack` in the project and replace with your name.
Main files to change:
- `src/app/page.tsx` (landing page)
- `src/app/layout.tsx` (browser title)
- `src/components/nav/sidebar.tsx` (sidebar logo)

### Change the color scheme
Edit `tailwind.config.ts`:
```ts
colors: {
  primary: '#6366f1',  // ← change this to any hex color
  gain:    '#22c55e',  // ← profit color (green)
  loss:    '#ef4444',  // ← loss color (red)
}
```

### Add a new page
1. Create a file in `src/app/(dashboard)/your-page/page.tsx`
2. Add it to the nav in `src/components/nav/sidebar.tsx`

---

## CSV Import Format

To import holdings from a broker, create a CSV file with these columns:

```
ticker,shares,avgCost,broker,name,assetType
AAPL,10,150.00,Robinhood,Apple Inc.,stock
BTC-USD,0.5,40000,Coinbase,Bitcoin,crypto
SPY,20,450.00,Schwab,S&P 500 ETF,etf
```

- `ticker` (required) — stock symbol, e.g. AAPL, BTC-USD, SPY
- `shares` (required) — number of shares you own
- `avgCost` (required) — your average purchase price per share
- `broker` (optional) — which broker you use
- `name` (optional) — full company name
- `assetType` (optional) — `stock`, `etf`, `crypto`, or `fund`

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 15 | React framework with App Router |
| TypeScript | Type-safe JavaScript |
| TailwindCSS | Utility-first styling |
| Prisma | Database ORM (talks to PostgreSQL) |
| PostgreSQL | Database (hosted on Neon or Supabase) |
| NextAuth.js | Authentication (login/register) |
| Yahoo Finance 2 | Real-time stock prices |
| Recharts | Interactive charts |
| Framer Motion | Animations |
| Sonner | Toast notifications |
| Lucide React | Icons |

---

## Troubleshooting

**"Application error" on Vercel after deploy**
→ Check that all 3 environment variables are set correctly in Vercel Settings

**"Cannot find module @prisma/client"**
→ The `postinstall` script runs `prisma generate` automatically. If it fails, run it manually in the Vercel deploy settings.

**Prices show as $0.00**
→ The Yahoo Finance API is being rate-limited. Wait a few minutes and try again.

**"DATABASE_URL is invalid"**
→ Make sure your Neon/Supabase connection string includes `?sslmode=require` at the end.

**Login not working in production**
→ Make sure `NEXTAUTH_URL` is set to your exact Vercel URL (with https://, without trailing slash).

---

## Security Notes

- Never commit your `.env.local` file to GitHub (it's in `.gitignore`)
- Your `NEXTAUTH_SECRET` should be at least 32 random characters
- Passwords are hashed with bcrypt (industry standard)
- All API routes check that the user is logged in before returning data

---

## Support

If you run into issues:
1. Check the browser console for error messages (right-click → Inspect → Console)
2. Check Vercel deployment logs (Vercel → your project → Deployments → click the deployment → click "Build Logs")
3. Check the Vercel function logs (Vercel → your project → Logs)
