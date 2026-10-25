'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { Sidebar } from '../../../components/Sidebar';
import { DifficultyBadge } from '../../../components/DifficultyBadge';
import { Users, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminPlayersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [players, setPlayers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'ADMIN') {
        router.push('/dashboard');
      } else {
        fetchPlayers();
      }
    }
  }, [user, loading, router]);

  const fetchPlayers = async () => {
    try {
      const res = await api.get('/api/admin/players');
      if (res.data?.success) {
        setPlayers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load players:', err);
    } finally {
      setFetching(false);
    }
  };

  const filtered = players.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.profile?.displayName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading || fetching) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/admin" className="text-muted hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-2xl font-black text-foreground">PLAYER DIRECTORY</h1>
            </div>
            <p className="text-xs text-muted">
              Inspect all registered accounts, individual difficulty levels, and session counts.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-semibold uppercase tracking-wider text-[11px]">
                  <th className="pb-3">Player</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Current Difficulty</th>
                  <th className="pb-3">Matches Played</th>
                  <th className="pb-3">Total Score</th>
                  <th className="pb-3">Difficulty Adjustments</th>
                  <th className="pb-3 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.length > 0 ? (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-background border border-border flex items-center justify-center">
                            {p.profile?.avatar ? (
                              <img src={p.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-xs">{p.name[0]?.toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-foreground block">{p.profile?.displayName || p.name}</span>
                            <span className="text-[11px] text-muted font-mono">{p.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.role === 'ADMIN' ? 'bg-rose-950 text-rose-300' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {p.role}
                        </span>
                      </td>
                      <td className="py-4">
                        <DifficultyBadge level={p.profile?.currentDifficulty || 3} size="sm" />
                      </td>
                      <td className="py-4 font-mono font-bold text-foreground">
                        {p.profile?.totalGames || p._count?.gameSessions || 0}
                      </td>
                      <td className="py-4 font-mono font-bold text-amber-400">
                        {p.profile?.totalScore?.toLocaleString() || 0}
                      </td>
                      <td className="py-4 font-mono text-indigo-400 font-semibold">
                        {p._count?.difficultyChanges || 0}
                      </td>
                      <td className="py-4 text-right text-muted font-mono text-[11px]">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted">
                      No players matching search criteria.
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
