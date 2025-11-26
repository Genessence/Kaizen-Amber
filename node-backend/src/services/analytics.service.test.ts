import { analyticsService } from './analytics.service';
import { Prisma } from '@prisma/client';

describe('AnalyticsService - calculateStarRating', () => {
  describe('Zero and Null Values', () => {
    it('should return 0 stars for null monthlySavings', () => {
      const result = analyticsService.calculateStarRating(null, new Prisma.Decimal(100));
      expect(result).toBe(0);
    });

    it('should return 0 stars for null ytdSavings', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(10), null);
      expect(result).toBe(0);
    });

    it('should return 0 stars for zero monthlySavings', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(0), new Prisma.Decimal(100));
      expect(result).toBe(0);
    });

    it('should return 0 stars for zero ytdSavings', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(10), new Prisma.Decimal(0));
      expect(result).toBe(0);
    });

    it('should return 0 stars for both zero', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(0), new Prisma.Decimal(0));
      expect(result).toBe(0);
    });
  });

  describe('1 Star Boundary Tests', () => {
    it('should return 1 star for monthly=4L, ytd=50L (upper boundary)', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(4), new Prisma.Decimal(50));
      expect(result).toBe(1);
    });

    it('should return 1 star for monthly=1L, ytd=25L (within range)', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(1), new Prisma.Decimal(25));
      expect(result).toBe(1);
    });

    it('should return 1 star for monthly=3L, ytd=30L', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(3), new Prisma.Decimal(30));
      expect(result).toBe(1);
    });

    it('should return 1 star for monthly=0.5L, ytd=10L', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(0.5), new Prisma.Decimal(10));
      expect(result).toBe(1);
    });
  });

  describe('2 Star Boundary Tests', () => {
    it('should return 2 stars for monthly=4.1L, ytd=50.1L (just above 1-star threshold)', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(4.1), new Prisma.Decimal(50.1));
      expect(result).toBe(2);
    });

    it('should return 2 stars for monthly=8L, ytd=100L (upper boundary)', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(8), new Prisma.Decimal(100));
      expect(result).toBe(2);
    });

    it('should return 2 stars for monthly=5L, ytd=75L (within range)', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(5), new Prisma.Decimal(75));
      expect(result).toBe(2);
    });

    it('should return 2 stars for monthly=6L, ytd=60L', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(6), new Prisma.Decimal(60));
      expect(result).toBe(2);
    });
  });

  describe('3 Star Boundary Tests', () => {
    it('should return 3 stars for monthly=8.1L, ytd=100.1L (just above 2-star threshold)', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(8.1), new Prisma.Decimal(100.1));
      expect(result).toBe(3);
    });

    it('should return 3 stars for monthly=12L, ytd=150L (upper boundary)', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(12), new Prisma.Decimal(150));
      expect(result).toBe(3);
    });

    it('should return 3 stars for monthly=10L, ytd=125L (within range)', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(10), new Prisma.Decimal(125));
      expect(result).toBe(3);
    });

    it('should return 3 stars for monthly=9L, ytd=110L', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(9), new Prisma.Decimal(110));
      expect(result).toBe(3);
    });
  });

  describe('4 Star Boundary Tests', () => {
    it('should return 4 stars for monthly=12.1L, ytd=150.1L (just above 3-star threshold)', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(12.1), new Prisma.Decimal(150.1));
      expect(result).toBe(4);
    });

    it('should return 4 stars for monthly=16L, ytd=200L (upper boundary)', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(16), new Prisma.Decimal(200));
      expect(result).toBe(4);
    });

    it('should return 4 stars for monthly=14L, ytd=175L (within range)', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(14), new Prisma.Decimal(175));
      expect(result).toBe(4);
    });

    it('should return 4 stars for monthly=15L, ytd=180L', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(15), new Prisma.Decimal(180));
      expect(result).toBe(4);
    });
  });

  describe('5 Star Boundary Tests', () => {
    it('should return 5 stars for monthly=16.1L, ytd=200.1L (just above 4-star threshold)', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(16.1), new Prisma.Decimal(200.1));
      expect(result).toBe(5);
    });

    it('should return 5 stars for monthly=17L, ytd=201L', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(17), new Prisma.Decimal(201));
      expect(result).toBe(5);
    });

    it('should return 5 stars for monthly=20L, ytd=250L (well above threshold)', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(20), new Prisma.Decimal(250));
      expect(result).toBe(5);
    });

    it('should return 5 stars for monthly=50L, ytd=500L (very high)', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(50), new Prisma.Decimal(500));
      expect(result).toBe(5);
    });
  });

  describe('Mismatch Scenarios - Both Thresholds Must Meet', () => {
    it('should return 2 stars for high monthly (20L) but low YTD (60L) - limited by YTD', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(20), new Prisma.Decimal(60));
      expect(result).toBe(2);
    });

    it('should return 0 stars for low monthly (2L) but high YTD (300L) - limited by monthly', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(2), new Prisma.Decimal(300));
      expect(result).toBe(1);
    });

    it('should return 1 star for monthly=5L (would be 2-star) but YTD=30L (1-star)', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(5), new Prisma.Decimal(30));
      expect(result).toBe(1);
    });

    it('should return 3 stars for monthly=10L, YTD=120L (both in 3-star range)', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(10), new Prisma.Decimal(120));
      expect(result).toBe(3);
    });

    it('should return 1 star for monthly=4L (1-star) but YTD=60L (would be 2-star)', () => {
      const result = analyticsService.calculateStarRating(new Prisma.Decimal(4), new Prisma.Decimal(60));
      expect(result).toBe(1);
    });
  });

  describe('Currency Conversion - Crores to Lakhs', () => {
    it('should convert 0.16 Cr monthly + 2 Cr YTD = 4 stars (16L + 200L)', () => {
      const result = analyticsService.calculateStarRating(
        new Prisma.Decimal(0.16),
        new Prisma.Decimal(2),
        'crores'
      );
      expect(result).toBe(4);
    });

    it('should convert 0.17 Cr monthly + 2.1 Cr YTD = 5 stars (17L + 210L)', () => {
      const result = analyticsService.calculateStarRating(
        new Prisma.Decimal(0.17),
        new Prisma.Decimal(2.1),
        'crores'
      );
      expect(result).toBe(5);
    });

    it('should convert 0.08 Cr monthly + 1 Cr YTD = 2 stars (8L + 100L)', () => {
      const result = analyticsService.calculateStarRating(
        new Prisma.Decimal(0.08),
        new Prisma.Decimal(1),
        'crores'
      );
      expect(result).toBe(2);
    });

    it('should convert 0.04 Cr monthly + 0.5 Cr YTD = 1 star (4L + 50L)', () => {
      const result = analyticsService.calculateStarRating(
        new Prisma.Decimal(0.04),
        new Prisma.Decimal(0.5),
        'crores'
      );
      expect(result).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small decimal values', () => {
      const result = analyticsService.calculateStarRating(
        new Prisma.Decimal(0.001),
        new Prisma.Decimal(0.01)
      );
      expect(result).toBe(1);
    });

    it('should handle exact boundary at 50.0L YTD and 4.0L monthly', () => {
      const result = analyticsService.calculateStarRating(
        new Prisma.Decimal(4.0),
        new Prisma.Decimal(50.0)
      );
      expect(result).toBe(1);
    });

    it('should handle exact boundary at 100.0L YTD and 8.0L monthly', () => {
      const result = analyticsService.calculateStarRating(
        new Prisma.Decimal(8.0),
        new Prisma.Decimal(100.0)
      );
      expect(result).toBe(2);
    });

    it('should handle exact boundary at 150.0L YTD and 12.0L monthly', () => {
      const result = analyticsService.calculateStarRating(
        new Prisma.Decimal(12.0),
        new Prisma.Decimal(150.0)
      );
      expect(result).toBe(3);
    });

    it('should handle exact boundary at 200.0L YTD and 16.0L monthly', () => {
      const result = analyticsService.calculateStarRating(
        new Prisma.Decimal(16.0),
        new Prisma.Decimal(200.0)
      );
      expect(result).toBe(4);
    });
  });

  describe('Fractional Savings', () => {
    it('should handle monthly=4.5L, ytd=55L correctly as 2 stars', () => {
      const result = analyticsService.calculateStarRating(
        new Prisma.Decimal(4.5),
        new Prisma.Decimal(55)
      );
      expect(result).toBe(2);
    });

    it('should handle monthly=12.5L, ytd=160L correctly as 4 stars', () => {
      const result = analyticsService.calculateStarRating(
        new Prisma.Decimal(12.5),
        new Prisma.Decimal(160)
      );
      expect(result).toBe(4);
    });

    it('should handle monthly=3.9L, ytd=49L correctly as 1 star', () => {
      const result = analyticsService.calculateStarRating(
        new Prisma.Decimal(3.9),
        new Prisma.Decimal(49)
      );
      expect(result).toBe(1);
    });
  });
});

