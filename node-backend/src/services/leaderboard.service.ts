import prisma from '../config/database';

export class LeaderboardService {
  /**
   * Award points when a practice is copied
   * Origin: +10 pts (first time only)
   * Copier: +5 pts
   */
  async awardCopyPoints(
    originalPracticeId: string,
    copiedPracticeId: string,
    copyingPlantId: string
  ): Promise<void> {
    const currentYear = new Date().getFullYear();

    // Get original practice plant
    const originalPractice = await prisma.bestPractice.findUnique({
      where: { id: originalPracticeId },
      select: { plantId: true },
    });

    if (!originalPractice) {
      return;
    }

    const originPlantId = originalPractice.plantId;

    // Check if this is the first copy (for origin points)
    const existingCopies = await prisma.copiedPractice.count({
      where: {
        originalPracticeId,
      },
    });

    const isFirstCopy = existingCopies === 1;

    // Update origin plant leaderboard (+10 pts if first copy)
    if (isFirstCopy && originPlantId) {
      await this.updatePlantLeaderboard(originPlantId, currentYear, {
        originPoints: 10,
        totalPoints: 10,
      });
    }

    // Update copying plant leaderboard (+5 pts)
    await this.updatePlantLeaderboard(copyingPlantId, currentYear, {
      copierPoints: 5,
      totalPoints: 5,
    });
  }

  /**
   * Update plant leaderboard entry
   */
  private async updatePlantLeaderboard(
    plantId: string,
    year: number,
    points: { originPoints?: number; copierPoints?: number; totalPoints: number }
  ): Promise<void> {
    const existing = await prisma.leaderboardEntry.findUnique({
      where: {
        plantId_year: {
          plantId,
          year,
        },
      },
    });

    if (existing) {
      await prisma.leaderboardEntry.update({
        where: {
          plantId_year: {
            plantId,
            year,
          },
        },
        data: {
          originPoints: {
            increment: points.originPoints || 0,
          },
          copierPoints: {
            increment: points.copierPoints || 0,
          },
          totalPoints: {
            increment: points.totalPoints,
          },
        },
      });
    } else {
      await prisma.leaderboardEntry.create({
        data: {
          plantId,
          year,
          originPoints: points.originPoints || 0,
          copierPoints: points.copierPoints || 0,
          totalPoints: points.totalPoints,
        },
      });
    }
  }

  /**
   * Recalculate leaderboard for a year
   */
  async recalculateLeaderboard(year?: number): Promise<void> {
    const targetYear = year || new Date().getFullYear();

    // Get all plants
    const plants = await prisma.plant.findMany({
      where: { isActive: true },
    });

    for (const plant of plants) {
      // Calculate origin points (first copy of each benchmarked practice)
      const benchmarkedPractices = await prisma.benchmarkedPractice.findMany({
        where: {
          practice: {
            plantId: plant.id,
            isDeleted: false,
          },
        },
        include: {
          practice: {
            include: {
              copiedVersions: {
                where: {
                  copiedDate: {
                    gte: new Date(targetYear, 0, 1),
                    lt: new Date(targetYear + 1, 0, 1),
                  },
                },
                orderBy: { copiedDate: 'asc' },
                take: 1,
              },
            },
          },
        },
      });

      let originPoints = 0;
      for (const bp of benchmarkedPractices) {
        if (bp.practice.copiedVersions.length > 0) {
          originPoints += 10;
        }
      }

      // Calculate copier points
      const copies = await prisma.copiedPractice.findMany({
        where: {
          copyingPlantId: plant.id,
          copiedDate: {
            gte: new Date(targetYear, 0, 1),
            lt: new Date(targetYear + 1, 0, 1),
          },
        },
      });

      const copierPoints = copies.length * 5;
      const totalPoints = originPoints + copierPoints;

      // Update or create leaderboard entry
      await prisma.leaderboardEntry.upsert({
        where: {
          plantId_year: {
            plantId: plant.id,
            year: targetYear,
          },
        },
        update: {
          originPoints,
          copierPoints,
          totalPoints,
        },
        create: {
          plantId: plant.id,
          year: targetYear,
          originPoints,
          copierPoints,
          totalPoints,
        },
      });
    }
  }
}

export const leaderboardService = new LeaderboardService();

