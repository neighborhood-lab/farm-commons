import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import db from '../db/connection.js';

describe('Task Templates API', () => {
  let authToken: string;
  let farmId: string;
  let templateId: string;
  let workerId: string;
  let fieldId: string;

  beforeAll(async () => {
    // Run migrations
    await db.migrate.latest();

    // Create a test farm
    const [farm] = await db('farms').insert({
      name: 'Test Farm',
      location: 'Test Location',
      size_acres: 100,
      organic_certified: true,
    }).returning('*');
    farmId = farm.id;

    // Create a test user
    const [user] = await db('users').insert({
      email: 'test@example.com',
      password_hash: '$2b$10$abcdefghijklmnopqrstuv', // Mock hash
      role: 'admin',
      farm_id: farmId,
    }).returning('*');

    // Create a test worker
    const [worker] = await db('workers').insert({
      farm_id: farmId,
      first_name: 'John',
      last_name: 'Doe',
      phone: '1234567890',
      hire_date: new Date(),
      status: 'active',
    }).returning('*');
    workerId = worker.id;

    // Create a test field
    const [field] = await db('fields').insert({
      farm_id: farmId,
      name: 'Test Field',
      size_acres: 10,
    }).returning('*');
    fieldId = field.id;

    // Mock authentication - in a real test, you'd login and get a token
    authToken = 'mock-token';
  });

  afterAll(async () => {
    // Clean up test data
    await db('task_templates').where({ farm_id: farmId }).delete();
    await db('fields').where({ farm_id: farmId }).delete();
    await db('workers').where({ farm_id: farmId }).delete();
    await db('users').where({ farm_id: farmId }).delete();
    await db('farms').where({ id: farmId }).delete();
    await db.destroy();
  });

  beforeEach(async () => {
    // Clean up templates before each test
    await db('task_templates').where({ farm_id: farmId }).delete();
  });

  describe('POST /api/task-templates', () => {
    it('should create a new task template', async () => {
      const templateData = {
        name: 'Harvest Tomatoes',
        task_type: 'Harvesting',
        task_description: 'Pick ripe tomatoes carefully',
        default_duration_hours: 4,
        default_start_time: '08:00',
        field_required: true,
        required_skills: ['Harvesting', 'Quality Control'],
        season: 'summer',
        notes: 'Wear gloves and use baskets',
      };

      const response = await request(app)
        .post('/api/task-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: templateData.name,
        task_type: templateData.task_type,
        farm_id: farmId,
      });

      templateId = response.body.data.id;
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
      };

      const response = await request(app)
        .post('/api/task-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/task-templates', () => {
    beforeEach(async () => {
      // Create some test templates
      await db('task_templates').insert([
        {
          farm_id: farmId,
          name: 'Spring Planting',
          task_type: 'Planting',
          season: 'spring',
        },
        {
          farm_id: farmId,
          name: 'Summer Watering',
          task_type: 'Irrigation',
          season: 'summer',
        },
      ]);
    });

    it('should return all task templates for farm', async () => {
      const response = await request(app)
        .get('/api/task-templates')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter templates by season', async () => {
      const response = await request(app)
        .get('/api/task-templates?season=spring')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].season).toBe('spring');
    });
  });

  describe('GET /api/task-templates/:id', () => {
    beforeEach(async () => {
      const [template] = await db('task_templates').insert({
        farm_id: farmId,
        name: 'Test Template',
        task_type: 'Testing',
      }).returning('*');
      templateId = template.id;
    });

    it('should return a single task template', async () => {
      const response = await request(app)
        .get(`/api/task-templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(templateId);
    });

    it('should return 404 for non-existent template', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/task-templates/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/task-templates/:id', () => {
    beforeEach(async () => {
      const [template] = await db('task_templates').insert({
        farm_id: farmId,
        name: 'Test Template',
        task_type: 'Testing',
      }).returning('*');
      templateId = template.id;
    });

    it('should update a task template', async () => {
      const updateData = {
        name: 'Updated Template Name',
        task_description: 'New description',
      };

      const response = await request(app)
        .put(`/api/task-templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.task_description).toBe(updateData.task_description);
    });
  });

  describe('DELETE /api/task-templates/:id', () => {
    beforeEach(async () => {
      const [template] = await db('task_templates').insert({
        farm_id: farmId,
        name: 'Test Template',
        task_type: 'Testing',
      }).returning('*');
      templateId = template.id;
    });

    it('should delete a task template', async () => {
      const response = await request(app)
        .delete(`/api/task-templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify it's deleted
      const check = await db('task_templates').where({ id: templateId }).first();
      expect(check).toBeUndefined();
    });
  });

  describe('POST /api/task-templates/:id/create-schedule', () => {
    beforeEach(async () => {
      const [template] = await db('task_templates').insert({
        farm_id: farmId,
        name: 'Test Template',
        task_type: 'Testing',
        task_description: 'Test description',
        default_duration_hours: 4,
        default_start_time: '09:00',
        field_required: true,
      }).returning('*');
      templateId = template.id;
    });

    it('should create a schedule from template', async () => {
      const scheduleData = {
        worker_id: workerId,
        field_id: fieldId,
        scheduled_date: '2025-11-15',
      };

      const response = await request(app)
        .post(`/api/task-templates/${templateId}/create-schedule`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(scheduleData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.worker_id).toBe(workerId);
      expect(response.body.data.field_id).toBe(fieldId);
      expect(response.body.data.start_time).toBe('09:00');
      expect(response.body.data.end_time).toBe('13:00'); // 9 + 4 hours
      expect(response.body.data.task_type).toBe('Testing');
    });

    it('should require field when template requires it', async () => {
      const scheduleData = {
        worker_id: workerId,
        scheduled_date: '2025-11-15',
        // Missing field_id
      };

      const response = await request(app)
        .post(`/api/task-templates/${templateId}/create-schedule`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(scheduleData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Field is required');
    });

    it('should allow custom start and end times', async () => {
      const scheduleData = {
        worker_id: workerId,
        field_id: fieldId,
        scheduled_date: '2025-11-15',
        start_time: '14:00',
        end_time: '18:00',
      };

      const response = await request(app)
        .post(`/api/task-templates/${templateId}/create-schedule`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(scheduleData);

      expect(response.status).toBe(201);
      expect(response.body.data.start_time).toBe('14:00');
      expect(response.body.data.end_time).toBe('18:00');
    });
  });
});
