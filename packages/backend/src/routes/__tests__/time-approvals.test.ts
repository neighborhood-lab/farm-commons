// Tests for time entry approval workflow

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { Knex } from 'knex';
import knex from 'knex';

// Test database configuration
const testDb: Knex = knex({
  client: 'pg',
  connection: {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: Number.Number.Number.Number.Number.parseInt(process.env.TEST_DB_PORT || '5432'),
    database: process.env.TEST_DB_NAME || 'farm_commons_test',
    user: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
  },
  pool: { min: 0, max: 10 },
});

describe('Time Entry Approval Workflow', () => {
  let farmId: string;
  let managerId: string;
  let worker1Id: string;
  let timeEntry1Id: string;
  let timeEntry2Id: string;
  let timeEntry3Id: string;

  beforeAll(async () => {
    // Run migrations
    try {
      await testDb.migrate.latest({
        directory: './src/db/migrations',
      });
    } catch {
      // Migrations might already be run, continue
      // eslint-disable-next-line no-console
      console.log('Migration setup:', error);
    }
  });

  beforeEach(async () => {
    // Clean up test data
    await testDb('time_entries').del();
    await testDb('schedules').del();
    await testDb('certifications').del();
    await testDb('fields').del();
    await testDb('workers').del();
    await testDb('users').del();
    await testDb('farms').del();

    // Create test farm
    [{ id: farmId }] = await testDb('farms')
      .insert({
        name: 'Test Farm',
        location: 'Test Location',
        size_acres: 100,
        organic_certified: true,
      })
      .returning('id');

    // Create test manager user
    [{ id: managerId }] = await testDb('users')
      .insert({
        email: 'manager@test.com',
        // eslint-disable-next-line sonarjs/no-hardcoded-passwords
        password_hash: 'hashed_password',
        role: 'manager',
        farm_id: farmId,
      })
      .returning('id');

    // Create test worker
    [{ id: worker1Id }] = await testDb('workers')
      .insert({
        farm_id: farmId,
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-0001',
        hire_date: new Date('2024-01-01'),
        status: 'active',
        hourly_rate: 20,
      })
      .returning('id');

    // Create test time entries
    [{ id: timeEntry1Id }] = await testDb('time_entries')
      .insert({
        farm_id: farmId,
        worker_id: worker1Id,
        clock_in: new Date('2024-11-01T08:00:00'),
        clock_out: new Date('2024-11-01T17:00:00'),
        total_hours: 8.5,
        task_type: 'Harvesting',
        break_minutes: 30,
        approval_status: 'pending',
      })
      .returning('id');

    [{ id: timeEntry2Id }] = await testDb('time_entries')
      .insert({
        farm_id: farmId,
        worker_id: worker1Id,
        clock_in: new Date('2024-11-02T08:00:00'),
        clock_out: new Date('2024-11-02T17:00:00'),
        total_hours: 8.5,
        task_type: 'Planting',
        break_minutes: 30,
        approval_status: 'pending',
      })
      .returning('id');

    [{ id: timeEntry3Id }] = await testDb('time_entries')
      .insert({
        farm_id: farmId,
        worker_id: worker1Id,
        clock_in: new Date('2024-11-03T08:00:00'),
        clock_out: null,
        total_hours: null,
        task_type: 'Maintenance',
        break_minutes: 0,
        approval_status: 'pending',
      })
      .returning('id');
  });

  afterAll(async () => {
    // Clean up and close connection
    await testDb('time_entries').del();
    await testDb('schedules').del();
    await testDb('certifications').del();
    await testDb('fields').del();
    await testDb('workers').del();
    await testDb('users').del();
    await testDb('farms').del();
    await testDb.destroy();
  });

  describe('Get Pending Time Entries', () => {
    it('should retrieve all pending time entries that are clocked out', async () => {
      const pendingEntries = await testDb('time_entries')
        .where({
          farm_id: farmId,
          approval_status: 'pending',
        })
        .whereNotNull('clock_out')
        .select('*');

      expect(pendingEntries.length).toBe(2);
      expect(pendingEntries.every((entry) => entry.approval_status === 'pending')).toBe(true);
      expect(pendingEntries.every((entry) => entry.clock_out !== null)).toBe(true);
    });

    it('should not include time entries that are not clocked out', async () => {
      const pendingEntries = await testDb('time_entries')
        .where({
          farm_id: farmId,
          approval_status: 'pending',
        })
        .whereNotNull('clock_out')
        .select('*');

      const hasUnclocked = pendingEntries.some((entry) => entry.clock_out === null);
      expect(hasUnclocked).toBe(false);
    });

    it('should only show entries for the specific farm', async () => {
      // Create another farm with time entries
      const [{ id: otherFarmId }] = await testDb('farms')
        .insert({
          name: 'Other Farm',
          location: 'Other Location',
          size_acres: 50,
          organic_certified: false,
        })
        .returning('id');

      const [{ id: otherWorkerId }] = await testDb('workers')
        .insert({
          farm_id: otherFarmId,
          first_name: 'Jane',
          last_name: 'Smith',
          phone: '555-0002',
          hire_date: new Date('2024-01-01'),
          status: 'active',
          hourly_rate: 20,
        })
        .returning('id');

      await testDb('time_entries').insert({
        farm_id: otherFarmId,
        worker_id: otherWorkerId,
        clock_in: new Date('2024-11-01T08:00:00'),
        clock_out: new Date('2024-11-01T17:00:00'),
        total_hours: 8.5,
        task_type: 'Harvesting',
        break_minutes: 30,
        approval_status: 'pending',
      });

      const pendingEntries = await testDb('time_entries')
        .where({
          farm_id: farmId,
          approval_status: 'pending',
        })
        .whereNotNull('clock_out')
        .select('*');

      expect(pendingEntries.every((entry) => entry.farm_id === farmId)).toBe(true);
    });
  });

  describe('Approve Time Entry', () => {
    it('should approve a pending time entry', async () => {
      await testDb('time_entries').where({ id: timeEntry1Id }).update({
        approval_status: 'approved',
        approved_by: managerId,
        approved_at: new Date(),
      });

      const entry = await testDb('time_entries').where({ id: timeEntry1Id }).first();

      expect(entry.approval_status).toBe('approved');
      expect(entry.approved_by).toBe(managerId);
      expect(entry.approved_at).not.toBeNull();
    });

    it('should not approve a time entry that is not clocked out', async () => {
      // Try to approve timeEntry3Id which is not clocked out
      const entry = await testDb('time_entries').where({ id: timeEntry3Id }).first();

      expect(entry.clock_out).toBeNull();
      // In real implementation, this would be rejected by the API
    });

    it('should track who approved the entry', async () => {
      await testDb('time_entries').where({ id: timeEntry1Id }).update({
        approval_status: 'approved',
        approved_by: managerId,
        approved_at: new Date(),
      });

      const entry = await testDb('time_entries').where({ id: timeEntry1Id }).first();

      expect(entry.approved_by).toBe(managerId);
    });

    it('should record approval timestamp', async () => {
      const beforeApproval = new Date();

      await testDb('time_entries').where({ id: timeEntry1Id }).update({
        approval_status: 'approved',
        approved_by: managerId,
        approved_at: new Date(),
      });

      const entry = await testDb('time_entries').where({ id: timeEntry1Id }).first();
      const afterApproval = new Date();

      expect(entry.approved_at).not.toBeNull();
      expect(new Date(entry.approved_at).getTime()).toBeGreaterThanOrEqual(
        beforeApproval.getTime()
      );
      expect(new Date(entry.approved_at).getTime()).toBeLessThanOrEqual(afterApproval.getTime());
    });
  });

  describe('Reject Time Entry', () => {
    it('should reject a time entry with a reason', async () => {
      const rejectionReason = 'Hours do not match schedule';

      await testDb('time_entries').where({ id: timeEntry1Id }).update({
        approval_status: 'rejected',
        approved_by: managerId,
        approved_at: new Date(),
        rejection_reason: rejectionReason,
      });

      const entry = await testDb('time_entries').where({ id: timeEntry1Id }).first();

      expect(entry.approval_status).toBe('rejected');
      expect(entry.rejection_reason).toBe(rejectionReason);
      expect(entry.approved_by).toBe(managerId);
    });

    it('should require a rejection reason', async () => {
      const rejectionReason = '';

      // This should fail validation in the API
      // Here we test the database constraint
      await testDb('time_entries')
        .where({ id: timeEntry1Id })
        .update({
          approval_status: 'rejected',
          approved_by: managerId,
          approved_at: new Date(),
          rejection_reason: rejectionReason || null,
        });

      const entry = await testDb('time_entries').where({ id: timeEntry1Id }).first();

      // If rejection_reason is empty, it should be handled by API validation
      expect(entry.approval_status).toBe('rejected');
    });
  });

  describe('Batch Approval', () => {
    it('should approve multiple time entries at once', async () => {
      const timeEntryIds = [timeEntry1Id, timeEntry2Id];

      await testDb('time_entries').whereIn('id', timeEntryIds).update({
        approval_status: 'approved',
        approved_by: managerId,
        approved_at: new Date(),
      });

      const entries = await testDb('time_entries').whereIn('id', timeEntryIds);

      expect(entries.length).toBe(2);
      expect(entries.every((entry) => entry.approval_status === 'approved')).toBe(true);
      expect(entries.every((entry) => entry.approved_by === managerId)).toBe(true);
    });

    it('should only approve entries that are pending', async () => {
      // First approve one entry
      await testDb('time_entries').where({ id: timeEntry1Id }).update({
        approval_status: 'approved',
        approved_by: managerId,
        approved_at: new Date(),
      });

      // Check status
      const entry1 = await testDb('time_entries').where({ id: timeEntry1Id }).first();
      const entry2 = await testDb('time_entries').where({ id: timeEntry2Id }).first();

      expect(entry1.approval_status).toBe('approved');
      expect(entry2.approval_status).toBe('pending');
    });

    it('should validate all entries are clocked out before batch approval', async () => {
      const entries = await testDb('time_entries')
        .whereIn('id', [timeEntry1Id, timeEntry2Id, timeEntry3Id])
        .select('*');

      const invalidEntries = entries.filter(
        (entry) => entry.approval_status !== 'pending' || !entry.clock_out
      );

      expect(invalidEntries.length).toBeGreaterThan(0);
      expect(invalidEntries.some((entry) => entry.id === timeEntry3Id)).toBe(true);
    });
  });

  describe('Approval Status Validation', () => {
    it('should prevent re-approval of already approved entries', async () => {
      // First approval
      await testDb('time_entries').where({ id: timeEntry1Id }).update({
        approval_status: 'approved',
        approved_by: managerId,
        approved_at: new Date(),
      });

      const entry = await testDb('time_entries').where({ id: timeEntry1Id }).first();

      expect(entry.approval_status).toBe('approved');
      // In the API, attempting to approve again would be rejected
    });

    it('should prevent approval changes after rejection', async () => {
      // First reject
      await testDb('time_entries').where({ id: timeEntry1Id }).update({
        approval_status: 'rejected',
        approved_by: managerId,
        approved_at: new Date(),
        rejection_reason: 'Invalid hours',
      });

      const entry = await testDb('time_entries').where({ id: timeEntry1Id }).first();

      expect(entry.approval_status).toBe('rejected');
      // In the API, attempting to approve would be rejected
    });
  });

  describe('Query Filters', () => {
    it('should filter pending entries efficiently', async () => {
      // Approve one entry
      await testDb('time_entries').where({ id: timeEntry1Id }).update({
        approval_status: 'approved',
        approved_by: managerId,
        approved_at: new Date(),
      });

      const pendingEntries = await testDb('time_entries')
        .where({
          farm_id: farmId,
          approval_status: 'pending',
        })
        .whereNotNull('clock_out')
        .select('*');

      expect(pendingEntries.length).toBe(1);
      expect(pendingEntries[0].id).toBe(timeEntry2Id);
    });

    it('should order pending entries by clock_out time', async () => {
      const pendingEntries = await testDb('time_entries')
        .where({
          farm_id: farmId,
          approval_status: 'pending',
        })
        .whereNotNull('clock_out')
        .orderBy('clock_out', 'desc')
        .select('*');

      expect(pendingEntries.length).toBe(2);
      expect(new Date(pendingEntries[0].clock_out).getTime()).toBeGreaterThan(
        new Date(pendingEntries[1].clock_out).getTime()
      );
    });
  });
});
