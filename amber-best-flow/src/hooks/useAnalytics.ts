/**
 * Custom hooks for analytics data
 */

import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import type {
  DashboardOverview,
  PlantPerformance,
  CategoryBreakdown,
  PlantSavings,
  MonthlySavingsBreakdown,
  StarRating,
  MonthlyTrend,
  BenchmarkStats,
  PeriodType,
  CurrencyFormat,
  APIResponse
} from '@/types/api';

export const useDashboardOverview = (currency: CurrencyFormat = 'lakhs') => {
  return useQuery<DashboardOverview>({
    queryKey: ['dashboard-overview', currency],
    queryFn: () => apiService.getDashboardOverview(currency),
    staleTime: 5 * 60 * 1000, // 5 minutes - balance between freshness and performance
  });
};

export const usePlantPerformance = (
  period: PeriodType = 'yearly',
  year?: number,
  month?: number
) => {
  return useQuery<PlantPerformance[]>({
    queryKey: ['analytics', 'plant-performance', period, year, month],
    queryFn: () => apiService.getPlantPerformance(period, year, month),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCategoryBreakdown = (plantId?: string, year?: number) => {
  return useQuery<CategoryBreakdown[]>({
    queryKey: ['category-breakdown', plantId, year],
    queryFn: () => apiService.getCategoryBreakdown(plantId, year),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCostSavings = (
  period: PeriodType = 'yearly',
  currency: CurrencyFormat = 'lakhs',
  year?: number,
  month?: number
) => {
  return useQuery<APIResponse<PlantSavings[]>>({
    queryKey: ['analytics', 'cost-savings', period, currency, year, month],
    queryFn: () => apiService.getCostSavings(period, currency, year, month),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCostAnalysis = (currency: CurrencyFormat = 'lakhs') => {
  return useQuery<APIResponse<PlantSavings[]>>({
    queryKey: ['analytics', 'cost-analysis', currency],
    queryFn: () => apiService.getCostAnalysis(currency),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePlantMonthlyBreakdown = (
  plantId: string | undefined,
  year?: number,
  currency: CurrencyFormat = 'lakhs'
) => {
  return useQuery<MonthlySavingsBreakdown[]>({
    queryKey: ['analytics', 'plant-monthly', plantId, year, currency],
    queryFn: () => apiService.getPlantMonthlyBreakdown(plantId!, year, currency),
    enabled: !!plantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useStarRatings = (currency: CurrencyFormat = 'lakhs', year?: number) => {
  return useQuery<StarRating[]>({
    queryKey: ['analytics', 'star-ratings', currency, year],
    queryFn: () => apiService.getStarRatings(currency, year),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePlantMonthlyTrend = (
  plantId: string | undefined,
  year?: number,
  currency: CurrencyFormat = 'lakhs'
) => {
  return useQuery<MonthlyTrend[]>({
    queryKey: ['analytics', 'monthly-trend', plantId, year, currency],
    queryFn: () => apiService.getPlantMonthlyTrend(plantId!, year, currency),
    enabled: !!plantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useBenchmarkStats = (year?: number, month?: number) => {
  return useQuery<BenchmarkStats[]>({
    queryKey: ['analytics', 'benchmark-stats', year, month],
    queryFn: () => apiService.getBenchmarkStats(year, month),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

