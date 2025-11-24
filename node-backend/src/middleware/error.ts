import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';
import env from '../config/env';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      detail: 'Validation error',
      errors: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // App errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      detail: err.message,
    });
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    if ((err as any).code === 'P2002') {
      return res.status(409).json({
        detail: 'A record with this value already exists',
      });
    }
    if ((err as any).code === 'P2025') {
      return res.status(404).json({
        detail: 'Record not found',
      });
    }
  }

  // Unknown errors
  console.error('Unhandled error:', err);
  res.status(500).json({
    detail: env.DEBUG ? err.message : 'Internal server error',
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    detail: `Route ${req.method} ${req.path} not found`,
  });
};

