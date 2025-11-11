// Webhook Service for External Integrations

import crypto from 'node:crypto';
import db from '../db/connection.js';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  name: 'webhook-service',
});

// Supported webhook events
export const WEBHOOK_EVENTS = [
  'worker.created',
  'worker.updated',
  'worker.deleted',
  'schedule.created',
  'schedule.updated',
  'schedule.deleted',
  'time_entry.created',
  'time_entry.updated',
  'certification.expiring',
] as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[number];

interface WebhookRegistration {
  id: string;
  farm_id: string;
  url: string;
  secret_key: string;
  events: string[];
  active: boolean;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: any;
  status: 'pending' | 'success' | 'failed';
  attempt_count: number;
  response_status?: number;
  response_body?: string;
  error_message?: string;
  next_retry_at?: Date;
  delivered_at?: Date;
  created_at: Date;
  updated_at: Date;
}

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  farm_id: string;
  data: any;
}

/**
 * Generate a secret key for webhook signature verification
 */
export function generateSecretKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate HMAC signature for webhook payload
 */
export function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Register a new webhook
 */
export async function registerWebhook(
  farmId: string,
  url: string,
  events: WebhookEvent[],
  description?: string
): Promise<WebhookRegistration> {
  const secretKey = generateSecretKey();

  const [webhook] = await db('webhooks')
    .insert({
      farm_id: farmId,
      url,
      secret_key: secretKey,
      events,
      description,
      active: true,
    })
    .returning('*');

  logger.info({ webhookId: webhook.id, farmId, url }, 'Webhook registered');

  return webhook;
}

/**
 * Get all webhooks for a farm
 */
export async function getWebhooks(farmId: string): Promise<WebhookRegistration[]> {
  return db('webhooks')
    .where({ farm_id: farmId })
    .orderBy('created_at', 'desc')
    .select('*');
}

/**
 * Get a single webhook by ID
 */
export async function getWebhook(
  id: string,
  farmId: string
): Promise<WebhookRegistration | null> {
  const webhook = await db('webhooks')
    .where({ id, farm_id: farmId })
    .first();

  return webhook || null;
}

/**
 * Update a webhook
 */
export async function updateWebhook(
  id: string,
  farmId: string,
  updates: {
    url?: string;
    events?: WebhookEvent[];
    active?: boolean;
    description?: string;
  }
): Promise<WebhookRegistration | null> {
  const [webhook] = await db('webhooks')
    .where({ id, farm_id: farmId })
    .update({
      ...updates,
      updated_at: new Date(),
    })
    .returning('*');

  if (webhook) {
    logger.info({ webhookId: id, farmId }, 'Webhook updated');
  }

  return webhook || null;
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(id: string, farmId: string): Promise<boolean> {
  const deleted = await db('webhooks')
    .where({ id, farm_id: farmId })
    .delete();

  if (deleted) {
    logger.info({ webhookId: id, farmId }, 'Webhook deleted');
  }

  return deleted > 0;
}

/**
 * Regenerate secret key for a webhook
 */
export async function regenerateSecret(
  id: string,
  farmId: string
): Promise<string | null> {
  const newSecret = generateSecretKey();

  const [webhook] = await db('webhooks')
    .where({ id, farm_id: farmId })
    .update({
      secret_key: newSecret,
      updated_at: new Date(),
    })
    .returning('secret_key');

  if (webhook) {
    logger.info({ webhookId: id, farmId }, 'Webhook secret regenerated');
    return webhook.secret_key;
  }

  return null;
}

/**
 * Trigger a webhook event
 */
export async function triggerEvent(
  farmId: string,
  event: WebhookEvent,
  data: any
): Promise<void> {
  // Find all active webhooks subscribed to this event
  const webhooks = await db('webhooks')
    .where({ farm_id: farmId, active: true })
    .whereRaw('? = ANY(events)', [event])
    .select('*');

  if (webhooks.length === 0) {
    logger.debug({ farmId, event }, 'No active webhooks for event');
    return;
  }

  logger.info(
    { farmId, event, webhookCount: webhooks.length },
    'Triggering webhook event'
  );

  // Create delivery records for each webhook
  const deliveries = webhooks.map((webhook) => ({
    webhook_id: webhook.id,
    event_type: event,
    payload: {
      event,
      timestamp: new Date().toISOString(),
      farm_id: farmId,
      data,
    },
    status: 'pending' as const,
    attempt_count: 0,
  }));

  await db('webhook_deliveries').insert(deliveries);

  // Process deliveries asynchronously (don't wait)
  processDeliveries().catch((error) => {
    logger.error({ error }, 'Error processing webhook deliveries');
  });
}

/**
 * Process pending webhook deliveries
 */
export async function processDeliveries(): Promise<void> {
  const now = new Date();

  // Get pending deliveries that are ready to be sent
  const deliveries = await db('webhook_deliveries')
    .where({ status: 'pending' })
    .where(function () {
      this.whereNull('next_retry_at').orWhere('next_retry_at', '<=', now);
    })
    .whereRaw('attempt_count < ?', [5]) // Max 5 attempts
    .orderBy('created_at', 'asc')
    .limit(50) // Process in batches
    .select('*');

  if (deliveries.length === 0) {
    return;
  }

  logger.info({ count: deliveries.length }, 'Processing webhook deliveries');

  // Process each delivery
  for (const delivery of deliveries) {
    await deliverWebhook(delivery);
  }
}

/**
 * Deliver a single webhook
 */
async function deliverWebhook(delivery: WebhookDelivery): Promise<void> {
  // Get webhook details
  const webhook = await db('webhooks')
    .where({ id: delivery.webhook_id })
    .first();

  if (!webhook || !webhook.active) {
    // Webhook was deleted or deactivated, mark as failed
    await db('webhook_deliveries')
      .where({ id: delivery.id })
      .update({
        status: 'failed',
        error_message: 'Webhook not found or inactive',
        updated_at: new Date(),
      });
    return;
  }

  const payloadString = JSON.stringify(delivery.payload);
  const signature = generateSignature(payloadString, webhook.secret_key);

  try {
    // Send HTTP POST request
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': delivery.event_type,
        'User-Agent': 'FarmCommons-Webhook/1.1',
      },
      body: payloadString,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const responseBody = await response.text();

    if (response.ok) {
      // Success
      await db('webhook_deliveries')
        .where({ id: delivery.id })
        .update({
          status: 'success',
          response_status: response.status,
          response_body: responseBody.substring(0, 1000), // Limit storage
          delivered_at: new Date(),
          updated_at: new Date(),
        });

      logger.info(
        {
          deliveryId: delivery.id,
          webhookId: webhook.id,
          event: delivery.event_type,
          status: response.status,
        },
        'Webhook delivered successfully'
      );
    } else {
      // HTTP error, will retry
      await recordFailedDelivery(
        delivery.id,
        delivery.attempt_count + 1,
        response.status,
        responseBody,
        `HTTP ${response.status}: ${response.statusText}`
      );
    }
  } catch {
    // Network error or timeout, will retry
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await recordFailedDelivery(
      delivery.id,
      delivery.attempt_count + 1,
      undefined,
      undefined,
      errorMessage
    );
  }
}

/**
 * Record a failed delivery attempt
 */
async function recordFailedDelivery(
  deliveryId: string,
  attemptCount: number,
  responseStatus?: number,
  responseBody?: string,
  errorMessage?: string
): Promise<void> {
  // Calculate next retry time using exponential backoff
  // 1 min, 5 min, 15 min, 1 hour, 4 hours
  const retryDelays = [60, 300, 900, 3600, 14400]; // in seconds
  const delaySeconds = retryDelays[Math.min(attemptCount - 1, retryDelays.length - 1)];
  const nextRetryAt = new Date(Date.now() + delaySeconds * 1000);

  const status = attemptCount >= 5 ? 'failed' : 'pending';

  await db('webhook_deliveries')
    .where({ id: deliveryId })
    .update({
      status,
      attempt_count: attemptCount,
      response_status: responseStatus,
      response_body: responseBody?.substring(0, 1000),
      error_message: errorMessage?.substring(0, 1000),
      next_retry_at: status === 'pending' ? nextRetryAt : null,
      updated_at: new Date(),
    });

  logger.warn(
    {
      deliveryId,
      attemptCount,
      nextRetryAt: status === 'pending' ? nextRetryAt : undefined,
      errorMessage,
    },
    'Webhook delivery failed'
  );
}

/**
 * Get delivery history for a webhook
 */
export async function getDeliveryHistory(
  webhookId: string,
  limit = 50
): Promise<WebhookDelivery[]> {
  return db('webhook_deliveries')
    .where({ webhook_id: webhookId })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .select('*');
}

/**
 * Retry a failed delivery
 */
export async function retryDelivery(deliveryId: string): Promise<void> {
  await db('webhook_deliveries')
    .where({ id: deliveryId })
    .update({
      status: 'pending',
      next_retry_at: new Date(),
      updated_at: new Date(),
    });

  // Process immediately
  await processDeliveries();
}
