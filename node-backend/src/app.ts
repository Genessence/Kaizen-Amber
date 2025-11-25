import express, { Express } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { corsMiddleware } from './middleware/cors';
import { errorHandler, notFoundHandler } from './middleware/error';
import env from './config/env';

// Import routes
import authRoutes from './routes/auth.routes';
import plantsRoutes from './routes/plants.routes';
import categoriesRoutes from './routes/categories.routes';
import bestPracticesRoutes from './routes/best-practices.routes';
import benchmarkingRoutes from './routes/benchmarking.routes';
import copyImplementRoutes from './routes/copy-implement.routes';
import questionsRoutes from './routes/questions.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import analyticsRoutes from './routes/analytics.routes';
import uploadsRoutes from './routes/uploads.routes';
import notificationsRoutes from './routes/notifications.routes';

const createApp = (): Express => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(corsMiddleware);
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging
  if (env.DEBUG) {
    app.use(morgan('dev'));
  }

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API root endpoint
  app.get('/api/v1', (req, res) => {
    res.json({
      name: 'Amber Best Practice Portal API',
      version: '1.0.0',
      status: 'ok',
      endpoints: {
        auth: '/api/v1/auth',
        plants: '/api/v1/plants',
        categories: '/api/v1/categories',
        bestPractices: '/api/v1/best-practices',
        benchmarking: '/api/v1/benchmarking',
        copyImplement: '/api/v1/copy-implement',
        questions: '/api/v1/questions',
        leaderboard: '/api/v1/leaderboard',
        analytics: '/api/v1/analytics',
        uploads: '/api/v1/uploads',
        notifications: '/api/v1/notifications',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/plants', plantsRoutes);
  app.use('/api/v1/categories', categoriesRoutes);
  app.use('/api/v1/best-practices', bestPracticesRoutes);
  app.use('/api/v1/benchmarking', benchmarkingRoutes);
  app.use('/api/v1/copy-implement', copyImplementRoutes);
  app.use('/api/v1/questions', questionsRoutes);
  app.use('/api/v1/leaderboard', leaderboardRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/uploads', uploadsRoutes);
  app.use('/api/v1/notifications', notificationsRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;

