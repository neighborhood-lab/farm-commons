import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index.js';
import db from '../../db/connection.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

describe('Emergency Contacts API', () => {
  let authToken: string;
  let farmId: string;
  let workerId: string;
  let emergencyContactId: string;

  beforeAll(async () => {
    // Run migrations
    await db.migrate.latest();

    // Create test farm
    const [farm] = await db('farms').insert({
      name: 'Test Farm',
      location: 'Test Location',
      size_acres: 100,
    }).returning('*');
    farmId = farm.id;

    // Create test user
    const passwordHash = await bcrypt.hash('testpassword123', 10);
    const [user] = await db('users').insert({
      email: 'test@example.com',
      password_hash: passwordHash,
      role: 'manager',
      farm_id: farmId,
    }).returning('*');

    // Generate auth token
    authToken = jwt.sign(
      { user_id: user.id, farm_id: farmId, role: user.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test worker
    const [worker] = await db('workers').insert({
      farm_id: farmId,
      first_name: 'John',
      last_name: 'Doe',
      phone: '1234567890',
      hire_date: new Date(),
      status: 'active',
    }).returning('*');
    workerId = worker.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db('emergency_contacts').where({ worker_id: workerId }).del();
    await db('workers').where({ id: workerId }).del();
    await db('users').where({ farm_id: farmId }).del();
    await db('farms').where({ id: farmId }).del();
    await db.destroy();
  });

  beforeEach(async () => {
    // Clean up emergency contacts before each test
    await db('emergency_contacts').where({ worker_id: workerId }).del();
  });

  describe('POST /api/workers/:workerId/emergency-contacts', () => {
    it('should create a new emergency contact', async () => {
      const contactData = {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '0987654321',
        email: 'jane@example.com',
        is_primary: true,
      };

      const response = await request(app)
        .post(`/api/workers/${workerId}/emergency-contacts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: contactData.name,
        relationship: contactData.relationship,
        phone: contactData.phone,
        email: contactData.email,
        is_primary: true,
        worker_id: workerId,
      });

      emergencyContactId = response.body.data.id;
    });

    it('should unmark previous primary contacts when creating a new primary contact', async () => {
      // Create first primary contact
      const [firstContact] = await db('emergency_contacts').insert({
        worker_id: workerId,
        name: 'First Contact',
        relationship: 'Friend',
        phone: '1111111111',
        is_primary: true,
      }).returning('*');

      // Create second primary contact
      const contactData = {
        name: 'Second Contact',
        relationship: 'Spouse',
        phone: '2222222222',
        is_primary: true,
      };

      await request(app)
        .post(`/api/workers/${workerId}/emergency-contacts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData)
        .expect(201);

      // Verify first contact is no longer primary
      const updatedFirstContact = await db('emergency_contacts')
        .where({ id: firstContact.id })
        .first();
      expect(updatedFirstContact.is_primary).toBe(false);
    });

    it('should return 404 for non-existent worker', async () => {
      const contactData = {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '0987654321',
      };

      await request(app)
        .post(`/api/workers/00000000-0000-0000-0000-000000000000/emergency-contacts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      const contactData = {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '0987654321',
      };

      await request(app)
        .post(`/api/workers/${workerId}/emergency-contacts`)
        .send(contactData)
        .expect(401);
    });
  });

  describe('GET /api/workers/:workerId/emergency-contacts', () => {
    beforeEach(async () => {
      // Create test emergency contacts
      await db('emergency_contacts').insert([
        {
          worker_id: workerId,
          name: 'Primary Contact',
          relationship: 'Spouse',
          phone: '1111111111',
          is_primary: true,
        },
        {
          worker_id: workerId,
          name: 'Secondary Contact',
          relationship: 'Friend',
          phone: '2222222222',
          is_primary: false,
        },
      ]);
    });

    it('should list all emergency contacts for a worker', async () => {
      const response = await request(app)
        .get(`/api/workers/${workerId}/emergency-contacts`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      // Primary contact should be first
      expect(response.body.data[0].is_primary).toBe(true);
      expect(response.body.data[0].name).toBe('Primary Contact');
    });

    it('should return 404 for non-existent worker', async () => {
      await request(app)
        .get(`/api/workers/00000000-0000-0000-0000-000000000000/emergency-contacts`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/emergency-contacts/:id', () => {
    let contactId: string;

    beforeEach(async () => {
      const [contact] = await db('emergency_contacts').insert({
        worker_id: workerId,
        name: 'Original Name',
        relationship: 'Friend',
        phone: '1111111111',
        is_primary: false,
      }).returning('*');
      contactId = contact.id;
    });

    it('should update an emergency contact', async () => {
      const updateData = {
        name: 'Updated Name',
        relationship: 'Spouse',
        phone: '9999999999',
      };

      const response = await request(app)
        .put(`/api/emergency-contacts/${contactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: contactId,
        name: updateData.name,
        relationship: updateData.relationship,
        phone: updateData.phone,
      });
    });

    it('should unmark other contacts when marking as primary', async () => {
      // Create another primary contact
      const [primaryContact] = await db('emergency_contacts').insert({
        worker_id: workerId,
        name: 'Primary Contact',
        relationship: 'Spouse',
        phone: '2222222222',
        is_primary: true,
      }).returning('*');

      // Update first contact to be primary
      await request(app)
        .put(`/api/emergency-contacts/${contactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ is_primary: true })
        .expect(200);

      // Verify previous primary contact is no longer primary
      const updatedPrimaryContact = await db('emergency_contacts')
        .where({ id: primaryContact.id })
        .first();
      expect(updatedPrimaryContact.is_primary).toBe(false);
    });

    it('should return 404 for non-existent contact', async () => {
      await request(app)
        .put(`/api/emergency-contacts/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);
    });
  });

  describe('DELETE /api/emergency-contacts/:id', () => {
    let contactId: string;

    beforeEach(async () => {
      const [contact] = await db('emergency_contacts').insert({
        worker_id: workerId,
        name: 'Test Contact',
        relationship: 'Friend',
        phone: '1111111111',
      }).returning('*');
      contactId = contact.id;
    });

    it('should delete an emergency contact', async () => {
      const response = await request(app)
        .delete(`/api/emergency-contacts/${contactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Emergency contact deleted successfully');

      // Verify contact is deleted
      const deletedContact = await db('emergency_contacts')
        .where({ id: contactId })
        .first();
      expect(deletedContact).toBeUndefined();
    });

    it('should return 404 for non-existent contact', async () => {
      await request(app)
        .delete(`/api/emergency-contacts/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
