'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, User, Mail, Key, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/api/auth/register', {
        username,
        displayName: displayName || username,
        email,
        password,
        confirmPassword,
      });

      if (res.data?.success) {
        login(res.data.data.token, res.data.data.user);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 rounded-2xl bg-card border border-border shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 mx-auto flex items-center justify-center mb-3">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Player Profile</h2>
          <p className="text-xs text-muted mt-1">Join the intelligent adaptive gaming arena</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-muted absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="shadow_sniper"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Display Name</label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 text-muted absolute left-3 top-3" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Shadow Sniper"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@gameai.io"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Password</label>
            <div className="relative">
              <Key className="w-4 h-4 text-muted absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Confirm Password</label>
            <div className="relative">
              <Key className="w-4 h-4 text-muted absolute left-3 top-3" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50 mt-3"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-5">
          Already registered?{' '}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
