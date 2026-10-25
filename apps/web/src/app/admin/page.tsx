'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Sidebar } from '../../components/Sidebar';
import Link from 'next/link';
import { ShieldAlert, Users, Activity, Cpu, ArrowRight, Zap, Trophy, PlayCircle } from 'lucide-react';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'ADMIN') {
        router.push('/dashboard');
      } else {
        fetchAdminData();
      }
    }
  }, [user, loading, router]);

  const fetchAdminData = async () => {
    try {
      const [sRes, hRes] = await Promise.all([
        api.get('/api/admin/system-analytics'),
        api.get('/api/admin/system-health'),
      ]);
      if (sRes.data?.success) setStats(sRes.data.data);
      if (hRes.data?.success) setHealth(hRes.data.data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setFetching(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted">Loading administrator telemetry...</span>
        </div>
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
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <h1 className="text-2xl font-black text-foreground">ADMINISTRATOR CONTROL CONSOLE</h1>
            </div>
            <p className="text-xs text-muted">
              System telemetry oversight, player management, and machine learning model operations.
            </p>
          </div>

          <Link
            href="/admin/model"
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/30 flex items-center gap-2"
          >
            <Cpu className="w-4 h-4" />
            ML Model Management
          </Link>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-[11px] font-semibold text-muted uppercase block mb-1">Registered Players</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-mono font-bold text-foreground">{stats?.totalPlayers || 0}</span>
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-[10px] text-muted block mt-1">Platform user accounts</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-[11px] font-semibold text-muted uppercase block mb-1">Total Game Sessions</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-mono font-bold text-cyan-400">{stats?.totalSessions || 0}</span>
              <PlayCircle className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-[10px] text-muted block mt-1">{stats?.totalCompleted || 0} completed</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-[11px] font-semibold text-muted uppercase block mb-1">Difficulty Adjustments</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-mono font-bold text-amber-400">{stats?.totalChanges || 0}</span>
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-[10px] text-muted block mt-1">Real-time ML decisions</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <span className="text-[11px] font-semibold text-muted uppercase block mb-1">Platform Avg Accuracy</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-mono font-bold text-emerald-400">{stats?.averageAccuracy || 0}%</span>
              <Trophy className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-[10px] text-muted block mt-1">Avg score: {stats?.averageScore || 0}</span>
          </div>
        </div>

        {/* System Health & Microservice Latency Panel (Section 13 & 14 Improvement) */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <Cpu className="w-4 h-4 text-rose-400" />
              Real-Time System Health & Microservice Latency
            </span>
            <span className="text-[10px] text-muted font-mono">
              Live Health Checks Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted block uppercase">Backend API</span>
                <span className="font-mono font-bold text-foreground">Express Server</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted block uppercase">Database Layer</span>
                <span className="font-mono font-bold text-foreground">
                  {health?.database?.latencyMs !== undefined ? `${health.database.latencyMs}ms latency` : 'Connected'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                CONNECTED
              </span>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted block uppercase">ML Inference Service</span>
                <span className="font-mono font-bold text-indigo-300">
                  {health?.mlService?.latencyMs !== undefined ? `${health.mlService.latencyMs}ms ping` : 'Ready'}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                  health?.mlService?.status === 'healthy'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border-amber-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {health?.mlService?.status === 'healthy' ? 'ONLINE (FASTAPI)' : 'FALLBACK READY'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted block uppercase">Active Model</span>
                <span className="font-mono font-bold text-rose-400 truncate max-w-[110px] block">
                  {health?.mlService?.activeModel || 'Gradient Boosting'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                CHAMPION
              </span>
            </div>
          </div>
        </div>

        {/* Admin Navigation Hub Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/players"
            className="p-6 rounded-2xl bg-card border border-border hover:border-indigo-500/50 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-950 flex items-center justify-center text-indigo-400 mb-3 border border-indigo-800">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">Player Directory</h3>
              <p className="text-xs text-muted">
                Inspect registered player profiles, current difficulty tiers, total match sessions, and scores.
              </p>
            </div>
            <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1 mt-4 group-hover:translate-x-1 transition-transform">
              Manage Players <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/admin/analytics"
            className="p-6 rounded-2xl bg-card border border-border hover:border-cyan-500/50 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-950 flex items-center justify-center text-cyan-400 mb-3 border border-cyan-800">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">System-Wide Telemetry</h3>
              <p className="text-xs text-muted">
                Analyze difficulty level distributions, adjustment frequencies, and system audit records.
              </p>
            </div>
            <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1 mt-4 group-hover:translate-x-1 transition-transform">
              View Telemetry <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/admin/model"
            className="p-6 rounded-2xl bg-card border border-border hover:border-rose-500/50 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-950 flex items-center justify-center text-rose-400 mb-3 border border-rose-800">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">Machine Learning Console</h3>
              <p className="text-xs text-muted">
                Inspect active models, confusion matrices, feature importance graphs, and trigger retraining.
              </p>
            </div>
            <span className="text-xs text-rose-400 font-semibold flex items-center gap-1 mt-4 group-hover:translate-x-1 transition-transform">
              ML Console <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
