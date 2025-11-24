import prisma from '../config/database';
import { emitToUser } from '../config/socket';

export type NotificationType = 'question_asked' | 'question_answered' | 'practice_benchmarked';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedPracticeId?: string;
  relatedQuestionId?: string;
}

export class NotificationService {
  /**
   * Create a notification and send via WebSocket
   */
  async createNotification(params: CreateNotificationParams) {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        relatedPracticeId: params.relatedPracticeId || null,
        relatedQuestionId: params.relatedQuestionId || null,
        isRead: false,
      },
      include: {
        relatedPractice: {
          select: {
            id: true,
            title: true,
          },
        },
        relatedQuestion: {
          select: {
            id: true,
            questionText: true,
          },
        },
      },
    });

    // Emit real-time notification via WebSocket
    emitToUser(params.userId, 'notification', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      related_practice_id: notification.relatedPracticeId,
      related_question_id: notification.relatedQuestionId,
      is_read: notification.isRead,
      created_at: notification.createdAt.toISOString(),
    });

    return notification;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Unauthorized to mark this notification as read');
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(userId: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          relatedPractice: {
            select: {
              id: true,
              title: true,
            },
          },
          relatedQuestion: {
            select: {
              id: true,
              questionText: true,
            },
          },
        },
      }),
      prisma.notification.count({
        where: { userId },
      }),
    ]);

    return {
      items: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        related_practice_id: n.relatedPracticeId,
        related_question_id: n.relatedQuestionId,
        is_read: n.isRead,
        created_at: n.createdAt.toISOString(),
        related_practice: n.relatedPractice
          ? {
              id: n.relatedPractice.id,
              title: n.relatedPractice.title,
            }
          : null,
        related_question: n.relatedQuestion
          ? {
              id: n.relatedQuestion.id,
              question_text: n.relatedQuestion.questionText,
            }
          : null,
      })),
      total,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Create notification for practice owner when question is asked
   */
  async notifyQuestionAsked(
    questionId: string,
    practiceId: string,
    askedByUserId: string,
    questionText: string
  ) {
    // Get practice details
    const practice = await prisma.bestPractice.findUnique({
      where: { id: practiceId },
      include: {
        submittedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        plant: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!practice) {
      return;
    }

    // Get user who asked the question
    const askedBy = await prisma.user.findUnique({
      where: { id: askedByUserId },
      select: {
        fullName: true,
        role: true,
      },
    });

    if (!askedBy) {
      return;
    }

    // Notify practice owner (if different from question asker)
    if (practice.submittedByUserId !== askedByUserId) {
      await this.createNotification({
        userId: practice.submittedByUserId,
        type: 'question_asked',
        title: `New Question on "${practice.title}"`,
        message: `${askedBy.fullName} asked: "${questionText.substring(0, 100)}${questionText.length > 100 ? '...' : ''}"`,
        relatedPracticeId: practiceId,
        relatedQuestionId: questionId,
      });
    }

    // Notify all HQ admins
    const hqAdmins = await prisma.user.findMany({
      where: {
        role: 'hq',
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    for (const admin of hqAdmins) {
      if (admin.id !== askedByUserId) {
        await this.createNotification({
          userId: admin.id,
          type: 'question_asked',
          title: `New Question on "${practice.title}"`,
          message: `${askedBy.fullName} asked: "${questionText.substring(0, 100)}${questionText.length > 100 ? '...' : ''}"`,
          relatedPracticeId: practiceId,
          relatedQuestionId: questionId,
        });
      }
    }
  }

  /**
   * Create notification for question asker when question is answered
   */
  async notifyQuestionAnswered(
    questionId: string,
    practiceId: string,
    askedByUserId: string,
    answeredByUserId: string,
    answerText: string
  ) {
    // Get practice details
    const practice = await prisma.bestPractice.findUnique({
      where: { id: practiceId },
      select: {
        title: true,
      },
    });

    if (!practice) {
      return;
    }

    // Get user who answered
    const answeredBy = await prisma.user.findUnique({
      where: { id: answeredByUserId },
      select: {
        fullName: true,
      },
    });

    if (!answeredBy) {
      return;
    }

    // Notify question asker (if different from answerer)
    if (askedByUserId !== answeredByUserId) {
      await this.createNotification({
        userId: askedByUserId,
        type: 'question_answered',
        title: `Your Question Was Answered`,
        message: `${answeredBy.fullName} answered your question on "${practice.title}": "${answerText.substring(0, 100)}${answerText.length > 100 ? '...' : ''}"`,
        relatedPracticeId: practiceId,
        relatedQuestionId: questionId,
      });
    }
  }
}

export const notificationService = new NotificationService();

