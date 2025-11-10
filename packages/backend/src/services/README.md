# Session Service Documentation

## Overview

The Session Service provides Redis-backed session management for Farm Commons. It supports multi-device sessions, automatic expiration handling, and comprehensive session tracking per user.

## Features

- **Redis-backed storage**: Fast, in-memory session storage with automatic expiration
- **Multi-device support**: Users can have multiple active sessions across different devices
- **Session expiration**: Automatic cleanup using Redis TTL
- **Session tracking**: List and manage all active sessions per user
- **Security**: User authorization checks when deleting sessions

## Installation

The session service requires Redis to be running. Install and start Redis:

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:latest
```

## Configuration

Configure Redis connection in your `.env` file:

```env
REDIS_URL=redis://localhost:6379
SESSION_TTL=604800  # 7 days in seconds
```

## Usage

### Import the Service

```typescript
import { sessionService } from './services/session.js';
```

### Create a Session

```typescript
import type { SessionCreateData } from '@farm-commons/shared';

const sessionData: SessionCreateData = {
  user_id: 'user-123',
  email: 'user@example.com',
  role: 'manager',
  farm_id: 'farm-456',
  device_info: {
    user_agent: req.headers['user-agent'],
    ip_address: req.ip,
    device_name: 'Chrome on Windows',
  },
  ttl: 7 * 24 * 60 * 60, // 7 days (optional)
};

const session = await sessionService.createSession(sessionData);
console.log('Session ID:', session.session_id);
```

### Get a Session

```typescript
const session = await sessionService.getSession(sessionId);

if (session) {
  console.log('User:', session.email);
  console.log('Last accessed:', session.last_accessed_at);
} else {
  console.log('Session not found or expired');
}
```

### Validate a Session

```typescript
const isValid = await sessionService.isSessionValid(sessionId);

if (!isValid) {
  return res.status(401).json({ error: 'Invalid session' });
}
```

### Update Session Activity

Touch a session to update its last accessed time and extend expiration:

```typescript
await sessionService.touchSession(sessionId);
```

### Get All User Sessions (Multi-Device)

```typescript
const sessions = await sessionService.getUserSessions(userId);

console.log(`User has ${sessions.length} active sessions:`);
sessions.forEach(session => {
  console.log(`- ${session.device_info?.device_name} (${session.session_id})`);
  console.log(`  Last accessed: ${session.last_accessed_at}`);
});
```

### Delete a Session (Logout)

```typescript
await sessionService.deleteSession(sessionId);
```

### Delete All User Sessions (Logout from All Devices)

```typescript
const deletedCount = await sessionService.deleteAllUserSessions(userId);
console.log(`Logged out from ${deletedCount} devices`);
```

### Delete User's Own Session (with Authorization)

```typescript
// Only allows users to delete their own sessions
const success = await sessionService.deleteUserSession(userId, sessionId);

if (!success) {
  console.log('Unauthorized or session not found');
}
```

### Get Session Count

```typescript
const count = await sessionService.getUserSessionCount(userId);
console.log(`User has ${count} active sessions`);
```

## Example: Authentication Middleware

Here's how to integrate session management with authentication:

```typescript
import type { Request, Response, NextFunction } from 'express';
import { sessionService } from '../services/session.js';

export async function authenticateSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const sessionId = req.headers['x-session-id'] as string;

  if (!sessionId) {
    return res.status(401).json({ error: 'Session ID required' });
  }

  const session = await sessionService.getSession(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  // Touch session to extend expiration
  await sessionService.touchSession(sessionId);

  // Attach session to request
  req.session = session;
  next();
}
```

## Example: Login with Session Creation

```typescript
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate credentials
  const user = await validateCredentials(email, password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Create session
  const session = await sessionService.createSession({
    user_id: user.id,
    email: user.email,
    role: user.role,
    farm_id: user.farm_id,
    device_info: {
      user_agent: req.headers['user-agent'],
      ip_address: req.ip,
    },
  });

  res.json({
    success: true,
    session_id: session.session_id,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
});
```

## Example: Logout

```typescript
router.post('/logout', async (req, res) => {
  const sessionId = req.headers['x-session-id'] as string;

  if (sessionId) {
    await sessionService.deleteSession(sessionId);
  }

  res.json({ success: true, message: 'Logged out successfully' });
});
```

## Example: Logout from All Devices

```typescript
router.post('/logout-all', authenticateSession, async (req, res) => {
  const userId = req.session.user_id;

  const deletedCount = await sessionService.deleteAllUserSessions(userId);

  res.json({
    success: true,
    message: `Logged out from ${deletedCount} devices`,
  });
});
```

## Example: List Active Sessions

```typescript
router.get('/sessions', authenticateSession, async (req, res) => {
  const userId = req.session.user_id;

  const sessions = await sessionService.getUserSessions(userId);

  res.json({
    success: true,
    data: sessions.map(session => ({
      session_id: session.session_id,
      device_info: session.device_info,
      created_at: session.created_at,
      last_accessed_at: session.last_accessed_at,
      expires_at: session.expires_at,
    })),
  });
});
```

## Redis Data Structure

### Session Storage

Sessions are stored with the following key pattern:

```
session:{session_id}
```

Each session is stored as a JSON string with automatic expiration (TTL).

### User Sessions Index

User sessions are tracked using Redis sets:

```
user_sessions:{user_id}
```

This allows efficient retrieval of all sessions for a user.

## Session Expiration

Sessions automatically expire based on their TTL. The default TTL is 7 days (604800 seconds).

- **Automatic cleanup**: Redis automatically removes expired sessions
- **Touch to extend**: Calling `touchSession()` extends the TTL
- **Manual cleanup**: `cleanupExpiredSessions()` manually removes expired sessions

## Testing

Run the session service tests:

```bash
# Run all tests
npm test

# Run session service tests only
npm test -- session.test.ts

# Watch mode
npm run test:watch
```

## Performance Considerations

- **Redis storage**: In-memory storage provides sub-millisecond latency
- **Multi-device support**: Efficient set operations for tracking multiple sessions
- **TTL-based expiration**: Automatic cleanup without manual cron jobs
- **Connection pooling**: Redis client handles connection pooling automatically

## Security Best Practices

1. **Secure session IDs**: Uses UUIDs for unpredictable session IDs
2. **Authorization checks**: Users can only delete their own sessions
3. **Device tracking**: Optional device information for security auditing
4. **Expiration**: Automatic session expiration prevents long-lived sessions
5. **Redis security**: Secure your Redis instance with authentication and firewall rules

## Troubleshooting

### Redis Connection Failed

If you see "Failed to connect to Redis" errors:

1. Check Redis is running: `redis-cli ping` (should return "PONG")
2. Verify REDIS_URL in `.env` is correct
3. Check Redis logs for errors

### Sessions Not Expiring

If sessions persist longer than expected:

1. Verify TTL is set correctly: `redis-cli TTL session:{session_id}`
2. Check Redis eviction policy: `redis-cli CONFIG GET maxmemory-policy`
3. Monitor Redis memory usage

### Performance Issues

If session operations are slow:

1. Check Redis memory usage: `redis-cli INFO memory`
2. Monitor Redis latency: `redis-cli --latency`
3. Consider Redis persistence settings for production

## Future Enhancements

- [ ] Session encryption for sensitive data
- [ ] Redis cluster support for high availability
- [ ] Session activity logging
- [ ] Suspicious activity detection
- [ ] Geographic location tracking
- [ ] Browser fingerprinting for additional security

## Related

- [Redis Client Documentation](../db/redis.ts)
- [Shared Types](../../../shared/src/types.ts)
- [Authentication Middleware](../middleware/auth.ts)
