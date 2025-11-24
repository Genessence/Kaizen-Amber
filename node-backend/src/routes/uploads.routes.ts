import { Router } from 'express';
import { uploadsController } from '../controllers/uploads.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  presignedUrlSchema,
  confirmImageUploadSchema,
  confirmDocumentUploadSchema,
} from '../utils/validators';

const router = Router();

router.post(
  '/presigned-url',
  authenticate,
  validate(presignedUrlSchema),
  uploadsController.requestPresignedUrl.bind(uploadsController)
);
router.post(
  '/confirm-image/:practiceId',
  authenticate,
  validate(confirmImageUploadSchema),
  uploadsController.confirmImageUpload.bind(uploadsController)
);
router.post(
  '/confirm-document/:practiceId',
  authenticate,
  validate(confirmDocumentUploadSchema),
  uploadsController.confirmDocumentUpload.bind(uploadsController)
);
router.get('/images/:practiceId', authenticate, uploadsController.getPracticeImages.bind(uploadsController));
router.delete('/images/:imageId', authenticate, uploadsController.deletePracticeImage.bind(uploadsController));

export default router;

