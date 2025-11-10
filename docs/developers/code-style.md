# Code Style Guide

This document defines the coding standards and conventions for Farm Commons. Following these guidelines ensures consistency and maintainability across the codebase.

## Table of Contents

- [General Principles](#general-principles)
- [TypeScript Guidelines](#typescript-guidelines)
- [React & Frontend](#react--frontend)
- [Backend & API](#backend--api)
- [Database & Migrations](#database--migrations)
- [Testing Standards](#testing-standards)
- [Naming Conventions](#naming-conventions)
- [File Organization](#file-organization)
- [Comments & Documentation](#comments--documentation)
- [Error Handling](#error-handling)

## General Principles

### Code Quality Fundamentals

1. **Readability First**: Code is read more often than written
2. **Simplicity Over Cleverness**: Prefer clear, simple code
3. **DRY (Don't Repeat Yourself)**: Extract common logic
4. **YAGNI (You Aren't Gonna Need It)**: Don't build speculative features
5. **Small Functions**: Each function should do one thing well
6. **Type Safety**: Leverage TypeScript's type system

### Automated Tooling

Farm Commons uses automated tools to enforce consistency:

```bash
# ESLint - Code quality and patterns
npm run lint

# Prettier - Code formatting
npm run format

# TypeScript - Type checking
npm run typecheck
```

**Always run these before committing!**

## TypeScript Guidelines

### Type Annotations

**Always provide explicit types for:**
- Function parameters
- Function return types
- Exported constants
- Class properties

```typescript
// ✅ Good: Explicit types
function calculateHours(
  clockIn: Date,
  clockOut: Date,
  breakMinutes: number
): number {
  const totalMinutes = (clockOut.getTime() - clockIn.getTime()) / 60000;
  return (totalMinutes - breakMinutes) / 60;
}

// ❌ Bad: Implicit types
function calculateHours(clockIn, clockOut, breakMinutes) {
  const totalMinutes = (clockOut.getTime() - clockIn.getTime()) / 60000;
  return (totalMinutes - breakMinutes) / 60;
}
```

### Interfaces vs Types

**Use interfaces for:**
- Object shapes
- Extensible structures
- Public APIs

**Use types for:**
- Union types
- Intersection types
- Utility types

```typescript
// ✅ Interface for object shapes
interface Worker {
  id: string;
  first_name: string;
  last_name: string;
  status: WorkerStatus;
}

// ✅ Type for unions
type WorkerStatus = 'active' | 'inactive' | 'seasonal';

// ✅ Type for intersections
type WorkerWithStats = Worker & {
  total_hours: number;
  upcoming_shifts: number;
};
```

### Avoid `any`

Avoid using `any` type. Use `unknown` when the type is truly unknown:

```typescript
// ❌ Bad: Using any
function processData(data: any) {
  return data.value;
}

// ✅ Good: Using unknown with type guards
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data format');
}

// ✅ Better: Using generic types
function processData<T extends { value: string }>(data: T): string {
  return data.value;
}
```

### Null Safety

Use strict null checks and optional chaining:

```typescript
// ✅ Good: Optional chaining and nullish coalescing
const emergencyPhone = worker.emergency_contact_phone ?? 'Not provided';
const certCount = worker.certifications?.length ?? 0;

// ❌ Bad: Unsafe access
const emergencyPhone = worker.emergency_contact_phone || 'Not provided';
const certCount = worker.certifications.length; // May crash if undefined
```

### Enums vs Union Types

Prefer union types over enums:

```typescript
// ✅ Preferred: Union types
type UserRole = 'admin' | 'manager' | 'worker';

const role: UserRole = 'admin';

// ❌ Avoid: Enums (unless there's a specific need)
enum UserRole {
  Admin = 'admin',
  Manager = 'manager',
  Worker = 'worker',
}
```

## React & Frontend

### Component Structure

```typescript
// ✅ Good component structure
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { workerApi } from '@/lib/api';
import type { Worker } from '@farm-commons/shared';

interface WorkerListProps {
  farmId: string;
  status?: WorkerStatus;
  onWorkerSelect?: (worker: Worker) => void;
}

export function WorkerList({ farmId, status, onWorkerSelect }: WorkerListProps) {
  const [search, setSearch] = useState('');

  const { data: workers, isLoading, error } = useQuery({
    queryKey: ['workers', farmId, status],
    queryFn: () => workerApi.list({ farmId, status }),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  const filteredWorkers = workers?.filter((w) =>
    `${w.first_name} ${w.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <SearchInput value={search} onChange={setSearch} />
      <div className="grid gap-4">
        {filteredWorkers?.map((worker) => (
          <WorkerCard
            key={worker.id}
            worker={worker}
            onClick={() => onWorkerSelect?.(worker)}
          />
        ))}
      </div>
    </div>
  );
}
```

### Hooks Guidelines

**Custom Hook Naming:**
- Must start with `use`
- Descriptive name indicating what it does

```typescript
// ✅ Good custom hook
function useWorkerSchedules(workerId: string) {
  return useQuery({
    queryKey: ['schedules', workerId],
    queryFn: () => scheduleApi.listByWorker(workerId),
  });
}

// Usage
const { data: schedules } = useWorkerSchedules(workerId);
```

**Hook Dependencies:**
- Always include all dependencies in useEffect/useMemo/useCallback
- ESLint will warn about missing dependencies - fix them!

```typescript
// ✅ Good: All dependencies included
useEffect(() => {
  fetchWorkerData(workerId);
}, [workerId]);

// ❌ Bad: Missing dependency
useEffect(() => {
  fetchWorkerData(workerId);
}, []); // eslint-disable-line react-hooks/exhaustive-deps (DON'T DO THIS!)
```

### Component Props

**Destructure props in function signature:**

```typescript
// ✅ Good: Destructured props
function WorkerCard({ worker, onEdit, onDelete }: WorkerCardProps) {
  return <div>...</div>;
}

// ❌ Bad: Props object
function WorkerCard(props: WorkerCardProps) {
  return <div>{props.worker.name}</div>;
}
```

**Use optional props appropriately:**

```typescript
interface ButtonProps {
  label: string;           // Required
  onClick: () => void;     // Required
  variant?: 'primary' | 'secondary'; // Optional (has default)
  disabled?: boolean;      // Optional (defaults to false)
}

export function Button({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
}: ButtonProps) {
  // Implementation
}
```

### Event Handlers

**Naming:**
- `handle` prefix for handlers defined in component
- `on` prefix for callback props

```typescript
interface WorkerFormProps {
  onSubmit: (worker: Worker) => void;  // Callback prop
  onCancel: () => void;                 // Callback prop
}

function WorkerForm({ onSubmit, onCancel }: WorkerFormProps) {
  const handleFormSubmit = (e: FormEvent) => {  // Handler
    e.preventDefault();
    const worker = parseFormData(e.target);
    onSubmit(worker);
  };

  return (
    <form onSubmit={handleFormSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### Conditional Rendering

```typescript
// ✅ Good: Early returns for loading/error states
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;

// ✅ Good: Boolean conditions
{isActive && <ActiveBadge />}

// ✅ Good: Ternary for two states
{isExpanded ? <ExpandedView /> : <CollapsedView />}

// ❌ Bad: Complex nested ternaries
{status === 'active' ? <ActiveBadge /> : status === 'inactive' ? <InactiveBadge /> : null}

// ✅ Better: Extract to function
function renderStatusBadge(status: WorkerStatus) {
  switch (status) {
    case 'active': return <ActiveBadge />;
    case 'inactive': return <InactiveBadge />;
    case 'seasonal': return <SeasonalBadge />;
  }
}
```

### Styling with Tailwind

```typescript
// ✅ Good: Logical grouping, readable
<div className="
  flex items-center justify-between
  p-4 rounded-lg
  bg-white dark:bg-gray-800
  border border-gray-200 dark:border-gray-700
  hover:shadow-lg transition-shadow
">
  {/* content */}
</div>

// ✅ Good: Using clsx for conditional classes
import clsx from 'clsx';

<button className={clsx(
  'px-4 py-2 rounded font-medium',
  variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
  variant === 'secondary' && 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  disabled && 'opacity-50 cursor-not-allowed'
)}>
  {label}
</button>
```

## Backend & API

### Route Handlers

```typescript
// ✅ Good: Well-structured route handler
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user!; // Set by authenticate middleware

    // Validate input
    const schema = z.object({
      id: z.string().uuid(),
    });
    const { id: workerId } = schema.parse({ id });

    // Authorization check
    const worker = await db('workers')
      .where({ id: workerId, farm_id: user.farm_id })
      .first();

    if (!worker) {
      return res.status(404).json({
        success: false,
        error: 'Worker not found',
      });
    }

    // Fetch related data
    const schedules = await db('schedules')
      .where({ worker_id: workerId })
      .orderBy('scheduled_date', 'desc')
      .limit(10);

    // Return response
    res.json({
      success: true,
      data: {
        ...worker,
        recent_schedules: schedules,
      },
    });
  } catch (error) {
    next(error); // Pass to error handler
  }
});
```

### Async/Await

Always use async/await over promises chains:

```typescript
// ✅ Good: async/await
async function createWorker(data: CreateWorkerDto) {
  const worker = await db('workers').insert(data).returning('*');
  await sendWelcomeEmail(worker.email);
  return worker;
}

// ❌ Bad: Promise chains
function createWorker(data: CreateWorkerDto) {
  return db('workers')
    .insert(data)
    .returning('*')
    .then((worker) => {
      return sendWelcomeEmail(worker.email).then(() => worker);
    });
}
```

### Error Handling

```typescript
// ✅ Good: Specific error types
class ValidationError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// Usage in route
if (!worker) {
  throw new NotFoundError('Worker not found');
}
```

### Database Queries

```typescript
// ✅ Good: Parameterized queries (prevents SQL injection)
const workers = await db('workers')
  .where({ farm_id: farmId, status: 'active' })
  .orderBy('last_name', 'asc');

// ✅ Good: Explicit column selection
const workers = await db('workers')
  .select('id', 'first_name', 'last_name', 'email')
  .where({ farm_id: farmId });

// ❌ Bad: Raw queries without parameters
const workers = await db.raw(`SELECT * FROM workers WHERE farm_id = '${farmId}'`);
```

## Database & Migrations

### Migration Best Practices

```typescript
// ✅ Good migration structure
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('certifications', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Foreign keys
    table.uuid('worker_id').notNullable()
      .references('id').inTable('workers').onDelete('CASCADE');

    // Data columns
    table.string('name').notNullable();
    table.string('issuing_organization').notNullable();
    table.date('issue_date').notNullable();
    table.date('expiration_date');
    table.string('document_url');
    table.boolean('verified').defaultTo(false);

    // Timestamps
    table.timestamps(true, true);

    // Indexes
    table.index('worker_id');
    table.index('expiration_date');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('certifications');
}
```

### Column Naming

- Use `snake_case` for database columns
- Use descriptive names
- Boolean columns: `is_`, `has_`, or adjective (`active`, `verified`)
- Timestamps: `created_at`, `updated_at`
- Foreign keys: `{table}_id` (e.g., `worker_id`, `farm_id`)

## Testing Standards

### Test Structure

```typescript
describe('WorkerService', () => {
  describe('createWorker', () => {
    it('should create a new worker with valid data', async () => {
      // Arrange
      const workerData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        farm_id: 'farm-123',
      };

      // Act
      const worker = await workerService.create(workerData);

      // Assert
      expect(worker).toBeDefined();
      expect(worker.first_name).toBe('John');
      expect(worker.email).toBe('john@example.com');
    });

    it('should throw ValidationError for invalid email', async () => {
      // Arrange
      const workerData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'invalid-email',
        farm_id: 'farm-123',
      };

      // Act & Assert
      await expect(workerService.create(workerData))
        .rejects.toThrow(ValidationError);
    });
  });
});
```

### Test Naming

- Descriptive test names: "should [expected behavior] when [condition]"
- Group related tests with `describe` blocks
- One assertion per test (when possible)

### Test Coverage

```typescript
// ✅ Test happy path
it('should calculate hours correctly', () => {
  const hours = calculateHours(clockIn, clockOut, 30);
  expect(hours).toBe(7.5);
});

// ✅ Test edge cases
it('should handle midnight crossing', () => {
  const clockIn = new Date('2024-01-01T23:00:00');
  const clockOut = new Date('2024-01-02T02:00:00');
  const hours = calculateHours(clockIn, clockOut, 0);
  expect(hours).toBe(3);
});

// ✅ Test error cases
it('should throw error for clock out before clock in', () => {
  expect(() => calculateHours(clockOut, clockIn, 0))
    .toThrow('Clock out must be after clock in');
});
```

## Naming Conventions

### Files

```
PascalCase:    WorkerList.tsx, UserService.ts
kebab-case:    worker-list.tsx, user-service.ts (use consistently)
camelCase:     workerList.test.ts
```

**Farm Commons convention: PascalCase for components, camelCase for utilities**

### Variables & Functions

```typescript
// Variables: camelCase
const workerCount = 10;
const isActive = true;
const currentUser = getCurrentUser();

// Functions: camelCase, verb-noun pattern
function calculateHours() {}
function fetchWorkerData() {}
function validateEmail() {}

// Boolean functions: is/has/should prefix
function isValidEmail() {}
function hasPermission() {}
function shouldShowBanner() {}

// Event handlers: handle prefix
function handleSubmit() {}
function handleWorkerClick() {}
```

### Constants

```typescript
// Constants: UPPER_SNAKE_CASE
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_PAGE_SIZE = 20;
const API_BASE_URL = process.env.API_URL;

// Enum-like objects: UPPER_SNAKE_CASE
const WORKER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SEASONAL: 'seasonal',
} as const;
```

### React Components

```typescript
// PascalCase, descriptive names
WorkerList
WorkerDetailModal
ScheduleForm
TimeClockWidget
```

## File Organization

### Import Ordering

```typescript
// 1. External dependencies
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal absolute imports
import { workerApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

// 3. Relative imports
import { WorkerCard } from './WorkerCard';
import type { WorkerListProps } from './types';

// 4. Types (if not inline)
import type { Worker } from '@farm-commons/shared';

// 5. Styles (if separate CSS files)
import './WorkerList.css';
```

### File Size

- Keep files under 300 lines
- Extract large components into smaller ones
- Split large files into logical modules

## Comments & Documentation

### When to Comment

```typescript
// ✅ Good: Explain WHY, not WHAT
// Clock out time must be adjusted for timezone differences
// before calculating total hours to avoid DST issues
const adjustedClockOut = adjustForTimezone(clockOut, farm.timezone);

// ❌ Bad: Stating the obvious
// Set the name variable to the worker's first name
const name = worker.first_name;
```

### JSDoc for Public APIs

```typescript
/**
 * Calculates total hours worked, accounting for breaks
 *
 * @param clockIn - When the worker clocked in
 * @param clockOut - When the worker clocked out
 * @param breakMinutes - Total break time in minutes
 * @returns Total hours worked (decimal)
 *
 * @throws {ValidationError} If clockOut is before clockIn
 *
 * @example
 * ```ts
 * const hours = calculateHours(
 *   new Date('2024-01-01T08:00:00'),
 *   new Date('2024-01-01T17:00:00'),
 *   30
 * );
 * // Returns: 8.5
 * ```
 */
export function calculateHours(
  clockIn: Date,
  clockOut: Date,
  breakMinutes: number
): number {
  // Implementation
}
```

### TODO Comments

```typescript
// TODO(username): Add pagination support
// FIXME(username): This breaks when worker has no schedules
// HACK: Temporary workaround until API v2 is deployed
// NOTE: This must stay in sync with backend validation
```

## Error Handling

### Frontend Error Handling

```typescript
// ✅ Good: Graceful error handling with user feedback
function WorkerList() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: workerApi.list,
    retry: 3,
    retryDelay: 1000,
  });

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <ErrorMessage
        message="Failed to load workers"
        error={error}
        onRetry={() => queryClient.invalidateQueries(['workers'])}
      />
    );
  }

  return <WorkerGrid workers={data} />;
}
```

### Backend Error Handling

```typescript
// ✅ Good: Centralized error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error
  logger.error({
    err,
    req: {
      method: req.method,
      url: req.url,
      user: req.user?.id,
    },
  });

  // Determine status code
  const statusCode = err instanceof ValidationError ? 400
    : err instanceof NotFoundError ? 404
    : err instanceof UnauthorizedError ? 401
    : 500;

  // Send response
  res.status(statusCode).json({
    success: false,
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});
```

## Resources

- **ESLint Config**: `.eslintrc.json` in root
- **Prettier Config**: `.prettierrc` in root
- **TypeScript Config**: `tsconfig.json` in root and packages
- **Example Code**: Browse `packages/` for reference implementations

---

**Remember:**
- Consistency > Personal preference
- Readability > Cleverness
- Type safety > Runtime errors
- Tests > Assumptions

When in doubt, follow the patterns you see in existing code. If something seems inconsistent, start a discussion!

🚜 *Happy coding!*
