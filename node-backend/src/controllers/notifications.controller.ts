import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { notificationService } from '../services/notification.service';

export class NotificationsController {
  /**
   * Get notifications
   */
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new ForbiddenError());
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 20;

      const result = await notificationService.getUserNotifications(
        req.user.userId,
        page,
        pageSize
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadNotificationCount(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new ForbiddenError());
      }

      const count = await notificationService.getUnreadCount(req.user.userId);

      res.json({
        unread_count: count,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new ForbiddenError());
      }

      const { id } = req.params;

      try {
        await notificationService.markAsRead(id, req.user.userId);
        res.json({
          id,
          read: true,
        });
      } catch (error: any) {
        if (error.message === 'Notification not found') {
          return next(new NotFoundError('Notification not found'));
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new ForbiddenError());
      }

      await notificationService.markAllAsRead(req.user.userId);

      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationsController = new NotificationsController();

