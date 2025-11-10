// Integration tests for skills API routes

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index.js';
import db from '../../db/connection.js';
import jwt from 'jsonwebtoken';

describe('Skills API', () => {
  let authToken: string;
  let farmId: string;
  let workerId: string;
  let skillId: string;

  beforeAll(async () => {
    // Create test farm
    const [farm] = await db('farms').insert({
      name: 'Test Farm',
      location: 'Test Location',
      size_acres: 100,
      organic_certified: false,
    }).returning('*');
    farmId = farm.id;

    // Create test user with manager role
    const [user] = await db('users').insert({
      email: 'manager@test.com',
      password_hash: '$2b$10$test',
      role: 'manager',
      farm_id: farmId,
    }).returning('*');

    // Generate auth token
    authToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, farm_id: farmId },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test worker
    const [worker] = await db('workers').insert({
      farm_id: farmId,
      first_name: 'John',
      last_name: 'Doe',
      phone: '555-0100',
      hire_date: new Date(),
      status: 'active',
    }).returning('*');
    workerId = worker.id;
  });

  afterAll(async () => {
    // Cleanup
    await db('worker_skills').where({ worker_id: workerId }).del();
    await db('skills').where({ farm_id: farmId }).del();
    await db('workers').where({ farm_id: farmId }).del();
    await db('users').where({ farm_id: farmId }).del();
    await db('farms').where({ id: farmId }).del();
    await db.destroy();
  });

  beforeEach(async () => {
    // Clean up skills before each test
    await db('worker_skills').where({ worker_id: workerId }).del();
    await db('skills').where({ farm_id: farmId }).del();
  });

  describe('POST /api/skills', () => {
    it('should create a new skill', async () => {
      const skillData = {
        name: 'Tractor Operation',
        description: 'Ability to operate various farm tractors',
        category: 'Equipment',
      };

      const response = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${authToken}`)
        .send(skillData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: skillData.name,
        description: skillData.description,
        category: skillData.category,
        farm_id: farmId,
      });
      expect(response.body.data.id).toBeDefined();

      skillId = response.body.data.id;
    });

    it('should fail to create skill without authentication', async () => {
      const skillData = {
        name: 'Tractor Operation',
        description: 'Ability to operate various farm tractors',
      };

      const response = await request(app)
        .post('/api/skills')
        .send(skillData);

      expect(response.status).toBe(401);
    });

    it('should fail to create skill with invalid data', async () => {
      const skillData = {
        name: '', // Invalid: empty name
      };

      const response = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${authToken}`)
        .send(skillData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/skills', () => {
    beforeEach(async () => {
      // Create test skills
      await db('skills').insert([
        { farm_id: farmId, name: 'Planting', description: 'Crop planting skills', category: 'Farming' },
        { farm_id: farmId, name: 'Harvesting', description: 'Crop harvesting skills', category: 'Farming' },
        { farm_id: farmId, name: 'Irrigation', description: 'Irrigation system operation', category: 'Equipment' },
      ]);
    });

    it('should list all skills for the farm', async () => {
      const response = await request(app)
        .get('/api/skills')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(3);
      expect(response.body.data.total).toBe(3);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/skills?page=1&per_page=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.per_page).toBe(2);
      expect(response.body.data.total_pages).toBe(2);
    });
  });

  describe('GET /api/skills/:id', () => {
    beforeEach(async () => {
      const [skill] = await db('skills').insert({
        farm_id: farmId,
        name: 'Pruning',
        description: 'Tree and vine pruning',
        category: 'Farming',
      }).returning('*');
      skillId = skill.id;
    });

    it('should get a single skill by id', async () => {
      const response = await request(app)
        .get(`/api/skills/${skillId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Pruning');
      expect(response.body.data.workers).toBeDefined();
    });

    it('should return 404 for non-existent skill', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/skills/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/skills/:id', () => {
    beforeEach(async () => {
      const [skill] = await db('skills').insert({
        farm_id: farmId,
        name: 'Old Name',
        description: 'Old description',
      }).returning('*');
      skillId = skill.id;
    });

    it('should update a skill', async () => {
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        category: 'Equipment',
      };

      const response = await request(app)
        .put(`/api/skills/${skillId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.category).toBe(updateData.category);
    });

    it('should return 404 for non-existent skill', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .put(`/api/skills/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/skills/:id', () => {
    beforeEach(async () => {
      const [skill] = await db('skills').insert({
        farm_id: farmId,
        name: 'To Delete',
        description: 'This will be deleted',
      }).returning('*');
      skillId = skill.id;
    });

    it('should delete a skill', async () => {
      const response = await request(app)
        .delete(`/api/skills/${skillId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Skill deleted successfully');

      // Verify it's deleted
      const skill = await db('skills').where({ id: skillId }).first();
      expect(skill).toBeUndefined();
    });
  });

  describe('POST /api/skills/workers/:id/skills', () => {
    beforeEach(async () => {
      const [skill] = await db('skills').insert({
        farm_id: farmId,
        name: 'Welding',
        description: 'Metal welding and repair',
      }).returning('*');
      skillId = skill.id;
    });

    it('should add a skill to a worker', async () => {
      const skillData = {
        skill_id: skillId,
        proficiency_level: 'intermediate',
        years_experience: 3,
        notes: 'Certified in MIG welding',
      };

      const response = await request(app)
        .post(`/api/skills/workers/${workerId}/skills`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(skillData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.worker_id).toBe(workerId);
      expect(response.body.data.skill_id).toBe(skillId);
      expect(response.body.data.proficiency_level).toBe('intermediate');
      expect(response.body.data.years_experience).toBe(3);
    });

    it('should fail with non-existent worker', async () => {
      const fakeWorkerId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/skills/workers/${fakeWorkerId}/skills`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ skill_id: skillId });

      expect(response.status).toBe(404);
    });

    it('should fail with non-existent skill', async () => {
      const fakeSkillId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/skills/workers/${workerId}/skills`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ skill_id: fakeSkillId });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/skills/workers/:id/skills', () => {
    beforeEach(async () => {
      // Create skills
      const skills = await db('skills').insert([
        { farm_id: farmId, name: 'Skill 1', description: 'First skill' },
        { farm_id: farmId, name: 'Skill 2', description: 'Second skill' },
      ]).returning('*');

      // Add skills to worker
      await db('worker_skills').insert([
        {
          worker_id: workerId,
          skill_id: skills[0].id,
          proficiency_level: 'advanced',
          years_experience: 5,
        },
        {
          worker_id: workerId,
          skill_id: skills[1].id,
          proficiency_level: 'beginner',
          years_experience: 1,
        },
      ]);
    });

    it('should get all skills for a worker', async () => {
      const response = await request(app)
        .get(`/api/skills/workers/${workerId}/skills`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].skill_name).toBeDefined();
      expect(response.body.data[0].proficiency_level).toBeDefined();
    });
  });

  describe('DELETE /api/skills/workers/:id/skills/:skillId', () => {
    beforeEach(async () => {
      const [skill] = await db('skills').insert({
        farm_id: farmId,
        name: 'Removable Skill',
        description: 'This skill will be removed',
      }).returning('*');
      skillId = skill.id;

      await db('worker_skills').insert({
        worker_id: workerId,
        skill_id: skillId,
        proficiency_level: 'beginner',
      });
    });

    it('should remove a skill from a worker', async () => {
      const response = await request(app)
        .delete(`/api/skills/workers/${workerId}/skills/${skillId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Skill removed from worker successfully');

      // Verify it's removed
      const workerSkill = await db('worker_skills')
        .where({ worker_id: workerId, skill_id: skillId })
        .first();
      expect(workerSkill).toBeUndefined();
    });
  });

  describe('GET /api/skills/workers/by-skill/:skillId', () => {
    beforeEach(async () => {
      // Create a skill
      const [skill] = await db('skills').insert({
        farm_id: farmId,
        name: 'Common Skill',
        description: 'A skill many workers have',
      }).returning('*');
      skillId = skill.id;

      // Create additional workers
      const workers = await db('workers').insert([
        {
          farm_id: farmId,
          first_name: 'Jane',
          last_name: 'Smith',
          phone: '555-0101',
          hire_date: new Date(),
          status: 'active',
        },
        {
          farm_id: farmId,
          first_name: 'Bob',
          last_name: 'Johnson',
          phone: '555-0102',
          hire_date: new Date(),
          status: 'active',
        },
      ]).returning('*');

      // Add skill to multiple workers
      await db('worker_skills').insert([
        {
          worker_id: workerId,
          skill_id: skillId,
          proficiency_level: 'expert',
          years_experience: 10,
        },
        {
          worker_id: workers[0].id,
          skill_id: skillId,
          proficiency_level: 'intermediate',
          years_experience: 3,
        },
        {
          worker_id: workers[1].id,
          skill_id: skillId,
          proficiency_level: 'advanced',
          years_experience: 7,
        },
      ]);
    });

    it('should find all workers with a specific skill', async () => {
      const response = await request(app)
        .get(`/api/skills/workers/by-skill/${skillId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.skill).toBeDefined();
      expect(response.body.data.workers).toHaveLength(3);
      expect(response.body.data.total).toBe(3);

      // Check that workers are sorted by proficiency and experience
      const workers = response.body.data.workers;
      expect(workers[0].proficiency_level).toBe('expert');
      expect(workers[0].years_experience).toBe(10);
    });

    it('should return 404 for non-existent skill', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/skills/workers/by-skill/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
