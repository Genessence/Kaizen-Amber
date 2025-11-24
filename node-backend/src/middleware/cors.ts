import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import env from '../config/env';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = Array.isArray(env.CORS_ORIGINS)
      ? env.CORS_ORIGINS
      : [env.CORS_ORIGINS];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

