'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import { DIFFICULTY_CONFIGS, GameDifficultyConfig, RealtimeDifficultyUpdate } from '@game-ai/shared-types';
import { DifficultyBadge } from './DifficultyBadge';
import { Shield, Zap, Target as TargetIcon, Flame, Heart, Trophy, Clock, AlertTriangle, Crosshair } from 'lucide-react';
import { getCanvasCoordinates } from '../lib/coordinates';

interface Target {
  id: number;
  x: number;
  y: number;
  radius: number;
  spawnTime: number;
  maxLifeTimeMs: number;
  points: number;
  vx: number;
  vy: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  health: number;
  maxHealth: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

export const TargetSurvivalGame: React.FC = () => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover' | 'victory'>('idle');
  const [currentLevel, setCurrentLevel] = useState<number>(3);
  const [difficultyConfig, setDifficultyConfig] = useState<GameDifficultyConfig>(DIFFICULTY_CONFIGS[3]);

  // HUD Metrics
  const [health, setHealth] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [timeRemaining, setTimeRemaining] = useState<number>(90); // 90-second survival match
  const [targetsHit, setTargetsHit] = useState<number>(0);
  const [targetsMissed, setTargetsMissed] = useState<number>(0);
  const [enemiesKilled, setEnemiesKilled] = useState<number>(0);
  const [damageTaken, setDamageTaken] = useState<number>(0);

  // In-game dynamic difficulty banner
  const [bannerUpdate, setBannerUpdate] = useState<RealtimeDifficultyUpdate | null>(null);

  // Refs for high-speed game loop
  const stateRef = useRef({
    gameState: 'idle',
    health: 100,
    score: 0,
    combo: 1,
    targetsHit: 0,
    targetsMissed: 0,
    enemiesKilled: 0,
    damageTaken: 0,
    currentLevel: 3,
    difficultyConfig: DIFFICULTY_CONFIGS[3],
    sessionId: '',
    targets: [] as Target[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    lastTargetSpawn: 0,
    nextTargetId: 1,
    nextEnemyId: 1,
    mousePos: { x: 450, y: 260, inside: false },
  });

  // Keep stateRef in sync with level updates
  useEffect(() => {
    stateRef.current.currentLevel = currentLevel;
    stateRef.current.difficultyConfig = difficultyConfig;
  }, [currentLevel, difficultyConfig]);

  // Handle incoming real-time difficulty adjustment via Socket.IO
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onDifficultyUpdated = (data: RealtimeDifficultyUpdate) => {
      console.log('[Game Simulator] Real-time difficulty adjusted:', data);
      setCurrentLevel(data.newDifficulty);
      const newConfig = DIFFICULTY_CONFIGS[data.newDifficulty] || DIFFICULTY_CONFIGS[3];
      setDifficultyConfig(newConfig);

      // Flash in-game HUD banner
      setBannerUpdate(data);
      setTimeout(() => setBannerUpdate(null), 5000);

      // Adjust enemies array dynamically
      const currentEnemies = stateRef.current.enemies;
      if (currentEnemies.length < newConfig.enemyCount) {
        // Spawn additional enemies
        const needed = newConfig.enemyCount - currentEnemies.length;
        for (let i = 0; i < needed; i++) {
          spawnEnemy(newConfig);
        }
      }
    };

    socket.on('DIFFICULTY_UPDATED', onDifficultyUpdated);

    return () => {
      socket.off('DIFFICULTY_UPDATED', onDifficultyUpdated);
    };
  }, []);

  // Post gameplay event helper
  const sendEvent = useCallback(
    async (
      eventType: string,
      reactionTime: number | null = null,
      metadata: Record<string, any> = {}
    ) => {
      if (!stateRef.current.sessionId) return;
      try {
        await api.post('/api/game/event', {
          sessionId: stateRef.current.sessionId,
          eventType,
          difficulty: stateRef.current.currentLevel,
          reactionTime,
          metadata,
        });
      } catch (err) {
        console.warn('[EventPost] Error posting game event:', err);
      }
    },
    []
  );

  // Spawn enemy
  const spawnEnemy = (config: GameDifficultyConfig) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const speed = 1.2 * config.enemySpeedMultiplier;
    const angle = Math.random() * Math.PI * 2;
    stateRef.current.enemies.push({
      id: stateRef.current.nextEnemyId++,
      x: Math.random() * (canvas.width - 60) + 30,
      y: Math.random() * (canvas.height - 60) + 30,
      radius: 16,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      health: 2,
      maxHealth: 2,
    });
  };

  // Start game session
  const startGame = async () => {
    try {
      const res = await api.post('/api/game/session');
      if (res.data?.success) {
        const s = res.data.data.session;
        const cfg = res.data.data.config;
        setSessionId(s.id);
        setCurrentLevel(s.difficulty);
        setDifficultyConfig(cfg);

        // Reset game state
        setHealth(100);
        setScore(0);
        setCombo(1);
        setTimeRemaining(90);
        setTargetsHit(0);
        setTargetsMissed(0);
        setEnemiesKilled(0);
        setDamageTaken(0);
        setBannerUpdate(null);
        setGameState('playing');

        stateRef.current = {
          gameState: 'playing',
          health: 100,
          score: 0,
          combo: 1,
          targetsHit: 0,
          targetsMissed: 0,
          enemiesKilled: 0,
          damageTaken: 0,
          currentLevel: s.difficulty,
          difficultyConfig: cfg,
          sessionId: s.id,
          targets: [],
          enemies: [],
          particles: [],
          lastTargetSpawn: Date.now(),
          nextTargetId: 1,
          nextEnemyId: 1,
          mousePos: { x: 450, y: 260, inside: false },
        };

        // Spawn initial enemies
        for (let i = 0; i < cfg.enemyCount; i++) {
          spawnEnemy(cfg);
        }

        // Join socket room
        const socket = getSocket();
        if (socket) {
          socket.emit('join_game_session', s.id);
        }
      }
    } catch (err: any) {
      console.error('Failed to start session:', err);
      alert('Could not start game session. Please verify backend is running.');
    }
  };

  // End game session
  const endGame = useCallback(
    async (won: boolean) => {
      stateRef.current.gameState = won ? 'victory' : 'gameover';
      setGameState(won ? 'victory' : 'gameover');

      try {
        const res = await api.post(`/api/game/session/${stateRef.current.sessionId}/end`, {
          score: stateRef.current.score,
          won,
          completed: true,
          targetsHit: stateRef.current.targetsHit,
          targetsMissed: stateRef.current.targetsMissed,
          enemiesKilled: stateRef.current.enemiesKilled,
          damageTaken: stateRef.current.damageTaken,
        });

        if (res.data?.success) {
          localStorage.setItem('lastGameResult', JSON.stringify(res.data.data));
        }
      } catch (err) {
        console.error('Failed to end game session:', err);
      }
    },
    []
  );

  // Spawn visual particles
  const createExplosion = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1.0,
        color,
        size: Math.random() * 4 + 2,
      });
    }
  };

  // Track mouse coordinates in exact canvas space
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasCoordinates(canvas, e.clientX, e.clientY);
    stateRef.current.mousePos = { x, y, inside: true };
  };

  const handleMouseLeave = () => {
    stateRef.current.mousePos.inside = false;
  };

  // Canvas Mouse Click handler with precision coordinate mapping
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (stateRef.current.gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Precision viewport-to-canvas coordinate mapping (accounts for CSS responsive scaling)
    const { x: clickX, y: clickY } = getCanvasCoordinates(canvas, e.clientX, e.clientY);
    const now = Date.now();

    let hit = false;

    // Check click on targets
    const remainingTargets: Target[] = [];
    for (const target of stateRef.current.targets) {
      const dist = Math.hypot(clickX - target.x, clickY - target.y);
      if (!hit && dist <= target.radius + 6) {
        hit = true;
        const reactionTime = now - target.spawnTime;

        // Score bonus for fast reaction & combo
        const comboMultiplier = stateRef.current.combo;
        const pointsAwarded = Math.round(target.points * (1 + comboMultiplier * 0.2));

        stateRef.current.score += pointsAwarded;
        stateRef.current.targetsHit += 1;
        stateRef.current.combo = Math.min(10, stateRef.current.combo + 1);

        setScore(stateRef.current.score);
        setTargetsHit(stateRef.current.targetsHit);
        setCombo(stateRef.current.combo);

        createExplosion(target.x, target.y, '#6366F1', 15);
        sendEvent('TARGET_HIT', reactionTime, { points: pointsAwarded, combo: stateRef.current.combo });
      } else {
        remainingTargets.push(target);
      }
    }
    stateRef.current.targets = remainingTargets;

    // Check click on enemies
    if (!hit) {
      for (const enemy of stateRef.current.enemies) {
        const dist = Math.hypot(clickX - enemy.x, clickY - enemy.y);
        if (dist <= enemy.radius + 8) {
          hit = true;
          enemy.health -= 1;
          createExplosion(enemy.x, enemy.y, '#EF4444', 8);

          if (enemy.health <= 0) {
            stateRef.current.enemies = stateRef.current.enemies.filter((en) => en.id !== enemy.id);
            stateRef.current.enemiesKilled += 1;
            stateRef.current.score += 150;
            setEnemiesKilled(stateRef.current.enemiesKilled);
            setScore(stateRef.current.score);
            createExplosion(enemy.x, enemy.y, '#F59E0B', 20);
            sendEvent('ENEMY_KILLED', null, { enemyId: enemy.id });

            // Respawn enemy after delay
            setTimeout(() => {
              if (stateRef.current.gameState === 'playing') {
                spawnEnemy(stateRef.current.difficultyConfig);
              }
            }, 2000);
          }
          break;
        }
      }
    }

    // If clicked empty space: Target Missed!
    if (!hit) {
      stateRef.current.targetsMissed += 1;
      stateRef.current.combo = 1; // Break combo
      setTargetsMissed(stateRef.current.targetsMissed);
      setCombo(1);
      createExplosion(clickX, clickY, '#64748B', 5);
      sendEvent('TARGET_MISSED');
    }
  };

  // Main Canvas Render & Animation Loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const now = Date.now();

      // Clear Canvas with sleek grid background
      ctx.fillStyle = '#0B1020';
      ctx.fillRect(0, 0, width, height);

      // Draw faint tactical grid
      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (stateRef.current.gameState === 'playing') {
        const config = stateRef.current.difficultyConfig;

        // 1. Spawning Targets
        const spawnIntervalMs = config.spawnFrequencySeconds * 1000;
        if (now - stateRef.current.lastTargetSpawn > spawnIntervalMs && stateRef.current.targets.length < 5) {
          stateRef.current.lastTargetSpawn = now;
          const targetLifeTime = config.reactionWindowSeconds * 1000;
          stateRef.current.targets.push({
            id: stateRef.current.nextTargetId++,
            x: Math.random() * (width - 80) + 40,
            y: Math.random() * (height - 80) + 40,
            radius: 20,
            spawnTime: now,
            maxLifeTimeMs: targetLifeTime,
            points: 100,
            vx: (Math.random() - 0.5) * config.targetSpeedMultiplier * 1.5,
            vy: (Math.random() - 0.5) * config.targetSpeedMultiplier * 1.5,
          });
        }

        // 2. Update & Draw Targets
        const activeTargets: Target[] = [];
        for (const target of stateRef.current.targets) {
          const age = now - target.spawnTime;
          if (age >= target.maxLifeTimeMs) {
            // Target expired without being hit!
            stateRef.current.targetsMissed += 1;
            stateRef.current.combo = 1;
            setTargetsMissed(stateRef.current.targetsMissed);
            setCombo(1);
            createExplosion(target.x, target.y, '#EF4444', 6);
            sendEvent('TARGET_MISSED');
            continue;
          }

          // Move target slightly
          target.x += target.vx;
          target.y += target.vy;
          if (target.x < target.radius || target.x > width - target.radius) target.vx *= -1;
          if (target.y < target.radius || target.y > height - target.radius) target.vy *= -1;

          // Draw Target countdown radial ring
          const remainingPct = 1 - age / target.maxLifeTimeMs;
          ctx.beginPath();
          ctx.arc(target.x, target.y, target.radius + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remainingPct);
          ctx.strokeStyle = remainingPct > 0.3 ? '#6366F1' : '#EF4444';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Target Body
          ctx.beginPath();
          ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#4F46E5';
          ctx.fill();

          // Target Bullseye rings
          ctx.beginPath();
          ctx.arc(target.x, target.y, target.radius * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = '#818CF8';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(target.x, target.y, target.radius * 0.25, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          activeTargets.push(target);
        }
        stateRef.current.targets = activeTargets;

        // 3. Update & Draw Enemies
        for (const enemy of stateRef.current.enemies) {
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          if (enemy.x < enemy.radius || enemy.x > width - enemy.radius) enemy.vx *= -1;
          if (enemy.y < enemy.radius || enemy.y > height - enemy.radius) enemy.vy *= -1;

          // Draw Enemy Aura
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.radius + 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.fill();

          // Draw Enemy Core
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#EF4444';
          ctx.fill();
          ctx.strokeStyle = '#B91C1C';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Enemy spikes/eyes
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(enemy.x - 4, enemy.y - 3, 2, 4);
          ctx.fillRect(enemy.x + 2, enemy.y - 3, 2, 4);

          // Environmental hazard: continuous proximity contact damage check
          // e.g., if enemy passes close to arena center/turret
          const centerX = width / 2;
          const centerY = height / 2;
          const distToCenter = Math.hypot(enemy.x - centerX, enemy.y - centerY);
          if (distToCenter < enemy.radius + 35) {
            const dmg = 0.15 * config.damageMultiplier;
            stateRef.current.health = Math.max(0, stateRef.current.health - dmg);
            stateRef.current.damageTaken += dmg;
            setHealth(Math.round(stateRef.current.health));

            if (stateRef.current.health <= 0) {
              sendEvent('PLAYER_DIED');
              endGame(false);
              break;
            }
          }
        }

        // Draw Player Turret / Core at Center
        const cx = width / 2;
        const cy = height / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 32, 0, Math.PI * 2);
        ctx.fillStyle = '#1E1B4B';
        ctx.strokeStyle = '#6366F1';
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#818CF8';
        ctx.fill();

        // 4. Update & Draw Particles
        const aliveParticles: Particle[] = [];
        for (const p of stateRef.current.particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.025;
          if (p.alpha > 0) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            aliveParticles.push(p);
          }
        }
        stateRef.current.particles = aliveParticles;

        // 5. Draw Tactical Crosshair Reticle at Pointer (verifies coordinate mapping)
        if (stateRef.current.mousePos.inside) {
          const mx = stateRef.current.mousePos.x;
          const my = stateRef.current.mousePos.y;

          ctx.save();
          // Circular reticle
          ctx.beginPath();
          ctx.arc(mx, my, 10, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.75)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Crosshair ticks
          ctx.strokeStyle = '#22D3EE';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(mx - 15, my);
          ctx.lineTo(mx - 5, my);
          ctx.moveTo(mx + 5, my);
          ctx.lineTo(mx + 15, my);
          ctx.moveTo(mx, my - 15);
          ctx.lineTo(mx, my - 5);
          ctx.moveTo(mx, my + 5);
          ctx.lineTo(mx, my + 15);
          ctx.stroke();

          // Precision center dot
          ctx.beginPath();
          ctx.arc(mx, my, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [endGame, sendEvent]);

  // Match countdown timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          endGame(true); // Victory on timer expiration
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, endGame]);

  // Total attempts & live accuracy
  const totalAttempts = targetsHit + targetsMissed;
  const liveAccuracy = totalAttempts > 0 ? Math.round((targetsHit / totalAttempts) * 100) : 100;

  return (
    <div className="flex flex-col gap-4">
      {/* Dynamic Difficulty In-Game Banner (Section 32) */}
      {bannerUpdate && (
        <div className="p-4 rounded-xl border border-indigo-500 bg-card/95 shadow-xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-900/60 text-indigo-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                DYNAMIC BALANCING EVENT
              </span>
              <h3 className="text-lg font-bold text-foreground">
                DIFFICULTY UPDATED: LEVEL {bannerUpdate.previousDifficulty} → {bannerUpdate.newDifficulty}
              </h3>
              <p className="text-xs text-slate-300 font-mono mt-0.5">{bannerUpdate.reason.split('\n')[0]}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 font-bold border border-indigo-800">
              {Math.round(bannerUpdate.confidence * 100)}% Confidence
            </span>
          </div>
        </div>
      )}

      {/* Game HUD Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 p-3.5 rounded-xl bg-card border border-border items-center">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <div>
            <span className="text-[10px] text-muted uppercase font-semibold">Score</span>
            <p className="text-lg font-extrabold text-foreground font-mono">{score}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          <div>
            <span className="text-[10px] text-muted uppercase font-semibold">Time Remaining</span>
            <p className="text-lg font-extrabold text-foreground font-mono">{timeRemaining}s</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TargetIcon className="w-5 h-5 text-cyan-400" />
          <div>
            <span className="text-[10px] text-muted uppercase font-semibold">Accuracy</span>
            <p className="text-lg font-extrabold text-foreground font-mono">{liveAccuracy}%</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-rose-400" />
          <div>
            <span className="text-[10px] text-muted uppercase font-semibold">Combo</span>
            <p className="text-lg font-extrabold text-rose-400 font-mono">x{combo}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-success" />
          <div className="w-full">
            <div className="flex justify-between text-[10px] text-muted uppercase font-semibold">
              <span>Core Health</span>
              <span>{Math.round(health)}%</span>
            </div>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-300 ${
                  health > 50 ? 'bg-success' : health > 20 ? 'bg-warning' : 'bg-danger'
                }`}
                style={{ width: `${health}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <DifficultyBadge level={currentLevel} size="md" />
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl bg-background">
        <canvas
          ref={canvasRef}
          width={900}
          height={520}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-auto max-h-[560px] cursor-crosshair block"
        />

        {/* Start Overlay */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center mb-4">
              <TargetIcon className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-2">TARGET SURVIVAL ARENA</h2>
            <p className="text-sm text-slate-300 max-w-md mb-6">
              Click targets before their reaction timers deplete. Click red roaming drones to neutralize them before
              they compromise your Core.
            </p>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs text-muted">Initial Difficulty:</span>
              <DifficultyBadge level={currentLevel} size="md" />
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-base transition-all shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95"
            >
              START SIMULATION
            </button>
          </div>
        )}

        {/* Victory Overlay */}
        {gameState === 'victory' && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
            <Trophy className="w-16 h-16 text-amber-400 mb-3 animate-bounce" />
            <h2 className="text-2xl font-extrabold text-foreground mb-1">SIMULATION COMPLETE!</h2>
            <p className="text-sm text-success font-semibold mb-4">Survival Mission Accomplished</p>
            <div className="grid grid-cols-3 gap-4 max-w-md w-full bg-card p-4 rounded-xl border border-border mb-6">
              <div>
                <span className="text-[10px] text-muted">Final Score</span>
                <p className="text-lg font-mono font-bold text-foreground">{score}</p>
              </div>
              <div>
                <span className="text-[10px] text-muted">Accuracy</span>
                <p className="text-lg font-mono font-bold text-foreground">{liveAccuracy}%</p>
              </div>
              <div>
                <span className="text-[10px] text-muted">Final Difficulty</span>
                <p className="text-lg font-mono font-bold text-indigo-400">Level {currentLevel}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={startGame}
                className="px-6 py-2.5 rounded-xl bg-secondary hover:bg-slate-700 text-white font-semibold text-sm transition-colors"
              >
                Play Again
              </button>
              <button
                onClick={() => router.push('/game/result')}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm transition-colors shadow-md shadow-indigo-600/30"
              >
                View Detailed Analytics
              </button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
            <AlertTriangle className="w-16 h-16 text-rose-500 mb-3 animate-pulse" />
            <h2 className="text-2xl font-extrabold text-foreground mb-1">CORE BREACHED</h2>
            <p className="text-sm text-rose-400 font-semibold mb-4">The hazard breached defense thresholds.</p>
            <div className="grid grid-cols-3 gap-4 max-w-md w-full bg-card p-4 rounded-xl border border-border mb-6">
              <div>
                <span className="text-[10px] text-muted">Final Score</span>
                <p className="text-lg font-mono font-bold text-foreground">{score}</p>
              </div>
              <div>
                <span className="text-[10px] text-muted">Accuracy</span>
                <p className="text-lg font-mono font-bold text-foreground">{liveAccuracy}%</p>
              </div>
              <div>
                <span className="text-[10px] text-muted">Difficulty</span>
                <p className="text-lg font-mono font-bold text-rose-400">Level {currentLevel}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={startGame}
                className="px-6 py-2.5 rounded-xl bg-secondary hover:bg-slate-700 text-white font-semibold text-sm transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/game/result')}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm transition-colors"
              >
                Inspect Results
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Difficulty Config Parameters Display */}
      <div className="p-4 rounded-xl bg-card border border-border">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
          Level {currentLevel} Active Parameters ({difficultyConfig.name})
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-background border border-border">
            <span className="text-muted block text-[10px]">Enemy Count</span>
            <span className="font-mono font-bold text-foreground text-sm">{difficultyConfig.enemyCount} drones</span>
          </div>
          <div className="p-2.5 rounded-lg bg-background border border-border">
            <span className="text-muted block text-[10px]">Enemy Velocity</span>
            <span className="font-mono font-bold text-foreground text-sm">{difficultyConfig.enemySpeedMultiplier}x</span>
          </div>
          <div className="p-2.5 rounded-lg bg-background border border-border">
            <span className="text-muted block text-[10px]">Target Speed</span>
            <span className="font-mono font-bold text-foreground text-sm">{difficultyConfig.targetSpeedMultiplier}x</span>
          </div>
          <div className="p-2.5 rounded-lg bg-background border border-border">
            <span className="text-muted block text-[10px]">Reaction Window</span>
            <span className="font-mono font-bold text-foreground text-sm">{difficultyConfig.reactionWindowSeconds}s</span>
          </div>
          <div className="p-2.5 rounded-lg bg-background border border-border">
            <span className="text-muted block text-[10px]">Spawn Rate</span>
            <span className="font-mono font-bold text-foreground text-sm">every {difficultyConfig.spawnFrequencySeconds}s</span>
          </div>
          <div className="p-2.5 rounded-lg bg-background border border-border">
            <span className="text-muted block text-[10px]">Damage Factor</span>
            <span className="font-mono font-bold text-foreground text-sm">{difficultyConfig.damageMultiplier}x</span>
          </div>
        </div>
      </div>
    </div>
  );
};
