/**
 * Custom hooks for notifications
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import type { Notification, NotificationListResponse, UnreadCountResponse } from '@/types/api';
import { toast } from 'sonner';

export const useNotifications = (limit: number = 15) => {
  return useQuery<NotificationListResponse>({
    queryKey: ['notifications', limit],
    queryFn: async () => {
      try {
        return await apiService.getNotifications({ limit });
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - cache will be updated via WebSocket
    retry: 2, // Retry twice on failure
    retryDelay: 1000, // Wait 1 second between retries
    retryOnMount: true, // Retry when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
    enabled: true, // Ensure query is enabled
    // Removed refetchInterval - using WebSocket for real-time updates
  });
};

export const useUnreadNotificationCount = () => {
  return useQuery<UnreadCountResponse>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      try {
        return await apiService.getUnreadNotificationCount();
      } catch (error) {
        console.error('Failed to fetch unread notification count:', error);
        // Return default value instead of throwing to prevent UI breaking
        return { unread_count: 0 };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - cache will be updated via WebSocket
    retry: 2, // Retry twice on failure
    retryDelay: 1000, // Wait 1 second between retries
    retryOnMount: true, // Retry when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
    enabled: true, // Ensure query is enabled
    // Removed refetchInterval - using WebSocket for real-time updates
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => apiService.markNotificationAsRead(notificationId),
    onSuccess: () => {
      // Invalidate both notifications list and unread count
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
    onError: (error: any) => {
      console.error('Failed to mark notification as read:', error);
      toast.error(error.message || 'Failed to mark notification as read');
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiService.markAllNotificationsAsRead(),
    onSuccess: () => {
      // Invalidate both notifications list and unread count
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast.success('All notifications marked as read');
    },
    onError: (error: any) => {
      console.error('Failed to mark all notifications as read:', error);
      toast.error(error.message || 'Failed to mark all notifications as read');
    },
  });
};

