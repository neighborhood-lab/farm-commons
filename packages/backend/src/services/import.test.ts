// Tests for Data Import Service

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import db from '../db/connection.js';
import { importWorkers, importSchedules } from './import.js';

describe('Import Service', () => {
  const testFarmId = '00000000-0000-0000-0000-000000000001';
  let testWorkerId: string;
  let testFieldId: string;

  beforeEach(async () => {
    // Create test farm
    await db('farms').insert({
      id: testFarmId,
      name: 'Test Farm',
      location: 'Test Location',
      size_acres: 100,
      organic_certified: false,
    });

    // Create test worker for schedule imports
    const [worker] = await db('workers').insert({
      farm_id: testFarmId,
      first_name: 'Existing',
      last_name: 'Worker',
      email: 'existing@example.com',
      phone: '555-0100',
      hire_date: new Date('2024-01-01'),
      status: 'active',
    }).returning('id');
    testWorkerId = worker.id;

    // Create test field for schedule imports
    const [field] = await db('fields').insert({
      farm_id: testFarmId,
      name: 'North Field',
      size_acres: 10,
    }).returning('id');
    testFieldId = field.id;
  });

  afterEach(async () => {
    // Clean up test data
    await db('schedules').where({ farm_id: testFarmId }).delete();
    await db('workers').where({ farm_id: testFarmId }).delete();
    await db('fields').where({ farm_id: testFarmId }).delete();
    await db('farms').where({ id: testFarmId }).delete();
  });

  describe('importWorkers', () => {
    it('should import valid workers from CSV', async () => {
      const csv = `
first_name,last_name,email,phone,hire_date,status,hourly_rate
John,Doe,john@example.com,555-0101,2024-01-15,active,18.50
Jane,Smith,jane@example.com,555-0102,2024-02-01,active,20.00
Bob,Johnson,,555-0103,2024-03-01,seasonal,17.50
      `.trim();

      const result = await importWorkers(csv, { farmId: testFarmId });

      expect(result.success).toBe(true);
      expect(result.imported).toBe(3);
      expect(result.errors).toHaveLength(0);

      // Verify workers were created
      const workers = await db('workers')
        .where({ farm_id: testFarmId })
        .whereNot({ id: testWorkerId })
        .orderBy('first_name');

      expect(workers).toHaveLength(3);
      expect(workers[0].first_name).toBe('Bob');
      expect(workers[1].first_name).toBe('Jane');
      expect(workers[2].first_name).toBe('John');
    });

    it('should handle workers with certifications and skills', async () => {
      const csv = `
first_name,last_name,phone,hire_date,certifications,skills
Alice,Williams,555-0104,2024-01-01,"Tractor Operation, Forklift","Irrigation, Pruning"
      `.trim();

      const result = await importWorkers(csv, { farmId: testFarmId });

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);

      const worker = await db('workers')
        .where({ farm_id: testFarmId, phone: '555-0104' })
        .first();

      expect(worker.certifications).toEqual(['Tractor Operation', 'Forklift']);
      expect(worker.skills).toEqual(['Irrigation', 'Pruning']);
    });

    it('should validate required fields', async () => {
      const csv = `
first_name,last_name,phone,hire_date
John,,555-0105,2024-01-01
,Smith,555-0106,2024-01-01
Jane,Doe,,2024-01-01
Bob,Johnson,555-0107,
      `.trim();

      const result = await importWorkers(csv, { farmId: testFarmId, skipErrors: true });

      expect(result.success).toBe(false);
      expect(result.imported).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle malformed CSV - missing columns', async () => {
      const csv = `
first_name,last_name
John,Doe
Jane,Smith
      `.trim();

      const result = await importWorkers(csv, { farmId: testFarmId });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.imported).toBe(0);
    });

    it('should handle malformed CSV - invalid date format', async () => {
      const csv = `
first_name,last_name,phone,hire_date
John,Doe,555-0108,not-a-date
      `.trim();

      const result = await importWorkers(csv, { farmId: testFarmId });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Invalid');
    });

    it('should handle malformed CSV - invalid status', async () => {
      const csv = `
first_name,last_name,phone,hire_date,status
John,Doe,555-0109,2024-01-01,invalid_status
      `.trim();

      const result = await importWorkers(csv, { farmId: testFarmId });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('status');
    });

    it('should handle malformed CSV - invalid numeric values', async () => {
      const csv = `
first_name,last_name,phone,hire_date,hourly_rate
John,Doe,555-0110,2024-01-01,not-a-number
      `.trim();

      const result = await importWorkers(csv, { farmId: testFarmId });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should handle malformed CSV - completely broken structure', async () => {
      const csv = 'This is not a CSV file at all!';

      const result = await importWorkers(csv, { farmId: testFarmId });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty CSV', async () => {
      const csv = 'first_name,last_name,phone,hire_date';

      const result = await importWorkers(csv, { farmId: testFarmId });

      expect(result.success).toBe(true);
      expect(result.imported).toBe(0);
    });

    it('should support dry-run mode', async () => {
      const csv = `
first_name,last_name,phone,hire_date
John,Doe,555-0111,2024-01-01
      `.trim();

      const result = await importWorkers(csv, { farmId: testFarmId, dryRun: true });

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);

      // Verify no workers were actually created
      const workers = await db('workers')
        .where({ farm_id: testFarmId, phone: '555-0111' });

      expect(workers).toHaveLength(0);
    });

    it('should warn when both hourly_rate and piece_rate are set', async () => {
      const csv = `
first_name,last_name,phone,hire_date,hourly_rate,piece_rate
John,Doe,555-0112,2024-01-01,18.50,2.50
      `.trim();

      const result = await importWorkers(csv, { farmId: testFarmId });

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('hourly_rate and piece_rate');
    });

    it('should skip errors when skipErrors is true', async () => {
      const csv = `
first_name,last_name,phone,hire_date
John,,555-0113,2024-01-01
Jane,Smith,555-0114,2024-01-01
      `.trim();

      const result = await importWorkers(csv, { farmId: testFarmId, skipErrors: true });

      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('importSchedules', () => {
    it('should import valid schedules from CSV', async () => {
      const csv = `
worker_email,scheduled_date,start_time,end_time,task_type,field_name
existing@example.com,2024-06-01,08:00,17:00,Planting,North Field
existing@example.com,2024-06-02,08:00,17:00,Weeding,North Field
      `.trim();

      const result = await importSchedules(csv, { farmId: testFarmId });

      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
      expect(result.errors).toHaveLength(0);

      // Verify schedules were created
      const schedules = await db('schedules')
        .where({ farm_id: testFarmId })
        .orderBy('scheduled_date');

      expect(schedules).toHaveLength(2);
      expect(schedules[0].task_type).toBe('Planting');
      expect(schedules[1].task_type).toBe('Weeding');
    });

    it('should find worker by phone number', async () => {
      const csv = `
worker_phone,scheduled_date,start_time,end_time,task_type
555-0100,2024-06-01,08:00,17:00,Harvesting
      `.trim();

      const result = await importSchedules(csv, { farmId: testFarmId });

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
    });

    it('should handle schedules without field', async () => {
      const csv = `
worker_email,scheduled_date,start_time,end_time,task_type,task_description
existing@example.com,2024-06-01,08:00,12:00,General Maintenance,Repair equipment
      `.trim();

      const result = await importSchedules(csv, { farmId: testFarmId });

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);

      const schedule = await db('schedules')
        .where({ farm_id: testFarmId })
        .first();

      expect(schedule.field_id).toBeNull();
      expect(schedule.task_description).toBe('Repair equipment');
    });

    it('should warn when field is not found', async () => {
      const csv = `
worker_email,scheduled_date,start_time,end_time,task_type,field_name
existing@example.com,2024-06-01,08:00,17:00,Planting,Nonexistent Field
      `.trim();

      const result = await importSchedules(csv, { farmId: testFarmId });

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Field not found');
    });

    it('should error when worker is not found', async () => {
      const csv = `
worker_email,scheduled_date,start_time,end_time,task_type
nonexistent@example.com,2024-06-01,08:00,17:00,Planting
      `.trim();

      const result = await importSchedules(csv, { farmId: testFarmId });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Worker not found');
    });

    it('should require either worker_email or worker_phone', async () => {
      const csv = `
scheduled_date,start_time,end_time,task_type
2024-06-01,08:00,17:00,Planting
      `.trim();

      const result = await importSchedules(csv, { farmId: testFarmId });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('worker_email or worker_phone');
    });

    it('should validate time format', async () => {
      const csv = `
worker_email,scheduled_date,start_time,end_time,task_type
existing@example.com,2024-06-01,8am,5pm,Planting
      `.trim();

      const result = await importSchedules(csv, { farmId: testFarmId });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should handle malformed CSV - invalid date', async () => {
      const csv = `
worker_email,scheduled_date,start_time,end_time,task_type
existing@example.com,not-a-date,08:00,17:00,Planting
      `.trim();

      const result = await importSchedules(csv, { farmId: testFarmId });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should handle malformed CSV - completely broken', async () => {
      const csv = 'This is not a valid CSV!';

      const result = await importSchedules(csv, { farmId: testFarmId });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should support dry-run mode', async () => {
      const csv = `
worker_email,scheduled_date,start_time,end_time,task_type
existing@example.com,2024-06-01,08:00,17:00,Planting
      `.trim();

      const result = await importSchedules(csv, { farmId: testFarmId, dryRun: true });

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);

      // Verify no schedules were actually created
      const schedules = await db('schedules')
        .where({ farm_id: testFarmId })
        .where('scheduled_date', '2024-06-01');

      expect(schedules).toHaveLength(0);
    });

    it('should normalize phone numbers when matching', async () => {
      const csv = `
worker_phone,scheduled_date,start_time,end_time,task_type
(555) 0100,2024-06-01,08:00,17:00,Planting
      `.trim();

      const result = await importSchedules(csv, { farmId: testFarmId });

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
    });

    it('should skip errors when skipErrors is true', async () => {
      const csv = `
worker_email,scheduled_date,start_time,end_time,task_type
nonexistent@example.com,2024-06-01,08:00,17:00,Planting
existing@example.com,2024-06-02,08:00,17:00,Weeding
      `.trim();

      const result = await importSchedules(csv, { farmId: testFarmId, skipErrors: true });

      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });
});
