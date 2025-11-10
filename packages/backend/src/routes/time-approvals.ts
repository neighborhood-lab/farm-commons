// Time entry approval workflow routes

import express, { type Router } from 'express';
import {
  approveTimeEntrySchema,
  rejectTimeEntrySchema,
  batchApprovalSchema,
} from '@farm-commons/shared';
import db from '../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router: Router = express.Router();

router.use(authenticateToken);
router.use(requireRole('admin', 'manager'));

// Get pending time entries for approval
router.get('/pending', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;

    const pendingEntries = await db('time_entries')
      .where({
        'time_entries.farm_id': farmId,
        'time_entries.approval_status': 'pending',
      })
      .whereNotNull('time_entries.clock_out')
      .leftJoin('workers', 'time_entries.worker_id', 'workers.id')
      .leftJoin('fields', 'time_entries.field_id', 'fields.id')
      .select(
        'time_entries.*',
        'workers.first_name as worker_first_name',
        'workers.last_name as worker_last_name',
        'fields.name as field_name'
      )
      .orderBy('time_entries.clock_out', 'desc');

    res.json({
      success: true,
      data: pendingEntries,
    });
  } catch (error) {
    next(error);
  }
});

// Approve a time entry
router.post('/:id/approve', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;
    const userId = req.user?.id;

    // Validate request body
    const { notes } = approveTimeEntrySchema.parse(req.body);

    // Get the time entry
    const entry = await db('time_entries')
      .where({ id, farm_id: farmId })
      .first();

    if (!entry) {
      throw new AppError('Time entry not found', 404);
    }

    // Check if entry is already processed
    if (entry.approval_status !== 'pending') {
      throw new AppError(
        `Time entry has already been ${entry.approval_status}`,
        400
      );
    }

    // Check if entry is clocked out
    if (!entry.clock_out) {
      throw new AppError('Cannot approve a time entry that is not clocked out', 400);
    }

    // Approve the time entry
    const [approvedEntry] = await db('time_entries')
      .where({ id, farm_id: farmId })
      .update({
        approval_status: 'approved',
        approved_by: userId,
        approved_at: new Date(),
        notes: notes || entry.notes,
        updated_at: new Date(),
      })
      .returning('*');

    res.json({
      success: true,
      data: approvedEntry,
      message: 'Time entry approved successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Reject a time entry
router.post('/:id/reject', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;
    const userId = req.user?.id;

    // Validate request body
    const { rejection_reason } = rejectTimeEntrySchema.parse(req.body);

    // Get the time entry
    const entry = await db('time_entries')
      .where({ id, farm_id: farmId })
      .first();

    if (!entry) {
      throw new AppError('Time entry not found', 404);
    }

    // Check if entry is already processed
    if (entry.approval_status !== 'pending') {
      throw new AppError(
        `Time entry has already been ${entry.approval_status}`,
        400
      );
    }

    // Check if entry is clocked out
    if (!entry.clock_out) {
      throw new AppError('Cannot reject a time entry that is not clocked out', 400);
    }

    // Reject the time entry
    const [rejectedEntry] = await db('time_entries')
      .where({ id, farm_id: farmId })
      .update({
        approval_status: 'rejected',
        approved_by: userId,
        approved_at: new Date(),
        rejection_reason,
        updated_at: new Date(),
      })
      .returning('*');

    res.json({
      success: true,
      data: rejectedEntry,
      message: 'Time entry rejected',
    });
  } catch (error) {
    next(error);
  }
});

// Batch approve time entries
router.post('/batch-approve', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;
    const userId = req.user?.id;

    // Validate request body
    const { time_entry_ids } = batchApprovalSchema.parse(req.body);

    // Get all time entries
    const entries = await db('time_entries')
      .whereIn('id', time_entry_ids)
      .where({ farm_id: farmId });

    if (entries.length !== time_entry_ids.length) {
      throw new AppError('Some time entries were not found', 404);
    }

    // Check if all entries are pending and clocked out
    const invalidEntries = entries.filter(
      (entry) => entry.approval_status !== 'pending' || !entry.clock_out
    );

    if (invalidEntries.length > 0) {
      throw new AppError(
        'All time entries must be pending and clocked out to approve',
        400
      );
    }

    // Batch approve all entries
    const approvedEntries = await db('time_entries')
      .whereIn('id', time_entry_ids)
      .where({ farm_id: farmId })
      .update({
        approval_status: 'approved',
        approved_by: userId,
        approved_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    res.json({
      success: true,
      data: approvedEntries,
      message: `Successfully approved ${approvedEntries.length} time entries`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
