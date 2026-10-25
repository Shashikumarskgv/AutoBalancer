'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Sidebar } from '../../components/Sidebar';
import { DifficultyBadge } from '../../components/DifficultyBadge';
import { History, Zap, ArrowUp, ArrowDown, Minus, Filter, Calendar } from 'lucide-react';

export default function DifficultyHistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [history, setHistory] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchHistory();
      }
    }
  }, [user, loading, router]);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/api/player/difficulty-history');
      if (res.data?.success) {
        setHistory(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setFetching(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted">Retrieving historical audit logs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-black text-foreground">DIFFICULTY ADJUSTMENT AUDIT TRAIL</h1>
          </div>
          <p className="text-xs text-muted">
            Complete verifiable log of every automatic difficulty modification, confidence score, and model rationale.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-semibold uppercase tracking-wider text-[11px]">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Transition</th>
                  <th className="pb-3">Adjustment</th>
                  <th className="pb-3">Confidence</th>
                  <th className="pb-3">Model Version</th>
                  <th className="pb-3">Reasoning & Telemetry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {history.length > 0 ? (
                  history.map((record) => {
                    const isUp = record.adjustment > 0;
                    const isDown = record.adjustment < 0;

                    return (
                      <tr key={record.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="py-4 text-muted font-mono whitespace-nowrap">
                          {new Date(record.createdAt).toLocaleString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <DifficultyBadge level={record.previousDifficulty} size="sm" showName={false} />
                            <span className="text-muted">→</span>
                            <DifficultyBadge level={record.newDifficulty} size="sm" showName={false} />
                          </div>
                        </td>
                        <td className="py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs ${
                              isUp
                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                                : isDown
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {isUp && <ArrowUp className="w-3 h-3 text-indigo-400" />}
                            {isDown && <ArrowDown className="w-3 h-3 text-amber-400" />}
                            {!isUp && !isDown && <Minus className="w-3 h-3 text-slate-400" />}
                            {isUp ? '+1 INCREASE' : isDown ? '-1 DECREASE' : 'MAINTAIN'}
                          </span>
                        </td>
                        <td className="py-4 font-mono font-bold text-foreground">
                          {Math.round(record.confidence * 100)}%
                        </td>
                        <td className="py-4 font-mono text-indigo-300 whitespace-nowrap">{record.modelVersion}</td>
                        <td className="py-4 text-slate-300 font-mono text-[11px] leading-relaxed max-w-md whitespace-pre-line">
                          {record.reason}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted">
                      No adjustments logged yet. As you engage in the simulator, balancing events will appear here.
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
