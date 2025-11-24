/**
 * Prefetch utilities for common data
 * These functions prefetch data when hovering over navigation links
 */

import { QueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';

/**
 * Prefetch practices list
 */
export const prefetchPractices = (queryClient: QueryClient, filters?: {
  category_id?: string;
  plant_id?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}) => {
  queryClient.prefetchQuery({
    queryKey: ['best-practices', filters],
    queryFn: () => apiService.listBestPractices(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Prefetch categories
 */
export const prefetchCategories = (queryClient: QueryClient) => {
  queryClient.prefetchQuery({
    queryKey: ['categories'],
    queryFn: () => apiService.listCategories(),
    staleTime: 60 * 60 * 1000, // 60 minutes
  });
};

/**
 * Prefetch plants
 */
export const prefetchPlants = (queryClient: QueryClient, isActive?: boolean) => {
  queryClient.prefetchQuery({
    queryKey: ['plants', isActive],
    queryFn: () => apiService.listPlants(isActive),
    staleTime: 60 * 60 * 1000, // 60 minutes
  });
};

/**
 * Prefetch benchmarked practices
 */
export const prefetchBenchmarkedPractices = (queryClient: QueryClient, params?: {
  plant_id?: string;
  category_id?: string;
  limit?: number;
  offset?: number;
}) => {
  queryClient.prefetchQuery({
    queryKey: ['benchmarked-practices', params],
    queryFn: () => apiService.listBenchmarkedPractices(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Prefetch dashboard data
 * Prefetches all data needed for both HQ and Plant dashboards
 */
export const prefetchDashboard = (queryClient: QueryClient) => {
  // Prefetch dashboard overview (used by both roles)
  queryClient.prefetchQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => apiService.getDashboardOverview(),
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard data should be relatively fresh
  });

  // Prefetch leaderboard
  queryClient.prefetchQuery({
    queryKey: ['leaderboard'],
    queryFn: () => apiService.getLeaderboard(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Prefetch category breakdown
  queryClient.prefetchQuery({
    queryKey: ['category-breakdown'],
    queryFn: () => apiService.getCategoryBreakdown(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Prefetch recent benchmarked practices (limit 4 for dashboard)
  queryClient.prefetchQuery({
    queryKey: ['recent-benchmarked', 4],
    queryFn: () => apiService.getRecentBenchmarkedPractices(4),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });

  // Prefetch copy spread (limit 2 for dashboard)
  queryClient.prefetchQuery({
    queryKey: ['copy-spread', 2],
    queryFn: () => apiService.getCopySpread(2),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Prefetch plants (used in various places)
  prefetchPlants(queryClient, true);
};

