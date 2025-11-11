# Monitoring Module

This module provides comprehensive monitoring and observability for the Farm Commons application using Sentry for error tracking and Prometheus for metrics collection.

## Features

### Error Tracking (Sentry)
- Automatic error capture and reporting
- Performance monitoring and tracing
- User context tracking
- Breadcrumbs for debugging
- Request/response tracking
- Profiling support

### Metrics (Prometheus)
- HTTP request metrics (duration, count, size)
- Database query performance
- Redis command performance
- Error rates and counts
- Custom business metrics

### Custom Business Metrics
- Worker tracking (total, active, clocked-in)
- Schedule metrics (total, upcoming, status)
- Time entry tracking (active, duration, labor hours)
- Certification monitoring (total, expiring)
- Field utilization metrics
- Authentication metrics (logins, registrations, active users)

### Alerting
- Configurable alert thresholds
- Error rate monitoring
- Response time alerts
- Database connection health
- Business metric alerts
- System resource monitoring

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# Sentry Configuration
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

### 2. Integration

The monitoring module is automatically integrated into the Express application. See `src/index.ts` for implementation details.

### 3. Accessing Metrics

Once the application is running, Prometheus metrics are available at:

```
http://localhost:3001/metrics
```

## Usage

### Recording Custom Errors

```typescript
import { captureException, captureMessage } from './monitoring';

try {
  // Your code
} catch (error) {
  captureException(error, {
    customContext: 'additional data'
  });
}

// Record a message
captureMessage('Important event occurred', 'warning', {
  userId: '123',
  action: 'data_export'
});
```

### Recording Business Metrics

```typescript
import {
  recordWorkerCheckIn,
  recordScheduleCreated,
  recordLaborHours,
  recordLoginAttempt
} from './monitoring';

// Record a worker check-in
recordWorkerCheckIn('worker-123');

// Record a new schedule
recordScheduleCreated();

// Record labor hours
recordLaborHours('worker-123', 'harvesting', 8.5);

// Record login attempt
recordLoginAttempt(true); // success
```

### Setting User Context

```typescript
import { setUser, clearUser } from './monitoring';

// After successful login
setUser(user.id, user.email, user.username);

// After logout
clearUser();
```

### Adding Breadcrumbs

```typescript
import { addBreadcrumb } from './monitoring';

addBreadcrumb('database', 'Query executed', {
  table: 'workers',
  operation: 'SELECT',
  duration: 45
});
```

### Recording Database Metrics

```typescript
import { recordDbQuery, setDbConnections } from './monitoring';

const start = Date.now();
// Execute query
const duration = Date.now() - start;

recordDbQuery('SELECT', 'workers', duration);
setDbConnections(activeCount, idleCount);
```

## Metrics Endpoint

The `/metrics` endpoint exposes all Prometheus metrics in a format that can be scraped by Prometheus server.

### Example Prometheus Configuration

```yaml
scrape_configs:
  - job_name: 'farm-commons-api'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

## Available Metrics

### HTTP Metrics
- `farm_commons_http_request_duration_seconds` - Request duration histogram
- `farm_commons_http_requests_total` - Total request counter
- `farm_commons_http_request_size_bytes` - Request size histogram
- `farm_commons_http_response_size_bytes` - Response size histogram

### Error Metrics
- `farm_commons_errors_total` - Total errors counter

### Database Metrics
- `farm_commons_db_query_duration_seconds` - Query duration histogram
- `farm_commons_db_connections_active` - Active connection gauge
- `farm_commons_db_connections_idle` - Idle connection gauge

### Business Metrics
- `farm_commons_workers_total` - Total workers gauge
- `farm_commons_workers_clocked_in` - Workers currently clocked in
- `farm_commons_schedules_total` - Total schedules gauge
- `farm_commons_time_entries_active` - Active time entries gauge
- `farm_commons_labor_hours_total` - Total labor hours counter
- `farm_commons_certifications_expiring` - Certifications expiring soon
- `farm_commons_fields_total` - Total fields gauge
- `farm_commons_field_utilization_percent` - Field utilization percentage
- `farm_commons_active_users` - Active users gauge

### System Metrics (Default)
- `farm_commons_process_cpu_user_seconds_total`
- `farm_commons_process_cpu_system_seconds_total`
- `farm_commons_process_resident_memory_bytes`
- `farm_commons_nodejs_eventloop_lag_seconds`
- And many more Node.js runtime metrics

## Alert Configuration

Alert thresholds are defined in `alerts.ts`. You can customize these based on your operational requirements:

```typescript
export const ALERT_THRESHOLDS = {
  errorRate: {
    warning: 0.05,  // 5%
    critical: 0.1,  // 10%
  },
  responseTime: {
    warning: 1,     // 1 second
    critical: 3,    // 3 seconds
  },
  // ... more thresholds
};
```

## Testing

To test the monitoring setup:

1. Start the application
2. Make some API requests
3. Generate an error (see test file)
4. Visit `/metrics` to see collected metrics
5. Check Sentry dashboard for error reports

## Production Considerations

1. **Sampling Rates**: Adjust Sentry trace and profile sampling rates in production to control costs
2. **Metrics Retention**: Configure Prometheus retention policies based on your needs
3. **Alert Channels**: Integrate with PagerDuty, Slack, or email for production alerts
4. **Security**: Ensure `/metrics` endpoint is protected or only accessible from monitoring network
5. **Performance**: Monitor the overhead of monitoring itself; adjust collection intervals if needed

## Troubleshooting

### Sentry not capturing errors
- Verify `SENTRY_DSN` is set correctly
- Check that Sentry middleware is loaded before routes
- Ensure errors are thrown (not just logged)

### Metrics not appearing
- Verify `/metrics` endpoint is accessible
- Check that metrics middleware is loaded
- Ensure metric recording functions are being called

### High memory usage
- Reduce number of metric labels
- Decrease metrics retention period
- Lower Prometheus scrape interval

## Related Documentation

- [Sentry Node.js Documentation](https://docs.sentry.io/platforms/node/)
- [Prometheus Node.js Client](https://github.com/simmonds/prom-client)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/naming/)
