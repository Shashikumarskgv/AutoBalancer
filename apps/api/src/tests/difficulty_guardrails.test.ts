import { DifficultyController } from '../services/difficultyController';

describe('Dynamic Difficulty Controller Guardrails Unit Tests', () => {
  describe('Guardrail 1: Boundaries (1 <= difficulty <= 5)', () => {
    it('should clamp difficulty increase when already at Level 5', () => {
      const result = DifficultyController.applyGuardrails(5, 1, null, 0.2);
      expect(result.allowed).toBe(false);
      expect(result.targetDifficulty).toBe(5);
      expect(result.appliedAdjustment).toBe(0);
    });

    it('should clamp difficulty decrease when already at Level 1', () => {
      const result = DifficultyController.applyGuardrails(1, -1, null, -0.2);
      expect(result.allowed).toBe(false);
      expect(result.targetDifficulty).toBe(1);
      expect(result.appliedAdjustment).toBe(0);
    });
  });

  describe('Guardrail 2: Maximum 1 level change per adjustment', () => {
    it('should prevent multi-level jumps (e.g., raw adjustment of +3 should clamp to +1)', () => {
      const result = DifficultyController.applyGuardrails(2, 3, null, 0.3);
      expect(result.allowed).toBe(true);
      expect(result.appliedAdjustment).toBe(1);
      expect(result.targetDifficulty).toBe(3);
    });

    it('should prevent multi-level demotion (e.g., raw adjustment of -2 should clamp to -1)', () => {
      const result = DifficultyController.applyGuardrails(4, -2, null, -0.3);
      expect(result.allowed).toBe(true);
      expect(result.appliedAdjustment).toBe(-1);
      expect(result.targetDifficulty).toBe(3);
    });
  });

  describe('Guardrail 5: Hysteresis (Anti-oscillation)', () => {
    it('should block minor downward oscillation right after an upward promotion', () => {
      const lastChange = {
        adjustment: 1,
        previousDifficulty: 3,
        newDifficulty: 4,
        createdAt: new Date(),
      };
      // Minor negative trend (-0.05 is within hysteresis threshold of 0.15)
      const result = DifficultyController.applyGuardrails(4, -1, lastChange, -0.05);
      expect(result.allowed).toBe(false);
      expect(result.blockedReason).toContain('HYSTERESIS_BUFFER');
      expect(result.targetDifficulty).toBe(4);
    });

    it('should allow downward demotion after promotion if degradation is severe', () => {
      const lastChange = {
        adjustment: 1,
        previousDifficulty: 3,
        newDifficulty: 4,
        createdAt: new Date(),
      };
      // Severe negative trend (-0.30 exceeds hysteresis threshold)
      const result = DifficultyController.applyGuardrails(4, -1, lastChange, -0.30);
      expect(result.allowed).toBe(true);
      expect(result.appliedAdjustment).toBe(-1);
      expect(result.targetDifficulty).toBe(3);
    });
  });

  describe('Adjustment Explanation Generator', () => {
    it('should generate metric-backed text for promotion', () => {
      const explanation = DifficultyController.generateExplanation(
        1,
        3,
        4,
        { accuracy: 0.88, winRate: 0.80, performanceTrend: 0.15, reactionTime: 320, performanceScore: 0.82 },
        { adjustment: 1, confidence: 0.89, recommended_difficulty: 4, model_version: 'rf-1.0.0' } as any
      );
      expect(explanation).toContain('Difficulty increased from Level 3 → 4');
      expect(explanation).toContain('Accuracy: 88%');
      expect(explanation).toContain('Win Rate: 80%');
      expect(explanation).toContain('Performance Trend: +15%');
    });
  });
});
