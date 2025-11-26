import { z } from 'zod';

// Auth validators
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional().default(false),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(['plant', 'hq']),
  plant_id: z.string().uuid().optional(),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
});

// Best Practice validators
const baseBestPracticeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category_id: z.string().uuid('Invalid category ID'),
  problem_statement: z.string().min(1, 'Problem statement is required'),
  solution: z.string().min(1, 'Solution is required'),
  benefits: z.array(z.string()).optional(),
  metrics: z.string().optional(),
  implementation: z.string().optional(),
  investment: z.string().optional(),
  savings_amount: z.number().int().positive(),
  savings_currency: z.enum(['lakhs', 'crores']),
  savings_period: z.enum(['monthly']).default('monthly'),
  area_implemented: z.string().optional(),
  status: z.enum(['draft', 'submitted', 'approved', 'revision_required']).optional(),
});

export const createBestPracticeSchema = baseBestPracticeSchema;

export const updateBestPracticeSchema = baseBestPracticeSchema.partial();

export const listBestPracticesSchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  page_size: z.string().transform(Number).optional(),
  search: z.string().optional(),
  category_id: z.string().uuid().optional(),
  plant_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'submitted', 'approved', 'revision_required']).optional(),
  is_benchmarked: z.string().transform((val) => val === 'true').optional(),
});

// Benchmarking validators
export const copyImplementSchema = z.object({
  original_practice_id: z.string().uuid('Invalid practice ID'),
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  problem_statement: z.string().optional(),
  solution: z.string().optional(),
  implementation_status: z.enum(['planning', 'in_progress', 'completed']).optional(),
});

export const confirmImageUploadSchema = z.object({
  image_type: z.enum(['before', 'after']),
  blob_name: z.string().min(1, 'Blob name is required'),
  file_size: z.number().positive(),
  content_type: z.string().min(1, 'Content type is required'),
});

export const confirmDocumentUploadSchema = z.object({
  document_name: z.string().min(1, 'Document name is required'),
  blob_name: z.string().min(1, 'Blob name is required'),
  file_size: z.number().positive(),
  content_type: z.string().min(1, 'Content type is required'),
});

// Question validators
export const askQuestionSchema = z.object({
  question_text: z.string().min(1, 'Question text is required'),
});

export const answerQuestionSchema = z.object({
  answer_text: z.string().min(1, 'Answer text is required'),
});

// Upload validators
export const presignedUrlSchema = z.object({
  file_name: z.string().min(1, 'File name is required'),
  content_type: z.string().min(1, 'Content type is required'),
  file_type: z.enum(['image', 'document']),
});

// Analytics validators
export const analyticsQuerySchema = z.object({
  year: z.string().transform(Number).optional(),
  month: z.string().transform(Number).optional(),
  currency: z.enum(['lakhs', 'crores']).optional(),
  plant_id: z.string().uuid().optional(),
});

