// Worker photo management routes

import express from 'express';
import db from '../db/connection.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { uploadPhoto, processAndSavePhoto, deletePhoto, photoExists, getPhotoPath } from '../services/upload.js';
import fs from 'fs/promises';

const router = express.Router();

// All worker photo routes require authentication
router.use(authenticateToken);

/**
 * POST /api/workers/:id/photo
 * Upload a photo for a worker
 * Requires manager or admin role
 */
router.post(
  '/:id/photo',
  requireRole('admin', 'manager'),
  uploadPhoto.single('photo'),
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const farmId = req.user?.farm_id;

      if (!req.file) {
        throw new AppError('No photo file provided', 400);
      }

      // Verify worker exists and belongs to the farm
      const worker = await db('workers')
        .where({ id, farm_id: farmId })
        .first();

      if (!worker) {
        throw new AppError('Worker not found', 404);
      }

      // Delete old photo if exists
      if (worker.photo_url) {
        await deletePhoto(worker.photo_url).catch(console.error);
      }

      // Process and save the new photo
      const photoUrl = await processAndSavePhoto(req.file.buffer, id);

      // Update worker record with new photo URL
      const [updatedWorker] = await db('workers')
        .where({ id, farm_id: farmId })
        .update({
          photo_url: photoUrl,
          updated_at: new Date(),
        })
        .returning('*');

      res.status(200).json({
        success: true,
        data: {
          photo_url: photoUrl,
          worker: updatedWorker,
        },
        message: 'Photo uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/workers/:id/photo
 * Retrieve a worker's photo
 * Returns the actual image file
 */
router.get('/:id/photo', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;

    // Verify worker exists and belongs to the farm
    const worker = await db('workers')
      .where({ id, farm_id: farmId })
      .select('photo_url')
      .first();

    if (!worker) {
      throw new AppError('Worker not found', 404);
    }

    if (!worker.photo_url) {
      throw new AppError('Worker has no photo', 404);
    }

    // Check if photo file exists
    const exists = await photoExists(worker.photo_url);
    if (!exists) {
      throw new AppError('Photo file not found', 404);
    }

    // Get the file path and send the file
    const photoPath = getPhotoPath(worker.photo_url);

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Stream the file to the response
    const fileBuffer = await fs.readFile(photoPath);
    res.send(fileBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/workers/:id/photo
 * Remove a worker's photo
 * Requires manager or admin role
 */
router.delete(
  '/:id/photo',
  requireRole('admin', 'manager'),
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const farmId = req.user?.farm_id;

      // Verify worker exists and belongs to the farm
      const worker = await db('workers')
        .where({ id, farm_id: farmId })
        .first();

      if (!worker) {
        throw new AppError('Worker not found', 404);
      }

      if (!worker.photo_url) {
        throw new AppError('Worker has no photo to delete', 404);
      }

      // Delete the photo file
      await deletePhoto(worker.photo_url);

      // Update worker record to remove photo URL
      await db('workers')
        .where({ id, farm_id: farmId })
        .update({
          photo_url: null,
          updated_at: new Date(),
        });

      res.json({
        success: true,
        message: 'Photo deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
