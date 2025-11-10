// WebSocket Server Setup

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import pino from 'pino';
import { setupDashboardNamespace } from './dashboard.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

export interface WebSocketServer {
  io: SocketIOServer;
  emitDashboardEvent: (event: string, data: any) => void;
}

/**
 * Initialize WebSocket server and attach to HTTP server
 */
export function initializeWebSocket(httpServer: HTTPServer): WebSocketServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  logger.info('WebSocket server initialized');

  // Setup namespaces
  const dashboardNamespace = setupDashboardNamespace(io);

  // Helper function to emit events to dashboard
  const emitDashboardEvent = (event: string, data: any) => {
    dashboardNamespace.emit(event, data);
    logger.debug({ event, data }, 'Dashboard event emitted');
  };

  // Global error handling
  io.on('error', (error) => {
    logger.error({ error }, 'WebSocket server error');
  });

  return {
    io,
    emitDashboardEvent,
  };
}

export default initializeWebSocket;
