// Integration tests for Crops API
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index.js';
import db from '../../db/connection.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

let authToken: string;
let farmId: string;
let fieldId: string;
let cropId: string;
let userId: string;

// Helper function to create auth token
function createAuthToken(user: { id: string; email: string; role: string; farm_id: string }) {
  return jwt.sign(user, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
}

describe('Crops API Integration Tests', () => {
  beforeAll(async () => {
    // Run migrations
    await db.migrate.latest();

    // Create test farm
    const [farm] = await db('farms').insert({
      name: 'Test Farm',
      location: 'Test Location',
      size_acres: 100,
      organic_certified: true,
    }).returning('*');
    farmId = farm.id;

    // Create test user
    const passwordHash = await bcrypt.hash('password123', 10);
    const [user] = await db('users').insert({
      email: 'test@example.com',
      password_hash: passwordHash,
      role: 'manager',
      farm_id: farmId,
    }).returning('*');
    userId = user.id;

    // Create auth token
    authToken = createAuthToken({
      id: user.id,
      email: user.email,
      role: user.role,
      farm_id: farmId,
    });

    // Create test field
    const [field] = await db('fields').insert({
      farm_id: farmId,
      name: 'Test Field',
      size_acres: 10,
      location_gps: { lat: 40.7128, lng: -74.0060 },
      soil_type: 'loam',
    }).returning('*');
    fieldId = field.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db('crops').del();
    await db('fields').del();
    await db('users').del();
    await db('farms').del();
    await db.destroy();
  });

  beforeEach(async () => {
    // Clear crops before each test
    await db('crops').del();
  });

  describe('POST /api/crops', () => {
    it('should create a new crop', async () => {
      const cropData = {
        field_id: fieldId,
        crop_name: 'Tomatoes',
        crop_variety: 'Cherry',
        planting_date: '2024-04-15',
        expected_harvest_date: '2024-07-15',
        planted_area_acres: 2.5,
        season: 'summer',
        status: 'planted',
        notes: 'Test crop',
      };

      const response = await request(app)
        .post('/api/crops')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cropData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        crop_name: 'Tomatoes',
        crop_variety: 'Cherry',
        season: 'summer',
        status: 'planted',
      });
      expect(response.body.data.id).toBeDefined();
      cropId = response.body.data.id;

      // Verify field's current_crop was updated
      const field = await db('fields').where({ id: fieldId }).first();
      expect(field.current_crop).toBe('Tomatoes');
    });

    it('should fail without authentication', async () => {
      const cropData = {
        field_id: fieldId,
        crop_name: 'Tomatoes',
        season: 'summer',
        planting_date: '2024-04-15',
      };

      await request(app)
        .post('/api/crops')
        .send(cropData)
        .expect(401);
    });

    it('should fail with invalid field_id', async () => {
      const cropData = {
        field_id: '00000000-0000-0000-0000-000000000000',
        crop_name: 'Tomatoes',
        season: 'summer',
        planting_date: '2024-04-15',
      };

      await request(app)
        .post('/api/crops')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cropData)
        .expect(404);
    });
  });

  describe('GET /api/crops', () => {
    beforeEach(async () => {
      // Create test crops
      await db('crops').insert([
        {
          farm_id: farmId,
          field_id: fieldId,
          crop_name: 'Tomatoes',
          season: 'summer',
          status: 'planted',
          planting_date: '2024-04-15',
        },
        {
          farm_id: farmId,
          field_id: fieldId,
          crop_name: 'Carrots',
          season: 'spring',
          status: 'growing',
          planting_date: '2024-03-01',
        },
        {
          farm_id: farmId,
          field_id: fieldId,
          crop_name: 'Lettuce',
          season: 'spring',
          status: 'harvested',
          planting_date: '2024-02-15',
          actual_harvest_date: '2024-04-01',
        },
      ]);
    });

    it('should get all crops for the farm', async () => {
      const response = await request(app)
        .get('/api/crops')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });

    it('should filter crops by status', async () => {
      const response = await request(app)
        .get('/api/crops?status=harvested')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].crop_name).toBe('Lettuce');
    });

    it('should filter crops by season', async () => {
      const response = await request(app)
        .get('/api/crops?season=spring')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter crops by field_id', async () => {
      const response = await request(app)
        .get(`/api/crops?field_id=${fieldId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/crops/:id', () => {
    beforeEach(async () => {
      const [crop] = await db('crops').insert({
        farm_id: farmId,
        field_id: fieldId,
        crop_name: 'Tomatoes',
        season: 'summer',
        status: 'planted',
        planting_date: '2024-04-15',
      }).returning('*');
      cropId = crop.id;
    });

    it('should get a single crop by ID', async () => {
      const response = await request(app)
        .get(`/api/crops/${cropId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(cropId);
      expect(response.body.data.crop_name).toBe('Tomatoes');
    });

    it('should return 404 for non-existent crop', async () => {
      await request(app)
        .get('/api/crops/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/crops/:id', () => {
    beforeEach(async () => {
      const [crop] = await db('crops').insert({
        farm_id: farmId,
        field_id: fieldId,
        crop_name: 'Tomatoes',
        season: 'summer',
        status: 'planted',
        planting_date: '2024-04-15',
      }).returning('*');
      cropId = crop.id;
    });

    it('should update a crop', async () => {
      const updateData = {
        status: 'harvested',
        actual_harvest_date: '2024-07-20',
        yield_amount: 150,
        yield_unit: 'lbs',
      };

      const response = await request(app)
        .put(`/api/crops/${cropId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('harvested');
      expect(response.body.data.yield_amount).toBe('150');

      // Verify field's current_crop was cleared
      const field = await db('fields').where({ id: fieldId }).first();
      expect(field.current_crop).toBeNull();
    });

    it('should return 404 for non-existent crop', async () => {
      await request(app)
        .put('/api/crops/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'harvested' })
        .expect(404);
    });
  });

  describe('DELETE /api/crops/:id', () => {
    beforeEach(async () => {
      const [crop] = await db('crops').insert({
        farm_id: farmId,
        field_id: fieldId,
        crop_name: 'Tomatoes',
        season: 'summer',
        status: 'planted',
        planting_date: '2024-04-15',
      }).returning('*');
      cropId = crop.id;
    });

    it('should delete a crop', async () => {
      await request(app)
        .delete(`/api/crops/${cropId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify crop was deleted
      const crop = await db('crops').where({ id: cropId }).first();
      expect(crop).toBeUndefined();
    });

    it('should return 404 for non-existent crop', async () => {
      await request(app)
        .delete('/api/crops/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/crops/history/field/:fieldId', () => {
    beforeEach(async () => {
      // Create crop history
      await db('crops').insert([
        {
          farm_id: farmId,
          field_id: fieldId,
          crop_name: 'Tomatoes',
          season: 'summer',
          status: 'harvested',
          planting_date: '2023-04-15',
          actual_harvest_date: '2023-07-20',
        },
        {
          farm_id: farmId,
          field_id: fieldId,
          crop_name: 'Carrots',
          season: 'fall',
          status: 'harvested',
          planting_date: '2023-08-01',
          actual_harvest_date: '2023-10-15',
        },
        {
          farm_id: farmId,
          field_id: fieldId,
          crop_name: 'Lettuce',
          season: 'spring',
          status: 'planted',
          planting_date: '2024-03-01',
        },
      ]);
    });

    it('should get crop history for a field', async () => {
      const response = await request(app)
        .get(`/api/crops/history/field/${fieldId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.field_id).toBe(fieldId);
      expect(response.body.data.crops).toHaveLength(3);
      expect(response.body.data.field_name).toBe('Test Field');
    });

    it('should return 404 for non-existent field', async () => {
      await request(app)
        .get('/api/crops/history/field/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/crops/history/field/:fieldId/rotation-analysis', () => {
    beforeEach(async () => {
      // Get Nightshades family
      const nightshades = await db('crop_families').where({ name: 'Nightshades' }).first();

      // Create crops with family
      await db('crops').insert([
        {
          farm_id: farmId,
          field_id: fieldId,
          crop_name: 'Tomatoes',
          crop_family_id: nightshades?.id,
          season: 'summer',
          status: 'harvested',
          planting_date: '2023-04-15',
          actual_harvest_date: '2023-07-20',
        },
        {
          farm_id: farmId,
          field_id: fieldId,
          crop_name: 'Peppers',
          crop_family_id: nightshades?.id,
          season: 'summer',
          status: 'planted',
          planting_date: '2024-04-01',
        },
      ]);
    });

    it('should get rotation analysis for a field', async () => {
      const response = await request(app)
        .get(`/api/crops/history/field/${fieldId}/rotation-analysis`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.field_id).toBe(fieldId);
      expect(response.body.data.crop_family_history).toBeDefined();
      expect(response.body.data.rotation_warnings).toBeDefined();
      expect(response.body.data.total_crops_planted).toBe(2);
    });
  });

  describe('GET /api/crops/companions/:cropName', () => {
    it('should get companion planting suggestions', async () => {
      const response = await request(app)
        .get('/api/crops/companions/tomatoes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.crop_name).toBe('tomatoes');
      expect(response.body.data.companions.beneficial).toBeDefined();
      expect(response.body.data.companions.antagonistic).toBeDefined();

      // Should have basil as beneficial companion
      const hasBasil = response.body.data.companions.beneficial.some(
        (c: any) => c.companion_crop === 'basil'
      );
      expect(hasBasil).toBe(true);
    });

    it('should return empty companions for unknown crop', async () => {
      const response = await request(app)
        .get('/api/crops/companions/unknowncrop')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.companions.beneficial).toHaveLength(0);
      expect(response.body.data.companions.antagonistic).toHaveLength(0);
    });
  });

  describe('GET /api/crops/families/list', () => {
    it('should get all crop families', async () => {
      const response = await request(app)
        .get('/api/crops/families/list')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Should include Brassicas, Nightshades, Legumes, etc.
      const familyNames = response.body.data.map((f: any) => f.name);
      expect(familyNames).toContain('Brassicas');
      expect(familyNames).toContain('Nightshades');
      expect(familyNames).toContain('Legumes');
    });
  });
});
