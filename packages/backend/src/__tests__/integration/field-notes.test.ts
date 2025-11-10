// Integration tests for field notes routes

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcrypt';
import db from '../../db/connection.js';
import fieldNotesRouter from '../../routes/field-notes.js';
import redis from '../../lib/redis.js';

const app = express();
app.use(express.json());
app.use('/api', fieldNotesRouter);

describe('Field Notes Routes', () => {
  let testFarmId: string;
  let testUserId: string;
  let managerToken: string;
  let workerToken: string;
  let testFieldId: string;

  beforeAll(async () => {
    // Create test farm
    const [farm] = await db('farms')
      .insert({
        name: 'Test Farm',
        location: 'Test Location',
        size_acres: 100,
      })
      .returning('*');
    testFarmId = farm.id;

    // Create manager user
    const passwordHash = await bcrypt.hash('password123', 10);
    const [managerUser] = await db('users')
      .insert({
        email: 'manager@test.com',
        password_hash: passwordHash,
        role: 'manager',
        farm_id: testFarmId,
      })
      .returning('*');
    testUserId = managerUser.id;

    // Create worker user
    await db('users')
      .insert({
        email: 'worker@test.com',
        password_hash: passwordHash,
        role: 'worker',
        farm_id: testFarmId,
      })
      .returning('*');

    // Login to get tokens
    const authApp = express();
    authApp.use(express.json());
    const authRouter = (await import('../../routes/auth.js')).default;
    authApp.use('/api/auth', authRouter);

    const managerLogin = await request(authApp).post('/api/auth/login').send({
      email: 'manager@test.com',
      password: 'password123',
    });
    managerToken = managerLogin.body.data.access_token;

    const workerLogin = await request(authApp).post('/api/auth/login').send({
      email: 'worker@test.com',
      password: 'password123',
    });
    workerToken = workerLogin.body.data.access_token;

    // Create test field
    const [field] = await db('fields')
      .insert({
        farm_id: testFarmId,
        name: 'North Field',
        size_acres: 25.5,
        current_crop: 'Tomatoes',
      })
      .returning('*');
    testFieldId = field.id;
  });

  afterAll(async () => {
    // Cleanup
    await db('field_notes').where({ farm_id: testFarmId }).delete();
    await db('fields').where({ farm_id: testFarmId }).delete();
    await db('users').where({ farm_id: testFarmId }).delete();
    await db('farms').where({ id: testFarmId }).delete();
    await db.destroy();
    await redis.quit();
  });

  beforeEach(async () => {
    // Clean up field notes before each test
    await db('field_notes').where({ farm_id: testFarmId }).delete();
  });

  describe('POST /api/fields/:fieldId/notes', () => {
    it('should create a new field note as manager', async () => {
      const noteData = {
        content: 'Observed some pest damage on west side of field',
        tags: ['pest', 'damage', 'inspection'],
        photo_urls: ['https://example.com/photo1.jpg'],
      };

      const response = await request(app)
        .post(`/api/fields/${testFieldId}/notes`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(noteData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.content).toBe(noteData.content);
      expect(response.body.data.tags).toEqual(noteData.tags);
      expect(response.body.data.field_id).toBe(testFieldId);
      expect(response.body.data.farm_id).toBe(testFarmId);
    });

    it('should reject note creation for non-existent field', async () => {
      const noteData = {
        content: 'Test note',
        tags: [],
        photo_urls: [],
      };

      const response = await request(app)
        .post('/api/fields/00000000-0000-0000-0000-000000000000/notes')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(noteData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Field not found');
    });

    it('should reject note creation without authentication', async () => {
      const noteData = {
        content: 'Test note',
        tags: [],
        photo_urls: [],
      };

      await request(app).post(`/api/fields/${testFieldId}/notes`).send(noteData).expect(401);
    });

    it('should reject note creation by worker role', async () => {
      const noteData = {
        content: 'Test note',
        tags: [],
        photo_urls: [],
      };

      await request(app)
        .post(`/api/fields/${testFieldId}/notes`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send(noteData)
        .expect(403);
    });

    it('should reject note creation with invalid data', async () => {
      const invalidData = {
        content: '',
        tags: 'not-an-array',
      };

      const response = await request(app)
        .post(`/api/fields/${testFieldId}/notes`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/fields/:fieldId/notes', () => {
    beforeEach(async () => {
      // Create multiple test notes
      await db('field_notes').insert([
        {
          field_id: testFieldId,
          farm_id: testFarmId,
          created_by: testUserId,
          content: 'First note about field conditions',
          tags: ['inspection', 'soil'],
          photo_urls: [],
        },
        {
          field_id: testFieldId,
          farm_id: testFarmId,
          created_by: testUserId,
          content: 'Second note about irrigation',
          tags: ['irrigation', 'water'],
          photo_urls: ['https://example.com/photo2.jpg'],
        },
        {
          field_id: testFieldId,
          farm_id: testFarmId,
          created_by: testUserId,
          content: 'Third note about harvest',
          tags: ['harvest'],
          photo_urls: [],
        },
      ]);
    });

    it('should get all notes for a field', async () => {
      const response = await request(app)
        .get(`/api/fields/${testFieldId}/notes`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(3);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.page).toBe(1);

      // Should be ordered by created_at desc (newest first)
      expect(response.body.data.data[0].content).toContain('harvest');
      expect(response.body.data.data[2].content).toContain('First note');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/fields/${testFieldId}/notes?page=1&per_page=2`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.total_pages).toBe(2);
    });

    it('should include creator information', async () => {
      const response = await request(app)
        .get(`/api/fields/${testFieldId}/notes`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.data.data[0]).toHaveProperty('created_by_email');
      expect(response.body.data.data[0].created_by_email).toBe('manager@test.com');
    });

    it('should allow workers to view notes', async () => {
      const response = await request(app)
        .get(`/api/fields/${testFieldId}/notes`)
        .set('Authorization', `Bearer ${workerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(3);
    });
  });

  describe('PUT /api/:id', () => {
    let noteToUpdate: any;

    beforeEach(async () => {
      // Create a note to update
      [noteToUpdate] = await db('field_notes')
        .insert({
          field_id: testFieldId,
          farm_id: testFarmId,
          created_by: testUserId,
          content: 'Original content',
          tags: ['original'],
          photo_urls: [],
        })
        .returning('*');
    });

    it('should update a field note', async () => {
      const updateData = {
        content: 'Updated content with new observations',
        tags: ['updated', 'revised'],
        photo_urls: ['https://example.com/new-photo.jpg'],
      };

      const response = await request(app)
        .put(`/api/${noteToUpdate.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(updateData.content);
      expect(response.body.data.tags).toEqual(updateData.tags);
      expect(response.body.data.photo_urls).toEqual(updateData.photo_urls);
    });

    it('should allow partial updates', async () => {
      const updateData = {
        content: 'Only updating content',
      };

      const response = await request(app)
        .put(`/api/${noteToUpdate.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(updateData.content);
      expect(response.body.data.tags).toEqual(['original']); // Unchanged
    });

    it('should reject update for non-existent note', async () => {
      const response = await request(app)
        .put('/api/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ content: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject update by worker role', async () => {
      await request(app)
        .put(`/api/${noteToUpdate.id}`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({ content: 'Updated' })
        .expect(403);
    });
  });

  describe('DELETE /api/:id', () => {
    let noteToDelete: any;

    beforeEach(async () => {
      // Create a note to delete
      [noteToDelete] = await db('field_notes')
        .insert({
          field_id: testFieldId,
          farm_id: testFarmId,
          created_by: testUserId,
          content: 'Note to be deleted',
          tags: [],
          photo_urls: [],
        })
        .returning('*');
    });

    it('should delete a field note', async () => {
      const response = await request(app)
        .delete(`/api/${noteToDelete.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify note is deleted
      const deleted = await db('field_notes').where({ id: noteToDelete.id }).first();
      expect(deleted).toBeUndefined();
    });

    it('should reject delete for non-existent note', async () => {
      const response = await request(app)
        .delete('/api/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject delete by worker role', async () => {
      await request(app)
        .delete(`/api/${noteToDelete.id}`)
        .set('Authorization', `Bearer ${workerToken}`)
        .expect(403);
    });
  });

  describe('GET /api/notes/by-tag/:tag', () => {
    beforeEach(async () => {
      // Create notes with various tags
      await db('field_notes').insert([
        {
          field_id: testFieldId,
          farm_id: testFarmId,
          created_by: testUserId,
          content: 'Note with pest tag',
          tags: ['pest', 'inspection'],
          photo_urls: [],
        },
        {
          field_id: testFieldId,
          farm_id: testFarmId,
          created_by: testUserId,
          content: 'Another pest note',
          tags: ['pest', 'damage'],
          photo_urls: [],
        },
        {
          field_id: testFieldId,
          farm_id: testFarmId,
          created_by: testUserId,
          content: 'Irrigation note',
          tags: ['irrigation'],
          photo_urls: [],
        },
      ]);
    });

    it('should get notes by tag', async () => {
      const response = await request(app)
        .get('/api/notes/by-tag/pest')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.total).toBe(2);

      // All returned notes should have the 'pest' tag
      response.body.data.data.forEach((note: any) => {
        expect(note.tags).toContain('pest');
      });
    });

    it('should return empty array for non-existent tag', async () => {
      const response = await request(app)
        .get('/api/notes/by-tag/nonexistent')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(0);
      expect(response.body.data.total).toBe(0);
    });

    it('should include field name in results', async () => {
      const response = await request(app)
        .get('/api/notes/by-tag/pest')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.data.data[0]).toHaveProperty('field_name');
      expect(response.body.data.data[0].field_name).toBe('North Field');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/notes/by-tag/pest?page=1&per_page=1')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.total_pages).toBe(2);
    });
  });
});
