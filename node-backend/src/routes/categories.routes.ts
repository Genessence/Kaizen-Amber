import { Router } from 'express';
import { categoriesController } from '../controllers/categories.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, categoriesController.listCategories.bind(categoriesController));
router.get('/:id', authenticate, categoriesController.getCategory.bind(categoriesController));

export default router;

