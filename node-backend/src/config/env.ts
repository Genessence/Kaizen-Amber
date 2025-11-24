import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DEBUG: z.string().transform((val) => val === 'true').default('false'),

  // CORS
  CORS_ORIGINS: z.string().transform((val) => {
    try {
      return JSON.parse(val);
    } catch {
      return val.split(',').map((s: string) => s.trim());
    }
  }),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET_KEY: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  JWT_ALGORITHM: z.string().default('HS256'),
  ACCESS_TOKEN_EXPIRE_MINUTES: z.string().transform(Number).default('30'),
  REFRESH_TOKEN_EXPIRE_DAYS: z.string().transform(Number).default('7'),

  // Azure Storage
  AZURE_STORAGE_CONNECTION_STRING: z.string(),
  AZURE_STORAGE_ACCOUNT_NAME: z.string(),
  AZURE_STORAGE_CONTAINER_PRACTICES: z.string(),
  AZURE_STORAGE_CONTAINER_DOCUMENTS: z.string(),

  // File Upload
  MAX_IMAGE_SIZE_MB: z.string().transform(Number).default('10'),
  MAX_DOCUMENT_SIZE_MB: z.string().transform(Number).default('20'),
  ALLOWED_IMAGE_TYPES: z.string().transform((val) => {
    try {
      return JSON.parse(val);
    } catch {
      return val.split(',').map((s: string) => s.trim());
    }
  }),
  ALLOWED_DOCUMENT_TYPES: z.string().transform((val) => {
    try {
      return JSON.parse(val);
    } catch {
      return val.split(',').map((s: string) => s.trim());
    }
  }),

  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default('10'),
  PASSWORD_MIN_LENGTH: z.string().transform(Number).default('8'),

  // Pagination
  DEFAULT_PAGE_SIZE: z.string().transform(Number).default('20'),
  MAX_PAGE_SIZE: z.string().transform(Number).default('100'),
});

const env = envSchema.parse(process.env);

export default env;

