// WebSocket Integration Tests

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer, Server as HTTPServer } from 'http';
import { io as ioClient, Socket } from 'socket.io-client';
import { initializeWebSocket } from '../index.js';
import type { WebSocketServer } from '../index.js';

describe('WebSocket Integration', () => {
  let httpServer: HTTPServer;
  let wsServer: WebSocketServer;
  let clientSocket: Socket;
  const PORT = 3002; // Test port

  beforeEach((done) => {
    // Create HTTP server
    httpServer = createServer();

    // Initialize WebSocket
    wsServer = initializeWebSocket(httpServer);

    // Start server
    httpServer.listen(PORT, () => {
      done();
    });
  });

  afterEach((done) => {
    // Close client socket if open
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }

    // Close WebSocket server
    wsServer.io.close(() => {
      // Close HTTP server
      httpServer.close(() => {
        done();
      });
    });
  });

  describe('Dashboard Namespace', () => {
    it('should connect to dashboard namespace', (done) => {
      clientSocket = ioClient(`http://localhost:${PORT}/dashboard`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should receive active workers update', (done) => {
      clientSocket = ioClient(`http://localhost:${PORT}/dashboard`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        // Emit event from server
        wsServer.emitDashboardEvent('active-workers:update', {
          count: 5,
          timestamp: new Date().toISOString(),
        });
      });

      clientSocket.on('active-workers:update', (data) => {
        expect(data.count).toBe(5);
        expect(data.timestamp).toBeDefined();
        done();
      });
    });

    it('should receive time entry change event', (done) => {
      clientSocket = ioClient(`http://localhost:${PORT}/dashboard`, {
        transports: ['websocket'],
      });

      const testEvent = {
        type: 'clock_in',
        entry: { id: 'test-entry' },
        worker: {
          id: 'worker-123',
          first_name: 'John',
          last_name: 'Doe',
        },
        timestamp: new Date().toISOString(),
      };

      clientSocket.on('connect', () => {
        // Emit event from server
        wsServer.emitDashboardEvent('time-entry:change', testEvent);
      });

      clientSocket.on('time-entry:change', (data) => {
        expect(data.type).toBe('clock_in');
        expect(data.worker.first_name).toBe('John');
        done();
      });
    });

    it('should handle multiple concurrent connections', (done) => {
      const client1 = ioClient(`http://localhost:${PORT}/dashboard`, {
        transports: ['websocket'],
      });

      const client2 = ioClient(`http://localhost:${PORT}/dashboard`, {
        transports: ['websocket'],
      });

      let connectedCount = 0;

      const checkBothConnected = () => {
        connectedCount++;
        if (connectedCount === 2) {
          expect(client1.connected).toBe(true);
          expect(client2.connected).toBe(true);
          client1.disconnect();
          client2.disconnect();
          done();
        }
      };

      client1.on('connect', checkBothConnected);
      client2.on('connect', checkBothConnected);
    });
  });

  describe('CORS Configuration', () => {
    it('should allow connections with proper CORS settings', (done) => {
      clientSocket = ioClient(`http://localhost:${PORT}/dashboard`, {
        transports: ['websocket'],
        withCredentials: true,
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });
  });
});
