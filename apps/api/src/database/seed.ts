import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

async function main() {
  console.log('--- Seeding Database ---');

  // Clean existing data
  await prisma.difficultyChange.deleteMany();
  await prisma.performanceSnapshot.deleteMany();
  await prisma.gameplayEvent.deleteMany();
  await prisma.gameSession.deleteMany();
  await prisma.playerProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.mLModel.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('AdminPass123!', salt);
  const playerPassword = await bcrypt.hash('PlayerPass123!', salt);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      name: 'admin',
      email: 'admin@gameai.io',
      passwordHash: adminPassword,
      role: 'ADMIN',
      profile: {
        create: {
          displayName: 'System Admin',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
          currentDifficulty: 4,
          totalGames: 15,
          totalScore: 12450,
        },
      },
    },
  });
  console.log(`Created Admin user: ${admin.email}`);

  // 2. Create Demo Player
  const player = await prisma.user.create({
    data: {
      name: 'ShadowStriker',
      email: 'player1@gameai.io',
      passwordHash: playerPassword,
      role: 'PLAYER',
      profile: {
        create: {
          displayName: 'Shadow Striker',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ShadowStriker',
          currentDifficulty: 3,
          totalGames: 12,
          totalScore: 9280,
        },
      },
    },
  });
  console.log(`Created Player user: ${player.email}`);

  // 3. Create realistic game sessions & history for the player
  const sessionConfigs = [
    { diff: 2, score: 620, won: true, hit: 24, miss: 6, killed: 8, durSec: 90, trend: 0.05, perfScore: 0.68, dateOff: 10 },
    { diff: 2, score: 710, won: true, hit: 28, miss: 4, killed: 10, durSec: 85, trend: 0.08, perfScore: 0.76, dateOff: 9 },
    { diff: 2, score: 780, won: true, hit: 32, miss: 3, killed: 12, durSec: 80, trend: 0.14, perfScore: 0.83, dateOff: 8 },
    // Promoted to diff 3
    { diff: 3, score: 690, won: true, hit: 25, miss: 7, killed: 9, durSec: 95, trend: 0.02, perfScore: 0.71, dateOff: 7 },
    { diff: 3, score: 740, won: true, hit: 29, miss: 5, killed: 11, durSec: 92, trend: 0.06, perfScore: 0.77, dateOff: 6 },
    { diff: 3, score: 810, won: true, hit: 34, miss: 4, killed: 13, durSec: 88, trend: 0.12, perfScore: 0.84, dateOff: 5 },
    // Promoted to diff 4
    { diff: 4, score: 550, won: false, hit: 19, miss: 15, killed: 7, durSec: 110, trend: -0.12, perfScore: 0.52, dateOff: 4 },
    { diff: 4, score: 480, won: false, hit: 16, miss: 18, killed: 6, durSec: 115, trend: -0.18, perfScore: 0.44, dateOff: 3 },
    // Demoted back to diff 3
    { diff: 3, score: 750, won: true, hit: 28, miss: 6, killed: 10, durSec: 90, trend: 0.09, perfScore: 0.75, dateOff: 2 },
    { diff: 3, score: 820, won: true, hit: 33, miss: 4, killed: 12, durSec: 86, trend: 0.15, perfScore: 0.82, dateOff: 1 },
  ];

  const now = new Date();

  for (const s of sessionConfigs) {
    const startedAt = new Date(now.getTime() - s.dateOff * 3600 * 1000);
    const endedAt = new Date(startedAt.getTime() + s.durSec * 1000);
    const accuracy = Math.round((s.hit / (s.hit + s.miss)) * 1000) / 1000;

    const session = await prisma.gameSession.create({
      data: {
        playerId: player.id,
        difficulty: s.diff,
        startedAt,
        endedAt,
        score: s.score,
        won: s.won,
        completed: true,
        accuracy,
        targetsHit: s.hit,
        targetsMissed: s.miss,
        enemiesKilled: s.killed,
        damageTaken: s.won ? 35 : 100,
      },
    });

    // Create sample events
    await prisma.gameplayEvent.createMany({
      data: [
        {
          sessionId: session.id,
          playerId: player.id,
          eventType: 'GAME_STARTED',
          eventValue: s.diff,
          timestamp: startedAt,
        },
        {
          sessionId: session.id,
          playerId: player.id,
          eventType: 'TARGET_HIT',
          reactionTime: 320,
          timestamp: new Date(startedAt.getTime() + 10000),
        },
        {
          sessionId: session.id,
          playerId: player.id,
          eventType: 'TARGET_HIT',
          reactionTime: 290,
          timestamp: new Date(startedAt.getTime() + 20000),
        },
        {
          sessionId: session.id,
          playerId: player.id,
          eventType: s.won ? 'GAME_COMPLETED' : 'PLAYER_DIED',
          eventValue: s.score,
          timestamp: endedAt,
        },
      ],
    });

    // Create performance snapshot
    await prisma.performanceSnapshot.create({
      data: {
        playerId: player.id,
        sessionId: session.id,
        accuracy,
        winRate: s.won ? 0.75 : 0.60,
        deathRate: s.won ? 0.20 : 0.40,
        survivalRate: s.won ? 0.80 : 0.60,
        averageScore: s.score,
        reactionTime: 340,
        completionTime: s.durSec,
        performanceScore: s.perfScore,
        performanceTrend: s.trend,
        createdAt: endedAt,
      },
    });
  }

  // 4. Seed Difficulty Changes
  await prisma.difficultyChange.createMany({
    data: [
      {
        playerId: player.id,
        previousDifficulty: 2,
        newDifficulty: 3,
        adjustment: 1,
        confidence: 0.88,
        reason: 'Difficulty increased from Level 2 → 3.\n• Accuracy: 88%\n• Win Rate: 100%\n• Performance Trend: +14%\nPlayer surpassed the target performance threshold for Level 2.',
        modelVersion: 'rf-1.0.0',
        createdAt: new Date(now.getTime() - 7.5 * 3600 * 1000),
      },
      {
        playerId: player.id,
        previousDifficulty: 3,
        newDifficulty: 4,
        adjustment: 1,
        confidence: 0.86,
        reason: 'Difficulty increased from Level 3 → 4.\n• Accuracy: 86%\n• Win Rate: 100%\n• Performance Trend: +12%\nPlayer demonstrated consistent mastery at Level 3.',
        modelVersion: 'rf-1.0.0',
        createdAt: new Date(now.getTime() - 4.5 * 3600 * 1000),
      },
      {
        playerId: player.id,
        previousDifficulty: 4,
        newDifficulty: 3,
        adjustment: -1,
        confidence: 0.84,
        reason: 'Difficulty decreased from Level 4 → 3.\n• Accuracy: 48%\n• Win Rate: 0%\n• Performance Trend: -18%\nHigh player friction detected. Decreased difficulty to re-establish flow state.',
        modelVersion: 'rf-1.0.0',
        createdAt: new Date(now.getTime() - 2.5 * 3600 * 1000),
      },
    ],
  });

  // 5. Seed ML Model Metadata from trained files
  const metadataPath = path.resolve(__dirname, '../../../../ml/models/metadata.json');
  if (fs.existsSync(metadataPath)) {
    const rawData = fs.readFileSync(metadataPath, 'utf8');
    const metadata = JSON.parse(rawData);

    for (const [key, m] of Object.entries<any>(metadata.models)) {
      await prisma.mLModel.create({
        data: {
          modelName: m.model_name,
          version: m.version,
          algorithm: m.algorithm,
          datasetVersion: m.dataset_version,
          accuracy: m.accuracy,
          precision: m.precision,
          recall: m.recall,
          f1Score: m.f1_score,
          modelPath: m.model_path,
          trainedAt: new Date(m.trained_at),
          isActive: m.is_champion || false,
          metadata: JSON.stringify({
            confusion_matrix: m.confusion_matrix,
            feature_importance: m.feature_importance,
            test_samples: m.test_samples,
          }),
        },
      });
    }
    console.log('Seeded ML Models from metadata.json');
  }

  console.log('--- Database Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
