import { Router, Request, Response } from 'express';
import { prisma } from '../database/prisma';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { MLClientService } from '../services/mlClient.service';

const router = Router();

// Apply auth and admin check to all admin routes
router.use(requireAuth, requireAdmin);

// GET /api/admin/system-health - Real-time system health & latency monitor
router.get('/system-health', async (req: Request, res: Response) => {
  const startDb = Date.now();
  let dbStatus = 'healthy';
  let dbLatency = 0;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - startDb;
  } catch (e) {
    dbStatus = 'degraded';
  }

  const startMl = Date.now();
  let mlStatus = 'healthy';
  let mlLatency = 0;
  let activeModel = 'gradient_boosting';
  try {
    const mlHealth = await MLClientService.getModels();
    mlLatency = Date.now() - startMl;
    if (!mlHealth) {
      mlStatus = 'fallback_active';
    } else {
      activeModel = mlHealth.active_model || mlHealth.activeModelKey || 'gradient_boosting';
    }
  } catch (e) {
    mlStatus = 'fallback_active';
  }

  return res.status(200).json({
    success: true,
    data: {
      api: {
        status: 'healthy',
        uptimeSeconds: Math.round(process.uptime()),
        memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      database: { status: dbStatus, latencyMs: dbLatency },
      mlService: { status: mlStatus, latencyMs: mlLatency, activeModel },
      webSocket: { status: 'healthy', provider: 'Socket.IO' },
    },
  });
});

// GET /api/admin/players - View all players
router.get('/players', async (req: Request, res: Response) => {
  const players = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      profile: true,
      _count: {
        select: {
          gameSessions: true,
          difficultyChanges: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json({ success: true, data: players });
});

// GET /api/admin/system-analytics - View overall platform and difficulty stats
router.get('/system-analytics', async (req: Request, res: Response) => {
  const totalPlayers = await prisma.user.count({ where: { role: 'PLAYER' } });
  const totalSessions = await prisma.gameSession.count();
  const totalCompleted = await prisma.gameSession.count({ where: { completed: true } });
  const totalChanges = await prisma.difficultyChange.count();

  // Difficulty distribution of active players
  const difficultyDistribution = await prisma.playerProfile.groupBy({
    by: ['currentDifficulty'],
    _count: {
      id: true,
    },
  });

  // Recent system changes
  const recentChanges = await prisma.difficultyChange.findMany({
    take: 15,
    orderBy: { createdAt: 'desc' },
    include: {
      player: {
        select: { name: true, email: true },
      },
    },
  });

  // Aggregated performance averages
  const avgStats = await prisma.gameSession.aggregate({
    where: { completed: true },
    _avg: {
      accuracy: true,
      score: true,
    },
  });

  return res.status(200).json({
    success: true,
    data: {
      totalPlayers,
      totalSessions,
      totalCompleted,
      totalChanges,
      averageAccuracy: Math.round((avgStats._avg.accuracy || 0) * 100),
      averageScore: Math.round(avgStats._avg.score || 0),
      difficultyDistribution,
      recentChanges,
    },
  });
});

// GET /api/admin/models - View trained ML models and active champion
router.get('/models', async (req: Request, res: Response) => {
  // Try fetching live from ML service
  const liveModels = await MLClientService.getModels();

  if (liveModels && liveModels.models) {
    return res.status(200).json({
      success: true,
      data: {
        activeModelKey: liveModels.active_model,
        timestamp: liveModels.timestamp,
        models: Object.values(liveModels.models),
      },
    });
  }

  // Fallback to database models table
  const dbModels = await prisma.mLModel.findMany({
    orderBy: { trainedAt: 'desc' },
  });

  return res.status(200).json({
    success: true,
    data: {
      activeModelKey: 'random_forest',
      models: dbModels,
    },
  });
});

// POST /api/admin/models/switch - Dynamically switch active model
router.post('/models/switch', async (req: Request, res: Response) => {
  const { modelKey } = req.body;
  if (!modelKey) {
    return res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'modelKey is required' },
    });
  }

  const result = await MLClientService.switchModel(modelKey);
  return res.status(200).json({ success: true, data: result });
});

// POST /api/admin/models/train - Trigger ML model retraining pipeline
router.post('/models/train', async (req: Request, res: Response) => {
  try {
    const result = await MLClientService.retrain();
    return res.status(200).json({
      success: true,
      message: 'Model retraining triggered successfully',
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'RETRAIN_FAILED', message: error.message },
    });
  }
});

// GET /api/admin/models/:id/evaluation - Get model evaluation metrics
router.get('/models/:id/evaluation', async (req: Request, res: Response) => {
  const liveModels = await MLClientService.getModels();
  if (liveModels && liveModels.models) {
    const target = liveModels.models[req.params.id] || Object.values(liveModels.models).find((m: any) => m.version === req.params.id);
    if (target) {
      return res.status(200).json({ success: true, data: target });
    }
  }

  const model = await prisma.mLModel.findFirst({
    where: {
      OR: [{ id: req.params.id }, { version: req.params.id }],
    },
  });

  if (!model) {
    return res.status(404).json({
      success: false,
      error: { code: 'MODEL_NOT_FOUND', message: 'ML model record not found' },
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      ...model,
      metadata: model.metadata ? JSON.parse(model.metadata) : null,
    },
  });
});

export default router;
