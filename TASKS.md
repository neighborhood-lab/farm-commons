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

#### 0061: Implement Worker Skills Management

**Package:** `packages/backend/src/routes/skills.ts`
**Dependencies:** Workers API
**Description:** Track and manage worker skills and competencies

- GET /api/skills - List all available skills
- POST /api/workers/:id/skills - Add skill to worker
- DELETE /api/workers/:id/skills/:skillId - Remove skill
- GET /api/workers/by-skill/:skillId - Find workers with specific skill
- PUT /api/skills/:id - Update skill details
  **Testing:** Integration tests for skill assignment

---

#### 0062: Create Break Time Tracking Component

**Package:** `packages/frontend/src/components/BreakTimer.tsx`
**Dependencies:** Time entries API
**Description:** Track meal and rest breaks

- Start/stop break timer
- Multiple break types (lunch, rest, restroom)
- Break history display
- Compliance warnings (minimum break requirements)
  **Testing:** Component tests with timer mocking

---

#### 0063: Implement Weather Widget for Dashboard

**Package:** `packages/frontend/src/components/WeatherWidget.tsx`
**Dependencies:** Weather API (task 0038)
**Description:** Display current weather on dashboard

- Current temperature and conditions
- 3-day forecast preview
- Weather alerts display
- Location-based weather data
  **Testing:** Component tests with mock weather data

---

#### 0064: Create Field Map Visualization

**Package:** `packages/frontend/src/components/FieldMap.tsx`
**Dependencies:** Fields API (task 0000)
**Description:** Interactive map of farm fields

- Leaflet/Mapbox integration
- GPS polygon rendering
- Click field to view details
- Color-code by current crop
  **Testing:** Map rendering tests

---

#### 0065: Implement Password Strength Validator

**Package:** `packages/shared/src/utils/passwordStrength.ts`
**Dependencies:** None
**Description:** Password validation utilities

- Minimum strength requirements
- Common password checking
- Strength score calculation
- Visual strength indicator
  **Testing:** Unit tests with weak/strong passwords

---

#### 0066: Create Equipment Assignment API

**Package:** `packages/backend/src/routes/equipment-assignments.ts`
**Dependencies:** Equipment API (task 0043)
**Description:** Track equipment checkout/checkin

- POST /api/equipment/:id/assign - Assign to worker
- POST /api/equipment/:id/return - Return equipment
- GET /api/equipment/:id/history - Assignment history
- GET /api/workers/:id/equipment - Current equipment
  **Testing:** Assignment workflow tests

---

#### 0067: Build Notification Preferences Page

**Package:** `packages/frontend/src/pages/NotificationSettingsPage.tsx`
**Dependencies:** None (UI only)
**Description:** User notification preferences

- Email notification toggles
- SMS notification preferences
- Notification timing settings
- Test notification button
  **Testing:** E2E tests for preference saving

---

#### 0068: Implement Photo Upload for Workers

**Package:** `packages/backend/src/routes/worker-photos.ts`
**Dependencies:** Upload service (task 0005)
**Description:** Worker profile photo management

- POST /api/workers/:id/photo - Upload photo
- GET /api/workers/:id/photo - Retrieve photo
- DELETE /api/workers/:id/photo - Remove photo
- Image resizing and optimization
  **Testing:** Upload tests with various formats

---

#### 0069: Create Task Duration Estimator

**Package:** `packages/shared/src/utils/taskEstimation.ts`
**Dependencies:** Historical time entries
**Description:** Estimate task completion times

- Calculate average duration by task type
- Factor in field size
- Worker efficiency rating
- Confidence intervals
  **Testing:** Estimation accuracy tests

---

#### 0070: Implement Real-time Dashboard Updates

**Package:** `packages/backend/src/websocket/dashboard.ts`
**Dependencies:** WebSocket infrastructure
**Description:** Live dashboard data updates

- WebSocket connection setup
- Broadcast time entry changes
- Live worker clock in/out events
- Active workers counter
  **Testing:** WebSocket connection tests

---

#### 0071: Create Batch Schedule Creation

**Package:** `packages/backend/src/routes/batch-schedules.ts`
**Dependencies:** Schedules API
**Description:** Create multiple schedules at once

- POST /api/schedules/batch - Bulk create
- Template-based batch creation
- Validation for conflicts
- Rollback on error
  **Testing:** Batch creation tests

---

#### 0072: Build Schedule Calendar View

**Package:** `packages/frontend/src/components/ScheduleCalendar.tsx`
**Dependencies:** Schedules API
**Description:** Month/week calendar view

- FullCalendar integration
- Drag-and-drop schedule editing
- Color-code by worker or task
- Filter by worker/field
  **Testing:** Calendar interaction tests

---

#### 0073: Implement Session Management

**Package:** `packages/backend/src/services/session.ts`
**Dependencies:** Redis
**Description:** User session tracking

- Redis-backed session store
- Multi-device session support
- Session expiration handling
- Active sessions list per user
  **Testing:** Session lifecycle tests

---

#### 0074: Create Emergency Contact Management

**Package:** `packages/backend/src/routes/emergency-contacts.ts`
**Dependencies:** Workers API
**Description:** Worker emergency contacts

- POST /api/workers/:id/emergency-contacts - Add contact
- GET /api/workers/:id/emergency-contacts - List contacts
- PUT /api/emergency-contacts/:id - Update contact
- DELETE /api/emergency-contacts/:id - Remove contact
  **Testing:** CRUD operation tests

---

#### 0075: Build Worker Availability Calendar

**Package:** `packages/frontend/src/components/AvailabilityCalendar.tsx`
**Dependencies:** Workers API
**Description:** Track when workers are available

- Calendar interface for availability
- Recurring availability patterns
- Time-off request integration
- Bulk availability updates
  **Testing:** Availability setting tests

---

#### 0076: Implement Activity Feed

**Package:** `packages/backend/src/routes/activity.ts`
**Dependencies:** Audit log (task 0020)
**Description:** Recent activity stream

- GET /api/activity - Recent farm activities
- Filter by type (schedules, time entries, etc)
- Pagination support
- Real-time updates via WebSocket
  **Testing:** Activity feed generation tests

---

#### 0077: Create Mobile Clock-In Screen

**Package:** `packages/mobile/src/screens/ClockInScreen.tsx`
**Dependencies:** Mobile API client (task 0023)
**Description:** Mobile worker clock in/out

- Large clock in/out buttons
- GPS location capture
- Offline queue support
- Photo capture option (verification)
  **Testing:** Mobile screen tests

---

#### 0078: Implement Field Soil Data Tracking

**Package:** `packages/backend/src/routes/soil-data.ts`
**Dependencies:** Fields API (task 0000)
**Description:** Soil testing and analysis data

- POST /api/fields/:id/soil-tests - Record test
- GET /api/fields/:id/soil-tests - Test history
- Soil nutrient tracking
- Test recommendations
  **Testing:** Soil data CRUD tests

---

#### 0079: Build Analytics Dashboard

**Package:** `packages/frontend/src/pages/AnalyticsPage.tsx`
**Dependencies:** Stats API (task 0002)
**Description:** Advanced analytics and insights

- Custom date range selection
- Comparative analytics (this year vs last)
- Export analytics to PDF
- Shareable report links
  **Testing:** Analytics rendering tests

---

#### 0080: Create Invoice Generation System

**Package:** `packages/backend/src/services/invoicing.ts`
**Dependencies:** Time entries API
**Description:** Generate invoices for contract work

- PDF invoice generation
- Itemized labor charges
- Tax calculations
- Invoice numbering system
  **Testing:** Invoice format tests

---

#### 0081: Implement Worker Document Vault

**Package:** `packages/backend/src/routes/worker-documents.ts`
**Dependencies:** Upload service (task 0005)
**Description:** Store worker-related documents

- Upload I-9 forms, contracts, etc.
- Document type categorization
- Expiration tracking
- Secure access control
  **Testing:** Document upload/retrieval tests

---

#### 0082: Create Quick Actions Menu

**Package:** `packages/frontend/src/components/QuickActionsMenu.tsx`
**Dependencies:** Various APIs
**Description:** Floating action button with shortcuts

- Quick clock in/out
- Create schedule shortcut
- Add time entry
- Keyboard shortcuts
  **Testing:** Quick action trigger tests

---

#### 0083: Implement Time Entry Approval Workflow

**Package:** `packages/backend/src/routes/time-approvals.ts`
**Dependencies:** Time entries API
**Description:** Manager approval for time entries

- POST /api/time-entries/:id/approve - Approve entry
- POST /api/time-entries/:id/reject - Reject with reason
- GET /api/time-entries/pending - Pending approvals
- Batch approval endpoint
  **Testing:** Approval workflow tests

---

#### 0084: Build Worker Performance Dashboard

**Package:** `packages/frontend/src/pages/WorkerPerformancePage.tsx`
**Dependencies:** Stats API
**Description:** Individual worker performance metrics

- Hours worked trends
- Task completion rates
- Attendance reliability score
- Skills proficiency ratings
  **Testing:** Performance calculation tests

---

#### 0085: Create Geofence Validation

**Package:** `packages/backend/src/services/geofence.ts`
**Dependencies:** None
**Description:** Verify clock-ins are on farm property

- GPS coordinate validation
- Farm boundary definition
- Distance calculation
- Override mechanism for edge cases
  **Testing:** Geofence boundary tests

---

#### 0086: Implement Task Checklist System

**Package:** `packages/backend/src/routes/task-checklists.ts`
**Dependencies:** Schedules API
**Description:** Checklist items for scheduled tasks

- Create checklist templates
- Check off items as completed
- Required vs optional items
- Photo attachments for verification
  **Testing:** Checklist completion tests

---

#### 0087: Build Mobile Schedule View

**Package:** `packages/mobile/src/screens/ScheduleScreen.tsx`
**Dependencies:** Mobile API client
**Description:** Mobile schedule display

- Today's schedule highlight
- Week view with swipe navigation
- Accept/decline schedule
- Notifications for changes
  **Testing:** Mobile schedule interaction tests

---

#### 0088: Create Report Builder

**Package:** `packages/frontend/src/pages/ReportBuilderPage.tsx`
**Dependencies:** Various APIs
**Description:** Custom report generation

- Drag-and-drop report fields
- Save report templates
- Schedule automatic reports
- Export to multiple formats
  **Testing:** Report generation tests

---

#### 0089: Implement Labor Cost Calculator

**Package:** `packages/backend/src/services/laborCost.ts`
**Dependencies:** Time entries API
**Description:** Calculate true labor costs

- Base wage + overhead calculations
- Benefits cost allocation
- Field/crop profitability analysis
- Historical cost trends
  **Testing:** Cost calculation accuracy tests

---

#### 0090: Create Field Notes System

**Package:** `packages/backend/src/routes/field-notes.ts`
**Dependencies:** Fields API
**Description:** Daily field observations

- POST /api/fields/:id/notes - Add note
- GET /api/fields/:id/notes - List notes
- Tag notes by category
- Photo attachments
  **Testing:** Field notes CRUD tests

---

#### 0091: Build Training Module System

**Package:** `packages/backend/src/routes/training.ts`
**Dependencies:** Workers API
**Description:** Track worker training completion

- Training module library
- Assignment to workers
- Progress tracking
- Quiz/assessment system
  **Testing:** Training completion workflow tests

---

#### 0092: Implement Search Functionality

**Package:** `packages/backend/src/routes/search.ts`
**Dependencies:** PostgreSQL full-text search
**Description:** Global search across entities

- GET /api/search?q=query - Search all entities
- Search workers, fields, schedules
- Fuzzy matching support
- Search result ranking
  **Testing:** Search relevance tests

---

#### 0093: Create Vehicle Tracking

**Package:** `packages/backend/src/routes/vehicles.ts`
**Dependencies:** None
**Description:** Farm vehicle management

- Vehicle inventory
- Maintenance schedules
- Fuel logging
- Mileage tracking
  **Testing:** Vehicle CRUD tests

---

#### 0094: Build Expense Tracking

**Package:** `packages/backend/src/routes/expenses.ts`
**Dependencies:** None
**Description:** Farm expense management

- Categorized expense tracking
- Receipt uploads
- Budget tracking
- Expense reports
  **Testing:** Expense calculation tests

---

#### 0095: Implement Multi-Farm Support

**Package:** `packages/backend/src/middleware/farmContext.ts`
**Dependencies:** Database schema changes
**Description:** Support users managing multiple farms

- Farm switching interface
- Farm-scoped data isolation
- Cross-farm reporting
- Shared worker pool option
  **Testing:** Multi-tenant isolation tests

---

#### 0096: Create Worker Onboarding Workflow

**Package:** `packages/frontend/src/pages/OnboardingPage.tsx`
**Dependencies:** Workers API
**Description:** Guided new worker setup

- Step-by-step onboarding wizard
- Document collection checklist
- Training assignment
- Welcome email automation
  **Testing:** Onboarding flow E2E tests

---

#### 0097: Implement Time Clock Kiosk Mode

**Package:** `packages/frontend/src/pages/KioskMode.tsx`
**Dependencies:** Time entries API
**Description:** Tablet time clock station

- Full-screen kiosk interface
- PIN-based worker identification
- QR code clock-in option
- Prevent navigation/exit
  **Testing:** Kiosk mode security tests

---

#### 0098: Build Harvest Tracking System

**Package:** `packages/backend/src/routes/harvests.ts`
**Dependencies:** Fields API
**Description:** Track harvest yields

- Record harvest quantities
- Quality grading
- Post-harvest handling notes
- Yield per acre calculations
  **Testing:** Harvest recording tests

---

#### 0099: Create Notification Center

**Package:** `packages/frontend/src/components/NotificationCenter.tsx`
**Dependencies:** Activity feed (task 0076)
**Description:** Centralized notification panel

- Notification list with filters
- Mark as read/unread
- Notification preferences link
- Real-time notification badge
  **Testing:** Notification display tests

---

#### 0100: Implement API Rate Limit Dashboard

**Package:** `packages/backend/src/routes/admin/rate-limits.ts`
**Dependencies:** Rate limiting (task 0019)
**Description:** Monitor and adjust rate limits

- View current rate limit usage
- Adjust limits per route
- IP whitelist/blacklist
- Rate limit analytics
  **Testing:** Rate limit monitoring tests

---

#### 0101: Create Equipment Maintenance Scheduler

**Package:** `packages/backend/src/services/maintenanceScheduler.ts`
**Dependencies:** Equipment API (task 0043)
**Description:** Automated maintenance reminders

- Schedule based on hours/days
- Maintenance checklist templates
- Service history tracking
- Vendor contact management
  **Testing:** Maintenance scheduling tests

---

#### 0102: Build Time Entry Corrections Interface

**Package:** `packages/frontend/src/components/TimeEntryCorrection.tsx`
**Dependencies:** Time entries API
**Description:** Edit time entries with audit trail

- Edit start/end times
- Correction reason required
- Manager approval workflow
- Audit log of all changes
  **Testing:** Correction workflow tests

---

#### 0103: Implement Seed Inventory System

**Package:** `packages/backend/src/routes/seed-inventory.ts`
**Dependencies:** None
**Description:** Track seed stock

- Seed varieties database
- Quantity tracking
- Expiration date monitoring
- Reorder alerts
  **Testing:** Inventory CRUD tests

---

#### 0104: Create Worker Scheduling Preferences

**Package:** `packages/backend/src/routes/worker-preferences.ts`
**Dependencies:** Workers API
**Description:** Worker availability and preferences

- Preferred working days/hours
- Maximum hours per week
- Preferred tasks/fields
- Transportation needs
  **Testing:** Preference management tests

---

#### 0105: Build Compliance Checklist Dashboard

**Package:** `packages/frontend/src/pages/CompliancePage.tsx`
**Dependencies:** Various compliance APIs
**Description:** Compliance status overview

- Outstanding compliance items
- Upcoming deadlines
- Certification status grid
- Compliance score
  **Testing:** Compliance status tests

---

#### 0106: Implement Shift Trading System

**Package:** `packages/backend/src/routes/shift-trades.ts`
**Dependencies:** Schedules API
**Description:** Workers can trade shifts

- POST /api/shifts/:id/trade-request - Request trade
- POST /api/shift-trades/:id/accept - Accept trade
- Manager approval workflow
- Notification system
  **Testing:** Trade workflow tests

---

#### 0107: Create Mobile Push Notifications

**Package:** `packages/mobile/src/services/pushNotifications.ts`
**Dependencies:** Expo Push Notifications
**Description:** Mobile push notification setup

- Device token registration
- Notification handling
- Deep linking to relevant screens
- Notification preferences sync
  **Testing:** Push notification delivery tests

---

#### 0108: Build Field Activity Timeline

**Package:** `packages/frontend/src/components/FieldTimeline.tsx`
**Dependencies:** Fields API
**Description:** Visual field history

- Timeline of all field activities
- Planting, harvesting, maintenance
- Soil test results display
- Photo gallery
  **Testing:** Timeline rendering tests

---

#### 0109: Implement Two-Factor Authentication

**Package:** `packages/backend/src/services/twoFactor.ts`
**Dependencies:** Auth routes
**Description:** 2FA for enhanced security

- TOTP-based 2FA
- QR code generation
- Backup codes
- 2FA enforcement policies
  **Testing:** 2FA flow integration tests

---

#### 0110: Create Language-Specific Help Content

**Package:** `packages/frontend/src/content/help/`
**Dependencies:** i18n (task 0026)
**Description:** Contextual help system

- In-app help tooltips
- Multi-language support
- Searchable help articles
- Video tutorial embedding
  **Testing:** Help content accessibility tests

---

#### 0111: Implement Payroll Period Locking

**Package:** `packages/backend/src/routes/payroll-periods.ts`
**Dependencies:** Time entries API
**Description:** Lock periods after payroll processing

- Define pay periods
- Lock/unlock periods
- Prevent edits to locked periods
- Manager override capability
  **Testing:** Period locking tests

---

#### 0112: Build Worker Communication Hub

**Package:** `packages/frontend/src/pages/MessagesPage.tsx`
**Dependencies:** New messaging API
**Description:** Internal messaging system

- One-on-one messaging
- Group announcements
- Message read receipts
- File attachments
  **Testing:** Message delivery tests

---

#### 0113: Create Irrigation Scheduling

**Package:** `packages/backend/src/routes/irrigation.ts`
**Dependencies:** Fields API
**Description:** Track irrigation schedules

- Irrigation schedule creation
- Water usage tracking
- Weather-based recommendations
- Irrigation equipment tracking
  **Testing:** Irrigation scheduling tests

---

#### 0114: Implement Backup Verification System

**Package:** `packages/backend/src/services/backupVerification.ts`
**Dependencies:** Backup script (task 0034)
**Description:** Automated backup testing

- Restore test on staging
- Backup integrity verification
- Alert on backup failure
- Backup size monitoring
  **Testing:** Backup restore tests

---

#### 0115: Build Custom Dashboard Widgets

**Package:** `packages/frontend/src/components/DashboardWidget.tsx`
**Dependencies:** Dashboard page
**Description:** Customizable dashboard

- Widget library
- Drag-and-drop arrangement
- Save dashboard layouts
- Widget preferences
  **Testing:** Widget customization tests

---

#### 0116: Create Time Entry Photo Verification

**Package:** `packages/backend/src/routes/time-entry-photos.ts`
**Dependencies:** Time entries API, Upload service
**Description:** Photo proof for time entries

- Upload photo with time entry
- GPS coordinates embedded
- Photo compression
- Privacy settings
  **Testing:** Photo upload tests

---

#### 0117: Implement Smart Schedule Suggestions

**Package:** `packages/backend/src/services/scheduleSuggestions.ts`
**Dependencies:** Schedules API, Stats API
**Description:** AI-powered scheduling recommendations

- Suggest workers based on skills
- Avoid overtime predictions
- Weather-aware scheduling
- Historical pattern analysis
  **Testing:** Suggestion accuracy tests

---

#### 0118: Build Chemical Application Tracking

**Package:** `packages/backend/src/routes/chemical-applications.ts`
**Dependencies:** Fields API
**Description:** Pesticide/fertilizer application logs

- Application records with EPA numbers
- Re-entry interval tracking
- Certified applicator verification
- Compliance reporting
  **Testing:** Chemical tracking tests

---

#### 0119: Create Worker Badge Printing

**Package:** `packages/backend/src/services/badgePrinting.ts`
**Dependencies:** Workers API
**Description:** Generate printable worker ID badges

- PDF badge generation
- QR code with worker ID
- Photo integration
- Batch printing support
  **Testing:** Badge generation tests

---

#### 0120: Implement API Versioning

**Package:** `packages/backend/src/middleware/apiVersion.ts`
**Dependencies:** Existing routes
**Description:** API version management

- Version routing middleware
- Multiple API versions support
- Deprecation warnings
- Version documentation
  **Testing:** Version routing tests

---

## Notes

- Tasks 0000-0023 can be worked on immediately without dependencies
- Tasks 0024-0120 may have dependencies noted in each task
- Each task should result in a single, focused pull request
- All tasks should include tests and documentation updates
- Breaking changes should be coordinated with the team

**Last Updated:** 2025-11-10
