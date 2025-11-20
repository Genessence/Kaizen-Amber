/**
 * Custom hook for fetching practice images
 */

import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import type { PracticeImage } from '@/types/api';

export const usePracticeImages = (practiceId?: string) => {
  return useQuery<PracticeImage[]>({
    queryKey: ['practice-images', practiceId],
    queryFn: () => {
      if (!practiceId) {
        return Promise.resolve([]);
      }
      return apiService.getPracticeImages(practiceId);
    },
    enabled: !!practiceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

