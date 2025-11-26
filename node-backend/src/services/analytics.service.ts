import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class AnalyticsService {
  /**
   * Calculate star rating based on savings
   * 0-5 stars based on savings amount
   */
  calculateStarRating(savings: Prisma.Decimal | null, currency: string): number {
    if (!savings) return 0;

    let amount = Number(savings);
    if (currency === 'crores') {
      amount = amount * 100; // Convert to lakhs
    }

    if (amount >= 50) return 5;
    if (amount >= 25) return 4;
    if (amount >= 10) return 3;
    if (amount >= 5) return 2;
    if (amount >= 1) return 1;
    return 0;
  }

  /**
   * Format currency
   */
  formatCurrency(amount: Prisma.Decimal | null, currency: string): string {
    if (!amount) return '0';
    const num = Number(amount);
    if (currency === 'crores') {
      return num >= 1 ? `${Math.floor(num)} Cr` : `${Math.floor(num * 100)} L`;
    }
    return `${Math.floor(num)} L`;
  }

  /**
   * Get dashboard overview
   */
  async getDashboardOverview(currency: string = 'lakhs') {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const startOfYear = new Date(currentYear, 0, 1);

    // Run all count queries in parallel for better performance
    const [
      totalPractices,
      thisMonthPractices,
      ytdPractices,
      savingsResult,
      benchmarkedCount,
    ] = await Promise.all([
      prisma.bestPractice.count({
        where: { isDeleted: false },
      }),
      prisma.bestPractice.count({
        where: {
          isDeleted: false,
          submittedDate: {
            gte: startOfMonth,
            lt: new Date(currentYear, currentMonth, 1),
          },
        },
      }),
      prisma.bestPractice.count({
        where: {
          isDeleted: false,
          submittedDate: {
            gte: startOfYear,
          },
        },
      }),
      prisma.bestPractice.aggregate({
        where: {
          isDeleted: false,
          status: 'approved',
          savingsAmount: { not: null },
        },
        _sum: { savingsAmount: true },
      }),
      prisma.benchmarkedPractice.count({
        where: {
          practice: {
            isDeleted: false,
          },
        },
      }),
    ]);

    const totalSavings = savingsResult._sum.savingsAmount || new Prisma.Decimal(0);

    return {
      total_practices: totalPractices,
      this_month_practices: thisMonthPractices,
      ytd_practices: ytdPractices,
      total_savings: this.formatCurrency(totalSavings, currency),
      benchmarked_count: benchmarkedCount,
    };
  }

  /**
   * Get unified dashboard (optimized single query)
   * Includes all dashboard data in one call for maximum performance
   * All independent queries run in parallel for faster response
   */
  async getUnifiedDashboard(plantId?: string, currency: string = 'lakhs') {
    // Run all independent queries in parallel for maximum performance
    const [
      overview,
      leaderboard,
      copySpread,
      categoryBreakdown,
      recentBenchmarked,
      starRatings,
      plantPerformance,
      benchmarkStats,
      recentPractices,
    ] = await Promise.all([
      this.getDashboardOverview(currency),
      this.getLeaderboardSummary(),
      this.getCopySpreadSummary(),
      this.getCategoryBreakdownSummary(),
      this.getRecentBenchmarkedSummary(),
      this.getStarRatingsSummary(currency),
      this.getPlantPerformanceSummary(),
      this.getBenchmarkStatsSummary(),
      this.getRecentPracticesSummary(4),
    ]);
    
    // Include plant-specific data if plantId provided (run in parallel)
    let myPractices = null;
    let monthlyTrend = null;
    if (plantId) {
      [myPractices, monthlyTrend] = await Promise.all([
        this.getMyPracticesSummary(plantId),
        this.getMonthlyTrendSummary(plantId, currency),
      ]);
    }

    return {
      overview,
      leaderboard,
      copy_spread: copySpread,
      category_breakdown: categoryBreakdown,
      recent_benchmarked: recentBenchmarked,
      star_ratings: starRatings,
      plant_performance: plantPerformance,
      benchmark_stats: benchmarkStats,
      recent_practices: recentPractices,
      my_practices: myPractices,
      monthly_trend: monthlyTrend,
    };
  }

  private async getLeaderboardSummary() {
    const year = new Date().getFullYear();
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
      take: 10,
    });

    // Get breakdown for each plant
    const leaderboardWithBreakdown = await Promise.all(
      entries.map(async (entry, index) => {
        const plantId = entry.plantId;

        // Get origin points breakdown (benchmarked practices that were copied)
        const benchmarkedPractices = await prisma.benchmarkedPractice.findMany({
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
                  take: 1, // Only count first copy for origin points
                },
              },
            },
          },
        });

        const originBreakdown = benchmarkedPractices
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

        // Combine and sort breakdown by date (newest first)
        const breakdown = [...originBreakdown, ...copierBreakdown].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return {
          rank: index + 1,
          plant_id: entry.plant.id,
          plant_name: entry.plant.name,
          plant_short_name: entry.plant.shortName,
          total_points: entry.totalPoints,
          origin_points: entry.originPoints,
          copier_points: entry.copierPoints,
          breakdown,
        };
      })
    );

    return leaderboardWithBreakdown;
  }

  private async getCopySpreadSummary() {
    const benchmarked = await prisma.benchmarkedPractice.findMany({
      take: 10,
      include: {
        practice: {
          include: {
            plant: {
              select: { name: true },
            },
            copiedVersions: {
              include: {
                copyingPlant: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { benchmarkedDate: 'desc' },
    });

    return benchmarked.map((bp) => ({
      bp: bp.practice.title,
      origin: bp.practice.plant.name,
      copies: bp.practice.copiedVersions.map((copy) => ({
        plant: copy.copyingPlant.name,
        date: copy.copiedDate.toISOString(),
      })),
    }));
  }

  private async getCategoryBreakdownSummary() {
    // Optimize: Use _count instead of loading all practices
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        colorClass: true,
        iconName: true,
        _count: {
          select: {
            practices: {
              where: {
                isDeleted: false,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Return all categories, even if they have 0 practices
    // Include category metadata (id, slug, color, icon) for frontend
    return categories
      .filter((cat) => cat.name) // Only filter out categories with null/undefined names
      .map((cat) => ({
        category_id: cat.id,
        category: cat.name,
        category_slug: cat.slug,
        count: cat._count.practices,
        color_class: cat.colorClass || '',
        icon_name: cat.iconName || '',
      }));
  }

  private async getRecentBenchmarkedSummary() {
    const benchmarked = await prisma.benchmarkedPractice.findMany({
      take: 5,
      include: {
        practice: {
          include: {
            category: {
              select: { name: true },
            },
            plant: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { benchmarkedDate: 'desc' },
    });

    return benchmarked.map((bp) => ({
      id: bp.practice.id,
      title: bp.practice.title,
      category: bp.practice.category.name,
      plant: bp.practice.plant.name,
      date: bp.benchmarkedDate.toISOString(),
      savings_amount: bp.practice.savingsAmount ? Number(bp.practice.savingsAmount) : null,
      savings_currency: bp.practice.savingsCurrency || 'lakhs',
      savings_period: bp.practice.savingsPeriod || 'annually',
    }));
  }

  private async getStarRatingsSummary(currency: string = 'lakhs') {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    // Use monthlySavings table for better performance instead of calculating from practices
    const [monthlySavingsData, ytdSavingsData] = await Promise.all([
      // Get current month savings from monthlySavings table
      prisma.monthlySavings.findMany({
        where: {
          year: currentYear,
          month: currentMonth,
        },
        include: {
          plant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      // Get YTD savings by aggregating monthlySavings
      prisma.monthlySavings.groupBy({
        by: ['plantId'],
        where: {
          year: currentYear,
        },
        _sum: {
          totalSavings: true,
        },
      }),
    ]);

    // Create a map for quick lookup
    const ytdMap = new Map(
      ytdSavingsData.map((item) => [item.plantId, item._sum.totalSavings || new Prisma.Decimal(0)])
    );

    // Get all active plants for complete list
    const plants = await prisma.plant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
    });

    return plants
      .map((plant) => {
        const monthlyData = monthlySavingsData.find((ms) => ms.plantId === plant.id);
        const monthlySavings = monthlyData?.totalSavings || new Prisma.Decimal(0);
        const ytdSavings = ytdMap.get(plant.id) || new Prisma.Decimal(0);
        const stars = this.calculateStarRating(monthlySavings, currency);

        return {
          plant_id: plant.id,
          plant_name: plant.name,
          monthly_savings: this.formatCurrency(monthlySavings, currency),
          ytd_savings: this.formatCurrency(ytdSavings, currency),
          stars,
          currency,
        };
      })
      .sort((a, b) => b.stars - a.stars);
  }

  private async getPlantPerformanceSummary() {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    // Get ALL active plants, including those with 0 submissions
    const plants = await prisma.plant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        shortName: true,
        _count: {
          select: {
            practices: {
              where: {
                isDeleted: false,
                submittedDate: {
                  gte: startOfYear,
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc', // Order by name first, then we'll sort by submissions
      },
    });

    // Return all plants with their submission counts (including 0)
    return plants
      .map((plant) => ({
        plant_id: plant.id,
        plant_name: plant.name,
        short_name: plant.shortName,
        submitted: plant._count.practices || 0, // Ensure 0 if undefined
        submitted_count: plant._count.practices || 0, // Alias for compatibility
      }))
      .sort((a, b) => b.submitted - a.submitted); // Sort by submission count descending
  }

  private async getBenchmarkStatsSummary() {
    // Optimize: Count benchmarked practices per plant using aggregation
    const benchmarkedPractices = await prisma.benchmarkedPractice.findMany({
      where: {
        practice: {
          isDeleted: false,
        },
      },
      select: {
        practiceId: true,
        practice: {
          select: {
            plantId: true,
          },
        },
      },
    });

    // Count benchmarked practices per plant
    const plantBenchmarkedCount = new Map<string, number>();
    benchmarkedPractices.forEach((bp) => {
      const plantId = bp.practice.plantId;
      const current = plantBenchmarkedCount.get(plantId) || 0;
      plantBenchmarkedCount.set(plantId, current + 1);
    });

    // Get all active plants
    const plants = await prisma.plant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
    });

    return plants
      .map((plant) => ({
        plant_id: plant.id,
        plant_name: plant.name,
        benchmarked_count: plantBenchmarkedCount.get(plant.id) || 0,
      }))
      .sort((a, b) => b.benchmarked_count - a.benchmarked_count);
  }

  private async getRecentPracticesSummary(limit: number = 4) {
    const practices = await prisma.bestPractice.findMany({
      where: {
        isDeleted: false,
        // Show all submitted practices (not just approved) - users want to see latest submissions
        status: {
          in: ['submitted', 'approved'], // Include both submitted and approved practices
        },
      },
      include: {
        category: {
          select: { name: true },
        },
        plant: {
          select: { name: true, shortName: true },
        },
        submittedBy: {
          select: { fullName: true },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: { submittedDate: 'desc' }, // Order by submission date, newest first
      take: limit,
    });

    return practices.map((practice) => ({
      id: practice.id,
      title: practice.title,
      category: practice.category.name,
      plant: practice.plant.name,
      plant_short_name: practice.plant.shortName,
      submitted_by: practice.submittedBy.fullName,
      submitted_date: practice.submittedDate?.toISOString() || practice.createdAt.toISOString(),
      savings_amount: practice.savingsAmount ? Number(practice.savingsAmount) : null,
      savings_currency: practice.savingsCurrency || 'lakhs',
      question_count: practice._count.questions || 0,
    }));
  }

  private async getMyPracticesSummary(plantId: string) {
    const practices = await prisma.bestPractice.findMany({
      where: {
        plantId,
        isDeleted: false,
      },
      include: {
        category: {
          select: { name: true },
        },
        submittedBy: {
          select: { fullName: true },
        },
        benchmarked: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: { submittedDate: 'desc' },
      take: 10,
    });

    return practices.map((practice) => ({
      id: practice.id,
      title: practice.title,
      category: practice.category.name,
      submitted_by: practice.submittedBy.fullName,
      submitted_date: practice.submittedDate?.toISOString() || practice.createdAt.toISOString(),
      status: practice.status,
      is_benchmarked: !!practice.benchmarked,
      question_count: practice._count.questions,
      savings_amount: practice.savingsAmount ? Number(practice.savingsAmount) : null,
      savings_currency: practice.savingsCurrency || 'lakhs',
    }));
  }

  private async getMonthlyTrendSummary(plantId: string, currency: string = 'lakhs') {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    const practices = await prisma.bestPractice.findMany({
      where: {
        plantId,
        isDeleted: false,
        status: 'approved',
        submittedDate: {
          gte: startOfYear,
        },
        savingsAmount: { not: null },
      },
      select: {
        submittedDate: true,
        savingsAmount: true,
      },
    });

    // Group by month
    const monthlyData: { [key: string]: { savings: number; count: number } } = {};
    
    practices.forEach((practice) => {
      if (!practice.submittedDate) return;
      const date = new Date(practice.submittedDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { savings: 0, count: 0 };
      }
      
      monthlyData[monthKey].savings += Number(practice.savingsAmount || 0);
      monthlyData[monthKey].count += 1;
    });

    // Convert to array and calculate stars
    return Object.keys(monthlyData)
      .sort()
      .map((monthKey) => {
        const [year, month] = monthKey.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const savings = monthlyData[monthKey].savings;
        const stars = this.calculateStarRating(new Prisma.Decimal(savings), currency);

        return {
          month: `${monthNames[parseInt(month) - 1]} ${year}`,
          savings: this.formatCurrency(new Prisma.Decimal(savings), currency),
          stars,
        };
      });
  }
}

export const analyticsService = new AnalyticsService();

