# Farm Commons API Documentation

This directory contains the OpenAPI 3.0 specification for the Farm Commons API.

## Overview

The API documentation is generated using **Swagger/OpenAPI 3.0** and provides:
- Interactive API exploration via Swagger UI
- Complete request/response schemas
- Authentication documentation
- Example requests for all endpoints
- Try-it-out functionality for testing endpoints

## Accessing the Documentation

### Swagger UI (Interactive)
Visit the Swagger UI interface when the server is running:
```
http://localhost:3001/api/docs
```

### OpenAPI JSON Specification
Download or view the raw OpenAPI specification:
```
http://localhost:3001/api/docs.json
```

## Authentication

Most endpoints require JWT authentication. To use authenticated endpoints in Swagger UI:

1. Call `/api/auth/login` or `/api/auth/register` to get a JWT token
2. Copy the `access_token` from the response
3. Click the "Authorize" button at the top of the Swagger UI
4. Enter: `Bearer <your-token>`
5. Click "Authorize"
6. All subsequent requests will include the token

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user profile

### Workers
- `GET /api/workers` - List workers (paginated)
- `GET /api/workers/:id` - Get worker by ID
- `POST /api/workers` - Create worker (admin/manager)
- `PUT /api/workers/:id` - Update worker (admin/manager)
- `DELETE /api/workers/:id` - Delete worker (admin only)

### Schedules
- `GET /api/schedules` - List schedules (with optional date filter)
- `GET /api/schedules/worker/:workerId` - Get worker schedules
- `POST /api/schedules` - Create schedule (admin/manager)
- `PUT /api/schedules/:id` - Update schedule (admin/manager)
- `DELETE /api/schedules/:id` - Delete schedule (admin/manager)

### Time Entries
- `GET /api/time-entries` - List time entries (with optional date filter)
- `GET /api/time-entries/worker/:workerId` - Get worker time entries
- `POST /api/time-entries/clock-in` - Clock in worker
- `POST /api/time-entries/:id/clock-out` - Clock out worker
- `POST /api/time-entries/:id/verify` - Verify time entry (admin/manager)

## Roles & Permissions

### Admin
- Full access to all endpoints
- Can delete workers
- Can manage all resources

### Manager
- Can create, read, and update workers
- Can manage schedules
- Can verify time entries
- Cannot delete workers

### Worker
- Can view own data
- Limited access to most endpoints

## Schemas

All request and response schemas are documented in the OpenAPI specification. Key schemas include:

- **User** - User account information
- **Worker** - Worker profile and employment details
- **Schedule** - Work schedule information
- **TimeEntry** - Time tracking data with clock in/out

## Development

### Updating Documentation

The API documentation is defined in `swagger.ts`. To update:

1. Edit `packages/backend/src/docs/swagger.ts`
2. Update the OpenAPI definition object
3. Restart the development server
4. Refresh the Swagger UI to see changes

### Testing Endpoints

Use the Swagger UI "Try it out" feature to:
1. Test endpoints directly from the browser
2. See actual request/response examples
3. Validate API behavior
4. Debug integration issues

## Production

In production, the API documentation is available at:
```
https://api.farmcommons.org/api/docs
```

For security, consider:
- Restricting access to documentation in production
- Rate limiting the documentation endpoints
- Requiring authentication to view docs

## License

This documentation is part of Farm Commons and is licensed under AGPL-3.0.
