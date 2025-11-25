import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';

export class BenchmarkingController {
  /**
   * Benchmark a practice (HQ only)
   */
  async benchmarkPractice(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'hq') {
        return next(new ForbiddenError('Only HQ admins can benchmark practices'));
      }

      const { id } = req.params;

      // Check if practice exists
      const practice = await prisma.bestPractice.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

      if (!practice) {
        return next(new NotFoundError('Best practice not found'));
      }

      // Check if already benchmarked
      const existing = await prisma.benchmarkedPractice.findUnique({
        where: { practiceId: id },
      });

      if (existing) {
        return next(new ConflictError('Practice is already benchmarked'));
      }

      // Create benchmark
      const benchmarked = await prisma.benchmarkedPractice.create({
        data: {
          practiceId: id,
          benchmarkedByUserId: req.user.userId,
          benchmarkedDate: new Date(),
        },
        include: {
          practice: {
            include: {
              category: true,
              plant: true,
            },
          },
        },
      });

      res.status(201).json({
        id: benchmarked.id,
        practice_id: benchmarked.practiceId,
        benchmarked_by_user_id: benchmarked.benchmarkedByUserId,
        benchmarked_date: benchmarked.benchmarkedDate.toISOString(),
        created_at: benchmarked.createdAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unbenchmark a practice (HQ only)
   */
  async unbenchmarkPractice(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'hq') {
        return next(new ForbiddenError('Only HQ admins can unbenchmark practices'));
      }

      const { id } = req.params;

      const benchmarked = await prisma.benchmarkedPractice.findUnique({
        where: { practiceId: id },
      });

      if (!benchmarked) {
        return next(new NotFoundError('Practice is not benchmarked'));
      }

      await prisma.benchmarkedPractice.delete({
        where: { practiceId: id },
      });

      res.json({
        success: true,
        message: 'Practice unbenchmarked successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List benchmarked practices
   */
  async listBenchmarkedPractices(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 20;
      const skip = (page - 1) * pageSize;

      const where: any = {
        practice: {
          isDeleted: false,
        },
      };

      const total = await prisma.benchmarkedPractice.count({ where });

      const benchmarked = await prisma.benchmarkedPractice.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { benchmarkedDate: 'desc' },
        include: {
          practice: {
            include: {
              category: true,
              plant: {
                select: {
                  id: true,
                  name: true,
                  shortName: true,
                },
              },
              submittedBy: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      });

      res.json({
        items: benchmarked.map((bp) => ({
          id: bp.practice.id,
          title: bp.practice.title,
          description: bp.practice.description,
          problem_statement: bp.practice.problemStatement,
          solution: bp.practice.solution,
          category: {
            id: bp.practice.category.id,
            name: bp.practice.category.name,
          },
          plant: {
            id: bp.practice.plant.id,
            name: bp.practice.plant.name,
            short_name: bp.practice.plant.shortName,
          },
          submitted_by: {
            id: bp.practice.submittedBy.id,
            full_name: bp.practice.submittedBy.fullName,
          },
          benchmarked_date: bp.benchmarkedDate.toISOString(),
          savings_amount: bp.practice.savingsAmount,
          savings_currency: bp.practice.savingsCurrency,
        })),
        total,
        page,
        page_size: pageSize,
        total_pages: Math.ceil(total / pageSize),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent benchmarked practices
   */
  async getRecentBenchmarkedPractices(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const benchmarked = await prisma.benchmarkedPractice.findMany({
        take: limit,
        orderBy: { benchmarkedDate: 'desc' },
        include: {
          practice: {
            include: {
              category: true,
              plant: {
                select: {
                  id: true,
                  name: true,
                  shortName: true,
                },
              },
            },
          },
        },
      });

      res.json(
        benchmarked.map((bp) => ({
          id: bp.practice.id,
          title: bp.practice.title,
          description: bp.practice.description,
          category: {
            id: bp.practice.category.id,
            name: bp.practice.category.name,
          },
          plant_name: bp.practice.plant.name,
          benchmarked_date: bp.benchmarkedDate.toISOString(),
        }))
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get practice copies
   */
  async getPracticeCopies(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const copies = await prisma.copiedPractice.findMany({
        where: { originalPracticeId: id },
        include: {
          copiedPractice: {
            include: {
              plant: true,
            },
          },
          copyingPlant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { copiedDate: 'desc' },
      });

      res.json(
        copies.map((copy) => ({
          id: copy.id,
          copied_practice_id: copy.copiedPracticeId,
          copying_plant: {
            id: copy.copyingPlant.id,
            name: copy.copyingPlant.name,
          },
          copied_date: copy.copiedDate.toISOString(),
          implementation_status: copy.implementationStatus,
        }))
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get total benchmarked count
   */
  async getTotalBenchmarkedCount(req: Request, res: Response, next: NextFunction) {
    try {
      const total = await prisma.benchmarkedPractice.count({
        where: {
          practice: {
            isDeleted: false,
          },
        },
      });

      res.json({
        total_benchmarked: total,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get copy spread data
   */
  async getCopySpread(req: Request, res: Response, next: NextFunction) {
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

      res.json(
        benchmarked.map((bp) => ({
          bp: bp.practice.title,
          origin: bp.practice.plant.name,
          copies: bp.practice.copiedVersions.map((copy) => ({
            plant: copy.copyingPlant.name,
            date: copy.copiedDate.toISOString(),
          })),
        }))
      );
    } catch (error) {
      next(error);
    }
  }
}

export const benchmarkingController = new BenchmarkingController();

