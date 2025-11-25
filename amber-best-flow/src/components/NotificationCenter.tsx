/**
 * NotificationCenter Component
 * Displays notification bell icon with dropdown showing recent notifications
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, Star, CheckCircle, Loader2, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications, useUnreadNotificationCount, useMarkNotificationAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import { useNotificationWebSocket } from '@/hooks/useNotificationWebSocket';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '@/types/api';

const NotificationCenter = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  
  // WebSocket connection for real-time notifications
  const ws = useNotificationWebSocket();
  
  const { data: notificationsData, isLoading: notificationsLoading, error: notificationsError, refetch: refetchNotifications } = useNotifications(15);
  const { data: unreadCountData, error: unreadCountError, refetch: refetchUnreadCount } = useUnreadNotificationCount();
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  
  const handleRetry = () => {
    refetchNotifications();
    refetchUnreadCount();
  };

  const notifications = notificationsData?.data || [];
  const unreadCount = unreadCountData?.unread_count || 0;

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      try {
        await markAsReadMutation.mutateAsync(notification.id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
    
    // Navigate to practice detail if practice ID exists
    if (notification.related_practice_id) {
      try {
        navigate(`/practices/${notification.related_practice_id}`);
        setOpen(false);
      } catch (error) {
        console.error('Failed to navigate to practice:', error);
        // Fallback: navigate to practices list
        navigate('/practices');
        setOpen(false);
      }
    } else {
      // If no practice ID, just close the popover
      console.warn('Notification has no related practice ID');
      setOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'question_asked':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'question_answered':
        return <MessageCircle className="h-5 w-5 text-green-500" />;
      case 'practice_benchmarked':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0 hover:bg-accent"
          aria-label="Notifications"
          title={ws.connected ? 'Notifications (Connected)' : ws.connecting ? 'Connecting...' : 'Notifications (Disconnected)'}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          {/* Connection status indicator */}
          <div className="absolute -bottom-0.5 -right-0.5">
            {ws.connected ? (
              <Wifi className="h-2.5 w-2.5 text-green-500" />
            ) : ws.connecting ? (
              <Loader2 className="h-2.5 w-2.5 text-yellow-500 animate-spin" />
            ) : (
              <WifiOff className="h-2.5 w-2.5 text-muted-foreground" />
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Marking...
                </>
              ) : (
                'Mark all as read'
              )}
            </Button>
          )}
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {notificationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notificationsError ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground mb-2">Failed to load notifications</p>
              <p className="text-xs text-muted-foreground mb-4">
                {notificationsError instanceof Error ? notificationsError.message : 'Unknown error'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-accent/50 ${
                    !notification.is_read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p
                            className={`text-sm ${
                              !notification.is_read ? 'font-semibold' : 'font-medium'
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          {notification.practice_title && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Practice: {notification.practice_title}
                            </p>
                          )}
                        </div>
                        {!notification.is_read && (
                          <div className="flex-shrink-0 ml-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;

