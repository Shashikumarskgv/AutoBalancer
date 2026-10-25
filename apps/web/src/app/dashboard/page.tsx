'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Sidebar } from '../../components/Sidebar';
import { DifficultyBadge } from '../../components/DifficultyBadge';
import Link from 'next/link';
import {
  Trophy,
  Target,
  Percent,
  Skull,
  Zap,
  PlayCircle,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  History,
  Timer,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/api/player/dashboard');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchDashboardData();
      }
    }
  }, [user, loading, router]);

  if (loading || fetching) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted">Loading telemetry & model metrics...</span>
        </div>
      </div>
    );
  }

  const { profile, metrics, recommendation, recentChanges, recentSessions } = data || {};
  const recAdjustment = recommendation?.adjustment || 0;

  return (
    <div className="flex-1 flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-card via-card to-indigo-950/40 border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Tactical Overview</span>
              <span className="text-xs text-muted">•</span>
              <span className="text-xs text-muted">Player ID: {profile?.displayName || user?.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Welcome back, {profile?.displayName || user?.name}!
            </h1>
            <p className="text-xs text-muted mt-1">
              Your telemetry is continuously analyzed by the active Machine Learning difficulty classifier.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/game"
              className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <PlayCircle className="w-5 h-5" />
              Launch Arena Simulator
            </Link>
          </div>
        </div>

        {/* Status Metrics Cards Grid (Section 7) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-[11px] font-semibold text-muted uppercase block mb-1">Difficulty</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-foreground font-mono">{profile?.currentDifficulty} / 5</span>
              <DifficultyBadge level={profile?.currentDifficulty || 3} size="sm" showName={false} />
            </div>
            <span className="text-[10px] text-muted mt-1 block">Tier: {profile?.difficultyConfig?.name}</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-[11px] font-semibold text-muted uppercase block mb-1">Performance Score</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-indigo-400 font-mono">{metrics?.performanceScore}%</span>
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-[10px] text-muted mt-1 block">Weighted Index</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-[11px] font-semibold text-muted uppercase block mb-1">Win Rate</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-emerald-400 font-mono">{metrics?.winRate}%</span>
              <Percent className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-[10px] text-muted mt-1 block">Victories ratio</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-[11px] font-semibold text-muted uppercase block mb-1">Accuracy</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-cyan-400 font-mono">{metrics?.accuracy}%</span>
              <Target className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-[10px] text-muted mt-1 block">Hits / Attempts</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-[11px] font-semibold text-muted uppercase block mb-1">Average Score</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-amber-400 font-mono">{metrics?.averageScore}</span>
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-[10px] text-muted mt-1 block">{profile?.totalGames || 0} matches recorded</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-[11px] font-semibold text-muted uppercase block mb-1">Deaths</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-rose-400 font-mono">{metrics?.deaths}</span>
              <Skull className="w-5 h-5 text-rose-400" />
            </div>
            <span className="text-[10px] text-muted mt-1 block">Avg reaction: {metrics?.reactionTime}ms</span>
          </div>
        </div>

        {/* Current Recommendation Card (Section 7) */}
        <div className="p-6 rounded-2xl bg-card border border-border relative overflow-hidden shadow-lg">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800">
                  <Zap className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  ML Recommended Adjustment
                </span>
              </div>

              <div className="flex items-center gap-3">
                <h3 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
                  {recAdjustment === 1 && (
                    <>
                      <ArrowUp className="w-6 h-6 text-indigo-400" />
                      Increase Difficulty (Level {profile?.currentDifficulty} → Level {recommendation?.recommendedDifficulty})
                    </>
                  )}
                  {recAdjustment === -1 && (
                    <>
                      <ArrowDown className="w-6 h-6 text-amber-400" />
                      Decrease Difficulty (Level {profile?.currentDifficulty} → Level {recommendation?.recommendedDifficulty})
                    </>
                  )}
                  {recAdjustment === 0 && (
                    <>
                      <Minus className="w-6 h-6 text-slate-400" />
                      Maintain Current Difficulty (Level {profile?.currentDifficulty})
                    </>
                  )}
                </h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono font-bold">
                  {recommendation?.confidence}% Confidence
                </span>
              </div>

              <div className="text-xs sm:text-sm text-slate-300 bg-background/60 p-4 rounded-xl border border-border whitespace-pre-line leading-relaxed font-mono">
                {recommendation?.reason}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-background/80 border border-border min-w-[240px] text-xs space-y-2">
              <span className="font-bold text-foreground block uppercase text-[11px] tracking-wider mb-2">
                Active Telemetry Trend
              </span>
              <div className="flex justify-between">
                <span className="text-muted">Performance Trend:</span>
                <span
                  className={`font-mono font-bold ${
                    metrics?.performanceTrend > 0
                      ? 'text-emerald-400'
                      : metrics?.performanceTrend < 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {metrics?.performanceTrend > 0 ? '+' : ''}
                  {metrics?.performanceTrend}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Reaction Speed:</span>
                <span className="font-mono text-foreground font-semibold">{metrics?.reactionTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Model Version:</span>
                <span className="font-mono text-indigo-300 font-semibold">{recommendation?.modelVersion}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Skill Band Alignment Card (Section 9 Improvement) */}
        {(() => {
          const currentLevel = profile?.currentDifficulty || 3;
          const playerPerf = metrics?.performanceScore || 50;
          const targetBands: Record<number, { min: number; max: number; label: string }> = {
            1: { min: 30, max: 50, label: '30% – 50%' },
            2: { min: 45, max: 65, label: '45% – 65%' },
            3: { min: 60, max: 75, label: '60% – 75%' },
            4: { min: 70, max: 85, label: '70% – 85%' },
            5: { min: 80, max: 95, label: '80% – 95%' },
          };
          const band = targetBands[currentLevel] || targetBands[3];
          const isAbove = playerPerf > band.max;
          const isBelow = playerPerf < band.min;
          const isAligned = !isAbove && !isBelow;

          return (
            <div className="p-6 rounded-2xl bg-card border border-border shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Target Skill Band Alignment (Level {currentLevel})
                  </h3>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold ${
                    isAligned
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : isAbove
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {isAligned
                    ? '● OPTIMAL FLOW ZONE'
                    : isAbove
                    ? '▲ ABOVE TARGET BAND (Over-Performing)'
                    : '▼ BELOW TARGET BAND (Under-Performing)'}
                </span>
              </div>

              <p className="text-xs text-muted mb-4">
                The auto-balancing engine monitors whether your performance score ({playerPerf}%) matches the expected target band for Level {currentLevel} ({band.label}).
              </p>

              {/* Graphical Band Visualization */}
              <div className="relative pt-6 pb-2">
                {/* Track */}
                <div className="h-3 w-full bg-slate-800 rounded-full relative overflow-hidden">
                  {/* Target Band Highlight Zone */}
                  <div
                    className="h-full bg-cyan-500/30 border-x border-cyan-400/80 absolute"
                    style={{
                      left: `${band.min}%`,
                      width: `${band.max - band.min}%`,
                    }}
                  />
                </div>

                {/* Player Current Score Marker */}
                <div
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-500"
                  style={{ left: `${Math.min(98, Math.max(2, playerPerf))}%` }}
                >
                  <span className="text-[10px] font-mono font-bold text-white bg-primary px-1.5 py-0.5 rounded shadow">
                    {playerPerf}%
                  </span>
                  <div className="w-2 h-2 bg-primary rotate-45 -mt-1" />
                </div>

                {/* Scale Axis Labels */}
                <div className="flex justify-between text-[10px] text-muted font-mono mt-2">
                  <span>0%</span>
                  <span className="text-cyan-400 font-semibold">Min: {band.min}%</span>
                  <span className="text-cyan-400 font-semibold">Max: {band.max}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Dual Tables: Recent Sessions & Difficulty History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sessions */}
          <div className="p-5 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                Recent Matches
              </h3>
              <Link href="/analytics" className="text-xs text-primary hover:underline">
                View All Analytics →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="pb-2">Difficulty</th>
                    <th className="pb-2">Score</th>
                    <th className="pb-2">Result</th>
                    <th className="pb-2">Accuracy</th>
                    <th className="pb-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recentSessions?.length > 0 ? (
                    recentSessions.map((s: any) => (
                      <tr key={s.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="py-2.5">
                          <DifficultyBadge level={s.difficulty} size="sm" showName={false} />
                        </td>
                        <td className="py-2.5 font-mono font-bold text-foreground">{s.score}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.won ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                            }`}
                          >
                            {s.won ? 'VICTORY' : 'DEFEAT'}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-muted">{Math.round(s.accuracy * 100)}%</td>
                        <td className="py-2.5 text-right text-muted font-mono text-[11px]">
                          {new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted">
                        No matches recorded yet. Play a game in the Arena!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Difficulty Changes */}
          <div className="p-5 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                Difficulty Change Telemetry
              </h3>
              <Link href="/difficulty-history" className="text-xs text-primary hover:underline">
                Full History →
              </Link>
            </div>

            <div className="space-y-3">
              {recentChanges?.length > 0 ? (
                recentChanges.map((c: any) => (
                  <div key={c.id} className="p-3 rounded-xl bg-background border border-border flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-foreground">
                          LEVEL {c.previousDifficulty} → LEVEL {c.newDifficulty}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.adjustment > 0
                              ? 'bg-indigo-950 text-indigo-300'
                              : c.adjustment < 0
                              ? 'bg-amber-950 text-amber-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {c.adjustment > 0 ? '+1' : c.adjustment < 0 ? '-1' : '0'}
                        </span>
                      </div>
                      <p className="text-slate-400 line-clamp-1 text-[11px] font-mono">{c.reason.split('\n')[0]}</p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <span className="text-[10px] text-indigo-300 block font-mono">
                        {Math.round(c.confidence * 100)}% Conf
                      </span>
                      <span className="text-[10px] text-muted font-mono">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-muted text-xs">
                  No adjustments triggered yet. Gameplay will auto-adjust based on performance.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
