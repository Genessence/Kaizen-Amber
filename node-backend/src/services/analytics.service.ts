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

    // Total practices
    const totalPractices = await prisma.bestPractice.count({
      where: { isDeleted: false },
    });

    // This month practices
    const thisMonthPractices = await prisma.bestPractice.count({
      where: {
        isDeleted: false,
        submittedDate: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lt: new Date(currentYear, currentMonth, 1),
        },
      },
    });

    // YTD practices
    const ytdPractices = await prisma.bestPractice.count({
      where: {
        isDeleted: false,
        submittedDate: {
          gte: new Date(currentYear, 0, 1),
        },
      },
    });

    // Total savings
    const savingsResult = await prisma.bestPractice.aggregate({
      where: {
        isDeleted: false,
        status: 'approved',
        savingsAmount: { not: null },
      },
      _sum: { savingsAmount: true },
    });

    const totalSavings = savingsResult._sum.savingsAmount || Prisma.Decimal(0);

    // Benchmark count
    const benchmarkedCount = await prisma.benchmarkedPractice.count({
      where: {
        practice: {
          isDeleted: false,
        },
      },
    });

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
   */
  async getUnifiedDashboard(plantId?: string, currency: string = 'lakhs') {
    const overview = await this.getDashboardOverview(currency);
    const leaderboard = await this.getLeaderboardSummary();
    const copySpread = await this.getCopySpreadSummary();
    const categoryBreakdown = await this.getCategoryBreakdownSummary();
    const recentBenchmarked = await this.getRecentBenchmarkedSummary();
    const starRatings = await this.getStarRatingsSummary(currency);
    const plantPerformance = await this.getPlantPerformanceSummary();
    const benchmarkStats = await this.getBenchmarkStatsSummary();
    const recentPractices = await this.getRecentPracticesSummary(4);
    
    // Include plant-specific data if plantId provided
    let myPractices = null;
    let monthlyTrend = null;
    if (plantId) {
      myPractices = await this.getMyPracticesSummary(plantId);
      monthlyTrend = await this.getMonthlyTrendSummary(plantId, currency);
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
            name: true,
          },
        },
      },
      orderBy: { totalPoints: 'desc' },
      take: 10,
    });

    return entries.map((entry, index) => ({
      rank: index + 1,
      plant: entry.plant.name,
      total_points: entry.totalPoints,
    }));
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
    const categories = await prisma.category.findMany({
      include: {
        practices: {
          where: {
            isDeleted: false,
          },
          select: { id: true },
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
        count: cat.practices.length,
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
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const startOfYear = new Date(currentYear, 0, 1);

    const plants = await prisma.plant.findMany({
      where: { isActive: true },
      include: {
        practices: {
          where: {
            isDeleted: false,
            status: 'approved',
            savingsAmount: { not: null },
          },
        },
      },
    });

    return plants.map((plant) => {
      // Calculate monthly savings
      const monthlySavings = plant.practices
        .filter((p) => {
          const submittedDate = p.submittedDate;
          if (!submittedDate) return false;
          const date = new Date(submittedDate);
          return date >= startOfMonth && date < new Date(currentYear, currentMonth, 1);
        })
        .reduce((sum, p) => sum + Number(p.savingsAmount || 0), 0);

      // Calculate YTD savings
      const ytdSavings = plant.practices
        .filter((p) => {
          const submittedDate = p.submittedDate;
          if (!submittedDate) return false;
          return new Date(submittedDate) >= startOfYear;
        })
        .reduce((sum, p) => sum + Number(p.savingsAmount || 0), 0);

      // Calculate stars based on monthly savings
      const stars = this.calculateStarRating(Prisma.Decimal(monthlySavings), currency);

      return {
        plant_id: plant.id,
        plant_name: plant.name,
        monthly_savings: this.formatCurrency(Prisma.Decimal(monthlySavings), currency),
        ytd_savings: this.formatCurrency(Prisma.Decimal(ytdSavings), currency),
        stars,
        currency,
      };
    }).sort((a, b) => b.stars - a.stars);
  }

  private async getPlantPerformanceSummary() {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    const plants = await prisma.plant.findMany({
      where: { isActive: true },
      include: {
        practices: {
          where: {
            isDeleted: false,
            submittedDate: {
              gte: startOfYear,
            },
          },
          select: { id: true },
        },
      },
    });

    return plants.map((plant) => ({
      plant_id: plant.id,
      plant_name: plant.name,
      short_name: plant.shortName,
      submitted: plant.practices.length,
    })).sort((a, b) => b.submitted - a.submitted);
  }

  private async getBenchmarkStatsSummary() {
    const plants = await prisma.plant.findMany({
      where: { isActive: true },
      include: {
        practices: {
          where: {
            isDeleted: false,
          },
          include: {
            benchmarked: {
              select: { id: true },
            },
          },
        },
      },
    });

    return plants.map((plant) => {
      const benchmarkedCount = plant.practices.filter((p) => p.benchmarked !== null).length;
      return {
        plant_id: plant.id,
        plant_name: plant.name,
        benchmarked_count: benchmarkedCount,
      };
    }).sort((a, b) => b.benchmarked_count - a.benchmarked_count);
  }

  private async getRecentPracticesSummary(limit: number = 4) {
    const practices = await prisma.bestPractice.findMany({
      where: {
        isDeleted: false,
        status: 'approved',
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
      },
      orderBy: { submittedDate: 'desc' },
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
        const stars = this.calculateStarRating(Prisma.Decimal(savings), currency);

        return {
          month: `${monthNames[parseInt(month) - 1]} ${year}`,
          savings: this.formatCurrency(Prisma.Decimal(savings), currency),
          stars,
        };
      });
  }
}

export const analyticsService = new AnalyticsService();

