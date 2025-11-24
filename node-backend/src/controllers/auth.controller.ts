import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors';
import env from '../config/env';

export class AuthController {
  /**
   * Login user
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, remember_me } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: { plant: true },
      });

      if (!user || !user.isActive) {
        return next(new UnauthorizedError('Invalid credentials'));
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.hashedPassword);
      if (!isValidPassword) {
        return next(new UnauthorizedError('Invalid credentials'));
      }

      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        plantId: user.plantId || undefined,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Return response
      res.json({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: env.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register new user
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, full_name, role, plant_id } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return next(new BadRequestError('User with this email already exists'));
      }

      // Validate plant_id for plant users
      if (role === 'plant' && !plant_id) {
        return next(new BadRequestError('Plant ID is required for plant users'));
      }

      if (role === 'plant') {
        const plant = await prisma.plant.findUnique({
          where: { id: plant_id },
        });

        if (!plant) {
          return next(new BadRequestError('Invalid plant ID'));
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          hashedPassword,
          fullName: full_name,
          role,
          plantId: role === 'plant' ? plant_id : null,
        },
        include: { plant: true },
      });

      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        plantId: user.plantId || undefined,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      res.status(201).json({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: env.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new UnauthorizedError());
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          plant: {
            select: {
              id: true,
              name: true,
              shortName: true,
            },
          },
        },
      });

      if (!user) {
        return next(new NotFoundError('User not found'));
      }

      res.json({
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        plant_id: user.plantId,
        plant_name: user.plant?.name,
        plant_short_name: user.plant?.shortName,
        is_active: user.isActive,
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return next(new BadRequestError('Refresh token is required'));
      }

      // Verify refresh token
      const payload = verifyRefreshToken(refresh_token);

      // Generate new access token
      const accessToken = generateAccessToken({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        plantId: payload.plantId,
      });

      res.json({
        access_token: accessToken,
      });
    } catch (error) {
      next(new UnauthorizedError('Invalid refresh token'));
    }
  }

  /**
   * Logout (client-side token removal, but we can add token blacklisting here)
   */
  async logout(req: Request, res: Response) {
    // In a production system, you might want to blacklist tokens here
    res.json({ message: 'Logged out successfully' });
  }

  /**
   * Change password
   */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new UnauthorizedError());
      }

      const { current_password, new_password } = req.body;

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      if (!user) {
        return next(new NotFoundError('User not found'));
      }

      // Verify current password
      const isValidPassword = await comparePassword(current_password, user.hashedPassword);
      if (!isValidPassword) {
        return next(new BadRequestError('Current password is incorrect'));
      }

      // Hash new password
      const hashedPassword = await hashPassword(new_password);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { hashedPassword },
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

