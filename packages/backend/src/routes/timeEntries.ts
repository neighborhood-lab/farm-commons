// Time tracking routes

import express from 'express';
import { clockInSchema, clockOutSchema, dateRangeSchema } from '@farm-commons/shared';
import { calculatePreciseHours } from '@farm-commons/shared';
import db from '../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getActiveWorkersCount } from '../websocket/dashboard.js';
import { getWebSocketServer } from '../websocket/serverInstance.js';

const router = express.Router();

router.use(authenticateToken);

// Get time entries with optional filters
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;
    let query = db('time_entries')
      .where({ 'time_entries.farm_id': farmId })
      .leftJoin('workers', 'time_entries.worker_id', 'workers.id')
      .leftJoin('fields', 'time_entries.field_id', 'fields.id')
      .select(
        'time_entries.*',
        'workers.first_name as worker_first_name',
        'workers.last_name as worker_last_name',
        'fields.name as field_name'
      );

    // Apply date range filter if provided
    if (req.query.start_date && req.query.end_date) {
      const { start_date, end_date } = dateRangeSchema.parse(req.query);
      query = query.whereBetween('time_entries.clock_in', [start_date, end_date]);
    }

    const entries = await query.orderBy('time_entries.clock_in', 'desc');

    res.json({
      success: true,
      data: entries,
    });
  } catch (error) {
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
      .select(
        'time_entries.*',
        'fields.name as field_name'
      )
      .orderBy('time_entries.clock_in', 'desc');

    res.json({
      success: true,
      data: entries,
    });
  } catch (error) {
    next(error);
  }
});

// Clock in
router.post('/clock-in', async (req: AuthRequest, res, next) => {
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

    // Get worker details for WebSocket broadcast
    const worker = await db('workers')
      .where({ id: data.worker_id })
      .first();

    // Broadcast clock-in event via WebSocket
    const wsServer = getWebSocketServer();
    if (wsServer && worker) {
      wsServer.emitDashboardEvent('time-entry:change', {
        type: 'clock_in',
        entry,
        worker: {
          id: worker.id,
          first_name: worker.first_name,
          last_name: worker.last_name,
        },
        timestamp: new Date().toISOString(),
      });

      // Update active workers count
      const activeCount = await getActiveWorkersCount(farmId as string);
      wsServer.emitDashboardEvent('active-workers:update', {
        count: activeCount,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(201).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    next(error);
  }
});

// Clock out
router.post('/:id/clock-out', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { break_minutes, notes } = clockOutSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    const entry = await db('time_entries')
      .where({ id, farm_id: farmId })
      .first();

    if (!entry) {
      throw new AppError('Time entry not found', 404);
    }

    if (entry.clock_out) {
      throw new AppError('Time entry already clocked out', 400);
    }

    const clockOut = new Date();
    const totalHours = calculatePreciseHours(entry.clock_in, clockOut) - (break_minutes / 60);

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

    // Get worker details for WebSocket broadcast
    const worker = await db('workers')
      .where({ id: entry.worker_id })
      .first();

    // Broadcast clock-out event via WebSocket
    const wsServer = getWebSocketServer();
    if (wsServer && worker) {
      wsServer.emitDashboardEvent('time-entry:change', {
        type: 'clock_out',
        entry: updatedEntry,
        worker: {
          id: worker.id,
          first_name: worker.first_name,
          last_name: worker.last_name,
        },
        timestamp: new Date().toISOString(),
      });

      // Update active workers count
      const activeCount = await getActiveWorkersCount(farmId as string);
      wsServer.emitDashboardEvent('active-workers:update', {
        count: activeCount,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: updatedEntry,
    });
  } catch (error) {
    next(error);
  }
});

// Verify time entry (managers/admins only)
router.post('/:id/verify', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
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
  } catch (error) {
    next(error);
  }
});

export default router;
