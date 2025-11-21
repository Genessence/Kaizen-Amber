/**
 * Generic WebSocket hook with auto-reconnect
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseWebSocketOptions {
  onMessage?: (event: MessageEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectInterval?: number;
  reconnectDecay?: number;
  timeout?: number;
  shouldReconnect?: boolean;
}

export interface UseWebSocketReturn {
  connected: boolean;
  connecting: boolean;
  error: Event | null;
  send: (data: string | object) => void;
  lastMessage: MessageEvent | null;
  reconnect: () => void;
  disconnect: () => void;
}

export const useWebSocket = (
  url: string | null,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn => {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnectInterval = 1000,
    maxReconnectInterval = 30000,
    reconnectDecay = 2,
    timeout = 30000,
    shouldReconnect = true,
  } = options;

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(shouldReconnect);
  const urlRef = useRef(url);

  // Update refs when props change
  useEffect(() => {
    urlRef.current = url;
    shouldReconnectRef.current = shouldReconnect;
  }, [url, shouldReconnect]);

  const connect = useCallback(() => {
    if (!urlRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(urlRef.current);
      wsRef.current = ws;

      const connectTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          setError(new Event('timeout'));
          setConnecting(false);
        }
      }, timeout);

      ws.onopen = () => {
        clearTimeout(connectTimeout);
        setConnected(true);
        setConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onOpen?.();
      };

      ws.onmessage = (event) => {
        setLastMessage(event);
        
        // Handle ping/pong automatically
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'ping') {
            // Automatically respond to ping with pong
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch {
          // Not JSON or not a ping message, proceed normally
        }
        
        onMessage?.(event);
      };

      ws.onerror = (event) => {
        clearTimeout(connectTimeout);
        setError(event);
        setConnecting(false);
        onError?.(event);
      };

      ws.onclose = () => {
        clearTimeout(connectTimeout);
        setConnected(false);
        setConnecting(false);
        onClose?.();

        // Attempt to reconnect
        if (shouldReconnectRef.current && urlRef.current) {
          const delay = Math.min(
            reconnectInterval * Math.pow(reconnectDecay, reconnectAttemptsRef.current),
            maxReconnectInterval
          );
          reconnectAttemptsRef.current += 1;

          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (err) {
      setError(err as Event);
      setConnecting(false);
    }
  }, [onMessage, onOpen, onClose, onError, reconnectInterval, maxReconnectInterval, reconnectDecay, timeout]);

  const send = useCallback((data: string | object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      wsRef.current.send(message);
    } else {
      console.warn('WebSocket is not connected. Message not sent.');
    }
  }, []);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
    setConnecting(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    shouldReconnectRef.current = true;
    reconnectAttemptsRef.current = 0;
    connect();
  }, [disconnect, connect]);

  useEffect(() => {
    if (url) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url]); // Only reconnect if URL changes

  return {
    connected,
    connecting,
    error,
    send,
    lastMessage,
    reconnect,
    disconnect,
  };
};

