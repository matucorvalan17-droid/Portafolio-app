'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  TrendingUp, LayoutDashboard, Briefcase, Settings, LogOut,
  ChevronDown, Plus, History, Star, BarChart3, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Portfolio } from '@/types';

interface SidebarProps {
  portfolios: Portfolio[];
  userName: string;
  userEmail: string;
  userImage?: string | null;
  onNewPortfolio: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const topNavItems = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Patrimonio'   },
  { href: '/analytics',    icon: BarChart3,        label: 'Analytics'    },
  { href: '/transactions', icon: History,          label: 'Transacciones'},
  { href: '/watchlist',    icon: Star,             label: 'Watchlist'    },
];

function Tooltip({ label, show }: { label: string; show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-surface-2 border border-[rgba(255,255,255,0.12)] rounded-lg text-xs font-medium text-text-primary whitespace-nowrap z-50 shadow-elevated pointer-events-none">
      {label}
    </div>
  );
}

export function Sidebar({ portfolios, userName, userEmail, userImage, onNewPortfolio, onCollapsedChange }: SidebarProps) {
  const pathname         = usePathname();
  const [collapsed,      setCollapsed]      = useState(false);
  const [portfoliosOpen, setPortfoliosOpen] = useState(true);
  const [tooltip,        setTooltip]        = useState('');

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapsedChange?.(next);
  };

  const isActive          = (href: string) => pathname === href;
  const isPortfolioActive = pathname.startsWith('/portfolio/');

  const w = collapsed ? 'w-16' : 'w-64';

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-full bg-surface border-r border-[rgba(255,255,255,0.08)] flex flex-col z-40 transition-all duration-300',
      w
    )}>
      {/* Logo */}
      <div className={cn('flex items-center border-b border-[rgba(255,255,255,0.08)] transition-all duration-300 h-16',
        collapsed ? 'justify-center px-0' : 'gap-2.5 px-5'
      )}>
        <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        {!collapsed && <span className="text-base font-bold text-text-primary tracking-tight">WealthTrack</span>}
      </div>

      {/* User */}
      <div className={cn('border-b border-[rgba(255,255,255,0.08)] transition-all duration-300',
        collapsed ? 'py-3 flex justify-center' : 'px-4 py-3'
      )}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-full overflow-hidden relative group" onMouseEnter={() => setTooltip(userName)} onMouseLeave={() => setTooltip('')}>
            {userImage
              ? <img src={userImage} alt={userName} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-primary/20 flex items-center justify-center"><span className="text-sm font-semibold text-primary">{userName.charAt(0).toUpperCase()}</span></div>}
            <Tooltip label={userName} show={tooltip === userName} />
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-surface-2">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              {userImage
                ? <img src={userImage} alt={userName} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-primary/20 flex items-center justify-center"><span className="text-sm font-semibold text-primary">{userName.charAt(0).toUpperCase()}</span></div>}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{userName}</p>
              <p className="text-xs text-text-muted truncate">{userEmail}</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto space-y-0.5 px-2">
        {topNavItems.map(({ href, icon: Icon, label }) => (
          <div key={href} className="relative group" onMouseEnter={() => collapsed && setTooltip(label)} onMouseLeave={() => setTooltip('')}>
            <Link
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150',
                collapsed ? 'justify-center px-0 py-2.5 w-full h-10' : 'px-3 py-2.5',
                isActive(href)
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && label}
            </Link>
            {collapsed && <Tooltip label={label} show={tooltip === label} />}
          </div>
        ))}

        {/* Portfolios section */}
        <div className="pt-1">
          {collapsed ? (
            <div className="relative group" onMouseEnter={() => setTooltip('Portfolios')} onMouseLeave={() => setTooltip('')}>
              <button
                onClick={() => setPortfoliosOpen(!portfoliosOpen)}
                className={cn(
                  'flex items-center justify-center w-full py-2.5 h-10 rounded-xl transition-all duration-150',
                  isPortfolioActive ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                )}
              >
                <Briefcase className="w-4 h-4" />
              </button>
              <Tooltip label="Portfolios" show={tooltip === 'Portfolios'} />
            </div>
          ) : (
            <button
              onClick={() => setPortfoliosOpen(!portfoliosOpen)}
              className={cn(
                'flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isPortfolioActive ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
              )}
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 flex-shrink-0" />
                Portfolios
              </div>
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', portfoliosOpen && 'rotate-180')} />
            </button>
          )}

          {portfoliosOpen && (
            <div className={cn('mt-1 space-y-0.5', !collapsed && 'ml-4 border-l border-[rgba(255,255,255,0.08)] pl-3')}>
              {portfolios.map((portfolio) => (
                collapsed ? (
                  <div key={portfolio.id} className="relative group flex justify-center" onMouseEnter={() => setTooltip(portfolio.id)} onMouseLeave={() => setTooltip('')}>
                    <Link href={`/portfolio/${portfolio.id}`}
                      className={cn('w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden border transition-all',
                        pathname === `/portfolio/${portfolio.id}`
                          ? 'border-primary/40 bg-primary/10'
                          : 'border-[rgba(255,255,255,0.08)] hover:border-primary/30'
                      )}>
                      {portfolio.image
                        ? <img src={portfolio.image} alt={portfolio.name} className="w-full h-full object-cover" />
                        : <span className="text-[10px] font-bold text-primary">{portfolio.name.charAt(0).toUpperCase()}</span>}
                    </Link>
                    <Tooltip label={portfolio.name} show={tooltip === portfolio.id} />
                  </div>
                ) : (
                  <Link
                    key={portfolio.id}
                    href={`/portfolio/${portfolio.id}`}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                      pathname === `/portfolio/${portfolio.id}`
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-muted hover:text-text-primary hover:bg-surface-2'
                    )}
                  >
                    <div className="w-4 h-4 rounded flex-shrink-0 overflow-hidden">
                      {portfolio.image
                        ? <img src={portfolio.image} alt={portfolio.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-primary/20 flex items-center justify-center"><span className="text-[9px] font-bold text-primary leading-none">{portfolio.name.charAt(0).toUpperCase()}</span></div>}
                    </div>
                    <span className="truncate">{portfolio.name}</span>
                  </Link>
                )
              ))}
              {portfolios.length === 0 && !collapsed && (
                <p className="text-xs text-text-muted px-3 py-2 italic">Sin portfolios</p>
              )}
              {!collapsed && (
                <button onClick={onNewPortfolio} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-primary hover:bg-primary/5 transition-all w-full">
                  <Plus className="w-3 h-3 flex-shrink-0" />
                  Nuevo Portfolio
                </button>
              )}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="pt-1">
          <div className="relative group" onMouseEnter={() => collapsed && setTooltip('settings')} onMouseLeave={() => setTooltip('')}>
            <Link
              href="/settings"
              className={cn(
                'flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150',
                collapsed ? 'justify-center px-0 py-2.5 w-full h-10' : 'px-3 py-2.5',
                isActive('/settings')
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
              )}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              {!collapsed && 'Configuración'}
            </Link>
            {collapsed && <Tooltip label="Configuración" show={tooltip === 'settings'} />}
          </div>
        </div>
      </nav>

      {/* Bottom: toggle + sign out */}
      <div className="px-2 pb-3 pt-3 border-t border-[rgba(255,255,255,0.08)] space-y-0.5">
        {/* Sign out */}
        <div className="relative group" onMouseEnter={() => collapsed && setTooltip('signout')} onMouseLeave={() => setTooltip('')}>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className={cn(
              'flex items-center gap-3 rounded-xl text-sm font-medium text-text-muted hover:text-loss hover:bg-loss/10 transition-all duration-150 w-full',
              collapsed ? 'justify-center py-2.5 h-10' : 'px-3 py-2.5'
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && 'Salir'}
          </button>
          {collapsed && <Tooltip label="Salir" show={tooltip === 'signout'} />}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggle}
          className={cn(
            'flex items-center gap-3 rounded-xl text-sm font-medium text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all duration-150 w-full',
            collapsed ? 'justify-center py-2.5 h-10' : 'px-3 py-2.5'
          )}
          title={collapsed ? 'Expandir menú' : 'Comprimir menú'}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4 flex-shrink-0" /> : <><PanelLeftClose className="w-4 h-4 flex-shrink-0" />Comprimir</>}
        </button>
      </div>
    </aside>
  );
}
