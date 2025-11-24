import { Router } from 'express';
import { plantsController } from '../controllers/plants.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, plantsController.listPlants.bind(plantsController));
router.get('/active', authenticate, plantsController.getActivePlants.bind(plantsController));
router.get('/:id', authenticate, plantsController.getPlant.bind(plantsController));

export default router;

