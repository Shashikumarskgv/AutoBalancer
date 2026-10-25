export type UserRole = 'PLAYER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerProfile {
  id: string;
  userId: string;
  displayName: string;
  avatar: string;
  currentDifficulty: number; // 1 to 5
  totalGames: number;
  totalScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface GameDifficultyConfig {
  level: number; // 1 to 5
  name: string;
  enemyCount: number;
  enemySpeedMultiplier: number;
  targetSpeedMultiplier: number;
  reactionWindowSeconds: number;
  spawnFrequencySeconds: number;
  damageMultiplier: number;
}

export const DIFFICULTY_CONFIGS: Record<number, GameDifficultyConfig> = {
  1: {
    level: 1,
    name: 'Very Easy',
    enemyCount: 2,
    enemySpeedMultiplier: 0.5,
    targetSpeedMultiplier: 0.5,
    reactionWindowSeconds: 2.5,
    spawnFrequencySeconds: 3.0,
    damageMultiplier: 0.5,
  },
  2: {
    level: 2,
    name: 'Easy',
    enemyCount: 3,
    enemySpeedMultiplier: 0.7,
    targetSpeedMultiplier: 0.7,
    reactionWindowSeconds: 2.0,
    spawnFrequencySeconds: 2.5,
    damageMultiplier: 0.75,
  },
  3: {
    level: 3,
    name: 'Medium',
    enemyCount: 5,
    enemySpeedMultiplier: 1.0,
    targetSpeedMultiplier: 1.0,
    reactionWindowSeconds: 1.5,
    spawnFrequencySeconds: 2.0,
    damageMultiplier: 1.0,
  },
  4: {
    level: 4,
    name: 'Hard',
    enemyCount: 7,
    enemySpeedMultiplier: 1.3,
    targetSpeedMultiplier: 1.3,
    reactionWindowSeconds: 1.1,
    spawnFrequencySeconds: 1.6,
    damageMultiplier: 1.3,
  },
  5: {
    level: 5,
    name: 'Very Hard',
    enemyCount: 10,
    enemySpeedMultiplier: 1.6,
    targetSpeedMultiplier: 1.6,
    reactionWindowSeconds: 0.8,
    spawnFrequencySeconds: 1.2,
    damageMultiplier: 1.7,
  },
};

export type GameplayEventType =
  | 'GAME_STARTED'
  | 'TARGET_HIT'
  | 'TARGET_MISSED'
  | 'ENEMY_KILLED'
  | 'PLAYER_DAMAGED'
  | 'PLAYER_DIED'
  | 'LEVEL_COMPLETED'
  | 'GAME_COMPLETED'
  | 'GAME_ABANDONED';

export interface GameplayEvent {
  id?: string;
  sessionId: string;
  playerId: string;
  eventType: GameplayEventType;
  difficulty: number;
  reactionTime?: number | null; // in ms
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface GameSession {
  id: string;
  playerId: string;
  difficulty: number;
  startedAt: string;
  endedAt?: string | null;
  score: number;
  won: boolean;
  completed: boolean;
  accuracy?: number;
  targetsHit?: number;
  targetsMissed?: number;
  enemiesKilled?: number;
  damageTaken?: number;
}

export interface PerformanceMetrics {
  accuracy: number; // 0.0 -> 1.0
  winRate: number; // 0.0 -> 1.0
  deathRate: number; // 0.0 -> 1.0
  survivalRate: number; // 0.0 -> 1.0
  averageScore: number;
  normalizedScore: number; // 0.0 -> 1.0
  reactionTime: number; // ms
  completionTime: number; // seconds
  performanceScore: number; // 0.0 -> 1.0
  performanceTrend: number; // -1.0 -> 1.0
  consecutiveWins: number;
  consecutiveLosses: number;
  gamesPlayed: number;
  recentAccuracy: number;
  recentWinRate: number;
  recentScore: number;
}

export interface MLPredictionRequest {
  current_difficulty: number;
  accuracy: number;
  win_rate: number;
  death_rate: number;
  survival_rate: number;
  average_score: number;
  reaction_time: number;
  completion_time: number;
  performance_trend: number;
  consecutive_wins: number;
  consecutive_losses: number;
  recent_accuracy?: number;
  recent_win_rate?: number;
  recent_score?: number;
  games_played?: number;
}

export type DifficultyAdjustment = -1 | 0 | 1;

export interface MLPredictionResponse {
  adjustment: DifficultyAdjustment;
  confidence: number;
  recommended_difficulty: number;
  model_version: string;
  probabilities?: {
    decrease: number;
    maintain: number;
    increase: number;
  };
  features_used?: Record<string, number>;
}

export interface DifficultyChange {
  id: string;
  playerId: string;
  sessionId?: string | null;
  previousDifficulty: number;
  newDifficulty: number;
  adjustment: number;
  confidence: number;
  reason: string;
  modelVersion: string;
  createdAt: string;
}

export interface MLModelRecord {
  id: string;
  modelName: string;
  version: string;
  algorithm: string;
  datasetVersion: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  modelPath: string;
  trainedAt: string;
  isActive: boolean;
  confusionMatrix?: number[][];
  featureImportances?: Record<string, number>;
}

export interface RealtimeDifficultyUpdate {
  type: 'DIFFICULTY_UPDATED';
  previousDifficulty: number;
  newDifficulty: number;
  adjustment: number;
  confidence: number;
  reason: string;
  modelVersion: string;
  timestamp: string;
  sessionId: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
