import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';
import { leaderboardService } from '../services/leaderboard.service';

export class LeaderboardController {
  /**
   * Get leaderboard
   */
  async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      const entries = await prisma.leaderboardEntry.findMany({
        where: { year },
        include: {
          plant: {
            select: {
              id: true,
              name: true,
              shortName: true,
            },
          },
        },
        orderBy: { totalPoints: 'desc' },
      });

      res.json(
        entries.map((entry, index) => ({
          rank: index + 1,
          plant: {
            id: entry.plant.id,
            name: entry.plant.name,
            short_name: entry.plant.shortName,
          },
          total_points: entry.totalPoints,
          origin_points: entry.originPoints,
          copier_points: entry.copierPoints,
          year: entry.year,
        }))
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get plant breakdown
   */
  async getPlantBreakdown(req: Request, res: Response, next: NextFunction) {
    try {
      const { plantId } = req.params;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      // Verify plant exists
      const plant = await prisma.plant.findUnique({
        where: { id: plantId },
      });

      if (!plant) {
        return next(new NotFoundError('Plant not found'));
      }

      // Get leaderboard entry
      const entry = await prisma.leaderboardEntry.findUnique({
        where: {
          plantId_year: {
            plantId,
            year,
          },
        },
      });

      // Get origin points breakdown
      const originPractices = await prisma.benchmarkedPractice.findMany({
        where: {
          practice: {
            plantId,
            isDeleted: false,
          },
        },
        include: {
          practice: {
            include: {
              copiedVersions: {
                where: {
                  copiedDate: {
                    gte: new Date(year, 0, 1),
                    lt: new Date(year + 1, 0, 1),
                  },
                },
                orderBy: { copiedDate: 'asc' },
                take: 1,
                include: {
                  copyingPlant: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const originBreakdown = originPractices
        .filter((bp) => bp.practice.copiedVersions.length > 0)
        .map((bp) => ({
          type: 'Origin' as const,
          points: 10,
          date: bp.practice.copiedVersions[0].copiedDate.toISOString(),
          bp_title: bp.practice.title,
        }));

      // Get copier points breakdown
      const copies = await prisma.copiedPractice.findMany({
        where: {
          copyingPlantId: plantId,
          copiedDate: {
            gte: new Date(year, 0, 1),
            lt: new Date(year + 1, 0, 1),
          },
        },
        include: {
          originalPractice: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { copiedDate: 'desc' },
      });

      const copierBreakdown = copies.map((copy) => ({
        type: 'Copier' as const,
        points: 5,
        date: copy.copiedDate.toISOString(),
        bp_title: copy.originalPractice.title,
      }));

      res.json({
        plant: {
          id: plant.id,
          name: plant.name,
          short_name: plant.shortName,
        },
        year,
        total_points: entry?.totalPoints || 0,
        origin_points: entry?.originPoints || 0,
        copier_points: entry?.copierPoints || 0,
        breakdown: [...originBreakdown, ...copierBreakdown].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recalculate leaderboard
   */
  async recalculateLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const year = parseInt(req.body.year as string) || new Date().getFullYear();

      await leaderboardService.recalculateLeaderboard(year);

      res.json({
        message: `Leaderboard recalculated for year ${year}`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const leaderboardController = new LeaderboardController();

