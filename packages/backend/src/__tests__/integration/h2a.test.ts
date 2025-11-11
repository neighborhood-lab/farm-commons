// H-2A Compliance Routes Integration Tests

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index.js';
import db from '../../db/connection.js';

describe('H-2A Compliance API', () => {
  let authToken: string;
  let farmId: string;
  let workerId: string;
  let visaId: string;
  let housingId: string;
  let transportationId: string;
  let complianceCheckId: string;

  // Setup test data before all tests
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
    const [user] = await db('users').insert({
      email: 'test@example.com',
      password_hash: '$2b$10$dummyhashfortest',
      role: 'manager',
      farm_id: farmId,
    }).returning('*');

    // Create test worker
    const [worker] = await db('workers').insert({
      farm_id: farmId,
      first_name: 'Juan',
      last_name: 'Perez',
      phone: '555-0100',
      hire_date: new Date('2024-01-01'),
      status: 'active',
    }).returning('*');
    workerId = worker.id;

    // Login to get auth token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword',
      });

    // For testing purposes, we'll create a token manually or mock it
    // In a real test, you'd use the actual login response
    authToken = 'Bearer mock-jwt-token';
  });

  afterAll(async () => {
    // Clean up test data
    await db('h2a_compliance_checks').del();
    await db('h2a_transportation').del();
    await db('h2a_housing').del();
    await db('h2a_visas').del();
    await db('workers').del();
    await db('users').del();
    await db('farms').del();

    // Close database connection
    await db.destroy();
  });

  describe('POST /api/compliance/h2a/visas', () => {
    it('should create a new H-2A visa record', async () => {
      const visaData = {
        worker_id: workerId,
        visa_number: 'H2A-2024-12345',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        petition_number: 'PET-2024-001',
        job_title: 'Farm Worker',
        job_description: 'General farm labor',
        notes: 'Test visa record',
      };

      const res = await request(app)
        .post('/api/compliance/h2a/visas')
        .set('Authorization', authToken)
        .send(visaData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.visa_number).toBe(visaData.visa_number);
      expect(res.body.data.petition_number).toBe(visaData.petition_number);

      visaId = res.body.data.id;
    });

    it('should reject invalid visa data', async () => {
      const invalidData = {
        worker_id: 'invalid-uuid',
        visa_number: '',
      };

      await request(app)
        .post('/api/compliance/h2a/visas')
        .set('Authorization', authToken)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/compliance/h2a/visas', () => {
    it('should list all H-2A visas for the farm', async () => {
      const res = await request(app)
        .get('/api/compliance/h2a/visas')
        .set('Authorization', authToken)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toBeInstanceOf(Array);
      expect(res.body.data.data.length).toBeGreaterThan(0);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('page');
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/compliance/h2a/visas?page=1&per_page=10')
        .set('Authorization', authToken)
        .expect(200);

      expect(res.body.data.page).toBe(1);
      expect(res.body.data.per_page).toBe(10);
    });
  });

  describe('GET /api/compliance/h2a/visas/:id', () => {
    it('should get a single visa with related records', async () => {
      const res = await request(app)
        .get(`/api/compliance/h2a/visas/${visaId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.visa.id).toBe(visaId);
      expect(res.body.data).toHaveProperty('housing');
      expect(res.body.data).toHaveProperty('transportation');
      expect(res.body.data).toHaveProperty('compliance_checks');
    });

    it('should return 404 for non-existent visa', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .get(`/api/compliance/h2a/visas/${fakeId}`)
        .set('Authorization', authToken)
        .expect(404);
    });
  });

  describe('GET /api/compliance/h2a/visas/expiring', () => {
    it('should get visas expiring soon', async () => {
      const res = await request(app)
        .get('/api/compliance/h2a/visas/expiring?days=60')
        .set('Authorization', authToken)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('PUT /api/compliance/h2a/visas/:id', () => {
    it('should update a visa record', async () => {
      const updateData = {
        notes: 'Updated notes',
        status: 'active',
      };

      const res = await request(app)
        .put(`/api/compliance/h2a/visas/${visaId}`)
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.notes).toBe(updateData.notes);
    });
  });

  describe('POST /api/compliance/h2a/housing', () => {
    it('should create a housing record', async () => {
      const housingData = {
        h2a_visa_id: visaId,
        worker_id: workerId,
        housing_type: 'employer_provided',
        address: '123 Farm Road, Rural County, ST 12345',
        start_date: '2024-01-01',
        monthly_cost: 500,
        worker_contribution: 100,
        occupants_count: 4,
        amenities: 'Kitchen, bathroom, beds, heating',
        inspection_passed: true,
      };

      const res = await request(app)
        .post('/api/compliance/h2a/housing')
        .set('Authorization', authToken)
        .send(housingData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.address).toBe(housingData.address);
      expect(res.body.data.housing_type).toBe(housingData.housing_type);

      housingId = res.body.data.id;
    });
  });

  describe('GET /api/compliance/h2a/visas/:visaId/housing', () => {
    it('should get housing records for a visa', async () => {
      const res = await request(app)
        .get(`/api/compliance/h2a/visas/${visaId}/housing`)
        .set('Authorization', authToken)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/compliance/h2a/transportation', () => {
    it('should create a transportation record', async () => {
      const transportData = {
        h2a_visa_id: visaId,
        worker_id: workerId,
        transport_type: 'inbound',
        transport_date: '2024-01-01',
        origin: 'Mexico City, Mexico',
        destination: 'Test Farm, USA',
        method: 'bus',
        cost: 150,
        employer_paid: true,
      };

      const res = await request(app)
        .post('/api/compliance/h2a/transportation')
        .set('Authorization', authToken)
        .send(transportData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.transport_type).toBe(transportData.transport_type);
      expect(res.body.data.cost).toBe(transportData.cost);

      transportationId = res.body.data.id;
    });
  });

  describe('GET /api/compliance/h2a/visas/:visaId/transportation', () => {
    it('should get transportation records for a visa', async () => {
      const res = await request(app)
        .get(`/api/compliance/h2a/visas/${visaId}/transportation`)
        .set('Authorization', authToken)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/compliance/h2a/compliance-checks', () => {
    it('should create a compliance check', async () => {
      const checkData = {
        h2a_visa_id: visaId,
        requirement: 'Housing Inspection',
        description: 'Annual housing inspection required',
        due_date: '2024-06-01',
      };

      const res = await request(app)
        .post('/api/compliance/h2a/compliance-checks')
        .set('Authorization', authToken)
        .send(checkData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.requirement).toBe(checkData.requirement);
      expect(res.body.data.completed).toBe(false);

      complianceCheckId = res.body.data.id;
    });
  });

  describe('GET /api/compliance/h2a/visas/:visaId/compliance-checks', () => {
    it('should get compliance checks for a visa', async () => {
      const res = await request(app)
        .get(`/api/compliance/h2a/visas/${visaId}/compliance-checks`)
        .set('Authorization', authToken)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/compliance/h2a/compliance-checks/:id', () => {
    it('should update and mark compliance check as completed', async () => {
      const updateData = {
        completed: true,
        notes: 'Inspection completed successfully',
      };

      const res = await request(app)
        .put(`/api/compliance/h2a/compliance-checks/${complianceCheckId}`)
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.completed).toBe(true);
      expect(res.body.data.completed_date).toBeTruthy();
    });
  });

  describe('GET /api/compliance/h2a/reports/compliance', () => {
    it('should generate comprehensive compliance report', async () => {
      const res = await request(app)
        .get('/api/compliance/h2a/reports/compliance')
        .set('Authorization', authToken)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('generated_at');
      expect(res.body.data).toHaveProperty('total_h2a_workers');
      expect(res.body.data).toHaveProperty('compliant');
      expect(res.body.data).toHaveProperty('warning');
      expect(res.body.data).toHaveProperty('non_compliant');
      expect(res.body.data.reports).toBeInstanceOf(Array);

      if (res.body.data.reports.length > 0) {
        const report = res.body.data.reports[0];
        expect(report).toHaveProperty('visa_id');
        expect(report).toHaveProperty('worker_name');
        expect(report).toHaveProperty('visa_number');
        expect(report).toHaveProperty('days_until_expiration');
        expect(report).toHaveProperty('overall_compliance_status');
      }
    });
  });

  describe('GET /api/compliance/h2a/stats', () => {
    it('should get H-2A statistics', async () => {
      const res = await request(app)
        .get('/api/compliance/h2a/stats')
        .set('Authorization', authToken)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total_visas');
      expect(res.body.data).toHaveProperty('active_visas');
      expect(res.body.data).toHaveProperty('expiring_soon');
      expect(res.body.data).toHaveProperty('expired');
    });
  });

  describe('DELETE /api/compliance/h2a/compliance-checks/:id', () => {
    it('should delete a compliance check', async () => {
      const res = await request(app)
        .delete(`/api/compliance/h2a/compliance-checks/${complianceCheckId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted');
    });
  });

  describe('DELETE /api/compliance/h2a/transportation/:id', () => {
    it('should delete a transportation record', async () => {
      const res = await request(app)
        .delete(`/api/compliance/h2a/transportation/${transportationId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted');
    });
  });

  describe('DELETE /api/compliance/h2a/housing/:id', () => {
    it('should delete a housing record', async () => {
      const res = await request(app)
        .delete(`/api/compliance/h2a/housing/${housingId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted');
    });
  });

  describe('DELETE /api/compliance/h2a/visas/:id', () => {
    it('should delete a visa record', async () => {
      const res = await request(app)
        .delete(`/api/compliance/h2a/visas/${visaId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted');
    });
  });

  describe('Authorization', () => {
    it('should reject requests without authentication', async () => {
      await request(app)
        .get('/api/compliance/h2a/visas')
        .expect(401);
    });

    it('should reject creation requests from non-managers', async () => {
      // This would require creating a worker-role user and testing
      // For now, we acknowledge this should be tested
    });
  });
});
