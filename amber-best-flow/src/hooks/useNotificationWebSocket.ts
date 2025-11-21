/**
 * Notification-specific WebSocket hook
 * Wraps useWebSocket with notification handling and React Query integration
 */

import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket, UseWebSocketOptions } from './useWebSocket';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification } from '@/types/api';

interface WebSocketMessage {
  type: 'notification' | 'notification_read' | 'unread_count' | 'connected' | 'ping' | 'pong';
  data?: any;
  timestamp?: string;
}

// Note: The notification data.type can be 'question_asked', 'question_answered', or 'practice_benchmarked'

export const useNotificationWebSocket = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Build WebSocket URL with JWT token
  const wsUrl = useMemo(() => {
    if (!user) return null;
    
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
    const wsBaseUrl = baseUrl.replace(/^https?/, wsProtocol);
    
    return `${wsBaseUrl}/ws/notifications?token=${encodeURIComponent(token)}`;
  }, [user]);

  const handleMessage = (event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'notification':
          // New notification received
          if (message.data) {
            // Invalidate notifications query to refetch
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
            
            // Optionally update cache optimistically
            queryClient.setQueryData(['notifications'], (old: any) => {
              if (!old) return old;
              return {
                ...old,
                data: [message.data as Notification, ...(old.data || [])],
                pagination: {
                  ...old.pagination,
                  total: (old.pagination?.total || 0) + 1,
                },
              };
            });
          }
          break;

        case 'notification_read':
          // Notification marked as read
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
          break;

        case 'unread_count':
          // Unread count update
          if (message.data?.count !== undefined) {
            queryClient.setQueryData(['notifications', 'unread-count'], {
              unread_count: message.data.count,
            });
          }
          break;

        case 'connected':
          // Connection established
          console.log('WebSocket connected for notifications');
          break;

        case 'ping':
          // Ping received - useWebSocket hook will handle pong response
          break;

        case 'pong':
          // Pong received - connection is alive
          break;

        default:
          console.warn('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  const options: UseWebSocketOptions = {
    onMessage: handleMessage,
    onOpen: () => {
      console.log('Notification WebSocket connected');
    },
    onClose: () => {
      console.log('Notification WebSocket disconnected');
    },
    onError: (error) => {
      console.error('Notification WebSocket error:', error);
    },
    reconnectInterval: 1000,
    maxReconnectInterval: 30000,
    reconnectDecay: 2,
    shouldReconnect: !!user,
  };

  const ws = useWebSocket(wsUrl, options);

  return ws;
};

