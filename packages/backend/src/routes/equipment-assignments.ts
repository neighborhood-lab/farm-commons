// Equipment assignment routes - Track equipment checkout/checkin

import express from 'express';
import { assignEquipmentSchema, returnEquipmentSchema } from '@farm-commons/shared';
import db from '../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// All equipment assignment routes require authentication
router.use(authenticateToken);

/**
 * POST /api/equipment/:id/assign
 * Assign equipment to a worker
 */
router.post('/:id/assign', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id: equipmentId } = req.params;
    const data = assignEquipmentSchema.parse(req.body);
    const farmId = req.user?.farm_id;
    const userId = req.user?.id;

    // Verify equipment exists and belongs to farm
    const equipment = await db('equipment')
      .where({ id: equipmentId, farm_id: farmId })
      .first();

    if (!equipment) {
      throw new AppError('Equipment not found', 404);
    }

    // Check if equipment is available
    if (equipment.status !== 'available') {
      throw new AppError(`Equipment is currently ${equipment.status} and cannot be assigned`, 400);
    }

    // Check if worker exists and belongs to farm
    const worker = await db('workers')
      .where({ id: data.worker_id, farm_id: farmId })
      .first();

    if (!worker) {
      throw new AppError('Worker not found', 404);
    }

    // Check if there's already an active assignment for this equipment
    const activeAssignment = await db('equipment_assignments')
      .where({ equipment_id: equipmentId, returned_at: null })
      .first();

    if (activeAssignment) {
      throw new AppError('Equipment is already assigned to another worker', 400);
    }

    // Create assignment within a transaction
    const [assignment] = await db.transaction(async (trx) => {
      // Create the assignment
      const [newAssignment] = await trx('equipment_assignments')
        .insert({
          farm_id: farmId,
          equipment_id: equipmentId,
          worker_id: data.worker_id,
          assigned_by: userId,
          assignment_notes: data.assignment_notes,
        })
        .returning('*');

      // Update equipment status to in_use
      await trx('equipment')
        .where({ id: equipmentId })
        .update({ status: 'in_use', updated_at: new Date() });

      return [newAssignment];
    });

    res.status(201).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/equipment/:id/return
 * Return equipment from a worker
 */
router.post('/:id/return', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id: equipmentId } = req.params;
    const data = returnEquipmentSchema.parse(req.body);
    const farmId = req.user?.farm_id;
    const userId = req.user?.id;

    // Verify equipment exists and belongs to farm
    const equipment = await db('equipment')
      .where({ id: equipmentId, farm_id: farmId })
      .first();

    if (!equipment) {
      throw new AppError('Equipment not found', 404);
    }

    // Find active assignment
    const activeAssignment = await db('equipment_assignments')
      .where({ equipment_id: equipmentId, farm_id: farmId, returned_at: null })
      .first();

    if (!activeAssignment) {
      throw new AppError('No active assignment found for this equipment', 400);
    }

    // Update assignment within a transaction
    const [updatedAssignment] = await db.transaction(async (trx) => {
      // Update the assignment
      const [assignment] = await trx('equipment_assignments')
        .where({ id: activeAssignment.id })
        .update({
          returned_at: new Date(),
          returned_by: userId,
          return_notes: data.return_notes,
          condition_on_return: data.condition_on_return,
          updated_at: new Date(),
        })
        .returning('*');

      // Determine new equipment status based on condition
      let newStatus = 'available';
      if (data.condition_on_return === 'damaged' || data.condition_on_return === 'poor') {
        newStatus = 'maintenance';
      }

      // Update equipment status
      await trx('equipment')
        .where({ id: equipmentId })
        .update({ status: newStatus, updated_at: new Date() });

      return [assignment];
    });

    res.json({
      success: true,
      data: updatedAssignment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/equipment/:id/history
 * Get assignment history for a piece of equipment
 */
router.get('/:id/history', async (req: AuthRequest, res, next) => {
  try {
    const { id: equipmentId } = req.params;
    const farmId = req.user?.farm_id;

    // Verify equipment exists and belongs to farm
    const equipment = await db('equipment')
      .where({ id: equipmentId, farm_id: farmId })
      .first();

    if (!equipment) {
      throw new AppError('Equipment not found', 404);
    }

    // Get assignment history with worker details
    const history = await db('equipment_assignments')
      .where({ equipment_id: equipmentId, farm_id: farmId })
      .leftJoin('workers', 'equipment_assignments.worker_id', 'workers.id')
      .leftJoin('users as assigned_by_user', 'equipment_assignments.assigned_by', 'assigned_by_user.id')
      .leftJoin('users as returned_by_user', 'equipment_assignments.returned_by', 'returned_by_user.id')
      .select(
        'equipment_assignments.*',
        'workers.first_name as worker_first_name',
        'workers.last_name as worker_last_name',
        'assigned_by_user.email as assigned_by_email',
        'returned_by_user.email as returned_by_email'
      )
      .orderBy('equipment_assignments.assigned_at', 'desc');

    res.json({
      success: true,
      data: {
        equipment,
        history,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/workers/:id/equipment
 * Get current equipment assigned to a worker
 */
router.get('/workers/:id/equipment', async (req: AuthRequest, res, next) => {
  try {
    const { id: workerId } = req.params;
    const farmId = req.user?.farm_id;

    // Verify worker exists and belongs to farm
    const worker = await db('workers')
      .where({ id: workerId, farm_id: farmId })
      .first();

    if (!worker) {
      throw new AppError('Worker not found', 404);
    }

    // Get currently assigned equipment
    const assignedEquipment = await db('equipment_assignments')
      .where({ worker_id: workerId, farm_id: farmId, returned_at: null })
      .leftJoin('equipment', 'equipment_assignments.equipment_id', 'equipment.id')
      .leftJoin('users as assigned_by_user', 'equipment_assignments.assigned_by', 'assigned_by_user.id')
      .select(
        'equipment_assignments.*',
        'equipment.name as equipment_name',
        'equipment.type as equipment_type',
        'equipment.model as equipment_model',
        'equipment.status as equipment_status',
        'assigned_by_user.email as assigned_by_email'
      )
      .orderBy('equipment_assignments.assigned_at', 'desc');

    res.json({
      success: true,
      data: {
        worker,
        assigned_equipment: assignedEquipment,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
