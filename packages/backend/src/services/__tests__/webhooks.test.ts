// Webhook Service Tests

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import knex from 'knex';
import config from '../../../knexfile.js';
import {
  registerWebhook,
  getWebhooks,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  regenerateSecret,
  triggerEvent,
  getDeliveryHistory,
  generateSignature,
  verifySignature,
  generateSecretKey,
} from '../webhooks.js';

// Create test database connection
const testDb = knex(config.test || config.development);

// Mock farm and webhook IDs
let testFarmId: string;
let testWebhookId: string;

beforeAll(async () => {
  // Run migrations
  await testDb.migrate.latest();

  // Create test farm
  const [farm] = await testDb('farms').insert({
    name: 'Test Farm',
    location: 'Test Location',
    size_acres: 100,
  }).returning('*');

  testFarmId = farm.id;
});

afterAll(async () => {
  // Clean up
  await testDb('farms').where({ id: testFarmId }).delete();
  await testDb.destroy();
});

beforeEach(async () => {
  // Clean up webhooks before each test
  await testDb('webhook_deliveries').delete();
  await testDb('webhooks').delete();
});

describe('Webhook Service', () => {
  describe('Secret Key Management', () => {
    it('should generate a secret key', () => {
      const secret = generateSecretKey();
      expect(secret).toBeDefined();
      expect(secret.length).toBeGreaterThan(0);
    });

    it('should generate unique secret keys', () => {
      const secret1 = generateSecretKey();
      const secret2 = generateSecretKey();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('Signature Verification', () => {
    it('should generate a valid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';
      const signature = generateSignature(payload, secret);

      expect(signature).toBeDefined();
      expect(signature.length).toBeGreaterThan(0);
    });

    it('should verify a valid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';
      const signature = generateSignature(payload, secret);

      const isValid = verifySignature(payload, signature, secret);
      expect(isValid).toBe(true);
    });

    it('should reject an invalid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';
      const wrongSignature = 'invalid-signature-' + '0'.repeat(64);

      expect(() => {
        verifySignature(payload, wrongSignature, secret);
      }).toThrow();
    });

    it('should reject signature with wrong secret', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret1 = 'secret-1';
      const secret2 = 'secret-2';
      const signature = generateSignature(payload, secret1);

      const isValid = verifySignature(payload, signature, secret2);
      expect(isValid).toBe(false);
    });
  });

  describe('Webhook Registration', () => {
    it('should register a new webhook', async () => {
      const webhook = await registerWebhook(
        testFarmId,
        'https://example.com/webhook',
        ['worker.created', 'worker.updated'],
        'Test webhook'
      );

      expect(webhook.id).toBeDefined();
      expect(webhook.farm_id).toBe(testFarmId);
      expect(webhook.url).toBe('https://example.com/webhook');
      expect(webhook.events).toEqual(['worker.created', 'worker.updated']);
      expect(webhook.description).toBe('Test webhook');
      expect(webhook.active).toBe(true);
      expect(webhook.secret_key).toBeDefined();
      expect(webhook.secret_key.length).toBeGreaterThan(0);

      testWebhookId = webhook.id;
    });

    it('should create webhook with unique secret key', async () => {
      const webhook1 = await registerWebhook(
        testFarmId,
        'https://example.com/webhook1',
        ['worker.created']
      );

      const webhook2 = await registerWebhook(
        testFarmId,
        'https://example.com/webhook2',
        ['worker.created']
      );

      expect(webhook1.secret_key).not.toBe(webhook2.secret_key);
    });
  });

  describe('Webhook Retrieval', () => {
    beforeEach(async () => {
      const webhook = await registerWebhook(
        testFarmId,
        'https://example.com/webhook',
        ['worker.created']
      );
      testWebhookId = webhook.id;
    });

    it('should get all webhooks for a farm', async () => {
      await registerWebhook(
        testFarmId,
        'https://example.com/webhook2',
        ['worker.updated']
      );

      const webhooks = await getWebhooks(testFarmId);
      expect(webhooks.length).toBe(2);
      expect(webhooks[0].farm_id).toBe(testFarmId);
    });

    it('should get a single webhook by ID', async () => {
      const webhook = await getWebhook(testWebhookId, testFarmId);

      expect(webhook).toBeDefined();
      expect(webhook?.id).toBe(testWebhookId);
      expect(webhook?.url).toBe('https://example.com/webhook');
    });

    it('should return null for non-existent webhook', async () => {
      const webhook = await getWebhook('00000000-0000-0000-0000-000000000000', testFarmId);
      expect(webhook).toBeNull();
    });
  });

  describe('Webhook Updates', () => {
    beforeEach(async () => {
      const webhook = await registerWebhook(
        testFarmId,
        'https://example.com/webhook',
        ['worker.created']
      );
      testWebhookId = webhook.id;
    });

    it('should update webhook URL', async () => {
      const updated = await updateWebhook(testWebhookId, testFarmId, {
        url: 'https://example.com/new-webhook',
      });

      expect(updated).toBeDefined();
      expect(updated?.url).toBe('https://example.com/new-webhook');
    });

    it('should update webhook events', async () => {
      const updated = await updateWebhook(testWebhookId, testFarmId, {
        events: ['worker.created', 'worker.updated', 'worker.deleted'],
      });

      expect(updated).toBeDefined();
      expect(updated?.events).toEqual(['worker.created', 'worker.updated', 'worker.deleted']);
    });

    it('should deactivate webhook', async () => {
      const updated = await updateWebhook(testWebhookId, testFarmId, {
        active: false,
      });

      expect(updated).toBeDefined();
      expect(updated?.active).toBe(false);
    });

    it('should return null when updating non-existent webhook', async () => {
      const updated = await updateWebhook(
        '00000000-0000-0000-0000-000000000000',
        testFarmId,
        { active: false }
      );

      expect(updated).toBeNull();
    });
  });

  describe('Webhook Deletion', () => {
    beforeEach(async () => {
      const webhook = await registerWebhook(
        testFarmId,
        'https://example.com/webhook',
        ['worker.created']
      );
      testWebhookId = webhook.id;
    });

    it('should delete a webhook', async () => {
      const deleted = await deleteWebhook(testWebhookId, testFarmId);
      expect(deleted).toBe(true);

      const webhook = await getWebhook(testWebhookId, testFarmId);
      expect(webhook).toBeNull();
    });

    it('should return false when deleting non-existent webhook', async () => {
      const deleted = await deleteWebhook('00000000-0000-0000-0000-000000000000', testFarmId);
      expect(deleted).toBe(false);
    });

    it('should cascade delete webhook deliveries', async () => {
      await triggerEvent(testFarmId, 'worker.created', { worker_id: 'test' });

      // Verify delivery was created
      let deliveries = await getDeliveryHistory(testWebhookId);
      expect(deliveries.length).toBeGreaterThan(0);

      // Delete webhook
      await deleteWebhook(testWebhookId, testFarmId);

      // Verify deliveries were deleted
      deliveries = await testDb('webhook_deliveries')
        .where({ webhook_id: testWebhookId });
      expect(deliveries.length).toBe(0);
    });
  });

  describe('Secret Regeneration', () => {
    beforeEach(async () => {
      const webhook = await registerWebhook(
        testFarmId,
        'https://example.com/webhook',
        ['worker.created']
      );
      testWebhookId = webhook.id;
    });

    it('should regenerate secret key', async () => {
      const webhook = await getWebhook(testWebhookId, testFarmId);
      const oldSecret = webhook?.secret_key;

      const newSecret = await regenerateSecret(testWebhookId, testFarmId);

      expect(newSecret).toBeDefined();
      expect(newSecret).not.toBe(oldSecret);
    });

    it('should return null when regenerating for non-existent webhook', async () => {
      const newSecret = await regenerateSecret(
        '00000000-0000-0000-0000-000000000000',
        testFarmId
      );
      expect(newSecret).toBeNull();
    });
  });

  describe('Event Triggering', () => {
    beforeEach(async () => {
      const webhook = await registerWebhook(
        testFarmId,
        'https://example.com/webhook',
        ['worker.created', 'worker.updated']
      );
      testWebhookId = webhook.id;
    });

    it('should create delivery for matching event', async () => {
      await triggerEvent(testFarmId, 'worker.created', {
        worker_id: 'test-worker-id',
        name: 'Test Worker',
      });

      const deliveries = await getDeliveryHistory(testWebhookId);
      expect(deliveries.length).toBe(1);
      expect(deliveries[0].event_type).toBe('worker.created');
      expect(deliveries[0].status).toBe('pending');
      expect(deliveries[0].payload.data.worker_id).toBe('test-worker-id');
    });

    it('should not create delivery for non-subscribed event', async () => {
      await triggerEvent(testFarmId, 'schedule.created', {
        schedule_id: 'test-schedule-id',
      });

      const deliveries = await getDeliveryHistory(testWebhookId);
      expect(deliveries.length).toBe(0);
    });

    it('should not create delivery for inactive webhook', async () => {
      await updateWebhook(testWebhookId, testFarmId, { active: false });

      await triggerEvent(testFarmId, 'worker.created', {
        worker_id: 'test-worker-id',
      });

      const deliveries = await getDeliveryHistory(testWebhookId);
      expect(deliveries.length).toBe(0);
    });

    it('should create deliveries for multiple webhooks', async () => {
      const webhook2 = await registerWebhook(
        testFarmId,
        'https://example.com/webhook2',
        ['worker.created']
      );

      await triggerEvent(testFarmId, 'worker.created', {
        worker_id: 'test-worker-id',
      });

      const deliveries1 = await getDeliveryHistory(testWebhookId);
      const deliveries2 = await getDeliveryHistory(webhook2.id);

      expect(deliveries1.length).toBe(1);
      expect(deliveries2.length).toBe(1);
    });
  });

  describe('Delivery History', () => {
    beforeEach(async () => {
      const webhook = await registerWebhook(
        testFarmId,
        'https://example.com/webhook',
        ['worker.created']
      );
      testWebhookId = webhook.id;
    });

    it('should get delivery history', async () => {
      await triggerEvent(testFarmId, 'worker.created', { id: '1' });
      await triggerEvent(testFarmId, 'worker.created', { id: '2' });
      await triggerEvent(testFarmId, 'worker.created', { id: '3' });

      const deliveries = await getDeliveryHistory(testWebhookId);
      expect(deliveries.length).toBe(3);
    });

    it('should limit delivery history', async () => {
      for (let i = 0; i < 10; i++) {
        await triggerEvent(testFarmId, 'worker.created', { id: i });
      }

      const deliveries = await getDeliveryHistory(testWebhookId, 5);
      expect(deliveries.length).toBe(5);
    });

    it('should order deliveries by created_at desc', async () => {
      await triggerEvent(testFarmId, 'worker.created', { id: '1' });
      await new Promise(resolve => setTimeout(resolve, 10));
      await triggerEvent(testFarmId, 'worker.created', { id: '2' });
      await new Promise(resolve => setTimeout(resolve, 10));
      await triggerEvent(testFarmId, 'worker.created', { id: '3' });

      const deliveries = await getDeliveryHistory(testWebhookId);
      expect(deliveries[0].payload.data.id).toBe('3');
      expect(deliveries[1].payload.data.id).toBe('2');
      expect(deliveries[2].payload.data.id).toBe('1');
    });
  });
});
