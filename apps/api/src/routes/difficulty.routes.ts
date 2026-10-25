import { Router, Request, Response } from 'express';
import { prisma } from '../database/prisma';
import { requireAuth } from '../middleware/auth';
import { DIFFICULTY_CONFIGS } from '@game-ai/shared-types';
import { DifficultyController } from '../services/difficultyController';

const router = Router();

// GET /api/difficulty/current
router.get('/current', requireAuth, async (req: Request, res: Response) => {
  const profile = await prisma.playerProfile.findUnique({
    where: { userId: req.user!.id },
  });

  const level = profile?.currentDifficulty || 3;
  return res.status(200).json({
    success: true,
    data: {
      difficulty: level,
      config: DIFFICULTY_CONFIGS[level] || DIFFICULTY_CONFIGS[3],
    },
  });
});

// POST /api/difficulty/evaluate
router.post('/evaluate', requireAuth, async (req: Request, res: Response) => {
  const playerId = req.user!.id;
  const { sessionId } = req.body;

  const eventsCount = await prisma.gameplayEvent.count({
    where: sessionId ? { sessionId } : { playerId },
  });

  const result = await DifficultyController.evaluateAndAdjust(playerId, sessionId || '', eventsCount);

  return res.status(200).json({
    success: true,
    data: result,
  });
});

// GET /api/difficulty/history
router.get('/history', requireAuth, async (req: Request, res: Response) => {
  const history = await prisma.difficultyChange.findMany({
    where: { playerId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return res.status(200).json({
    success: true,
    data: history,
  });
});

export default router;
