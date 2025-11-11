// Tests for soil data tracking functionality

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { Knex } from 'knex';
import knex from 'knex';

// Test database configuration
const testDb: Knex = knex({
  client: 'pg',
  connection: {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: Number.Number.Number.Number.Number.Number.Number.Number.parseInt(process.env.TEST_DB_PORT || '5432'),
    database: process.env.TEST_DB_NAME || 'farm_commons_test',
    user: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
  },
  pool: { min: 0, max: 10 },
});

describe('Soil Data Tracking', () => {
  let farmId: string;
  let field1Id: string;
  let field2Id: string;
  let soilTest1Id: string;
  let soilTest2Id: string;

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
    // Clean up test data in reverse dependency order
    await testDb('soil_tests').del();
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

    // Create test fields
    [{ id: field1Id }] = await testDb('fields')
      .insert({
        farm_id: farmId,
        name: 'North Field',
        size_acres: 25,
        current_crop: 'Tomatoes',
        soil_type: 'Loam',
      })
      .returning('id');

    [{ id: field2Id }] = await testDb('fields')
      .insert({
        farm_id: farmId,
        name: 'South Field',
        size_acres: 30,
        current_crop: 'Lettuce',
        soil_type: 'Clay',
      })
      .returning('id');

    // Create initial soil tests
    [{ id: soilTest1Id }] = await testDb('soil_tests')
      .insert({
        field_id: field1Id,
        farm_id: farmId,
        test_date: new Date('2024-01-15'),
        lab_name: 'AgriTest Labs',
        test_type: 'Complete',
        ph_level: 6.5,
        organic_matter_percent: 4.2,
        nitrogen_ppm: 35,
        phosphorus_ppm: 45,
        potassium_ppm: 150,
        calcium_ppm: 800,
        magnesium_ppm: 120,
        recommendations: 'Soil is in good condition',
      })
      .returning('id');

    [{ id: soilTest2Id }] = await testDb('soil_tests')
      .insert({
        field_id: field1Id,
        farm_id: farmId,
        test_date: new Date('2024-06-15'),
        lab_name: 'AgriTest Labs',
        test_type: 'Complete',
        ph_level: 6.3,
        organic_matter_percent: 4.5,
        nitrogen_ppm: 28,
        phosphorus_ppm: 48,
        potassium_ppm: 155,
        calcium_ppm: 820,
        magnesium_ppm: 125,
        recommendations: 'Consider nitrogen supplementation',
      })
      .returning('id');
  });

  afterAll(async () => {
    // Clean up and close connection
    await testDb('soil_tests').del();
    await testDb('time_entries').del();
    await testDb('schedules').del();
    await testDb('certifications').del();
    await testDb('fields').del();
    await testDb('workers').del();
    await testDb('users').del();
    await testDb('farms').del();
    await testDb.destroy();
  });

  describe('Soil Test CRUD Operations', () => {
    it('should create a new soil test', async () => {
      const newTest = {
        field_id: field2Id,
        farm_id: farmId,
        test_date: new Date('2024-03-20'),
        lab_name: 'Soil Science Lab',
        test_type: 'Basic',
        ph_level: 7.2,
        organic_matter_percent: 3.8,
        nitrogen_ppm: 42,
        phosphorus_ppm: 55,
        potassium_ppm: 180,
        notes: 'Spring test before planting',
      };

      const [createdTest] = await testDb('soil_tests').insert(newTest).returning('*');

      expect(createdTest).toBeDefined();
      expect(createdTest.field_id).toBe(field2Id);
      expect(Number.parseFloat(createdTest.ph_level)).toBeCloseTo(7.2, 1);
      expect(createdTest.lab_name).toBe('Soil Science Lab');
    });

    it('should retrieve all soil tests for a field', async () => {
      const tests = await testDb('soil_tests')
        .where({ field_id: field1Id })
        .orderBy('test_date', 'desc');

      expect(tests.length).toBe(2);
      expect(tests[0].id).toBe(soilTest2Id); // Most recent first
      expect(tests[1].id).toBe(soilTest1Id);
    });

    it('should retrieve a single soil test by id', async () => {
      const test = await testDb('soil_tests').where({ id: soilTest1Id }).first();

      expect(test).toBeDefined();
      expect(test.field_id).toBe(field1Id);
      expect(Number.parseFloat(test.ph_level)).toBeCloseTo(6.5, 1);
      expect(Number.parseFloat(test.nitrogen_ppm)).toBe(35);
    });

    it('should update a soil test', async () => {
      const [updatedTest] = await testDb('soil_tests')
        .where({ id: soilTest1Id })
        .update({
          recommendations: 'Updated recommendation after review',
          notes: 'Added additional notes',
        })
        .returning('*');

      expect(updatedTest.recommendations).toBe('Updated recommendation after review');
      expect(updatedTest.notes).toBe('Added additional notes');
    });

    it('should delete a soil test', async () => {
      const deletedCount = await testDb('soil_tests').where({ id: soilTest1Id }).delete();

      expect(deletedCount).toBe(1);

      const test = await testDb('soil_tests').where({ id: soilTest1Id }).first();
      expect(test).toBeUndefined();
    });
  });

  describe('Nutrient Tracking', () => {
    it('should track nitrogen levels over time', async () => {
      const tests = await testDb('soil_tests')
        .where({ field_id: field1Id })
        .whereNotNull('nitrogen_ppm')
        .select('test_date', 'nitrogen_ppm')
        .orderBy('test_date', 'asc');

      expect(tests.length).toBe(2);
      expect(Number.parseFloat(tests[0].nitrogen_ppm)).toBe(35);
      expect(Number.parseFloat(tests[1].nitrogen_ppm)).toBe(28);

      // Nitrogen decreased from 35 to 28
      const change =
        Number.parseFloat(tests[1].nitrogen_ppm) - Number.parseFloat(tests[0].nitrogen_ppm);
      expect(change).toBeLessThan(0);
    });

    it('should track pH levels over time', async () => {
      const tests = await testDb('soil_tests')
        .where({ field_id: field1Id })
        .whereNotNull('ph_level')
        .select('test_date', 'ph_level')
        .orderBy('test_date', 'asc');

      expect(tests.length).toBe(2);
      expect(Number.parseFloat(tests[0].ph_level)).toBeCloseTo(6.5, 1);
      expect(Number.parseFloat(tests[1].ph_level)).toBeCloseTo(6.3, 1);
    });

    it('should track organic matter percentage', async () => {
      const tests = await testDb('soil_tests')
        .where({ field_id: field1Id })
        .whereNotNull('organic_matter_percent')
        .select('test_date', 'organic_matter_percent')
        .orderBy('test_date', 'asc');

      expect(tests.length).toBe(2);
      expect(Number.parseFloat(tests[0].organic_matter_percent)).toBeCloseTo(4.2, 1);
      expect(Number.parseFloat(tests[1].organic_matter_percent)).toBeCloseTo(4.5, 1);

      // Organic matter increased
      const change =
        Number.parseFloat(tests[1].organic_matter_percent) -
        Number.parseFloat(tests[0].organic_matter_percent);
      expect(change).toBeGreaterThan(0);
    });

    it('should track multiple macronutrients', async () => {
      const test = await testDb('soil_tests').where({ id: soilTest1Id }).first();

      expect(Number.parseFloat(test.nitrogen_ppm)).toBe(35);
      expect(Number.parseFloat(test.phosphorus_ppm)).toBe(45);
      expect(Number.parseFloat(test.potassium_ppm)).toBe(150);
    });

    it('should track micronutrients when available', async () => {
      // Add a test with micronutrient data
      const [testWithMicros] = await testDb('soil_tests')
        .insert({
          field_id: field2Id,
          farm_id: farmId,
          test_date: new Date('2024-05-01'),
          test_type: 'Complete with Micronutrients',
          ph_level: 6.8,
          iron_ppm: 15.5,
          manganese_ppm: 8.2,
          zinc_ppm: 3.5,
          copper_ppm: 1.8,
          boron_ppm: 0.9,
        })
        .returning('*');

      expect(Number.parseFloat(testWithMicros.iron_ppm)).toBeCloseTo(15.5, 1);
      expect(Number.parseFloat(testWithMicros.manganese_ppm)).toBeCloseTo(8.2, 1);
      expect(Number.parseFloat(testWithMicros.zinc_ppm)).toBeCloseTo(3.5, 1);
    });
  });

  describe('Test History and Trends', () => {
    it('should return test count for a field', async () => {
      const [{ count }] = await testDb('soil_tests')
        .where({ field_id: field1Id })
        .count('* as count');

      expect(Number.Number.Number.Number.Number.Number.Number.Number.parseInt(count as string)).toBe(2);
    });

    it('should get the most recent test for a field', async () => {
      const latestTest = await testDb('soil_tests')
        .where({ field_id: field1Id })
        .orderBy('test_date', 'desc')
        .first();

      expect(latestTest.id).toBe(soilTest2Id);
      expect(new Date(latestTest.test_date).toISOString().split('T')[0]).toBe('2024-06-15');
    });

    it('should filter tests by date range', async () => {
      const startDate = new Date('2024-03-01');
      const endDate = new Date('2024-07-01');

      const tests = await testDb('soil_tests')
        .where({ field_id: field1Id })
        .whereBetween('test_date', [startDate, endDate]);

      expect(tests.length).toBe(1);
      expect(tests[0].id).toBe(soilTest2Id);
    });

    it('should calculate average pH across all tests', async () => {
      const [{ avg_ph }] = await testDb('soil_tests')
        .where({ field_id: field1Id })
        .whereNotNull('ph_level')
        .avg('ph_level as avg_ph');

      const averagePh = Number.parseFloat(avg_ph as string);
      expect(averagePh).toBeCloseTo(6.4, 1); // (6.5 + 6.3) / 2 = 6.4
    });

    it('should handle fields with no soil tests', async () => {
      // Create a new field with no tests
      const [{ id: newFieldId }] = await testDb('fields')
        .insert({
          farm_id: farmId,
          name: 'East Field',
          size_acres: 20,
          current_crop: 'Carrots',
        })
        .returning('id');

      const tests = await testDb('soil_tests').where({ field_id: newFieldId });

      expect(tests.length).toBe(0);
    });
  });

  describe('Soil Properties', () => {
    it('should store CEC (Cation Exchange Capacity)', async () => {
      const [testWithCEC] = await testDb('soil_tests')
        .insert({
          field_id: field2Id,
          farm_id: farmId,
          test_date: new Date('2024-04-10'),
          test_type: 'Complete',
          ph_level: 7,
          cec_meq_100g: 18.5,
        })
        .returning('*');

      expect(Number.parseFloat(testWithCEC.cec_meq_100g)).toBeCloseTo(18.5, 1);
    });

    it('should store soil texture information', async () => {
      const [testWithTexture] = await testDb('soil_tests')
        .insert({
          field_id: field2Id,
          farm_id: farmId,
          test_date: new Date('2024-04-10'),
          test_type: 'Basic',
          texture: 'Sandy Loam',
        })
        .returning('*');

      expect(testWithTexture.texture).toBe('Sandy Loam');
    });

    it('should store document URL for full report', async () => {
      const documentUrl = 'https://example.com/reports/soil-test-123.pdf';

      const [testWithDoc] = await testDb('soil_tests')
        .insert({
          field_id: field1Id,
          farm_id: farmId,
          test_date: new Date('2024-07-01'),
          test_type: 'Complete',
          document_url: documentUrl,
        })
        .returning('*');

      expect(testWithDoc.document_url).toBe(documentUrl);
    });
  });

  describe('Multi-Field Comparisons', () => {
    it('should compare soil quality across fields', async () => {
      // Add test for field2
      await testDb('soil_tests').insert({
        field_id: field2Id,
        farm_id: farmId,
        test_date: new Date('2024-06-10'),
        test_type: 'Complete',
        ph_level: 7.5,
        organic_matter_percent: 2.8,
        nitrogen_ppm: 22,
      });

      const latestTests = await testDb('soil_tests')
        .select('field_id')
        .max('test_date as latest_date')
        .groupBy('field_id');

      expect(latestTests.length).toBe(2);
    });

    it('should get average nutrient levels by farm', async () => {
      // Add test for field2
      await testDb('soil_tests').insert({
        field_id: field2Id,
        farm_id: farmId,
        test_date: new Date('2024-06-10'),
        test_type: 'Complete',
        nitrogen_ppm: 40,
        phosphorus_ppm: 50,
        potassium_ppm: 200,
      });

      const [{ avg_n, avg_p, avg_k }] = await testDb('soil_tests').where({ farm_id: farmId }).avg({
        avg_n: 'nitrogen_ppm',
        avg_p: 'phosphorus_ppm',
        avg_k: 'potassium_ppm',
      });

      expect(Number.parseFloat(avg_n as string)).toBeGreaterThan(0);
      expect(Number.parseFloat(avg_p as string)).toBeGreaterThan(0);
      expect(Number.parseFloat(avg_k as string)).toBeGreaterThan(0);
    });
  });

  describe('Data Validation', () => {
    it('should allow null values for optional nutrients', async () => {
      const [minimalTest] = await testDb('soil_tests')
        .insert({
          field_id: field2Id,
          farm_id: farmId,
          test_date: new Date('2024-05-15'),
          test_type: 'Basic',
          // Only required fields, all nutrients null
        })
        .returning('*');

      expect(minimalTest.ph_level).toBeNull();
      expect(minimalTest.nitrogen_ppm).toBeNull();
      expect(minimalTest.phosphorus_ppm).toBeNull();
    });

    it('should cascade delete when field is deleted', async () => {
      // Create a new field with tests
      const [{ id: tempFieldId }] = await testDb('fields')
        .insert({
          farm_id: farmId,
          name: 'Temp Field',
          size_acres: 10,
        })
        .returning('id');

      await testDb('soil_tests').insert({
        field_id: tempFieldId,
        farm_id: farmId,
        test_date: new Date('2024-05-01'),
        test_type: 'Basic',
      });

      // Delete the field
      await testDb('fields').where({ id: tempFieldId }).delete();

      // Soil tests should be deleted too (cascade)
      const tests = await testDb('soil_tests').where({ field_id: tempFieldId });
      expect(tests.length).toBe(0);
    });
  });
});
