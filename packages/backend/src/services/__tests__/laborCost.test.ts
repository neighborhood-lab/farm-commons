// Tests for labor cost calculation service

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { Knex } from 'knex';
import knex from 'knex';
import {
  calculateLaborCost,
  calculateFarmLaborCost,
  analyzeFieldProfitability,
  getHistoricalCostTrends,
  calculateCropLaborCost,
  type LaborCostConfig,
} from '../laborCost.js';

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

describe('Labor Cost Calculator', () => {
  let farmId: string;
  let worker1Id: string;
  let worker2Id: string;
  let worker3Id: string;
  let field1Id: string;
  let field2Id: string;

  beforeAll(async () => {
    // Run migrations
    try {
      await testDb.migrate.latest({
        directory: './src/db/migrations',
      });
    } catch (error) {
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

    // Create test workers with different hourly rates
    [{ id: worker1Id }] = await testDb('workers')
      .insert({
        farm_id: farmId,
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-0001',
        hire_date: new Date('2024-01-01'),
        status: 'active',
        hourly_rate: 20.0,
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
        hourly_rate: 25.0,
      })
      .returning('id');

    [{ id: worker3Id }] = await testDb('workers')
      .insert({
        farm_id: farmId,
        first_name: 'Bob',
        last_name: 'Johnson',
        phone: '555-0003',
        hire_date: new Date('2024-02-01'),
        status: 'active',
        hourly_rate: 18.0,
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

  describe('calculateLaborCost', () => {
    it('should calculate labor cost with default config', async () => {
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
          worker_id: worker1Id,
          clock_in: new Date('2024-11-02T08:00:00'),
          clock_out: new Date('2024-11-02T17:00:00'),
          total_hours: 8.5,
          task_type: 'Harvesting',
          break_minutes: 30,
        },
      ]);

      const result = await calculateLaborCost(
        worker1Id,
        new Date('2024-11-01'),
        new Date('2024-11-02T23:59:59')
      );

      // Worker1 rate: $20/hour, 17 hours total
      // Base wage: 20 * 17 = $340
      // Overhead (15%): 340 * 0.15 = $51
      // Benefits (20%): 340 * 0.20 = $68
      // Workers Comp (3%): 340 * 0.03 = $10.20
      // Payroll Tax (7.65%): 340 * 0.0765 = $26.01
      // Total: 340 + 51 + 68 + 10.20 + 26.01 = $495.21

      expect(result.baseWage).toBe(340.0);
      expect(result.overhead).toBe(51.0);
      expect(result.benefits).toBe(68.0);
      expect(result.workersComp).toBe(10.2);
      expect(result.payrollTax).toBe(26.01);
      expect(result.totalCost).toBe(495.21);
      expect(result.hours).toBe(17.0);
      expect(result.costPerHour).toBeCloseTo(29.13, 2);
    });

    it('should calculate labor cost with custom config', async () => {
      await testDb('time_entries').insert({
        farm_id: farmId,
        worker_id: worker1Id,
        clock_in: new Date('2024-11-01T08:00:00'),
        clock_out: new Date('2024-11-01T17:00:00'),
        total_hours: 8.0,
        task_type: 'Harvesting',
        break_minutes: 60,
      });

      const customConfig: Partial<LaborCostConfig> = {
        overheadRate: 0.25, // 25% overhead
        benefitsRate: 0.30, // 30% benefits
        workersCompRate: 0.05, // 5% workers comp
        payrollTaxRate: 0.10, // 10% payroll tax
      };

      const result = await calculateLaborCost(
        worker1Id,
        new Date('2024-11-01'),
        new Date('2024-11-01T23:59:59'),
        customConfig
      );

      // Base wage: 20 * 8 = $160
      // Total multiplier: 1 + 0.25 + 0.30 + 0.05 + 0.10 = 1.70
      // Total: 160 * 1.70 = $272

      expect(result.baseWage).toBe(160.0);
      expect(result.overhead).toBe(40.0);
      expect(result.benefits).toBe(48.0);
      expect(result.workersComp).toBe(8.0);
      expect(result.payrollTax).toBe(16.0);
      expect(result.totalCost).toBe(272.0);
      expect(result.hours).toBe(8.0);
      expect(result.costPerHour).toBe(34.0);
    });

    it('should throw error for non-existent worker', async () => {
      await expect(
        calculateLaborCost(
          '00000000-0000-0000-0000-000000000000',
          new Date('2024-11-01'),
          new Date('2024-11-02')
        )
      ).rejects.toThrow('Worker not found');
    });

    it('should throw error for worker without hourly rate', async () => {
      const [{ id: workerWithoutRate }] = await testDb('workers')
        .insert({
          farm_id: farmId,
          first_name: 'No',
          last_name: 'Rate',
          phone: '555-9999',
          hire_date: new Date('2024-01-01'),
          status: 'active',
          hourly_rate: null,
        })
        .returning('id');

      await expect(
        calculateLaborCost(
          workerWithoutRate,
          new Date('2024-11-01'),
          new Date('2024-11-02')
        )
      ).rejects.toThrow('does not have an hourly rate');
    });

    it('should return zero costs for worker with no time entries', async () => {
      const result = await calculateLaborCost(
        worker1Id,
        new Date('2024-11-01'),
        new Date('2024-11-02')
      );

      expect(result.baseWage).toBe(0);
      expect(result.totalCost).toBe(0);
      expect(result.hours).toBe(0);
      expect(result.costPerHour).toBe(0);
    });

    it('should only include completed time entries', async () => {
      await testDb('time_entries').insert([
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T17:00:00'),
          total_hours: 8.0,
          task_type: 'Harvesting',
          break_minutes: 60,
        },
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-11-02T08:00:00'),
          clock_out: null, // Not clocked out
          total_hours: null,
          task_type: 'Planting',
          break_minutes: 0,
        },
      ]);

      const result = await calculateLaborCost(
        worker1Id,
        new Date('2024-11-01'),
        new Date('2024-11-02T23:59:59')
      );

      expect(result.hours).toBe(8.0);
    });
  });

  describe('calculateFarmLaborCost', () => {
    it('should calculate total labor cost for entire farm', async () => {
      await testDb('time_entries').insert([
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T17:00:00'),
          total_hours: 8.0,
          task_type: 'Harvesting',
          break_minutes: 60,
        },
        {
          farm_id: farmId,
          worker_id: worker2Id,
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T17:00:00'),
          total_hours: 8.0,
          task_type: 'Planting',
          break_minutes: 60,
        },
        {
          farm_id: farmId,
          worker_id: worker3Id,
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T13:00:00'),
          total_hours: 5.0,
          task_type: 'Weeding',
          break_minutes: 0,
        },
      ]);

      const result = await calculateFarmLaborCost(
        farmId,
        new Date('2024-11-01'),
        new Date('2024-11-01T23:59:59')
      );

      // Worker1: 8 * $20 = $160
      // Worker2: 8 * $25 = $200
      // Worker3: 5 * $18 = $90
      // Base wage: $450
      const expectedBaseWage = 450.0;

      expect(result.baseWage).toBe(expectedBaseWage);
      expect(result.hours).toBe(21.0);
      expect(result.totalCost).toBeGreaterThan(expectedBaseWage);
    });

    it('should handle multiple workers with different rates', async () => {
      await testDb('time_entries').insert([
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T12:00:00'),
          total_hours: 4.0,
          task_type: 'Harvesting',
          break_minutes: 0,
        },
        {
          farm_id: farmId,
          worker_id: worker2Id,
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T12:00:00'),
          total_hours: 4.0,
          task_type: 'Harvesting',
          break_minutes: 0,
        },
      ]);

      const result = await calculateFarmLaborCost(
        farmId,
        new Date('2024-11-01'),
        new Date('2024-11-01T23:59:59')
      );

      // Worker1: 4 * $20 = $80
      // Worker2: 4 * $25 = $100
      // Base wage: $180

      expect(result.baseWage).toBe(180.0);
      expect(result.hours).toBe(8.0);
    });
  });

  describe('analyzeFieldProfitability', () => {
    it('should calculate labor costs per field', async () => {
      await testDb('time_entries').insert([
        {
          farm_id: farmId,
          worker_id: worker1Id,
          field_id: field1Id,
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T17:00:00'),
          total_hours: 8.0,
          task_type: 'Harvesting',
          break_minutes: 60,
        },
        {
          farm_id: farmId,
          worker_id: worker2Id,
          field_id: field1Id,
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T12:00:00'),
          total_hours: 4.0,
          task_type: 'Harvesting',
          break_minutes: 0,
        },
        {
          farm_id: farmId,
          worker_id: worker3Id,
          field_id: field2Id,
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T17:00:00'),
          total_hours: 8.0,
          task_type: 'Planting',
          break_minutes: 60,
        },
      ]);

      const results = await analyzeFieldProfitability(
        farmId,
        new Date('2024-11-01'),
        new Date('2024-11-01T23:59:59')
      );

      expect(results.length).toBe(2);

      // Results should be sorted by total labor cost (descending)
      // Field1: (8 * 20) + (4 * 25) = 160 + 100 = $260 base
      // Field2: (8 * 18) = $144 base
      expect(results[0].fieldName).toBe('North Field');
      expect(results[0].totalHours).toBe(12.0);
      expect(results[0].currentCrop).toBe('Tomatoes');
      expect(results[0].totalLaborCost).toBeGreaterThan(260); // Includes overhead

      expect(results[1].fieldName).toBe('South Field');
      expect(results[1].totalHours).toBe(8.0);
      expect(results[1].currentCrop).toBe('Lettuce');
      expect(results[1].totalLaborCost).toBeGreaterThan(144); // Includes overhead
    });

    it('should exclude fields with no time entries', async () => {
      await testDb('time_entries').insert({
        farm_id: farmId,
        worker_id: worker1Id,
        field_id: field1Id,
        clock_in: new Date('2024-11-01T08:00:00'),
        clock_out: new Date('2024-11-01T17:00:00'),
        total_hours: 8.0,
        task_type: 'Harvesting',
        break_minutes: 60,
      });

      const results = await analyzeFieldProfitability(
        farmId,
        new Date('2024-11-01'),
        new Date('2024-11-01T23:59:59')
      );

      // Should only return field1
      expect(results.length).toBe(1);
      expect(results[0].fieldName).toBe('North Field');
    });

    it('should calculate average cost per hour per field', async () => {
      await testDb('time_entries').insert({
        farm_id: farmId,
        worker_id: worker1Id,
        field_id: field1Id,
        clock_in: new Date('2024-11-01T08:00:00'),
        clock_out: new Date('2024-11-01T17:00:00'),
        total_hours: 8.0,
        task_type: 'Harvesting',
        break_minutes: 60,
      });

      const results = await analyzeFieldProfitability(
        farmId,
        new Date('2024-11-01'),
        new Date('2024-11-01T23:59:59')
      );

      expect(results[0].averageCostPerHour).toBeGreaterThan(20); // More than base rate due to overhead
    });
  });

  describe('getHistoricalCostTrends', () => {
    it('should group costs by month', async () => {
      await testDb('time_entries').insert([
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-10-15T08:00:00'),
          clock_out: new Date('2024-10-15T17:00:00'),
          total_hours: 8.0,
          task_type: 'Harvesting',
          break_minutes: 60,
        },
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-11-15T08:00:00'),
          clock_out: new Date('2024-11-15T17:00:00'),
          total_hours: 8.0,
          task_type: 'Harvesting',
          break_minutes: 60,
        },
        {
          farm_id: farmId,
          worker_id: worker2Id,
          clock_in: new Date('2024-11-16T08:00:00'),
          clock_out: new Date('2024-11-16T17:00:00'),
          total_hours: 8.0,
          task_type: 'Planting',
          break_minutes: 60,
        },
      ]);

      const results = await getHistoricalCostTrends(
        farmId,
        new Date('2024-10-01'),
        new Date('2024-11-30'),
        'monthly'
      );

      expect(results.length).toBe(2);
      expect(results[0].period).toBe('2024-10');
      expect(results[0].totalHours).toBe(8.0);
      expect(results[0].workerCount).toBe(1);

      expect(results[1].period).toBe('2024-11');
      expect(results[1].totalHours).toBe(16.0);
      expect(results[1].workerCount).toBe(2);
    });

    it('should group costs by week', async () => {
      await testDb('time_entries').insert([
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-11-01T08:00:00'), // Week 44
          clock_out: new Date('2024-11-01T17:00:00'),
          total_hours: 8.0,
          task_type: 'Harvesting',
          break_minutes: 60,
        },
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-11-08T08:00:00'), // Week 45
          clock_out: new Date('2024-11-08T17:00:00'),
          total_hours: 8.0,
          task_type: 'Harvesting',
          break_minutes: 60,
        },
      ]);

      const results = await getHistoricalCostTrends(
        farmId,
        new Date('2024-11-01'),
        new Date('2024-11-30'),
        'weekly'
      );

      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results[0].totalHours).toBeGreaterThan(0);
    });

    it('should calculate correct averages across periods', async () => {
      await testDb('time_entries').insert([
        {
          farm_id: farmId,
          worker_id: worker1Id,
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T17:00:00'),
          total_hours: 8.0,
          task_type: 'Harvesting',
          break_minutes: 60,
        },
      ]);

      const results = await getHistoricalCostTrends(
        farmId,
        new Date('2024-11-01'),
        new Date('2024-11-30'),
        'monthly'
      );

      expect(results.length).toBe(1);
      expect(results[0].averageCostPerHour).toBeGreaterThan(0);
      expect(results[0].totalLaborCost).toBeGreaterThan(results[0].totalHours * 20);
    });
  });

  describe('calculateCropLaborCost', () => {
    it('should calculate labor cost for specific crop', async () => {
      await testDb('time_entries').insert([
        {
          farm_id: farmId,
          worker_id: worker1Id,
          field_id: field1Id, // Tomatoes field
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T17:00:00'),
          total_hours: 8.0,
          task_type: 'Harvesting',
          break_minutes: 60,
        },
        {
          farm_id: farmId,
          worker_id: worker2Id,
          field_id: field1Id, // Tomatoes field
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T12:00:00'),
          total_hours: 4.0,
          task_type: 'Harvesting',
          break_minutes: 0,
        },
        {
          farm_id: farmId,
          worker_id: worker3Id,
          field_id: field2Id, // Lettuce field (should not be included)
          clock_in: new Date('2024-11-01T08:00:00'),
          clock_out: new Date('2024-11-01T17:00:00'),
          total_hours: 8.0,
          task_type: 'Planting',
          break_minutes: 60,
        },
      ]);

      const result = await calculateCropLaborCost(
        farmId,
        'Tomatoes',
        new Date('2024-11-01'),
        new Date('2024-11-01T23:59:59')
      );

      // Worker1: 8 * $20 = $160
      // Worker2: 4 * $25 = $100
      // Base wage: $260
      expect(result.baseWage).toBe(260.0);
      expect(result.hours).toBe(12.0);
      expect(result.totalCost).toBeGreaterThan(260);
    });

    it('should return zero for crop with no time entries', async () => {
      const result = await calculateCropLaborCost(
        farmId,
        'Corn',
        new Date('2024-11-01'),
        new Date('2024-11-01T23:59:59')
      );

      expect(result.baseWage).toBe(0);
      expect(result.totalCost).toBe(0);
      expect(result.hours).toBe(0);
    });

    it('should only include time entries within date range', async () => {
      await testDb('time_entries').insert([
        {
          farm_id: farmId,
          worker_id: worker1Id,
          field_id: field1Id,
          clock_in: new Date('2024-10-15T08:00:00'), // Outside range
          clock_out: new Date('2024-10-15T17:00:00'),
          total_hours: 8.0,
          task_type: 'Harvesting',
          break_minutes: 60,
        },
        {
          farm_id: farmId,
          worker_id: worker1Id,
          field_id: field1Id,
          clock_in: new Date('2024-11-01T08:00:00'), // Inside range
          clock_out: new Date('2024-11-01T17:00:00'),
          total_hours: 8.0,
          task_type: 'Harvesting',
          break_minutes: 60,
        },
      ]);

      const result = await calculateCropLaborCost(
        farmId,
        'Tomatoes',
        new Date('2024-11-01'),
        new Date('2024-11-30')
      );

      expect(result.hours).toBe(8.0);
    });
  });

  describe('Cost calculation accuracy', () => {
    it('should maintain precision in calculations', async () => {
      await testDb('time_entries').insert({
        farm_id: farmId,
        worker_id: worker1Id,
        clock_in: new Date('2024-11-01T08:00:00'),
        clock_out: new Date('2024-11-01T12:30:00'),
        total_hours: 4.25,
        task_type: 'Harvesting',
        break_minutes: 15,
      });

      const result = await calculateLaborCost(
        worker1Id,
        new Date('2024-11-01'),
        new Date('2024-11-01T23:59:59')
      );

      // 4.25 hours * $20 = $85
      expect(result.baseWage).toBe(85.0);
      expect(result.hours).toBe(4.25);
    });

    it('should round costs to 2 decimal places', async () => {
      await testDb('time_entries').insert({
        farm_id: farmId,
        worker_id: worker1Id,
        clock_in: new Date('2024-11-01T08:00:00'),
        clock_out: new Date('2024-11-01T11:20:00'),
        total_hours: 3.33,
        task_type: 'Harvesting',
        break_minutes: 0,
      });

      const result = await calculateLaborCost(
        worker1Id,
        new Date('2024-11-01'),
        new Date('2024-11-01T23:59:59')
      );

      // All monetary values should have at most 2 decimal places
      expect(result.baseWage.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
      expect(result.overhead.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
      expect(result.benefits.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
      expect(result.totalCost.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });
});
