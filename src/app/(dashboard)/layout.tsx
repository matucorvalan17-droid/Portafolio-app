'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ImagePlus, X } from 'lucide-react';
import { Sidebar } from '@/components/nav/sidebar';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingPage } from '@/components/ui/loading';
import { compressImage } from '@/lib/compress-image';
import type { Portfolio } from '@/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [portfolios,          setPortfolios]          = useState<Portfolio[]>([]);
  const [newPortfolioOpen,    setNewPortfolioOpen]    = useState(false);
  const [newPortfolioName,    setNewPortfolioName]    = useState('');
  const [newPortfolioCurrency,setNewPortfolioCurrency]= useState('USD');
  const [newPortfolioImage,   setNewPortfolioImage]   = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [creating,         setCreating]         = useState(false);
  const portfolioImageRef = useRef<HTMLInputElement>(null);

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

  const handlePortfolioImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    try {
      const compressed = await compressImage(file, 128);
      setNewPortfolioImage(compressed);
    } catch {
      // ignore
    }
  };

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolioName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     newPortfolioName.trim(),
          currency: newPortfolioCurrency,
          image:    newPortfolioImage || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPortfolios((prev) => [...prev, data]);
        closeNewPortfolioModal();
        router.push(`/portfolio/${data.id}`);
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  const closeNewPortfolioModal = () => {
    setNewPortfolioOpen(false);
    setNewPortfolioName('');
    setNewPortfolioImage('');
    if (portfolioImageRef.current) portfolioImageRef.current.value = '';
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
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main content — margin tracks sidebar width */}
      <main className={`flex-1 min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>

      {/* New Portfolio Modal */}
      <Modal
        isOpen={newPortfolioOpen}
        onClose={closeNewPortfolioModal}
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

          {/* Logo / image upload */}
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1.5">
              Logo / Image <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-xl border-2 border-dashed border-border flex items-center justify-center flex-shrink-0 cursor-pointer hover:border-primary/50 transition-colors overflow-hidden bg-surface-2"
                onClick={() => portfolioImageRef.current?.click()}
              >
                {newPortfolioImage ? (
                  <img src={newPortfolioImage} alt="logo" className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus className="w-5 h-5 text-text-muted" />
                )}
              </div>
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => portfolioImageRef.current?.click()}
                  className="text-xs text-primary hover:underline font-medium block"
                >
                  Upload logo or exchange icon
                </button>
                <p className="text-xs text-text-muted mt-0.5">JPG, PNG · max 5 MB</p>
                {newPortfolioImage && (
                  <button
                    type="button"
                    onClick={() => { setNewPortfolioImage(''); if (portfolioImageRef.current) portfolioImageRef.current.value = ''; }}
                    className="text-xs text-loss hover:underline font-medium mt-1 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
            </div>
            <input
              ref={portfolioImageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePortfolioImageChange}
            />
          </div>

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
              onClick={closeNewPortfolioModal}
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
