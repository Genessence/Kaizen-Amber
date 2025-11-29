import { Router } from 'express';
import { plantsController } from '../controllers/plants.controller';
import { authenticate } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Cache plants for 5 minutes (they rarely change)
router.get('/', authenticate, cacheMiddleware(5 * 60 * 1000), plantsController.listPlants.bind(plantsController));
router.get('/active', authenticate, cacheMiddleware(5 * 60 * 1000), plantsController.getActivePlants.bind(plantsController));
router.get('/:id', authenticate, cacheMiddleware(5 * 60 * 1000), plantsController.getPlant.bind(plantsController));

export default router;

