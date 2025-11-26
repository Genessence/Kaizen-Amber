import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { leaderboardService } from '../services/leaderboard.service';

export class CopyImplementController {
  /**
   * Copy and implement a benchmarked practice
   */
  async copyAndImplement(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new ForbiddenError());
      }

      const { original_practice_id, title, description, problem_statement, solution, implementation_status } = req.body;

      // Verify original practice exists and is benchmarked
      const originalPractice = await prisma.bestPractice.findFirst({
        where: {
          id: original_practice_id,
          isDeleted: false,
        },
        include: {
          benchmarked: true,
          plant: true,
        },
      });

      if (!originalPractice) {
        return next(new NotFoundError('Original practice not found'));
      }

      if (!originalPractice.benchmarked) {
        return next(new BadRequestError('Only benchmarked practices can be copied'));
      }

      // Get user's plant
      const userPlantId = req.user.plantId;
      if (!userPlantId) {
        return next(new BadRequestError('Plant users only can copy practices'));
      }

      // Check if already copied by this plant
      const existingCopy = await prisma.copiedPractice.findFirst({
        where: {
          originalPracticeId: original_practice_id,
          copyingPlantId: userPlantId,
        },
      });

      if (existingCopy) {
        return next(new BadRequestError('Practice already copied by your plant'));
      }

      // Create copied practice
      const copiedPractice = await prisma.bestPractice.create({
        data: {
          title: title || originalPractice.title,
          description: description || originalPractice.description,
          categoryId: originalPractice.categoryId,
          submittedByUserId: req.user.userId,
          plantId: userPlantId,
          problemStatement: problem_statement || originalPractice.problemStatement,
          solution: solution || originalPractice.solution,
          benefits: originalPractice.benefits as any,
          metrics: originalPractice.metrics,
          implementation: originalPractice.implementation,
          investment: originalPractice.investment,
          savingsAmount: originalPractice.savingsAmount,
          savingsCurrency: originalPractice.savingsCurrency,
          savingsPeriod: originalPractice.savingsPeriod,
          areaImplemented: originalPractice.areaImplemented,
          status: 'submitted',
          submittedDate: new Date(),
        },
        include: {
          category: true,
          plant: true,
        },
      });

      // Create copy relationship
      const copyRelation = await prisma.copiedPractice.create({
        data: {
          originalPracticeId: original_practice_id,
          copiedPracticeId: copiedPractice.id,
          copyingPlantId: userPlantId,
          copiedDate: new Date(),
          implementationStatus: implementation_status || 'planning',
        },
      });

      // Update leaderboard
      await leaderboardService.awardCopyPoints(original_practice_id, copiedPractice.id, userPlantId);

      res.status(201).json({
        id: copiedPractice.id,
        title: copiedPractice.title,
        original_practice_id,
        copying_plant: {
          id: copiedPractice.plantId,
          name: copiedPractice.plant.name,
        },
        copied_date: copyRelation.copiedDate.toISOString(),
        implementation_status: copyRelation.implementationStatus,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's implementations
   */
  async getMyImplementations(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new ForbiddenError());
      }

      const implementations = await prisma.copiedPractice.findMany({
        where: {
          copyingPlantId: req.user.plantId,
        },
        include: {
          originalPractice: {
            include: {
              category: true,
              plant: true,
            },
          },
          copiedPractice: {
            include: {
              category: true,
            },
          },
        },
        orderBy: { copiedDate: 'desc' },
      });

      res.json(
        implementations.map((impl) => ({
          id: impl.copiedPractice.id,
          title: impl.copiedPractice.title,
          description: impl.copiedPractice.description,
          category: {
            id: impl.copiedPractice.category.id,
            name: impl.copiedPractice.category.name,
          },
          original_practice: {
            id: impl.originalPractice.id,
            title: impl.originalPractice.title,
            plant: impl.originalPractice.plant.name,
          },
          implementation_status: impl.implementationStatus,
          copied_date: impl.copiedDate.toISOString(),
        }))
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;

      const benchmarked = await prisma.benchmarkedPractice.findMany({
        take: limit,
        include: {
          practice: {
            include: {
              plant: {
                select: {
                  id: true,
                  name: true,
                },
              },
              copiedVersions: {
                include: {
                  copyingPlant: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { benchmarkedDate: 'desc' },
      });

      res.json({
        data: benchmarked.map((bp) => ({
          bp: bp.practice.title,
          origin: bp.practice.plant.name,
          copies: bp.practice.copiedVersions.map((copy) => ({
            plant: copy.copyingPlant.name,
            date: copy.copiedDate.toISOString(),
          })),
        })),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const copyImplementController = new CopyImplementController();

