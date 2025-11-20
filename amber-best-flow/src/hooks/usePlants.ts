/**
 * Custom hooks for fetching plants
 */

import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import type { Plant, PlantWithStats } from '@/types/api';

export const usePlants = (isActive?: boolean) => {
  return useQuery<Plant[]>({
    queryKey: ['plants', isActive],
    queryFn: () => apiService.listPlants(isActive),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useActivePlants = () => {
  return useQuery<Plant[]>({
    queryKey: ['plants', 'active'],
    queryFn: () => apiService.getActivePlants(),
    staleTime: 30 * 60 * 1000,
  });
};

export const usePlant = (plantId: string | undefined) => {
  return useQuery<PlantWithStats>({
    queryKey: ['plant', plantId],
    queryFn: () => apiService.getPlant(plantId!),
    enabled: !!plantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

