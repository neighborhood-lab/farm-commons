// Farm Commons Backend Server

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';

// Routes
import authRoutes from './routes/auth.js';
import workerRoutes from './routes/workers.js';
import scheduleRoutes from './routes/schedules.js';
import timeEntryRoutes from './routes/timeEntries.js';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Database and Services
import { connectRedis, disconnectRedis } from './db/redis.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  } : undefined,
});

const httpLogger = pinoHttp({ logger });

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP logging
app.use(httpLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/time-entries', timeEntryRoutes);

// Welcome message
app.get('/', (req, res) => {
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

// Initialize Redis connection
async function initializeApp() {
  try {
    await connectRedis();
    logger.info('✅ Redis connected successfully');
  } catch (error) {
    logger.error({ error }, '❌ Failed to connect to Redis');
    logger.warn('⚠️  Application will start without Redis. Session management will not work.');
  }
}

// Start server
app.listen(PORT, async () => {
  logger.info(`🚜 Farm Commons API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);

  // Initialize services
  await initializeApp();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await disconnectRedis();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await disconnectRedis();
  process.exit(0);
});

export default app;
