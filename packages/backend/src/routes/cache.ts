// Cache management routes
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  getCacheStats,
  resetCacheStats,
  invalidateCache,
  invalidateCacheByResource,
  invalidateAllCache,
} from '../middleware/cache.js';

const router = Router();

/**
 * GET /api/cache/stats
 * Get cache hit rate and statistics
 * Requires: Admin role
 */
router.get('/stats', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const stats = getCacheStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cache statistics',
    });
  }
});

/**
 * POST /api/cache/stats/reset
 * Reset cache statistics
 * Requires: Admin role
 */
router.post('/stats/reset', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    resetCacheStats();
    res.json({
      success: true,
      message: 'Cache statistics reset successfully',
    });
  } catch {
    res.status(500).json({
      success: false,
      error: 'Failed to reset cache statistics',
    });
  }
});

/**
 * DELETE /api/cache/invalidate
 * Invalidate cache by pattern
 * Requires: Admin role
 * Body: { pattern: string }
 */
router.delete('/invalidate', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { pattern } = req.body;

    if (!pattern || typeof pattern !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Pattern is required and must be a string',
      });
      return;
    }

    const deletedCount = await invalidateCache(pattern);

    res.json({
      success: true,
      data: {
        pattern,
        deletedCount,
      },
      message: `Invalidated ${deletedCount} cache entries`,
    });
  } catch {
    res.status(500).json({
      success: false,
      error: 'Failed to invalidate cache',
    });
  }
});

/**
 * DELETE /api/cache/invalidate/:resource
 * Invalidate cache for a specific resource
 * Requires: Admin role
 */
router.delete('/invalidate/:resource', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { resource } = req.params;

    if (!resource) {
      res.status(400).json({
        success: false,
        error: 'Resource parameter is required',
      });
      return;
    }

    const deletedCount = await invalidateCacheByResource(resource);

    res.json({
      success: true,
      data: {
        resource,
        deletedCount,
      },
      message: `Invalidated ${deletedCount} cache entries for resource: ${resource}`,
    });
  } catch {
    res.status(500).json({
      success: false,
      error: 'Failed to invalidate cache',
    });
  }
});

/**
 * DELETE /api/cache/all
 * Clear all cache entries
 * Requires: Admin role
 */
router.delete('/all', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await invalidateAllCache();

    res.json({
      success: true,
      message: 'All cache entries cleared successfully',
    });
  } catch {
    res.status(500).json({
      success: false,
      error: 'Failed to clear all cache',
    });
  }
});

export default router;
