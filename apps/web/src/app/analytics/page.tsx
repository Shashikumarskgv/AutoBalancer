'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Sidebar } from '../../components/Sidebar';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3, Activity, Clock, Award, Shield, PieChart as PieIcon } from 'lucide-react';

export default function AnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [perfData, setPerfData] = useState<any>(null);
  const [diffData, setDiffData] = useState<any>(null);
  const [engData, setEngData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchAnalytics();
      }
    }
  }, [user, loading, router]);

  const fetchAnalytics = async () => {
    try {
      const [pRes, dRes, eRes] = await Promise.all([
        api.get('/api/analytics/performance'),
        api.get('/api/analytics/difficulty'),
        api.get('/api/analytics/engagement'),
      ]);

      if (pRes.data?.success) setPerfData(pRes.data.data);
      if (dRes.data?.success) setDiffData(dRes.data.data);
      if (eRes.data?.success) setEngData(eRes.data.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setFetching(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted">Compiling telemetry charts...</span>
        </div>
      </div>
    );
  }

  // Chart 1: Performance Over Time Data
  const snapshots = perfData?.snapshots || [];
  const performanceTrendData = snapshots.map((s: any, idx: number) => ({
    match: `Match ${idx + 1}`,
    scorePct: Math.round(s.performanceScore * 100),
    accuracyPct: Math.round(s.accuracy * 100),
    winRatePct: Math.round(s.winRate * 100),
  }));

  // Chart 2: Difficulty Over Time Data
  const difficultyHistory = diffData?.history || [];
  const diffTimelineData = difficultyHistory.map((h: any, idx: number) => ({
    step: `Adj ${idx + 1}`,
    level: h.newDifficulty,
    time: new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  // Chart 3 & 4: Accuracy & Score by Difficulty
  const difficultyStats = (diffData?.sessionsByDifficulty || []).map((item: any) => ({
    difficulty: `Level ${item.difficulty}`,
    avgAccuracy: Math.round((item._avg?.accuracy || 0) * 100),
    avgScore: Math.round(item._avg?.score || 0),
    matchesCount: item._count?.id || 0,
  }));

  // Chart 7: Difficulty Change Distribution Data
  const dist = diffData?.distribution || { increase: 0, maintain: 0, decrease: 0 };
  const pieData = [
    { name: 'Increase (+1)', value: dist.increase || 1, color: '#6366F1' },
    { name: 'Maintain (0)', value: dist.maintain || 1, color: '#64748B' },
    { name: 'Decrease (-1)', value: dist.decrease || 1, color: '#F59E0B' },
  ];

  return (
    <div className="flex-1 flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-black text-foreground">TELEMETRY & BALANCING ANALYTICS</h1>
          </div>
          <p className="text-xs text-muted">
            Empirical telemetry curves, difficulty progression history, and player engagement dynamics.
          </p>
        </div>

        {/* Engagement KPI Row (Section 28) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-[11px] font-semibold text-muted uppercase block mb-1">Total Sessions</span>
            <span className="text-2xl font-mono font-bold text-foreground">{engData?.totalSessions || 0}</span>
            <span className="text-[10px] text-muted block mt-1">Platform-wide participation</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-[11px] font-semibold text-muted uppercase block mb-1">Avg Session Duration</span>
            <span className="text-2xl font-mono font-bold text-indigo-400">{engData?.avgSessionDuration || 0}s</span>
            <span className="text-[10px] text-muted block mt-1">Engagement persistence</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-[11px] font-semibold text-muted uppercase block mb-1">Completion Rate</span>
            <span className="text-2xl font-mono font-bold text-emerald-400">{engData?.completionRate || 0}%</span>
            <span className="text-[10px] text-muted block mt-1">{engData?.completedSessions || 0} completed</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-[11px] font-semibold text-muted uppercase block mb-1">Difficulty Adjustments</span>
            <span className="text-2xl font-mono font-bold text-amber-400">{difficultyHistory.length}</span>
            <span className="text-[10px] text-muted block mt-1">Automated ML decisions</span>
          </div>
        </div>

        {/* Charts Row 1: Performance Over Time & Difficulty Over Time */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Performance Over Time */}
          <div className="p-5 rounded-2xl bg-card border border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Chart 1: Performance Score Over Time (Sessions)
            </h3>
            <div className="h-64 w-full">
              {performanceTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis dataKey="match" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line type="monotone" dataKey="scorePct" name="Performance Score %" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="accuracyPct" name="Accuracy %" stroke="#22D3EE" strokeWidth={1.5} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted">
                  No snapshot series available. Complete matches in the Arena to generate.
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Difficulty Progression Over Time */}
          <div className="p-5 rounded-2xl bg-card border border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Chart 2: Difficulty Progression (Level 1–5)
            </h3>
            <div className="h-64 w-full">
              {diffTimelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={diffTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis dataKey="step" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '12px' }} />
                    <Line type="stepAfter" dataKey="level" name="Difficulty Level" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted">
                  No difficulty adjustments recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Row 2: Accuracy vs Difficulty & Difficulty Change Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 3: Accuracy vs Difficulty */}
          <div className="p-5 rounded-2xl bg-card border border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              Chart 3: Accuracy vs Difficulty Level
            </h3>
            <div className="h-64 w-full">
              {difficultyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={difficultyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis dataKey="difficulty" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '12px' }} />
                    <Bar dataKey="avgAccuracy" name="Avg Accuracy %" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted">
                  No difficulty correlation metrics available yet.
                </div>
              )}
            </div>
          </div>

          {/* Chart 7: Difficulty Change Distribution */}
          <div className="p-5 rounded-2xl bg-card border border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-amber-400" />
              Chart 7: Difficulty Change Distribution (-1, 0, +1)
            </h3>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
