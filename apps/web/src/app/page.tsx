'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { Gamepad2, Brain, Activity, ShieldCheck, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-5xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-semibold mb-6">
        <Brain className="w-3.5 h-3.5" />
        AI-Powered Adaptive Game Balancing v1.0
      </div>

      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
        Dynamic Difficulty <br />
        <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
          Auto-Balancing Platform
        </span>
      </h1>

      <p className="text-base sm:text-lg text-slate-300 max-w-2xl mb-10 leading-relaxed">
        Real-time telemetry capture, feature engineering, and a champion 3-class classification ML model that dynamically
        tunes game difficulty between Level 1 and Level 5 to maintain optimal player flow state.
      </p>

      <div className="flex flex-wrap gap-4 justify-center mb-16">
        <Link
          href="/login"
          className="px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-base transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 hover:scale-105 active:scale-95"
        >
          Sign In to Play
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/register"
          className="px-8 py-3.5 rounded-xl bg-secondary hover:bg-slate-700 text-white font-semibold text-base transition-all border border-border"
        >
          Create Player Account
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="w-12 h-12 rounded-xl bg-indigo-950 flex items-center justify-center text-indigo-400 mb-4 border border-indigo-800">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Target Survival Simulator</h3>
          <p className="text-xs text-muted leading-relaxed">
            Fast-paced browser arena simulator with dynamic drone velocity, target speed, spawn intervals, and reaction windows.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="w-12 h-12 rounded-xl bg-purple-950 flex items-center justify-center text-purple-400 mb-4 border border-purple-800">
            <Brain className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Champion ML Engine</h3>
          <p className="text-xs text-muted leading-relaxed">
            3-Class classifier trained on 12,000+ gameplay sessions predicting difficulty adjustments (-1, 0, +1) with calibrated confidence.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="w-12 h-12 rounded-xl bg-emerald-950 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-800">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Guardrails & Real-Time Sync</h3>
          <p className="text-xs text-muted leading-relaxed">
            Multi-stage controller enforcing cooldowns, hysteresis anti-oscillation, step bounds, and WebSocket broadcast.
          </p>
        </div>
      </div>
    </div>
  );
}
