// Dashboard WebSocket Handler
// Provides real-time updates for dashboard data

import { Server as SocketIOServer, Namespace } from 'socket.io';
import pino from 'pino';
import db from '../db/connection.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

export interface TimeEntryEvent {
  type: 'clock_in' | 'clock_out' | 'update';
  entry: any;
  worker: {
    id: string;
    first_name: string;
    last_name: string;
  };
  timestamp: string;
}

export interface ActiveWorkersCount {
  count: number;
  timestamp: string;
}

/**
 * Setup dashboard namespace for real-time updates
 */
export function setupDashboardNamespace(io: SocketIOServer): Namespace {
  const dashboard = io.of('/dashboard');

  dashboard.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Dashboard client connected');

    // Send initial data on connection
    socket.on('request:active-workers', async (farmId: string) => {
      try {
        const count = await getActiveWorkersCount(farmId);
        socket.emit('active-workers:update', {
          count,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error({ error, farmId }, 'Error fetching active workers count');
        socket.emit('error', {
          message: 'Failed to fetch active workers count',
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, reason }, 'Dashboard client disconnected');
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error({ error, socketId: socket.id }, 'Dashboard socket error');
    });
  });

  return dashboard;
}

/**
 * Get count of currently clocked-in workers
 */
export async function getActiveWorkersCount(farmId: string): Promise<number> {
  const result = await db('time_entries')
    .where({ farm_id: farmId })
    .whereNull('clock_out')
    .count('* as count')
    .first();

  return parseInt(result?.count?.toString() || '0', 10);
}

/**
 * Broadcast time entry change to dashboard clients
 */
export function broadcastTimeEntryChange(
  namespace: Namespace,
  event: TimeEntryEvent
): void {
  namespace.emit('time-entry:change', event);
  logger.debug({ event }, 'Time entry change broadcasted');
}

/**
 * Broadcast active workers count update
 */
export function broadcastActiveWorkersUpdate(
  namespace: Namespace,
  data: ActiveWorkersCount
): void {
  namespace.emit('active-workers:update', data);
  logger.debug({ data }, 'Active workers count broadcasted');
}

export default setupDashboardNamespace;
