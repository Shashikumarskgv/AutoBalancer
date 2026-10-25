'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from '../../components/Sidebar';
import { TargetSurvivalGame } from '../../components/TargetSurvivalGame';

export default function GamePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }

  return (
    <div className="flex-1 flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">TARGET SURVIVAL ARENA</h1>
            <p className="text-xs text-muted">
              Intelligent adaptive simulation. Telemetry is streamed to the ML engine to dynamically scale difficulty.
            </p>
          </div>
        </div>

        <TargetSurvivalGame />
      </main>
    </div>
  );
}
