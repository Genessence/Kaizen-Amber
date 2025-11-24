import { Router } from 'express';
import { copyImplementController } from '../controllers/copy-implement.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { copyImplementSchema } from '../utils/validators';

const router = Router();

router.post(
  '/copy',
  authenticate,
  validate(copyImplementSchema),
  copyImplementController.copyAndImplement.bind(copyImplementController)
);
router.get('/my-implementations', authenticate, copyImplementController.getMyImplementations.bind(copyImplementController));
router.get('/deployment-status', authenticate, copyImplementController.getDeploymentStatus.bind(copyImplementController));

export default router;

