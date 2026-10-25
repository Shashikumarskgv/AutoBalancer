import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../database/prisma';

const app = createApp();

describe('Gameplay Loop and Dynamic Difficulty Integration Test', () => {
  let authToken: string;
  let userId: string;
  let sessionId: string;

  const playerCreds = {
    username: 'e2ePlayer',
    email: 'e2eplayer@gameai.test',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    displayName: 'E2E Player',
  };

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: playerCreds.email },
    });

    const regRes = await request(app)
      .post('/api/auth/register')
      .send(playerCreds);

    authToken = regRes.body.data.token;
    userId = regRes.body.data.user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: playerCreds.email },
    });
    await prisma.$disconnect();
  });

  it('Step 1: Start a new game session', async () => {
    const res = await request(app)
      .post('/api/game/session')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ difficulty: 3 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.session.difficulty).toBe(3);
    sessionId = res.body.data.session.id;
  });

  it('Step 2: Submit 12 high-performance gameplay events (hits with fast reactions)', async () => {
    for (let i = 0; i < 11; i++) {
      const eventRes = await request(app)
        .post('/api/game/event')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId,
          eventType: 'TARGET_HIT',
          difficulty: 3,
          reactionTime: 230,
          metadata: { combo: i + 1 },
        });

      expect(eventRes.status).toBe(200);
      expect(eventRes.body.success).toBe(true);
    }

    // 1 kill event
    const killRes = await request(app)
      .post('/api/game/event')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        sessionId,
        eventType: 'ENEMY_KILLED',
        difficulty: 3,
        reactionTime: null,
      });

    expect(killRes.status).toBe(200);
  });

  it('Step 3: End game session with high score and victory', async () => {
    const res = await request(app)
      .post(`/api/game/session/${sessionId}/end`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        score: 950,
        won: true,
        completed: true,
        targetsHit: 11,
        targetsMissed: 0,
        enemiesKilled: 1,
        damageTaken: 10,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.session.accuracy).toBe(1.0);
    expect(res.body.data).toHaveProperty('snapshot');
    expect(res.body.data.metrics.accuracy).toBe(1.0);
  });

  it('Step 4: Verify player dashboard reflects real session data', async () => {
    const res = await request(app)
      .get('/api/player/dashboard')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics.accuracy).toBeGreaterThan(0);
    expect(res.body.data.profile.totalGames).toBe(1);
    expect(res.body.data.recommendation).toBeDefined();
    expect(res.body.data.recommendation.confidence).toBeGreaterThan(0);
  });
});
