import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export class AnalyticsService {
  /**
   * Calculate star rating based on BOTH monthly and YTD savings thresholds
   * 
   * Boundary Logic: Exclusive lower, inclusive upper for consistent intervals
   * - 5 stars: YTD > 200L AND Monthly > 16L
   * - 4 stars: YTD ∈ (150, 200] AND Monthly ∈ (12, 16]
   * - 3 stars: YTD ∈ (100, 150] AND Monthly ∈ (8, 12]
   * - 2 stars: YTD ∈ (50, 100] AND Monthly ∈ (4, 8]
   * - 1 star: YTD ∈ (0, 50] AND Monthly ∈ (0, 4]
   * - 0 stars: YTD = 0 OR Monthly = 0
   * 
   * Examples:
   * - 16L monthly + 200L YTD = 4 stars (at upper boundary)
   * - 16.1L monthly + 200.1L YTD = 5 stars (exceeds 4-star threshold)
   * - 8L monthly + 100L YTD = 2 stars (at upper boundary)
   * - 4L monthly + 50L YTD = 1 star (at upper boundary)
   * - 5L monthly + 30L YTD = 1 star (YTD limits overall rating)
   * - 20L monthly + 60L YTD = 2 stars (both must meet threshold)
   * 
   * @param monthlySavings - Monthly savings amount (in lakhs)
   * @param ytdSavings - Year-to-date savings amount (in lakhs)
   * @param currency - Currency format ('lakhs' or 'crores')
   * @returns Star rating (0-5)
   */
  calculateStarRating(
    monthlySavings: Prisma.Decimal | null,
    ytdSavings: Prisma.Decimal | null,
    currency: string = 'lakhs'
  ): number {
    // Explicit zero/null check
    if (!monthlySavings || !ytdSavings) return 0;

    let monthly = Number(monthlySavings);
    let ytd = Number(ytdSavings);
    
    // Return 0 for zero savings
    if (monthly === 0 || ytd === 0) return 0;
    
    // Convert to lakhs if in crores
    if (currency === 'crores') {
      monthly = monthly * 100;
      ytd = ytd * 100;
    }

    // BOTH thresholds must be met for each star level
    // Check from highest to lowest to avoid overlaps
    
    // 5 stars: YTD > 200L AND Monthly > 16L
    if (ytd > 200 && monthly > 16) {
      return 5;
    }
    
    // 4 stars: YTD in (150, 200] AND Monthly in (12, 16]
    if (ytd > 150 && ytd <= 200 && monthly > 12 && monthly <= 16) {
      return 4;
    }
    
    // 3 stars: YTD in (100, 150] AND Monthly in (8, 12]
    if (ytd > 100 && ytd <= 150 && monthly > 8 && monthly <= 12) {
      return 3;
    }
    
    // 2 stars: YTD in (50, 100] AND Monthly in (4, 8]
    if (ytd > 50 && ytd <= 100 && monthly > 4 && monthly <= 8) {
      return 2;
    }
    
    // 1 star: YTD in (0, 50] AND Monthly in (0, 4]
    if (ytd > 0 && ytd <= 50 && monthly > 0 && monthly <= 4) {
      return 1;
    }
    
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
   * If plantId is provided, filters data for that specific plant
   */
  async getDashboardOverview(currency: string = 'lakhs', plantId?: string) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const startOfYear = new Date(currentYear, 0, 1);

    // Build base where clause - filter by plantId if provided
    const baseWhere: { isDeleted: boolean; plantId?: string } = { isDeleted: false };
    if (plantId) {
      baseWhere.plantId = plantId;
    }

    // Run all count queries in parallel for better performance
    const [
      totalPractices,
      thisMonthPractices,
      ytdPractices,
      savingsResult,
      benchmarkedCount,
    ] = await Promise.all([
      prisma.bestPractice.count({
        where: baseWhere,
      }),
      prisma.bestPractice.count({
        where: {
          ...baseWhere,
          submittedDate: {
            gte: startOfMonth,
            lt: new Date(currentYear, currentMonth, 1),
          },
        },
      }),
      prisma.bestPractice.count({
        where: {
          ...baseWhere,
          submittedDate: {
            gte: startOfYear,
          },
        },
      }),
      prisma.bestPractice.aggregate({
        where: {
          ...baseWhere,
          status: { in: ['submitted', 'approved'] },
          savingsAmount: { not: null },
        },
        _sum: { savingsAmount: true },
      }),
      prisma.benchmarkedPractice.count({
        where: {
          practice: {
            ...baseWhere,
          },
        },
      }),
    ]);

    const totalSavings = savingsResult._sum.savingsAmount || new Prisma.Decimal(0);

    // Calculate star rating if plantId is provided (plant-specific dashboard)
    let stars = 0;
    if (plantId) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      // Get monthly and YTD savings for this plant
      const monthlySavingsRecord = await prisma.monthlySavings.findUnique({
        where: {
          plantId_year_month: {
            plantId,
            year: currentYear,
            month: currentMonth,
          },
        },
      });

      const ytdSavingsRecords = await prisma.monthlySavings.groupBy({
        by: ['plantId'],
        where: {
          plantId,
          year: currentYear,
        },
        _sum: {
          totalSavings: true,
        },
      });

      const monthlySavings = monthlySavingsRecord?.totalSavings || new Prisma.Decimal(0);
      const ytdSavings = ytdSavingsRecords[0]?._sum.totalSavings || new Prisma.Decimal(0);
      
      stars = this.calculateStarRating(monthlySavings, ytdSavings, currency);
    }

    return {
      total_practices: totalPractices,
      this_month_practices: thisMonthPractices,
      ytd_practices: ytdPractices,
      this_month_savings: plantId ? this.formatCurrency(totalSavings, currency) : '0', // For plant users, show monthly savings
      total_savings: this.formatCurrency(totalSavings, currency),
      benchmarked_count: benchmarkedCount,
      stars,
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
      this.getDashboardOverview(currency, plantId), // Pass plantId to filter overview
      this.getLeaderboardSummary(),
      this.getCopySpreadSummary(),
      this.getCategoryBreakdownSummary(plantId), // Pass plantId to filter categories
      this.getRecentBenchmarkedSummary(),
      this.getStarRatingsSummary(currency),
      this.getPlantPerformanceSummary(),
      this.getBenchmarkStatsSummary(),
      this.getRecentPracticesSummary(4, plantId), // Pass plantId to filter recent practices
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

  private async getCategoryBreakdownSummary(plantId?: string) {
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
                ...(plantId ? { plantId } : {}),
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
        // Calculate stars using BOTH monthly and YTD thresholds
        const stars = this.calculateStarRating(monthlySavings, ytdSavings, currency);

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

  private async getRecentPracticesSummary(limit: number = 4, plantId?: string) {
    const whereClause: {
      isDeleted: boolean;
      status: { in: string[] };
      plantId?: string;
    } = {
      isDeleted: false,
      // Show all submitted practices (not just approved) - users want to see latest submissions
      status: {
        in: ['submitted', 'approved'], // Include both submitted and approved practices
      },
    };

    // Filter by plantId if provided (for plant users)
    if (plantId) {
      whereClause.plantId = plantId;
    }

    const practices = await prisma.bestPractice.findMany({
      where: whereClause,
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
      // Removed take limit to show all practices in monthly breakdown
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
        status: { in: ['submitted', 'approved'] },
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

    // Convert to array and calculate stars with cumulative YTD
    const sortedMonths = Object.keys(monthlyData).sort();
    let cumulativeYTD = 0;
    
    return sortedMonths.map((monthKey) => {
      const monthlySavings = monthlyData[monthKey].savings;
      
      // Calculate cumulative YTD (sum from Jan to current month)
      cumulativeYTD += monthlySavings;
      
      // Calculate stars using BOTH monthly and YTD thresholds
      const stars = this.calculateStarRating(
        new Prisma.Decimal(monthlySavings),
        new Prisma.Decimal(cumulativeYTD),
        currency
      );

      return {
        month: monthKey, // Return "YYYY-MM" format for consistent parsing
        savings: this.formatCurrency(new Prisma.Decimal(monthlySavings), currency),
        stars,
      };
    });
  }
}

export const analyticsService = new AnalyticsService();

