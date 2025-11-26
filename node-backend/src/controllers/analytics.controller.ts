import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { analyticsService } from '../services/analytics.service';
import { NotFoundError } from '../utils/errors';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

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
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string);

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // Get all active plants
      const plants = await prisma.plant.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          shortName: true,
        },
      });

      // Determine target year and month
      const targetYear = period === 'yearly' ? year : currentYear;
      const targetMonth = period === 'monthly' && month ? month : currentMonth;
      const targetLastMonth = targetMonth === 1 ? 12 : targetMonth - 1;
      const targetLastMonthYear = targetMonth === 1 ? targetYear - 1 : targetYear;

      // Get monthly savings data for target month and last month
      const monthlySavingsData = await prisma.monthlySavings.findMany({
        where: {
          OR: [
            { year: targetYear, month: targetMonth },
            { year: targetLastMonthYear, month: targetLastMonth },
          ],
        },
        select: {
          plantId: true,
          year: true,
          month: true,
          totalSavings: true,
        },
      });

      // Calculate YTD savings for the year (up to target month)
      const ytdSavings = await prisma.monthlySavings.groupBy({
        by: ['plantId'],
        where: {
          year: targetYear,
          month: { lte: targetMonth },
        },
        _sum: {
          totalSavings: true,
        },
      });

      const ytdMap = new Map(
        ytdSavings.map((item) => [item.plantId, item._sum.totalSavings || new Decimal(0)])
      );

      // Get current month and last month savings
      const currentMonthData = monthlySavingsData.filter(
        (ms) => ms.month === targetMonth && ms.year === targetYear
      );
      const lastMonthData = monthlySavingsData.filter(
        (ms) => ms.month === targetLastMonth && ms.year === targetLastMonthYear
      );

      const currentMonthMap = new Map(
        currentMonthData.map((ms) => [ms.plantId, ms.totalSavings])
      );
      const lastMonthMap = new Map(
        lastMonthData.map((ms) => [ms.plantId, ms.totalSavings])
      );

      // Format the response
      const result = plants.map((plant) => {
        const currentMonthSavings = currentMonthMap.get(plant.id) || new Decimal(0);
        const lastMonthSavings = lastMonthMap.get(plant.id) || new Decimal(0);
        const ytdTotal = ytdMap.get(plant.id) || new Decimal(0);

        // Convert to number for calculations
        const currentMonthNum = Number(currentMonthSavings);
        const lastMonthNum = Number(lastMonthSavings);
        const ytdNum = Number(ytdTotal);

        // Calculate YTD till last month (YTD total minus current month)
        const ytdTillLastMonth = Math.max(0, ytdNum - currentMonthNum);

        // Calculate percent change
        const percentChange = lastMonthNum === 0 
          ? (currentMonthNum > 0 ? 100 : 0)
          : ((currentMonthNum - lastMonthNum) / lastMonthNum) * 100;

        // Return values in lakhs (frontend will handle currency conversion for display)
        return {
          plant_id: plant.id,
          plant_name: plant.name,
          short_name: plant.shortName,
          last_month: lastMonthNum.toFixed(2),
          current_month: currentMonthNum.toFixed(2),
          ytd_till_last_month: ytdTillLastMonth.toFixed(2),
          ytd_total: ytdNum.toFixed(2),
          percent_change: Number(percentChange.toFixed(2)),
        };
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get cost analysis
   */
  async getCostAnalysis(_req: Request, res: Response, next: NextFunction) {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      // Get all active plants
      const plants = await prisma.plant.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          shortName: true,
        },
      });

      // Get monthly savings data for current month and last month
      const monthlySavingsData = await prisma.monthlySavings.findMany({
        where: {
          year: { in: [currentYear, lastMonthYear] },
          month: { in: [currentMonth, lastMonth] },
        },
        select: {
          plantId: true,
          year: true,
          month: true,
          totalSavings: true,
        },
      });

      // Calculate YTD till last month (sum of all months before current month)
      const ytdTillLastMonthData = await prisma.monthlySavings.groupBy({
        by: ['plantId'],
        where: {
          year: currentYear,
          month: { lt: currentMonth },
        },
        _sum: {
          totalSavings: true,
        },
      });

      const ytdTillLastMonthMap = new Map(
        ytdTillLastMonthData.map((item) => [item.plantId, item._sum.totalSavings || new Decimal(0)])
      );

      // Get current month and last month savings
      const currentMonthMap = new Map<string, Decimal>();
      const lastMonthMap = new Map<string, Decimal>();

      monthlySavingsData.forEach((ms) => {
        if (ms.year === currentYear && ms.month === currentMonth) {
          currentMonthMap.set(ms.plantId, ms.totalSavings);
        } else if (ms.year === lastMonthYear && ms.month === lastMonth) {
          lastMonthMap.set(ms.plantId, ms.totalSavings);
        }
      });

      // Format the response
      const result = plants.map((plant) => {
        const currentMonthSavings = currentMonthMap.get(plant.id) || new Decimal(0);
        const lastMonthSavings = lastMonthMap.get(plant.id) || new Decimal(0);
        const ytdTillLastMonth = ytdTillLastMonthMap.get(plant.id) || new Decimal(0);

        // Convert to number for calculations
        const currentMonthNum = Number(currentMonthSavings);
        const lastMonthNum = Number(lastMonthSavings);
        const ytdTillLastMonthNum = Number(ytdTillLastMonth);

        // Calculate percent change
        const percentChange = lastMonthNum === 0 
          ? (currentMonthNum > 0 ? 100 : 0)
          : ((currentMonthNum - lastMonthNum) / lastMonthNum) * 100;

        // Return values in lakhs (frontend will handle currency conversion for display)
        return {
          plant_id: plant.id,
          plant_name: plant.name,
          short_name: plant.shortName,
          last_month: lastMonthNum.toFixed(2),
          current_month: currentMonthNum.toFixed(2),
          ytd_till_last_month: ytdTillLastMonthNum.toFixed(2),
          ytd_total: (ytdTillLastMonthNum + currentMonthNum).toFixed(2),
          percent_change: Number(percentChange.toFixed(2)),
        };
      });

      res.json({
        success: true,
        data: result,
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

      const currentMonth = new Date().getMonth() + 1;
      const plantRatings = new Map<string, { plant: any; stars: number; savings: Prisma.Decimal; monthlySavings: Prisma.Decimal }>();

      monthlySavings.forEach((ms) => {
        const key = ms.plantId;
        if (!plantRatings.has(key)) {
          plantRatings.set(key, {
            plant: {
              id: ms.plant.id,
              name: ms.plant.name,
            },
            stars: 0,
            savings: new Prisma.Decimal(0),
            monthlySavings: new Prisma.Decimal(0),
          });
        }

        const entry = plantRatings.get(key)!;
        entry.savings = entry.savings.add(ms.totalSavings);
        // Track current month savings
        if (ms.month === currentMonth && ms.year === year) {
          entry.monthlySavings = ms.totalSavings;
        }
      });

      res.json(
        Array.from(plantRatings.values()).map((entry) => ({
          plant: entry.plant,
          stars: analyticsService.calculateStarRating(entry.monthlySavings, entry.savings, currency),
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
        let ytdSavings = new Prisma.Decimal(0);
        
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

          const monthlySavings = practices.reduce(
            (sum, p) => sum.add(p.savingsAmount || new Prisma.Decimal(0)),
            new Prisma.Decimal(0)
          );

          // Accumulate YTD savings
          ytdSavings = ytdSavings.add(monthlySavings);

          // Calculate stars using BOTH monthly and YTD thresholds
          const stars = analyticsService.calculateStarRating(
            monthlySavings,
            ytdSavings,
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
              totalSavings: monthlySavings,
              practiceCount: practices.length,
              stars,
            },
            create: {
              plantId: plant.id,
              year,
              month,
              totalSavings: monthlySavings,
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

