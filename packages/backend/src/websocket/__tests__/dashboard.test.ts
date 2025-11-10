// Dashboard WebSocket Handler Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import {
  setupDashboardNamespace,
  getActiveWorkersCount,
  broadcastTimeEntryChange,
  broadcastActiveWorkersUpdate,
} from '../dashboard.js';

// Mock database
vi.mock('../../db/connection.js', () => ({
  default: vi.fn(() => ({
    where: vi.fn().mockReturnThis(),
    whereNull: vi.fn().mockReturnThis(),
    count: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue({ count: 5 }),
  })),
}));

describe('Dashboard WebSocket Handler', () => {
  let io: SocketIOServer;
  let httpServer: HTTPServer;

  beforeEach(() => {
    // Create a mock HTTP server
    httpServer = {
      listen: vi.fn(),
      close: vi.fn(),
    } as any;

    // Create Socket.IO server
    io = new SocketIOServer(httpServer);
  });

  describe('setupDashboardNamespace', () => {
    it('should create dashboard namespace', () => {
      const namespace = setupDashboardNamespace(io);
      expect(namespace).toBeDefined();
      expect(namespace.name).toBe('/dashboard');
    });

    it('should handle connection events', () => {
      const namespace = setupDashboardNamespace(io);
      expect(namespace.listeners('connection')).toHaveLength(1);
    });
  });

  describe('getActiveWorkersCount', () => {
    it('should return count of active workers', async () => {
      const farmId = 'farm-123';
      const count = await getActiveWorkersCount(farmId);
      expect(count).toBe(5);
    });

    it('should return 0 if no active workers', async () => {
      const db = await import('../../db/connection.js');
      vi.mocked(db.default).mockReturnValueOnce({
        where: vi.fn().mockReturnThis(),
        whereNull: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ count: 0 }),
      } as any);

      const farmId = 'farm-123';
      const count = await getActiveWorkersCount(farmId);
      expect(count).toBe(0);
    });
  });

  describe('broadcastTimeEntryChange', () => {
    it('should emit time entry change event', () => {
      const namespace = setupDashboardNamespace(io);
      const emitSpy = vi.spyOn(namespace, 'emit');

      const event = {
        type: 'clock_in' as const,
        entry: { id: 'entry-123' },
        worker: {
          id: 'worker-123',
          first_name: 'John',
          last_name: 'Doe',
        },
        timestamp: new Date().toISOString(),
      };

      broadcastTimeEntryChange(namespace, event);
      expect(emitSpy).toHaveBeenCalledWith('time-entry:change', event);
    });
  });

  describe('broadcastActiveWorkersUpdate', () => {
    it('should emit active workers update event', () => {
      const namespace = setupDashboardNamespace(io);
      const emitSpy = vi.spyOn(namespace, 'emit');

      const data = {
        count: 10,
        timestamp: new Date().toISOString(),
      };

      broadcastActiveWorkersUpdate(namespace, data);
      expect(emitSpy).toHaveBeenCalledWith('active-workers:update', data);
    });
  });
});
