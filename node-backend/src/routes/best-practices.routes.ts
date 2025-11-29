import { Router } from 'express';
import { bestPracticesController } from '../controllers/best-practices.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { cacheMiddleware, cacheInvalidationMiddleware } from '../middleware/cache';
import {
  createBestPracticeSchema,
  updateBestPracticeSchema,
  listBestPracticesSchema,
} from '../utils/validators';

const router = Router();

// Cache list for 2 minutes (frequently updated but still cacheable)
router.get(
  '/',
  authenticate,
  validate(listBestPracticesSchema),
  cacheMiddleware(2 * 60 * 1000),
  bestPracticesController.listBestPractices.bind(bestPracticesController)
);

// Invalidate caches when creating/updating practices
router.post(
  '/',
  authenticate,
  validate(createBestPracticeSchema),
  cacheInvalidationMiddleware(['/api/v1/best-practices', '/api/v1/analytics', '/api/v1/leaderboard']),
  bestPracticesController.createBestPractice.bind(bestPracticesController)
);

// Cache my-practices for 1 minute
router.get('/my-practices', authenticate, cacheMiddleware(60 * 1000), bestPracticesController.getMyPractices.bind(bestPracticesController));

// Cache recent for 1 minute
router.get('/recent', authenticate, cacheMiddleware(60 * 1000), bestPracticesController.getRecentPractices.bind(bestPracticesController));

// Cache individual practice for 2 minutes
router.get('/:id', authenticate, cacheMiddleware(2 * 60 * 1000), bestPracticesController.getBestPractice.bind(bestPracticesController));

// Invalidate caches when updating
router.patch(
  '/:id',
  authenticate,
  validate(updateBestPracticeSchema),
  cacheInvalidationMiddleware(['/api/v1/best-practices', '/api/v1/analytics']),
  bestPracticesController.updateBestPractice.bind(bestPracticesController)
);

// Invalidate caches when deleting
router.delete('/:id', authenticate, cacheInvalidationMiddleware(['/api/v1/best-practices', '/api/v1/analytics']), bestPracticesController.deleteBestPractice.bind(bestPracticesController));

export default router;

