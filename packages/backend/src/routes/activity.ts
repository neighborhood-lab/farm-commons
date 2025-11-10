// Activity feed route - Recent farm activities

import express, { type Router } from 'express';
import { z } from 'zod';
import db from '../db/connection.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';

const router: Router = express.Router();

// All activity routes require authentication
router.use(authenticateToken);

// Query schema for activity filtering
const activityQuerySchema = z.object({
  type: z
    .enum(['all', 'schedules', 'time_entries', 'workers', 'fields', 'certifications'])
    .default('all'),
  limit: z
    .string()
    .transform((val) => Number.parseInt(val, 10))
    .pipe(z.number().min(1).max(100))
    .default('50'),
  offset: z
    .string()
    .transform((val) => Number.parseInt(val, 10))
    .pipe(z.number().min(0))
    .default('0'),
});

interface Activity {
  id: string;
  type: string;
  action: string;
  entity_id: string;
  entity_name: string;
  description: string;
  user_name?: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

// GET /api/activity - Recent farm activities
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;
    const { type, limit, offset } = activityQuerySchema.parse(req.query);

    const activities: Activity[] = [];

    // Helper function to format worker name
    const getWorkerName = (firstName: string, lastName: string) =>
      `${firstName} ${lastName}`;

    // Get schedule activities
    if (type === 'all' || type === 'schedules') {
      const schedules = await db('schedules')
        .where({ 'schedules.farm_id': farmId })
        .join('workers', 'schedules.worker_id', 'workers.id')
        .leftJoin('fields', 'schedules.field_id', 'fields.id')
        .select(
          'schedules.id',
          'schedules.created_at',
          'schedules.updated_at',
          'schedules.task_type',
          'schedules.status',
          'schedules.scheduled_date',
          'workers.first_name',
          'workers.last_name',
          'fields.name as field_name'
        )
        .orderBy('schedules.created_at', 'desc')
        .limit(limit);

      for (const schedule of schedules) {
        const workerName = getWorkerName(schedule.first_name, schedule.last_name);
        const isNew = new Date(schedule.updated_at).getTime() === new Date(schedule.created_at).getTime();

        activities.push({
          id: schedule.id,
          type: 'schedule',
          action: isNew ? 'created' : 'updated',
          entity_id: schedule.id,
          entity_name: `${schedule.task_type} - ${workerName}`,
          description: `Schedule ${isNew ? 'created' : 'updated'}: ${schedule.task_type} for ${workerName}${schedule.field_name ? ` at ${schedule.field_name}` : ''} on ${new Date(schedule.scheduled_date).toLocaleDateString()}`,
          user_name: workerName,
          metadata: {
            task_type: schedule.task_type,
            status: schedule.status,
            scheduled_date: schedule.scheduled_date,
            field_name: schedule.field_name,
          },
          created_at: new Date(isNew ? schedule.created_at : schedule.updated_at),
        });
      }
    }

    // Get time entry activities
    if (type === 'all' || type === 'time_entries') {
      const timeEntries = await db('time_entries')
        .where({ 'time_entries.farm_id': farmId })
        .join('workers', 'time_entries.worker_id', 'workers.id')
        .leftJoin('fields', 'time_entries.field_id', 'fields.id')
        .leftJoin('users as verifier', 'time_entries.verified_by', 'verifier.id')
        .select(
          'time_entries.id',
          'time_entries.created_at',
          'time_entries.clock_in',
          'time_entries.clock_out',
          'time_entries.task_type',
          'time_entries.total_hours',
          'time_entries.verified_at',
          'workers.first_name',
          'workers.last_name',
          'fields.name as field_name',
          'verifier.email as verifier_email'
        )
        .orderBy('time_entries.created_at', 'desc')
        .limit(limit);

      for (const entry of timeEntries) {
        const workerName = getWorkerName(entry.first_name, entry.last_name);
        const action = entry.clock_out ? 'clocked_out' : 'clocked_in';
        const hoursText = entry.total_hours ? ` (${Number.parseFloat(entry.total_hours).toFixed(2)} hours)` : '';

        activities.push({
          id: entry.id,
          type: 'time_entry',
          action,
          entity_id: entry.id,
          entity_name: `${workerName} - ${entry.task_type}`,
          description: `${workerName} ${action.replace('_', ' ')} for ${entry.task_type}${entry.field_name ? ` at ${entry.field_name}` : ''}${hoursText}`,
          user_name: workerName,
          metadata: {
            task_type: entry.task_type,
            clock_in: entry.clock_in,
            clock_out: entry.clock_out,
            total_hours: entry.total_hours ? Number.parseFloat(entry.total_hours) : null,
            field_name: entry.field_name,
            verified: !!entry.verified_at,
            verifier: entry.verifier_email,
          },
          created_at: new Date(entry.created_at),
        });
      }
    }

    // Get worker activities
    if (type === 'all' || type === 'workers') {
      const workers = await db('workers')
        .where({ farm_id: farmId })
        .select(
          'id',
          'created_at',
          'updated_at',
          'first_name',
          'last_name',
          'status',
          'hire_date'
        )
        .orderBy('created_at', 'desc')
        .limit(limit);

      for (const worker of workers) {
        const workerName = getWorkerName(worker.first_name, worker.last_name);
        const isNew = new Date(worker.updated_at).getTime() === new Date(worker.created_at).getTime();

        activities.push({
          id: worker.id,
          type: 'worker',
          action: isNew ? 'created' : 'updated',
          entity_id: worker.id,
          entity_name: workerName,
          description: `Worker ${isNew ? 'added' : 'updated'}: ${workerName} (${worker.status})`,
          user_name: workerName,
          metadata: {
            status: worker.status,
            hire_date: worker.hire_date,
          },
          created_at: new Date(isNew ? worker.created_at : worker.updated_at),
        });
      }
    }

    // Get field activities
    if (type === 'all' || type === 'fields') {
      const fields = await db('fields')
        .where({ farm_id: farmId })
        .select(
          'id',
          'created_at',
          'updated_at',
          'name',
          'size_acres',
          'current_crop'
        )
        .orderBy('created_at', 'desc')
        .limit(limit);

      for (const field of fields) {
        const isNew = new Date(field.updated_at).getTime() === new Date(field.created_at).getTime();

        activities.push({
          id: field.id,
          type: 'field',
          action: isNew ? 'created' : 'updated',
          entity_id: field.id,
          entity_name: field.name,
          description: `Field ${isNew ? 'added' : 'updated'}: ${field.name} (${Number.parseFloat(field.size_acres).toFixed(2)} acres)${field.current_crop ? ` - ${field.current_crop}` : ''}`,
          metadata: {
            size_acres: Number.parseFloat(field.size_acres),
            current_crop: field.current_crop,
          },
          created_at: new Date(isNew ? field.created_at : field.updated_at),
        });
      }
    }

    // Get certification activities
    if (type === 'all' || type === 'certifications') {
      const certifications = await db('certifications')
        .join('workers', 'certifications.worker_id', 'workers.id')
        .where({ 'workers.farm_id': farmId })
        .select(
          'certifications.id',
          'certifications.created_at',
          'certifications.updated_at',
          'certifications.name',
          'certifications.issuing_organization',
          'certifications.expiration_date',
          'certifications.verified',
          'workers.first_name',
          'workers.last_name'
        )
        .orderBy('certifications.created_at', 'desc')
        .limit(limit);

      for (const cert of certifications) {
        const workerName = getWorkerName(cert.first_name, cert.last_name);
        const isNew = new Date(cert.updated_at).getTime() === new Date(cert.created_at).getTime();

        activities.push({
          id: cert.id,
          type: 'certification',
          action: isNew ? 'created' : 'updated',
          entity_id: cert.id,
          entity_name: cert.name,
          description: `Certification ${isNew ? 'added' : 'updated'}: ${cert.name} for ${workerName}${cert.verified ? ' (verified)' : ''}`,
          user_name: workerName,
          metadata: {
            issuing_organization: cert.issuing_organization,
            expiration_date: cert.expiration_date,
            verified: cert.verified,
          },
          created_at: new Date(isNew ? cert.created_at : cert.updated_at),
        });
      }
    }

    // Sort all activities by timestamp descending
    activities.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    // Apply pagination
    const paginatedActivities = activities.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        activities: paginatedActivities,
        pagination: {
          limit,
          offset,
          total: activities.length,
          has_more: offset + limit < activities.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
