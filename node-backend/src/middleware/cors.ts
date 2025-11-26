import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import env from '../config/env';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = Array.isArray(env.CORS_ORIGINS)
      ? env.CORS_ORIGINS
      : [env.CORS_ORIGINS];

    console.log('CORS check:', { origin, allowedOrigins, match: !origin || allowedOrigins.includes(origin) });

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('CORS blocked:', { origin, allowedOrigins });
      callback(new Error(`Not allowed by CORS. Origin: ${origin}, Allowed: ${allowedOrigins.join(', ')}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

