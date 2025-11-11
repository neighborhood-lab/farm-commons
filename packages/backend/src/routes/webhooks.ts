// Webhook management routes

import express from 'express';
import { createWebhookSchema, updateWebhookSchema } from '@farm-commons/shared';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  registerWebhook,
  getWebhooks,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  regenerateSecret,
  getDeliveryHistory,
  retryDelivery,
  WEBHOOK_EVENTS,
} from '../services/webhooks.js';

const router = express.Router();

// All webhook routes require authentication
router.use(authenticateToken);

/**
 * GET /api/webhooks/events
 * List available webhook events
 */
router.get('/events', (req, res) => {
  res.json({
    success: true,
    data: WEBHOOK_EVENTS,
  });
});

/**
 * GET /api/webhooks
 * List all webhooks for the authenticated farm
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const farmId = req.user?.farm_id;
    if (!farmId) {
      throw new AppError('Farm ID not found', 400);
    }

    const webhooks = await getWebhooks(farmId);

    // Don't expose secret keys in the list
    const sanitizedWebhooks = webhooks.map(({ secret_key, ...webhook }) => ({
      ...webhook,
      has_secret: true,
    }));

    res.json({
      success: true,
      data: sanitizedWebhooks,
    });
  } catch {
    next(error);
  }
});

/**
 * GET /api/webhooks/:id
 * Get a single webhook by ID
 */
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;
    if (!farmId) {
      throw new AppError('Farm ID not found', 400);
    }

    const webhook = await getWebhook(id, farmId);

    if (!webhook) {
      throw new AppError('Webhook not found', 404);
    }

    // Don't expose secret key in response
    const { secret_key, ...sanitizedWebhook } = webhook;

    res.json({
      success: true,
      data: {
        ...sanitizedWebhook,
        has_secret: true,
      },
    });
  } catch {
    next(error);
  }
});

/**
 * POST /api/webhooks
 * Create a new webhook (managers and admins only)
 */
router.post('/', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const data = createWebhookSchema.parse(req.body);
    const farmId = req.user?.farm_id;
    if (!farmId) {
      throw new AppError('Farm ID not found', 400);
    }

    const webhook = await registerWebhook(
      farmId,
      data.url,
      data.events as any,
      data.description || undefined
    );

    // Return the secret key only on creation (one time)
    res.status(201).json({
      success: true,
      data: {
        ...webhook,
        message: 'Webhook created successfully. Save the secret_key - it will not be shown again.',
      },
    });
  } catch {
    next(error);
  }
});

/**
 * PUT /api/webhooks/:id
 * Update a webhook (managers and admins only)
 */
router.put('/:id', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateWebhookSchema.parse(req.body);
    const farmId = req.user?.farm_id;
    if (!farmId) {
      throw new AppError('Farm ID not found', 400);
    }

    const webhook = await updateWebhook(id, farmId, data as any);

    if (!webhook) {
      throw new AppError('Webhook not found', 404);
    }

    // Don't expose secret key
    const { secret_key, ...sanitizedWebhook } = webhook;

    res.json({
      success: true,
      data: {
        ...sanitizedWebhook,
        has_secret: true,
      },
    });
  } catch {
    next(error);
  }
});

/**
 * DELETE /api/webhooks/:id
 * Delete a webhook (admins only)
 */
router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;
    if (!farmId) {
      throw new AppError('Farm ID not found', 400);
    }

    const deleted = await deleteWebhook(id, farmId);

    if (!deleted) {
      throw new AppError('Webhook not found', 404);
    }

    res.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch {
    next(error);
  }
});

/**
 * POST /api/webhooks/:id/regenerate-secret
 * Regenerate the secret key for a webhook (admins only)
 */
router.post('/:id/regenerate-secret', requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;
    if (!farmId) {
      throw new AppError('Farm ID not found', 400);
    }

    const newSecret = await regenerateSecret(id, farmId);

    if (!newSecret) {
      throw new AppError('Webhook not found', 404);
    }

    res.json({
      success: true,
      data: {
        secret_key: newSecret,
        message: 'Secret key regenerated. Save it - it will not be shown again.',
      },
    });
  } catch {
    next(error);
  }
});

/**
 * GET /api/webhooks/:id/deliveries
 * Get delivery history for a webhook
 */
router.get('/:id/deliveries', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const farmId = req.user?.farm_id;
    if (!farmId) {
      throw new AppError('Farm ID not found', 400);
    }

    // Verify webhook belongs to this farm
    const webhook = await getWebhook(id, farmId);
    if (!webhook) {
      throw new AppError('Webhook not found', 404);
    }

    const limit = Number.Number.Number.parseInt(req.query.limit as string) || 50;
    const deliveries = await getDeliveryHistory(id, limit);

    res.json({
      success: true,
      data: deliveries,
    });
  } catch {
    next(error);
  }
});

/**
 * POST /api/webhooks/deliveries/:deliveryId/retry
 * Retry a failed webhook delivery (managers and admins only)
 */
router.post('/deliveries/:deliveryId/retry', requireRole('admin', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { deliveryId } = req.params;

    await retryDelivery(deliveryId);

    res.json({
      success: true,
      message: 'Delivery retry scheduled',
    });
  } catch {
    next(error);
  }
});

export default router;
