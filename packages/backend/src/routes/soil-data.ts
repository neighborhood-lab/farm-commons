// Soil testing and analysis data routes

import express, { type Router } from 'express';
import { z } from 'zod';
import db from '../db/connection.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router: Router = express.Router();

// All soil data routes require authentication
router.use(authenticateToken);

// Schema for creating/updating soil test
const soilTestSchema = z.object({
  test_date: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  lab_name: z.string().max(200).optional(),
  test_type: z.string().max(100),
  ph_level: z.number().min(0).max(14).optional(),
  organic_matter_percent: z.number().min(0).max(100).optional(),
  nitrogen_ppm: z.number().min(0).optional(),
  phosphorus_ppm: z.number().min(0).optional(),
  potassium_ppm: z.number().min(0).optional(),
  calcium_ppm: z.number().min(0).optional(),
  magnesium_ppm: z.number().min(0).optional(),
  sulfur_ppm: z.number().min(0).optional(),
  iron_ppm: z.number().min(0).optional(),
  manganese_ppm: z.number().min(0).optional(),
  zinc_ppm: z.number().min(0).optional(),
  copper_ppm: z.number().min(0).optional(),
  boron_ppm: z.number().min(0).optional(),
  cec_meq_100g: z.number().min(0).optional(),
  texture: z.string().max(100).optional(),
  recommendations: z.string().optional(),
  notes: z.string().optional(),
  document_url: z.string().url().optional(),
});

// POST /api/fields/:fieldId/soil-tests - Record new soil test
router.post('/fields/:fieldId/soil-tests', async (req: AuthRequest, res, next) => {
  try {
    const { fieldId } = req.params;
    const farmId = req.user?.farm_id;

    // Verify field exists and belongs to farm
    const field = await db('fields').where({ id: fieldId, farm_id: farmId }).first();

    if (!field) {
      throw new AppError('Field not found', 404);
    }

    // Validate request body
    const validatedData = soilTestSchema.parse(req.body);

    // Insert soil test record
    const [soilTest] = await db('soil_tests')
      .insert({
        field_id: fieldId,
        farm_id: farmId,
        ...validatedData,
      })
      .returning('*');

    res.status(201).json({
      success: true,
      data: soilTest,
    });
  } catch {
    next(error);
  }
});

// GET /api/fields/:fieldId/soil-tests - Get test history for a field
router.get('/fields/:fieldId/soil-tests', async (req: AuthRequest, res, next) => {
  try {
    const { fieldId } = req.params;
    const farmId = req.user?.farm_id;

    // Verify field exists and belongs to farm
    const field = await db('fields').where({ id: fieldId, farm_id: farmId }).first();

    if (!field) {
      throw new AppError('Field not found', 404);
    }

    // Get all soil tests for the field, ordered by test date descending
    const soilTests = await db('soil_tests')
      .where({ field_id: fieldId, farm_id: farmId })
      .orderBy('test_date', 'desc');

    // Get nutrient trends (compare latest test to previous)
    let trends = null;
    if (soilTests.length >= 2) {
      const latest = soilTests[0];
      const previous = soilTests[1];

      trends = {
        ph_level: calculateTrend(latest.ph_level, previous.ph_level),
        organic_matter: calculateTrend(
          latest.organic_matter_percent,
          previous.organic_matter_percent
        ),
        nitrogen: calculateTrend(latest.nitrogen_ppm, previous.nitrogen_ppm),
        phosphorus: calculateTrend(latest.phosphorus_ppm, previous.phosphorus_ppm),
        potassium: calculateTrend(latest.potassium_ppm, previous.potassium_ppm),
      };
    }

    res.json({
      success: true,
      data: {
        field_id: fieldId,
        field_name: field.name,
        test_count: soilTests.length,
        tests: soilTests,
        trends,
      },
    });
  } catch {
    next(error);
  }
});

// GET /api/fields/:fieldId/soil-tests/:testId - Get single soil test
router.get('/fields/:fieldId/soil-tests/:testId', async (req: AuthRequest, res, next) => {
  try {
    const { fieldId, testId } = req.params;
    const farmId = req.user?.farm_id;

    // Verify field exists and belongs to farm
    const field = await db('fields').where({ id: fieldId, farm_id: farmId }).first();

    if (!field) {
      throw new AppError('Field not found', 404);
    }

    // Get the specific soil test
    const soilTest = await db('soil_tests')
      .where({
        id: testId,
        field_id: fieldId,
        farm_id: farmId,
      })
      .first();

    if (!soilTest) {
      throw new AppError('Soil test not found', 404);
    }

    // Generate recommendations based on test results
    const recommendations = generateRecommendations(soilTest);

    res.json({
      success: true,
      data: {
        ...soilTest,
        auto_recommendations: recommendations,
      },
    });
  } catch {
    next(error);
  }
});

// PUT /api/fields/:fieldId/soil-tests/:testId - Update soil test
router.put('/fields/:fieldId/soil-tests/:testId', async (req: AuthRequest, res, next) => {
  try {
    const { fieldId, testId } = req.params;
    const farmId = req.user?.farm_id;

    // Verify field exists and belongs to farm
    const field = await db('fields').where({ id: fieldId, farm_id: farmId }).first();

    if (!field) {
      throw new AppError('Field not found', 404);
    }

    // Verify soil test exists
    const existingTest = await db('soil_tests')
      .where({
        id: testId,
        field_id: fieldId,
        farm_id: farmId,
      })
      .first();

    if (!existingTest) {
      throw new AppError('Soil test not found', 404);
    }

    // Validate request body
    const validatedData = soilTestSchema.partial().parse(req.body);

    // Update soil test
    const [updatedTest] = await db('soil_tests')
      .where({ id: testId })
      .update({
        ...validatedData,
        updated_at: new Date(),
      })
      .returning('*');

    res.json({
      success: true,
      data: updatedTest,
    });
  } catch {
    next(error);
  }
});

// DELETE /api/fields/:fieldId/soil-tests/:testId - Delete soil test
router.delete('/fields/:fieldId/soil-tests/:testId', async (req: AuthRequest, res, next) => {
  try {
    const { fieldId, testId } = req.params;
    const farmId = req.user?.farm_id;

    // Verify field exists and belongs to farm
    const field = await db('fields').where({ id: fieldId, farm_id: farmId }).first();

    if (!field) {
      throw new AppError('Field not found', 404);
    }

    // Delete the soil test
    const deletedCount = await db('soil_tests')
      .where({
        id: testId,
        field_id: fieldId,
        farm_id: farmId,
      })
      .delete();

    if (deletedCount === 0) {
      throw new AppError('Soil test not found', 404);
    }

    res.json({
      success: true,
      message: 'Soil test deleted successfully',
    });
  } catch {
    next(error);
  }
});

// Type for nullable numeric values
type NullableNumericValue = string | number | null;

// Helper function to calculate trend
function calculateTrend(
  latest: NullableNumericValue,
  previous: NullableNumericValue
): string | null {
  if (latest === null || previous === null) {
    return null;
  }

  const latestValue = Number.parseFloat(String(latest));
  const previousValue = Number.parseFloat(String(previous));

  if (Number.isNaN(latestValue) || Number.isNaN(previousValue)) {
    return null;
  }

  const change = latestValue - previousValue;
  const percentChange = (change / previousValue) * 100;

  if (Math.abs(percentChange) < 5) {
    return 'stable';
  } else if (percentChange > 0) {
    return 'increasing';
  } else {
    return 'decreasing';
  }
}

// Helper function to generate automatic recommendations
// eslint-disable-next-line sonarjs/cognitive-complexity
function generateRecommendations(soilTest: Record<string, string | number | null>): string[] {
  const recommendations: string[] = [];

  // pH recommendations
  if (soilTest.ph_level !== null) {
    const ph = Number.parseFloat(String(soilTest.ph_level));
    if (ph < 6) {
      recommendations.push('Soil is acidic. Consider applying lime to raise pH.');
    } else if (ph > 7.5) {
      recommendations.push('Soil is alkaline. Consider applying sulfur to lower pH.');
    } else {
      recommendations.push('Soil pH is in optimal range (6.1-7.5).');
    }
  }

  // Organic matter recommendations
  if (soilTest.organic_matter_percent !== null) {
    const om = Number.parseFloat(String(soilTest.organic_matter_percent));
    if (om < 3) {
      recommendations.push(
        'Organic matter is low. Add compost or cover crops to improve soil health.'
      );
    } else if (om >= 5) {
      recommendations.push('Excellent organic matter content.');
    }
  }

  // Nitrogen recommendations
  if (soilTest.nitrogen_ppm !== null) {
    const n = Number.parseFloat(String(soilTest.nitrogen_ppm));
    if (n < 20) {
      recommendations.push(
        'Nitrogen is low. Consider nitrogen-rich fertilizers or legume cover crops.'
      );
    } else if (n > 50) {
      recommendations.push('Nitrogen is high. Reduce nitrogen inputs to prevent runoff.');
    }
  }

  // Phosphorus recommendations
  if (soilTest.phosphorus_ppm !== null) {
    const p = Number.parseFloat(String(soilTest.phosphorus_ppm));
    if (p < 25) {
      recommendations.push('Phosphorus is low. Apply phosphate fertilizer or bone meal.');
    } else if (p > 75) {
      recommendations.push('Phosphorus is sufficient. No additional phosphorus needed.');
    }
  }

  // Potassium recommendations
  if (soilTest.potassium_ppm !== null) {
    const k = Number.parseFloat(String(soilTest.potassium_ppm));
    if (k < 100) {
      recommendations.push('Potassium is low. Apply potash or wood ash.');
    } else if (k > 300) {
      recommendations.push('Potassium is sufficient.');
    }
  }

  // If no specific recommendations, add general advice
  if (recommendations.length === 0) {
    recommendations.push(
      'Insufficient data for automated recommendations. Consult with agronomist.'
    );
  }

  return recommendations;
}

export default router;
