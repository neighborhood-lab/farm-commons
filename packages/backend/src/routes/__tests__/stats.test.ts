// Tests for statistics calculation logic

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { Knex } from 'knex';
import knex from 'knex';

// Test database configuration
const testDb: Knex = knex({
  client: 'pg',
  connection: {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: Number.Number.Number.Number.Number.Number.parseInt(process.env.TEST_DB_PORT || '5432'),
    database: process.env.TEST_DB_NAME || 'farm_commons_test',
    user: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
  },
  pool: { min: 0, max: 10 },
});

describe('Statistics Calculations', () => {
  let farmId: string;
  let worker1Id: string;
  let worker2Id: string;
  let field1Id: string;
  let field2Id: string;

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

    // Create test fields
    [{ id: field1Id }] = await testDb('fields')
      .insert({
        farm_id: farmId,
        name: 'North Field',
        size_acres: 25,
        current_crop: 'Tomatoes',
      })
      .returning('id');

    [{ id: field2Id }] = await testDb('fields')
      .insert({
        farm_id: farmId,
        name: 'South Field',
        size_acres: 30,
        current_crop: 'Lettuce',
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

  describe('Farm Statistics', () => {
    it('should calculate total workers count', async () => {
      const [{ count }] = await testDb('workers').where({ farm_id: farmId }).count('* as count');

      expect(Number.Number.Number.Number.Number.Number.parseInt(count as string)).toBe(2);
    });

    it('should calculate active workers count', async () => {
      // Add an inactive worker
      await testDb('workers').insert({
        farm_id: farmId,
        first_name: 'Bob',
        last_name: 'Johnson',
        phone: '555-0003',
        hire_date: new Date('2024-02-01'),
        status: 'inactive',
        hourly_rate: 18,
      });

      const [{ count }] = await testDb('workers')
        .where({ farm_id: farmId, status: 'active' })
        .count('* as count');

      expect(Number.Number.Number.Number.Number.Number.parseInt(count as string)).toBe(2);
    });

    it('should calculate total labor hours', async () => {
      // Create time entries
      await testDb('time_entries').insert([
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T17:00:00'),
          total_hours: 8.5,
          task_type: 'Harvesting',
          break_minutes: 30,
        },
        {
          farm_id: farmId,
          worker_id: worker2Id,
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T16:00:00'),
          total_hours: 7.5,
          task_type: 'Planting',
          break_minutes: 30,
        },
      ]);

      const [{ total }] = await testDb('time_entries')
        .where({ farm_id: farmId })
        .whereNotNull('clock_out')
        .sum('total_hours as total');

      expect(Number.parseFloat(total as string)).toBe(16);
    });
  });

  describe('Worker Statistics', () => {
    it('should calculate total hours for a worker', async () => {
      await testDb('time_entries').insert([
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T17:00:00'),
          total_hours: 8.5,
          task_type: 'Harvesting',
          break_minutes: 30,
        },
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-11-02T08:00:00'),
          clock_out: new Date('2024-11-02T17:00:00'),
          total_hours: 8.5,
          task_type: 'Harvesting',
          break_minutes: 30,
        },
      ]);

      const [{ total }] = await testDb('time_entries')
        .where({ worker_id: worker1Id })
        .whereNotNull('clock_out')
        .sum('total_hours as total');

      expect(Number.parseFloat(total as string)).toBe(17);
    });

    it('should calculate days worked for a worker', async () => {
      await testDb('time_entries').insert([
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T17:00:00'),
          total_hours: 8.5,
          task_type: 'Harvesting',
          break_minutes: 30,
        },
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-11-02T08:00:00'),
          clock_out: new Date('2024-11-02T17:00:00'),
          total_hours: 8.5,
          task_type: 'Harvesting',
          break_minutes: 30,
        },
        // Two entries on the same day should count as one day
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-11-02T13:00:00'),
          clock_out: new Date('2024-11-02T15:00:00'),
          total_hours: 2,
          task_type: 'Equipment Maintenance',
          break_minutes: 0,
        },
      ]);

      const daysResult = await testDb('time_entries')
        .where({ worker_id: worker1Id })
        .whereNotNull('clock_out')
        .countDistinct({ days: testDb.raw('DATE(clock_in)') });

      const daysValue = (daysResult[0] as Record<string, unknown>)?.days || 0;
      expect(Number.Number.Number.Number.Number.Number.parseInt(String(daysValue))).toBe(2);
    });

    it('should identify most common task type', async () => {
      await testDb('time_entries').insert([
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T17:00:00'),
          total_hours: 8.5,
          task_type: 'Harvesting',
          break_minutes: 30,
        },
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-11-02T08:00:00'),
          clock_out: new Date('2024-11-02T17:00:00'),
          total_hours: 8.5,
          task_type: 'Harvesting',
          break_minutes: 30,
        },
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-11-03T08:00:00'),
          clock_out: new Date('2024-11-03T17:00:00'),
          total_hours: 8.5,
          task_type: 'Planting',
          break_minutes: 30,
        },
      ]);

      const topTask = await testDb('time_entries')
        .where({ worker_id: worker1Id })
        .select('task_type')
        .count('* as count')
        .groupBy('task_type')
        .orderBy('count', 'desc')
        .first();

      expect(topTask?.task_type).toBe('Harvesting');
      expect(Number.Number.Number.Number.Number.Number.parseInt(topTask?.count as string)).toBe(2);
    });
  });

  describe('Labor Hours by Period', () => {
    it('should group labor hours by week', async () => {
      // Create entries across different weeks
      await testDb('time_entries').insert([
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-11-01T08:00:00'), // Week 44
          clock_out: new Date('2024-11-01T17:00:00'),
          total_hours: 8.5,
          task_type: 'Harvesting',
          break_minutes: 30,
        },
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-11-08T08:00:00'), // Week 45
          clock_out: new Date('2024-11-08T17:00:00'),
          total_hours: 8.5,
          task_type: 'Harvesting',
          break_minutes: 30,
        },
      ]);

      const weeklyHours = await testDb('time_entries')
        .where({ farm_id: farmId })
        .whereNotNull('clock_out')
        .select(
          testDb.raw("TO_CHAR(DATE_TRUNC('week', clock_in), 'YYYY-IW') as week"),
          testDb.raw('SUM(total_hours) as total')
        )
        .groupBy(testDb.raw("TO_CHAR(DATE_TRUNC('week', clock_in), 'YYYY-IW')"))
        .orderBy('week');

      expect(weeklyHours.length).toBe(2);
      expect(Number.parseFloat(weeklyHours[0].total)).toBe(8.5);
      expect(Number.parseFloat(weeklyHours[1].total)).toBe(8.5);
    });

    it('should group labor hours by month', async () => {
      await testDb('time_entries').insert([
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-10-15T08:00:00'),
          clock_out: new Date('2024-10-15T17:00:00'),
          total_hours: 8.5,
          task_type: 'Harvesting',
          break_minutes: 30,
        },
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-11-15T08:00:00'),
          clock_out: new Date('2024-11-15T17:00:00'),
          total_hours: 8.5,
          task_type: 'Harvesting',
          break_minutes: 30,
        },
      ]);

      const monthlyHours = await testDb('time_entries')
        .where({ farm_id: farmId })
        .whereNotNull('clock_out')
        .select(
          testDb.raw("TO_CHAR(DATE_TRUNC('month', clock_in), 'YYYY-MM') as month"),
          testDb.raw('SUM(total_hours) as total')
        )
        .groupBy(testDb.raw("TO_CHAR(DATE_TRUNC('month', clock_in), 'YYYY-MM')"))
        .orderBy('month');

      expect(monthlyHours.length).toBe(2);
      expect(monthlyHours[0].month).toBe('2024-10');
      expect(monthlyHours[1].month).toBe('2024-11');
    });
  });

  describe('Field Utilization', () => {
    it('should calculate hours per field', async () => {
      await testDb('time_entries').insert([
        {
          farm_id: farmId,
          worker_id: worker1Id,
          field_id: field1Id,
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T17:00:00'),
          total_hours: 8.5,
          task_type: 'Harvesting',
          break_minutes: 30,
        },
        {
          farm_id: farmId,
          worker_id: worker2Id,
          field_id: field1Id,
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T17:00:00'),
          total_hours: 8.5,
          task_type: 'Harvesting',
          break_minutes: 30,
        },
        {
          farm_id: farmId,
          worker_id: worker1Id,
          field_id: field2Id,
          clock_in: new Date('2024-11-02T08:00:00'),
          clock_out: new Date('2024-11-02T12:00:00'),
          total_hours: 4,
          task_type: 'Planting',
          break_minutes: 0,
        },
      ]);

      const fieldStats = await testDb('fields')
        .where({ 'fields.farm_id': farmId })
        .leftJoin('time_entries', function () {
          this.on('time_entries.field_id', '=', 'fields.id').andOn(
            'time_entries.farm_id',
            '=',
            'fields.farm_id'
          );
        })
        .select(
          'fields.id',
          'fields.name',
          'fields.size_acres',
          testDb.raw('COALESCE(SUM(time_entries.total_hours), 0) as total_hours')
        )
        .groupBy('fields.id', 'fields.name', 'fields.size_acres')
        .orderBy('fields.name');

      expect(fieldStats.length).toBe(2);

      const northField = fieldStats.find((f) => f.name === 'North Field');
      const southField = fieldStats.find((f) => f.name === 'South Field');

      expect(Number.parseFloat(northField?.total_hours as string)).toBe(17);
      expect(Number.parseFloat(southField?.total_hours as string)).toBe(4);
    });

    it('should calculate hours per acre', async () => {
      await testDb('time_entries').insert({
        farm_id: farmId,
        worker_id: worker1Id,
        field_id: field1Id,
        clock_in: new Date('2024-11-01T08:00:00'),
        clock_out: new Date('2024-11-01T17:00:00'),
        total_hours: 8.5,
        task_type: 'Harvesting',
        break_minutes: 30,
      });

      const [field] = await testDb('fields')
        .where({ 'fields.id': field1Id })
        .leftJoin('time_entries', 'time_entries.field_id', 'fields.id')
        .select(
          'fields.size_acres',
          testDb.raw('COALESCE(SUM(time_entries.total_hours), 0) as total_hours')
        )
        .groupBy('fields.size_acres');

      const totalHours = Number.parseFloat(field.total_hours);
      const sizeAcres = Number.parseFloat(field.size_acres);
      const hoursPerAcre = totalHours / sizeAcres;

      expect(hoursPerAcre).toBeCloseTo(0.34, 2); // 8.5 hours / 25 acres = 0.34
    });

    it('should handle fields with no activity', async () => {
      // Don't add any time entries for field2
      await testDb('time_entries').insert({
        farm_id: farmId,
        worker_id: worker1Id,
        field_id: field1Id,
        clock_in: new Date('2024-11-01T08:00:00'),
        clock_out: new Date('2024-11-01T17:00:00'),
        total_hours: 8.5,
        task_type: 'Harvesting',
        break_minutes: 30,
      });

      const fieldStats = await testDb('fields')
        .where({ 'fields.farm_id': farmId })
        .leftJoin('time_entries', function () {
          this.on('time_entries.field_id', '=', 'fields.id').andOn(
            'time_entries.farm_id',
            '=',
            'fields.farm_id'
          );
        })
        .select(
          'fields.id',
          'fields.name',
          testDb.raw('COALESCE(SUM(time_entries.total_hours), 0) as total_hours')
        )
        .groupBy('fields.id', 'fields.name')
        .orderBy('fields.name');

      const southField = fieldStats.find((f) => f.name === 'South Field');
      expect(Number.parseFloat(southField?.total_hours as string)).toBe(0);
    });
  });
});
