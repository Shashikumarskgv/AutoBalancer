'use client';

import React, { useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';
import { RealtimeDifficultyUpdate } from '@game-ai/shared-types';
import { Zap, ArrowUp, ArrowDown, Minus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RealtimeDifficultyModal: React.FC = () => {
  const [update, setUpdate] = useState<RealtimeDifficultyUpdate | null>(null);
  const [visible, setVisible] = useState(false);
  const { refreshProfile } = useAuth();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleDifficultyUpdate = (data: RealtimeDifficultyUpdate) => {
      console.log('[Realtime] Difficulty Updated Event Received:', data);
      setUpdate(data);
      setVisible(true);
      refreshProfile();

      // Auto dismiss after 7 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 7000);
      return () => clearTimeout(timer);
    };

    socket.on('DIFFICULTY_UPDATED', handleDifficultyUpdate);

    return () => {
      socket.off('DIFFICULTY_UPDATED', handleDifficultyUpdate);
    };
  }, [refreshProfile]);

  if (!visible || !update) return null;

  const isUp = update.adjustment > 0;
  const isDown = update.adjustment < 0;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-bounce-in shadow-2xl">
      <div
        className={`p-5 rounded-xl border backdrop-blur-md bg-card/95 transition-all duration-300 ${
          isUp
            ? 'border-indigo-500 shadow-indigo-500/20'
            : isDown
            ? 'border-amber-500 shadow-amber-500/20'
            : 'border-slate-600'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-lg ${
                isUp ? 'bg-indigo-900/60 text-indigo-400' : isDown ? 'bg-amber-900/60 text-amber-400' : 'bg-slate-800 text-slate-300'
              }`}
            >
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-muted">AI Dynamic Balancing</span>
              <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                DIFFICULTY UPDATED
                {isUp && <ArrowUp className="w-5 h-5 text-indigo-400" />}
                {isDown && <ArrowDown className="w-5 h-5 text-amber-400" />}
                {!isUp && !isDown && <Minus className="w-5 h-5 text-slate-400" />}
              </h4>
            </div>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-muted hover:text-foreground p-1 transition-colors rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-3 py-2 px-3 rounded-lg bg-background/80 border border-border flex items-center justify-between">
          <span className="text-sm text-muted">Change:</span>
          <span className="text-lg font-mono font-extrabold text-indigo-300">
            LEVEL {update.previousDifficulty} → LEVEL {update.newDifficulty}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
            {Math.round(update.confidence * 100)}% Confidence
          </span>
        </div>

        <div className="text-xs text-slate-300 bg-background/50 p-2.5 rounded border border-border/50 font-mono whitespace-pre-line leading-relaxed">
          {update.reason}
        </div>

        <div className="mt-2 text-[10px] text-muted text-right">
          Model: {update.modelVersion} • {new Date(update.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
