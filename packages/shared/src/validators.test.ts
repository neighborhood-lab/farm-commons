import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  createWorkerSchema,
  updateWorkerSchema,
  createFieldSchema,
  updateFieldSchema,
  createScheduleSchema,
  updateScheduleSchema,
  clockInSchema,
  clockOutSchema,
  createCertificationSchema,
  updateCertificationSchema,
  paginationSchema,
  dateRangeSchema,
  farmStatsQuerySchema,
  workerStatsQuerySchema,
  laborHoursQuerySchema,
  fieldUtilizationQuerySchema,
  expiringCertificationsQuerySchema,
  fileUploadSchema,
  fileValidationSchema,
  certificationDocumentUploadSchema,
} from './validators';

describe('Authentication Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const result = loginSchema.parse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.email).toBe('test@example.com');
    });

    it('should reject invalid email', () => {
      expect(() =>
        loginSchema.parse({
          email: 'invalid-email',
          password: 'password123',
        })
      ).toThrow();
    });

    it('should reject short password', () => {
      expect(() =>
        loginSchema.parse({
          email: 'test@example.com',
          password: 'short',
        })
      ).toThrow();
    });
  });

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const result = registerSchema.parse({
        email: 'test@example.com',
        password: 'password123',
        role: 'worker',
        farm_id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.role).toBe('worker');
    });

    it('should reject invalid role', () => {
      expect(() =>
        registerSchema.parse({
          email: 'test@example.com',
          password: 'password123',
          role: 'invalid-role',
          farm_id: '550e8400-e29b-41d4-a716-446655440000',
        })
      ).toThrow();
    });
  });
});

describe('Worker Schemas', () => {
  describe('createWorkerSchema', () => {
    it('should validate correct worker data', () => {
      const result = createWorkerSchema.parse({
        first_name: 'John',
        last_name: 'Doe',
        phone: '1234567890',
        hire_date: '2024-01-01',
      });
      expect(result.first_name).toBe('John');
      expect(result.status).toBe('active');
    });

    it('should handle optional fields', () => {
      const result = createWorkerSchema.parse({
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '9876543210',
        email: 'jane@example.com',
        hire_date: '2024-01-01',
        hourly_rate: 15.5,
        skills: ['tractor', 'irrigation'],
      });
      expect(result.email).toBe('jane@example.com');
      expect(result.skills).toEqual(['tractor', 'irrigation']);
    });

    it('should reject negative hourly rate', () => {
      expect(() =>
        createWorkerSchema.parse({
          first_name: 'John',
          last_name: 'Doe',
          phone: '1234567890',
          hire_date: '2024-01-01',
          hourly_rate: -10,
        })
      ).toThrow();
    });
  });

  describe('updateWorkerSchema', () => {
    it('should allow partial updates', () => {
      const result = updateWorkerSchema.parse({
        first_name: 'UpdatedName',
      });
      expect(result.first_name).toBe('UpdatedName');
    });
  });
});

describe('Field Schemas', () => {
  describe('createFieldSchema', () => {
    it('should validate correct field data', () => {
      const result = createFieldSchema.parse({
        name: 'North Field',
        size_acres: 5.5,
        location_gps: { lat: 45.5, lng: -122.5 },
      });
      expect(result.name).toBe('North Field');
      expect(result.size_acres).toBe(5.5);
    });

    it('should reject invalid GPS coordinates', () => {
      expect(() =>
        createFieldSchema.parse({
          name: 'Field',
          size_acres: 5,
          location_gps: { lat: 100, lng: -122.5 },
        })
      ).toThrow();

      expect(() =>
        createFieldSchema.parse({
          name: 'Field',
          size_acres: 5,
          location_gps: { lat: 45, lng: 200 },
        })
      ).toThrow();
    });

    it('should reject negative size', () => {
      expect(() =>
        createFieldSchema.parse({
          name: 'Field',
          size_acres: -5,
        })
      ).toThrow();
    });
  });

  describe('updateFieldSchema', () => {
    it('should allow partial updates', () => {
      const result = updateFieldSchema.parse({
        current_crop: 'Tomatoes',
      });
      expect(result.current_crop).toBe('Tomatoes');
    });
  });
});

describe('Schedule Schemas', () => {
  describe('createScheduleSchema', () => {
    it('should validate correct schedule data', () => {
      const result = createScheduleSchema.parse({
        worker_id: '550e8400-e29b-41d4-a716-446655440000',
        scheduled_date: '2024-01-15',
        start_time: '08:00',
        end_time: '17:00',
        task_type: 'Planting',
      });
      expect(result.task_type).toBe('Planting');
    });

    it('should reject invalid time format', () => {
      expect(() =>
        createScheduleSchema.parse({
          worker_id: '550e8400-e29b-41d4-a716-446655440000',
          scheduled_date: '2024-01-15',
          start_time: '8:00',
          end_time: '17:00',
          task_type: 'Planting',
        })
      ).toThrow();

      expect(() =>
        createScheduleSchema.parse({
          worker_id: '550e8400-e29b-41d4-a716-446655440000',
          scheduled_date: '2024-01-15',
          start_time: '08:00',
          end_time: '25:00',
          task_type: 'Planting',
        })
      ).toThrow();
    });
  });

  describe('updateScheduleSchema', () => {
    it('should allow status updates', () => {
      const result = updateScheduleSchema.parse({
        status: 'completed',
      });
      expect(result.status).toBe('completed');
    });
  });
});

describe('Time Entry Schemas', () => {
  describe('clockInSchema', () => {
    it('should validate correct clock in data', () => {
      const result = clockInSchema.parse({
        worker_id: '550e8400-e29b-41d4-a716-446655440000',
        task_type: 'Harvesting',
      });
      expect(result.task_type).toBe('Harvesting');
    });

    it('should handle optional fields', () => {
      const result = clockInSchema.parse({
        worker_id: '550e8400-e29b-41d4-a716-446655440000',
        task_type: 'Harvesting',
        field_id: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Starting harvest',
      });
      expect(result.notes).toBe('Starting harvest');
    });
  });

  describe('clockOutSchema', () => {
    it('should validate clock out data', () => {
      const result = clockOutSchema.parse({
        break_minutes: 30,
      });
      expect(result.break_minutes).toBe(30);
    });

    it('should use default break minutes', () => {
      const result = clockOutSchema.parse({});
      expect(result.break_minutes).toBe(0);
    });

    it('should reject negative break minutes', () => {
      expect(() =>
        clockOutSchema.parse({
          break_minutes: -10,
        })
      ).toThrow();
    });
  });
});

describe('Certification Schemas', () => {
  describe('createCertificationSchema', () => {
    it('should validate correct certification data', () => {
      const result = createCertificationSchema.parse({
        worker_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Forklift License',
        issuing_organization: 'OSHA',
        issue_date: '2024-01-01',
      });
      expect(result.name).toBe('Forklift License');
      expect(result.verified).toBe(false);
    });

    it('should handle optional expiration date', () => {
      const result = createCertificationSchema.parse({
        worker_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Safety Training',
        issuing_organization: 'Farm Safety',
        issue_date: '2024-01-01',
        expiration_date: '2025-01-01',
      });
      expect(result.expiration_date).toBeInstanceOf(Date);
    });
  });

  describe('updateCertificationSchema', () => {
    it('should allow partial updates', () => {
      const result = updateCertificationSchema.parse({
        verified: true,
      });
      expect(result.verified).toBe(true);
    });

    it('should not allow worker_id updates', () => {
      const schema = updateCertificationSchema;
      const result = schema.parse({ name: 'Updated Cert' });
      expect(result).not.toHaveProperty('worker_id');
    });
  });
});

describe('Query Schemas', () => {
  describe('paginationSchema', () => {
    it('should parse pagination params', () => {
      const result = paginationSchema.parse({
        page: '2',
        per_page: '50',
      });
      expect(result.page).toBe(2);
      expect(result.per_page).toBe(50);
    });

    it('should use defaults', () => {
      const result = paginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.per_page).toBe(20);
    });
  });

  describe('dateRangeSchema', () => {
    it('should validate date range', () => {
      const result = dateRangeSchema.parse({
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      });
      expect(result.start_date).toBeInstanceOf(Date);
      expect(result.end_date).toBeInstanceOf(Date);
    });
  });
});

describe('Statistics Query Schemas', () => {
  describe('farmStatsQuerySchema', () => {
    it('should accept optional date range', () => {
      const result = farmStatsQuerySchema.parse({
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      });
      expect(result.start_date).toBeInstanceOf(Date);
    });

    it('should work with no params', () => {
      const result = farmStatsQuerySchema.parse({});
      expect(result).toEqual({});
    });
  });

  describe('workerStatsQuerySchema', () => {
    it('should validate worker stats query', () => {
      const result = workerStatsQuerySchema.parse({
        worker_id: '550e8400-e29b-41d4-a716-446655440000',
        start_date: '2024-01-01',
      });
      expect(result.worker_id).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should require worker_id', () => {
      expect(() =>
        workerStatsQuerySchema.parse({
          start_date: '2024-01-01',
        })
      ).toThrow();
    });
  });

  describe('laborHoursQuerySchema', () => {
    it('should validate labor hours query', () => {
      const result = laborHoursQuerySchema.parse({
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        group_by: 'month',
      });
      expect(result.group_by).toBe('month');
    });

    it('should use default group_by', () => {
      const result = laborHoursQuerySchema.parse({
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      });
      expect(result.group_by).toBe('week');
    });

    it('should reject invalid group_by', () => {
      expect(() =>
        laborHoursQuerySchema.parse({
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          group_by: 'year',
        })
      ).toThrow();
    });
  });

  describe('fieldUtilizationQuerySchema', () => {
    it('should validate field utilization query', () => {
      const result = fieldUtilizationQuerySchema.parse({
        field_id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.field_id).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should work with all optional params', () => {
      const result = fieldUtilizationQuerySchema.parse({});
      expect(result).toEqual({});
    });
  });

  describe('expiringCertificationsQuerySchema', () => {
    it('should validate expiring certifications query', () => {
      const result = expiringCertificationsQuerySchema.parse({
        days: 60,
      });
      expect(result.days).toBe(60);
    });

    it('should use default days', () => {
      const result = expiringCertificationsQuerySchema.parse({});
      expect(result.days).toBe(30);
    });

    it('should reject negative or zero days', () => {
      expect(() =>
        expiringCertificationsQuerySchema.parse({
          days: 0,
        })
      ).toThrow();

      expect(() =>
        expiringCertificationsQuerySchema.parse({
          days: -10,
        })
      ).toThrow();
    });
  });
});

describe('File Upload Schemas', () => {
  describe('fileUploadSchema', () => {
    it('should validate file upload data', () => {
      const result = fileUploadSchema.parse({
        file: {},
        file_type: 'certification',
        description: 'Forklift certification document',
      });
      expect(result.file_type).toBe('certification');
    });

    it('should reject invalid file type', () => {
      expect(() =>
        fileUploadSchema.parse({
          file: {},
          file_type: 'video',
        })
      ).toThrow();
    });

    it('should handle optional description', () => {
      const result = fileUploadSchema.parse({
        file: {},
        file_type: 'image',
      });
      expect(result.description).toBeUndefined();
    });
  });

  describe('fileValidationSchema', () => {
    it('should validate allowed file types', () => {
      const result = fileValidationSchema.parse({
        filename: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024 * 1024, // 1MB
      });
      expect(result.mimetype).toBe('application/pdf');
    });

    it('should reject files that are too large', () => {
      expect(() =>
        fileValidationSchema.parse({
          filename: 'large.pdf',
          mimetype: 'application/pdf',
          size: 11 * 1024 * 1024, // 11MB
        })
      ).toThrow();
    });

    it('should reject disallowed file types', () => {
      expect(() =>
        fileValidationSchema.parse({
          filename: 'video.mp4',
          mimetype: 'video/mp4',
          size: 1024,
        })
      ).toThrow();
    });

    it('should accept various image formats', () => {
      const imageFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

      imageFormats.forEach((mimetype) => {
        const result = fileValidationSchema.parse({
          filename: 'image.jpg',
          mimetype,
          size: 1024,
        });
        expect(result.mimetype).toBe(mimetype);
      });
    });

    it('should accept document formats', () => {
      const docFormats = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      docFormats.forEach((mimetype) => {
        const result = fileValidationSchema.parse({
          filename: 'document.pdf',
          mimetype,
          size: 1024,
        });
        expect(result.mimetype).toBe(mimetype);
      });
    });
  });

  describe('certificationDocumentUploadSchema', () => {
    it('should validate certification document upload', () => {
      const result = certificationDocumentUploadSchema.parse({
        certification_id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.certification_id).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should accept optional document URL', () => {
      const result = certificationDocumentUploadSchema.parse({
        certification_id: '550e8400-e29b-41d4-a716-446655440000',
        document_url: 'https://example.com/cert.pdf',
      });
      expect(result.document_url).toBe('https://example.com/cert.pdf');
    });

    it('should reject invalid certification ID', () => {
      expect(() =>
        certificationDocumentUploadSchema.parse({
          certification_id: 'invalid-uuid',
        })
      ).toThrow();
    });

    it('should reject invalid URL', () => {
      expect(() =>
        certificationDocumentUploadSchema.parse({
          certification_id: '550e8400-e29b-41d4-a716-446655440000',
          document_url: 'not-a-url',
        })
      ).toThrow();
    });
  });
});
