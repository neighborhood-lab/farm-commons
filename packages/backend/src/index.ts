// Farm Commons Backend Server

import 'dotenv/config';
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger.js';

// Monitoring
import {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  metricsMiddleware,
  getMetrics,
  getMetricsContentType,
} from './monitoring/index.js';

// Routes
import authRoutes from './routes/auth.js';
import workerRoutes from './routes/workers.js';
import scheduleRoutes from './routes/schedules.js';
import timeEntryRoutes from './routes/timeEntries.js';
import certificationRoutes from './routes/certifications.js';
import skillRoutes from './routes/skills.js';
import equipmentAssignmentRoutes from './routes/equipment-assignments.js';
import timeApprovalRoutes from './routes/time-approvals.js';
import statsRoutes from './routes/stats.js';
import taskChecklistRoutes from './routes/task-checklists.js';
import soilDataRoutes from './routes/soil-data.js';
import invoiceRoutes from './routes/invoices.js';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Initialize Sentry error tracking (must be first)
initSentry(app);

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

// Sentry request handler (must be first middleware)
app.use(sentryRequestHandler());

// Sentry tracing handler (must be after request handler)
app.use(sentryTracingHandler());

// Prometheus metrics collection
app.use(metricsMiddleware());

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

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

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Documentation
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Farm Commons API Documentation',
    customfavIcon: '/favicon.ico',
  })
);

// OpenAPI JSON specification
app.get('/api/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Prometheus metrics endpoint
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', getMetricsContentType());
    const metrics = await getMetrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error);
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/equipment-assignments', equipmentAssignmentRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/time-approvals', timeApprovalRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api', soilDataRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/task-checklists', taskChecklistRoutes);

// Welcome message
app.get('/', (_req, res) => {
  res.json({
    name: 'Farm Commons API',
    version: '0.1.0',
    description: 'Shared farm management software, community owned. For the humans who feed us.',
    documentation: '/api/docs',
    openapi_spec: '/api/docs.json',
  });
});

// 404 handler
app.use(notFoundHandler);

// Sentry error handler (must be before other error handlers)
app.use(sentryErrorHandler());

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚜 Farm Commons API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`API Documentation: http://localhost:${PORT}/api/docs`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
