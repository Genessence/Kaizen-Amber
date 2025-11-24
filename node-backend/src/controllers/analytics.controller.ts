import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { analyticsService } from '../services/analytics.service';
import { NotFoundError } from '../utils/errors';
import { Prisma } from '@prisma/client';

export class AnalyticsController {
  /**
   * Get dashboard overview
   */
  async getDashboardOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const currency = (req.query.currency as string) || 'lakhs';
      const overview = await analyticsService.getDashboardOverview(currency);
      res.json(overview);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unified dashboard
   */
  async getUnifiedDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const plantId = req.query.plant_id as string | undefined;
      const currency = (req.query.currency as string) || 'lakhs';
      
      // Get plant_id from user context if not provided in query
      const userPlantId = plantId || req.user?.plantId;
      
      const data = await analyticsService.getUnifiedDashboard(userPlantId, currency);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get plant performance
   */
  async getPlantPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as string) || 'yearly';
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string);

      const plants = await prisma.plant.findMany({
        where: { isActive: true },
        include: {
          practices: {
            where: {
              isDeleted: false,
              status: 'approved',
              ...(period === 'yearly'
                ? {
                    submittedDate: {
                      gte: new Date(year, 0, 1),
                      lt: new Date(year + 1, 0, 1),
                    },
                  }
                : {
                    submittedDate: {
                      gte: new Date(year, month - 1, 1),
                      lt: new Date(year, month, 1),
                    },
                  }),
            },
          },
        },
      });

      res.json(
        plants.map((plant) => ({
          plant: {
            id: plant.id,
            name: plant.name,
            short_name: plant.shortName,
          },
          practice_count: plant.practices.length,
          total_savings: plant.practices.reduce(
            (sum, p) => sum + Number(p.savingsAmount || 0),
            0
          ),
        }))
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get category breakdown
   */
  async getCategoryBreakdown(req: Request, res: Response, next: NextFunction) {
    try {
      const plantId = req.query.plant_id as string;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      const where: any = {
        isDeleted: false,
        submittedDate: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      };

      if (plantId) {
        where.plantId = plantId;
      }

      const categories = await prisma.category.findMany({
        include: {
          practices: {
            where,
            select: {
              id: true,
              savingsAmount: true,
            },
          },
        },
      });

      res.json(
        categories.map((cat) => ({
          category: cat.name,
          practice_count: cat.practices.length,
          total_savings: cat.practices.reduce(
            (sum, p) => sum + Number(p.savingsAmount || 0),
            0
          ),
        }))
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get cost savings
   */
  async getCostSavings(req: Request, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as string) || 'yearly';
      const currency = (req.query.currency as string) || 'lakhs';
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string);

      const plants = await prisma.plant.findMany({
        where: { isActive: true },
        include: {
          practices: {
            where: {
              isDeleted: false,
              status: 'approved',
              ...(period === 'yearly'
                ? {
                    submittedDate: {
                      gte: new Date(year, 0, 1),
                      lt: new Date(year + 1, 0, 1),
                    },
                  }
                : {
                    submittedDate: {
                      gte: new Date(year, month - 1, 1),
                      lt: new Date(year, month, 1),
                    },
                  }),
            },
          },
        },
      });

      res.json({
        success: true,
        data: plants.map((plant) => ({
          plant: {
            id: plant.id,
            name: plant.name,
          },
          total_savings: analyticsService.formatCurrency(
            plant.practices.reduce(
              (sum, p) => sum + (p.savingsAmount || new Decimal(0)),
              new Decimal(0)
            ),
            currency
          ),
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get cost analysis
   */
  async getCostAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const currency = (req.query.currency as string) || 'lakhs';

      const plants = await prisma.plant.findMany({
        where: { isActive: true },
        include: {
          practices: {
            where: {
              isDeleted: false,
              status: 'approved',
            },
          },
        },
      });

      res.json({
        success: true,
        data: plants.map((plant) => ({
          plant: {
            id: plant.id,
            name: plant.name,
          },
          total_savings: analyticsService.formatCurrency(
            plant.practices.reduce(
              (sum, p) => sum + (p.savingsAmount || new Decimal(0)),
              new Decimal(0)
            ),
            currency
          ),
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get plant monthly breakdown
   */
  async getPlantMonthlyBreakdown(req: Request, res: Response, next: NextFunction) {
    try {
      const { plantId } = req.params;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const currency = (req.query.currency as string) || 'lakhs';

      const plant = await prisma.plant.findUnique({
        where: { id: plantId },
      });

      if (!plant) {
        return next(new NotFoundError('Plant not found'));
      }

      const monthlySavings = await prisma.monthlySavings.findMany({
        where: {
          plantId,
          year,
        },
        orderBy: { month: 'asc' },
      });

      res.json(
        monthlySavings.map((ms) => ({
          month: `${year}-${String(ms.month).padStart(2, '0')}`,
          total_savings: analyticsService.formatCurrency(ms.totalSavings, currency),
          practice_count: ms.practiceCount,
          practices: [], // Would need to fetch practices for each month
        }))
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get star ratings
   */
  async getStarRatings(req: Request, res: Response, next: NextFunction) {
    try {
      const currency = (req.query.currency as string) || 'lakhs';
      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      const monthlySavings = await prisma.monthlySavings.findMany({
        where: { year },
        include: {
          plant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { plantId: 'asc' },
          { month: 'asc' },
        ],
      });

      const plantRatings = new Map<string, { plant: any; stars: number; savings: Prisma.Decimal }>();

      monthlySavings.forEach((ms) => {
        const key = ms.plantId;
        if (!plantRatings.has(key)) {
          plantRatings.set(key, {
            plant: {
              id: ms.plant.id,
              name: ms.plant.name,
            },
            stars: 0,
            savings: Prisma.Decimal(0),
          });
        }

        const entry = plantRatings.get(key)!;
        entry.savings = entry.savings.add(ms.totalSavings);
      });

      res.json(
        Array.from(plantRatings.values()).map((entry) => ({
          plant: entry.plant,
          stars: analyticsService.calculateStarRating(entry.savings, currency),
          savings: analyticsService.formatCurrency(entry.savings, currency),
        }))
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get plant monthly trend
   */
  async getPlantMonthlyTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const { plantId } = req.params;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const currency = (req.query.currency as string) || 'lakhs';

      const monthlySavings = await prisma.monthlySavings.findMany({
        where: {
          plantId,
          year,
        },
        orderBy: { month: 'asc' },
      });

      res.json(
        monthlySavings.map((ms) => ({
          month: ms.month,
          savings: analyticsService.formatCurrency(ms.totalSavings, currency),
          practices: ms.practiceCount,
        }))
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get benchmark statistics
   */
  async getBenchmarkStats(req: Request, res: Response, next: NextFunction) {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string);

      const where: any = {
        practice: {
          isDeleted: false,
        },
        benchmarkedDate: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      };

      if (month) {
        where.benchmarkedDate = {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        };
      }

      const benchmarked = await prisma.benchmarkedPractice.findMany({
        where,
        include: {
          practice: {
            include: {
              plant: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      res.json(
        benchmarked.map((bp) => ({
          plant: bp.practice.plant.name,
          practice: bp.practice.title,
          date: bp.benchmarkedDate.toISOString(),
        }))
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recalculate savings
   */
  async recalculateSavings(req: Request, res: Response, next: NextFunction) {
    try {
      const year = parseInt(req.body.year as string) || new Date().getFullYear();

      // Recalculate monthly savings for all plants
      const plants = await prisma.plant.findMany({
        where: { isActive: true },
      });

      for (const plant of plants) {
        for (let month = 1; month <= 12; month++) {
          const practices = await prisma.bestPractice.findMany({
            where: {
              plantId: plant.id,
              isDeleted: false,
              status: 'approved',
              submittedDate: {
                gte: new Date(year, month - 1, 1),
                lt: new Date(year, month, 1),
              },
            },
          });

          const totalSavings = practices.reduce(
            (sum, p) => sum + (p.savingsAmount || Prisma.Decimal(0)),
            Prisma.Decimal(0)
          );

          const stars = analyticsService.calculateStarRating(
            totalSavings,
            'lakhs'
          );

          await prisma.monthlySavings.upsert({
            where: {
              plantId_year_month: {
                plantId: plant.id,
                year,
                month,
              },
            },
            update: {
              totalSavings,
              practiceCount: practices.length,
              stars,
            },
            create: {
              plantId: plant.id,
              year,
              month,
              totalSavings,
              practiceCount: practices.length,
              stars,
            },
          });
        }
      }

      res.json({
        success: true,
        data: {
          message: `Savings recalculated for year ${year}`,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();

