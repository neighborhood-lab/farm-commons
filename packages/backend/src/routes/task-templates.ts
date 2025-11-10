// Task Templates routes

import express from 'express';
import {
  createTaskTemplateSchema,
  updateTaskTemplateSchema,
  createScheduleFromTemplateSchema
} from '@farm-commons/shared';
import db from '../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(authenticateToken);

// Get all task templates for farm
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;
    let query = db('task_templates').where({ farm_id: farmId });

    // Filter by season if provided
    if (req.query.season) {
      query = query.where('season', req.query.season);
    }

    const templates = await query.orderBy('name', 'asc');

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
});

// Get single task template
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    const template = await db('task_templates')
      .where({ id, farm_id: farmId })
      .first();

    if (!template) {
      throw new AppError('Task template not found', 404);
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
});

// Create task template
router.post('/', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const data = createTaskTemplateSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    const [template] = await db('task_templates')
      .insert({
        ...data,
        farm_id: farmId,
      })
      .returning('*');

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
});

// Update task template
router.put('/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateTaskTemplateSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    const [template] = await db('task_templates')
      .where({ id, farm_id: farmId })
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    if (!template) {
      throw new AppError('Task template not found', 404);
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
});

// Delete task template
router.delete('/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    const deleted = await db('task_templates')
      .where({ id, farm_id: farmId })
      .delete();

    if (!deleted) {
      throw new AppError('Task template not found', 404);
    }

    res.json({
      success: true,
      message: 'Task template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Create schedule from template
router.post('/:id/create-schedule', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id: templateId } = req.params;
    const farmId = req.user?.farm_id;

    // Fetch the template
    const template = await db('task_templates')
      .where({ id: templateId, farm_id: farmId })
      .first();

    if (!template) {
      throw new AppError('Task template not found', 404);
    }

    // Parse and validate the schedule creation data
    const scheduleData = createScheduleFromTemplateSchema.parse({
      template_id: templateId,
      ...req.body,
    });

    // Validate that field is provided if required
    if (template.field_required && !scheduleData.field_id) {
      throw new AppError('Field is required for this task template', 400);
    }

    // Calculate end_time if not provided
    let startTime = scheduleData.start_time || template.default_start_time;
    let endTime = scheduleData.end_time;

    if (!startTime) {
      throw new AppError('Start time must be provided or set in template', 400);
    }

    if (!endTime && template.default_duration_hours) {
      // Calculate end_time based on start_time and duration
      const [hours, minutes] = startTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + (template.default_duration_hours * 60);
      const endHours = Math.floor(totalMinutes / 60) % 24;
      const endMinutes = Math.floor(totalMinutes % 60);
      endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
    }

    if (!endTime) {
      throw new AppError('End time must be provided or calculable from template', 400);
    }

    // Create the schedule
    const [schedule] = await db('schedules')
      .insert({
        farm_id: farmId,
        worker_id: scheduleData.worker_id,
        field_id: scheduleData.field_id,
        scheduled_date: scheduleData.scheduled_date,
        start_time: startTime,
        end_time: endTime,
        task_type: template.task_type,
        task_description: template.task_description,
        notes: scheduleData.notes || template.notes,
        status: 'scheduled',
      })
      .returning('*');

    res.status(201).json({
      success: true,
      data: schedule,
      message: 'Schedule created from template successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
