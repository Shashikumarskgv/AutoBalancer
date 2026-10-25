'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlayCircle, BarChart3, History, UserCheck, ShieldAlert, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Play Arena', href: '/game', icon: PlayCircle },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Difficulty History', href: '/difficulty-history', icon: History },
    { label: 'Player Profile', href: '/profile', icon: UserCheck },
  ];

  const adminItems = [
    { label: 'Admin Overview', href: '/admin', icon: ShieldAlert },
    { label: 'Player Management', href: '/admin/players', icon: UserCheck },
    { label: 'System Analytics', href: '/admin/analytics', icon: BarChart3 },
    { label: 'ML Models & Training', href: '/admin/model', icon: Cpu },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card/60 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted px-3">Player Zone</span>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-indigo-600/30'
                      : 'text-muted hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-muted'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {user?.role === 'ADMIN' && (
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 px-3">Administration</span>
            <nav className="mt-2 space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                        : 'text-muted hover:text-rose-200 hover:bg-rose-950/40'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-rose-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      <div className="p-3 rounded-xl bg-background/60 border border-border text-xs text-muted">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-success animate-ping" />
          <span className="font-semibold text-foreground">ML Engine Active</span>
        </div>
        <p className="text-[11px] text-slate-400">Real-time feedback loop connected via WebSocket.</p>
      </div>
    </aside>
  );
};
