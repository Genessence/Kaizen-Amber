import { Router } from 'express';
import { bestPracticesController } from '../controllers/best-practices.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createBestPracticeSchema,
  updateBestPracticeSchema,
  listBestPracticesSchema,
} from '../utils/validators';

const router = Router();

router.get(
  '/',
  authenticate,
  validate(listBestPracticesSchema),
  bestPracticesController.listBestPractices.bind(bestPracticesController)
);
router.post(
  '/',
  authenticate,
  validate(createBestPracticeSchema),
  bestPracticesController.createBestPractice.bind(bestPracticesController)
);
router.get('/my-practices', authenticate, bestPracticesController.getMyPractices.bind(bestPracticesController));
router.get('/recent', authenticate, bestPracticesController.getRecentPractices.bind(bestPracticesController));
router.get('/:id', authenticate, bestPracticesController.getBestPractice.bind(bestPracticesController));
router.patch(
  '/:id',
  authenticate,
  validate(updateBestPracticeSchema),
  bestPracticesController.updateBestPractice.bind(bestPracticesController)
);
router.delete('/:id', authenticate, bestPracticesController.deleteBestPractice.bind(bestPracticesController));

export default router;

