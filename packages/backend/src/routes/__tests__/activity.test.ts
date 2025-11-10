// Tests for activity feed generation

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { Knex } from 'knex';
import knex from 'knex';

// Test database configuration
const testDb: Knex = knex({
  client: 'pg',
  connection: {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: Number.parseInt(process.env.TEST_DB_PORT || '5432'),
    database: process.env.TEST_DB_NAME || 'farm_commons_test',
    user: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
  },
  pool: { min: 0, max: 10 },
});

describe('Activity Feed', () => {
  let farmId: string;
  let worker1Id: string;
  let worker2Id: string;
  let fieldId: string;

  beforeAll(async () => {
    // Run migrations
    try {
      await testDb.migrate.latest({
        directory: './src/db/migrations',
      });
    } catch (error) {
      // Migrations might already be run, continue
      console.log('Migration setup:', error);
    }
  });

  beforeEach(async () => {
    // Clean up test data
    await testDb('certifications').del();
    await testDb('time_entries').del();
    await testDb('schedules').del();
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

    // Create test workers
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

    [{ id: worker2Id }] = await testDb('workers')
      .insert({
        farm_id: farmId,
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '555-0002',
        hire_date: new Date('2024-01-15'),
        status: 'active',
        hourly_rate: 22,
      })
      .returning('id');

    // Create test field
    [{ id: fieldId }] = await testDb('fields')
      .insert({
        farm_id: farmId,
        name: 'North Field',
        size_acres: 25,
        current_crop: 'Tomatoes',
      })
      .returning('id');
  });

  afterAll(async () => {
    // Clean up and close connection
    await testDb('certifications').del();
    await testDb('time_entries').del();
    await testDb('schedules').del();
    await testDb('fields').del();
    await testDb('workers').del();
    await testDb('users').del();
    await testDb('farms').del();
    await testDb.destroy();
  });

  describe('Activity Generation', () => {
    it('should retrieve schedule activities', async () => {
      // Create a schedule
      const [schedule] = await testDb('schedules')
        .insert({
          farm_id: farmId,
          worker_id: worker1Id,
          field_id: fieldId,
          scheduled_date: new Date('2024-11-15'),
          start_time: '08:00',
          end_time: '17:00',
          task_type: 'Harvesting',
          status: 'scheduled',
        })
        .returning('*');

      // Query schedules like the activity endpoint does
      const schedules = await testDb('schedules')
        .where({ 'schedules.farm_id': farmId })
        .join('workers', 'schedules.worker_id', 'workers.id')
        .leftJoin('fields', 'schedules.field_id', 'fields.id')
        .select(
          'schedules.id',
          'schedules.created_at',
          'schedules.updated_at',
          'schedules.task_type',
          'schedules.status',
          'schedules.scheduled_date',
          'workers.first_name',
          'workers.last_name',
          'fields.name as field_name'
        )
        .orderBy('schedules.created_at', 'desc');

      expect(schedules.length).toBe(1);
      expect(schedules[0].task_type).toBe('Harvesting');
      expect(schedules[0].first_name).toBe('John');
      expect(schedules[0].last_name).toBe('Doe');
      expect(schedules[0].field_name).toBe('North Field');
    });

    it('should retrieve time entry activities', async () => {
      // Create time entries
      await testDb('time_entries').insert([
        {
          farm_id: farmId,
          worker_id: worker1Id,
          field_id: fieldId,
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T17:00:00'),
          total_hours: 8.5,
          task_type: 'Harvesting',
          break_minutes: 30,
        },
        {
          farm_id: farmId,
          worker_id: worker2Id,
          clock_in: new Date('2024-11-01T09:00:00'),
          clock_out: null, // Still clocked in
          task_type: 'Planting',
          break_minutes: 0,
        },
      ]);

      const timeEntries = await testDb('time_entries')
        .where({ 'time_entries.farm_id': farmId })
        .join('workers', 'time_entries.worker_id', 'workers.id')
        .leftJoin('fields', 'time_entries.field_id', 'fields.id')
        .select(
          'time_entries.id',
          'time_entries.created_at',
          'time_entries.clock_in',
          'time_entries.clock_out',
          'time_entries.task_type',
          'time_entries.total_hours',
          'workers.first_name',
          'workers.last_name',
          'fields.name as field_name'
        )
        .orderBy('time_entries.created_at', 'desc');

      expect(timeEntries.length).toBe(2);
      // Most recent first
      expect(timeEntries[0].first_name).toBe('Jane');
      expect(timeEntries[0].clock_out).toBeNull();
      expect(timeEntries[1].first_name).toBe('John');
      expect(timeEntries[1].total_hours).toBe('8.50');
    });

    it('should retrieve worker activities', async () => {
      // Workers were already created in beforeEach
      const workers = await testDb('workers')
        .where({ farm_id: farmId })
        .select('id', 'created_at', 'updated_at', 'first_name', 'last_name', 'status', 'hire_date')
        .orderBy('created_at', 'desc');

      expect(workers.length).toBe(2);
      // Most recent first (worker2 created after worker1)
      expect(workers[0].first_name).toBe('Jane');
      expect(workers[1].first_name).toBe('John');
    });

    it('should retrieve field activities', async () => {
      // Create an additional field
      await testDb('fields').insert({
        farm_id: farmId,
        name: 'South Field',
        size_acres: 30,
        current_crop: 'Lettuce',
      });

      const fields = await testDb('fields')
        .where({ farm_id: farmId })
        .select('id', 'created_at', 'updated_at', 'name', 'size_acres', 'current_crop')
        .orderBy('created_at', 'desc');

      expect(fields.length).toBe(2);
      // Most recent first
      expect(fields[0].name).toBe('South Field');
      expect(fields[1].name).toBe('North Field');
    });

    it('should retrieve certification activities', async () => {
      // Create certifications
      await testDb('certifications').insert([
        {
          worker_id: worker1Id,
          name: 'Pesticide Applicator',
          issuing_organization: 'State Agriculture Department',
          issue_date: new Date('2024-01-01'),
          expiration_date: new Date('2025-01-01'),
          verified: true,
        },
        {
          worker_id: worker2Id,
          name: 'Forklift Operator',
          issuing_organization: 'OSHA',
          issue_date: new Date('2024-02-01'),
          expiration_date: new Date('2027-02-01'),
          verified: false,
        },
      ]);

      const certifications = await testDb('certifications')
        .join('workers', 'certifications.worker_id', 'workers.id')
        .where({ 'workers.farm_id': farmId })
        .select(
          'certifications.id',
          'certifications.created_at',
          'certifications.updated_at',
          'certifications.name',
          'certifications.issuing_organization',
          'certifications.expiration_date',
          'certifications.verified',
          'workers.first_name',
          'workers.last_name'
        )
        .orderBy('certifications.created_at', 'desc');

      expect(certifications.length).toBe(2);
      // Most recent first
      expect(certifications[0].name).toBe('Forklift Operator');
      expect(certifications[0].verified).toBe(false);
      expect(certifications[1].name).toBe('Pesticide Applicator');
      expect(certifications[1].verified).toBe(true);
    });
  });

  describe('Activity Filtering', () => {
    beforeEach(async () => {
      // Create a mix of different activities
      await testDb('schedules').insert({
        farm_id: farmId,
        worker_id: worker1Id,
        field_id: fieldId,
        scheduled_date: new Date('2024-11-15'),
        start_time: '08:00',
        end_time: '17:00',
        task_type: 'Harvesting',
        status: 'scheduled',
      });

      await testDb('time_entries').insert({
        farm_id: farmId,
        worker_id: worker1Id,
        field_id: fieldId,
        clock_in: new Date('2024-11-01T08:00:00'),
        clock_out: new Date('2024-11-01T17:00:00'),
        total_hours: 8.5,
        task_type: 'Harvesting',
        break_minutes: 30,
      });

      await testDb('certifications').insert({
        worker_id: worker1Id,
        name: 'Pesticide Applicator',
        issuing_organization: 'State Agriculture Department',
        issue_date: new Date('2024-01-01'),
        expiration_date: new Date('2025-01-01'),
        verified: true,
      });
    });

    it('should filter schedules only', async () => {
      const schedules = await testDb('schedules')
        .where({ 'schedules.farm_id': farmId })
        .join('workers', 'schedules.worker_id', 'workers.id')
        .select('schedules.id', 'schedules.task_type', 'workers.first_name')
        .limit(50);

      expect(schedules.length).toBe(1);
      expect(schedules[0].task_type).toBe('Harvesting');
    });

    it('should filter time entries only', async () => {
      const timeEntries = await testDb('time_entries')
        .where({ 'time_entries.farm_id': farmId })
        .join('workers', 'time_entries.worker_id', 'workers.id')
        .select('time_entries.id', 'time_entries.task_type')
        .limit(50);

      expect(timeEntries.length).toBe(1);
      expect(timeEntries[0].task_type).toBe('Harvesting');
    });

    it('should filter certifications only', async () => {
      const certifications = await testDb('certifications')
        .join('workers', 'certifications.worker_id', 'workers.id')
        .where({ 'workers.farm_id': farmId })
        .select('certifications.id', 'certifications.name')
        .limit(50);

      expect(certifications.length).toBe(1);
      expect(certifications[0].name).toBe('Pesticide Applicator');
    });
  });

  describe('Activity Pagination', () => {
    beforeEach(async () => {
      // Create multiple schedules for pagination testing
      const schedules = [];
      for (let i = 0; i < 10; i++) {
        schedules.push({
          farm_id: farmId,
          worker_id: i % 2 === 0 ? worker1Id : worker2Id,
          field_id: fieldId,
          scheduled_date: new Date(`2024-11-${15 + i}`),
          start_time: '08:00',
          end_time: '17:00',
          task_type: `Task ${i}`,
          status: 'scheduled',
        });
      }
      await testDb('schedules').insert(schedules);
    });

    it('should respect limit parameter', async () => {
      const limit = 5;
      const schedules = await testDb('schedules')
        .where({ farm_id: farmId })
        .limit(limit)
        .orderBy('created_at', 'desc');

      expect(schedules.length).toBe(limit);
    });

    it('should respect offset parameter', async () => {
      const limit = 3;
      const offset = 2;

      // Get first batch
      const firstBatch = await testDb('schedules')
        .where({ farm_id: farmId })
        .limit(limit)
        .offset(0)
        .orderBy('created_at', 'desc')
        .select('task_type');

      // Get second batch with offset
      const secondBatch = await testDb('schedules')
        .where({ farm_id: farmId })
        .limit(limit)
        .offset(offset)
        .orderBy('created_at', 'desc')
        .select('task_type');

      // Should get different results
      expect(firstBatch[0].task_type).not.toBe(secondBatch[0].task_type);
      // Offset batch should start where first batch would have continued
      expect(secondBatch.length).toBe(limit);
    });

    it('should handle large offset gracefully', async () => {
      const schedules = await testDb('schedules')
        .where({ farm_id: farmId })
        .limit(10)
        .offset(100) // Offset beyond available data
        .orderBy('created_at', 'desc');

      expect(schedules.length).toBe(0);
    });
  });

  describe('Activity Ordering', () => {
    it('should order activities by timestamp descending', async () => {
      // Create activities at different times with explicit delays
      const [schedule1] = await testDb('schedules')
        .insert({
          farm_id: farmId,
          worker_id: worker1Id,
          scheduled_date: new Date('2024-11-15'),
          start_time: '08:00',
          end_time: '17:00',
          task_type: 'First Task',
          status: 'scheduled',
        })
        .returning('created_at');

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const [schedule2] = await testDb('schedules')
        .insert({
          farm_id: farmId,
          worker_id: worker2Id,
          scheduled_date: new Date('2024-11-16'),
          start_time: '08:00',
          end_time: '17:00',
          task_type: 'Second Task',
          status: 'scheduled',
        })
        .returning('created_at');

      await new Promise((resolve) => setTimeout(resolve, 10));

      const [schedule3] = await testDb('schedules')
        .insert({
          farm_id: farmId,
          worker_id: worker1Id,
          scheduled_date: new Date('2024-11-17'),
          start_time: '08:00',
          end_time: '17:00',
          task_type: 'Third Task',
          status: 'scheduled',
        })
        .returning('created_at');

      const schedules = await testDb('schedules')
        .where({ farm_id: farmId })
        .orderBy('created_at', 'desc')
        .select('task_type', 'created_at');

      expect(schedules.length).toBe(3);
      // Most recent should be first
      expect(schedules[0].task_type).toBe('Third Task');
      expect(schedules[1].task_type).toBe('Second Task');
      expect(schedules[2].task_type).toBe('First Task');

      // Verify timestamps are actually in descending order
      expect(new Date(schedules[0].created_at).getTime()).toBeGreaterThan(
        new Date(schedules[1].created_at).getTime()
      );
      expect(new Date(schedules[1].created_at).getTime()).toBeGreaterThan(
        new Date(schedules[2].created_at).getTime()
      );
    });
  });

  describe('Activity Metadata', () => {
    it('should include relevant metadata for schedules', async () => {
      const [schedule] = await testDb('schedules')
        .insert({
          farm_id: farmId,
          worker_id: worker1Id,
          field_id: fieldId,
          scheduled_date: new Date('2024-11-15'),
          start_time: '08:00',
          end_time: '17:00',
          task_type: 'Harvesting',
          task_description: 'Harvest tomatoes',
          status: 'scheduled',
        })
        .returning('*');

      expect(schedule.task_type).toBe('Harvesting');
      expect(schedule.status).toBe('scheduled');
      expect(schedule.scheduled_date).toBeDefined();
    });

    it('should include relevant metadata for time entries', async () => {
      const [timeEntry] = await testDb('time_entries')
        .insert({
          farm_id: farmId,
          worker_id: worker1Id,
          field_id: fieldId,
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T17:00:00'),
          total_hours: 8.5,
          task_type: 'Harvesting',
          break_minutes: 30,
        })
        .returning('*');

      expect(timeEntry.task_type).toBe('Harvesting');
      expect(timeEntry.total_hours).toBe('8.50');
      expect(timeEntry.clock_in).toBeDefined();
      expect(timeEntry.clock_out).toBeDefined();
    });

    it('should distinguish between create and update actions', async () => {
      // Create a schedule
      const [schedule] = await testDb('schedules')
        .insert({
          farm_id: farmId,
          worker_id: worker1Id,
          scheduled_date: new Date('2024-11-15'),
          start_time: '08:00',
          end_time: '17:00',
          task_type: 'Harvesting',
          status: 'scheduled',
        })
        .returning('*');

      // Initial timestamps should be equal (new record)
      expect(new Date(schedule.created_at).getTime()).toBe(
        new Date(schedule.updated_at).getTime()
      );

      // Update the schedule
      await new Promise((resolve) => setTimeout(resolve, 10));
      const [updated] = await testDb('schedules')
        .where({ id: schedule.id })
        .update({ status: 'completed' })
        .returning('*');

      // After update, updated_at should be different from created_at
      expect(new Date(updated.updated_at).getTime()).toBeGreaterThan(
        new Date(updated.created_at).getTime()
      );
    });
  });
});
