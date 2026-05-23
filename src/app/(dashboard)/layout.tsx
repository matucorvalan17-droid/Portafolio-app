'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/nav/sidebar';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingPage } from '@/components/ui/loading';
import type { Portfolio } from '@/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [newPortfolioOpen, setNewPortfolioOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioCurrency, setNewPortfolioCurrency] = useState('USD');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchPortfolios = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolios');
      if (res.ok) {
        const data = await res.json();
        setPortfolios(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPortfolios();
    }
  }, [status, fetchPortfolios]);

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolioName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPortfolioName.trim(), currency: newPortfolioCurrency }),
      });

      if (res.ok) {
        const data = await res.json();
        setPortfolios((prev) => [...prev, data]);
        setNewPortfolioOpen(false);
        setNewPortfolioName('');
        router.push(`/portfolio/${data.id}`);
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  if (status === 'loading') {
    return <LoadingPage />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        portfolios={portfolios}
        userName={session.user.name}
        userEmail={session.user.email}
        userImage={(session.user as { image?: string | null }).image}
        onNewPortfolio={() => setNewPortfolioOpen(true)}
      />

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>

      {/* New Portfolio Modal */}
      <Modal
        isOpen={newPortfolioOpen}
        onClose={() => { setNewPortfolioOpen(false); setNewPortfolioName(''); }}
        title="New Portfolio"
        size="sm"
      >
        <form onSubmit={handleCreatePortfolio} className="space-y-4">
          <Input
            label="Portfolio name"
            type="text"
            placeholder="e.g. Robinhood, Crypto, Retirement"
            value={newPortfolioName}
            onChange={(e) => setNewPortfolioName(e.target.value)}
            required
            autoFocus
          />
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1.5">Currency</label>
            <select
              value={newPortfolioCurrency}
              onChange={(e) => setNewPortfolioCurrency(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="JPY">JPY - Japanese Yen</option>
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setNewPortfolioOpen(false); setNewPortfolioName(''); }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" loading={creating} className="flex-1">
              Create Portfolio
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
