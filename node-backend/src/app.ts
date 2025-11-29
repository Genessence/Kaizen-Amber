import express, { Express, Request, Response, NextFunction } from 'express';
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

  // CORS must be before other middleware
  app.use(corsMiddleware);
  
  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  }));
  
  // Compression middleware - optimize for speed
  app.use(compression({
    level: 6, // Balance between speed and compression
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      // Don't compress images/video
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging - Always log requests for debugging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
      origin: req.headers.origin,
    });
    next();
  });
  
  if (env.DEBUG) {
    app.use(morgan('dev'));
  }

  // Performance optimization: Add Cache-Control headers for static responses
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Set default headers for all API responses
    if (req.path.startsWith('/api/v1')) {
      // Prevent caching of POST/PUT/PATCH/DELETE
      if (req.method !== 'GET') {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      }
      // Add security headers
      res.set('X-Content-Type-Options', 'nosniff');
      res.set('X-Frame-Options', 'DENY');
    }
    next();
  });

  // Health check - no caching
  app.get('/health', (_req: Request, res: Response) => {
    res.set('Cache-Control', 'no-cache');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API root endpoint
  app.get('/api/v1', (_req: Request, res: Response) => {
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

