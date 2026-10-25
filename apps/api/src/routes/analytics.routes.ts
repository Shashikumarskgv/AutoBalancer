import { Router, Request, Response } from 'express';
import { prisma } from '../database/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/analytics/performance
router.get('/performance', requireAuth, async (req: Request, res: Response) => {
  const playerId = req.user!.id;

  const snapshots = await prisma.performanceSnapshot.findMany({
    where: { playerId },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  const sessionTrend = await prisma.gameSession.findMany({
    where: { playerId, completed: true },
    orderBy: { startedAt: 'asc' },
    select: {
      id: true,
      difficulty: true,
      score: true,
      accuracy: true,
      startedAt: true,
      won: true,
    },
    take: 50,
  });

  return res.status(200).json({
    success: true,
    data: {
      snapshots,
      sessionTrend,
    },
  });
});

// GET /api/analytics/difficulty
router.get('/difficulty', requireAuth, async (req: Request, res: Response) => {
  const playerId = req.user!.id;

  const history = await prisma.difficultyChange.findMany({
    where: { playerId },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  // Calculate distribution (-1, 0, 1)
  const distribution = {
    increase: history.filter((h) => h.adjustment === 1).length,
    maintain: history.filter((h) => h.adjustment === 0).length,
    decrease: history.filter((h) => h.adjustment === -1).length,
  };

  // Accuracy vs Difficulty correlation
  const sessionsByDifficulty = await prisma.gameSession.groupBy({
    by: ['difficulty'],
    where: { playerId, completed: true },
    _avg: {
      accuracy: true,
      score: true,
    },
    _count: {
      id: true,
    },
  });

  return res.status(200).json({
    success: true,
    data: {
      history,
      distribution,
      sessionsByDifficulty,
    },
  });
});

// GET /api/analytics/engagement
router.get('/engagement', requireAuth, async (req: Request, res: Response) => {
  const playerId = req.user!.id;

  const totalSessions = await prisma.gameSession.count({ where: { playerId } });
  const completedSessions = await prisma.gameSession.count({ where: { playerId, completed: true } });
  const abandonedSessions = totalSessions - completedSessions;

  const sessions = await prisma.gameSession.findMany({
    where: { playerId, completed: true, endedAt: { not: null } },
    select: { startedAt: true, endedAt: true, score: true, difficulty: true },
  });

  let totalDurationSeconds = 0;
  sessions.forEach((s) => {
    if (s.endedAt) {
      const dur = (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 1000;
      totalDurationSeconds += Math.max(0, dur);
    }
  });

  const avgSessionDuration = sessions.length > 0 ? Math.round(totalDurationSeconds / sessions.length) : 0;

  return res.status(200).json({
    success: true,
    data: {
      totalSessions,
      completedSessions,
      abandonedSessions,
      avgSessionDuration,
      completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
    },
  });
});

export default router;
