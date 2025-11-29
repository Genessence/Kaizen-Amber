import { Router } from 'express';
import { categoriesController } from '../controllers/categories.controller';
import { authenticate } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Cache categories for 5 minutes (they rarely change)
router.get('/', authenticate, cacheMiddleware(5 * 60 * 1000), categoriesController.listCategories.bind(categoriesController));
router.get('/:id', authenticate, cacheMiddleware(5 * 60 * 1000), categoriesController.getCategory.bind(categoriesController));

export default router;

