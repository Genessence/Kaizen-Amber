/**
 * Custom hooks for fetching best practices
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import type {
  BestPracticeListItem,
  BestPractice,
  BestPracticeCreate,
  PaginatedResponse
} from '@/types/api';
import { toast } from 'sonner';

interface BestPracticeFilters {
  category_id?: string;
  plant_id?: string;
  status?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
  is_benchmarked?: boolean;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const useBestPractices = (filters?: BestPracticeFilters) => {
  return useQuery<PaginatedResponse<BestPracticeListItem>>({
    queryKey: ['best-practices', filters],
    queryFn: () => apiService.listBestPractices(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useBestPractice = (practiceId: string | undefined) => {
  return useQuery<BestPractice>({
    queryKey: ['best-practice', practiceId],
    queryFn: () => apiService.getBestPractice(practiceId!),
    enabled: !!practiceId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useMyPractices = () => {
  return useQuery<BestPracticeListItem[]>({
    queryKey: ['my-practices'],
    queryFn: () => apiService.getMyPractices(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useRecentPractices = (limit: number = 10) => {
  return useQuery<BestPracticeListItem[]>({
    queryKey: ['recent-practices', limit],
    queryFn: () => apiService.getRecentPractices(limit),
    staleTime: 1 * 60 * 1000,
  });
};

export const useCreateBestPractice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BestPracticeCreate) => apiService.createBestPractice(data),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['best-practices'] });
      queryClient.invalidateQueries({ queryKey: ['my-practices'] });
      queryClient.invalidateQueries({ queryKey: ['recent-practices'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Best practice created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create best practice');
    },
  });
};

export const useUpdateBestPractice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ practiceId, data }: { practiceId: string; data: Partial<BestPracticeCreate> }) =>
      apiService.updateBestPractice(practiceId, data),
    onSuccess: (_, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['best-practices'] });
      queryClient.invalidateQueries({ queryKey: ['best-practice', variables.practiceId] });
      queryClient.invalidateQueries({ queryKey: ['my-practices'] });
      toast.success('Best practice updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update best practice');
    },
  });
};

export const useDeleteBestPractice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (practiceId: string) => apiService.deleteBestPractice(practiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['best-practices'] });
      queryClient.invalidateQueries({ queryKey: ['my-practices'] });
      toast.success('Best practice deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete best practice');
    },
  });
};

