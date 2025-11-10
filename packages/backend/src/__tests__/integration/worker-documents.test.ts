// Integration tests for worker documents routes

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import jwt from 'jsonwebtoken';
import db from '../../db/connection.js';
import workerDocumentRouter from '../../routes/worker-documents.js';
import { errorHandler } from '../../middleware/errorHandler.js';

const app = express();
app.use(express.json());
app.use('/api/worker-documents', workerDocumentRouter);
app.use(errorHandler);

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

describe('Worker Documents Routes', () => {
  let testFarmId: string;
  let testManagerUserId: string;
  let testWorkerId: string;
  let testToken: string;
  let testDocumentId: string;
  const uploadDir = path.join(process.cwd(), 'uploads', 'worker-documents');

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

    // Create test manager user
    const [manager] = await db('users')
      .insert({
        email: 'manager@test.com',
        password_hash: 'hashed_password',
        role: 'manager',
        farm_id: testFarmId,
      })
      .returning('*');
    testManagerUserId = manager.id;

    // Create test worker
    const [worker] = await db('workers')
      .insert({
        farm_id: testFarmId,
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-0100',
        hire_date: new Date(),
        status: 'active',
      })
      .returning('*');
    testWorkerId = worker.id;

    // Generate JWT token
    testToken = jwt.sign(
      {
        id: testManagerUserId,
        email: 'manager@test.com',
        role: 'manager',
        farm_id: testFarmId,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });
  });

  afterAll(async () => {
    // Cleanup
    await db('worker_documents').where({ farm_id: testFarmId }).delete();
    await db('workers').where({ farm_id: testFarmId }).delete();
    await db('users').where({ farm_id: testFarmId }).delete();
    await db('farms').where({ id: testFarmId }).delete();
    await db.destroy();

    // Cleanup upload directory
    try {
      const files = await fs.readdir(uploadDir);
      await Promise.all(files.map((file) => fs.unlink(path.join(uploadDir, file))));
    } catch (error) {
      // Directory might not exist
    }
  });

  beforeEach(async () => {
    // Clean up documents before each test
    await db('worker_documents').where({ farm_id: testFarmId }).delete();
  });

  describe('POST /api/worker-documents', () => {
    it('should upload a document successfully', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf content');

      const response = await request(app)
        .post('/api/worker-documents')
        .set('Authorization', `Bearer ${testToken}`)
        .field('worker_id', testWorkerId)
        .field('document_name', 'I-9 Form')
        .field('document_type', 'i9_form')
        .field('notes', 'Test notes')
        .attach('file', pdfBuffer, 'test-document.pdf')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.document_name).toBe('I-9 Form');
      expect(response.body.data.document_type).toBe('i9_form');
      expect(response.body.data.worker_id).toBe(testWorkerId);
      expect(response.body.data.mime_type).toBe('application/pdf');

      testDocumentId = response.body.data.id;
    });

    it('should reject upload without authentication', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf content');

      await request(app)
        .post('/api/worker-documents')
        .field('worker_id', testWorkerId)
        .field('document_name', 'Test Document')
        .field('document_type', 'contract')
        .attach('file', pdfBuffer, 'test.pdf')
        .expect(401);
    });

    it('should reject upload without file', async () => {
      await request(app)
        .post('/api/worker-documents')
        .set('Authorization', `Bearer ${testToken}`)
        .field('worker_id', testWorkerId)
        .field('document_name', 'Test Document')
        .field('document_type', 'contract')
        .expect(400);
    });

    it('should reject upload with invalid document type', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf content');

      await request(app)
        .post('/api/worker-documents')
        .set('Authorization', `Bearer ${testToken}`)
        .field('worker_id', testWorkerId)
        .field('document_name', 'Test Document')
        .field('document_type', 'invalid_type')
        .attach('file', pdfBuffer, 'test.pdf')
        .expect(400);
    });

    it('should accept document with expiration date', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf content');
      const expirationDate = new Date('2025-12-31').toISOString();

      const response = await request(app)
        .post('/api/worker-documents')
        .set('Authorization', `Bearer ${testToken}`)
        .field('worker_id', testWorkerId)
        .field('document_name', 'Work Authorization')
        .field('document_type', 'work_authorization')
        .field('expiration_date', expirationDate)
        .attach('file', pdfBuffer, 'work-auth.pdf')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.expiration_date).toBeTruthy();
    });
  });

  describe('GET /api/worker-documents/worker/:workerId', () => {
    beforeEach(async () => {
      // Create test documents
      await db('worker_documents').insert([
        {
          worker_id: testWorkerId,
          farm_id: testFarmId,
          document_name: 'I-9 Form',
          document_type: 'i9_form',
          file_path: '/fake/path/doc1.pdf',
          file_name: 'doc1.pdf',
          mime_type: 'application/pdf',
          file_size: 1024,
          uploaded_by: testManagerUserId,
        },
        {
          worker_id: testWorkerId,
          farm_id: testFarmId,
          document_name: 'W-4 Form',
          document_type: 'w4_form',
          file_path: '/fake/path/doc2.pdf',
          file_name: 'doc2.pdf',
          mime_type: 'application/pdf',
          file_size: 2048,
          uploaded_by: testManagerUserId,
        },
      ]);
    });

    it('should get all documents for a worker', async () => {
      const response = await request(app)
        .get(`/api/worker-documents/worker/${testWorkerId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].document_type).toMatch(/i9_form|w4_form/);
    });

    it('should reject request without authentication', async () => {
      await request(app).get(`/api/worker-documents/worker/${testWorkerId}`).expect(401);
    });

    it('should return 404 for non-existent worker', async () => {
      const fakeWorkerId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .get(`/api/worker-documents/worker/${fakeWorkerId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });
  });

  describe('GET /api/worker-documents/:id', () => {
    beforeEach(async () => {
      const [doc] = await db('worker_documents')
        .insert({
          worker_id: testWorkerId,
          farm_id: testFarmId,
          document_name: 'Test Document',
          document_type: 'contract',
          file_path: '/fake/path/doc.pdf',
          file_name: 'doc.pdf',
          mime_type: 'application/pdf',
          file_size: 1024,
          uploaded_by: testManagerUserId,
        })
        .returning('*');
      testDocumentId = doc.id;
    });

    it('should get a single document', async () => {
      const response = await request(app)
        .get(`/api/worker-documents/${testDocumentId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testDocumentId);
      expect(response.body.data.document_name).toBe('Test Document');
    });

    it('should return 404 for non-existent document', async () => {
      const fakeDocId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .get(`/api/worker-documents/${fakeDocId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/worker-documents/:id', () => {
    beforeEach(async () => {
      const [doc] = await db('worker_documents')
        .insert({
          worker_id: testWorkerId,
          farm_id: testFarmId,
          document_name: 'Original Name',
          document_type: 'contract',
          file_path: '/fake/path/doc.pdf',
          file_name: 'doc.pdf',
          mime_type: 'application/pdf',
          file_size: 1024,
          uploaded_by: testManagerUserId,
        })
        .returning('*');
      testDocumentId = doc.id;
    });

    it('should update document metadata', async () => {
      const updateData = {
        document_name: 'Updated Name',
        notes: 'Updated notes',
      };

      const response = await request(app)
        .put(`/api/worker-documents/${testDocumentId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.document_name).toBe('Updated Name');
      expect(response.body.data.notes).toBe('Updated notes');
    });

    it('should reject update without authentication', async () => {
      await request(app)
        .put(`/api/worker-documents/${testDocumentId}`)
        .send({ document_name: 'Updated' })
        .expect(401);
    });
  });

  describe('DELETE /api/worker-documents/:id', () => {
    beforeEach(async () => {
      const [doc] = await db('worker_documents')
        .insert({
          worker_id: testWorkerId,
          farm_id: testFarmId,
          document_name: 'To Delete',
          document_type: 'other',
          file_path: '/fake/path/doc.pdf',
          file_name: 'doc.pdf',
          mime_type: 'application/pdf',
          file_size: 1024,
          uploaded_by: testManagerUserId,
        })
        .returning('*');
      testDocumentId = doc.id;
    });

    it('should delete a document', async () => {
      const response = await request(app)
        .delete(`/api/worker-documents/${testDocumentId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify document is deleted
      const doc = await db('worker_documents').where({ id: testDocumentId }).first();
      expect(doc).toBeUndefined();
    });

    it('should reject delete without authentication', async () => {
      await request(app).delete(`/api/worker-documents/${testDocumentId}`).expect(401);
    });
  });

  describe('GET /api/worker-documents/expiring/soon', () => {
    beforeEach(async () => {
      const today = new Date();
      const in15Days = new Date(today);
      in15Days.setDate(today.getDate() + 15);
      const in45Days = new Date(today);
      in45Days.setDate(today.getDate() + 45);

      await db('worker_documents').insert([
        {
          worker_id: testWorkerId,
          farm_id: testFarmId,
          document_name: 'Expiring Soon',
          document_type: 'work_authorization',
          file_path: '/fake/path/doc1.pdf',
          file_name: 'doc1.pdf',
          mime_type: 'application/pdf',
          file_size: 1024,
          expiration_date: in15Days,
          uploaded_by: testManagerUserId,
        },
        {
          worker_id: testWorkerId,
          farm_id: testFarmId,
          document_name: 'Not Expiring Soon',
          document_type: 'work_authorization',
          file_path: '/fake/path/doc2.pdf',
          file_name: 'doc2.pdf',
          mime_type: 'application/pdf',
          file_size: 1024,
          expiration_date: in45Days,
          uploaded_by: testManagerUserId,
        },
      ]);
    });

    it('should get documents expiring within 30 days', async () => {
      const response = await request(app)
        .get('/api/worker-documents/expiring/soon')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].document_name).toBe('Expiring Soon');
    });
  });
});
