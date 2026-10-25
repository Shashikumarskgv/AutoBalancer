'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Key, Mail, ShieldAlert, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res.data?.success) {
        login(res.data.data.token, res.data.data.user);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 rounded-2xl bg-card border border-border shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 mx-auto flex items-center justify-center mb-3">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sign In to Platform</h2>
          <p className="text-xs text-muted mt-1">Authenticate to access your adaptive player profile</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Quick Demo Login Preset Buttons */}
        <div className="mb-6 p-3 rounded-xl bg-background/80 border border-border">
          <span className="block text-[11px] font-semibold text-muted mb-2 text-center">
            ⚡ Quick Demo Accounts
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('player1@gameai.io', 'PlayerPass123!')}
              className="py-1.5 px-2.5 rounded-lg bg-secondary hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 border border-border transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              Demo Player
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('admin@gameai.io', 'AdminPass123!')}
              className="py-1.5 px-2.5 rounded-lg bg-secondary hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 border border-border transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              System Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gameai.io"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Password</label>
            <div className="relative">
              <Key className="w-4 h-4 text-muted absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary hover:underline font-semibold">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
