import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../utils/errors';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        ...req.body,
        ...req.query,
        ...req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new BadRequestError(error.errors[0].message));
      }
      next(error);
    }
  };
};

