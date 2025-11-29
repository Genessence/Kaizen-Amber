/**
 * Custom hooks for copy & implement operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import type { CopyImplementRequest, CopyImplementResponse } from '@/types/api';
import { toast } from 'sonner';

export const useCopyImplement = () => {
  const queryClient = useQueryClient();

  return useMutation<CopyImplementResponse, Error, CopyImplementRequest>({
    mutationFn: (data) => apiService.copyAndImplement(data),
    onSuccess: (data) => {
      // Invalidate related queries to refresh dashboard
      queryClient.invalidateQueries({ queryKey: ['best-practices'] });
      queryClient.invalidateQueries({ queryKey: ['my-practices'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['copy-spread'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['unified-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      
      const points = data.data.points_awarded;
      toast.success(
        `Practice copied successfully! You earned ${points.copier_points} points.`,
        {
          description: `Origin plant earned ${points.origin_points} points.`,
        }
      );
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to copy practice');
    },
  });
};

