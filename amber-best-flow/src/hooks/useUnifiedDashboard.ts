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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

