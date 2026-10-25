import { Router, Request, Response } from 'express';
import { prisma } from '../database/prisma';
import { requireAuth } from '../middleware/auth';
import { PerformanceService } from '../services/performance.service';
import { MLClientService } from '../services/mlClient.service';
import { DifficultyController } from '../services/difficultyController';
import { DIFFICULTY_CONFIGS } from '@game-ai/shared-types';

const router = Router();

// GET /api/player/profile
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  const profile = await prisma.playerProfile.findUnique({
    where: { userId: req.user!.id },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      },
    },
  });

  if (!profile) {
    return res.status(404).json({
      success: false,
      error: { code: 'PROFILE_NOT_FOUND', message: 'Player profile not found' },
    });
  }

  return res.status(200).json({ success: true, data: profile });
});

// PUT /api/player/profile
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  const { displayName, avatar } = req.body;

  const profile = await prisma.playerProfile.update({
    where: { userId: req.user!.id },
    data: {
      ...(displayName ? { displayName } : {}),
      ...(avatar ? { avatar } : {}),
    },
  });

  return res.status(200).json({ success: true, data: profile });
});

// GET /api/player/dashboard
router.get('/dashboard', requireAuth, async (req: Request, res: Response) => {
  const playerId = req.user!.id;

  const profile = await prisma.playerProfile.findUnique({
    where: { userId: playerId },
  });

  if (!profile) {
    return res.status(404).json({
      success: false,
      error: { code: 'PROFILE_NOT_FOUND', message: 'Player profile not found' },
    });
  }

  // Calculate real performance metrics
  const metrics = await PerformanceService.calculatePlayerPerformance(playerId);

  // Deaths count
  const deathsCount = await prisma.gameplayEvent.count({
    where: { playerId, eventType: 'PLAYER_DIED' },
  });

  // Fetch ML recommendation based on current features
  const mlFeatures = {
    current_difficulty: profile.currentDifficulty,
    accuracy: metrics.accuracy,
    win_rate: metrics.winRate,
    death_rate: metrics.deathRate,
    survival_rate: metrics.survivalRate,
    average_score: metrics.averageScore,
    reaction_time: metrics.reactionTime,
    completion_time: metrics.completionTime,
    performance_trend: metrics.performanceTrend,
    consecutive_wins: metrics.consecutiveWins,
    consecutive_losses: metrics.consecutiveLosses,
    recent_accuracy: metrics.recentAccuracy,
    recent_win_rate: metrics.recentWinRate,
    recent_score: metrics.recentScore,
    games_played: metrics.gamesPlayed,
  };

  const prediction = await MLClientService.predict(mlFeatures);

  // Generate explanation
  const explanation = DifficultyController.generateExplanation(
    prediction.adjustment,
    profile.currentDifficulty,
    prediction.recommended_difficulty,
    metrics,
    prediction
  );

  // Recent 5 difficulty changes
  const recentChanges = await prisma.difficultyChange.findMany({
    where: { playerId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Recent 5 game sessions
  const recentSessions = await prisma.gameSession.findMany({
    where: { playerId, completed: true },
    orderBy: { startedAt: 'desc' },
    take: 5,
  });

  return res.status(200).json({
    success: true,
    data: {
      profile: {
        id: profile.id,
        displayName: profile.displayName,
        avatar: profile.avatar,
        currentDifficulty: profile.currentDifficulty,
        totalGames: profile.totalGames,
        totalScore: profile.totalScore,
        difficultyConfig: DIFFICULTY_CONFIGS[profile.currentDifficulty] || DIFFICULTY_CONFIGS[3],
      },
      metrics: {
        performanceScore: Math.round(metrics.performanceScore * 100),
        winRate: Math.round(metrics.winRate * 100),
        accuracy: Math.round(metrics.accuracy * 100),
        averageScore: metrics.averageScore,
        deaths: deathsCount,
        reactionTime: metrics.reactionTime,
        performanceTrend: Math.round(metrics.performanceTrend * 100),
      },
      recommendation: {
        adjustment: prediction.adjustment,
        recommendedDifficulty: prediction.recommended_difficulty,
        confidence: Math.round(prediction.confidence * 100),
        reason: explanation,
        modelVersion: prediction.model_version,
      },
      recentChanges,
      recentSessions,
    },
  });
});

// GET /api/player/difficulty-history
router.get('/difficulty-history', requireAuth, async (req: Request, res: Response) => {
  const playerId = req.user!.id;
  const history = await prisma.difficultyChange.findMany({
    where: { playerId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return res.status(200).json({ success: true, data: history });
});

// GET /api/player/analytics
router.get('/analytics', requireAuth, async (req: Request, res: Response) => {
  const playerId = req.user!.id;

  // Fetch snapshots for trend
  const snapshots = await prisma.performanceSnapshot.findMany({
    where: { playerId },
    orderBy: { createdAt: 'asc' },
    take: 30,
  });

  // Fetch sessions
  const sessions = await prisma.gameSession.findMany({
    where: { playerId, completed: true },
    orderBy: { startedAt: 'asc' },
    take: 50,
  });

  // Difficulty changes
  const difficultyChanges = await prisma.difficultyChange.findMany({
    where: { playerId },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  return res.status(200).json({
    success: true,
    data: {
      snapshots,
      sessions,
      difficultyChanges,
    },
  });
});

export default router;
