// Export Service Tests

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Readable } from 'stream';
import knex, { Knex } from 'knex';
import {
  exportWorkers,
  exportTimeEntriesForPayroll,
  exportSchedules,
  exportComplianceReport,
  type ExportOptions,
} from '../export.js';

// Test database setup
let db: Knex;

beforeEach(async () => {
  // Create in-memory SQLite database for testing
  db = knex({
    client: 'sqlite3',
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
  });

  // Create tables
  await db.schema.createTable('farms', (table) => {
    table.string('id').primary();
    table.string('name');
    table.timestamps(true, true);
  });

  await db.schema.createTable('workers', (table) => {
    table.string('id').primary();
    table.string('farm_id').references('id').inTable('farms');
    table.string('first_name');
    table.string('last_name');
    table.string('email');
    table.string('phone');
    table.string('preferred_language');
    table.date('hire_date');
    table.string('status');
    table.decimal('hourly_rate');
    table.decimal('piece_rate');
    table.json('certifications');
    table.json('skills');
    table.string('emergency_contact_name');
    table.string('emergency_contact_phone');
    table.timestamps(true, true);
  });

  await db.schema.createTable('fields', (table) => {
    table.string('id').primary();
    table.string('farm_id').references('id').inTable('farms');
    table.string('name');
    table.timestamps(true, true);
  });

  await db.schema.createTable('schedules', (table) => {
    table.string('id').primary();
    table.string('farm_id').references('id').inTable('farms');
    table.string('worker_id').references('id').inTable('workers');
    table.string('field_id').references('id').inTable('fields');
    table.date('scheduled_date');
    table.string('start_time');
    table.string('end_time');
    table.string('task_type');
    table.string('task_description');
    table.string('status');
    table.timestamps(true, true);
  });

  await db.schema.createTable('time_entries', (table) => {
    table.string('id').primary();
    table.string('farm_id').references('id').inTable('farms');
    table.string('worker_id').references('id').inTable('workers');
    table.string('field_id').references('id').inTable('fields');
    table.timestamp('clock_in');
    table.timestamp('clock_out');
    table.integer('break_minutes');
    table.decimal('total_hours');
    table.string('task_type');
    table.string('verified_by');
    table.timestamps(true, true);
  });

  // Insert test farm
  await db('farms').insert({
    id: 'farm-1',
    name: 'Test Farm',
  });
});

afterEach(async () => {
  await db.destroy();
});

describe('Export Service', () => {
  describe('exportWorkers', () => {
    it('should export workers to CSV format', async () => {
      // Insert test workers
      await db('workers').insert([
        {
          id: 'worker-1',
          farm_id: 'farm-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '555-1234',
          preferred_language: 'en',
          hire_date: new Date('2023-01-15'),
          status: 'active',
          hourly_rate: 15.50,
          piece_rate: null,
          certifications: JSON.stringify(['Organic Certification']),
          skills: JSON.stringify(['Harvesting', 'Planting']),
          emergency_contact_name: 'Jane Doe',
          emergency_contact_phone: '555-5678',
        },
        {
          id: 'worker-2',
          farm_id: 'farm-1',
          first_name: 'Maria',
          last_name: 'Garcia',
          email: 'maria@example.com',
          phone: '555-9012',
          preferred_language: 'es',
          hire_date: new Date('2023-02-01'),
          status: 'active',
          hourly_rate: 16.00,
          piece_rate: null,
          certifications: JSON.stringify([]),
          skills: JSON.stringify(['Irrigation']),
          emergency_contact_name: null,
          emergency_contact_phone: null,
        },
      ]);

      const options: ExportOptions = {
        format: 'csv',
        farmId: 'farm-1',
      };

      const stream = await exportWorkers(db, options);

      expect(stream).toBeInstanceOf(Readable);

      // Read stream to verify content
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const content = Buffer.concat(chunks).toString('utf-8');

      // Verify CSV headers
      expect(content).toContain('Worker ID');
      expect(content).toContain('First Name');
      expect(content).toContain('Last Name');
      expect(content).toContain('Email');

      // Verify worker data
      expect(content).toContain('John');
      expect(content).toContain('Doe');
      expect(content).toContain('Maria');
      expect(content).toContain('Garcia');
    });

    it('should export workers to Excel format', async () => {
      await db('workers').insert({
        id: 'worker-1',
        farm_id: 'farm-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        preferred_language: 'en',
        hire_date: new Date('2023-01-15'),
        status: 'active',
        hourly_rate: 15.50,
        piece_rate: null,
        certifications: JSON.stringify([]),
        skills: JSON.stringify([]),
        emergency_contact_name: null,
        emergency_contact_phone: null,
      });

      const options: ExportOptions = {
        format: 'excel',
        farmId: 'farm-1',
      };

      const stream = await exportWorkers(db, options);

      expect(stream).toBeInstanceOf(Readable);
    });
  });

  describe('exportTimeEntriesForPayroll', () => {
    beforeEach(async () => {
      // Insert test data
      await db('workers').insert({
        id: 'worker-1',
        farm_id: 'farm-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        preferred_language: 'en',
        hire_date: new Date('2023-01-15'),
        status: 'active',
        hourly_rate: 20.00,
        piece_rate: null,
        certifications: JSON.stringify([]),
        skills: JSON.stringify([]),
        emergency_contact_name: null,
        emergency_contact_phone: null,
      });

      await db('fields').insert({
        id: 'field-1',
        farm_id: 'farm-1',
        name: 'North Field',
      });
    });

    it('should export time entries with payroll calculations', async () => {
      await db('time_entries').insert({
        id: 'entry-1',
        farm_id: 'farm-1',
        worker_id: 'worker-1',
        field_id: 'field-1',
        clock_in: new Date('2024-01-15T08:00:00Z'),
        clock_out: new Date('2024-01-15T16:00:00Z'),
        break_minutes: 30,
        total_hours: 7.5,
        task_type: 'Harvesting',
        verified_by: 'manager-1',
      });

      const options: ExportOptions = {
        format: 'csv',
        farmId: 'farm-1',
      };

      const stream = await exportTimeEntriesForPayroll(db, options);

      expect(stream).toBeInstanceOf(Readable);

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const content = Buffer.concat(chunks).toString('utf-8');

      expect(content).toContain('Worker Name');
      expect(content).toContain('John Doe');
      expect(content).toContain('Harvesting');
      expect(content).toContain('7.50'); // Total hours
      expect(content).toContain('Earnings');
    });

    it('should filter time entries by date range', async () => {
      await db('time_entries').insert([
        {
          id: 'entry-1',
          farm_id: 'farm-1',
          worker_id: 'worker-1',
          field_id: 'field-1',
          clock_in: new Date('2024-01-10T08:00:00Z'),
          clock_out: new Date('2024-01-10T16:00:00Z'),
          break_minutes: 30,
          total_hours: 7.5,
          task_type: 'Harvesting',
          verified_by: null,
        },
        {
          id: 'entry-2',
          farm_id: 'farm-1',
          worker_id: 'worker-1',
          field_id: 'field-1',
          clock_in: new Date('2024-01-20T08:00:00Z'),
          clock_out: new Date('2024-01-20T16:00:00Z'),
          break_minutes: 30,
          total_hours: 7.5,
          task_type: 'Planting',
          verified_by: null,
        },
      ]);

      const options: ExportOptions = {
        format: 'csv',
        farmId: 'farm-1',
        startDate: new Date('2024-01-15T00:00:00Z'),
        endDate: new Date('2024-01-25T23:59:59Z'),
      };

      const stream = await exportTimeEntriesForPayroll(db, options);

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const content = Buffer.concat(chunks).toString('utf-8');

      // Should include entry-2 (Jan 20) but not entry-1 (Jan 10)
      expect(content).toContain('Planting');
      expect(content).not.toContain('Harvesting');
    });
  });

  describe('exportSchedules', () => {
    beforeEach(async () => {
      await db('workers').insert({
        id: 'worker-1',
        farm_id: 'farm-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        preferred_language: 'en',
        hire_date: new Date('2023-01-15'),
        status: 'active',
        hourly_rate: 20.00,
        piece_rate: null,
        certifications: JSON.stringify([]),
        skills: JSON.stringify([]),
        emergency_contact_name: null,
        emergency_contact_phone: null,
      });

      await db('fields').insert({
        id: 'field-1',
        farm_id: 'farm-1',
        name: 'South Field',
      });
    });

    it('should export schedules to CSV', async () => {
      await db('schedules').insert({
        id: 'schedule-1',
        farm_id: 'farm-1',
        worker_id: 'worker-1',
        field_id: 'field-1',
        scheduled_date: new Date('2024-02-01'),
        start_time: '08:00',
        end_time: '16:00',
        task_type: 'Weeding',
        task_description: 'Remove weeds from tomato rows',
        status: 'scheduled',
      });

      const options: ExportOptions = {
        format: 'csv',
        farmId: 'farm-1',
      };

      const stream = await exportSchedules(db, options);

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const content = Buffer.concat(chunks).toString('utf-8');

      expect(content).toContain('Worker Name');
      expect(content).toContain('John Doe');
      expect(content).toContain('Weeding');
      expect(content).toContain('South Field');
      expect(content).toContain('08:00');
    });
  });

  describe('exportComplianceReport', () => {
    beforeEach(async () => {
      await db('workers').insert({
        id: 'worker-1',
        farm_id: 'farm-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        preferred_language: 'en',
        hire_date: new Date('2023-01-15'),
        status: 'active',
        hourly_rate: 20.00,
        piece_rate: null,
        certifications: JSON.stringify([]),
        skills: JSON.stringify([]),
        emergency_contact_name: null,
        emergency_contact_phone: null,
      });
    });

    it('should generate compliance report with overtime calculations', async () => {
      const weekStart = new Date('2024-01-08T00:00:00Z'); // Monday

      // Insert time entries totaling 45 hours (5 hours overtime)
      for (let i = 0; i < 5; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);

        await db('time_entries').insert({
          id: `entry-${i}`,
          farm_id: 'farm-1',
          worker_id: 'worker-1',
          field_id: null,
          clock_in: new Date(date.setHours(8, 0, 0, 0)),
          clock_out: new Date(date.setHours(17, 0, 0, 0)),
          break_minutes: 0,
          total_hours: 9,
          task_type: 'General Work',
          verified_by: null,
        });
      }

      const options: ExportOptions = {
        format: 'csv',
        farmId: 'farm-1',
        startDate: new Date('2024-01-08T00:00:00Z'),
        endDate: new Date('2024-01-14T23:59:59Z'),
      };

      const stream = await exportComplianceReport(db, options);

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const content = Buffer.concat(chunks).toString('utf-8');

      expect(content).toContain('Total Hours');
      expect(content).toContain('Regular Hours');
      expect(content).toContain('Overtime Hours');
      expect(content).toContain('John Doe');
      expect(content).toContain('45.00'); // Total hours
      expect(content).toContain('40.00'); // Regular hours
      expect(content).toContain('5.00'); // Overtime hours
    });

    it('should flag excessive hours violations', async () => {
      const weekStart = new Date('2024-01-08T00:00:00Z'); // Monday

      // Insert time entries totaling 65 hours (excessive)
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);

        await db('time_entries').insert({
          id: `entry-${i}`,
          farm_id: 'farm-1',
          worker_id: 'worker-1',
          field_id: null,
          clock_in: new Date(date.setHours(6, 0, 0, 0)),
          clock_out: new Date(date.setHours(16, 0, 0, 0)),
          break_minutes: 30,
          total_hours: 9.5,
          task_type: 'General Work',
          verified_by: null,
        });
      }

      const options: ExportOptions = {
        format: 'csv',
        farmId: 'farm-1',
        startDate: new Date('2024-01-08T00:00:00Z'),
        endDate: new Date('2024-01-14T23:59:59Z'),
      };

      const stream = await exportComplianceReport(db, options);

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const content = Buffer.concat(chunks).toString('utf-8');

      expect(content).toContain('Excessive Hours (>60)');
      expect(content).toContain('YES'); // Should flag excessive hours
    });

    it('should flag missing break periods', async () => {
      const today = new Date('2024-01-10T00:00:00Z');

      // Insert entry with >6 hours but no break
      await db('time_entries').insert({
        id: 'entry-1',
        farm_id: 'farm-1',
        worker_id: 'worker-1',
        field_id: null,
        clock_in: new Date(today.setHours(8, 0, 0, 0)),
        clock_out: new Date(today.setHours(16, 0, 0, 0)),
        break_minutes: 0, // No break!
        total_hours: 8,
        task_type: 'General Work',
        verified_by: null,
      });

      const options: ExportOptions = {
        format: 'csv',
        farmId: 'farm-1',
        startDate: new Date('2024-01-08T00:00:00Z'),
        endDate: new Date('2024-01-14T23:59:59Z'),
      };

      const stream = await exportComplianceReport(db, options);

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const content = Buffer.concat(chunks).toString('utf-8');

      expect(content).toContain('Missing Break Periods');
      expect(content).toContain('YES'); // Should flag missing break
    });
  });
});
