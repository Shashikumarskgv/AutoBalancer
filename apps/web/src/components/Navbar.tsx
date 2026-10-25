'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { DifficultyBadge } from './DifficultyBadge';
import { Gamepad2, ShieldAlert, User, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                AUTO-BALANCER
              </span>
              <span className="block text-[10px] uppercase font-semibold text-indigo-400 tracking-wider">
                AI Difficulty Engine
              </span>
            </div>
          </Link>
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            {user.profile && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-muted">Tier:</span>
                <DifficultyBadge level={user.profile.currentDifficulty} size="sm" />
              </div>
            )}

            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/60 border border-rose-800 text-rose-300 hover:bg-rose-900/80 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Admin Panel
              </Link>
            )}

            <Link
              href="/profile"
              className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-secondary/80 border border-border hover:border-indigo-500/50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-indigo-900 flex items-center justify-center">
                {user.profile?.avatar ? (
                  <img src={user.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-indigo-300" />
                )}
              </div>
              <span className="text-xs font-medium text-foreground hidden sm:inline">
                {user.profile?.displayName || user.name}
              </span>
            </Link>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-lg bg-secondary/80 border border-border text-muted hover:text-danger hover:border-danger/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold px-4 py-2 rounded-lg text-muted hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white transition-colors shadow-md shadow-indigo-600/30"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
