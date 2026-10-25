import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import playerRoutes from './routes/player.routes';
import gameRoutes from './routes/game.routes';
import difficultyRoutes from './routes/difficulty.routes';
import analyticsRoutes from './routes/analytics.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middleware/errorHandler';

export const createApp = () => {
  const app = express();

  // Security Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: '*',
      credentials: true,
    })
  );

  // Rate Limiting (relaxed for development and testing)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
      },
    },
  });
  app.use('/api', limiter);

  // Request Parsing & Logging
  app.use(express.json());
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/player', playerRoutes);
  app.use('/api/game', gameRoutes);
  app.use('/api/difficulty', difficultyRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/admin', adminRoutes);

  // Catch-all 404
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Route not found: ${req.method} ${req.originalUrl}`,
      },
    });
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
};
