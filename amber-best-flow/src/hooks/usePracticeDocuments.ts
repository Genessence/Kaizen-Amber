/**
 * Custom hook for fetching practice documents
 */

import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import type { PracticeDocument } from '@/types/api';

export const usePracticeDocuments = (practiceId?: string) => {
  return useQuery<PracticeDocument[]>({
    queryKey: ['practice-documents', practiceId],
    queryFn: () => {
      if (!practiceId) {
        return Promise.resolve([]);
      }
      return apiService.getPracticeDocuments(practiceId);
    },
    enabled: !!practiceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

