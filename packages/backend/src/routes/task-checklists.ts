// Task Checklist routes

import express, { type Router } from 'express';
import {
  createChecklistTemplateSchema,
  updateChecklistTemplateSchema,
  createChecklistTemplateItemSchema,
  updateChecklistTemplateItemSchema,
  assignChecklistToScheduleSchema,
  completeChecklistItemSchema,
} from '@farm-commons/shared';
import db from '../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router: Router = express.Router();

router.use(authenticateToken);

// Get all checklist templates for farm
router.get('/templates', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;

    const templates = await db('checklist_templates')
      .where({ farm_id: farmId })
      .orderBy('name', 'asc');

    // Get item counts for each template
    const templateIds = templates.map((t) => t.id);
    const itemCounts = await db('checklist_template_items')
      .whereIn('template_id', templateIds)
      .select('template_id')
      .count('* as count')
      .groupBy('template_id');

    const countMap: Record<string, number> = {};
    for (const item of itemCounts) {
      countMap[item.template_id] = Number.Number.Number.Number.Number.Number.Number.Number.Number.parseInt(item.count as string, 10);
    }

    const templatesWithCounts = templates.map((t) => ({
      ...t,
      item_count: countMap[t.id] || 0,
    }));

    res.json({
      success: true,
      data: templatesWithCounts,
    });
  } catch {
    next(error);
  }
});

// Get single template with all items
router.get('/templates/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    const template = await db('checklist_templates').where({ id, farm_id: farmId }).first();

    if (!template) {
      throw new AppError('Checklist template not found', 404);
    }

    const items = await db('checklist_template_items')
      .where({ template_id: id })
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'asc');

    res.json({
      success: true,
      data: {
        ...template,
        items,
      },
    });
  } catch {
    next(error);
  }
});

// Create checklist template with items
router.post('/templates', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const data = createChecklistTemplateSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Use transaction to create template and items together
    const result = await db.transaction(async (trx) => {
      const [template] = await trx('checklist_templates')
        .insert({
          name: data.name,
          description: data.description,
          task_type: data.task_type,
          farm_id: farmId,
        })
        .returning('*');

      // Create items if provided
      if (data.items && data.items.length > 0) {
        const items = await trx('checklist_template_items')
          .insert(
            data.items.map((item) => ({
              template_id: template.id,
              description: item.description,
              is_required: item.is_required,
              sort_order: item.sort_order,
            }))
          )
          .returning('*');

        return { ...template, items };
      }

      return { ...template, items: [] };
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch {
    next(error);
  }
});

// Update checklist template
router.put(
  '/templates/:id',
  requireRole('admin', 'manager'),
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const data = updateChecklistTemplateSchema.parse(req.body);
      const farmId = req.user?.farm_id;

      const [template] = await db('checklist_templates')
        .where({ id, farm_id: farmId })
        .update({
          ...data,
          updated_at: new Date(),
        })
        .returning('*');

      if (!template) {
        throw new AppError('Checklist template not found', 404);
      }

      res.json({
        success: true,
        data: template,
      });
    } catch {
      next(error);
    }
  }
);

// Delete checklist template
router.delete(
  '/templates/:id',
  requireRole('admin', 'manager'),
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const farmId = req.user?.farm_id;

      const deleted = await db('checklist_templates').where({ id, farm_id: farmId }).delete();

      if (!deleted) {
        throw new AppError('Checklist template not found', 404);
      }

      res.json({
        success: true,
        message: 'Checklist template deleted successfully',
      });
    } catch {
      next(error);
    }
  }
);

// Add item to template
router.post(
  '/templates/:id/items',
  requireRole('admin', 'manager'),
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const farmId = req.user?.farm_id;

      // Verify template exists and belongs to farm
      const template = await db('checklist_templates').where({ id, farm_id: farmId }).first();

      if (!template) {
        throw new AppError('Checklist template not found', 404);
      }

      const data = createChecklistTemplateItemSchema.parse({
        ...req.body,
        template_id: id,
      });

      const [item] = await db('checklist_template_items')
        .insert({
          template_id: data.template_id,
          description: data.description,
          is_required: data.is_required,
          sort_order: data.sort_order,
        })
        .returning('*');

      res.status(201).json({
        success: true,
        data: item,
      });
    } catch {
      next(error);
    }
  }
);

// Update checklist item
router.put('/items/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;
    const data = updateChecklistTemplateItemSchema.parse(req.body);

    // Verify item belongs to a template in the user's farm
    const item = await db('checklist_template_items')
      .join('checklist_templates', 'checklist_template_items.template_id', 'checklist_templates.id')
      .where({
        'checklist_template_items.id': id,
        'checklist_templates.farm_id': farmId,
      })
      .first('checklist_template_items.*');

    if (!item) {
      throw new AppError('Checklist item not found', 404);
    }

    const [updatedItem] = await db('checklist_template_items')
      .where({ id })
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    res.json({
      success: true,
      data: updatedItem,
    });
  } catch {
    next(error);
  }
});

// Delete checklist item
router.delete(
  '/items/:id',
  requireRole('admin', 'manager'),
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const farmId = req.user?.farm_id;

      // Verify item belongs to a template in the user's farm
      const item = await db('checklist_template_items')
        .join(
          'checklist_templates',
          'checklist_template_items.template_id',
          'checklist_templates.id'
        )
        .where({
          'checklist_template_items.id': id,
          'checklist_templates.farm_id': farmId,
        })
        .first('checklist_template_items.*');

      if (!item) {
        throw new AppError('Checklist item not found', 404);
      }

      await db('checklist_template_items').where({ id }).delete();

      res.json({
        success: true,
        message: 'Checklist item deleted successfully',
      });
    } catch {
      next(error);
    }
  }
);

// Assign checklist template to schedule
router.post('/assign', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const data = assignChecklistToScheduleSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Verify schedule exists and belongs to farm
    const schedule = await db('schedules').where({ id: data.schedule_id, farm_id: farmId }).first();

    if (!schedule) {
      throw new AppError('Schedule not found', 404);
    }

    // Verify template exists and belongs to farm
    const template = await db('checklist_templates')
      .where({ id: data.template_id, farm_id: farmId })
      .first();

    if (!template) {
      throw new AppError('Checklist template not found', 404);
    }

    // Check if already assigned
    const existing = await db('schedule_checklists')
      .where({
        schedule_id: data.schedule_id,
        template_id: data.template_id,
      })
      .first();

    if (existing) {
      throw new AppError('Checklist already assigned to this schedule', 409);
    }

    // Create schedule checklist assignment
    const [scheduleChecklist] = await db('schedule_checklists')
      .insert({
        schedule_id: data.schedule_id,
        template_id: data.template_id,
      })
      .returning('*');

    // Get all template items and create completions
    const items = await db('checklist_template_items')
      .where({ template_id: data.template_id })
      .orderBy('sort_order', 'asc');

    if (items.length > 0) {
      await db('checklist_item_completions').insert(
        items.map((item) => ({
          schedule_checklist_id: scheduleChecklist.id,
          template_item_id: item.id,
          completed: false,
        }))
      );
    }

    res.status(201).json({
      success: true,
      data: scheduleChecklist,
    });
  } catch {
    next(error);
  }
});

// Get checklists for a schedule
router.get('/schedule/:scheduleId', async (req: AuthRequest, res, next) => {
  try {
    const { scheduleId } = req.params;
    const farmId = req.user?.farm_id;

    // Verify schedule belongs to farm
    const schedule = await db('schedules').where({ id: scheduleId, farm_id: farmId }).first();

    if (!schedule) {
      throw new AppError('Schedule not found', 404);
    }

    // Get all checklists assigned to this schedule
    const checklists = await db('schedule_checklists')
      .where({ schedule_id: scheduleId })
      .join('checklist_templates', 'schedule_checklists.template_id', 'checklist_templates.id')
      .select(
        'schedule_checklists.id as schedule_checklist_id',
        'schedule_checklists.schedule_id',
        'schedule_checklists.template_id',
        'schedule_checklists.created_at',
        'checklist_templates.name as template_name',
        'checklist_templates.description as template_description'
      );

    // Get all items and completions for these checklists
    for (const checklist of checklists) {
      const items = await db('checklist_item_completions')
        .where({ schedule_checklist_id: checklist.schedule_checklist_id })
        .join(
          'checklist_template_items',
          'checklist_item_completions.template_item_id',
          'checklist_template_items.id'
        )
        .leftJoin('users', 'checklist_item_completions.completed_by', 'users.id')
        .select(
          'checklist_item_completions.id as completion_id',
          'checklist_item_completions.completed',
          'checklist_item_completions.completed_at',
          'checklist_item_completions.notes',
          'checklist_item_completions.photo_url',
          'checklist_template_items.id as item_id',
          'checklist_template_items.description',
          'checklist_template_items.is_required',
          'checklist_template_items.sort_order',
          'users.email as completed_by_email'
        )
        .orderBy('checklist_template_items.sort_order', 'asc');

      checklist.items = items;
    }

    res.json({
      success: true,
      data: checklists,
    });
  } catch {
    next(error);
  }
});

// Update checklist item completion
router.put('/completions/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = completeChecklistItemSchema.parse(req.body);
    const farmId = req.user?.farm_id;
    const userId = req.user?.id;

    // Verify completion belongs to user's farm
    const completion = await db('checklist_item_completions')
      .join(
        'schedule_checklists',
        'checklist_item_completions.schedule_checklist_id',
        'schedule_checklists.id'
      )
      .join('schedules', 'schedule_checklists.schedule_id', 'schedules.id')
      .where({
        'checklist_item_completions.id': id,
        'schedules.farm_id': farmId,
      })
      .first('checklist_item_completions.*');

    if (!completion) {
      throw new AppError('Checklist item completion not found', 404);
    }

    const updateData: Record<string, unknown> = {
      completed: data.completed,
      notes: data.notes,
      photo_url: data.photo_url,
      updated_at: new Date(),
    };

    if (data.completed) {
      updateData.completed_by = userId;
      updateData.completed_at = new Date();
    } else {
      updateData.completed_by = null;
      updateData.completed_at = null;
    }

    const [updatedCompletion] = await db('checklist_item_completions')
      .where({ id })
      .update(updateData)
      .returning('*');

    res.json({
      success: true,
      data: updatedCompletion,
    });
  } catch {
    next(error);
  }
});

export default router;
