import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';

export class CategoriesController {
  /**
   * List all categories with practice counts
   */
  async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
          practices: {
            where: {
              isDeleted: false,
            },
            select: {
              id: true,
            },
          },
        },
      });

      res.json(
        categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          color_class: category.colorClass,
          icon_name: category.iconName,
          practice_count: category.practices.length,
          created_at: category.createdAt.toISOString(),
        }))
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get category by ID
   */
  async getCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          practices: {
            where: {
              isDeleted: false,
            },
            select: {
              id: true,
            },
          },
        },
      });

      if (!category) {
        return next(new NotFoundError('Category not found'));
      }

      res.json({
        id: category.id,
        name: category.name,
        slug: category.slug,
        color_class: category.colorClass,
        icon_name: category.iconName,
        practice_count: category.practices.length,
        created_at: category.createdAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const categoriesController = new CategoriesController();

