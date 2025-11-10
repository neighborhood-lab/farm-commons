// Equipment Assignment Integration Tests

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import db from '../db/connection.js';

describe('Equipment Assignments API', () => {
  let authToken: string;
  let farmId: string;
  let workerId: string;
  let equipmentId: string;
  let userId: string;

  beforeEach(async () => {
    // Clean up database
    await db('equipment_assignments').del();
    await db('equipment').del();
    await db('time_entries').del();
    await db('certifications').del();
    await db('schedules').del();
    await db('workers').del();
    await db('users').del();
    await db('farms').del();

    // Create test farm
    const [farm] = await db('farms').insert({
      name: 'Test Farm',
      location: 'Test Location',
      size_acres: 100,
      organic_certified: false,
    }).returning('*');
    farmId = farm.id;

    // Create test user
    const [user] = await db('users').insert({
      email: 'manager@test.com',
      password_hash: '$2b$10$abcdefghijklmnopqrstuv', // dummy hash
      role: 'manager',
      farm_id: farmId,
    }).returning('*');
    userId = user.id;

    // Create test worker
    const [worker] = await db('workers').insert({
      farm_id: farmId,
      first_name: 'John',
      last_name: 'Doe',
      phone: '555-0100',
      email: 'john@test.com',
      hire_date: new Date('2024-01-01'),
      status: 'active',
      hourly_rate: 15.00,
    }).returning('*');
    workerId = worker.id;

    // Create test equipment
    const [equipment] = await db('equipment').insert({
      farm_id: farmId,
      name: 'Tractor Model X',
      type: 'tractor',
      model: 'X-2000',
      serial_number: 'SN123456',
      status: 'available',
    }).returning('*');
    equipmentId = equipment.id;

    // Mock authentication token
    authToken = 'Bearer mock-token';
  });

  afterEach(async () => {
    // Clean up
    await db('equipment_assignments').del();
    await db('equipment').del();
    await db('workers').del();
    await db('users').del();
    await db('farms').del();
  });

  describe('POST /api/equipment/:id/assign', () => {
    it('should successfully assign equipment to a worker', async () => {
      const response = await request(app)
        .post(`/api/equipment/${equipmentId}/assign`)
        .set('Authorization', authToken)
        .send({
          worker_id: workerId,
          assignment_notes: 'For field work today',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.equipment_id).toBe(equipmentId);
      expect(response.body.data.worker_id).toBe(workerId);
      expect(response.body.data.returned_at).toBeNull();
      expect(response.body.data.assignment_notes).toBe('For field work today');

      // Verify equipment status changed to in_use
      const equipment = await db('equipment').where({ id: equipmentId }).first();
      expect(equipment.status).toBe('in_use');
    });

    it('should fail to assign non-existent equipment', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/equipment/${fakeId}/assign`)
        .set('Authorization', authToken)
        .send({
          worker_id: workerId,
          assignment_notes: 'Test',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail to assign to non-existent worker', async () => {
      const fakeWorkerId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/equipment/${equipmentId}/assign`)
        .set('Authorization', authToken)
        .send({
          worker_id: fakeWorkerId,
          assignment_notes: 'Test',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail to assign equipment that is already in use', async () => {
      // First assignment
      await db('equipment_assignments').insert({
        farm_id: farmId,
        equipment_id: equipmentId,
        worker_id: workerId,
        assigned_by: userId,
      });
      await db('equipment').where({ id: equipmentId }).update({ status: 'in_use' });

      // Try second assignment
      const response = await request(app)
        .post(`/api/equipment/${equipmentId}/assign`)
        .set('Authorization', authToken)
        .send({
          worker_id: workerId,
          assignment_notes: 'Test',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/api/equipment/${equipmentId}/assign`)
        .send({
          worker_id: workerId,
          assignment_notes: 'Test',
        });

      expect(response.status).toBe(401);
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post(`/api/equipment/${equipmentId}/assign`)
        .set('Authorization', authToken)
        .send({
          worker_id: 'invalid-uuid',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/equipment/:id/return', () => {
    let assignmentId: string;

    beforeEach(async () => {
      // Create an active assignment
      const [assignment] = await db('equipment_assignments').insert({
        farm_id: farmId,
        equipment_id: equipmentId,
        worker_id: workerId,
        assigned_by: userId,
      }).returning('*');
      assignmentId = assignment.id;

      await db('equipment').where({ id: equipmentId }).update({ status: 'in_use' });
    });

    it('should successfully return equipment in good condition', async () => {
      const response = await request(app)
        .post(`/api/equipment/${equipmentId}/return`)
        .set('Authorization', authToken)
        .send({
          condition_on_return: 'good',
          return_notes: 'Equipment returned in good working order',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.returned_at).toBeDefined();
      expect(response.body.data.condition_on_return).toBe('good');
      expect(response.body.data.return_notes).toBe('Equipment returned in good working order');

      // Verify equipment status changed to available
      const equipment = await db('equipment').where({ id: equipmentId }).first();
      expect(equipment.status).toBe('available');
    });

    it('should set equipment to maintenance when returned damaged', async () => {
      const response = await request(app)
        .post(`/api/equipment/${equipmentId}/return`)
        .set('Authorization', authToken)
        .send({
          condition_on_return: 'damaged',
          return_notes: 'Broken hydraulic line',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify equipment status changed to maintenance
      const equipment = await db('equipment').where({ id: equipmentId }).first();
      expect(equipment.status).toBe('maintenance');
    });

    it('should fail to return equipment with no active assignment', async () => {
      // Return the equipment first
      await db('equipment_assignments')
        .where({ id: assignmentId })
        .update({ returned_at: new Date() });
      await db('equipment').where({ id: equipmentId }).update({ status: 'available' });

      // Try to return again
      const response = await request(app)
        .post(`/api/equipment/${equipmentId}/return`)
        .set('Authorization', authToken)
        .send({
          condition_on_return: 'good',
          return_notes: 'Test',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate return condition enum', async () => {
      const response = await request(app)
        .post(`/api/equipment/${equipmentId}/return`)
        .set('Authorization', authToken)
        .send({
          condition_on_return: 'invalid-condition',
          return_notes: 'Test',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/equipment/:id/history', () => {
    beforeEach(async () => {
      // Create multiple assignments for history
      const [assignment1] = await db('equipment_assignments').insert({
        farm_id: farmId,
        equipment_id: equipmentId,
        worker_id: workerId,
        assigned_by: userId,
        assigned_at: new Date('2024-01-01T08:00:00Z'),
        returned_at: new Date('2024-01-01T17:00:00Z'),
        condition_on_return: 'good',
      }).returning('*');

      const [assignment2] = await db('equipment_assignments').insert({
        farm_id: farmId,
        equipment_id: equipmentId,
        worker_id: workerId,
        assigned_by: userId,
        assigned_at: new Date('2024-01-02T08:00:00Z'),
        returned_at: null,
      }).returning('*');
    });

    it('should return assignment history for equipment', async () => {
      const response = await request(app)
        .get(`/api/equipment/${equipmentId}/history`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.equipment).toBeDefined();
      expect(response.body.data.history).toBeInstanceOf(Array);
      expect(response.body.data.history).toHaveLength(2);

      // Should be ordered by assigned_at desc (most recent first)
      expect(new Date(response.body.data.history[0].assigned_at).getTime())
        .toBeGreaterThan(new Date(response.body.data.history[1].assigned_at).getTime());
    });

    it('should include worker details in history', async () => {
      const response = await request(app)
        .get(`/api/equipment/${equipmentId}/history`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.data.history[0].worker_first_name).toBe('John');
      expect(response.body.data.history[0].worker_last_name).toBe('Doe');
    });

    it('should return 404 for non-existent equipment', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/equipment/${fakeId}/history`)
        .set('Authorization', authToken);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/equipment/workers/:id/equipment', () => {
    beforeEach(async () => {
      // Create multiple equipment items
      const [equipment2] = await db('equipment').insert({
        farm_id: farmId,
        name: 'Harvester',
        type: 'harvester',
        status: 'available',
      }).returning('*');

      // Assign both equipment items to the worker
      await db('equipment_assignments').insert([
        {
          farm_id: farmId,
          equipment_id: equipmentId,
          worker_id: workerId,
          assigned_by: userId,
        },
        {
          farm_id: farmId,
          equipment_id: equipment2.id,
          worker_id: workerId,
          assigned_by: userId,
        },
      ]);

      await db('equipment').whereIn('id', [equipmentId, equipment2.id]).update({ status: 'in_use' });
    });

    it('should return all equipment currently assigned to worker', async () => {
      const response = await request(app)
        .get(`/api/equipment/workers/${workerId}/equipment`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.worker).toBeDefined();
      expect(response.body.data.assigned_equipment).toBeInstanceOf(Array);
      expect(response.body.data.assigned_equipment).toHaveLength(2);
    });

    it('should include equipment details', async () => {
      const response = await request(app)
        .get(`/api/equipment/workers/${workerId}/equipment`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      const equipment = response.body.data.assigned_equipment[0];
      expect(equipment.equipment_name).toBeDefined();
      expect(equipment.equipment_type).toBeDefined();
      expect(equipment.equipment_status).toBe('in_use');
    });

    it('should not include returned equipment', async () => {
      // Return one piece of equipment
      await db('equipment_assignments')
        .where({ equipment_id: equipmentId, worker_id: workerId })
        .update({ returned_at: new Date() });

      const response = await request(app)
        .get(`/api/equipment/workers/${workerId}/equipment`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.data.assigned_equipment).toHaveLength(1);
    });

    it('should return 404 for non-existent worker', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/equipment/workers/${fakeId}/equipment`)
        .set('Authorization', authToken);

      expect(response.status).toBe(404);
    });
  });

  describe('Complete Equipment Assignment Workflow', () => {
    it('should complete full assign-return cycle', async () => {
      // 1. Assign equipment
      const assignResponse = await request(app)
        .post(`/api/equipment/${equipmentId}/assign`)
        .set('Authorization', authToken)
        .send({
          worker_id: workerId,
          assignment_notes: 'Morning shift',
        });

      expect(assignResponse.status).toBe(201);
      const assignmentId = assignResponse.body.data.id;

      // 2. Check worker's equipment
      const workerEquipmentResponse = await request(app)
        .get(`/api/equipment/workers/${workerId}/equipment`)
        .set('Authorization', authToken);

      expect(workerEquipmentResponse.status).toBe(200);
      expect(workerEquipmentResponse.body.data.assigned_equipment).toHaveLength(1);

      // 3. Return equipment
      const returnResponse = await request(app)
        .post(`/api/equipment/${equipmentId}/return`)
        .set('Authorization', authToken)
        .send({
          condition_on_return: 'excellent',
          return_notes: 'All tasks completed',
        });

      expect(returnResponse.status).toBe(200);

      // 4. Check history
      const historyResponse = await request(app)
        .get(`/api/equipment/${equipmentId}/history`)
        .set('Authorization', authToken);

      expect(historyResponse.status).toBe(200);
      expect(historyResponse.body.data.history).toHaveLength(1);
      expect(historyResponse.body.data.history[0].returned_at).not.toBeNull();

      // 5. Verify equipment is available again
      const equipment = await db('equipment').where({ id: equipmentId }).first();
      expect(equipment.status).toBe('available');
    });
  });
});
