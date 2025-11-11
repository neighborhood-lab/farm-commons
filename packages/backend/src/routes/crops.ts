// Crop management and rotation planning routes

import express from 'express';
import {
  createCropSchema,
  updateCropSchema,
  createCropCompanionSchema,
  updateCropCompanionSchema,
} from '@farm-commons/shared';
import db from '../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(authenticateToken);

// ==================== Crops CRUD ====================

// Get all crops for the farm
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;
    const { field_id, status, season } = req.query;

    let query = db('crops')
      .where({ 'crops.farm_id': farmId })
      .leftJoin('fields', 'crops.field_id', 'fields.id')
      .leftJoin('crop_families', 'crops.crop_family_id', 'crop_families.id')
      .select('crops.*', 'fields.name as field_name', 'crop_families.name as crop_family_name');

    // Apply filters
    if (field_id) {
      query = query.where({ 'crops.field_id': field_id });
    }
    if (status) {
      query = query.where({ 'crops.status': status });
    }
    if (season) {
      query = query.where({ 'crops.season': season });
    }

    const crops = await query.orderBy('crops.planting_date', 'desc');

    res.json({
      success: true,
      data: crops,
    });
  } catch (error) {
    next(error);
  }
});

// Get single crop by ID
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    const crop = await db('crops')
      .where({ 'crops.id': id, 'crops.farm_id': farmId })
      .leftJoin('fields', 'crops.field_id', 'fields.id')
      .leftJoin('crop_families', 'crops.crop_family_id', 'crop_families.id')
      .select('crops.*', 'fields.name as field_name', 'crop_families.name as crop_family_name')
      .first();

    if (!crop) {
      throw new AppError('Crop not found', 404);
    }

    res.json({
      success: true,
      data: crop,
    });
  } catch (error) {
    next(error);
  }
});

// Create new crop
router.post('/', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const data = createCropSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Verify field belongs to farm
    const field = await db('fields').where({ id: data.field_id, farm_id: farmId }).first();

    if (!field) {
      throw new AppError('Field not found or does not belong to this farm', 404);
    }

    // Update field's current_crop if status is planted or growing
    if (data.status === 'planted' || data.status === 'growing') {
      await db('fields').where({ id: data.field_id }).update({
        current_crop: data.crop_name,
        updated_at: new Date(),
      });
    }

    const [crop] = await db('crops')
      .insert({
        ...data,
        farm_id: farmId,
      })
      .returning('*');

    res.status(201).json({
      success: true,
      data: crop,
    });
  } catch (error) {
    next(error);
  }
});

// Update crop
router.put('/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateCropSchema.parse(req.body);
    const farmId = req.user?.farm_id;

    // Get existing crop
    const existingCrop = await db('crops').where({ id, farm_id: farmId }).first();

    if (!existingCrop) {
      throw new AppError('Crop not found', 404);
    }

    // Update field's current_crop if status is changing to planted/growing
    if (data.status && (data.status === 'planted' || data.status === 'growing')) {
      await db('fields')
        .where({ id: existingCrop.field_id })
        .update({
          current_crop: data.crop_name || existingCrop.crop_name,
          updated_at: new Date(),
        });
    } else if (data.status && (data.status === 'harvested' || data.status === 'failed')) {
      // Clear current_crop if harvested or failed
      await db('fields')
        .where({ id: existingCrop.field_id, current_crop: existingCrop.crop_name })
        .update({
          current_crop: null,
          updated_at: new Date(),
        });
    }

    const [crop] = await db('crops')
      .where({ id, farm_id: farmId })
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    res.json({
      success: true,
      data: crop,
    });
  } catch (error) {
    next(error);
  }
});

// Delete crop
router.delete('/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    const deleted = await db('crops').where({ id, farm_id: farmId }).delete();

    if (!deleted) {
      throw new AppError('Crop not found', 404);
    }

    res.json({
      success: true,
      message: 'Crop deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ==================== Crop History by Field ====================

// Get crop history for a specific field
router.get('/history/field/:fieldId', async (req: AuthRequest, res, next) => {
  try {
    const { fieldId } = req.params;
    const farmId = req.user?.farm_id;

    // Verify field belongs to farm
    const field = await db('fields').where({ id: fieldId, farm_id: farmId }).first();

    if (!field) {
      throw new AppError('Field not found', 404);
    }

    const crops = await db('crops')
      .where({ 'crops.field_id': fieldId, 'crops.farm_id': farmId })
      .leftJoin('crop_families', 'crops.crop_family_id', 'crop_families.id')
      .select(
        'crops.*',
        'crop_families.name as crop_family_name',
        'crop_families.recommended_rotation_years'
      )
      .orderBy('crops.planting_date', 'desc');

    res.json({
      success: true,
      data: {
        field_id: fieldId,
        field_name: field.name,
        crops,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get crop rotation analysis for a field
router.get('/history/field/:fieldId/rotation-analysis', async (req: AuthRequest, res, next) => {
  try {
    const { fieldId } = req.params;
    const farmId = req.user?.farm_id;

    // Verify field belongs to farm
    const field = await db('fields').where({ id: fieldId, farm_id: farmId }).first();

    if (!field) {
      throw new AppError('Field not found', 404);
    }

    // Get crop history with families
    const crops = await db('crops')
      .where({ 'crops.field_id': fieldId, 'crops.farm_id': farmId })
      .leftJoin('crop_families', 'crops.crop_family_id', 'crop_families.id')
      .select(
        'crops.*',
        'crop_families.name as crop_family_name',
        'crop_families.recommended_rotation_years'
      )
      .orderBy('crops.planting_date', 'desc');

    // Analyze rotation patterns
    const familyCounts: Record<
      string,
      { count: number; lastPlanted: Date; recommendedYears: number }
    > = {};

    for (const crop of crops) {
      if (crop.crop_family_name) {
        if (!familyCounts[crop.crop_family_name]) {
          familyCounts[crop.crop_family_name] = {
            count: 0,
            lastPlanted: crop.planting_date,
            recommendedYears: crop.recommended_rotation_years || 3,
          };
        }
        familyCounts[crop.crop_family_name].count++;

        // Update last planted if this crop is more recent
        if (
          new Date(crop.planting_date) > new Date(familyCounts[crop.crop_family_name].lastPlanted)
        ) {
          familyCounts[crop.crop_family_name].lastPlanted = crop.planting_date;
        }
      }
    }

    // Calculate rotation warnings
    const warnings: string[] = [];
    const now = new Date();

    for (const [family, data] of Object.entries(familyCounts)) {
      const yearsSinceLastPlanted =
        (now.getTime() - new Date(data.lastPlanted).getTime()) / (1000 * 60 * 60 * 24 * 365);

      if (yearsSinceLastPlanted < data.recommendedYears) {
        warnings.push(
          `${family} was last planted ${yearsSinceLastPlanted.toFixed(1)} years ago. ` +
            `Recommended rotation: ${data.recommendedYears} years.`
        );
      }
    }

    res.json({
      success: true,
      data: {
        field_id: fieldId,
        field_name: field.name,
        crop_family_history: familyCounts,
        rotation_warnings: warnings,
        total_crops_planted: crops.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ==================== Companion Planting ====================

// Get companion planting suggestions for a crop
router.get('/companions/:cropName', async (req: AuthRequest, res, next) => {
  try {
    const { cropName } = req.params;

    const companions = await db('crop_companions')
      .where({ crop_name: cropName.toLowerCase() })
      .select('*');

    const beneficial = companions.filter((c) => c.relationship_type === 'beneficial');
    const antagonistic = companions.filter((c) => c.relationship_type === 'antagonistic');

    res.json({
      success: true,
      data: {
        crop_name: cropName.toLowerCase(),
        companions: {
          beneficial,
          antagonistic,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get all crop families
router.get('/families/list', async (req: AuthRequest, res, next) => {
  try {
    const families = await db('crop_families').select('*').orderBy('name', 'asc');

    res.json({
      success: true,
      data: families,
    });
  } catch (error) {
    next(error);
  }
});

// ==================== Crop Companion Management ====================

// Get all companion relationships (admin only)
router.get('/companions', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const companions = await db('crop_companions').select('*').orderBy('crop_name', 'asc');

    res.json({
      success: true,
      data: companions,
    });
  } catch (error) {
    next(error);
  }
});

// Create companion relationship (admin only)
router.post('/companions', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const data = createCropCompanionSchema.parse(req.body);

    // Normalize crop names to lowercase
    const normalizedData = {
      ...data,
      crop_name: data.crop_name.toLowerCase(),
      companion_crop: data.companion_crop.toLowerCase(),
    };

    const [companion] = await db('crop_companions').insert(normalizedData).returning('*');

    res.status(201).json({
      success: true,
      data: companion,
    });
  } catch (error) {
    next(error);
  }
});

// Update companion relationship (admin only)
router.put('/companions/:id', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateCropCompanionSchema.parse(req.body);

    // Normalize crop names to lowercase if provided
    const normalizedData = {
      ...data,
      ...(data.crop_name && { crop_name: data.crop_name.toLowerCase() }),
      ...(data.companion_crop && { companion_crop: data.companion_crop.toLowerCase() }),
    };

    const [companion] = await db('crop_companions')
      .where({ id })
      .update({
        ...normalizedData,
        updated_at: new Date(),
      })
      .returning('*');

    if (!companion) {
      throw new AppError('Companion relationship not found', 404);
    }

    res.json({
      success: true,
      data: companion,
    });
  } catch (error) {
    next(error);
  }
});

// Delete companion relationship (admin only)
router.delete('/companions/:id', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await db('crop_companions').where({ id }).delete();

    if (!deleted) {
      throw new AppError('Companion relationship not found', 404);
    }

    res.json({
      success: true,
      message: 'Companion relationship deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
