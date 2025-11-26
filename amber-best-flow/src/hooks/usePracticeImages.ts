/**
 * Custom hook for fetching practice images
 */

import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import type { PracticeImage } from '@/types/api';

export const usePracticeImages = (practiceId?: string) => {
  return useQuery<PracticeImage[]>({
    queryKey: ['practice-images', practiceId],
    queryFn: async () => {
      if (!practiceId) {
        console.log('usePracticeImages: No practiceId provided');
        return Promise.resolve([]);
      }
      try {
        console.log('usePracticeImages: Fetching images for practice:', practiceId);
        const images = await apiService.getPracticeImages(practiceId);
        console.log('usePracticeImages: Received images:', images);
        console.log('usePracticeImages: Images count:', images?.length || 0);
        if (images && images.length > 0) {
          console.log('usePracticeImages: Image types:', images.map(img => ({ id: img.id, type: img.image_type, hasUrl: !!img.blob_url })));
        }
        return images || [];
      } catch (error) {
        console.error('usePracticeImages: Error fetching images:', error);
        throw error;
      }
    },
    enabled: !!practiceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
  });
};

