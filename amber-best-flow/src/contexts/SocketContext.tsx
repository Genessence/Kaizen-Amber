import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { tokenStorage } from '@/utils/tokenStorage';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  // Helper to sync connection state from socket
  const syncConnectionState = (socketInstance: Socket) => {
    setIsConnected(socketInstance.connected);
  };

  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Get token from storage
    const token = tokenStorage.getToken();
    if (!token) {
      return;
    }

    // Initialize Socket.io client
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const newSocket = io(socketUrl, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts,
      autoConnect: true,
    });

    // Sync initial connection state (socket might connect immediately)
    syncConnectionState(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      syncConnectionState(newSocket);
      reconnectAttempts.current = 0;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      
      // Attempt reconnection if not manually disconnected
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      reconnectAttempts.current += 1;
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    // Listen for reconnection attempts
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      syncConnectionState(newSocket);
      reconnectAttempts.current = 0;
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
      setIsConnected(false);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Reconnection failed');
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount or when user changes
    return () => {
      newSocket.close();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

