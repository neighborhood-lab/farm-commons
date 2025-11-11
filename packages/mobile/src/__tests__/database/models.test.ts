/**
 * Model Tests
 * Tests for WatermelonDB model classes
 *
 * Note: These are unit tests for model logic.
 * Integration tests with actual database would require a test database setup.
 */

import Worker from '../../database/models/Worker';
import TimeEntry from '../../database/models/TimeEntry';
import Certification from '../../database/models/Certification';
import SyncQueue from '../../database/models/SyncQueue';

describe('Worker Model', () => {
  describe('JSON field parsing', () => {
    it('should parse certifications JSON array', () => {
      const worker = new Worker(
        { schema: { name: 'workers', columns: [] } } as any,
        []
      );
      (worker as any)._certificationsJson = '["Tractor License", "First Aid"]';

      expect(worker.certifications).toEqual(['Tractor License', 'First Aid']);
    });

    it('should handle empty certifications', () => {
      const worker = new Worker(
        { schema: { name: 'workers', columns: [] } } as any,
        []
      );
      (worker as any)._certificationsJson = '[]';

      expect(worker.certifications).toEqual([]);
    });

    it('should handle invalid JSON gracefully', () => {
      const worker = new Worker(
        { schema: { name: 'workers', columns: [] } } as any,
        []
      );
      (worker as any)._certificationsJson = 'invalid json';

      expect(worker.certifications).toEqual([]);
    });

    it('should parse skills JSON array', () => {
      const worker = new Worker(
        { schema: { name: 'workers', columns: [] } } as any,
        []
      );
      (worker as any)._skillsJson = '["Planting", "Harvesting", "Equipment"]';

      expect(worker.skills).toEqual(['Planting', 'Harvesting', 'Equipment']);
    });
  });

  describe('computed properties', () => {
    it('should generate full name', () => {
      const worker = new Worker(
        { schema: { name: 'workers', columns: [] } } as any,
        []
      );
      (worker as any).firstName = 'John';
      (worker as any).lastName = 'Doe';

      expect(worker.fullName).toBe('John Doe');
    });
  });
});

describe('TimeEntry Model', () => {
  describe('computed properties', () => {
    it('should detect active time entries', () => {
      const timeEntry = new TimeEntry(
        { schema: { name: 'time_entries', columns: [] } } as any,
        []
      );
      (timeEntry as any).clockIn = new Date('2024-01-01T08:00:00');
      (timeEntry as any).clockOut = undefined;

      expect(timeEntry.isActive).toBe(true);
    });

    it('should detect completed time entries', () => {
      const timeEntry = new TimeEntry(
        { schema: { name: 'time_entries', columns: [] } } as any,
        []
      );
      (timeEntry as any).clockIn = new Date('2024-01-01T08:00:00');
      (timeEntry as any).clockOut = new Date('2024-01-01T17:00:00');

      expect(timeEntry.isActive).toBe(false);
    });

    it('should calculate elapsed hours for completed entries', () => {
      const timeEntry = new TimeEntry(
        { schema: { name: 'time_entries', columns: [] } } as any,
        []
      );
      (timeEntry as any).clockIn = new Date('2024-01-01T08:00:00');
      (timeEntry as any).clockOut = new Date('2024-01-01T17:00:00');
      (timeEntry as any).breakMinutes = 60;
      (timeEntry as any).totalHours = 8;

      expect(timeEntry.elapsedHours).toBe(8);
    });

    it('should calculate elapsed hours for active entries', () => {
      const timeEntry = new TimeEntry(
        { schema: { name: 'time_entries', columns: [] } } as any,
        []
      );
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      (timeEntry as any).clockIn = twoHoursAgo;
      (timeEntry as any).clockOut = undefined;
      (timeEntry as any).breakMinutes = 0;

      const elapsed = timeEntry.elapsedHours;
      expect(elapsed).toBeGreaterThan(1.9);
      expect(elapsed).toBeLessThan(2.1);
    });
  });
});

describe('Certification Model', () => {
  describe('expiration logic', () => {
    it('should detect expired certifications', () => {
      const cert = new Certification(
        { schema: { name: 'certifications', columns: [] } } as any,
        []
      );
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      (cert as any).expirationDate = yesterday;

      expect(cert.isExpired).toBe(true);
    });

    it('should detect non-expired certifications', () => {
      const cert = new Certification(
        { schema: { name: 'certifications', columns: [] } } as any,
        []
      );
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      (cert as any).expirationDate = tomorrow;

      expect(cert.isExpired).toBe(false);
    });

    it('should detect certifications expiring soon', () => {
      const cert = new Certification(
        { schema: { name: 'certifications', columns: [] } } as any,
        []
      );
      const in20Days = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
      (cert as any).expirationDate = in20Days;

      expect(cert.isExpiringSoon).toBe(true);
    });

    it('should not flag certifications expiring in 31+ days', () => {
      const cert = new Certification(
        { schema: { name: 'certifications', columns: [] } } as any,
        []
      );
      const in35Days = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000);
      (cert as any).expirationDate = in35Days;

      expect(cert.isExpiringSoon).toBe(false);
    });

    it('should calculate days until expiry', () => {
      const cert = new Certification(
        { schema: { name: 'certifications', columns: [] } } as any,
        []
      );
      const in10Days = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      (cert as any).expirationDate = in10Days;

      const days = cert.daysUntilExpiry;
      expect(days).toBeGreaterThan(9);
      expect(days).toBeLessThan(11);
    });

    it('should handle certifications with no expiration', () => {
      const cert = new Certification(
        { schema: { name: 'certifications', columns: [] } } as any,
        []
      );
      (cert as any).expirationDate = undefined;

      expect(cert.isExpired).toBe(false);
      expect(cert.isExpiringSoon).toBe(false);
      expect(cert.daysUntilExpiry).toBe(Infinity);
    });
  });
});

describe('SyncQueue Model', () => {
  describe('retry logic', () => {
    it('should allow retry when count is low', () => {
      const syncItem = new SyncQueue(
        { schema: { name: 'sync_queue', columns: [] } } as any,
        []
      );
      (syncItem as any).synced = false;
      (syncItem as any).retryCount = 2;

      expect(syncItem.shouldRetry).toBe(true);
    });

    it('should prevent retry when max attempts reached', () => {
      const syncItem = new SyncQueue(
        { schema: { name: 'sync_queue', columns: [] } } as any,
        []
      );
      (syncItem as any).synced = false;
      (syncItem as any).retryCount = 5;

      expect(syncItem.shouldRetry).toBe(false);
    });

    it('should prevent retry when already synced', () => {
      const syncItem = new SyncQueue(
        { schema: { name: 'sync_queue', columns: [] } } as any,
        []
      );
      (syncItem as any).synced = true;
      (syncItem as any).retryCount = 2;

      expect(syncItem.shouldRetry).toBe(false);
    });
  });

  describe('backoff delay', () => {
    it('should calculate exponential backoff', () => {
      const syncItem = new SyncQueue(
        { schema: { name: 'sync_queue', columns: [] } } as any,
        []
      );

      (syncItem as any).retryCount = 0;
      expect(syncItem.backoffDelay).toBe(1000); // 1 second

      (syncItem as any).retryCount = 1;
      expect(syncItem.backoffDelay).toBe(2000); // 2 seconds

      (syncItem as any).retryCount = 2;
      expect(syncItem.backoffDelay).toBe(4000); // 4 seconds

      (syncItem as any).retryCount = 3;
      expect(syncItem.backoffDelay).toBe(8000); // 8 seconds

      (syncItem as any).retryCount = 4;
      expect(syncItem.backoffDelay).toBe(16000); // 16 seconds (max)

      (syncItem as any).retryCount = 10;
      expect(syncItem.backoffDelay).toBe(16000); // Still capped at 16 seconds
    });
  });

  describe('data parsing', () => {
    it('should parse JSON data', () => {
      const syncItem = new SyncQueue(
        { schema: { name: 'sync_queue', columns: [] } } as any,
        []
      );
      const testData = { id: '123', name: 'Test' };
      (syncItem as any)._dataJson = JSON.stringify(testData);

      expect(syncItem.data).toEqual(testData);
    });

    it('should handle invalid JSON', () => {
      const syncItem = new SyncQueue(
        { schema: { name: 'sync_queue', columns: [] } } as any,
        []
      );
      (syncItem as any)._dataJson = 'invalid json';

      expect(syncItem.data).toBeNull();
    });
  });
});
