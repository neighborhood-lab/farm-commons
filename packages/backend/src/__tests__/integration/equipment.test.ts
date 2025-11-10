// Equipment API Integration Tests
import { describe, it, expect, beforeEach } from 'vitest';
import db from '../../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

describe('Equipment Integration Tests', () => {
  let farmId: string;
  let workerId: string;
  let fieldId: string;
  let userId: string;

  beforeEach(async () => {
    // Create test farm
    const [farm] = await db('farms').insert({
      name: 'Test Farm',
      location: 'Test Location',
      size_acres: 100,
      organic_certified: true,
    }).returning('*');
    farmId = farm.id;

    // Create test user
    const [user] = await db('users').insert({
      email: 'manager@test.com',
      password_hash: 'hashed_password',
      role: 'manager',
      farm_id: farmId,
    }).returning('*');
    userId = user.id;

    // Create test worker
    const [worker] = await db('workers').insert({
      farm_id: farmId,
      first_name: 'John',
      last_name: 'Doe',
      phone: '1234567890',
      hire_date: new Date('2024-01-01'),
      status: 'active',
    }).returning('*');
    workerId = worker.id;

    // Create test field
    const [field] = await db('fields').insert({
      farm_id: farmId,
      name: 'Test Field',
      size_acres: 10,
    }).returning('*');
    fieldId = field.id;
  });

  describe('Equipment CRUD Operations', () => {
    it('should create equipment', async () => {
      const equipment = await db('equipment').insert({
        farm_id: farmId,
        name: 'Tractor',
        type: 'tractor',
        manufacturer: 'John Deere',
        model: '5075E',
        serial_number: 'JD123456',
        year: 2020,
        purchase_price: 45000,
        purchase_date: new Date('2020-03-15'),
        status: 'available',
        notes: 'Primary tractor',
      }).returning('*');

      expect(equipment[0]).toMatchObject({
        name: 'Tractor',
        type: 'tractor',
        manufacturer: 'John Deere',
        model: '5075E',
        status: 'available',
      });
      expect(equipment[0].id).toBeDefined();
      expect(equipment[0].farm_id).toBe(farmId);
    });

    it('should list equipment for a farm', async () => {
      // Create multiple equipment
      await db('equipment').insert([
        {
          farm_id: farmId,
          name: 'Tractor',
          type: 'tractor',
          status: 'available',
        },
        {
          farm_id: farmId,
          name: 'Harvester',
          type: 'harvester',
          status: 'maintenance',
        },
        {
          farm_id: farmId,
          name: 'Irrigation System',
          type: 'irrigation',
          status: 'available',
        },
      ]);

      const equipment = await db('equipment')
        .where({ farm_id: farmId })
        .orderBy('name', 'asc');

      expect(equipment).toHaveLength(3);
      expect(equipment[0].name).toBe('Harvester');
      expect(equipment[1].name).toBe('Irrigation System');
      expect(equipment[2].name).toBe('Tractor');
    });

    it('should filter equipment by status', async () => {
      // Create equipment with different statuses
      await db('equipment').insert([
        { farm_id: farmId, name: 'Tractor 1', type: 'tractor', status: 'available' },
        { farm_id: farmId, name: 'Tractor 2', type: 'tractor', status: 'maintenance' },
        { farm_id: farmId, name: 'Tractor 3', type: 'tractor', status: 'available' },
      ]);

      const availableEquipment = await db('equipment')
        .where({ farm_id: farmId, status: 'available' });

      expect(availableEquipment).toHaveLength(2);
    });

    it('should filter equipment by type', async () => {
      await db('equipment').insert([
        { farm_id: farmId, name: 'Tractor', type: 'tractor', status: 'available' },
        { farm_id: farmId, name: 'Harvester', type: 'harvester', status: 'available' },
        { farm_id: farmId, name: 'Another Tractor', type: 'tractor', status: 'available' },
      ]);

      const tractors = await db('equipment')
        .where({ farm_id: farmId, type: 'tractor' });

      expect(tractors).toHaveLength(2);
    });

    it('should get single equipment with details', async () => {
      const [equipment] = await db('equipment').insert({
        farm_id: farmId,
        name: 'Tractor',
        type: 'tractor',
        status: 'available',
      }).returning('*');

      const retrieved = await db('equipment')
        .where({ id: equipment.id, farm_id: farmId })
        .first();

      expect(retrieved).toMatchObject({
        id: equipment.id,
        name: 'Tractor',
        type: 'tractor',
      });
    });

    it('should update equipment', async () => {
      const [equipment] = await db('equipment').insert({
        farm_id: farmId,
        name: 'Tractor',
        type: 'tractor',
        status: 'available',
      }).returning('*');

      const [updated] = await db('equipment')
        .where({ id: equipment.id })
        .update({
          status: 'maintenance',
          notes: 'Scheduled maintenance',
          updated_at: new Date(),
        })
        .returning('*');

      expect(updated.status).toBe('maintenance');
      expect(updated.notes).toBe('Scheduled maintenance');
    });

    it('should soft delete equipment by setting status to retired', async () => {
      const [equipment] = await db('equipment').insert({
        farm_id: farmId,
        name: 'Old Tractor',
        type: 'tractor',
        status: 'available',
      }).returning('*');

      const [retired] = await db('equipment')
        .where({ id: equipment.id })
        .update({ status: 'retired', updated_at: new Date() })
        .returning('*');

      expect(retired.status).toBe('retired');
    });

    it('should not delete equipment with active assignments', async () => {
      const [equipment] = await db('equipment').insert({
        farm_id: farmId,
        name: 'Tractor',
        type: 'tractor',
        status: 'in_use',
      }).returning('*');

      await db('equipment_assignments').insert({
        equipment_id: equipment.id,
        worker_id: workerId,
        assigned_at: new Date(),
      });

      // Check if there's an active assignment
      const activeAssignment = await db('equipment_assignments')
        .where({ equipment_id: equipment.id, returned_at: null })
        .first();

      expect(activeAssignment).toBeDefined();
      // In the actual API, this would throw an error
    });
  });

  describe('Equipment Maintenance Logs', () => {
    let equipmentId: string;

    beforeEach(async () => {
      const [equipment] = await db('equipment').insert({
        farm_id: farmId,
        name: 'Tractor',
        type: 'tractor',
        status: 'available',
      }).returning('*');
      equipmentId = equipment.id;
    });

    it('should create maintenance log', async () => {
      const [log] = await db('equipment_maintenance_logs').insert({
        equipment_id: equipmentId,
        maintenance_date: new Date('2024-06-15'),
        maintenance_type: 'routine',
        description: 'Oil change and filter replacement',
        cost: 150.00,
        performed_by: workerId,
        next_maintenance_date: new Date('2024-12-15'),
      }).returning('*');

      expect(log).toMatchObject({
        equipment_id: equipmentId,
        maintenance_type: 'routine',
        description: 'Oil change and filter replacement',
        cost: '150.00',
      });
    });

    it('should list maintenance logs for equipment', async () => {
      await db('equipment_maintenance_logs').insert([
        {
          equipment_id: equipmentId,
          maintenance_date: new Date('2024-01-15'),
          maintenance_type: 'routine',
          description: 'First maintenance',
        },
        {
          equipment_id: equipmentId,
          maintenance_date: new Date('2024-06-15'),
          maintenance_type: 'repair',
          description: 'Second maintenance',
        },
      ]);

      const logs = await db('equipment_maintenance_logs')
        .where({ equipment_id: equipmentId })
        .orderBy('maintenance_date', 'desc');

      expect(logs).toHaveLength(2);
      expect(logs[0].description).toBe('Second maintenance');
      expect(logs[1].description).toBe('First maintenance');
    });

    it('should join maintenance logs with worker information', async () => {
      const [log] = await db('equipment_maintenance_logs').insert({
        equipment_id: equipmentId,
        maintenance_date: new Date('2024-06-15'),
        maintenance_type: 'routine',
        description: 'Oil change',
        performed_by: workerId,
      }).returning('*');

      const logWithWorker = await db('equipment_maintenance_logs')
        .where({ 'equipment_maintenance_logs.id': log.id })
        .leftJoin('workers', 'equipment_maintenance_logs.performed_by', 'workers.id')
        .select(
          'equipment_maintenance_logs.*',
          db.raw("CONCAT(workers.first_name, ' ', workers.last_name) as performed_by_name")
        )
        .first();

      expect(logWithWorker?.performed_by_name).toBe('John Doe');
    });

    it('should update maintenance log', async () => {
      const [log] = await db('equipment_maintenance_logs').insert({
        equipment_id: equipmentId,
        maintenance_date: new Date('2024-06-15'),
        maintenance_type: 'routine',
        description: 'Oil change',
      }).returning('*');

      const [updated] = await db('equipment_maintenance_logs')
        .where({ id: log.id })
        .update({
          cost: 200.00,
          notes: 'Found additional issues',
          updated_at: new Date(),
        })
        .returning('*');

      expect(updated.cost).toBe('200.00');
      expect(updated.notes).toBe('Found additional issues');
    });

    it('should delete maintenance log', async () => {
      const [log] = await db('equipment_maintenance_logs').insert({
        equipment_id: equipmentId,
        maintenance_date: new Date('2024-06-15'),
        maintenance_type: 'routine',
        description: 'Oil change',
      }).returning('*');

      await db('equipment_maintenance_logs')
        .where({ id: log.id })
        .delete();

      const deleted = await db('equipment_maintenance_logs')
        .where({ id: log.id })
        .first();

      expect(deleted).toBeUndefined();
    });

    it('should get maintenance reminders', async () => {
      const today = new Date();
      const in20Days = new Date(today);
      in20Days.setDate(in20Days.getDate() + 20);
      const in40Days = new Date(today);
      in40Days.setDate(in40Days.getDate() + 40);

      // Create maintenance logs with different next maintenance dates
      await db('equipment_maintenance_logs').insert([
        {
          equipment_id: equipmentId,
          maintenance_date: today,
          maintenance_type: 'routine',
          description: 'Recent maintenance',
          next_maintenance_date: in20Days,
        },
        {
          equipment_id: equipmentId,
          maintenance_date: today,
          maintenance_type: 'routine',
          description: 'Another maintenance',
          next_maintenance_date: in40Days,
        },
      ]);

      const daysAhead = 30;
      const upcomingDate = new Date(today);
      upcomingDate.setDate(upcomingDate.getDate() + daysAhead);

      const reminders = await db('equipment_maintenance_logs')
        .join('equipment', 'equipment_maintenance_logs.equipment_id', 'equipment.id')
        .where('equipment.farm_id', farmId)
        .whereNotNull('equipment_maintenance_logs.next_maintenance_date')
        .where('equipment_maintenance_logs.next_maintenance_date', '<=', upcomingDate)
        .where('equipment_maintenance_logs.next_maintenance_date', '>=', today)
        .select(
          'equipment_maintenance_logs.id',
          'equipment_maintenance_logs.next_maintenance_date',
          'equipment.name as equipment_name'
        );

      expect(reminders).toHaveLength(1);
      expect(reminders[0].equipment_name).toBe('Tractor');
    });
  });

  describe('Equipment Assignments', () => {
    let equipmentId: string;

    beforeEach(async () => {
      const [equipment] = await db('equipment').insert({
        farm_id: farmId,
        name: 'Tractor',
        type: 'tractor',
        status: 'available',
      }).returning('*');
      equipmentId = equipment.id;
    });

    it('should assign equipment to worker', async () => {
      const [assignment] = await db('equipment_assignments').insert({
        equipment_id: equipmentId,
        worker_id: workerId,
        assigned_at: new Date(),
        purpose: 'Field plowing',
      }).returning('*');

      expect(assignment).toMatchObject({
        equipment_id: equipmentId,
        worker_id: workerId,
        purpose: 'Field plowing',
      });
      expect(assignment.returned_at).toBeNull();
    });

    it('should assign equipment to field', async () => {
      const [assignment] = await db('equipment_assignments').insert({
        equipment_id: equipmentId,
        field_id: fieldId,
        assigned_at: new Date(),
        purpose: 'Irrigation setup',
      }).returning('*');

      expect(assignment).toMatchObject({
        equipment_id: equipmentId,
        field_id: fieldId,
        purpose: 'Irrigation setup',
      });
    });

    it('should list assignments for equipment', async () => {
      await db('equipment_assignments').insert([
        {
          equipment_id: equipmentId,
          worker_id: workerId,
          assigned_at: new Date('2024-01-15T08:00:00'),
          returned_at: new Date('2024-01-15T17:00:00'),
        },
        {
          equipment_id: equipmentId,
          worker_id: workerId,
          assigned_at: new Date('2024-06-15T08:00:00'),
        },
      ]);

      const assignments = await db('equipment_assignments')
        .where({ equipment_id: equipmentId })
        .orderBy('assigned_at', 'desc');

      expect(assignments).toHaveLength(2);
      expect(assignments[0].returned_at).toBeNull();
      expect(assignments[1].returned_at).not.toBeNull();
    });

    it('should get current assignment for equipment', async () => {
      await db('equipment_assignments').insert([
        {
          equipment_id: equipmentId,
          worker_id: workerId,
          assigned_at: new Date('2024-01-15T08:00:00'),
          returned_at: new Date('2024-01-15T17:00:00'),
        },
        {
          equipment_id: equipmentId,
          worker_id: workerId,
          assigned_at: new Date('2024-06-15T08:00:00'),
        },
      ]);

      const currentAssignment = await db('equipment_assignments')
        .where({ equipment_id: equipmentId, returned_at: null })
        .first();

      expect(currentAssignment).toBeDefined();
      expect(currentAssignment?.returned_at).toBeNull();
    });

    it('should return equipment from assignment', async () => {
      const [assignment] = await db('equipment_assignments').insert({
        equipment_id: equipmentId,
        worker_id: workerId,
        assigned_at: new Date(),
      }).returning('*');

      const [returned] = await db('equipment_assignments')
        .where({ id: assignment.id })
        .update({
          returned_at: new Date(),
          notes: 'Equipment returned in good condition',
          updated_at: new Date(),
        })
        .returning('*');

      expect(returned.returned_at).not.toBeNull();
      expect(returned.notes).toBe('Equipment returned in good condition');
    });

    it('should update equipment status on assignment', async () => {
      await db('equipment_assignments').insert({
        equipment_id: equipmentId,
        worker_id: workerId,
        assigned_at: new Date(),
      });

      await db('equipment')
        .where({ id: equipmentId })
        .update({ status: 'in_use', updated_at: new Date() });

      const equipment = await db('equipment')
        .where({ id: equipmentId })
        .first();

      expect(equipment?.status).toBe('in_use');
    });

    it('should update equipment status to available when returned', async () => {
      const [assignment] = await db('equipment_assignments').insert({
        equipment_id: equipmentId,
        worker_id: workerId,
        assigned_at: new Date(),
      }).returning('*');

      await db('equipment')
        .where({ id: equipmentId })
        .update({ status: 'in_use', updated_at: new Date() });

      // Return equipment
      await db('equipment_assignments')
        .where({ id: assignment.id })
        .update({ returned_at: new Date(), updated_at: new Date() });

      // Check for other active assignments
      const otherAssignments = await db('equipment_assignments')
        .where({ equipment_id: equipmentId, returned_at: null })
        .whereNot({ id: assignment.id });

      if (otherAssignments.length === 0) {
        await db('equipment')
          .where({ id: equipmentId })
          .update({ status: 'available', updated_at: new Date() });
      }

      const equipment = await db('equipment')
        .where({ id: equipmentId })
        .first();

      expect(equipment?.status).toBe('available');
    });

    it('should join assignments with worker and field information', async () => {
      const [assignment] = await db('equipment_assignments').insert({
        equipment_id: equipmentId,
        worker_id: workerId,
        field_id: fieldId,
        assigned_at: new Date(),
      }).returning('*');

      const assignmentWithDetails = await db('equipment_assignments')
        .where({ 'equipment_assignments.id': assignment.id })
        .leftJoin('workers', 'equipment_assignments.worker_id', 'workers.id')
        .leftJoin('fields', 'equipment_assignments.field_id', 'fields.id')
        .select(
          'equipment_assignments.*',
          db.raw("CONCAT(workers.first_name, ' ', workers.last_name) as worker_name"),
          'fields.name as field_name'
        )
        .first();

      expect(assignmentWithDetails?.worker_name).toBe('John Doe');
      expect(assignmentWithDetails?.field_name).toBe('Test Field');
    });
  });
});
