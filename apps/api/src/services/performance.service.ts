import { prisma } from '../database/prisma';
import { PerformanceMetrics } from '@game-ai/shared-types';

export class PerformanceService {
  /**
   * Calculates real-time performance metrics for a player across their game history and recent session
   */
  public static async calculatePlayerPerformance(playerId: string, currentSessionId?: string): Promise<PerformanceMetrics> {
    // 1. Fetch recent game sessions (up to 20)
    const sessions = await prisma.gameSession.findMany({
      where: { playerId, completed: true },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });

    // 2. Fetch events from current active session if provided, or last 50 events
    const recentEvents = await prisma.gameplayEvent.findMany({
      where: currentSessionId ? { sessionId: currentSessionId } : { playerId },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    const totalGames = sessions.length;

    // Default baseline metrics if no games played yet
    if (totalGames === 0 && recentEvents.length === 0) {
      return {
        accuracy: 0.5,
        winRate: 0.5,
        deathRate: 0.5,
        survivalRate: 0.5,
        averageScore: 400,
        normalizedScore: 0.27,
        reactionTime: 500,
        completionTime: 120,
        performanceScore: 0.5,
        performanceTrend: 0.0,
        consecutiveWins: 0,
        consecutiveLosses: 0,
        gamesPlayed: 0,
        recentAccuracy: 0.5,
        recentWinRate: 0.5,
        recentScore: 400,
      };
    }

    // Reaction time from hit events
    const hitEvents = recentEvents.filter(
      (e) => e.eventType === 'TARGET_HIT' && e.reactionTime && e.reactionTime > 0
    );
    const avgReactionTime =
      hitEvents.length > 0
        ? hitEvents.reduce((acc, e) => acc + (e.reactionTime || 0), 0) / hitEvents.length
        : 450;

    // Accuracy from events
    const totalHits = recentEvents.filter((e) => e.eventType === 'TARGET_HIT').length;
    const totalMisses = recentEvents.filter((e) => e.eventType === 'TARGET_MISSED').length;
    const currentEventAttempts = totalHits + totalMisses;

    let overallAccuracy = 0.5;
    if (currentEventAttempts > 0) {
      overallAccuracy = totalHits / currentEventAttempts;
    } else if (sessions.length > 0) {
      const sumAcc = sessions.reduce((acc, s) => acc + s.accuracy, 0);
      overallAccuracy = sumAcc / sessions.length;
    }

    // Win rate
    const winsCount = sessions.filter((s) => s.won).length;
    const winRate = totalGames > 0 ? winsCount / totalGames : 0.5;

    // Death rate
    const deathsCount = recentEvents.filter((e) => e.eventType === 'PLAYER_DIED').length;
    const deathRate = totalGames > 0 ? Math.min(1.0, deathsCount / totalGames) : 0.3;
    const survivalRate = Math.max(0.0, 1.0 - deathRate);

    // Scores
    const totalScore = sessions.reduce((acc, s) => acc + s.score, 0);
    const averageScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 400;
    const normalizedScore = Math.min(1.0, Math.max(0.0, averageScore / 1500));

    // Completion time
    const completionTimes = sessions
      .filter((s) => s.endedAt)
      .map((s) => Math.round((new Date(s.endedAt!).getTime() - new Date(s.startedAt).getTime()) / 1000));
    const avgCompletionTime =
      completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : 120;

    // Recent window (last 3 games) vs previous window
    const recentSessions = sessions.slice(0, 3);
    const previousSessions = sessions.slice(3, 8);

    const recentAccuracy =
      recentSessions.length > 0
        ? recentSessions.reduce((acc, s) => acc + s.accuracy, 0) / recentSessions.length
        : overallAccuracy;

    const recentWins = recentSessions.filter((s) => s.won).length;
    const recentWinRate = recentSessions.length > 0 ? recentWins / recentSessions.length : winRate;

    const recentScore =
      recentSessions.length > 0
        ? Math.round(recentSessions.reduce((acc, s) => acc + s.score, 0) / recentSessions.length)
        : averageScore;

    // Streaks
    let consecutiveWins = 0;
    let consecutiveLosses = 0;
    for (const session of sessions) {
      if (session.won) {
        if (consecutiveLosses > 0) break;
        consecutiveWins++;
      } else {
        if (consecutiveWins > 0) break;
        consecutiveLosses++;
      }
    }

    // Reaction score: 180ms is perfect (1.0), 1000ms is poor (0.0)
    const reactionScore = Math.min(1.0, Math.max(0.0, 1.0 - (avgReactionTime - 180) / 820));
    // Completion score: 45s is fast (1.0), 300s is slow (0.0)
    const completionScore = Math.min(1.0, Math.max(0.0, 1.0 - (avgCompletionTime - 45) / 255));

    // Performance score formula (Section 12 of spec):
    // 0.30 * accuracy + 0.20 * win_rate + 0.15 * survival_rate + 0.15 * normalized_score + 0.10 * reaction_score + 0.10 * completion_score
    const performanceScore = Math.min(
      1.0,
      Math.max(
        0.0,
        0.30 * overallAccuracy +
        0.20 * winRate +
        0.15 * survivalRate +
        0.15 * normalizedScore +
        0.10 * reactionScore +
        0.10 * completionScore
      )
    );

    // Performance trend: recent performance vs previous performance
    let previousPerformance = performanceScore;
    if (previousSessions.length > 0) {
      const prevAcc = previousSessions.reduce((a, s) => a + s.accuracy, 0) / previousSessions.length;
      const prevWins = previousSessions.filter((s) => s.won).length / previousSessions.length;
      const prevScoreNorm = Math.min(
        1.0,
        previousSessions.reduce((a, s) => a + s.score, 0) / previousSessions.length / 1500
      );
      previousPerformance =
        0.30 * prevAcc +
        0.20 * prevWins +
        0.15 * survivalRate +
        0.15 * prevScoreNorm +
        0.10 * reactionScore +
        0.10 * completionScore;
    }

    const performanceTrend = Math.min(1.0, Math.max(-1.0, performanceScore - previousPerformance));

    return {
      accuracy: Math.round(overallAccuracy * 1000) / 1000,
      winRate: Math.round(winRate * 1000) / 1000,
      deathRate: Math.round(deathRate * 1000) / 1000,
      survivalRate: Math.round(survivalRate * 1000) / 1000,
      averageScore,
      normalizedScore: Math.round(normalizedScore * 1000) / 1000,
      reactionTime: Math.round(avgReactionTime),
      completionTime: Math.round(avgCompletionTime),
      performanceScore: Math.round(performanceScore * 1000) / 1000,
      performanceTrend: Math.round(performanceTrend * 1000) / 1000,
      consecutiveWins,
      consecutiveLosses,
      gamesPlayed: totalGames,
      recentAccuracy: Math.round(recentAccuracy * 1000) / 1000,
      recentWinRate: Math.round(recentWinRate * 1000) / 1000,
      recentScore,
    };
  }

  /**
   * Records a snapshot of performance metrics in the database
   */
  public static async recordSnapshot(
    playerId: string,
    sessionId: string,
    metrics: PerformanceMetrics
  ) {
    return prisma.performanceSnapshot.create({
      data: {
        playerId,
        sessionId,
        accuracy: metrics.accuracy,
        winRate: metrics.winRate,
        deathRate: metrics.deathRate,
        survivalRate: metrics.survivalRate,
        averageScore: metrics.averageScore,
        reactionTime: metrics.reactionTime,
        completionTime: metrics.completionTime,
        performanceScore: metrics.performanceScore,
        performanceTrend: metrics.performanceTrend,
      },
    });
  }
}
