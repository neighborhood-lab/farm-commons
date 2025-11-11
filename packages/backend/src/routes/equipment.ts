// Equipment management routes

import express from 'express';
import {
  createEquipmentSchema,
  updateEquipmentSchema,
  createMaintenanceLogSchema,
  updateMaintenanceLogSchema,
  createEquipmentAssignmentSchema,
  returnEquipmentSchema,
  paginationSchema,
} from '@farm-commons/shared';
import db from '../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// All equipment routes require authentication
router.use(authenticateToken);

// ============================================
// Equipment CRUD Operations
// ============================================

// List all equipment
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { page, per_page } = paginationSchema.parse(req.query);
    const farmId = req.user?.farm_id;
    const { status, type } = req.query;

    const offset = (page - 1) * per_page;

    let query = db('equipment').where({ farm_id: farmId });

    // Apply optional filters
    if (status) {
      query = query.where({ status });
    }
    if (type) {
      query = query.where({ type });
    }

    const [equipment, [{ count }]] = await Promise.all([
      query
        .orderBy('name', 'asc')
        .limit(per_page)
        .offset(offset)
        .select('*'),
      db('equipment')
        .where({ farm_id: farmId })
        .modify((qb) => {
          if (status) qb.where({ status });
          if (type) qb.where({ type });
        })
        .count('* as count'),
    ]);

    res.json({
      success: true,
      data: {
        data: equipment,
        total: Number.parseInt(count as string),
        page,
        per_page,
        total_pages: Math.ceil(Number.parseInt(count as string) / per_page),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get single equipment with maintenance history
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    const equipment = await db('equipment')
      .where({ id, farm_id: farmId })
      .first();

    if (!equipment) {
      throw new AppError('Equipment not found', 404);
    }

    // Get maintenance history
    const maintenanceLogs = await db('equipment_maintenance_logs')
      .where({ equipment_id: id })
      .orderBy('maintenance_date', 'desc')
      .leftJoin('workers', 'equipment_maintenance_logs.performed_by', 'workers.id')
      .select(
        'equipment_maintenance_logs.*',
        db.raw("CONCAT(workers.first_name, ' ', workers.last_name) as performed_by_name")
      );

    // Get current assignment
    const currentAssignment = await db('equipment_assignments')
      .where({ equipment_id: id, returned_at: null })
      .leftJoin('workers', 'equipment_assignments.worker_id', 'workers.id')
      .leftJoin('fields', 'equipment_assignments.field_id', 'fields.id')
      .select(
        'equipment_assignments.*',
        db.raw("CONCAT(workers.first_name, ' ', workers.last_name) as worker_name"),
        'fields.name as field_name'
      )
      .first();

    res.json({
      success: true,
      data: {
        ...equipment,
        maintenance_logs: maintenanceLogs,
        current_assignment: currentAssignment || null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create new equipment (managers and admins only)
router.post('/', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const data = createEquipmentSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    const [equipment] = await db('equipment')
      .insert({
        ...data,
        farm_id: farmId,
      })
      .returning('*');

    res.status(201).json({
      success: true,
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
});

// Update equipment
router.put('/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateEquipmentSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    const [equipment] = await db('equipment')
      .where({ id, farm_id: farmId })
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    if (!equipment) {
      throw new AppError('Equipment not found', 404);
    }

    res.json({
      success: true,
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
});

// Delete equipment (soft delete by setting status to retired)
router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    // Check if equipment has active assignments
    const activeAssignment = await db('equipment_assignments')
      .where({ equipment_id: id, returned_at: null })
      .first();

    if (activeAssignment) {
      throw new AppError('Cannot delete equipment with active assignments', 400);
    }

    const [equipment] = await db('equipment')
      .where({ id, farm_id: farmId })
      .update({
        status: 'retired',
        updated_at: new Date(),
      })
      .returning('*');

    if (!equipment) {
      throw new AppError('Equipment not found', 404);
    }

    res.json({
      success: true,
      message: 'Equipment retired successfully',
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// Equipment Maintenance Logs
// ============================================

// Get all maintenance logs for equipment
router.get('/:id/maintenance', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    // Verify equipment belongs to farm
    const equipment = await db('equipment')
      .where({ id, farm_id: farmId })
      .first();

    if (!equipment) {
      throw new AppError('Equipment not found', 404);
    }

    const maintenanceLogs = await db('equipment_maintenance_logs')
      .where({ equipment_id: id })
      .orderBy('maintenance_date', 'desc')
      .leftJoin('workers', 'equipment_maintenance_logs.performed_by', 'workers.id')
      .select(
        'equipment_maintenance_logs.*',
        db.raw("CONCAT(workers.first_name, ' ', workers.last_name) as performed_by_name")
      );

    res.json({
      success: true,
      data: maintenanceLogs,
    });
  } catch (error) {
    next(error);
  }
});

// Create maintenance log
router.post('/:id/maintenance', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = createMaintenanceLogSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Verify equipment belongs to farm
    const equipment = await db('equipment')
      .where({ id, farm_id: farmId })
      .first();

    if (!equipment) {
      throw new AppError('Equipment not found', 404);
    }

    // Verify equipment_id matches
    if (data.equipment_id !== id) {
      throw new AppError('Equipment ID mismatch', 400);
    }

    const [maintenanceLog] = await db('equipment_maintenance_logs')
      .insert(data)
      .returning('*');

    res.status(201).json({
      success: true,
      data: maintenanceLog,
    });
  } catch (error) {
    next(error);
  }
});

// Update maintenance log
router.put('/maintenance/:logId', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { logId } = req.params;
    const data = updateMaintenanceLogSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Verify maintenance log belongs to equipment in farm
    const log = await db('equipment_maintenance_logs')
      .join('equipment', 'equipment_maintenance_logs.equipment_id', 'equipment.id')
      .where({
        'equipment_maintenance_logs.id': logId,
        'equipment.farm_id': farmId
      })
      .select('equipment_maintenance_logs.*')
      .first();

    if (!log) {
      throw new AppError('Maintenance log not found', 404);
    }

    const [maintenanceLog] = await db('equipment_maintenance_logs')
      .where({ id: logId })
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    res.json({
      success: true,
      data: maintenanceLog,
    });
  } catch (error) {
    next(error);
  }
});

// Delete maintenance log
router.delete('/maintenance/:logId', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { logId } = req.params;
    const farmId = req.user?.farm_id;

    // Verify maintenance log belongs to equipment in farm
    const log = await db('equipment_maintenance_logs')
      .join('equipment', 'equipment_maintenance_logs.equipment_id', 'equipment.id')
      .where({
        'equipment_maintenance_logs.id': logId,
        'equipment.farm_id': farmId
      })
      .select('equipment_maintenance_logs.*')
      .first();

    if (!log) {
      throw new AppError('Maintenance log not found', 404);
    }

    await db('equipment_maintenance_logs')
      .where({ id: logId })
      .delete();

    res.json({
      success: true,
      message: 'Maintenance log deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// Equipment Assignments
// ============================================

// Get all assignments for equipment
router.get('/:id/assignments', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    // Verify equipment belongs to farm
    const equipment = await db('equipment')
      .where({ id, farm_id: farmId })
      .first();

    if (!equipment) {
      throw new AppError('Equipment not found', 404);
    }

    const assignments = await db('equipment_assignments')
      .where({ equipment_id: id })
      .orderBy('assigned_at', 'desc')
      .leftJoin('workers', 'equipment_assignments.worker_id', 'workers.id')
      .leftJoin('fields', 'equipment_assignments.field_id', 'fields.id')
      .select(
        'equipment_assignments.*',
        db.raw("CONCAT(workers.first_name, ' ', workers.last_name) as worker_name"),
        'fields.name as field_name'
      );

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
});

// Assign equipment to worker or field
router.post('/:id/assign', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = createEquipmentAssignmentSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Verify equipment belongs to farm
    const equipment = await db('equipment')
      .where({ id, farm_id: farmId })
      .first();

    if (!equipment) {
      throw new AppError('Equipment not found', 404);
    }

    // Verify equipment_id matches
    if (data.equipment_id !== id) {
      throw new AppError('Equipment ID mismatch', 400);
    }

    // Check if equipment is already assigned
    const existingAssignment = await db('equipment_assignments')
      .where({ equipment_id: id, returned_at: null })
      .first();

    if (existingAssignment) {
      throw new AppError('Equipment is already assigned', 400);
    }

    const [assignment] = await db('equipment_assignments')
      .insert({
        ...data,
        assigned_at: new Date(),
      })
      .returning('*');

    // Update equipment status to in_use
    await db('equipment')
      .where({ id })
      .update({ status: 'in_use', updated_at: new Date() });

    res.status(201).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
});

// Return equipment from assignment
router.post('/assignments/:assignmentId/return', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { assignmentId } = req.params;
    const data = returnEquipmentSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Verify assignment belongs to equipment in farm
    const assignment = await db('equipment_assignments')
      .join('equipment', 'equipment_assignments.equipment_id', 'equipment.id')
      .where({
        'equipment_assignments.id': assignmentId,
        'equipment.farm_id': farmId
      })
      .select('equipment_assignments.*', 'equipment.id as equipment_id')
      .first();

    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    if (assignment.returned_at) {
      throw new AppError('Equipment already returned', 400);
    }

    const [updatedAssignment] = await db('equipment_assignments')
      .where({ id: assignmentId })
      .update({
        returned_at: new Date(),
        notes: data.notes ? `${assignment.notes || ''}\nReturned: ${data.notes}` : assignment.notes,
        updated_at: new Date(),
      })
      .returning('*');

    // Check if there are other active assignments
    const otherAssignments = await db('equipment_assignments')
      .where({ equipment_id: assignment.equipment_id, returned_at: null })
      .whereNot({ id: assignmentId })
      .first();

    // If no other active assignments, set equipment status to available
    if (!otherAssignments) {
      await db('equipment')
        .where({ id: assignment.equipment_id })
        .update({ status: 'available', updated_at: new Date() });
    }

    res.json({
      success: true,
      data: updatedAssignment,
    });
  } catch (error) {
    next(error);
  }
});

// Get equipment maintenance reminders (upcoming maintenance)
router.get('/maintenance/reminders', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;
    const daysAhead = Number.parseInt(req.query.days as string) || 30;

    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + daysAhead);

    const reminders = await db('equipment_maintenance_logs')
      .join('equipment', 'equipment_maintenance_logs.equipment_id', 'equipment.id')
      .where('equipment.farm_id', farmId)
      .whereNotNull('equipment_maintenance_logs.next_maintenance_date')
      .where('equipment_maintenance_logs.next_maintenance_date', '<=', upcomingDate)
      .where('equipment_maintenance_logs.next_maintenance_date', '>=', new Date())
      .select(
        'equipment_maintenance_logs.id',
        'equipment_maintenance_logs.equipment_id',
        'equipment_maintenance_logs.next_maintenance_date',
        'equipment_maintenance_logs.maintenance_type',
        'equipment.name as equipment_name',
        'equipment.type as equipment_type'
      )
      .orderBy('equipment_maintenance_logs.next_maintenance_date', 'asc');

    res.json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
