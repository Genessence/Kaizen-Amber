/**
 * Notification-specific WebSocket hook
 * Uses Socket.io for real-time notifications with React Query integration
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/contexts/SocketContext';
import type { Notification } from '@/types/api';

export const useNotificationWebSocket = () => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    // Listen for notification events
    const handleNotification = (notification: Notification) => {
      // Invalidate notifications query to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      
      // Optionally update cache optimistically
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: [notification, ...(old.data || [])],
          pagination: {
            ...old.pagination,
            total: (old.pagination?.total || 0) + 1,
          },
        };
      });
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, queryClient]);

  // Determine connection state more accurately
  // Socket.io has a 'connected' property that reflects the actual connection state
  // Use socket.connected as the source of truth, fallback to isConnected from context
  const actuallyConnected = socket?.connected ?? isConnected;
  // Socket is connecting if it exists, is not connected, but is active (trying to connect)
  const actuallyConnecting = socket ? (!socket.connected && socket.active) : false;

  return {
    connected: actuallyConnected,
    connecting: actuallyConnecting,
    socket,
  };
};
