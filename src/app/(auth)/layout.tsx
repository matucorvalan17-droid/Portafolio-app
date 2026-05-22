import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      {/* Logo */}
      <div className="relative z-10 flex justify-center pt-10">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow-primary">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-text-primary">PortfolioIQ</span>
        </Link>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-8">
        <p className="text-text-muted text-xs">
          &copy; {new Date().getFullYear()} PortfolioIQ. For informational purposes only.
        </p>
      </div>
    </div>
  );
}
