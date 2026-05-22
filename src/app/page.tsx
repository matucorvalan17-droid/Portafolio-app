import Link from 'next/link';
import {
  TrendingUp,
  Shield,
  BarChart2,
  Upload,
  ArrowRight,
  Globe,
  Zap,
  LineChart,
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Real-Time Prices',
    description:
      'Live market data powered by Yahoo Finance. Prices refresh automatically every 30 seconds.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  {
    icon: Globe,
    title: 'Multi-Broker Support',
    description:
      'Track assets from Robinhood, Coinbase, Fidelity, Schwab, or any other broker in one dashboard.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Upload,
    title: 'CSV Import',
    description:
      'Quickly import holdings from any broker via CSV. Supports various column formats automatically.',
    color: 'text-gain',
    bg: 'bg-gain/10',
  },
  {
    icon: LineChart,
    title: 'Beautiful Charts',
    description:
      'Visualize your allocation with interactive donut charts and performance charts over time.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description:
      'Your data stays on your server. No third-party access to your financial information.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
  },
  {
    icon: BarChart2,
    title: 'Gain/Loss Tracking',
    description:
      'Track unrealized gains and losses per holding and across your entire portfolio instantly.',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
  },
];

const mockHoldings = [
  { ticker: 'AAPL', name: 'Apple Inc.', value: 12450.0, change: 2.34, type: 'Stock' },
  { ticker: 'BTC-USD', name: 'Bitcoin', value: 38200.0, change: -1.12, type: 'Crypto' },
  { ticker: 'SPY', name: 'S&P 500 ETF', value: 8730.0, change: 0.87, type: 'ETF' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', value: 6540.0, change: 1.45, type: 'Stock' },
  { ticker: 'ETH-USD', name: 'Ethereum', value: 4200.0, change: -0.67, type: 'Crypto' },
];

export default function LandingPage() {
  const totalValue = mockHoldings.reduce((sum, h) => sum + h.value, 0);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 grid-bg opacity-100 pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-text-primary">PortfolioIQ</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-medium px-4 py-2 rounded-full mb-8">
            <div className="w-2 h-2 bg-primary rounded-full pulse-ring" />
            Live prices from Yahoo Finance
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-text-primary mb-6 leading-tight">
            Track your entire
            <br />
            <span className="gradient-text">portfolio in one place</span>
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Monitor stocks, ETFs, crypto, and funds from all your brokers. Real-time
            prices, beautiful charts, and detailed analytics — all in one sleek dashboard.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 hover:shadow-glow-primary text-base"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-surface border border-border hover:border-border-2 text-text-primary font-semibold px-8 py-4 rounded-xl transition-all duration-200 text-base"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Mock Dashboard Preview */}
        <div className="relative max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="glass-card rounded-2xl p-6 shadow-card border border-border/50">
            {/* Top stats */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-text-secondary text-sm mb-1">Total Portfolio Value</p>
                <p className="text-4xl font-bold text-text-primary font-mono-num">
                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-gain text-sm mt-1 font-medium">+$1,247.32 (+1.78%) today</p>
              </div>
              <div className="text-right">
                <p className="text-text-secondary text-sm mb-1">All-Time Return</p>
                <p className="text-gain text-2xl font-bold">+$8,420.50</p>
                <p className="text-gain text-sm">+23.4%</p>
              </div>
            </div>

            {/* Holdings table */}
            <div className="border border-border/50 rounded-xl overflow-hidden">
              <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-surface/50 border-b border-border/50">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Asset</span>
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Type</span>
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider text-right">Value</span>
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider text-right">24h Change</span>
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider text-right">Allocation</span>
              </div>
              {mockHoldings.map((holding, i) => (
                <div
                  key={holding.ticker}
                  className={`grid grid-cols-5 gap-4 px-4 py-3.5 ${i < mockHoldings.length - 1 ? 'border-b border-border/30' : ''} hover:bg-primary/5 transition-colors`}
                >
                  <div>
                    <p className="text-text-primary font-semibold text-sm">{holding.ticker}</p>
                    <p className="text-text-muted text-xs">{holding.name}</p>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      holding.type === 'Crypto' ? 'bg-yellow-400/10 text-yellow-400' :
                      holding.type === 'ETF' ? 'bg-gain/10 text-gain' :
                      'bg-primary/10 text-primary'
                    }`}>
                      {holding.type}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-text-primary font-medium text-sm">
                      ${holding.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${holding.change >= 0 ? 'text-gain' : 'text-loss'}`}>
                      {holding.change >= 0 ? '+' : ''}{holding.change}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-text-secondary text-sm">
                      {((holding.value / totalValue) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Everything you need to
            <span className="gradient-text"> track your wealth</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Built for investors who want a clean, powerful tool — not a bloated app full of ads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="glass-card rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-text-primary font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="glass-card rounded-3xl p-12 text-center border border-primary/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Ready to take control of your portfolio?
            </h2>
            <p className="text-text-secondary text-lg mb-8 max-w-xl mx-auto">
              Join thousands of investors tracking their wealth with PortfolioIQ.
              It&apos;s free to get started.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-10 py-4 rounded-xl transition-all duration-200 hover:shadow-glow-primary text-base"
            >
              Create Your Account
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-primary rounded-md flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-text-primary">PortfolioIQ</span>
          </div>
          <p className="text-text-muted text-sm">
            Built with Next.js + Yahoo Finance. For informational purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}
