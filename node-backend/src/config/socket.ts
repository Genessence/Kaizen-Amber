import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyAccessToken } from '../utils/jwt';
import env from './env';

interface AuthenticatedSocket {
  userId: string;
  userRole: string;
  plantId?: string;
}

const authenticatedSockets = new Map<string, AuthenticatedSocket>();

export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS || ['http://localhost:8080'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyAccessToken(token);
      
      // Attach user info to socket
      (socket as any).userId = decoded.userId;
      (socket as any).userRole = decoded.role;
      (socket as any).plantId = decoded.plantId;

      authenticatedSockets.set(socket.id, {
        userId: decoded.userId,
        userRole: decoded.role,
        plantId: decoded.plantId,
      });

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    const userRole = (socket as any).userRole;

    console.log(`Socket connected: ${socket.id} (User: ${userId}, Role: ${userRole})`);

    // Join user's personal room for notifications
    socket.join(`user:${userId}`);

    // Join practice rooms if needed (for Q&A updates)
    socket.on('join-practice', (practiceId: string) => {
      socket.join(`practice:${practiceId}`);
      console.log(`Socket ${socket.id} joined practice room: practice:${practiceId}`);
    });

    socket.on('leave-practice', (practiceId: string) => {
      socket.leave(`practice:${practiceId}`);
      console.log(`Socket ${socket.id} left practice room: practice:${practiceId}`);
    });

    socket.on('disconnect', () => {
      authenticatedSockets.delete(socket.id);
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Helper function to get socket instance
let socketInstance: SocketIOServer | null = null;

export const setSocketInstance = (io: SocketIOServer) => {
  socketInstance = io;
};

export const getSocketInstance = (): SocketIOServer | null => {
  return socketInstance;
};

// Helper functions to emit events
export const emitToUser = (userId: string, event: string, data: any) => {
  if (socketInstance) {
    socketInstance.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToPractice = (practiceId: string, event: string, data: any) => {
  if (socketInstance) {
    socketInstance.to(`practice:${practiceId}`).emit(event, data);
  }
};

