import { PrismaClient } from '@prisma/client';
import env from './env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.DEBUG ? ['query', 'error', 'warn'] : ['error'],
    // Connection pool configuration for better performance
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });

// Optimize connection pool on startup
if (env.NODE_ENV === 'production') {
  // Pre-warm the connection pool
  prisma.$connect().then(() => {
    console.log('✅ Database connection pool initialized');
  }).catch((error) => {
    console.error('❌ Failed to initialize database connection pool:', error);
  });
}

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;

