/**
 * Unified Dashboard Hook
 * Fetches ALL dashboard data in a single API call for maximum performance
 */

import { useQuery } from "@tanstack/react-query";
import {apiService} from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export const useUnifiedDashboard = (currency: 'lakhs' | 'crores' = 'lakhs') => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['unified-dashboard', user?.plant_id, currency],
    queryFn: () => apiService.getUnifiedDashboard(user?.plant_id, currency),
    staleTime: 0, // Always refetch when component mounts or query is invalidated
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: true, // Always refetch when component mounts
  });
};

