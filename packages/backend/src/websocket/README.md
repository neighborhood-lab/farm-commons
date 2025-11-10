# WebSocket Implementation - Real-time Dashboard Updates

This implementation provides real-time updates for the Farm Commons dashboard using Socket.IO.

## Features

- **Real-time time entry updates**: Broadcast clock-in/clock-out events instantly
- **Active workers counter**: Live count of currently clocked-in workers
- **Dashboard namespace**: Dedicated WebSocket namespace for dashboard clients
- **Automatic reconnection**: Built-in reconnection logic
- **CORS support**: Properly configured for frontend integration

## Architecture

### Files

- `index.ts` - WebSocket server initialization and setup
- `dashboard.ts` - Dashboard namespace handler with event broadcasting
- `serverInstance.ts` - Singleton pattern to avoid circular dependencies
- `__tests__/` - Test suite for WebSocket functionality

### Events

#### Client → Server

- `request:active-workers` - Request current active workers count
  ```typescript
  socket.emit('request:active-workers', farmId);
  ```

#### Server → Client

- `time-entry:change` - Time entry created or updated
  ```typescript
  {
    type: 'clock_in' | 'clock_out' | 'update',
    entry: TimeEntry,
    worker: {
      id: string,
      first_name: string,
      last_name: string
    },
    timestamp: string
  }
  ```

- `active-workers:update` - Active workers count updated
  ```typescript
  {
    count: number,
    timestamp: string
  }
  ```

- `error` - Error occurred
  ```typescript
  {
    message: string
  }
  ```

## Usage

### Server-Side

The WebSocket server is automatically initialized when the Express server starts:

```typescript
import { initializeWebSocket } from './websocket/index.js';
import { setWebSocketServer } from './websocket/serverInstance.js';

const httpServer = createServer(app);
const wsServer = initializeWebSocket(httpServer);
setWebSocketServer(wsServer);
```

To broadcast events from routes:

```typescript
import { getWebSocketServer } from '../websocket/serverInstance.js';

const wsServer = getWebSocketServer();
if (wsServer) {
  wsServer.emitDashboardEvent('time-entry:change', {
    type: 'clock_in',
    entry: timeEntry,
    worker: workerData,
    timestamp: new Date().toISOString(),
  });
}
```

### Client-Side

Connect to the dashboard namespace:

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/dashboard', {
  withCredentials: true,
  transports: ['websocket', 'polling'],
});

// Listen for time entry changes
socket.on('time-entry:change', (data) => {
  console.log('Time entry changed:', data);
  // Update UI
});

// Listen for active workers updates
socket.on('active-workers:update', (data) => {
  console.log('Active workers:', data.count);
  // Update counter
});

// Request current active workers count
socket.emit('request:active-workers', farmId);

// Handle errors
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

## Testing

Run the test suite:

```bash
npm test websocket
```

The test suite includes:
- Unit tests for dashboard handlers
- Integration tests for WebSocket connections
- Event broadcasting tests
- Multiple concurrent connection tests

## Configuration

WebSocket configuration is controlled by environment variables:

- `CORS_ORIGIN` - Allowed origin for CORS (default: `http://localhost:5173`)
- `PORT` - Server port (default: `3001`)
- `LOG_LEVEL` - Logging level for debugging (default: `info`)

## Performance Considerations

- Events are broadcast to all connected clients in the namespace
- Consider implementing rooms for farm-specific broadcasting in future
- WebSocket connections are lightweight but monitor concurrent connections
- Automatic reconnection helps with unstable connections

## Security

- CORS is properly configured to only allow authorized origins
- JWT authentication can be added to WebSocket handshake if needed
- Farm-specific data should be scoped appropriately

## Future Enhancements

1. **Rooms**: Implement Socket.IO rooms for farm-specific broadcasting
2. **Authentication**: Add JWT verification to WebSocket handshake
3. **Presence**: Track which users are currently viewing the dashboard
4. **Throttling**: Implement rate limiting for event broadcasting
5. **Persistence**: Store events for offline clients to catch up

## Troubleshooting

### Connection Issues

If clients can't connect:
1. Check CORS configuration matches frontend URL
2. Verify firewall allows WebSocket connections
3. Check browser console for connection errors
4. Ensure server is running and accessible

### Events Not Broadcasting

If events aren't received:
1. Verify client is connected to correct namespace (`/dashboard`)
2. Check server logs for broadcast events
3. Ensure `getWebSocketServer()` returns valid instance
4. Verify event names match exactly

### Memory Leaks

If experiencing memory issues:
1. Ensure clients properly disconnect
2. Check for event listener leaks
3. Monitor concurrent connection count
4. Review broadcast frequency
