import { Router } from 'express';
import { notificationsController } from '../controllers/notifications.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, notificationsController.getNotifications.bind(notificationsController));
router.get('/unread-count', authenticate, notificationsController.getUnreadNotificationCount.bind(notificationsController));
router.patch('/:id/read', authenticate, notificationsController.markNotificationAsRead.bind(notificationsController));
router.patch('/read-all', authenticate, notificationsController.markAllNotificationsAsRead.bind(notificationsController));

export default router;

