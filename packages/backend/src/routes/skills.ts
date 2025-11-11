// Worker skills management routes

import express, { Router } from 'express';
import {
  createSkillSchema,
  updateSkillSchema,
  addWorkerSkillSchema,
  paginationSchema,
} from '@farm-commons/shared';
import db from '../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router: Router = express.Router();

// All skill routes require authentication
router.use(authenticateToken);

// GET /api/skills - List all available skills
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { page, per_page } = paginationSchema.parse(req.query);
    const farmId = req.user?.farm_id;

    const offset = (page - 1) * per_page;

    const [skills, [{ count }]] = await Promise.all([
      db('skills')
        .where({ farm_id: farmId })
        .orderBy('name', 'asc')
        .limit(per_page)
        .offset(offset)
        .select('*'),
      db('skills').where({ farm_id: farmId }).count('* as count'),
    ]);

    res.json({
      success: true,
      data: {
        data: skills,
        total: Number.Number.Number.Number.parseInt(count as string),
        page,
        per_page,
        total_pages: Math.ceil(Number.Number.Number.Number.parseInt(count as string) / per_page),
      },
    });
  } catch {
    next(error);
  }
});

// GET /api/skills/:id - Get single skill with workers
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    const skill = await db('skills').where({ id, farm_id: farmId }).first();

    if (!skill) {
      throw new AppError('Skill not found', 404);
    }

    // Get workers with this skill
    const workers = await db('worker_skills')
      .join('workers', 'worker_skills.worker_id', 'workers.id')
      .where({ 'worker_skills.skill_id': id })
      .select(
        'workers.id',
        'workers.first_name',
        'workers.last_name',
        'worker_skills.proficiency_level',
        'worker_skills.years_experience'
      );

    res.json({
      success: true,
      data: {
        ...skill,
        workers,
      },
    });
  } catch {
    next(error);
  }
});

// POST /api/skills - Create new skill (managers and admins only)
router.post('/', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const data = createSkillSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    const [skill] = await db('skills')
      .insert({
        ...data,
        farm_id: farmId,
      })
      .returning('*');

    res.status(201).json({
      success: true,
      data: skill,
    });
  } catch {
    next(error);
  }
});

// PUT /api/skills/:id - Update skill details (managers and admins only)
router.put('/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateSkillSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    const [skill] = await db('skills')
      .where({ id, farm_id: farmId })
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    if (!skill) {
      throw new AppError('Skill not found', 404);
    }

    res.json({
      success: true,
      data: skill,
    });
  } catch {
    next(error);
  }
});

// DELETE /api/skills/:id - Delete skill (admins only)
router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    const deleted = await db('skills').where({ id, farm_id: farmId }).delete();

    if (!deleted) {
      throw new AppError('Skill not found', 404);
    }

    res.json({
      success: true,
      message: 'Skill deleted successfully',
    });
  } catch {
    next(error);
  }
});

// POST /api/workers/:id/skills - Add skill to worker (managers and admins only)
router.post(
  '/workers/:id/skills',
  requireRole('admin', 'manager'),
  async (req: AuthRequest, res, next) => {
    try {
      const { id: workerId } = req.params;
      const data = addWorkerSkillSchema.parse(req.body);
      const farmId = req.user?.farm_id;

      // Verify worker exists and belongs to farm
      const worker = await db('workers').where({ id: workerId, farm_id: farmId }).first();

      if (!worker) {
        throw new AppError('Worker not found', 404);
      }

      // Verify skill exists and belongs to farm
      const skill = await db('skills').where({ id: data.skill_id, farm_id: farmId }).first();

      if (!skill) {
        throw new AppError('Skill not found', 404);
      }

      // Add skill to worker
      const [workerSkill] = await db('worker_skills')
        .insert({
          worker_id: workerId,
          skill_id: data.skill_id,
          proficiency_level: data.proficiency_level || null,
          years_experience: data.years_experience || null,
          notes: data.notes || null,
        })
        .returning('*');

      // Get the skill details to return
      const skillDetails = await db('worker_skills')
        .join('skills', 'worker_skills.skill_id', 'skills.id')
        .where({ 'worker_skills.id': workerSkill.id })
        .select(
          'worker_skills.*',
          'skills.name as skill_name',
          'skills.description as skill_description',
          'skills.category as skill_category'
        )
        .first();

      res.status(201).json({
        success: true,
        data: skillDetails,
      });
    } catch {
      next(error);
    }
  }
);

// GET /api/workers/:id/skills - Get all skills for a worker
router.get('/workers/:id/skills', async (req: AuthRequest, res, next) => {
  try {
    const { id: workerId } = req.params;
    const farmId = req.user?.farm_id;

    // Verify worker exists and belongs to farm
    const worker = await db('workers').where({ id: workerId, farm_id: farmId }).first();

    if (!worker) {
      throw new AppError('Worker not found', 404);
    }

    // Get worker skills
    const workerSkills = await db('worker_skills')
      .join('skills', 'worker_skills.skill_id', 'skills.id')
      .where({ 'worker_skills.worker_id': workerId })
      .select(
        'worker_skills.id',
        'worker_skills.skill_id',
        'worker_skills.proficiency_level',
        'worker_skills.years_experience',
        'worker_skills.notes',
        'worker_skills.created_at',
        'worker_skills.updated_at',
        'skills.name as skill_name',
        'skills.description as skill_description',
        'skills.category as skill_category'
      );

    res.json({
      success: true,
      data: workerSkills,
    });
  } catch {
    next(error);
  }
});

// DELETE /api/workers/:id/skills/:skillId - Remove skill from worker (managers and admins only)
router.delete(
  '/workers/:id/skills/:skillId',
  requireRole('admin', 'manager'),
  async (req: AuthRequest, res, next) => {
    try {
      const { id: workerId, skillId } = req.params;
      const farmId = req.user?.farm_id;

      // Verify worker exists and belongs to farm
      const worker = await db('workers').where({ id: workerId, farm_id: farmId }).first();

      if (!worker) {
        throw new AppError('Worker not found', 404);
      }

      // Delete the worker skill association
      const deleted = await db('worker_skills')
        .where({
          worker_id: workerId,
          skill_id: skillId,
        })
        .delete();

      if (!deleted) {
        throw new AppError('Worker skill association not found', 404);
      }

      res.json({
        success: true,
        message: 'Skill removed from worker successfully',
      });
    } catch {
      next(error);
    }
  }
);

// GET /api/workers/by-skill/:skillId - Find workers with specific skill
router.get('/workers/by-skill/:skillId', async (req: AuthRequest, res, next) => {
  try {
    const { skillId } = req.params;
    const farmId = req.user?.farm_id;

    // Verify skill exists and belongs to farm
    const skill = await db('skills').where({ id: skillId, farm_id: farmId }).first();

    if (!skill) {
      throw new AppError('Skill not found', 404);
    }

    // Get workers with this skill
    const workers = await db('worker_skills')
      .join('workers', 'worker_skills.worker_id', 'workers.id')
      .where({ 'worker_skills.skill_id': skillId, 'workers.farm_id': farmId })
      .select(
        'workers.id',
        'workers.first_name',
        'workers.last_name',
        'workers.email',
        'workers.phone',
        'workers.status',
        'worker_skills.proficiency_level',
        'worker_skills.years_experience',
        'worker_skills.notes'
      )
      .orderBy('worker_skills.proficiency_level', 'desc')
      .orderBy('worker_skills.years_experience', 'desc');

    res.json({
      success: true,
      data: {
        skill,
        workers,
        total: workers.length,
      },
    });
  } catch {
    next(error);
  }
});

export default router;
