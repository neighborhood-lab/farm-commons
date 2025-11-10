// Scheduling routes

import express, { type Router } from 'express';
import { createScheduleSchema, updateScheduleSchema, dateRangeSchema } from '@farm-commons/shared';
import db from '../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { auditLog } from '../middleware/auditLog.js';

const router: Router = express.Router();

router.use(authenticateToken);

// Get schedules (with optional date range filter)
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;

    // Build filters
    const filters: any = {};
    if (req.query.start_date && req.query.end_date) {
      const { start_date, end_date } = dateRangeSchema.parse(req.query);
      filters.start_date = start_date;
      filters.end_date = end_date;
    }
    if (req.query.status) {
      filters.status = req.query.status;
    }

    // Use optimized query with database view
    const schedules = await getSchedulesDetailed(farmId!, filters);

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
});

// Get upcoming schedules
router.get('/upcoming', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;
    const daysAhead = parseInt(req.query.days as string) || 7;
    const limit = parseInt(req.query.limit as string) || 50;

    const schedules = await getUpcomingSchedules(farmId!, daysAhead, limit);

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
});

// Get worker's schedule
router.get('/worker/:workerId', async (req: AuthRequest, res, next) => {
  try {
    const { workerId } = req.params;
    const farmId = req.user?.farm_id;

    const schedules = await db('schedules')
      .where({
        farm_id: farmId,
        worker_id: workerId,
      })
      .leftJoin('fields', 'schedules.field_id', 'fields.id')
      .select('schedules.*', 'fields.name as field_name')
      .orderBy('schedules.scheduled_date', 'asc');

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
});

// Create schedule
router.post('/', requireRole('admin', 'manager'), auditLog('create', 'schedule'), async (req: AuthRequest, res, next) => {
  try {
    const data = createScheduleSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    const [schedule] = await db('schedules')
      .insert({
        ...data,
        farm_id: farmId,
      })
      .returning('*');

    res.status(201).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
});

// Update schedule
router.put('/:id', requireRole('admin', 'manager'), auditLog('update', 'schedule'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateScheduleSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    const [schedule] = await db('schedules')
      .where({ id, farm_id: farmId })
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    if (!schedule) {
      throw new AppError('Schedule not found', 404);
    }

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
});

// Delete schedule
router.delete('/:id', requireRole('admin', 'manager'), auditLog('delete', 'schedule'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    const deleted = await db('schedules').where({ id, farm_id: farmId }).delete();

    if (!deleted) {
      throw new AppError('Schedule not found', 404);
    }

    res.json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
