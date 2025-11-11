// Data Import Service
// Bulk import workers and schedules from CSV files

import Papa from 'papaparse';
import { z } from 'zod';
import db from '../db/connection.js';
import { createWorkerSchema, createScheduleSchema } from '@farm-commons/shared';

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: ImportError[];
  warnings: string[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: unknown;
}

export interface ImportOptions {
  dryRun?: boolean;
  farmId: string;
  skipErrors?: boolean;
}

/**
 * Parse CSV file content
 */
function parseCSV<T>(content: string): Papa.ParseResult<T> {
  return Papa.parse<T>(content, {
    header: true,
    skipEmptyLines: true,
    trimHeaders: true,
    transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
  });
}

/**
 * Import workers from CSV
 *
 * Expected CSV columns:
 * - first_name (required)
 * - last_name (required)
 * - phone (required)
 * - email (optional)
 * - hire_date (required, YYYY-MM-DD format)
 * - status (optional: active, inactive, seasonal)
 * - hourly_rate (optional)
 * - piece_rate (optional)
 * - preferred_language (optional, default: en)
 * - emergency_contact_name (optional)
 * - emergency_contact_phone (optional)
 * - certifications (optional, comma-separated list)
 * - skills (optional, comma-separated list)
 * - notes (optional)
 */
export async function importWorkers(
  csvContent: string,
  options: ImportOptions
): Promise<ImportResult> {
  const { dryRun = false, farmId, skipErrors = false } = options;
  const errors: ImportError[] = [];
  const warnings: string[] = [];
  let imported = 0;

  // Parse CSV
  const parsed = parseCSV<Record<string, string>>(csvContent);

  if (parsed.issues.length > 0) {
    return {
      success: false,
      imported: 0,
      errors: parsed.issues.map((err, idx) => ({
        row: err.row ?? idx,
        message: `CSV parsing error: ${err.message}`,
      })),
      warnings,
    };
  }

  // Validate and prepare data
  const validatedWorkers: Array<{ row: number; data: z.infer<typeof createWorkerSchema> }> = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const row = i + 2; // Account for header row and 1-based indexing
    const rawData = parsed.data[i];

    try {
      // Transform certifications and skills from comma-separated strings to arrays
      const certifications = rawData.certifications
        ? rawData.certifications.split(',').map((c) => c.trim()).filter(Boolean)
        : [];
      const skills = rawData.skills
        ? rawData.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      // Validate data
      const workerData = createWorkerSchema.parse({
        first_name: rawData.first_name,
        last_name: rawData.last_name,
        email: rawData.email || null,
        phone: rawData.phone,
        preferred_language: rawData.preferred_language || 'en',
        emergency_contact_name: rawData.emergency_contact_name || null,
        emergency_contact_phone: rawData.emergency_contact_phone || null,
        hire_date: rawData.hire_date,
        status: rawData.status || 'active',
        hourly_rate: rawData.hourly_rate ? parseFloat(rawData.hourly_rate) : null,
        piece_rate: rawData.piece_rate ? parseFloat(rawData.piece_rate) : null,
        certifications,
        skills,
        notes: rawData.notes || null,
      });

      validatedWorkers.push({ row, data: workerData });

      // Warn if both hourly_rate and piece_rate are set
      if (workerData.hourly_rate && workerData.piece_rate) {
        warnings.push(`Row ${row}: Worker has both hourly_rate and piece_rate set`);
      }
    } catch (error) {
      const errorMessage = error instanceof z.ZodError
        ? error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
        : error instanceof Error
        ? error.message
        : 'Unknown validation error';

      errors.push({
        row,
        message: errorMessage,
        data: rawData,
      });

      if (!skipErrors) {
        continue;
      }
    }
  }

  // If dry run, return validation results only
  if (dryRun) {
    return {
      success: errors.length === 0,
      imported: validatedWorkers.length,
      errors,
      warnings,
    };
  }

  // Import valid workers
  if (validatedWorkers.length > 0) {
    try {
      await db.transaction(async (trx) => {
        for (const { data } of validatedWorkers) {
          await trx('workers').insert({
            ...data,
            farm_id: farmId,
          });
          imported++;
        }
      });
    } catch (error) {
      errors.push({
        row: 0,
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      return {
        success: false,
        imported: 0,
        errors,
        warnings,
      };
    }
  }

  return {
    success: errors.length === 0 || skipErrors,
    imported,
    errors,
    warnings,
  };
}

/**
 * Import schedules from CSV
 *
 * Expected CSV columns:
 * - worker_email or worker_phone (required, to identify worker)
 * - scheduled_date (required, YYYY-MM-DD format)
 * - start_time (required, HH:MM format)
 * - end_time (required, HH:MM format)
 * - task_type (required)
 * - task_description (optional)
 * - field_name (optional, to identify field)
 * - notes (optional)
 */
export async function importSchedules(
  csvContent: string,
  options: ImportOptions
): Promise<ImportResult> {
  const { dryRun = false, farmId, skipErrors = false } = options;
  const errors: ImportError[] = [];
  const warnings: string[] = [];
  let imported = 0;

  // Parse CSV
  const parsed = parseCSV<Record<string, string>>(csvContent);

  if (parsed.issues.length > 0) {
    return {
      success: false,
      imported: 0,
      errors: parsed.issues.map((err, idx) => ({
        row: err.row ?? idx,
        message: `CSV parsing error: ${err.message}`,
      })),
      warnings,
    };
  }

  // Pre-fetch workers and fields for this farm
  const workers = await db('workers')
    .where({ farm_id: farmId })
    .select('id', 'email', 'phone');

  const fields = await db('fields')
    .where({ farm_id: farmId })
    .select('id', 'name');

  // Create lookup maps
  const workerByEmail = new Map(
    workers.filter((w) => w.email).map((w) => [w.email!.toLowerCase(), w.id])
  );
  const workerByPhone = new Map(
    workers.map((w) => [w.phone.replace(/\D/g, ''), w.id])
  );
  const fieldByName = new Map(
    fields.map((f) => [f.name.toLowerCase(), f.id])
  );

  // Validate and prepare data
  const validatedSchedules: Array<{ row: number; data: z.infer<typeof createScheduleSchema> & { farm_id: string } }> = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const row = i + 2; // Account for header row and 1-based indexing
    const rawData = parsed.data[i];

    try {
      // Find worker by email or phone
      let workerId: string | undefined;

      if (rawData.worker_email) {
        workerId = workerByEmail.get(rawData.worker_email.toLowerCase());
        if (!workerId) {
          errors.push({
            row,
            field: 'worker_email',
            message: `Worker not found with email: ${rawData.worker_email}`,
            data: rawData,
          });
          if (!skipErrors) continue;
        }
      } else if (rawData.worker_phone) {
        const normalizedPhone = rawData.worker_phone.replace(/\D/g, '');
        workerId = workerByPhone.get(normalizedPhone);
        if (!workerId) {
          errors.push({
            row,
            field: 'worker_phone',
            message: `Worker not found with phone: ${rawData.worker_phone}`,
            data: rawData,
          });
          if (!skipErrors) continue;
        }
      } else {
        errors.push({
          row,
          message: 'Either worker_email or worker_phone is required',
          data: rawData,
        });
        if (!skipErrors) continue;
      }

      // Find field by name if provided
      let fieldId: string | null = null;
      if (rawData.field_name) {
        fieldId = fieldByName.get(rawData.field_name.toLowerCase()) || null;
        if (!fieldId) {
          warnings.push(`Row ${row}: Field not found: ${rawData.field_name}`);
        }
      }

      // Validate schedule data
      const scheduleData = createScheduleSchema.parse({
        worker_id: workerId,
        field_id: fieldId,
        scheduled_date: rawData.scheduled_date,
        start_time: rawData.start_time,
        end_time: rawData.end_time,
        task_type: rawData.task_type,
        task_description: rawData.task_description || null,
        notes: rawData.notes || null,
      });

      validatedSchedules.push({
        row,
        data: { ...scheduleData, farm_id: farmId },
      });
    } catch (error) {
      const errorMessage = error instanceof z.ZodError
        ? error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
        : error instanceof Error
        ? error.message
        : 'Unknown validation error';

      errors.push({
        row,
        message: errorMessage,
        data: rawData,
      });

      if (!skipErrors) {
        continue;
      }
    }
  }

  // If dry run, return validation results only
  if (dryRun) {
    return {
      success: errors.length === 0,
      imported: validatedSchedules.length,
      errors,
      warnings,
    };
  }

  // Import valid schedules
  if (validatedSchedules.length > 0) {
    try {
      await db.transaction(async (trx) => {
        for (const { data } of validatedSchedules) {
          await trx('schedules').insert(data);
          imported++;
        }
      });
    } catch (error) {
      errors.push({
        row: 0,
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      return {
        success: false,
        imported: 0,
        errors,
        warnings,
      };
    }
  }

  return {
    success: errors.length === 0 || skipErrors,
    imported,
    errors,
    warnings,
  };
}
