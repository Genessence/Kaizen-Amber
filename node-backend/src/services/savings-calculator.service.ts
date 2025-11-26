import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { analyticsService } from './analytics.service';

/**
 * Service for calculating and normalizing savings data
 * Implements logic from savings_logic.pdf
 */
export class SavingsCalculatorService {
  /**
   * Normalize savings amount to lakhs
   * All savings are stored in lakhs for consistency
   * 
   * @param amount - Savings amount
   * @param currency - Currency format ('lakhs' or 'crores')
   * @returns Amount normalized to lakhs
   */
  normalizeToLakhs(amount: number | Decimal, currency: string): number {
    const numAmount = typeof amount === 'number' ? amount : Number(amount);
    
    if (currency === 'crores') {
      // Convert crores to lakhs (1 crore = 100 lakhs)
      return numAmount * 100;
    }
    
    // Already in lakhs
    return numAmount;
  }

  /**
   * Convert annual savings to monthly savings
   * 
   * @param amount - Savings amount (normalized to lakhs)
   * @param period - Savings period ('monthly' or 'annually')
   * @returns Monthly savings amount in lakhs
   */
  convertToMonthlySavings(amount: number, period: string): number {
    if (period === 'annually') {
      // Divide annual savings by 12 to get monthly
      return amount / 12;
    }
    
    // Already monthly
    return amount;
  }

  /**
   * Calculate total monthly savings for a plant in a given month
   * Sums all submitted and approved practices for that month, normalizing currency and period
   * 
   * @param plantId - Plant UUID
   * @param year - Year
   * @param month - Month (1-12)
   * @returns Total monthly savings in lakhs
   */
  async calculateMonthlySavings(
    plantId: string,
    year: number,
    month: number
  ): Promise<number> {
    // Get all submitted and approved practices for this plant and month
    const practices = await prisma.bestPractice.findMany({
      where: {
        plantId,
        status: { in: ['submitted', 'approved'] },
        isDeleted: false,
        submittedDate: {
          gte: new Date(year, month - 1, 1), // Start of month
          lt: new Date(year, month, 1), // Start of next month
        },
      },
      select: {
        savingsAmount: true,
        savingsCurrency: true,
        savingsPeriod: true,
      },
    });

    // Sum up normalized savings
    let totalSavings = 0;
    
    for (const practice of practices) {
      if (practice.savingsAmount && practice.savingsCurrency && practice.savingsPeriod) {
        // Normalize to lakhs
        const normalizedAmount = this.normalizeToLakhs(
          practice.savingsAmount,
          practice.savingsCurrency
        );
        
        // Convert to monthly if needed
        const monthlySavings = this.convertToMonthlySavings(
          normalizedAmount,
          practice.savingsPeriod
        );
        
        totalSavings += monthlySavings;
      }
    }

    return totalSavings;
  }

  /**
   * Calculate YTD (Year-to-Date) savings for a plant
   * Sums monthly savings from January to the specified month
   * 
   * @param plantId - Plant UUID
   * @param year - Year
   * @param upToMonth - Month to calculate up to (1-12)
   * @returns YTD savings in lakhs
   */
  async calculateYTDSavings(
    plantId: string,
    year: number,
    upToMonth: number
  ): Promise<number> {
    // Get monthly savings from MonthlySavings table
    const monthlySavingsRecords = await prisma.monthlySavings.findMany({
      where: {
        plantId,
        year,
        month: {
          lte: upToMonth,
        },
      },
      select: {
        totalSavings: true,
      },
    });

    // Sum up all monthly savings
    let ytdTotal = 0;
    for (const record of monthlySavingsRecords) {
      ytdTotal += Number(record.totalSavings);
    }

    return ytdTotal;
  }

  /**
   * Recalculate and update monthly savings for a plant
   * Updates the MonthlySavings table with correct normalized values
   * Also calculates star rating based on monthly and YTD thresholds
   * 
   * @param plantId - Plant UUID
   * @param year - Year
   * @param month - Month (1-12)
   */
  async recalculatePlantMonthlySavings(
    plantId: string,
    year: number,
    month: number
  ): Promise<void> {
    // Calculate monthly savings
    const monthlySavings = await this.calculateMonthlySavings(plantId, year, month);

    // Calculate YTD savings (cumulative from Jan to current month)
    const ytdSavings = await this.calculateYTDSavings(plantId, year, month);

    // Get practice count for this month (count both submitted and approved)
    const practiceCount = await prisma.bestPractice.count({
      where: {
        plantId,
        status: { in: ['submitted', 'approved'] },
        isDeleted: false,
        submittedDate: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
    });

    // Calculate star rating using BOTH monthly and YTD thresholds
    const stars = analyticsService.calculateStarRating(
      new Decimal(monthlySavings),
      new Decimal(ytdSavings),
      'lakhs' // Always use lakhs for calculation
    );

    // Upsert monthly savings record
    await prisma.monthlySavings.upsert({
      where: {
        plantId_year_month: {
          plantId,
          year,
          month,
        },
      },
      create: {
        plantId,
        year,
        month,
        totalSavings: new Decimal(monthlySavings),
        savingsCurrency: 'lakhs', // Always store in lakhs
        practiceCount,
        stars,
      },
      update: {
        totalSavings: new Decimal(monthlySavings),
        savingsCurrency: 'lakhs', // Always store in lakhs
        practiceCount,
        stars,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Recalculate all monthly savings for a plant for a given year
   * Useful for bulk recalculation
   * 
   * @param plantId - Plant UUID
   * @param year - Year
   */
  async recalculatePlantYearlySavings(
    plantId: string,
    year: number
  ): Promise<void> {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Determine how many months to recalculate
    const maxMonth = year === currentYear ? currentMonth : 12;

    // Recalculate each month sequentially (important for cumulative YTD)
    for (let month = 1; month <= maxMonth; month++) {
      await this.recalculatePlantMonthlySavings(plantId, year, month);
    }
  }

  /**
   * Recalculate savings for all plants for a given year
   * 
   * @param year - Year
   */
  async recalculateAllPlantsSavings(year: number): Promise<void> {
    // Get all active plants
    const plants = await prisma.plant.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    // Recalculate for each plant
    for (const plant of plants) {
      await this.recalculatePlantYearlySavings(plant.id, year);
    }
  }
}

export const savingsCalculatorService = new SavingsCalculatorService();

