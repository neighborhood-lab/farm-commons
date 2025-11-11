// Time tracking routes

import express, { type Router } from 'express';
import { clockInSchema, clockOutSchema, dateRangeSchema } from '@farm-commons/shared';
import { calculatePreciseHours } from '@farm-commons/shared';
import db from '../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { auditLog } from '../middleware/auditLog.js';

const router: Router = express.Router();

router.use(authenticateToken);

// Get time entries with optional filters
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
    if (req.query.verified !== undefined) {
      filters.verified = req.query.verified === 'true';
    }

    // Use optimized query with database view
    const entries = await getTimeEntriesDetailed(farmId!, filters);

    res.json({
      success: true,
      data: entries,
    });
  } catch {
    next(error);
  }
});

// Get unverified time entries
router.get('/unverified', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;
    const limit = Number.Number.parseInt(req.query.limit as string) || 50;

    const entries = await getUnverifiedTimeEntries(farmId!, limit);

    res.json({
      success: true,
      data: entries,
    });
  } catch {
    next(error);
  }
});

// Get active time entries (clocked in but not out)
router.get('/active', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;

    const entries = await getActiveTimeEntries(farmId!);

    res.json({
      success: true,
      data: entries,
    });
  } catch {
    next(error);
  }
});

// Get worker's time entries
router.get('/worker/:workerId', async (req: AuthRequest, res, next) => {
  try {
    const { workerId } = req.params;
    const farmId = req.user?.farm_id;

    const entries = await db('time_entries')
      .where({
        farm_id: farmId,
        worker_id: workerId,
      })
      .leftJoin('fields', 'time_entries.field_id', 'fields.id')
      .select('time_entries.*', 'fields.name as field_name')
      .orderBy('time_entries.clock_in', 'desc');

    res.json({
      success: true,
      data: entries,
    });
  } catch {
    next(error);
  }
});

// Clock in
router.post('/clock-in', auditLog('create', 'time_entry'), async (req: AuthRequest, res, next) => {
  try {
    const data = clockInSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Check if worker already has an open time entry
    const openEntry = await db('time_entries')
      .where({
        farm_id: farmId,
        worker_id: data.worker_id,
      })
      .whereNull('clock_out')
      .first();

    if (openEntry) {
      throw new AppError('Worker already has an open time entry', 400);
    }

    const [entry] = await db('time_entries')
      .insert({
        ...data,
        farm_id: farmId,
        clock_in: new Date(),
        break_minutes: 0,
      })
      .returning('*');

    res.status(201).json({
      success: true,
      data: entry,
    });
  } catch {
    next(error);
  }
});

// Clock out
router.post('/:id/clock-out', auditLog('update', 'time_entry'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { break_minutes, notes } = clockOutSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    const entry = await db('time_entries').where({ id, farm_id: farmId }).first();

    if (!entry) {
      throw new AppError('Time entry not found', 404);
    }

    if (entry.clock_out) {
      throw new AppError('Time entry already clocked out', 400);
    }

    const clockOut = new Date();
    const totalHours = calculatePreciseHours(entry.clock_in, clockOut) - break_minutes / 60;

    const [updatedEntry] = await db('time_entries')
      .where({ id, farm_id: farmId })
      .update({
        clock_out: clockOut,
        break_minutes,
        total_hours: totalHours,
        notes: notes || entry.notes,
        updated_at: new Date(),
      })
      .returning('*');

    res.json({
      success: true,
      data: updatedEntry,
    });
  } catch {
    next(error);
  }
});

// Verify time entry (managers/admins only)
router.post('/:id/verify', requireRole('admin', 'manager'), auditLog('update', 'time_entry'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;
    const userId = req.user?.id;

    const [entry] = await db('time_entries')
      .where({ id, farm_id: farmId })
      .update({
        verified_by: userId,
        verified_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    if (!entry) {
      throw new AppError('Time entry not found', 404);
    }

    res.json({
      success: true,
      data: entry,
    });
  } catch {
    next(error);
  }
});

export default router;
