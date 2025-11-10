// Weather API routes

import express from 'express';
import { z } from 'zod';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  getCurrentWeather,
  getWeatherForecast,
  getWeatherAlerts,
  getCompleteWeather,
  clearWeatherCache,
} from '../services/weather.js';
import db from '../db/connection.js';

const router = express.Router();

// All weather routes require authentication
router.use(authenticateToken);

// Validation schemas
const coordinatesSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

const forecastDaysSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  days: z.coerce.number().min(1).max(7).optional().default(7),
});

const fieldIdSchema = z.object({
  fieldId: z.string().uuid(),
});

/**
 * Helper to get field GPS coordinates
 */
async function getFieldCoordinates(
  fieldId: string,
  farmId: string
): Promise<{ lat: number; lon: number }> {
  const field = await db('fields')
    .where({ id: fieldId, farm_id: farmId })
    .first();

  if (!field) {
    throw new AppError('Field not found', 404);
  }

  if (!field.location_gps) {
    throw new AppError('Field does not have GPS coordinates', 400);
  }

  const coords = field.location_gps as { lat: number; lon: number };

  if (!coords.lat || !coords.lon) {
    throw new AppError('Invalid GPS coordinates for field', 400);
  }

  return { lat: coords.lat, lon: coords.lon };
}

/**
 * GET /api/weather/current
 * Get current weather conditions
 * Query params: lat, lon (required)
 */
router.get('/current', async (req: AuthRequest, res, next) => {
  try {
    const { lat, lon } = coordinatesSchema.parse(req.query);

    const weather = await getCurrentWeather(lat, lon);

    if (!weather) {
      throw new AppError('Weather data not available', 404);
    }

    res.json({
      success: true,
      data: weather,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weather/forecast
 * Get multi-day weather forecast
 * Query params: lat, lon (required), days (optional, default 7)
 */
router.get('/forecast', async (req: AuthRequest, res, next) => {
  try {
    const { lat, lon, days } = forecastDaysSchema.parse(req.query);

    const forecast = await getWeatherForecast(lat, lon, days);

    res.json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weather/alerts
 * Get weather alerts for location
 * Query params: lat, lon (required)
 */
router.get('/alerts', async (req: AuthRequest, res, next) => {
  try {
    const { lat, lon } = coordinatesSchema.parse(req.query);

    const alerts = await getWeatherAlerts(lat, lon);

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weather/complete
 * Get comprehensive weather data (current + forecast + alerts)
 * Query params: lat, lon (required)
 */
router.get('/complete', async (req: AuthRequest, res, next) => {
  try {
    const { lat, lon } = coordinatesSchema.parse(req.query);

    const weatherData = await getCompleteWeather(lat, lon);

    res.json({
      success: true,
      data: weatherData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weather/field/:fieldId/current
 * Get current weather for a specific field
 */
router.get('/field/:fieldId/current', async (req: AuthRequest, res, next) => {
  try {
    const { fieldId } = req.params;
    const farmId = req.user?.farm_id;

    if (!farmId) {
      throw new AppError('Farm ID not found', 400);
    }

    const { lat, lon } = await getFieldCoordinates(fieldId, farmId);
    const weather = await getCurrentWeather(lat, lon);

    if (!weather) {
      throw new AppError('Weather data not available', 404);
    }

    res.json({
      success: true,
      data: {
        fieldId,
        coordinates: { lat, lon },
        weather,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weather/field/:fieldId/forecast
 * Get weather forecast for a specific field
 */
router.get('/field/:fieldId/forecast', async (req: AuthRequest, res, next) => {
  try {
    const { fieldId } = req.params;
    const farmId = req.user?.farm_id;
    const { days } = z.object({ days: z.coerce.number().min(1).max(7).optional().default(7) }).parse(req.query);

    if (!farmId) {
      throw new AppError('Farm ID not found', 400);
    }

    const { lat, lon } = await getFieldCoordinates(fieldId, farmId);
    const forecast = await getWeatherForecast(lat, lon, days);

    res.json({
      success: true,
      data: {
        fieldId,
        coordinates: { lat, lon },
        forecast,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weather/field/:fieldId/complete
 * Get complete weather data for a specific field
 */
router.get('/field/:fieldId/complete', async (req: AuthRequest, res, next) => {
  try {
    const { fieldId } = req.params;
    const farmId = req.user?.farm_id;

    if (!farmId) {
      throw new AppError('Farm ID not found', 400);
    }

    const { lat, lon } = await getFieldCoordinates(fieldId, farmId);
    const weatherData = await getCompleteWeather(lat, lon);

    res.json({
      success: true,
      data: {
        fieldId,
        coordinates: { lat, lon },
        ...weatherData,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/weather/cache
 * Clear weather cache for specific coordinates
 * Query params: lat, lon (required)
 */
router.delete('/cache', async (req: AuthRequest, res, next) => {
  try {
    const { lat, lon } = coordinatesSchema.parse(req.query);

    await clearWeatherCache(lat, lon);

    res.json({
      success: true,
      message: 'Weather cache cleared successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
