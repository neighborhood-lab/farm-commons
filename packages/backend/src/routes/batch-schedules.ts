// Batch Scheduling routes
// Create multiple schedules at once with conflict detection and rollback

import express from 'express';
import { batchScheduleSchema, createScheduleSchema } from '@farm-commons/shared';
import db from '../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(authenticateToken);

// Helper function to check for schedule conflicts
async function checkScheduleConflicts(
  farmId: string,
  schedules: Array<{ worker_id: string; scheduled_date: Date | string; start_time: string; end_time: string }>,
  trx?: any
) {
  const conflicts = [];
  const queryBuilder = trx || db;

  for (const schedule of schedules) {
    // Convert scheduled_date to Date if it's a string
    const scheduleDate = typeof schedule.scheduled_date === 'string'
      ? new Date(schedule.scheduled_date)
      : schedule.scheduled_date;

    // Check if worker already has a schedule on the same date with overlapping times
    const existingSchedules = await queryBuilder('schedules')
      .where({
        farm_id: farmId,
        worker_id: schedule.worker_id,
        scheduled_date: scheduleDate,
      })
      .whereNot('status', 'cancelled')
      .select('id', 'start_time', 'end_time', 'task_type');

    for (const existing of existingSchedules) {
      // Check for time overlap
      const newStart = schedule.start_time;
      const newEnd = schedule.end_time;
      const existingStart = existing.start_time;
      const existingEnd = existing.end_time;

      // Two schedules overlap if:
      // (newStart < existingEnd) AND (newEnd > existingStart)
      if (newStart < existingEnd && newEnd > existingStart) {
        conflicts.push({
          worker_id: schedule.worker_id,
          date: scheduleDate,
          new_time: `${newStart}-${newEnd}`,
          existing_time: `${existingStart}-${existingEnd}`,
          existing_task: existing.task_type,
          existing_schedule_id: existing.id,
        });
      }
    }
  }

  return conflicts;
}

// Helper function to validate worker and field existence
async function validateEntities(farmId: string, schedules: any[], trx?: any) {
  const queryBuilder = trx || db;
  const errors = [];

  // Get all unique worker IDs and field IDs
  const workerIds = [...new Set(schedules.map((s) => s.worker_id))];
  const fieldIds = [...new Set(schedules.map((s) => s.field_id).filter(Boolean))];

  // Validate all workers exist and belong to the farm
  if (workerIds.length > 0) {
    const workers = await queryBuilder('workers')
      .whereIn('id', workerIds)
      .where({ farm_id: farmId })
      .select('id');

    const foundWorkerIds = new Set(workers.map((w: any) => w.id));
    const missingWorkers = workerIds.filter((id) => !foundWorkerIds.has(id));

    if (missingWorkers.length > 0) {
      errors.push({
        type: 'invalid_workers',
        message: `Workers not found or do not belong to farm: ${missingWorkers.join(', ')}`,
        worker_ids: missingWorkers,
      });
    }
  }

  // Validate all fields exist and belong to the farm
  if (fieldIds.length > 0) {
    const fields = await queryBuilder('fields')
      .whereIn('id', fieldIds)
      .where({ farm_id: farmId })
      .select('id');

    const foundFieldIds = new Set(fields.map((f: any) => f.id));
    const missingFields = fieldIds.filter((id) => !foundFieldIds.has(id));

    if (missingFields.length > 0) {
      errors.push({
        type: 'invalid_fields',
        message: `Fields not found or do not belong to farm: ${missingFields.join(', ')}`,
        field_ids: missingFields,
      });
    }
  }

  return errors;
}

// POST /api/schedules/batch - Bulk create schedules
router.post('/', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  let trx;

  try {
    const data = batchScheduleSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    if (!farmId) {
      throw new AppError('Farm ID is required', 400);
    }

    // Validate all schedules
    const validatedSchedules = data.schedules.map((schedule) =>
      createScheduleSchema.parse(schedule)
    );

    // Start a database transaction for atomic operations
    trx = await db.transaction();

    // Validate that all workers and fields exist
    const validationErrors = await validateEntities(farmId, validatedSchedules, trx);

    if (validationErrors.length > 0) {
      await trx.rollback();
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        validation_errors: validationErrors,
      });
    }

    // Check for scheduling conflicts if requested
    if (data.validate_conflicts) {
      const conflicts = await checkScheduleConflicts(farmId, validatedSchedules, trx);

      if (conflicts.length > 0) {
        await trx.rollback();
        return res.status(409).json({
          success: false,
          error: 'Schedule conflicts detected',
          conflicts,
        });
      }
    }

    // Insert all schedules in the transaction
    const schedulesToInsert = validatedSchedules.map((schedule) => ({
      ...schedule,
      farm_id: farmId,
      status: 'scheduled',
    }));

    const createdSchedules = await trx('schedules')
      .insert(schedulesToInsert)
      .returning('*');

    // Commit the transaction
    await trx.commit();

    res.status(201).json({
      success: true,
      data: {
        created_count: createdSchedules.length,
        schedules: createdSchedules,
      },
      message: `Successfully created ${createdSchedules.length} schedule(s)`,
    });
  } catch (error) {
    // Rollback transaction on any error
    if (trx) {
      await trx.rollback();
    }
    next(error);
  }
});

// POST /api/schedules/batch/validate - Validate batch without creating
router.post('/validate', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const data = batchScheduleSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    if (!farmId) {
      throw new AppError('Farm ID is required', 400);
    }

    // Validate all schedules
    const validatedSchedules = data.schedules.map((schedule) =>
      createScheduleSchema.parse(schedule)
    );

    // Validate that all workers and fields exist
    const validationErrors = await validateEntities(farmId, validatedSchedules);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        valid: false,
        validation_errors: validationErrors,
      });
    }

    // Check for scheduling conflicts
    const conflicts = await checkScheduleConflicts(farmId, validatedSchedules);

    res.json({
      success: true,
      valid: conflicts.length === 0,
      schedule_count: validatedSchedules.length,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      message: conflicts.length === 0
        ? `All ${validatedSchedules.length} schedule(s) are valid and can be created`
        : `Found ${conflicts.length} conflict(s)`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
