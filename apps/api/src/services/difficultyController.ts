import { prisma } from '../database/prisma';
import { CONFIG } from '../config';
import { MLClientService } from './mlClient.service';
import { PerformanceService } from './performance.service';
import { MLPredictionRequest, MLPredictionResponse, DifficultyChange } from '@game-ai/shared-types';

export interface GuardrailCheckResult {
  allowed: boolean;
  blockedReason?: string;
  appliedAdjustment: -1 | 0 | 1;
  targetDifficulty: number;
}

export class DifficultyController {
  /**
   * Evaluates player gameplay data through ML and guardrails, records changes, and returns result
   */
  public static async evaluateAndAdjust(
    playerId: string,
    sessionId: string,
    currentEventsCount: number
  ): Promise<{
    changed: boolean;
    previousDifficulty: number;
    newDifficulty: number;
    adjustment: number;
    confidence: number;
    reason: string;
    modelVersion: string;
    blockedReason?: string;
  }> {
    // 1. Fetch player profile to get current difficulty
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: playerId },
    });

    if (!profile) {
      throw new Error(`Profile not found for player: ${playerId}`);
    }

    const currentDifficulty = profile.currentDifficulty;

    // Guardrail 4: Minimum Sample Size
    if (currentEventsCount < CONFIG.GUARDRAILS.MIN_EVENTS_BEFORE_ADJUSTMENT) {
      return {
        changed: false,
        previousDifficulty: currentDifficulty,
        newDifficulty: currentDifficulty,
        adjustment: 0,
        confidence: 1.0,
        reason: `Gathering initial gameplay baseline (${currentEventsCount}/${CONFIG.GUARDRAILS.MIN_EVENTS_BEFORE_ADJUSTMENT} actions required).`,
        modelVersion: 'guardrail-v1',
        blockedReason: 'MINIMUM_SAMPLE_SIZE_NOT_MET',
      };
    }

    // Guardrail 3: Cooldown Window
    const lastChange = await prisma.difficultyChange.findFirst({
      where: { playerId },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    if (lastChange) {
      const secondsSinceLast = (now.getTime() - new Date(lastChange.createdAt).getTime()) / 1000;
      if (secondsSinceLast < CONFIG.GUARDRAILS.COOLDOWN_SECONDS) {
        const remaining = Math.ceil(CONFIG.GUARDRAILS.COOLDOWN_SECONDS - secondsSinceLast);
        return {
          changed: false,
          previousDifficulty: currentDifficulty,
          newDifficulty: currentDifficulty,
          adjustment: 0,
          confidence: 1.0,
          reason: `Adjustment cooldown active (${remaining}s remaining). Stabilizing player experience.`,
          modelVersion: 'guardrail-v1',
          blockedReason: 'COOLDOWN_ACTIVE',
        };
      }
    }

    // 2. Compute real-time performance metrics
    const metrics = await PerformanceService.calculatePlayerPerformance(playerId, sessionId);

    // 3. Prepare ML feature vector
    const featureVector: MLPredictionRequest = {
      current_difficulty: currentDifficulty,
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

    // 4. Send features to ML Service
    const prediction: MLPredictionResponse = await MLClientService.predict(featureVector);

    // 5. Apply Guardrails
    const guardrailResult = this.applyGuardrails(
      currentDifficulty,
      prediction.adjustment,
      lastChange,
      metrics.performanceTrend,
      prediction.confidence
    );

    if (!guardrailResult.allowed || guardrailResult.appliedAdjustment === 0) {
      return {
        changed: false,
        previousDifficulty: currentDifficulty,
        newDifficulty: currentDifficulty,
        adjustment: 0,
        confidence: prediction.confidence,
        reason: guardrailResult.blockedReason || this.generateExplanation(0, currentDifficulty, currentDifficulty, metrics, prediction),
        modelVersion: prediction.model_version,
        blockedReason: guardrailResult.blockedReason,
      };
    }

    const newDifficulty = guardrailResult.targetDifficulty;
    const finalAdjustment = guardrailResult.appliedAdjustment;
    const explanation = this.generateExplanation(
      finalAdjustment,
      currentDifficulty,
      newDifficulty,
      metrics,
      prediction
    );

    // 6. Update player profile in DB
    await prisma.playerProfile.update({
      where: { userId: playerId },
      data: { currentDifficulty: newDifficulty },
    });

    // 7. Persist difficulty change record
    await prisma.difficultyChange.create({
      data: {
        playerId,
        sessionId,
        previousDifficulty: currentDifficulty,
        newDifficulty,
        adjustment: finalAdjustment,
        confidence: prediction.confidence,
        reason: explanation,
        modelVersion: prediction.model_version,
      },
    });

    // 8. Record performance snapshot
    await PerformanceService.recordSnapshot(playerId, sessionId, metrics);

    return {
      changed: true,
      previousDifficulty: currentDifficulty,
      newDifficulty,
      adjustment: finalAdjustment,
      confidence: prediction.confidence,
      reason: explanation,
      modelVersion: prediction.model_version,
    };
  }

  /**
   * Enforces Guardrails 1, 2, 5 and Confidence Threshold
   */
  public static applyGuardrails(
    currentDifficulty: number,
    rawAdjustment: number,
    lastChange: any | null,
    trend: number,
    confidence: number = 1.0
  ): GuardrailCheckResult {
    // Confidence Threshold Guardrail
    if (confidence < CONFIG.GUARDRAILS.CONFIDENCE_THRESHOLD) {
      return {
        allowed: false,
        blockedReason: `CONFIDENCE_THRESHOLD_UNMET: Prediction confidence (${Math.round(confidence * 100)}%) is below safety threshold (${Math.round(CONFIG.GUARDRAILS.CONFIDENCE_THRESHOLD * 100)}%). Maintaining current level.`,
        appliedAdjustment: 0,
        targetDifficulty: currentDifficulty,
      };
    }

    let appliedAdjustment: -1 | 0 | 1 = 0;

    // Guardrail 2: Configurable max step per adjustment
    const maxStep = CONFIG.GUARDRAILS.MAX_DIFFICULTY_STEP;
    if (rawAdjustment > maxStep) appliedAdjustment = maxStep as any;
    else if (rawAdjustment < -maxStep) appliedAdjustment = -maxStep as any;
    else appliedAdjustment = rawAdjustment as -1 | 0 | 1;

    let target = currentDifficulty + appliedAdjustment;

    // Guardrail 1: Boundaries 1 <= difficulty <= 5
    if (target > 5) {
      target = 5;
      appliedAdjustment = 0;
    } else if (target < 1) {
      target = 1;
      appliedAdjustment = 0;
    }

    if (appliedAdjustment === 0) {
      return {
        allowed: false,
        blockedReason: 'BOUNDARY_REACHED_OR_MAINTAIN',
        appliedAdjustment: 0,
        targetDifficulty: currentDifficulty,
      };
    }

    // Guardrail 5: Hysteresis
    // If the last change was +1 (e.g. 3 -> 4), don't immediately revert to 3 on a tiny fluctuation
    // unless the negative trend or degradation is significant.
    if (lastChange) {
      if (lastChange.adjustment === 1 && appliedAdjustment === -1) {
        if (Math.abs(trend) < CONFIG.GUARDRAILS.HYSTERESIS_THRESHOLD) {
          return {
            allowed: false,
            blockedReason: 'HYSTERESIS_BUFFER: Suppressed minor downward oscillation after recent promotion.',
            appliedAdjustment: 0,
            targetDifficulty: currentDifficulty,
          };
        }
      } else if (lastChange.adjustment === -1 && appliedAdjustment === 1) {
        if (trend < CONFIG.GUARDRAILS.HYSTERESIS_THRESHOLD) {
          return {
            allowed: false,
            blockedReason: 'HYSTERESIS_BUFFER: Suppressed premature upward oscillation after recent demotion.',
            appliedAdjustment: 0,
            targetDifficulty: currentDifficulty,
          };
        }
      }
    }

    return {
      allowed: true,
      appliedAdjustment,
      targetDifficulty: target,
    };
  }

  /**
   * Generates a clear, metric-backed explanation (Section 22 of spec)
   */
  public static generateExplanation(
    adjustment: number,
    prevDiff: number,
    newDiff: number,
    metrics: any,
    prediction: MLPredictionResponse
  ): string {
    const accPct = Math.round(metrics.accuracy * 100);
    const wrPct = Math.round(metrics.winRate * 100);
    const trendSign = metrics.performanceTrend >= 0 ? '+' : '';
    const trendPct = `${trendSign}${Math.round(metrics.performanceTrend * 100)}%`;

    if (adjustment === 1) {
      return (
        `Difficulty increased from Level ${prevDiff} → ${newDiff}.\n` +
        `• Accuracy: ${accPct}%\n` +
        `• Win Rate: ${wrPct}%\n` +
        `• Performance Trend: ${trendPct}\n` +
        `• Reaction Time: ${metrics.reactionTime}ms\n` +
        `The player's recent high consistency and target precision indicate that Level ${prevDiff} is below their observed skill ceiling.`
      );
    } else if (adjustment === -1) {
      return (
        `Difficulty decreased from Level ${prevDiff} → ${newDiff}.\n` +
        `• Accuracy: ${accPct}%\n` +
        `• Win Rate: ${wrPct}%\n` +
        `• Performance Trend: ${trendPct}\n` +
        `• Reaction Time: ${metrics.reactionTime}ms\n` +
        `The player is encountering high friction at Level ${prevDiff}. Adjusting difficulty will re-establish optimal game flow and engagement.`
      );
    } else {
      return (
        `Difficulty maintained at Level ${prevDiff}.\n` +
        `• Accuracy: ${accPct}%\n` +
        `• Win Rate: ${wrPct}%\n` +
        `• Performance Score: ${Math.round(metrics.performanceScore * 100)}%\n` +
        `Current challenge is well-aligned with the player's performance band.`
      );
    }
  }
}
