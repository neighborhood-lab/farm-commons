// Field notes management routes

import express, { type Router } from 'express';
import { createFieldNoteSchema, updateFieldNoteSchema, paginationSchema } from '@farm-commons/shared';
import db from '../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router: Router = express.Router();

// All field notes routes require authentication
router.use(authenticateToken);

// Get all notes for a specific field
router.get('/fields/:fieldId/notes', async (req: AuthRequest, res, next) => {
  try {
    const { fieldId } = req.params;
    const { page, per_page } = paginationSchema.parse(req.query);
    const farmId = req.user?.farm_id;

    // Verify field belongs to user's farm
    const field = await db('fields').where({ id: fieldId, farm_id: farmId }).first();
    if (!field) {
      throw new AppError('Field not found', 404);
    }

    const offset = (page - 1) * per_page;

    const [notes, [{ count }]] = await Promise.all([
      db('field_notes')
        .where({ field_id: fieldId, farm_id: farmId })
        .orderBy('created_at', 'desc')
        .limit(per_page)
        .offset(offset)
        .select(
          'field_notes.*',
          'users.email as created_by_email',
          db.raw("users.email || ' (' || COALESCE(users.role, 'user') || ')' as created_by_name"),
        )
        .leftJoin('users', 'field_notes.created_by', 'users.id'),
      db('field_notes').where({ field_id: fieldId, farm_id: farmId }).count('* as count'),
    ]);

    res.json({
      success: true,
      data: {
        data: notes,
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

// Add note to a field
router.post('/fields/:fieldId/notes', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { fieldId } = req.params;
    const data = createFieldNoteSchema.parse({ ...req.body, field_id: fieldId });
    const farmId = req.user?.farm_id;
    const userId = req.user?.id;

    // Verify field belongs to user's farm
    const field = await db('fields').where({ id: fieldId, farm_id: farmId }).first();
    if (!field) {
      throw new AppError('Field not found', 404);
    }

    const [note] = await db('field_notes')
      .insert({
        field_id: data.field_id,
        farm_id: farmId,
        created_by: userId,
        content: data.content,
        tags: data.tags,
        photo_urls: data.photo_urls,
      })
      .returning('*');

    res.status(201).json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
});

// Update a field note
router.put('/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateFieldNoteSchema.parse(req.body);
    const farmId = req.user?.farm_id;
    const userId = req.user?.id;

    // Check if note exists and belongs to user's farm
    const existingNote = await db('field_notes').where({ id, farm_id: farmId }).first();
    if (!existingNote) {
      throw new AppError('Field note not found', 404);
    }

    // Only the creator or admin can update the note
    if (existingNote.created_by !== userId && req.user?.role !== 'admin') {
      throw new AppError('Not authorized to update this note', 403);
    }

    const [note] = await db('field_notes')
      .where({ id, farm_id: farmId })
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
});

// Delete a field note
router.delete('/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;
    const userId = req.user?.id;

    // Check if note exists and belongs to user's farm
    const existingNote = await db('field_notes').where({ id, farm_id: farmId }).first();
    if (!existingNote) {
      throw new AppError('Field note not found', 404);
    }

    // Only the creator or admin can delete the note
    if (existingNote.created_by !== userId && req.user?.role !== 'admin') {
      throw new AppError('Not authorized to delete this note', 403);
    }

    await db('field_notes').where({ id, farm_id: farmId }).delete();

    res.json({
      success: true,
      message: 'Field note deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get notes by tag/category
router.get('/notes/by-tag/:tag', async (req: AuthRequest, res, next) => {
  try {
    const { tag } = req.params;
    const { page, per_page } = paginationSchema.parse(req.query);
    const farmId = req.user?.farm_id;

    const offset = (page - 1) * per_page;

    const [notes, [{ count }]] = await Promise.all([
      db('field_notes')
        .where({ farm_id: farmId })
        .whereRaw('? = ANY(tags)', [tag])
        .orderBy('created_at', 'desc')
        .limit(per_page)
        .offset(offset)
        .select(
          'field_notes.*',
          'fields.name as field_name',
          'users.email as created_by_email',
          db.raw("users.email || ' (' || COALESCE(users.role, 'user') || ')' as created_by_name"),
        )
        .leftJoin('fields', 'field_notes.field_id', 'fields.id')
        .leftJoin('users', 'field_notes.created_by', 'users.id'),
      db('field_notes').where({ farm_id: farmId }).whereRaw('? = ANY(tags)', [tag]).count('* as count'),
    ]);

    res.json({
      success: true,
      data: {
        data: notes,
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

export default router;
