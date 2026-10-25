import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // fallback

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwtkey_production_grade_game_ai_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  GUARDRAILS: {
    MIN_EVENTS_BEFORE_ADJUSTMENT: parseInt(process.env.MIN_ACTIONS_FOR_ADJUSTMENT || '10', 10),
    COOLDOWN_SECONDS: parseInt(process.env.DIFFICULTY_COOLDOWN_SECONDS || '30', 10),
    MAX_DIFFICULTY_STEP: parseInt(process.env.MAX_DIFFICULTY_STEP || '1', 10),
    CONFIDENCE_THRESHOLD: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.65'),
    HYSTERESIS_THRESHOLD: parseFloat(process.env.HYSTERESIS_THRESHOLD || '0.15'),
  }
};
