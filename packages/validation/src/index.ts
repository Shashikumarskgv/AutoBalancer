import { z } from 'zod';

export const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and dashes'),
  email: z.string().email('Email must be a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  avatar: z.string().optional(),
});

export const StartSessionSchema = z.object({
  difficulty: z.number().int().min(1).max(5).optional(),
});

export const EndSessionSchema = z.object({
  score: z.number().nonnegative(),
  won: z.boolean(),
  completed: z.boolean(),
  targetsHit: z.number().nonnegative().optional(),
  targetsMissed: z.number().nonnegative().optional(),
  enemiesKilled: z.number().nonnegative().optional(),
  damageTaken: z.number().nonnegative().optional(),
});

export const GameplayEventSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  eventType: z.enum([
    'GAME_STARTED',
    'TARGET_HIT',
    'TARGET_MISSED',
    'ENEMY_KILLED',
    'PLAYER_DAMAGED',
    'PLAYER_DIED',
    'LEVEL_COMPLETED',
    'GAME_COMPLETED',
    'GAME_ABANDONED',
  ]),
  difficulty: z.number().int().min(1).max(5),
  reactionTime: z.number().nonnegative().nullable().optional(),
  timestamp: z.string().datetime().optional().default(() => new Date().toISOString()),
  metadata: z.record(z.any()).optional(),
});

export const MLPredictionRequestSchema = z.object({
  current_difficulty: z.number().int().min(1).max(5),
  accuracy: z.number().min(0).max(1),
  win_rate: z.number().min(0).max(1),
  death_rate: z.number().min(0),
  survival_rate: z.number().min(0).max(1),
  average_score: z.number().nonnegative(),
  reaction_time: z.number().nonnegative(),
  completion_time: z.number().nonnegative(),
  performance_trend: z.number().min(-1).max(1),
  consecutive_wins: z.number().int().nonnegative(),
  consecutive_losses: z.number().int().nonnegative(),
  recent_accuracy: z.number().min(0).max(1).optional(),
  recent_win_rate: z.number().min(0).max(1).optional(),
  recent_score: z.number().nonnegative().optional(),
  games_played: z.number().int().nonnegative().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type StartSessionInput = z.infer<typeof StartSessionSchema>;
export type EndSessionInput = z.infer<typeof EndSessionSchema>;
export type GameplayEventInput = z.infer<typeof GameplayEventSchema>;
export type MLPredictionRequestInput = z.infer<typeof MLPredictionRequestSchema>;
