// Certification management routes

import express from 'express';
import { createCertificationSchema, updateCertificationSchema } from '@farm-commons/shared';
import db from '../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// All certification routes require authentication
router.use(authenticateToken);

// Get certifications for a specific worker
router.get('/worker/:workerId', async (req: AuthRequest, res, next) => {
  try {
    const { workerId } = req.params;
    const farmId = req.user?.farm_id;

    // Verify worker belongs to the farm
    const worker = await db('workers')
      .where({ id: workerId, farm_id: farmId })
      .first();

    if (!worker) {
      throw new AppError('Worker not found', 404);
    }

    const certifications = await db('certifications')
      .where({ worker_id: workerId })
      .orderBy('expiration_date', 'asc')
      .select('*');

    res.json({
      success: true,
      data: certifications,
    });
  } catch (error) {
    next(error);
  }
});

// Get certifications expiring within specified days (default 30)
router.get('/expiring', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;
    const days = parseInt(req.query.days as string) || 30;

    const expiringDate = new Date();
    expiringDate.setDate(expiringDate.getDate() + days);

    const certifications = await db('certifications')
      .join('workers', 'certifications.worker_id', 'workers.id')
      .where('workers.farm_id', farmId)
      .where('certifications.expiration_date', '<=', expiringDate)
      .where('certifications.expiration_date', '>=', new Date())
      .orderBy('certifications.expiration_date', 'asc')
      .select(
        'certifications.*',
        'workers.first_name',
        'workers.last_name'
      );

    res.json({
      success: true,
      data: certifications,
    });
  } catch (error) {
    next(error);
  }
});

// Create new certification (managers and admins only)
router.post('/', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const data = createCertificationSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Verify worker belongs to the farm
    const worker = await db('workers')
      .where({ id: data.worker_id, farm_id: farmId })
      .first();

    if (!worker) {
      throw new AppError('Worker not found', 404);
    }

    const [certification] = await db('certifications')
      .insert(data)
      .returning('*');

    res.status(201).json({
      success: true,
      data: certification,
    });
  } catch (error) {
    next(error);
  }
});

// Update certification (managers and admins only)
router.put('/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateCertificationSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Verify certification belongs to a worker in the farm
    const existing = await db('certifications')
      .join('workers', 'certifications.worker_id', 'workers.id')
      .where('certifications.id', id)
      .where('workers.farm_id', farmId)
      .first('certifications.id');

    if (!existing) {
      throw new AppError('Certification not found', 404);
    }

    const [certification] = await db('certifications')
      .where({ id })
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    res.json({
      success: true,
      data: certification,
    });
  } catch (error) {
    next(error);
  }
});

// Delete certification (managers and admins only)
router.delete('/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    // Verify certification belongs to a worker in the farm
    const existing = await db('certifications')
      .join('workers', 'certifications.worker_id', 'workers.id')
      .where('certifications.id', id)
      .where('workers.farm_id', farmId)
      .first('certifications.id');

    if (!existing) {
      throw new AppError('Certification not found', 404);
    }

    await db('certifications')
      .where({ id })
      .delete();

    res.json({
      success: true,
      message: 'Certification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
