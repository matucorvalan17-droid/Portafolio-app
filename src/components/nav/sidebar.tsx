'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  TrendingUp,
  LayoutDashboard,
  Briefcase,
  Settings,
  LogOut,
  ChevronDown,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Portfolio } from '@/types';

interface SidebarProps {
  portfolios: Portfolio[];
  userName: string;
  userEmail: string;
  onNewPortfolio: () => void;
}

export function Sidebar({ portfolios, userName, userEmail, onNewPortfolio }: SidebarProps) {
  const pathname = usePathname();
  const [portfoliosOpen, setPortfoliosOpen] = useState(true);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
        <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-bold text-text-primary">PortfolioIQ</span>
      </div>

      {/* User */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-surface-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{userName}</p>
            <p className="text-xs text-text-muted truncate">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
            isActive('/dashboard') && pathname === '/dashboard'
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
          )}
        >
          <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
          Dashboard
        </Link>

        {/* Portfolios section */}
        <div>
          <button
            onClick={() => setPortfoliosOpen(!portfoliosOpen)}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-all duration-150"
          >
            <div className="flex items-center gap-3">
              <Briefcase className="w-4 h-4 flex-shrink-0" />
              Portfolios
            </div>
            <ChevronDown
              className={cn('w-3.5 h-3.5 transition-transform', portfoliosOpen ? 'rotate-180' : '')}
            />
          </button>

          {portfoliosOpen && (
            <div className="mt-1 ml-4 space-y-0.5 border-l border-border pl-3">
              {portfolios.map((portfolio) => (
                <Link
                  key={portfolio.id}
                  href={`/portfolio/${portfolio.id}`}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 group',
                    isActive(`/portfolio/${portfolio.id}`)
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-muted hover:text-text-primary hover:bg-surface-2'
                  )}
                >
                  <ChevronRight className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{portfolio.name}</span>
                </Link>
              ))}

              {portfolios.length === 0 && (
                <p className="text-xs text-text-muted px-3 py-2">No portfolios yet</p>
              )}

              <button
                onClick={onNewPortfolio}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-primary hover:bg-primary/5 transition-all duration-150 w-full"
              >
                <Plus className="w-3 h-3 flex-shrink-0" />
                New Portfolio
              </button>
            </div>
          )}
        </div>

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
            isActive('/settings')
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
          )}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          Settings
        </Link>
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-4 border-t border-border pt-3">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-loss hover:bg-loss/10 transition-all duration-150 w-full"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
