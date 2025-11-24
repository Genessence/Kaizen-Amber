import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';

export class PlantsController {
  /**
   * List all plants
   */
  async listPlants(req: Request, res: Response, next: NextFunction) {
    try {
      const isActive = req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;

      const where = isActive !== undefined ? { isActive } : {};

      const plants = await prisma.plant.findMany({
        where,
        orderBy: { name: 'asc' },
      });

      res.json(
        plants.map((plant) => ({
          id: plant.id,
          name: plant.name,
          short_name: plant.shortName,
          division: plant.division,
          is_active: plant.isActive,
          created_at: plant.createdAt.toISOString(),
          updated_at: plant.updatedAt.toISOString(),
        }))
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get plant by ID with statistics
   */
  async getPlant(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const plant = await prisma.plant.findUnique({
        where: { id },
      });

      if (!plant) {
        return next(new NotFoundError('Plant not found'));
      }

      // Get statistics
      const [totalPractices, totalSavings, benchmarkedCount, monthlyPractices] = await Promise.all([
        prisma.bestPractice.count({
          where: {
            plantId: id,
            isDeleted: false,
          },
        }),
        prisma.bestPractice.aggregate({
          where: {
            plantId: id,
            isDeleted: false,
            status: 'approved',
          },
          _sum: {
            savingsAmount: true,
          },
        }),
        prisma.benchmarkedPractice.count({
          where: {
            practice: {
              plantId: id,
              isDeleted: false,
            },
          },
        }),
        prisma.bestPractice.count({
          where: {
            plantId: id,
            isDeleted: false,
            submittedDate: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ]);

      res.json({
        id: plant.id,
        name: plant.name,
        short_name: plant.shortName,
        division: plant.division,
        is_active: plant.isActive,
        total_practices: totalPractices,
        total_savings: totalSavings._sum.savingsAmount || 0,
        benchmarked_count: benchmarkedCount,
        monthly_practices: monthlyPractices,
        created_at: plant.createdAt.toISOString(),
        updated_at: plant.updatedAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active plants only
   */
  async getActivePlants(req: Request, res: Response, next: NextFunction) {
    try {
      const plants = await prisma.plant.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });

      res.json(
        plants.map((plant) => ({
          id: plant.id,
          name: plant.name,
          short_name: plant.shortName,
          division: plant.division,
          is_active: plant.isActive,
          created_at: plant.createdAt.toISOString(),
          updated_at: plant.updatedAt.toISOString(),
        }))
      );
    } catch (error) {
      next(error);
    }
  }
}

export const plantsController = new PlantsController();

