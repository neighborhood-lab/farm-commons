// Integration tests for safety incident reporting

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import db from '../../db/connection.js';
import type { Knex } from 'knex';

describe('Safety Incident Reporting Integration Tests', () => {
  let farmId: string;
  let workerId: string;
  let witnessId: string;
  let userId: string;

  beforeAll(async () => {
    // Ensure we're in test mode
    process.env.NODE_ENV = 'test';

    // Run migrations
    await db.migrate.latest();
  });

  afterAll(async () => {
    // Clean up and close connection
    await db.destroy();
  });

  beforeEach(async () => {
    // Clean up tables before each test
    await db('incidents').del();
    await db('certifications').del();
    await db('time_entries').del();
    await db('schedules').del();
    await db('workers').del();
    await db('users').del();
    await db('fields').del();
    await db('farms').del();

    // Create test data
    const [farm] = await db('farms').insert({
      name: 'Test Farm',
      location: 'Test Location',
      size_acres: 100,
      organic_certified: true,
    }).returning('*');
    farmId = farm.id;

    const [user] = await db('users').insert({
      email: 'manager@test.com',
      password_hash: 'hashed_password',
      role: 'manager',
      farm_id: farmId,
    }).returning('*');
    userId = user.id;

    const [worker] = await db('workers').insert({
      farm_id: farmId,
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1234567890',
      hire_date: new Date('2024-01-01'),
      status: 'active',
    }).returning('*');
    workerId = worker.id;

    const [witness] = await db('workers').insert({
      farm_id: farmId,
      first_name: 'Jane',
      last_name: 'Smith',
      phone: '+1234567891',
      hire_date: new Date('2024-01-01'),
      status: 'active',
    }).returning('*');
    witnessId = witness.id;
  });

  describe('Incident CRUD Operations', () => {
    it('should create a new incident report', async () => {
      const incidentData = {
        farm_id: farmId,
        worker_id: workerId,
        incident_date: new Date('2025-01-15'),
        incident_time: '14:30',
        location: 'North Field',
        description: 'Worker slipped on wet ground while harvesting',
        incident_type: 'injury',
        severity: 'first_aid',
        body_part_affected: 'Left ankle',
        nature_of_injury: 'Sprain',
        medical_treatment_required: false,
        days_away_from_work: 0,
        days_of_restricted_work: 0,
        osha_recordable: false,
        witness_ids: [witnessId],
      };

      const [incident] = await db('incidents')
        .insert(incidentData)
        .returning('*');

      expect(incident).toBeDefined();
      expect(incident.worker_id).toBe(workerId);
      expect(incident.incident_type).toBe('injury');
      expect(incident.severity).toBe('first_aid');
      expect(incident.status).toBe('reported');
    });

    it('should retrieve an incident with worker details', async () => {
      const [incident] = await db('incidents')
        .insert({
          farm_id: farmId,
          worker_id: workerId,
          incident_date: new Date('2025-01-15'),
          incident_time: '14:30',
          location: 'North Field',
          description: 'Test incident',
          incident_type: 'injury',
          severity: 'first_aid',
        })
        .returning('*');

      const result = await db('incidents')
        .where('incidents.id', incident.id)
        .leftJoin('workers', 'incidents.worker_id', 'workers.id')
        .select(
          'incidents.*',
          'workers.first_name as worker_first_name',
          'workers.last_name as worker_last_name'
        )
        .first();

      expect(result).toBeDefined();
      expect(result.worker_first_name).toBe('John');
      expect(result.worker_last_name).toBe('Doe');
    });

    it('should update incident status and investigation details', async () => {
      const [incident] = await db('incidents')
        .insert({
          farm_id: farmId,
          worker_id: workerId,
          incident_date: new Date('2025-01-15'),
          incident_time: '14:30',
          location: 'North Field',
          description: 'Test incident',
          incident_type: 'injury',
          severity: 'medical_treatment',
        })
        .returning('*');

      const [updated] = await db('incidents')
        .where('id', incident.id)
        .update({
          status: 'investigation_complete',
          investigated_by: userId,
          investigated_at: new Date(),
          root_cause: 'Wet ground conditions',
          corrective_actions: 'Install drainage system',
        })
        .returning('*');

      expect(updated.status).toBe('investigation_complete');
      expect(updated.investigated_by).toBe(userId);
      expect(updated.root_cause).toBe('Wet ground conditions');
    });

    it('should delete an incident', async () => {
      const [incident] = await db('incidents')
        .insert({
          farm_id: farmId,
          worker_id: workerId,
          incident_date: new Date('2025-01-15'),
          incident_time: '14:30',
          location: 'North Field',
          description: 'Test incident',
          incident_type: 'near_miss',
          severity: 'first_aid',
        })
        .returning('*');

      const deleted = await db('incidents')
        .where('id', incident.id)
        .delete();

      expect(deleted).toBe(1);

      const found = await db('incidents')
        .where('id', incident.id)
        .first();

      expect(found).toBeUndefined();
    });
  });

  describe('OSHA 300 Log Generation', () => {
    it('should generate OSHA 300 log with recordable incidents', async () => {
      // Create multiple incidents
      await db('incidents').insert([
        {
          farm_id: farmId,
          worker_id: workerId,
          incident_date: new Date('2025-01-10'),
          incident_time: '10:00',
          location: 'Barn',
          description: 'Lost time injury',
          incident_type: 'injury',
          severity: 'lost_time',
          osha_recordable: true,
          osha_case_number: '2025-001',
          days_away_from_work: 5,
        },
        {
          farm_id: farmId,
          worker_id: workerId,
          incident_date: new Date('2025-01-15'),
          incident_time: '14:30',
          location: 'Field',
          description: 'Medical treatment injury',
          incident_type: 'injury',
          severity: 'medical_treatment',
          osha_recordable: true,
          osha_case_number: '2025-002',
          days_of_restricted_work: 3,
        },
        {
          farm_id: farmId,
          worker_id: workerId,
          incident_date: new Date('2025-01-20'),
          incident_time: '09:00',
          location: 'Storage',
          description: 'First aid only',
          incident_type: 'injury',
          severity: 'first_aid',
          osha_recordable: false,
        },
      ]);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const incidents = await db('incidents')
        .where('incidents.farm_id', farmId)
        .where('incidents.osha_recordable', true)
        .whereBetween('incidents.incident_date', [startDate, endDate])
        .leftJoin('workers', 'incidents.worker_id', 'workers.id')
        .select(
          'incidents.*',
          'workers.first_name as worker_first_name',
          'workers.last_name as worker_last_name'
        )
        .orderBy('incidents.incident_date', 'asc');

      expect(incidents).toHaveLength(2);
      expect(incidents[0].osha_case_number).toBe('2025-001');
      expect(incidents[1].osha_case_number).toBe('2025-002');

      // Calculate summary stats
      const totalDaysAway = incidents.reduce((sum, i) => sum + (i.days_away_from_work || 0), 0);
      const totalDaysRestricted = incidents.reduce((sum, i) => sum + (i.days_of_restricted_work || 0), 0);

      expect(totalDaysAway).toBe(5);
      expect(totalDaysRestricted).toBe(3);
    });
  });

  describe('Incident Statistics', () => {
    beforeEach(async () => {
      // Create diverse incident data for statistics
      await db('incidents').insert([
        {
          farm_id: farmId,
          worker_id: workerId,
          incident_date: new Date('2025-01-05'),
          incident_time: '10:00',
          location: 'Field A',
          description: 'Injury 1',
          incident_type: 'injury',
          severity: 'first_aid',
          osha_recordable: false,
          status: 'closed',
        },
        {
          farm_id: farmId,
          worker_id: workerId,
          incident_date: new Date('2025-01-10'),
          incident_time: '11:00',
          location: 'Field B',
          description: 'Injury 2',
          incident_type: 'injury',
          severity: 'medical_treatment',
          osha_recordable: true,
          status: 'investigation_complete',
          days_away_from_work: 3,
        },
        {
          farm_id: farmId,
          worker_id: workerId,
          incident_date: new Date('2025-01-15'),
          incident_time: '14:00',
          location: 'Barn',
          description: 'Illness',
          incident_type: 'illness',
          severity: 'medical_treatment',
          osha_recordable: true,
          status: 'under_investigation',
        },
        {
          farm_id: farmId,
          worker_id: workerId,
          incident_date: new Date('2025-01-20'),
          incident_time: '09:00',
          location: 'Storage',
          description: 'Near miss',
          incident_type: 'near_miss',
          severity: 'first_aid',
          osha_recordable: false,
          status: 'reported',
        },
      ]);
    });

    it('should calculate overall incident statistics', async () => {
      const [stats] = await db('incidents')
        .where('farm_id', farmId)
        .select(
          db.raw('COUNT(*) as total_incidents'),
          db.raw("COUNT(*) FILTER (WHERE incident_type = 'injury') as total_injuries"),
          db.raw("COUNT(*) FILTER (WHERE incident_type = 'illness') as total_illnesses"),
          db.raw("COUNT(*) FILTER (WHERE incident_type = 'near_miss') as total_near_misses"),
          db.raw("COUNT(*) FILTER (WHERE osha_recordable = true) as total_osha_recordable"),
          db.raw('SUM(days_away_from_work) as total_days_away')
        );

      expect(parseInt(stats.total_incidents as string)).toBe(4);
      expect(parseInt(stats.total_injuries as string)).toBe(2);
      expect(parseInt(stats.total_illnesses as string)).toBe(1);
      expect(parseInt(stats.total_near_misses as string)).toBe(1);
      expect(parseInt(stats.total_osha_recordable as string)).toBe(2);
      expect(parseInt(stats.total_days_away as string)).toBe(3);
    });

    it('should group incidents by type', async () => {
      const byType = await db('incidents')
        .where('farm_id', farmId)
        .select('incident_type')
        .count('* as count')
        .groupBy('incident_type')
        .orderBy('count', 'desc');

      expect(byType).toHaveLength(3);
      expect(byType[0].incident_type).toBe('injury');
      expect(parseInt(byType[0].count as string)).toBe(2);
    });

    it('should group incidents by severity', async () => {
      const bySeverity = await db('incidents')
        .where('farm_id', farmId)
        .select('severity')
        .count('* as count')
        .groupBy('severity')
        .orderBy('count', 'desc');

      expect(bySeverity).toHaveLength(2);
      expect(bySeverity[0].severity).toBe('medical_treatment');
      expect(parseInt(bySeverity[0].count as string)).toBe(2);
    });

    it('should group incidents by status', async () => {
      const byStatus = await db('incidents')
        .where('farm_id', farmId)
        .select('status')
        .count('* as count')
        .groupBy('status');

      expect(byStatus).toHaveLength(4);
      const reportedStatus = byStatus.find(s => s.status === 'reported');
      expect(parseInt(reportedStatus!.count as string)).toBe(1);
    });

    it('should filter incidents by date range', async () => {
      const startDate = new Date('2025-01-10');
      const endDate = new Date('2025-01-20');

      const incidents = await db('incidents')
        .where('farm_id', farmId)
        .whereBetween('incident_date', [startDate, endDate]);

      expect(incidents).toHaveLength(3);
    });
  });

  describe('Witness Tracking', () => {
    it('should track witnesses for an incident', async () => {
      const [incident] = await db('incidents')
        .insert({
          farm_id: farmId,
          worker_id: workerId,
          incident_date: new Date('2025-01-15'),
          incident_time: '14:30',
          location: 'North Field',
          description: 'Test incident with witnesses',
          incident_type: 'injury',
          severity: 'first_aid',
          witness_ids: [witnessId],
        })
        .returning('*');

      expect(incident.witness_ids).toContain(witnessId);

      // Retrieve witness details
      const witnesses = await db('workers')
        .whereIn('id', incident.witness_ids)
        .select('id', 'first_name', 'last_name', 'phone');

      expect(witnesses).toHaveLength(1);
      expect(witnesses[0].first_name).toBe('Jane');
      expect(witnesses[0].last_name).toBe('Smith');
    });
  });

  describe('Data Validation', () => {
    it('should enforce foreign key constraints for worker_id', async () => {
      const invalidWorkerId = '00000000-0000-0000-0000-000000000000';

      await expect(
        db('incidents').insert({
          farm_id: farmId,
          worker_id: invalidWorkerId,
          incident_date: new Date('2025-01-15'),
          incident_time: '14:30',
          location: 'North Field',
          description: 'Test incident',
          incident_type: 'injury',
          severity: 'first_aid',
        })
      ).rejects.toThrow();
    });

    it('should cascade delete incidents when worker is deleted', async () => {
      const [incident] = await db('incidents')
        .insert({
          farm_id: farmId,
          worker_id: workerId,
          incident_date: new Date('2025-01-15'),
          incident_time: '14:30',
          location: 'North Field',
          description: 'Test incident',
          incident_type: 'injury',
          severity: 'first_aid',
        })
        .returning('*');

      await db('workers').where('id', workerId).delete();

      const found = await db('incidents').where('id', incident.id).first();
      expect(found).toBeUndefined();
    });
  });
});
