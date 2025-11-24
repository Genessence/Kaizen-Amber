import { createServer } from 'http';
import createApp from './app';
import env from './config/env';
import prisma from './config/database';
import { initializeSocket, setSocketInstance } from './config/socket';

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    const app = createApp();
    const httpServer = createServer(app);
    const port = env.PORT;

    // Initialize Socket.io
    const io = initializeSocket(httpServer);
    setSocketInstance(io);
    console.log('✅ Socket.io initialized');

    httpServer.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📝 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 API available at http://localhost:${port}/api/v1`);
      console.log(`🔌 WebSocket server ready`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

