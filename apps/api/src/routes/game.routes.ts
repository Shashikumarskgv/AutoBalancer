import { Router, Request, Response } from 'express';
import { prisma } from '../database/prisma';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { GameplayEventSchema, EndSessionSchema, StartSessionSchema } from '@game-ai/validation';
import { DifficultyController } from '../services/difficultyController';
import { broadcastDifficultyUpdate } from '../socket';
import { DIFFICULTY_CONFIGS, RealtimeDifficultyUpdate } from '@game-ai/shared-types';
import { PerformanceService } from '../services/performance.service';

const router = Router();

// POST /api/game/session - Start a new game session
router.post('/session', requireAuth, validateRequest(StartSessionSchema), async (req: Request, res: Response) => {
  const playerId = req.user!.id;
  const requestedDiff = req.body.difficulty;

  // Retrieve current player difficulty if not overridden
  const profile = await prisma.playerProfile.findUnique({
    where: { userId: playerId },
  });

  const difficulty = requestedDiff || profile?.currentDifficulty || 3;

  const session = await prisma.gameSession.create({
    data: {
      playerId,
      difficulty,
      score: 0,
      won: false,
      completed: false,
    },
  });

  // Record GAME_STARTED event
  await prisma.gameplayEvent.create({
    data: {
      sessionId: session.id,
      playerId,
      eventType: 'GAME_STARTED',
      eventValue: difficulty,
      reactionTime: null,
      metadata: JSON.stringify({ difficulty, config: DIFFICULTY_CONFIGS[difficulty] }),
    },
  });

  return res.status(201).json({
    success: true,
    data: {
      session,
      config: DIFFICULTY_CONFIGS[difficulty] || DIFFICULTY_CONFIGS[3],
    },
  });
});

// POST /api/game/event - Capture a gameplay event and evaluate difficulty dynamically
router.post('/event', requireAuth, validateRequest(GameplayEventSchema), async (req: Request, res: Response) => {
  const playerId = req.user!.id;
  const { sessionId, eventType, difficulty, reactionTime, metadata } = req.body;

  // Ensure session exists
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      error: { code: 'INVALID_SESSION', message: 'Game session not found' },
    });
  }

  // 1. Persist the gameplay event
  const event = await prisma.gameplayEvent.create({
    data: {
      sessionId,
      playerId,
      eventType,
      reactionTime: reactionTime || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });

  // Count total events for this session so far
  const eventsCount = await prisma.gameplayEvent.count({
    where: { sessionId },
  });

  // 2. Evaluate Dynamic Difficulty Adjustment through ML + Guardrails
  let adjustmentResult: any = null;
  try {
    adjustmentResult = await DifficultyController.evaluateAndAdjust(playerId, sessionId, eventsCount);

    // 3. If difficulty changed, broadcast via WebSockets immediately!
    if (adjustmentResult.changed) {
      const updatePayload: RealtimeDifficultyUpdate = {
        type: 'DIFFICULTY_UPDATED',
        previousDifficulty: adjustmentResult.previousDifficulty,
        newDifficulty: adjustmentResult.newDifficulty,
        adjustment: adjustmentResult.adjustment,
        confidence: adjustmentResult.confidence,
        reason: adjustmentResult.reason,
        modelVersion: adjustmentResult.modelVersion,
        timestamp: new Date().toISOString(),
        sessionId,
      };

      broadcastDifficultyUpdate(playerId, updatePayload);

      // Also update active session difficulty so the game runtime updates its params
      await prisma.gameSession.update({
        where: { id: sessionId },
        data: { difficulty: adjustmentResult.newDifficulty },
      });
    }
  } catch (err: any) {
    console.error(`[DifficultyEvaluation] Error during dynamic adjustment: ${err.message}`);
  }

  return res.status(200).json({
    success: true,
    data: {
      eventId: event.id,
      sessionEventsCount: eventsCount,
      difficultyAdjustment: adjustmentResult,
    },
  });
});

// POST /api/game/session/:id/end - End game session
router.post('/session/:id/end', requireAuth, validateRequest(EndSessionSchema), async (req: Request, res: Response) => {
  const playerId = req.user!.id;
  const sessionId = req.params.id;
  const { score, won, completed, targetsHit = 0, targetsMissed = 0, enemiesKilled = 0, damageTaken = 0 } = req.body;

  const totalAttempts = targetsHit + targetsMissed;
  const accuracy = totalAttempts > 0 ? targetsHit / totalAttempts : 0.0;

  // 1. Update Game Session
  const session = await prisma.gameSession.update({
    where: { id: sessionId },
    data: {
      endedAt: new Date(),
      score,
      won,
      completed,
      accuracy: Math.round(accuracy * 1000) / 1000,
      targetsHit,
      targetsMissed,
      enemiesKilled,
      damageTaken,
    },
  });

  // Record GAME_COMPLETED or GAME_ABANDONED event
  await prisma.gameplayEvent.create({
    data: {
      sessionId,
      playerId,
      eventType: completed ? 'GAME_COMPLETED' : 'GAME_ABANDONED',
      eventValue: score,
      reactionTime: null,
      metadata: JSON.stringify({ won, score, accuracy }),
    },
  });

  // 2. Update Player Profile totals
  await prisma.playerProfile.update({
    where: { userId: playerId },
    data: {
      totalGames: { increment: 1 },
      totalScore: { increment: score },
    },
  });

  // 3. Compute and store final performance snapshot
  const metrics = await PerformanceService.calculatePlayerPerformance(playerId, sessionId);
  const snapshot = await PerformanceService.recordSnapshot(playerId, sessionId, metrics);

  return res.status(200).json({
    success: true,
    data: {
      session,
      snapshot,
      metrics,
    },
  });
});

// GET /api/game/session/:id - Get session details
router.get('/session/:id', requireAuth, async (req: Request, res: Response) => {
  const sessionId = req.params.id;
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: {
      events: {
        orderBy: { timestamp: 'asc' },
        take: 100,
      },
      difficultyChanges: true,
    },
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Session not found' },
    });
  }

  return res.status(200).json({ success: true, data: session });
});

export default router;
