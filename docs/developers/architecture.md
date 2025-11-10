# Architecture Overview

This document provides a comprehensive overview of Farm Commons' architecture, design decisions, and system organization.

## Table of Contents

- [System Architecture](#system-architecture)
- [Monorepo Structure](#monorepo-structure)
- [Technology Stack](#technology-stack)
- [Data Models](#data-models)
- [API Design](#api-design)
- [Authentication & Authorization](#authentication--authorization)
- [State Management](#state-management)
- [Database Architecture](#database-architecture)
- [Deployment Architecture](#deployment-architecture)

## System Architecture

Farm Commons follows a **three-tier architecture** pattern:

```
┌─────────────────────────────────────────────────────┐
│                   Presentation Layer                │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  Web (React) │  │ Mobile (RN)  │  │  Future   │ │
│  │  Port: 5173  │  │   (Expo)     │  │  Clients  │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                   Application Layer                 │
│  ┌──────────────────────────────────────────────┐   │
│  │   Express REST API (Node.js 22)             │   │
│  │   Port: 3001                                 │   │
│  │                                              │   │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  │   │
│  │   │  Routes  │  │Middleware│  │ Services │  │   │
│  │   └──────────┘  └──────────┘  └──────────┘  │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                     Data Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ PostgreSQL 15│  │  Redis Cache │  │  File    │  │
│  │  (Primary DB)│  │  (Optional)  │  │  Storage │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────┘
```

### Design Principles

1. **Separation of Concerns** - Clear boundaries between layers
2. **API-First Design** - Backend API is independent of frontend
3. **Type Safety** - Shared TypeScript types across all packages
4. **Scalability** - Stateless API design for horizontal scaling
5. **Offline-First** - Mobile app designed for rural connectivity
6. **Security by Default** - Authentication, rate limiting, input validation

## Monorepo Structure

Farm Commons uses **Turborepo** for monorepo management with npm workspaces:

```
farm-commons/
├── packages/
│   ├── backend/              # Express API server
│   ├── frontend/             # React web application
│   ├── shared/               # Shared types, validators, utilities
│   └── mobile/               # React Native app (future)
├── docs/                     # Documentation
├── .github/workflows/        # CI/CD pipelines
├── package.json              # Root package configuration
├── turbo.json               # Turborepo configuration
└── tsconfig.json            # Base TypeScript config
```

### Package Dependencies

```
frontend  ──┐
            ├──► shared (types, validators, utils)
mobile    ──┤
            └──► backend (REST API)
```

### Why Monorepo?

- **Shared Code** - Common types and utilities across packages
- **Atomic Changes** - Update API and client simultaneously
- **Consistent Tooling** - Unified linting, testing, building
- **Simplified Development** - Single `npm install`, single repo to clone
- **Better Refactoring** - Find all usages across packages

## Technology Stack

### Backend (`packages/backend`)

```typescript
// Core Framework
Express 5.x          // Web framework
Node.js 22.x         // Runtime

// Database
PostgreSQL 15        // Primary database
Knex.js             // Query builder & migrations
pg                  // PostgreSQL driver

// Authentication & Security
bcrypt              // Password hashing
jsonwebtoken        // JWT tokens
helmet              // Security headers
express-rate-limit  // Rate limiting
cors                // CORS middleware

// Logging & Monitoring
pino                // Structured logging
pino-http           // HTTP request logging
pino-pretty         // Development log formatting

// Validation
zod                 // Runtime type validation

// Utilities
dotenv              // Environment variables
date-fns            // Date/time utilities
```

### Frontend (`packages/frontend`)

```typescript
// Core Framework
React 19.x          // UI library
TypeScript 5.9      // Type safety
Vite 7.x            // Build tool & dev server

// Styling
Tailwind CSS 4.1    // Utility-first CSS
PostCSS             // CSS processing

// State Management
Zustand             // Global state
React Query         // Server state & caching

// Routing
React Router 7      // Client-side routing

// Forms & Validation
React Hook Form     // Form management
zod                 // Form validation

// UI Components
Headless UI         // Accessible components
Heroicons           // Icon library
Recharts            // Data visualization

// HTTP Client
ky                  // Modern fetch wrapper

// Utilities
date-fns            // Date formatting
clsx                // Conditional classNames
```

### Shared (`packages/shared`)

```typescript
// All packages share:
TypeScript types    // Interface definitions
Zod validators      // Runtime validation schemas
Utility functions   // Common helpers
Constants           // Shared constants
```

### Mobile (`packages/mobile`) - Future

```typescript
React Native 0.82   // Mobile framework
Expo 54             // Development platform
WatermelonDB        // Offline-first database
React Navigation 7  // Navigation
```

## Data Models

### Core Entities

```typescript
// User & Authentication
User → Farm (many-to-one)
  - id, email, password_hash, role, farm_id

// Farm Management
Farm
  - id, name, location, size_acres, organic_certified

Worker → Farm (many-to-one)
  - id, farm_id, user_id, name, phone, email
  - hourly_rate, piece_rate, certifications, skills
  - status: active | inactive | seasonal

Field → Farm (many-to-one)
  - id, farm_id, name, size_acres
  - location_gps, current_crop, soil_type

// Scheduling & Time Tracking
Schedule → Worker, Field (many-to-one)
  - id, farm_id, worker_id, field_id
  - scheduled_date, start_time, end_time
  - task_type, task_description
  - status: scheduled | in_progress | completed | cancelled

TimeEntry → Worker, Schedule, Field (many-to-one)
  - id, farm_id, worker_id, schedule_id, field_id
  - clock_in, clock_out, break_minutes
  - total_hours, task_type
  - verified_by, verified_at

// Certifications
Certification → Worker (many-to-one)
  - id, worker_id, name, issuing_organization
  - issue_date, expiration_date
  - document_url, verified
```

### Entity Relationships

```
Farm (1) ──┬──> Workers (N)
           ├──> Fields (N)
           ├──> Schedules (N)
           └──> TimeEntries (N)

Worker (1) ──┬──> Schedules (N)
             ├──> TimeEntries (N)
             └──> Certifications (N)

Field (1) ──┬──> Schedules (N)
            └──> TimeEntries (N)

Schedule (1) ──> TimeEntries (0..1)
```

## API Design

### REST Principles

Farm Commons follows RESTful API design:

```
Resource-based URLs:
  GET    /api/workers           # List workers
  GET    /api/workers/:id       # Get single worker
  POST   /api/workers           # Create worker
  PUT    /api/workers/:id       # Update worker
  DELETE /api/workers/:id       # Delete worker

Nested resources:
  GET    /api/workers/:id/schedules      # Worker's schedules
  GET    /api/fields/:id/schedules       # Field's schedules
```

### API Response Format

All API responses follow a consistent structure:

```typescript
// Success Response
{
  "success": true,
  "data": { /* resource data */ }
}

// Error Response
{
  "success": false,
  "error": "Error message",
  "message": "Human-readable description"
}

// Paginated Response
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "per_page": 20,
    "total_pages": 5
  }
}
```

### HTTP Status Codes

```
200 OK              - Successful GET, PUT
201 Created         - Successful POST
204 No Content      - Successful DELETE
400 Bad Request     - Validation error
401 Unauthorized    - Missing/invalid auth token
403 Forbidden       - Valid token, insufficient permissions
404 Not Found       - Resource doesn't exist
429 Too Many Requests - Rate limit exceeded
500 Internal Error  - Server error
```

### Authentication Headers

```http
Authorization: Bearer <JWT_TOKEN>
```

## Authentication & Authorization

### JWT-Based Authentication

```typescript
// Login Flow
POST /api/auth/login
  { email, password }
  ↓
  Verify credentials
  ↓
  Generate JWT token
  ↓
  Return { access_token, expires_in }

// Protected Route Access
Request with Authorization header
  ↓
  Verify JWT signature
  ↓
  Decode user info (id, role, farm_id)
  ↓
  Attach to req.user
  ↓
  Continue to route handler
```

### Role-Based Access Control (RBAC)

```typescript
// User Roles
admin    - Full system access, manage users
manager  - Manage farm operations, view all data
worker   - View own schedules and time entries

// Permission Examples
GET /api/workers
  - admin, manager: List all workers
  - worker: Forbidden (403)

GET /api/workers/:id
  - admin, manager: Any worker
  - worker: Only if :id matches their ID

POST /api/schedules
  - admin, manager: Allowed
  - worker: Forbidden (403)
```

### Middleware Chain

```typescript
app.get('/api/workers/:id',
  authenticate,           // Verify JWT token
  authorize(['admin', 'manager']),  // Check role
  validateRequest(schema),          // Validate input
  workerController.getById          // Handle request
);
```

## State Management

### Frontend State Architecture

```typescript
// Server State (React Query)
- Workers list, schedules, time entries
- Automatic caching, refetching, invalidation
- Optimistic updates

// Global UI State (Zustand)
- Authentication state (user, token)
- Theme preferences
- Toast notifications
- Modal state

// Local Component State (useState)
- Form inputs
- UI toggles
- Temporary data
```

### Data Flow

```
User Action
  ↓
Component Event Handler
  ↓
React Query Mutation
  ↓
API Request (ky)
  ↓
Backend Validation & Processing
  ↓
Database Update
  ↓
API Response
  ↓
React Query Cache Update
  ↓
UI Re-render
```

## Database Architecture

### Schema Design

```sql
-- Multi-tenancy via farm_id
-- All tables include farm_id for data isolation

-- Soft Deletes
-- Use status fields instead of DELETE
-- Preserve data for compliance and analytics

-- Timestamps
-- All tables have created_at, updated_at
-- Automatic tracking via Knex

-- Indexes
-- Farm_id on all tables (multi-tenant queries)
-- Foreign keys (worker_id, field_id, etc.)
-- Composite indexes for common queries
```

### Migration Strategy

```bash
# Migrations are versioned and sequential
packages/backend/src/db/migrations/
  001_initial_schema.ts
  002_add_fields_table.ts
  003_add_certifications.ts
  ...

# Run migrations
npm run db:migrate:latest

# Rollback (if needed)
npm run db:migrate:rollback
```

### Connection Pooling

```typescript
// Knex connection pool
{
  min: 2,           // Minimum connections
  max: 10,          // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}
```

## Deployment Architecture

### Development Environment

```
Local Machine
  ├── PostgreSQL (localhost:5432)
  ├── Backend (localhost:3001)
  └── Frontend (localhost:5173)
```

### Production Environment (Vercel)

```
Vercel Edge Network
  ├── Frontend (Static Site)
  │   ├── React app (SSG)
  │   └── CDN distribution
  │
  └── Backend (Serverless Functions)
      ├── API routes
      └── Vercel Postgres (managed)

External Services
  ├── Redis (Upstash/managed)
  └── File Storage (S3/Vercel Blob)
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
On: Push to main, Pull Request

Jobs:
  1. Install dependencies
  2. Lint (ESLint + Prettier)
  3. Type check (TypeScript)
  4. Run tests (Vitest + Playwright)
  5. Build all packages
  6. Deploy to Vercel (main branch only)
```

## Performance Considerations

### Backend Optimization

- **Database Queries**: Use indexes, avoid N+1 queries
- **Caching**: Redis for frequently accessed data
- **Rate Limiting**: Protect against abuse
- **Compression**: gzip responses
- **Connection Pooling**: Reuse database connections

### Frontend Optimization

- **Code Splitting**: Lazy load routes
- **React Query Caching**: Minimize API calls
- **Vite Optimization**: Fast builds, tree shaking
- **Image Optimization**: Responsive images
- **Bundle Analysis**: Keep bundle size small

## Security Architecture

### Defense in Depth

1. **Input Validation** - Zod schemas on all inputs
2. **SQL Injection Prevention** - Parameterized queries (Knex)
3. **XSS Prevention** - React auto-escaping, CSP headers
4. **CSRF Protection** - SameSite cookies, CORS
5. **Rate Limiting** - Express rate limiter
6. **Helmet.js** - Security headers
7. **HTTPS Only** - Production requires TLS
8. **Environment Secrets** - Never commit credentials

## Future Architecture Considerations

### Mobile Offline-First

```
Mobile App (React Native)
  ↓
WatermelonDB (Local SQLite)
  ↓
Sync Queue (Background)
  ↓
Backend API
  ↓
PostgreSQL
```

### Scalability Path

```
Phase 1: Single Vercel deployment
Phase 2: Add Redis caching
Phase 3: Background job queue (BullMQ)
Phase 4: Microservices (if needed)
  - Auth service
  - Worker service
  - Analytics service
```

## Resources

- [Setup Guide](./setup.md) - Local development setup
- [Contributing Guide](./contributing.md) - Development workflow
- [Code Style Guide](./code-style.md) - Coding standards
- [TASKS.md](../../TASKS.md) - Development tasks

---

**Questions?** Open a discussion on [GitHub Discussions](https://github.com/neighborhood-lab/farm-commons/discussions)

*Architecture evolves. Keep this document updated.* 🚜
