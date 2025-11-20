/**
 * Custom hooks for benchmarking operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import type { CopySpreadItem } from '@/types/api';
import { toast } from 'sonner';

export const useBenchmarkedPractices = (params?: {
  plant_id?: string;
  category_id?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['benchmarked-practices', params],
    queryFn: () => apiService.listBenchmarkedPractices(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const useRecentBenchmarkedPractices = (limit: number = 10) => {
  return useQuery({
    queryKey: ['recent-benchmarked', limit],
    queryFn: () => apiService.getRecentBenchmarkedPractices(limit),
    staleTime: 1 * 60 * 1000,
  });
};

export const useCopySpread = (limit: number = 50) => {
  return useQuery<CopySpreadItem[]>({
    queryKey: ['copy-spread', limit],
    queryFn: () => apiService.getCopySpread(limit),
    staleTime: 5 * 60 * 1000,
  });
};

export const useBenchmarkPractice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (practiceId: string) => apiService.benchmarkPractice(practiceId),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['best-practices'] });
      queryClient.invalidateQueries({ queryKey: ['benchmarked-practices'] });
      queryClient.invalidateQueries({ queryKey: ['recent-benchmarked'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Practice benchmarked successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to benchmark practice');
    },
  });
};

export const useUnbenchmarkPractice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (practiceId: string) => apiService.unbenchmarkPractice(practiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['best-practices'] });
      queryClient.invalidateQueries({ queryKey: ['benchmarked-practices'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Practice unbenchmarked successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unbenchmark practice');
    },
  });
};

