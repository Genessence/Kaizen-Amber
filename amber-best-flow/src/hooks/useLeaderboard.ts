/**
 * Custom hooks for leaderboard data
 */

import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import type { LeaderboardEntry, PlantLeaderboardBreakdown } from '@/types/api';

export const useLeaderboard = (year?: number) => {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', year],
    queryFn: () => apiService.getLeaderboard(year),
    staleTime: 2 * 60 * 1000,
  });
};

export const usePlantLeaderboardBreakdown = (plantId: string | undefined, year?: number) => {
  return useQuery<PlantLeaderboardBreakdown>({
    queryKey: ['leaderboard-breakdown', plantId, year],
    queryFn: () => apiService.getPlantBreakdown(plantId!, year),
    enabled: !!plantId,
    staleTime: 2 * 60 * 1000,
  });
};

