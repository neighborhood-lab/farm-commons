// Worker management routes

import express, { type Router } from 'express';
import { createWorkerSchema, updateWorkerSchema, paginationSchema } from '@farm-commons/shared';
import db from '../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { auditLog, auditReadAccess, auditListAccess } from '../middleware/auditLog.js';

const router: Router = express.Router();

// All worker routes require authentication
router.use(authenticateToken);

// List workers
router.get('/', auditListAccess('worker'), async (req: AuthRequest, res, next) => {
  try {
    const { page, per_page } = paginationSchema.parse(req.query);
    const farmId = req.user?.farm_id;

    const offset = (page - 1) * per_page;

    const [workers, [{ count }]] = await Promise.all([
      db('workers')
        .where({ farm_id: farmId })
        .orderBy('last_name', 'asc')
        .limit(per_page)
        .offset(offset)
        .select('*'),
      db('workers').where({ farm_id: farmId }).count('* as count'),
    ]);

    res.json({
      success: true,
      data: {
        data: workers,
        total: Number.Number.parseInt(count as string),
        page,
        per_page,
        total_pages: Math.ceil(Number.Number.parseInt(count as string) / per_page),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get single worker
router.get('/:id', auditReadAccess('worker'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    const worker = await db('workers').where({ id, farm_id: farmId }).first();

    if (!worker || !worker.id) {
      throw new AppError('Worker not found', 404);
    }

    res.json({
      success: true,
      data: worker,
    });
  } catch (error) {
    next(error);
  }
});

// Get worker statistics
router.get('/:id/stats', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    const stats = await getWorkerStatistics(farmId!, id);

    if (!stats) {
      throw new AppError('Worker not found', 404);
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// Create worker (managers and admins only)
router.post('/', requireRole('admin', 'manager'), auditLog('create', 'worker'), async (req: AuthRequest, res, next) => {
  try {
    const data = createWorkerSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    const [worker] = await db('workers')
      .insert({
        ...data,
        farm_id: farmId,
      })
      .returning('*');

    res.status(201).json({
      success: true,
      data: worker,
    });
  } catch (error) {
    next(error);
  }
});

// Update worker
router.put('/:id', requireRole('admin', 'manager'), auditLog('update', 'worker'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateWorkerSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    const [worker] = await db('workers')
      .where({ id, farm_id: farmId })
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    if (!worker) {
      throw new AppError('Worker not found', 404);
    }

    res.json({
      success: true,
      data: worker,
    });
  } catch (error) {
    next(error);
  }
});

// Delete worker
router.delete('/:id', requireRole('admin'), auditLog('delete', 'worker'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    const deleted = await db('workers').where({ id, farm_id: farmId }).delete();

    if (!deleted) {
      throw new AppError('Worker not found', 404);
    }

    res.json({
      success: true,
      message: 'Worker deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
