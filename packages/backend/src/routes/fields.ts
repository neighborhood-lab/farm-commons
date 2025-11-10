// Field management routes

import express from 'express';
import { createFieldSchema, updateFieldSchema, paginationSchema } from '@farm-commons/shared';
import db from '../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// All field routes require authentication
router.use(authenticateToken);

// List all fields for farm
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { page, per_page } = paginationSchema.parse(req.query);
    const farmId = req.user?.farm_id;

    const offset = (page - 1) * per_page;

    const [fields, [{ count }]] = await Promise.all([
      db('fields')
        .where({ farm_id: farmId })
        .orderBy('name', 'asc')
        .limit(per_page)
        .offset(offset)
        .select('*'),
      db('fields')
        .where({ farm_id: farmId })
        .count('* as count'),
    ]);

    res.json({
      success: true,
      data: {
        data: fields,
        total: parseInt(count as string),
        page,
        per_page,
        total_pages: Math.ceil(parseInt(count as string) / per_page),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get single field with crop history
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    // Get field details
    const field = await db('fields')
      .where({ id, farm_id: farmId })
      .first();

    if (!field) {
      throw new AppError('Field not found', 404);
    }

    // Get crop history from schedules
    const cropHistory = await db('schedules')
      .where({
        farm_id: farmId,
        field_id: id,
      })
      .whereIn('task_type', ['planting', 'harvesting', 'cultivation'])
      .select('task_type', 'task_description', 'scheduled_date', 'status')
      .orderBy('scheduled_date', 'desc')
      .limit(20);

    res.json({
      success: true,
      data: {
        ...field,
        crop_history: cropHistory,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get all schedules for a field
router.get('/:id/schedules', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    // Verify field exists and belongs to farm
    const field = await db('fields')
      .where({ id, farm_id: farmId })
      .first();

    if (!field) {
      throw new AppError('Field not found', 404);
    }

    // Get all schedules for the field
    const schedules = await db('schedules')
      .where({
        farm_id: farmId,
        field_id: id,
      })
      .leftJoin('workers', 'schedules.worker_id', 'workers.id')
      .select(
        'schedules.*',
        'workers.first_name as worker_first_name',
        'workers.last_name as worker_last_name'
      )
      .orderBy('schedules.scheduled_date', 'desc');

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
});

// Create new field with GPS coordinates
router.post('/', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const data = createFieldSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    const [field] = await db('fields')
      .insert({
        ...data,
        farm_id: farmId,
      })
      .returning('*');

    res.status(201).json({
      success: true,
      data: field,
    });
  } catch (error) {
    next(error);
  }
});

// Update field details
router.put('/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateFieldSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    const [field] = await db('fields')
      .where({ id, farm_id: farmId })
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    if (!field) {
      throw new AppError('Field not found', 404);
    }

    res.json({
      success: true,
      data: field,
    });
  } catch (error) {
    next(error);
  }
});

// Delete field (hard delete for now - TODO: implement soft delete with migration)
router.delete('/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    // Check if field has associated schedules or time entries
    const [schedulesCount, timeEntriesCount] = await Promise.all([
      db('schedules')
        .where({ field_id: id })
        .count('* as count')
        .first(),
      db('time_entries')
        .where({ field_id: id })
        .count('* as count')
        .first(),
    ]);

    const hasSchedules = parseInt(schedulesCount?.count as string || '0') > 0;
    const hasTimeEntries = parseInt(timeEntriesCount?.count as string || '0') > 0;

    if (hasSchedules || hasTimeEntries) {
      throw new AppError(
        'Cannot delete field with associated schedules or time entries. Consider archiving instead.',
        400
      );
    }

    const deleted = await db('fields')
      .where({ id, farm_id: farmId })
      .delete();

    if (!deleted) {
      throw new AppError('Field not found', 404);
    }

    res.json({
      success: true,
      message: 'Field deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
