'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { Sidebar } from '../../../components/Sidebar';
import { DifficultyBadge } from '../../../components/DifficultyBadge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity, ArrowLeft, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

export default function AdminAnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'ADMIN') {
        router.push('/dashboard');
      } else {
        fetchStats();
      }
    }
  }, [user, loading, router]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/admin/system-analytics');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setFetching(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const distRaw = stats?.difficultyDistribution || [];
  const distChartData = [1, 2, 3, 4, 5].map((lvl) => {
    const found = distRaw.find((d: any) => d.currentDifficulty === lvl);
    return {
      level: `Level ${lvl}`,
      playersCount: found?._count?.id || 0,
    };
  });

  return (
    <div className="flex-1 flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-muted hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-black text-foreground">SYSTEM-WIDE TELEMETRY & BALANCING</h1>
          </div>
          <p className="text-xs text-muted">
            Aggregated difficulty distribution, balancing event logs, and operational health.
          </p>
        </div>

        {/* Difficulty Distribution Chart */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-400" />
            Active Player Distribution Across Difficulty Levels (1 to 5)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="level" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '12px' }} />
                <Bar dataKey="playersCount" name="Players in Tier" fill="#F43F5E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent System Balancing Audit Feed */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Recent Balancing Events Across All Players
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-semibold uppercase tracking-wider text-[11px]">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Player</th>
                  <th className="pb-3">Adjustment</th>
                  <th className="pb-3">Confidence</th>
                  <th className="pb-3">Model</th>
                  <th className="pb-3">Reasoning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {stats?.recentChanges?.length > 0 ? (
                  stats.recentChanges.map((c: any) => (
                    <tr key={c.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3 text-muted font-mono whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 font-semibold text-foreground">{c.player?.name || 'Player'}</td>
                      <td className="py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-foreground">
                          L{c.previousDifficulty} → L{c.newDifficulty} ({c.adjustment > 0 ? '+1' : c.adjustment < 0 ? '-1' : '0'})
                        </span>
                      </td>
                      <td className="py-3 font-mono font-bold text-indigo-300">{Math.round(c.confidence * 100)}%</td>
                      <td className="py-3 font-mono text-muted">{c.modelVersion}</td>
                      <td className="py-3 text-slate-300 font-mono text-[11px] line-clamp-1">{c.reason.split('\n')[0]}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted">
                      No system balancing events recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
