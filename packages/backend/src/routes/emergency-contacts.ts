// Emergency Contact management routes

import express from 'express';
import { createEmergencyContactSchema, updateEmergencyContactSchema } from '@farm-commons/shared';
import db from '../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// All emergency contact routes require authentication
router.use(authenticateToken);

// List emergency contacts for a worker
// GET /api/workers/:workerId/emergency-contacts
router.get('/workers/:workerId/emergency-contacts', async (req: AuthRequest, res, next) => {
  try {
    const { workerId } = req.params;
    const farmId = req.user?.farm_id;

    // Verify worker belongs to the user's farm
    const worker = await db('workers')
      .where({ id: workerId, farm_id: farmId })
      .first();

    if (!worker) {
      throw new AppError('Worker not found', 404);
    }

    const contacts = await db('emergency_contacts')
      .where({ worker_id: workerId })
      .orderBy([
        { column: 'is_primary', order: 'desc' },
        { column: 'created_at', order: 'asc' },
      ])
      .select('*');

    res.json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    next(error);
  }
});

// Create emergency contact for a worker
// POST /api/workers/:workerId/emergency-contacts
router.post('/workers/:workerId/emergency-contacts', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { workerId } = req.params;
    const data = createEmergencyContactSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Verify worker belongs to the user's farm
    const worker = await db('workers')
      .where({ id: workerId, farm_id: farmId })
      .first();

    if (!worker) {
      throw new AppError('Worker not found', 404);
    }

    // If this contact is being marked as primary, unmark any existing primary contacts
    if (data.is_primary) {
      await db('emergency_contacts')
        .where({ worker_id: workerId })
        .update({ is_primary: false });
    }

    const [contact] = await db('emergency_contacts')
      .insert({
        ...data,
        worker_id: workerId,
      })
      .returning('*');

    res.status(201).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    next(error);
  }
});

// Update emergency contact
// PUT /api/emergency-contacts/:id
router.put('/emergency-contacts/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateEmergencyContactSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Get the contact and verify it belongs to a worker in the user's farm
    const existingContact = await db('emergency_contacts')
      .join('workers', 'emergency_contacts.worker_id', 'workers.id')
      .where({ 'emergency_contacts.id': id, 'workers.farm_id': farmId })
      .select('emergency_contacts.*', 'emergency_contacts.worker_id')
      .first();

    if (!existingContact) {
      throw new AppError('Emergency contact not found', 404);
    }

    // If this contact is being marked as primary, unmark any existing primary contacts for this worker
    if (data.is_primary === true) {
      await db('emergency_contacts')
        .where({ worker_id: existingContact.worker_id })
        .whereNot({ id })
        .update({ is_primary: false });
    }

    const [contact] = await db('emergency_contacts')
      .where({ id })
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    next(error);
  }
});

// Delete emergency contact
// DELETE /api/emergency-contacts/:id
router.delete('/emergency-contacts/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    // Verify the contact belongs to a worker in the user's farm
    const contact = await db('emergency_contacts')
      .join('workers', 'emergency_contacts.worker_id', 'workers.id')
      .where({ 'emergency_contacts.id': id, 'workers.farm_id': farmId })
      .select('emergency_contacts.id')
      .first();

    if (!contact) {
      throw new AppError('Emergency contact not found', 404);
    }

    await db('emergency_contacts')
      .where({ id })
      .delete();

    res.json({
      success: true,
      message: 'Emergency contact deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
