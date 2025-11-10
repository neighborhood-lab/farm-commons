# Farm Commons Development Tasks

> **Independently workable tasks for parallel development**
> Each task is designed to minimize merge conflicts and can be worked on simultaneously with nearby tasks.

---

## 🎯 Phase 1: Foundation & Core Features (Current)

### Backend API Routes

#### 0000: Implement Fields API Routes

**Package:** `packages/backend/src/routes/fields.ts`
**Dependencies:** Database schema already exists
**Description:** Create CRUD endpoints for field management

- GET /api/fields - List all fields for farm
- GET /api/fields/:id - Get single field with crop history
- POST /api/fields - Create new field with GPS coordinates
- PUT /api/fields/:id - Update field details
- DELETE /api/fields/:id - Soft delete field
- GET /api/fields/:id/schedules - Get all schedules for a field
  **Testing:** Create integration tests for all endpoints

---

#### 0001: Implement Certifications API Routes

**Package:** `packages/backend/src/routes/certifications.ts`
**Dependencies:** Database schema already exists
**Description:** Create CRUD endpoints for worker certifications

- GET /api/certifications/worker/:workerId - List certifications for worker
- POST /api/certifications - Create new certification
- PUT /api/certifications/:id - Update certification
- DELETE /api/certifications/:id - Remove certification
- GET /api/certifications/expiring - List certifications expiring within 30 days
  **Testing:** Create integration tests for certification workflow

---

#### 0002: Implement Farm Statistics API Routes

**Package:** `packages/backend/src/routes/stats.ts`
**Dependencies:** Existing database tables
**Description:** Create analytics endpoints for dashboard

- GET /api/stats/farm - Overall farm statistics
- GET /api/stats/workers/:workerId - Individual worker stats
- GET /api/stats/labor-hours - Labor hours by week/month
- GET /api/stats/field-utilization - Field usage analytics
  **Testing:** Create unit tests for statistics calculations

---

#### 0003: Implement User Registration API Route

**Package:** `packages/backend/src/routes/auth.ts`
**Dependencies:** Existing auth route file
**Description:** Add registration endpoint to existing auth routes

- POST /api/auth/register - Create new user account
- POST /api/auth/refresh - Refresh JWT token
- POST /api/auth/logout - Invalidate token (with Redis)
- POST /api/auth/forgot-password - Password reset flow
  **Testing:** Create integration tests for registration flow

---

### Backend Middleware & Services

#### 0004: Implement Request Validation Middleware

**Package:** `packages/backend/src/middleware/validation.ts`
**Dependencies:** Shared validators
**Description:** Create centralized validation middleware

- Generic Zod schema validator middleware
- Error formatting for validation failures
- Request body sanitization
  **Testing:** Unit tests for validation edge cases

---

#### 0005: Implement File Upload Service

**Package:** `packages/backend/src/services/upload.ts`
**Dependencies:** None
**Description:** Handle certification document uploads

- Local file storage for development
- S3-compatible storage abstraction
- File type validation (PDF, images)
- Generate secure download URLs
  **Testing:** Unit tests with mock storage

---

#### 0006: Implement Email Service

**Package:** `packages/backend/src/services/email.ts`
**Dependencies:** None
**Description:** Email notifications for schedule changes

- SMTP configuration
- Email templates for notifications
- Schedule change notifications
- Certification expiry reminders
  **Testing:** Unit tests with mock SMTP

---

#### 0007: Implement Database Seeding

**Package:** `packages/backend/src/db/seeds/001_demo_data.ts`
**Dependencies:** Existing database schema
**Description:** Create realistic demo data for development

- Demo farm with multiple fields
- 15-20 demo workers with various roles
- 2 weeks of schedules
- Historical time entries
- Sample certifications
  **Testing:** Verify seed data integrity

---

### Frontend Pages & Components

#### 0008: Build Field Management Page

**Package:** `packages/frontend/src/pages/FieldsPage.tsx`
**Dependencies:** Fields API (task 0000)
**Description:** Create field management interface

- List view with GPS map integration
- Create/edit field form with map picker
- Field details with crop history
- Link to scheduled tasks for field
  **Testing:** E2E tests with Playwright

---

#### 0009: Build Worker Detail Modal

**Package:** `packages/frontend/src/components/WorkerDetailModal.tsx`
**Dependencies:** Existing workers page
**Description:** Create detailed worker view modal

- Full worker information display
- Skills and certifications section
- Recent time entries table
- Upcoming schedules list
- Edit worker functionality
  **Testing:** Component tests with Vitest

---

#### 0010: Build Schedule Create/Edit Form

**Package:** `packages/frontend/src/components/ScheduleForm.tsx`
**Dependencies:** Existing schedule page
**Description:** Create form for adding/editing schedules

- Date and time pickers
- Worker and field selectors
- Task type dropdown with common tasks
- Repeating schedule option (future)
  **Testing:** Component tests with form validation

---

#### 0011: Build Time Entry Clock In/Out Component

**Package:** `packages/frontend/src/components/TimeClockWidget.tsx`
**Dependencies:** Time entries API
**Description:** Quick clock in/out widget for workers

- Worker selector dropdown
- Clock in button with timestamp
- Active time entry display
- Clock out with break time entry
- Real-time elapsed time display
  **Testing:** Component tests with time mocking

---

#### 0012: Build Certifications Management Section

**Package:** `packages/frontend/src/components/CertificationsPanel.tsx`
**Dependencies:** Certifications API (task 0001)
**Description:** Certifications UI for worker detail page

- List certifications with expiry dates
- Visual expiry warnings (90, 60, 30 days)
- Upload document interface
- Verification status display
  **Testing:** Component tests with mock uploads

---

#### 0013: Enhance Dashboard with Charts

**Package:** `packages/frontend/src/pages/DashboardPage.tsx`
**Dependencies:** Stats API (task 0002)
**Description:** Add data visualizations to dashboard

- Weekly labor hours chart (recharts)
- Worker attendance heatmap
- Field utilization donut chart
- Upcoming certification expiries list
  **Testing:** Visual regression tests

---

### Shared Utilities & Types

#### 0014: Create Shared Validators

**Package:** `packages/shared/src/validators.ts`
**Dependencies:** None
**Description:** Add Zod validators for new features

- Field creation/update validators
- Certification validators
- Statistics query validators
- File upload validators
  **Testing:** Unit tests for all validators

---

#### 0015: Create Date/Time Utility Functions

**Package:** `packages/shared/src/utils/datetime.ts`
**Dependencies:** date-fns
**Description:** Common date/time operations

- Format dates for display (i18n ready)
- Calculate hours between timestamps
- Week/month range calculations
- Timezone handling utilities
  **Testing:** Unit tests with various timezones

---

#### 0016: Create Currency Formatting Utilities

**Package:** `packages/shared/src/utils/currency.ts`
**Dependencies:** None
**Description:** Money and wage formatting

- Format currency for display
- Calculate hourly wages
- Calculate piece rate earnings
- Locale-aware formatting
  **Testing:** Unit tests with multiple locales

---

#### 0017: Create Validation Utilities

**Package:** `packages/shared/src/utils/validation.ts`
**Dependencies:** None
**Description:** Common validation helpers

- Phone number validation (US, Mexico)
- Email validation
- GPS coordinates validation
- Safe string sanitization
  **Testing:** Unit tests with edge cases

---

## 🔒 Security & Authentication

#### 0018: Implement Role-Based Access Control

**Package:** `packages/backend/src/middleware/rbac.ts`
**Dependencies:** Existing auth middleware
**Description:** Fine-grained permission system

- Permission definitions (read, write, delete)
- Resource-based access control
- Worker can only see own data
- Manager can see farm data
- Admin can manage users
  **Testing:** Integration tests for all roles

---

#### 0019: Implement Rate Limiting by Route

**Package:** `packages/backend/src/middleware/rateLimiting.ts`
**Dependencies:** Existing rate limit
**Description:** Enhance rate limiting with route-specific limits

- Stricter limits for auth endpoints
- Relaxed limits for read-only endpoints
- IP-based and user-based limits
- Redis-backed rate limiting
  **Testing:** Load tests to verify limits

---

#### 0020: Implement Audit Logging

**Package:** `packages/backend/src/middleware/auditLog.ts`
**Dependencies:** Database connection
**Description:** Track sensitive operations

- Log all data modifications
- Log authentication events
- Log access to worker personal data
- Create audit_logs table migration
  **Testing:** Verify logs are created correctly

---

## 📱 Mobile Preparation

#### 0021: Setup Mobile Package Structure

**Package:** `packages/mobile/`
**Dependencies:** React Native, Expo
**Description:** Initialize React Native mobile app

- Expo SDK configuration
- React Navigation setup
- WatermelonDB integration
- Shared types import
  **Testing:** Basic navigation flow tests

---

#### 0022: Implement Offline Storage Schema

**Package:** `packages/mobile/src/database/schema.ts`
**Dependencies:** WatermelonDB
**Description:** Local database for offline-first

- WatermelonDB schema matching API types
- Sync queue table
- Local-first data models
  **Testing:** Database migration tests

---

#### 0023: Create Mobile API Client

**Package:** `packages/mobile/src/lib/api.ts`
**Dependencies:** Shared types
**Description:** Mobile API wrapper with offline support

- Fetch wrapper with auth headers
- Request queue for offline mode
- Automatic retry logic
- Sync conflict resolution
  **Testing:** Unit tests with offline scenarios

---

## 🎨 UI/UX Enhancements

#### 0024: Create Design System Components

**Package:** `packages/frontend/src/components/ui/`
**Dependencies:** Tailwind CSS
**Description:** Reusable UI component library

- Button variants (primary, secondary, danger)
- Input components with validation states
- Modal/Dialog component
- Toast notification system
- Loading states and skeletons
  **Testing:** Storybook stories for each component

---

#### 0025: Implement Dark Mode Support

**Package:** `packages/frontend/src/lib/theme.ts`
**Dependencies:** Tailwind CSS
**Description:** Dark mode theme toggle

- Theme context provider
- Dark mode color palette
- Persistent theme preference
- System preference detection
  **Testing:** Visual tests in both modes

---

#### 0026: Add Internationalization (i18n)

**Package:** `packages/frontend/src/lib/i18n.ts`
**Dependencies:** react-i18next
**Description:** Multi-language support (English, Spanish)

- i18next configuration
- English translations (baseline)
- Spanish translations for core UI
- Language switcher component
- Date/time localization
  **Testing:** Verify all strings are translated

---

#### 0027: Improve Mobile Responsiveness

**Package:** `packages/frontend/src/**/*.tsx`
**Dependencies:** Existing components
**Description:** Enhance mobile layouts

- Responsive breakpoints for all pages
- Touch-friendly button sizes
- Mobile navigation menu
- Optimized forms for mobile
  **Testing:** Responsive design tests

---

## 🧪 Testing & Quality

#### 0028: Setup E2E Testing Framework

**Package:** `packages/frontend/playwright.config.ts`
**Dependencies:** Playwright
**Description:** End-to-end testing infrastructure

- Playwright configuration
- Test fixtures for authenticated users
- Database seeding for tests
- Visual regression testing setup
  **Testing:** Sample E2E test for login flow

---

#### 0029: Create Backend Integration Tests

**Package:** `packages/backend/src/__tests__/integration/`
**Dependencies:** Vitest, supertest
**Description:** API integration test suite

- Test setup with test database
- Authentication test helpers
- Tests for all API routes
- Database transaction rollback
  **Testing:** Run all integration tests

---

#### 0030: Implement Frontend Component Tests

**Package:** `packages/frontend/src/**/*.test.tsx`
**Dependencies:** Vitest, Testing Library
**Description:** Component unit tests

- Test utilities and wrappers
- Tests for all UI components
- Form validation tests
- User interaction tests
  **Testing:** Achieve 80% coverage target

---

#### 0031: Setup Code Quality Tools

**Package:** Root config files
**Dependencies:** ESLint, Prettier
**Description:** Automated code quality checks

- ESLint rules for TypeScript
- Prettier configuration
- Husky pre-commit hooks
- lint-staged for changed files
  **Testing:** Verify hooks run correctly

---

## 📊 Data Management

#### 0032: Implement Data Export Service

**Package:** `packages/backend/src/services/export.ts`
**Dependencies:** None
**Description:** Export data to CSV/Excel

- Export workers list
- Export time entries for payroll
- Export schedules for planning
- Generate compliance reports
  **Testing:** Verify export file formats

---

#### 0033: Implement Data Import Service

**Package:** `packages/backend/src/services/import.ts`
**Dependencies:** None
**Description:** Bulk import from CSV

- Import workers from CSV
- Import schedules from CSV
- Validation and error reporting
- Dry-run mode for verification
  **Testing:** Test with malformed CSV files

---

#### 0034: Create Database Backup Script

**Package:** `scripts/backup-database.sh`
**Dependencies:** PostgreSQL pg_dump
**Description:** Automated database backups

- Daily backup script
- Retention policy (30 days)
- S3 upload option
- Backup verification
  **Testing:** Restore from backup test

---

## 🔄 Background Jobs

#### 0035: Setup Job Queue Infrastructure

**Package:** `packages/backend/src/queue/index.ts`
**Dependencies:** BullMQ, Redis
**Description:** Background job processing

- BullMQ configuration
- Job queue definitions
- Worker process setup
- Job retry logic
  **Testing:** Job processing tests

---

#### 0036: Implement Scheduled Notification Jobs

**Package:** `packages/backend/src/queue/jobs/notifications.ts`
**Dependencies:** Job queue (task 0035)
**Description:** Automated notifications

- Daily schedule reminders
- Certification expiry warnings (30 days)
- Unverified time entry reminders
- Queue scheduling
  **Testing:** Job execution tests

---

#### 0037: Implement Data Cleanup Jobs

**Package:** `packages/backend/src/queue/jobs/cleanup.ts`
**Dependencies:** Job queue (task 0035)
**Description:** Periodic data maintenance

- Archive old time entries (1 year+)
- Clean up expired sessions
- Aggregate historical statistics
  **Testing:** Verify data is properly archived

---

## 🌐 Integration & APIs

#### 0038: Implement Weather API Integration

**Package:** `packages/backend/src/services/weather.ts`
**Dependencies:** OpenWeatherMap API
**Description:** Weather data for farm planning

- Fetch current weather conditions
- 7-day forecast
- Weather alerts
- Cache weather data (1 hour)
  **Testing:** Mock API responses

---

#### 0039: Implement SMS Notification Service

**Package:** `packages/backend/src/services/sms.ts`
**Dependencies:** Twilio
**Description:** SMS notifications for workers

- Send schedule change alerts
- Emergency notifications
- Clock in/out confirmations
- Multi-language message templates
  **Testing:** Mock Twilio API

---

#### 0040: Create Webhook System

**Package:** `packages/backend/src/services/webhooks.ts`
**Dependencies:** None
**Description:** External integrations

- Webhook registration endpoint
- Event delivery system
- Retry failed deliveries
- Security signature verification
  **Testing:** Webhook delivery tests

---

## 📈 Advanced Features

#### 0041: Implement Payroll Report Generator

**Package:** `packages/backend/src/services/payroll.ts`
**Dependencies:** Time entries API
**Description:** Payroll calculation and reporting

- Calculate hours by worker and pay period
- Handle overtime calculations
- Generate payroll reports (PDF)
- Support piece rate workers
  **Testing:** Verify calculations match requirements

---

#### 0042: Implement Crop Rotation Planning

**Package:** `packages/backend/src/routes/crops.ts`
**Dependencies:** Fields API (task 0000)
**Description:** Track crop rotations

- Create crops table migration
- Crop history by field
- Rotation planning interface
- Companion planting suggestions
  **Testing:** Integration tests for crop CRUD

---

#### 0043: Implement Equipment Tracking

**Package:** `packages/backend/src/routes/equipment.ts`
**Dependencies:** None
**Description:** Farm equipment management

- Create equipment table migration
- Equipment maintenance logs
- Assignment to workers/fields
- Maintenance schedule reminders
  **Testing:** Integration tests for equipment API

---

#### 0044: Implement Task Templates

**Package:** `packages/backend/src/routes/task-templates.ts`
**Dependencies:** Schedules API
**Description:** Reusable task templates

- Create task_templates table
- Common task library
- Quick schedule from template
- Seasonal task templates
  **Testing:** Template creation workflow tests

---

## 🔐 Compliance & Reporting

#### 0045: Implement H-2A Visa Tracking

**Package:** `packages/backend/src/routes/compliance/h2a.ts`
**Dependencies:** Workers API
**Description:** Track H-2A program compliance

- Visa expiration tracking
- Housing assignment records
- Transportation documentation
- Compliance report generation
  **Testing:** Compliance report tests

---

#### 0046: Implement OSHA Incident Reporting

**Package:** `packages/backend/src/routes/compliance/safety.ts`
**Dependencies:** Workers API
**Description:** Safety incident tracking

- Create incidents table
- Incident report form
- OSHA 300 log generation
- Incident statistics
  **Testing:** Incident reporting workflow

---

#### 0047: Implement Labor Law Compliance Checks

**Package:** `packages/backend/src/services/compliance.ts`
**Dependencies:** Time entries API
**Description:** Automated compliance monitoring

- Check for excessive hours (>40/week)
- Verify break periods
- Flag potential violations
- Generate compliance reports
  **Testing:** Test with edge cases

---

## 🚀 Performance & Infrastructure

#### 0048: Implement API Response Caching

**Package:** `packages/backend/src/middleware/cache.ts`
**Dependencies:** Redis
**Description:** Cache frequently accessed data

- Redis caching middleware
- Cache invalidation on updates
- Cache warming for common queries
- Cache hit rate monitoring
  **Testing:** Cache behavior tests

---

#### 0049: Optimize Database Queries

**Package:** `packages/backend/src/db/queries/optimized.ts`
**Dependencies:** Existing routes
**Description:** Performance optimization

- Add database indexes
- Optimize N+1 queries
- Use database views for complex joins
- Query performance monitoring
  **Testing:** Load tests before/after

---

#### 0050: Implement API Documentation

**Package:** `packages/backend/src/docs/swagger.ts`
**Dependencies:** Swagger/OpenAPI
**Description:** Interactive API documentation

- OpenAPI specification
- Swagger UI setup
- Example requests/responses
- Authentication documentation
  **Testing:** Verify all routes documented

---

#### 0051: Setup CI/CD Pipeline Enhancements

**Package:** `.github/workflows/`
**Dependencies:** Existing CI workflow
**Description:** Improve deployment pipeline

- Parallel test execution
- Docker build optimization
- Preview deployments for PRs
- Automated security scanning
  **Testing:** Verify pipeline runs successfully

---

#### 0052: Implement Application Monitoring

**Package:** `packages/backend/src/monitoring/`
**Dependencies:** Sentry, Prometheus
**Description:** Production monitoring

- Error tracking with Sentry
- Performance metrics with Prometheus
- Custom business metrics
- Alert configuration
  **Testing:** Generate test errors and metrics

---

## 🎓 Documentation & Onboarding

#### 0053: Create API Client SDK

**Package:** `packages/sdk/`
**Dependencies:** Shared types
**Description:** TypeScript SDK for external integrations

- Typed API client
- Authentication handling
- NPM package setup
- Usage examples
  **Testing:** SDK integration tests

---

#### 0054: Write User Documentation

**Package:** `docs/user-guide/`
**Dependencies:** None
**Description:** End-user documentation

- Getting started guide
- Feature walkthroughs with screenshots
- Common workflows
- Troubleshooting guide
  **Testing:** Have users test documentation

---

#### 0055: Write Developer Documentation

**Package:** `docs/developers/`
**Dependencies:** None
**Description:** Developer setup guide

- Local development setup
- Architecture overview
- Contributing guidelines
- Code style guide
  **Testing:** New developer onboarding test

---

#### 0056: Create Video Tutorials

**Package:** `docs/videos/`
**Dependencies:** None
**Description:** Screen recordings for common tasks

- Worker management walkthrough
- Schedule creation tutorial
- Time tracking demo
- Mobile app usage guide
  **Testing:** User feedback on clarity

---

## 🌱 Future Phases Preparation

#### 0057: Design Database Schema for Phase 2

**Package:** `docs/schema/phase-2.md`
**Dependencies:** None
**Description:** Plan next phase database structure

- Customers table (CSA members, market sales)
- Products table (crops, value-added products)
- Orders table
- Inventory table
  **Testing:** Schema review with stakeholders

---

#### 0058: Create Crop Planning Mockups

**Package:** `docs/mockups/crop-planning/`
**Dependencies:** None
**Description:** UI designs for crop planning

- Crop calendar view
- Field rotation planner
- Planting schedule
- Harvest tracking
  **Testing:** User testing with farmers

---

#### 0059: Research Payroll Integration Options

**Package:** `docs/research/payroll-integrations.md`
**Dependencies:** None
**Description:** Evaluate payroll service APIs

- QuickBooks API capabilities
- Gusto API documentation
- ADP integration options
- Cost analysis
  **Testing:** API sandbox testing

---

#### 0060: Plan Community Features

**Package:** `docs/planning/community-features.md`
**Dependencies:** None
**Description:** Design multi-farm collaboration

- Farm network/directory
- Shared equipment marketplace
- Knowledge sharing forum
- Cooperative purchasing
  **Testing:** Community feedback sessions

---

## Notes

- Tasks 0000-0023 can be worked on immediately without dependencies
- Tasks 0024-0060 may have dependencies noted in each task
- Each task should result in a single, focused pull request
- All tasks should include tests and documentation updates
- Breaking changes should be coordinated with the team

**Last Updated:** 2025-11-10
