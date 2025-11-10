// Monitoring Module Tests
// Tests for error tracking and metrics collection

import { describe, it, expect } from 'vitest';
import {
  recordError,
  recordDbQuery,
  setDbConnections,
  getMetrics,
} from '../prometheus';
import {
  recordWorkerCheckIn,
  recordWorkerCheckOut,
  recordScheduleCreated,
  recordTimeEntry,
  recordLaborHours,
  setWorkersClockedIn,
  setScheduleMetrics,
} from '../businessMetrics';

describe('Prometheus Metrics', () => {
  describe('Error Metrics', () => {
    it('should record errors', () => {
      expect(() => {
        recordError('TestError', '/api/test');
      }).not.toThrow();
    });
  });

  describe('Database Metrics', () => {
    it('should record database query duration', () => {
      expect(() => {
        recordDbQuery('SELECT', 'workers', 45);
      }).not.toThrow();
    });

    it('should set database connection metrics', () => {
      expect(() => {
        setDbConnections(5, 10);
      }).not.toThrow();
    });
  });

  describe('Metrics Export', () => {
    it('should export metrics in Prometheus format', async () => {
      // Record some metrics
      recordError('TestError', '/test');
      recordDbQuery('SELECT', 'workers', 100);

      const metrics = await getMetrics();

      expect(metrics).toBeTruthy();
      expect(typeof metrics).toBe('string');
      expect(metrics).toContain('farm_commons_');
    });
  });
});

describe('Business Metrics', () => {
  describe('Worker Metrics', () => {
    it('should record worker check-in', () => {
      expect(() => {
        recordWorkerCheckIn('worker-123');
      }).not.toThrow();
    });

    it('should record worker check-out', () => {
      expect(() => {
        recordWorkerCheckOut('worker-123');
      }).not.toThrow();
    });

    it('should set workers clocked in count', () => {
      expect(() => {
        setWorkersClockedIn(15);
      }).not.toThrow();
    });
  });

  describe('Schedule Metrics', () => {
    it('should record schedule creation', () => {
      expect(() => {
        recordScheduleCreated();
      }).not.toThrow();
    });

    it('should set schedule metrics', () => {
      expect(() => {
        setScheduleMetrics(100, 80, 20, 30);
      }).not.toThrow();
    });
  });

  describe('Time Entry Metrics', () => {
    it('should record time entry', () => {
      expect(() => {
        recordTimeEntry('clock_in');
      }).not.toThrow();
    });

    it('should record labor hours', () => {
      expect(() => {
        recordLaborHours('worker-123', 'harvesting', 8);
      }).not.toThrow();
    });
  });

  describe('Integration Test', () => {
    it('should track complete worker workflow', async () => {
      // Simulate a worker's day
      recordWorkerCheckIn('worker-123');
      setWorkersClockedIn(1);

      recordScheduleCreated();
      recordTimeEntry('clock_in');

      recordLaborHours('worker-123', 'planting', 4);
      recordLaborHours('worker-123', 'harvesting', 4);

      recordTimeEntry('clock_out');
      recordWorkerCheckOut('worker-123');
      setWorkersClockedIn(0);

      // Verify metrics were recorded
      const metrics = await getMetrics();

      expect(metrics).toContain('farm_commons_worker_check_ins_total');
      expect(metrics).toContain('farm_commons_worker_check_outs_total');
      expect(metrics).toContain('farm_commons_labor_hours_total');
    });
  });
});

describe('Monitoring Integration', () => {
  it('should collect all metric types', async () => {
    const metrics = await getMetrics();

    // Check for system metrics
    expect(metrics).toContain('farm_commons_process_');

    // Check for HTTP metrics
    expect(metrics).toContain('farm_commons_http_');

    // Check for error metrics
    expect(metrics).toContain('farm_commons_errors_total');

    // Check for database metrics
    expect(metrics).toContain('farm_commons_db_');

    // Check for business metrics
    expect(metrics).toContain('farm_commons_workers_');
    expect(metrics).toContain('farm_commons_schedules_');
    expect(metrics).toContain('farm_commons_time_entries_');
  });
});
