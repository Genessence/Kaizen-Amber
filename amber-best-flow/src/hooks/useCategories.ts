/**
 * Custom hook for fetching categories
 */

import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import type { CategoryWithCount } from '@/types/api';

export const useCategories = () => {
  return useQuery<CategoryWithCount[]>({
    queryKey: ['categories'],
    queryFn: () => apiService.listCategories(),
    staleTime: 60 * 60 * 1000, // 60 minutes
  });
};

