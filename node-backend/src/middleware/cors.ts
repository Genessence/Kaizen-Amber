import cors from 'cors';
import env from '../config/env';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = Array.isArray(env.CORS_ORIGINS)
      ? env.CORS_ORIGINS
      : [env.CORS_ORIGINS];

    console.log('CORS check:', { 
      origin, 
      allowedOrigins, 
      isArray: Array.isArray(env.CORS_ORIGINS),
      rawValue: process.env.CORS_ORIGINS 
    });

    // When credentials are enabled, we must return the origin string (not true)
    if (!origin) {
      // Allow requests with no origin (like mobile apps or curl requests)
      // But return first allowed origin instead of true when credentials are enabled
      callback(null, allowedOrigins[0] || true);
    } else if (allowedOrigins.includes(origin)) {
      // Return the origin string when credentials are enabled
      console.log('CORS allowed:', origin);
      callback(null, origin);
    } else {
      console.error('CORS blocked:', { origin, allowedOrigins });
      callback(new Error(`Not allowed by CORS. Origin: ${origin}, Allowed: ${allowedOrigins.join(', ')}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization'],
});

