// Queue Configuration Tests

import { describe, it, expect } from 'vitest';
import { redisConnection, defaultJobOptions, QueueNames } from '../config.js';

describe('Queue Configuration', () => {
  describe('Redis Connection', () => {
    it('should have valid Redis connection configuration', () => {
      expect(redisConnection).toBeDefined();
      expect(redisConnection.host).toBeDefined();
      expect(redisConnection.port).toBeDefined();
      expect(typeof redisConnection.port).toBe('number');
      expect(redisConnection.maxRetriesPerRequest).toBe(null);
      expect(redisConnection.enableReadyCheck).toBe(false);
    });

    it('should use default Redis host and port if env vars not set', () => {
      expect(redisConnection.host).toBeTruthy();
      expect(redisConnection.port).toBeGreaterThan(0);
    });
  });

  describe('Default Job Options', () => {
    it('should have correct retry configuration', () => {
      expect(defaultJobOptions.attempts).toBe(3);
      expect(defaultJobOptions.backoff).toEqual({
        type: 'exponential',
        delay: 2000,
      });
    });

    it('should have correct job retention settings', () => {
      expect(defaultJobOptions.removeOnComplete).toEqual({
        age: 86400, // 24 hours
        count: 1000,
      });
      expect(defaultJobOptions.removeOnFail).toEqual({
        age: 604800, // 7 days
      });
    });
  });

  describe('Queue Names', () => {
    it('should define all required queue names', () => {
      expect(QueueNames.NOTIFICATIONS).toBe('notifications');
      expect(QueueNames.DATA_CLEANUP).toBe('data-cleanup');
      expect(QueueNames.EXPORTS).toBe('exports');
      expect(QueueNames.EMAILS).toBe('emails');
    });

    it('should have unique queue names', () => {
      const names = Object.values(QueueNames);
      const uniqueNames = new Set(names);
      expect(names.length).toBe(uniqueNames.size);
    });
  });
});
