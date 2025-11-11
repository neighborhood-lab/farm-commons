// Farm Commons Backend Server

import 'dotenv/config';
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';

// Routes
import authRoutes from './routes/auth.js';
import workerRoutes from './routes/workers.js';
import scheduleRoutes from './routes/schedules.js';
import timeEntryRoutes from './routes/timeEntries.js';
import statsRoutes from './routes/stats.js';
import soilDataRoutes from './routes/soil-data.js';
import invoiceRoutes from './routes/invoices.js';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import {
  initializeRedisClient,
  closeRedisClient,
  authRateLimiter,
  readOnlyRateLimiter,
  writeRateLimiter,
  healthCheckRateLimiter,
} from './middleware/rateLimiting.js';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
});

const httpLogger = pinoHttp({ logger });

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP logging
app.use(httpLogger);

// Health check with rate limiting
app.get('/health', healthCheckRateLimiter, (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes with route-specific rate limiting
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/workers', readOnlyRateLimiter, workerRoutes);
app.use('/api/schedules', writeRateLimiter, scheduleRoutes);
app.use('/api/time-entries', writeRateLimiter, timeEntryRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api', soilDataRoutes);
app.use('/api/invoices', invoiceRoutes);

// Welcome message
app.get('/', (_req, res) => {
  res.json({
    name: 'Farm Commons API',
    version: '0.1.0',
    description: 'Shared farm management software, community owned. For the humans who feed us.',
    documentation: '/api/docs',
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Initialize Redis and start server
async function startServer() {
  try {
    // Initialize Redis client for rate limiting
    await initializeRedisClient();

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚜 Farm Commons API server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info(`${signal} signal received: closing server gracefully`);

  try {
    // Close Redis connection
    await closeRedisClient();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the server
startServer();

export default app;
