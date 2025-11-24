/**
 * Custom hooks for prefetching data
 * Used for prefetching on navigation link hover
 */

import { useQueryClient } from '@tanstack/react-query';
import { prefetchPractices, prefetchCategories, prefetchPlants, prefetchBenchmarkedPractices, prefetchDashboard } from '@/utils/prefetch';

/**
 * Hook to prefetch practices list
 */
export const usePrefetchPractices = () => {
  const queryClient = useQueryClient();
  
  return (filters?: {
    category_id?: string;
    plant_id?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) => {
    prefetchPractices(queryClient, filters);
  };
};

/**
 * Hook to prefetch categories
 */
export const usePrefetchCategories = () => {
  const queryClient = useQueryClient();
  
  return () => {
    prefetchCategories(queryClient);
  };
};

/**
 * Hook to prefetch plants
 */
export const usePrefetchPlants = () => {
  const queryClient = useQueryClient();
  
  return (isActive?: boolean) => {
    prefetchPlants(queryClient, isActive);
  };
};

/**
 * Hook to prefetch benchmarked practices
 */
export const usePrefetchBenchmarkedPractices = () => {
  const queryClient = useQueryClient();
  
  return (params?: {
    plant_id?: string;
    category_id?: string;
    limit?: number;
    offset?: number;
  }) => {
    prefetchBenchmarkedPractices(queryClient, params);
  };
};

/**
 * Hook to prefetch dashboard data
 */
export const usePrefetchDashboard = () => {
  const queryClient = useQueryClient();
  
  return () => {
    prefetchDashboard(queryClient);
  };
};

