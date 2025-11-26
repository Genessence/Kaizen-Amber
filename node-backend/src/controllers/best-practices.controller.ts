import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { savingsCalculatorService } from '../services/savings-calculator.service';
import env from '../config/env';

export class BestPracticesController {
  /**
   * List best practices with filters
   */
  async listBestPractices(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(
        parseInt(req.query.page_size as string) || env.DEFAULT_PAGE_SIZE,
        env.MAX_PAGE_SIZE
      );
      const search = req.query.search as string;
      const categoryId = req.query.category_id as string;
      const plantId = req.query.plant_id as string;
      const status = req.query.status as string;
      const isBenchmarkedParam = req.query.is_benchmarked as string;

      const skip = (page - 1) * pageSize;

      // Build where clause
      const where: any = {
        isDeleted: false,
      };

      // Auto-filter by plant for plant users if no explicit plant_id provided
      // This ensures plant users only see practices from their own plant
      // HQ admins can see all practices unless they explicitly filter
      if (req.user?.role === 'plant' && !plantId) {
        where.plantId = req.user.plantId;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (plantId) {
        where.plantId = plantId;
      }

      if (status) {
        where.status = status;
      }

      // Handle is_benchmarked filter: 'true', 'false', or undefined
      if (isBenchmarkedParam === 'true') {
        where.benchmarked = {
          isNot: null,
        };
      } else if (isBenchmarkedParam === 'false') {
        where.benchmarked = null;
      }

      // Get total count
      const total = await prisma.bestPractice.count({ where });

      // Get practices
      const practices = await prisma.bestPractice.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { submittedDate: 'desc' },
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
              email: true,
            },
          },
          benchmarked: true,
          _count: {
            select: {
              questions: true,
            },
          },
        },
      });

      res.json({
        items: practices.map((practice) => ({
          id: practice.id,
          title: practice.title,
          description: practice.description,
          category: {
            id: practice.category.id,
            name: practice.category.name,
            slug: practice.category.slug,
          },
          plant: {
            id: practice.plant.id,
            name: practice.plant.name,
            short_name: practice.plant.shortName,
          },
          submitted_by: {
            id: practice.submittedBy.id,
            full_name: practice.submittedBy.fullName,
            email: practice.submittedBy.email,
          },
          status: practice.status,
          savings_amount: practice.savingsAmount,
          savings_currency: practice.savingsCurrency,
          savings_period: practice.savingsPeriod,
          submitted_date: practice.submittedDate?.toISOString(),
          is_benchmarked: !!practice.benchmarked,
          question_count: practice._count.questions || 0,
          created_at: practice.createdAt.toISOString(),
          updated_at: practice.updatedAt.toISOString(),
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
   * Get best practice by ID
   */
  async getBestPractice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const practice = await prisma.bestPractice.findFirst({
        where: {
          id,
          isDeleted: false,
        },
        include: {
          category: true,
          plant: true,
          submittedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          benchmarked: {
            include: {
              benchmarkedBy: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      });

      if (!practice) {
        return next(new NotFoundError('Best practice not found'));
      }

      res.json({
        id: practice.id,
        title: practice.title,
        description: practice.description,
        category_id: practice.categoryId,
        category: {
          id: practice.category.id,
          name: practice.category.name,
          slug: practice.category.slug,
        },
        submitted_by_user_id: practice.submittedByUserId,
        submitted_by: {
          id: practice.submittedBy.id,
          full_name: practice.submittedBy.fullName,
          email: practice.submittedBy.email,
        },
        plant_id: practice.plantId,
        plant: {
          id: practice.plant.id,
          name: practice.plant.name,
          short_name: practice.plant.shortName,
        },
        problem_statement: practice.problemStatement,
        solution: practice.solution,
        benefits: practice.benefits,
        metrics: practice.metrics,
        implementation: practice.implementation,
        investment: practice.investment,
        savings_amount: practice.savingsAmount,
        savings_currency: practice.savingsCurrency,
        savings_period: practice.savingsPeriod,
        area_implemented: practice.areaImplemented,
        status: practice.status,
        submitted_date: practice.submittedDate?.toISOString(),
        is_benchmarked: !!practice.benchmarked,
        benchmarked_date: practice.benchmarked?.benchmarkedDate.toISOString(),
        created_at: practice.createdAt.toISOString(),
        updated_at: practice.updatedAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create best practice
   */
  async createBestPractice(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new ForbiddenError());
      }

      const data = req.body;

      // Verify category exists
      const category = await prisma.category.findUnique({
        where: { id: data.category_id },
      });

      if (!category) {
        return next(new BadRequestError('Invalid category ID'));
      }

      // Verify plant exists
      const plantId = req.user.plantId || data.plant_id;
      if (!plantId) {
        return next(new BadRequestError('Plant ID is required'));
      }

      const plant = await prisma.plant.findUnique({
        where: { id: plantId },
      });

      if (!plant) {
        return next(new BadRequestError('Invalid plant ID'));
      }

      // Create practice
      const practice = await prisma.bestPractice.create({
        data: {
          title: data.title,
          description: data.description,
          categoryId: data.category_id,
          submittedByUserId: req.user.userId,
          plantId: plantId,
          problemStatement: data.problem_statement,
          solution: data.solution,
          benefits: data.benefits || null,
          metrics: data.metrics || null,
          implementation: data.implementation || null,
          investment: data.investment || null,
          savingsAmount: data.savings_amount || null,
          savingsCurrency: data.savings_currency || null,
          savingsPeriod: data.savings_period || null,
          areaImplemented: data.area_implemented || null,
          status: data.status || 'draft',
          submittedDate: data.status === 'submitted' ? new Date() : null,
        },
        include: {
          category: true,
          plant: true,
          submittedBy: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      // Auto-recalculate savings if practice is submitted with savings data
      if (practice.status === 'submitted' && practice.savingsAmount && practice.submittedDate) {
        const submittedDate = practice.submittedDate;
        const year = submittedDate.getFullYear();
        const month = submittedDate.getMonth() + 1;
        
        // Trigger recalculation asynchronously (non-blocking)
        // Recalculate current month first, then all subsequent months to update YTD correctly
        savingsCalculatorService.recalculatePlantMonthlySavings(plantId, year, month)
          .then(() => {
            // After updating current month, recalculate all subsequent months to update YTD
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1;
            
            // Only recalculate future months if we're in the same year
            if (year === currentYear && month < currentMonth) {
              // Recalculate all months from (month + 1) to current month to update YTD
              const recalcPromises = [];
              for (let m = month + 1; m <= currentMonth; m++) {
                recalcPromises.push(
                  savingsCalculatorService.recalculatePlantMonthlySavings(plantId, year, m)
                    .catch(error => {
                      console.error(`Failed to recalculate savings for ${year}-${m}:`, error);
                    })
                );
              }
              return Promise.all(recalcPromises);
            }
          })
          .catch(error => {
            console.error('Failed to auto-recalculate savings:', error);
            // Log more details for debugging
            console.error('Error details:', {
              plantId,
              year,
              month,
              practiceId: practice.id,
              error: error instanceof Error ? error.message : String(error),
            });
          });
      }

      res.status(201).json({
        id: practice.id,
        title: practice.title,
        description: practice.description,
        category: {
          id: practice.category.id,
          name: practice.category.name,
        },
        plant: {
          id: practice.plant.id,
          name: practice.plant.name,
        },
        status: practice.status,
        created_at: practice.createdAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update best practice
   */
  async updateBestPractice(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new ForbiddenError());
      }

      const { id } = req.params;
      const data = req.body;

      // Find practice
      const practice = await prisma.bestPractice.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

      if (!practice) {
        return next(new NotFoundError('Best practice not found'));
      }

      // Check permissions (only submitter or HQ can update)
      if (practice.submittedByUserId !== req.user.userId && req.user.role !== 'hq') {
        return next(new ForbiddenError('You do not have permission to update this practice'));
      }

      // Update practice
      const updated = await prisma.bestPractice.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          categoryId: data.category_id,
          problemStatement: data.problem_statement,
          solution: data.solution,
          benefits: data.benefits,
          metrics: data.metrics,
          implementation: data.implementation,
          investment: data.investment,
          savingsAmount: data.savings_amount,
          savingsCurrency: data.savings_currency,
          savingsPeriod: data.savings_period,
          areaImplemented: data.area_implemented,
          status: data.status,
          submittedDate: data.status === 'submitted' && !practice.submittedDate ? new Date() : practice.submittedDate,
        },
        include: {
          category: true,
          plant: true,
        },
      });

      // Auto-recalculate savings if:
      // 1. Status changed to 'approved'
      // 2. Savings fields changed for an approved practice
      // 3. Status is 'submitted' and savings data exists
      const statusChanged = practice.status !== updated.status;
      const savingsChanged = 
        practice.savingsAmount !== updated.savingsAmount ||
        practice.savingsCurrency !== updated.savingsCurrency ||
        practice.savingsPeriod !== updated.savingsPeriod;
      
      const shouldRecalculate = 
        (statusChanged && updated.status === 'approved') ||
        (savingsChanged && (updated.status === 'approved' || updated.status === 'submitted')) ||
        (updated.status === 'submitted' && updated.savingsAmount);

      if (shouldRecalculate && updated.submittedDate) {
        const submittedDate = updated.submittedDate;
        const year = submittedDate.getFullYear();
        const month = submittedDate.getMonth() + 1;
        
        // Trigger recalculation asynchronously (non-blocking)
        savingsCalculatorService.recalculatePlantMonthlySavings(practice.plantId, year, month)
          .catch(error => {
            console.error('Failed to auto-recalculate savings:', error);
          });
      }

      res.json({
        id: updated.id,
        title: updated.title,
        description: updated.description,
        status: updated.status,
        updated_at: updated.updatedAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete best practice (soft delete)
   */
  async deleteBestPractice(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new ForbiddenError());
      }

      const { id } = req.params;

      // Find practice
      const practice = await prisma.bestPractice.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

      if (!practice) {
        return next(new NotFoundError('Best practice not found'));
      }

      // Check permissions (only submitter or HQ can delete)
      if (practice.submittedByUserId !== req.user.userId && req.user.role !== 'hq') {
        return next(new ForbiddenError('You do not have permission to delete this practice'));
      }

      // Soft delete
      await prisma.bestPractice.update({
        where: { id },
        data: { isDeleted: true },
      });

      // Auto-recalculate savings if deleted practice had savings data
      if (practice.savingsAmount && practice.submittedDate) {
        const submittedDate = practice.submittedDate;
        const year = submittedDate.getFullYear();
        const month = submittedDate.getMonth() + 1;
        
        // Trigger recalculation asynchronously (non-blocking)
        savingsCalculatorService.recalculatePlantMonthlySavings(practice.plantId, year, month)
          .catch(error => {
            console.error('Failed to auto-recalculate savings after delete:', error);
          });
      }

      res.json({
        success: true,
        message: 'Best practice deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's practices
   */
  async getMyPractices(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new ForbiddenError());
      }

      const practices = await prisma.bestPractice.findMany({
        where: {
          submittedByUserId: req.user.userId,
          isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          plant: true,
          benchmarked: true,
          _count: {
            select: {
              questions: true,
            },
          },
        },
      });

      res.json(
        practices.map((practice) => ({
          id: practice.id,
          title: practice.title,
          description: practice.description,
          category: {
            id: practice.category.id,
            name: practice.category.name,
          },
          plant: {
            id: practice.plant.id,
            name: practice.plant.name,
          },
          status: practice.status,
          is_benchmarked: !!practice.benchmarked,
          question_count: practice._count.questions,
          submitted_date: practice.submittedDate?.toISOString(),
          created_at: practice.createdAt.toISOString(),
        }))
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent practices
   */
  async getRecentPractices(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const practices = await prisma.bestPractice.findMany({
        where: {
          isDeleted: false,
          status: 'approved',
        },
        take: limit,
        orderBy: { submittedDate: 'desc' },
        include: {
          category: true,
          plant: true,
          benchmarked: true,
        },
      });

      res.json(
        practices.map((practice) => ({
          id: practice.id,
          title: practice.title,
          description: practice.description,
          category: {
            id: practice.category.id,
            name: practice.category.name,
          },
          plant: {
            id: practice.plant.id,
            name: practice.plant.name,
          },
          status: practice.status,
          is_benchmarked: !!practice.benchmarked,
          submitted_date: practice.submittedDate?.toISOString(),
          created_at: practice.createdAt.toISOString(),
        }))
      );
    } catch (error) {
      next(error);
    }
  }
}

export const bestPracticesController = new BestPracticesController();

