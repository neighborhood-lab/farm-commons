// Farm Commons Validation Schemas
// Zod schemas for request validation

import { z } from 'zod';

// User Schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'manager', 'worker']),
  farm_id: z.string().uuid(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(8),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
});

// Worker Schemas
export const createWorkerSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(10).max(20),
  preferred_language: z.string().default('en'),
  emergency_contact_name: z.string().optional().nullable(),
  emergency_contact_phone: z.string().optional().nullable(),
  hire_date: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  status: z.enum(['active', 'inactive', 'seasonal']).default('active'),
  hourly_rate: z.number().positive().optional().nullable(),
  piece_rate: z.number().positive().optional().nullable(),
  certifications: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
});

export const updateWorkerSchema = createWorkerSchema.partial();

// Field Schemas
export const createFieldSchema = z.object({
  name: z.string().min(1).max(200),
  size_acres: z.number().positive(),
  location_gps: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional()
    .nullable(),
  current_crop: z.string().optional().nullable(),
  soil_type: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateFieldSchema = createFieldSchema.partial();

// Schedule Schemas
export const createScheduleSchema = z.object({
  worker_id: z.string().uuid(),
  field_id: z.string().uuid().optional().nullable(),
  scheduled_date: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  task_type: z.string().min(1).max(100),
  task_description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateScheduleSchema = createScheduleSchema.partial().extend({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
});

// Time Entry Schemas
export const clockInSchema = z.object({
  worker_id: z.string().uuid(),
  task_type: z.string().min(1).max(100),
  field_id: z.string().uuid().optional().nullable(),
  schedule_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const clockOutSchema = z.object({
  break_minutes: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
});

// Certification Schemas
export const createCertificationSchema = z.object({
  worker_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  issuing_organization: z.string().min(1).max(200),
  issue_date: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  expiration_date: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional()
    .nullable(),
  document_url: z.string().url().optional().nullable(),
  verified: z.boolean().default(false),
});

export const updateCertificationSchema = createCertificationSchema
  .partial()
  .omit({ worker_id: true });

// Query Schemas
export const paginationSchema = z.object({
  page: z
    .string()
    .default('1')
    .transform((val) => Number.parseInt(val, 10)),
  per_page: z
    .string()
    .default('20')
    .transform((val) => Number.parseInt(val, 10)),
});

export const dateRangeSchema = z.object({
  start_date: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  end_date: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
});

// Invoice Schemas
export const createInvoiceSchema = z.object({
  client_name: z.string().min(1).max(200),
  client_address: z.string().optional().nullable(),
  client_email: z.string().email().optional().nullable(),
  invoice_date: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  due_date: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  period_start: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  period_end: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  tax_rate: z.number().min(0).max(100).default(0),
  notes: z.string().optional().nullable(),
  time_entry_ids: z.array(z.string().uuid()).optional(), // Optional: for auto-generating items
});

export const invoiceItemSchema = z.object({
  time_entry_id: z.string().uuid().optional().nullable(),
  worker_id: z.string().uuid().optional().nullable(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  rate: z.number().positive(),
});

export const updateInvoiceSchema = z.object({
  client_name: z.string().min(1).max(200).optional(),
  client_address: z.string().optional().nullable(),
  client_email: z.string().email().optional().nullable(),
  invoice_date: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  due_date: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  paid_date: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
});

// Statistics Query Schemas
export const farmStatsQuerySchema = z.object({
  start_date: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
  end_date: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
});

export const workerStatsQuerySchema = z.object({
  worker_id: z.string().uuid(),
  start_date: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
  end_date: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
});

export const laborHoursQuerySchema = z.object({
  start_date: z.string().or(z.date()).transform((val) => new Date(val)),
  end_date: z.string().or(z.date()).transform((val) => new Date(val)),
  group_by: z.enum(['day', 'week', 'month']).default('week'),
  worker_id: z.string().uuid().optional(),
});

export const fieldUtilizationQuerySchema = z.object({
  start_date: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
  end_date: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
  field_id: z.string().uuid().optional(),
});

export const expiringCertificationsQuerySchema = z.object({
  days: z.number().int().positive().default(30),
  worker_id: z.string().uuid().optional(),
});

// File Upload Schemas
export const fileUploadSchema = z.object({
  file: z.any(), // Will be validated by multer middleware
  file_type: z.enum(['certification', 'document', 'image']),
  description: z.string().max(500).optional(),
});

export const fileValidationSchema = z.object({
  filename: z.string().min(1).max(255),
  mimetype: z.string().refine(
    (mime) => {
      const allowedMimes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      return allowedMimes.includes(mime);
    },
    {
      message: 'File type not allowed. Allowed types: PDF, JPEG, PNG, WEBP, DOC, DOCX',
    }
  ),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
});

export const certificationDocumentUploadSchema = z.object({
  certification_id: z.string().uuid(),
  document_url: z.string().url().optional(), // For direct URL uploads
});
