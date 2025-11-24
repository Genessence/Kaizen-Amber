import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { notificationService } from '../services/notification.service';
import { emitToPractice } from '../config/socket';

export class QuestionsController {
  /**
   * Get questions for a practice
   */
  async getPracticeQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const { practiceId } = req.params;

      const questions = await prisma.practiceQuestion.findMany({
        where: { practiceId },
        orderBy: { createdAt: 'desc' },
        include: {
          askedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          answeredBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      res.json(
        questions.map((q) => ({
          id: q.id,
          practice_id: q.practiceId,
          asked_by: {
            id: q.askedBy.id,
            full_name: q.askedBy.fullName,
            email: q.askedBy.email,
          },
          question_text: q.questionText,
          answer_text: q.answerText,
          answered_by: q.answeredBy
            ? {
                id: q.answeredBy.id,
                full_name: q.answeredBy.fullName,
                email: q.answeredBy.email,
              }
            : null,
          answered_at: q.answeredAt?.toISOString(),
          created_at: q.createdAt.toISOString(),
        }))
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ask a question
   */
  async askQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new ForbiddenError());
      }

      const { practiceId } = req.params;
      const { question_text } = req.body;

      // Verify practice exists
      const practice = await prisma.bestPractice.findFirst({
        where: {
          id: practiceId,
          isDeleted: false,
        },
      });

      if (!practice) {
        return next(new NotFoundError('Practice not found'));
      }

      // Create question
      const question = await prisma.practiceQuestion.create({
        data: {
          practiceId,
          askedByUserId: req.user.userId,
          questionText: question_text,
        },
        include: {
          askedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      // Create notifications for practice owner and HQ admins
      await notificationService.notifyQuestionAsked(
        question.id,
        practiceId,
        req.user.userId,
        question_text
      );

      // Emit real-time update to practice room
      emitToPractice(practiceId, 'question-added', {
        id: question.id,
        practice_id: question.practiceId,
        asked_by: {
          id: question.askedBy.id,
          full_name: question.askedBy.fullName,
          email: question.askedBy.email,
        },
        question_text: question.questionText,
        answer_text: question.answerText,
        answered_by: null,
        answered_at: null,
        created_at: question.createdAt.toISOString(),
      });

      res.status(201).json({
        id: question.id,
        practice_id: question.practiceId,
        asked_by: {
          id: question.askedBy.id,
          full_name: question.askedBy.fullName,
          email: question.askedBy.email,
        },
        question_text: question.questionText,
        answer_text: question.answerText,
        answered_by: null,
        answered_at: null,
        created_at: question.createdAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Answer a question
   */
  async answerQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new ForbiddenError());
      }

      const { questionId } = req.params;
      const { answer_text } = req.body;

      // Find question
      const question = await prisma.practiceQuestion.findUnique({
        where: { id: questionId },
        include: {
          practice: true,
        },
      });

      if (!question) {
        return next(new NotFoundError('Question not found'));
      }

      // Check permissions (only practice submitter or HQ can answer)
      if (
        question.practice.submittedByUserId !== req.user.userId &&
        req.user.role !== 'hq'
      ) {
        return next(new ForbiddenError('You do not have permission to answer this question'));
      }

      // Update question
      const updated = await prisma.practiceQuestion.update({
        where: { id: questionId },
        data: {
          answerText: answer_text,
          answeredByUserId: req.user.userId,
          answeredAt: new Date(),
        },
        include: {
          askedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          answeredBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      // Create notification for question asker
      await notificationService.notifyQuestionAnswered(
        questionId,
        question.practiceId,
        question.askedByUserId,
        req.user.userId,
        answer_text
      );

      // Emit real-time update to practice room
      emitToPractice(question.practiceId, 'question-answered', {
        id: updated.id,
        practice_id: updated.practiceId,
        asked_by: {
          id: updated.askedBy.id,
          full_name: updated.askedBy.fullName,
          email: updated.askedBy.email,
        },
        question_text: updated.questionText,
        answer_text: updated.answerText,
        answered_by: {
          id: updated.answeredBy!.id,
          full_name: updated.answeredBy!.fullName,
          email: updated.answeredBy!.email,
        },
        answered_at: updated.answeredAt!.toISOString(),
        created_at: updated.createdAt.toISOString(),
      });

      res.json({
        id: updated.id,
        practice_id: updated.practiceId,
        asked_by: {
          id: updated.askedBy.id,
          full_name: updated.askedBy.fullName,
          email: updated.askedBy.email,
        },
        question_text: updated.questionText,
        answer_text: updated.answerText,
        answered_by: {
          id: updated.answeredBy!.id,
          full_name: updated.answeredBy!.fullName,
          email: updated.answeredBy!.email,
        },
        answered_at: updated.answeredAt!.toISOString(),
        created_at: updated.createdAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a question
   */
  async deleteQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new ForbiddenError());
      }

      const { questionId } = req.params;

      // Find question
      const question = await prisma.practiceQuestion.findUnique({
        where: { id: questionId },
        include: {
          practice: true,
        },
      });

      if (!question) {
        return next(new NotFoundError('Question not found'));
      }

      // Check permissions (only question asker, practice submitter, or HQ can delete)
      if (
        question.askedByUserId !== req.user.userId &&
        question.practice.submittedByUserId !== req.user.userId &&
        req.user.role !== 'hq'
      ) {
        return next(new ForbiddenError('You do not have permission to delete this question'));
      }

      await prisma.practiceQuestion.delete({
        where: { id: questionId },
      });

      res.json({
        success: true,
        message: 'Question deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const questionsController = new QuestionsController();

