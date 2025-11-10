# Webhook System Documentation

The Farm Commons webhook system allows external applications to receive real-time notifications about events happening in the system.

## Features

- **Event Subscriptions**: Subscribe to specific events you care about
- **Secure Delivery**: HMAC signature verification for security
- **Automatic Retries**: Failed deliveries are automatically retried with exponential backoff
- **Delivery History**: Track the status of webhook deliveries
- **Multiple Webhooks**: Register multiple webhook endpoints for the same farm

## Available Events

- `worker.created` - A new worker was created
- `worker.updated` - A worker's information was updated
- `worker.deleted` - A worker was deleted
- `schedule.created` - A new schedule was created
- `schedule.updated` - A schedule was updated
- `schedule.deleted` - A schedule was deleted
- `time_entry.created` - A new time entry was created
- `time_entry.updated` - A time entry was updated
- `certification.expiring` - A certification is expiring soon

## API Endpoints

### List Available Events
```
GET /api/webhooks/events
```

Returns all available webhook events.

### Register a Webhook
```
POST /api/webhooks
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook-endpoint",
  "events": ["worker.created", "worker.updated"],
  "description": "My app webhook"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "webhook-uuid",
    "farm_id": "farm-uuid",
    "url": "https://your-app.com/webhook-endpoint",
    "events": ["worker.created", "worker.updated"],
    "secret_key": "abc123...",
    "active": true,
    "description": "My app webhook",
    "message": "Webhook created successfully. Save the secret_key - it will not be shown again."
  }
}
```

**Important:** Save the `secret_key` immediately! It's only shown once during creation.

### List Webhooks
```
GET /api/webhooks
```

Returns all webhooks for your farm.

### Get Webhook Details
```
GET /api/webhooks/:id
```

Returns details for a specific webhook (without the secret key).

### Update Webhook
```
PUT /api/webhooks/:id
```

**Request Body:**
```json
{
  "url": "https://new-url.com/webhook",
  "events": ["worker.created", "schedule.created"],
  "active": false,
  "description": "Updated description"
}
```

### Delete Webhook
```
DELETE /api/webhooks/:id
```

Permanently deletes a webhook and all its delivery history.

### Regenerate Secret Key
```
POST /api/webhooks/:id/regenerate-secret
```

Generates a new secret key. The old key will immediately stop working.

**Response:**
```json
{
  "success": true,
  "data": {
    "secret_key": "new-secret-key",
    "message": "Secret key regenerated. Save it - it will not be shown again."
  }
}
```

### Get Delivery History
```
GET /api/webhooks/:id/deliveries?limit=50
```

Returns recent delivery attempts for a webhook.

### Retry Failed Delivery
```
POST /api/webhooks/deliveries/:deliveryId/retry
```

Manually retry a failed webhook delivery.

## Webhook Payload Format

When an event occurs, Farm Commons will send a POST request to your webhook URL:

```json
{
  "event": "worker.created",
  "timestamp": "2025-11-10T12:00:00.000Z",
  "farm_id": "farm-uuid",
  "data": {
    "id": "worker-uuid",
    "first_name": "John",
    "last_name": "Doe",
    ...
  }
}
```

### HTTP Headers

```
Content-Type: application/json
X-Webhook-Signature: sha256-hmac-signature
X-Webhook-Event: worker.created
User-Agent: FarmCommons-Webhook/1.0
```

## Security - Verifying Webhook Signatures

To verify that a webhook request actually came from Farm Commons:

### Node.js Example
```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In your webhook endpoint:
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  const secret = 'your-webhook-secret-key';

  if (!verifyWebhook(payload, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }

  // Process the webhook
  const event = req.body.event;
  const data = req.body.data;

  console.log(`Received ${event}:`, data);

  res.status(200).send('OK');
});
```

### Python Example
```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected_signature = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)

# In your Flask webhook endpoint:
@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Webhook-Signature')
    payload = request.get_data(as_text=True)
    secret = 'your-webhook-secret-key'

    if not verify_webhook(payload, signature, secret):
        return 'Invalid signature', 401

    data = request.json
    event = data['event']

    print(f"Received {event}: {data['data']}")

    return 'OK', 200
```

## Retry Behavior

If your webhook endpoint fails to respond or returns an error:

1. Farm Commons will automatically retry the delivery
2. Retry attempts follow exponential backoff:
   - 1st retry: 1 minute later
   - 2nd retry: 5 minutes later
   - 3rd retry: 15 minutes later
   - 4th retry: 1 hour later
   - 5th retry: 4 hours later
3. After 5 failed attempts, the delivery is marked as permanently failed
4. You can manually retry any failed delivery from the API

## Best Practices

### 1. Respond Quickly
Your webhook endpoint should respond within 10 seconds. For long-running tasks, queue the work and respond immediately:

```javascript
app.post('/webhook', async (req, res) => {
  // Respond immediately
  res.status(200).send('OK');

  // Queue the work for processing
  await queue.add('process-webhook', req.body);
});
```

### 2. Handle Duplicate Events
Due to retries, you may receive the same event multiple times. Use idempotency:

```javascript
app.post('/webhook', async (req, res) => {
  const deliveryId = req.headers['x-delivery-id'];

  // Check if already processed
  if (await isProcessed(deliveryId)) {
    return res.status(200).send('Already processed');
  }

  // Process and mark as done
  await processWebhook(req.body);
  await markAsProcessed(deliveryId);

  res.status(200).send('OK');
});
```

### 3. Secure Your Endpoint
- Always verify the HMAC signature
- Use HTTPS for your webhook URL
- Consider IP allowlisting if needed

### 4. Monitor Your Webhooks
- Regularly check delivery history for failures
- Set up alerts for persistent failures
- Keep your webhook endpoint healthy and responsive

## Troubleshooting

### Webhooks Not Being Delivered

1. **Check webhook is active**: `GET /api/webhooks/:id`
2. **Verify events are subscribed**: Make sure the event is in your `events` array
3. **Check delivery history**: `GET /api/webhooks/:id/deliveries`
4. **Verify your endpoint is accessible**: Test with curl
5. **Check for errors**: Look at `error_message` in delivery history

### Invalid Signature Errors

1. **Verify you're using the correct secret key**
2. **Make sure you're hashing the raw JSON payload**
3. **Use timing-safe comparison** (not `==` or `===`)

### Timeouts

- Your endpoint must respond within 10 seconds
- Use background jobs for long-running tasks
- Consider scaling your webhook receiver

## Example: Complete Webhook Receiver

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = process.env.FARM_COMMONS_WEBHOOK_SECRET;

function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

app.post('/farm-commons-webhook', (req, res) => {
  // Get signature from header
  const signature = req.headers['x-webhook-signature'];
  if (!signature) {
    return res.status(401).send('Missing signature');
  }

  // Verify signature
  const payload = JSON.stringify(req.body);
  if (!verifySignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  // Process the event
  const { event, timestamp, farm_id, data } = req.body;

  console.log(`Received webhook: ${event} for farm ${farm_id}`);

  switch (event) {
    case 'worker.created':
      console.log('New worker created:', data);
      // Handle worker creation
      break;

    case 'schedule.created':
      console.log('New schedule created:', data);
      // Handle schedule creation
      break;

    default:
      console.log('Unknown event:', event);
  }

  // Always respond 200 to acknowledge receipt
  res.status(200).send('OK');
});

app.listen(3000, () => {
  console.log('Webhook receiver listening on port 3000');
});
```

## Questions?

For issues or questions about webhooks:
- Check the delivery history for error details
- Review your webhook endpoint logs
- Verify signature verification is working correctly
- Contact support with webhook ID and delivery IDs
