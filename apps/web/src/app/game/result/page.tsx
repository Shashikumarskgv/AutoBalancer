'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../../components/Sidebar';
import { DifficultyBadge } from '../../../components/DifficultyBadge';
import Link from 'next/link';
import { Trophy, Target, Shield, Zap, ArrowRight, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';

export default function GameResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem('lastGameResult');
    if (raw) {
      try {
        setResult(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const session = result?.session;
  const metrics = result?.metrics;
  const won = session?.won;

  return (
    <div className="flex-1 flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="text-center py-6">
          <div className="inline-flex p-3 rounded-2xl bg-card border border-border mb-3">
            {won ? (
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            ) : (
              <XCircle className="w-12 h-12 text-rose-500" />
            )}
          </div>
          <h1 className="text-3xl font-black text-foreground">
            {won ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}
          </h1>
          <p className="text-xs text-muted mt-1">
            Telemetry collected and evaluated against the machine learning baseline model
          </p>
        </div>

        {/* Core Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-[11px] text-muted block mb-1 uppercase font-semibold">Match Score</span>
            <span className="text-2xl font-black text-amber-400 font-mono">{session?.score || 0}</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-[11px] text-muted block mb-1 uppercase font-semibold">Match Accuracy</span>
            <span className="text-2xl font-black text-cyan-400 font-mono">
              {Math.round((session?.accuracy || 0) * 100)}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-[11px] text-muted block mb-1 uppercase font-semibold">Targets Neutralized</span>
            <span className="text-2xl font-black text-foreground font-mono">
              {session?.targetsHit || 0} / {(session?.targetsHit || 0) + (session?.targetsMissed || 0)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-[11px] text-muted block mb-1 uppercase font-semibold">Current Difficulty</span>
            <div className="mt-1">
              <DifficultyBadge level={session?.difficulty || 3} size="sm" />
            </div>
          </div>
        </div>

        {/* Calculated Telemetry Snapshot */}
        {metrics && (
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              Real-Time Performance Engine Metrics
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-background border border-border">
                <span className="text-muted block text-[10px]">Composite Performance Score</span>
                <span className="font-mono font-bold text-indigo-400 text-base">
                  {Math.round(metrics.performanceScore * 100)}%
                </span>
              </div>

              <div className="p-3 rounded-lg bg-background border border-border">
                <span className="text-muted block text-[10px]">Performance Trend</span>
                <span
                  className={`font-mono font-bold text-base ${
                    metrics.performanceTrend > 0 ? 'text-emerald-400' : metrics.performanceTrend < 0 ? 'text-rose-400' : 'text-slate-300'
                  }`}
                >
                  {metrics.performanceTrend > 0 ? '+' : ''}
                  {Math.round(metrics.performanceTrend * 100)}%
                </span>
              </div>

              <div className="p-3 rounded-lg bg-background border border-border">
                <span className="text-muted block text-[10px]">Reaction Time</span>
                <span className="font-mono font-bold text-foreground text-base">{metrics.reactionTime} ms</span>
              </div>

              <div className="p-3 rounded-lg bg-background border border-border">
                <span className="text-muted block text-[10px]">Overall Win Rate</span>
                <span className="font-mono font-bold text-foreground text-base">
                  {Math.round(metrics.winRate * 100)}%
                </span>
              </div>

              <div className="p-3 rounded-lg bg-background border border-border">
                <span className="text-muted block text-[10px]">Consecutive Victories</span>
                <span className="font-mono font-bold text-foreground text-base">{metrics.consecutiveWins}</span>
              </div>

              <div className="p-3 rounded-lg bg-background border border-border">
                <span className="text-muted block text-[10px]">Consecutive Losses</span>
                <span className="font-mono font-bold text-foreground text-base">{metrics.consecutiveLosses}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-4">
          <Link
            href="/game"
            className="px-6 py-3 rounded-xl bg-secondary hover:bg-slate-700 text-white font-semibold text-sm transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
          >
            Return to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
