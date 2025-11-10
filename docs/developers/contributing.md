# Developer Contributing Guide

This guide provides detailed technical guidelines for contributing to Farm Commons. For general contribution information, see [CONTRIBUTING.md](../../CONTRIBUTING.md) in the root directory.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Working with the Codebase](#working-with-the-codebase)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Review Guidelines](#code-review-guidelines)
- [Common Tasks](#common-tasks)

## Getting Started

### First-Time Setup

1. **Complete the setup guide**: Follow [setup.md](./setup.md) to configure your local environment

2. **Familiarize yourself with the architecture**: Read [architecture.md](./architecture.md) to understand the system design

3. **Review coding standards**: Check [code-style.md](./code-style.md) for coding conventions

4. **Pick a task**: Browse [TASKS.md](../../TASKS.md) for available tasks or look for `good-first-issue` labels in GitHub Issues

### Understanding the Task System

Farm Commons uses a structured task system (see `TASKS.md`):

```
Task ID Format: ####
  0000-0017: Core features (backend, frontend, shared)
  0018-0020: Security & authentication
  0021-0023: Mobile preparation
  0024-0027: UI/UX enhancements
  0028-0031: Testing & quality
  ...and more
```

Each task is designed to:
- Be independently workable
- Minimize merge conflicts
- Have clear acceptance criteria
- Include testing requirements

## Development Workflow

### Branch Strategy

```bash
# Main branches
main              # Production-ready code
develop           # Integration branch (if using gitflow)

# Feature branches
feature/task-0001-certifications-api
feature/dark-mode-support
fix/time-entry-calculation-bug
docs/api-documentation
refactor/worker-service-cleanup
test/schedule-integration-tests
```

### Standard Workflow

1. **Create a branch from main:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/task-0008-field-management-page
   ```

2. **Make your changes:**
   - Write code following the style guide
   - Add tests for new functionality
   - Update documentation as needed

3. **Commit frequently with clear messages:**
   ```bash
   git add .
   git commit -m "Add field list view with GPS map integration"
   ```

4. **Keep your branch up to date:**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

5. **Run all checks before pushing:**
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```

6. **Push to your fork:**
   ```bash
   git push origin feature/task-0008-field-management-page
   ```

7. **Open a Pull Request:**
   - Provide a clear description
   - Reference the task number (e.g., "Implements TASK 0008")
   - Fill out the PR template completely

## Working with the Codebase

### Package Structure

```bash
# Work on backend
cd packages/backend
npm run dev

# Work on frontend
cd packages/frontend
npm run dev

# Work on shared types
cd packages/shared
npm run build
```

### Adding New Dependencies

```bash
# Root dependencies (build tools, shared dev deps)
npm install -D prettier --workspace-root

# Backend dependencies
npm install express-session --workspace=@farm-commons/backend

# Frontend dependencies
npm install recharts --workspace=@farm-commons/frontend

# Shared dependencies
npm install zod --workspace=@farm-commons/shared
```

### Creating Database Migrations

```bash
# Create a new migration
cd packages/backend
npm run db:migrate:make -- add_equipment_table

# Edit the migration file
# packages/backend/src/db/migrations/00X_add_equipment_table.ts

# Run the migration
npm run db:migrate:latest

# Test rollback
npm run db:migrate:rollback
```

Migration template:

```typescript
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('equipment', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('farm_id').notNullable().references('id').inTable('farms');
    table.string('name').notNullable();
    table.string('type').notNullable();
    table.text('description');
    table.timestamps(true, true);

    table.index('farm_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('equipment');
}
```

### Adding API Routes

1. **Define types in `packages/shared/src/types.ts`:**
   ```typescript
   export interface Equipment {
     id: string;
     farm_id: string;
     name: string;
     type: string;
     description: string | null;
     created_at: Date;
     updated_at: Date;
   }
   ```

2. **Create route file `packages/backend/src/routes/equipment.ts`:**
   ```typescript
   import { Router } from 'express';
   import { authenticate, authorize } from '../middleware/auth.js';

   const router = Router();

   router.get('/', authenticate, async (req, res) => {
     // Implementation
   });

   router.post('/', authenticate, authorize(['admin', 'manager']), async (req, res) => {
     // Implementation
   });

   export default router;
   ```

3. **Register route in `packages/backend/src/index.ts`:**
   ```typescript
   import equipmentRoutes from './routes/equipment.js';
   app.use('/api/equipment', equipmentRoutes);
   ```

4. **Add frontend API client `packages/frontend/src/lib/api.ts`:**
   ```typescript
   export const equipmentApi = {
     list: () => api.get('equipment').json<Equipment[]>(),
     getById: (id: string) => api.get(`equipment/${id}`).json<Equipment>(),
     create: (data: CreateEquipmentDto) => api.post('equipment', { json: data }).json<Equipment>(),
   };
   ```

### Creating React Components

```typescript
// packages/frontend/src/components/EquipmentList.tsx
import { useQuery } from '@tanstack/react-query';
import { equipmentApi } from '../lib/api';

export function EquipmentList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['equipment'],
    queryFn: equipmentApi.list,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="grid gap-4">
      {data?.map((item) => (
        <EquipmentCard key={item.id} equipment={item} />
      ))}
    </div>
  );
}
```

## Testing Guidelines

### Test Coverage Requirements

- **Unit Tests**: All utility functions, business logic
- **Integration Tests**: All API endpoints
- **Component Tests**: All React components with logic
- **E2E Tests**: Critical user flows (login, scheduling, time tracking)

**Target: 80% code coverage minimum**

### Writing Backend Tests

```typescript
// packages/backend/src/__tests__/routes/equipment.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index.js';

describe('Equipment API', () => {
  let authToken: string;

  beforeEach(async () => {
    // Setup test database
    await setupTestDatabase();

    // Get auth token
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password' });
    authToken = response.body.data.access_token;
  });

  it('should list all equipment', async () => {
    const response = await request(app)
      .get('/api/equipment')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should create new equipment', async () => {
    const newEquipment = {
      name: 'Tractor',
      type: 'Heavy Equipment',
      description: 'John Deere 5055E',
    };

    const response = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newEquipment);

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe('Tractor');
  });
});
```

### Writing Frontend Tests

```typescript
// packages/frontend/src/components/__tests__/EquipmentList.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EquipmentList } from '../EquipmentList';
import { equipmentApi } from '../../lib/api';

vi.mock('../../lib/api');

describe('EquipmentList', () => {
  it('should display equipment list', async () => {
    const mockData = [
      { id: '1', name: 'Tractor', type: 'Heavy Equipment' },
      { id: '2', name: 'Plow', type: 'Attachment' },
    ];

    vi.mocked(equipmentApi.list).mockResolvedValue(mockData);

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <EquipmentList />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Tractor')).toBeInTheDocument();
      expect(screen.getByText('Plow')).toBeInTheDocument();
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test:coverage

# Run specific test file
npm test -- equipment.test.ts

# Run tests for specific package
npm test --workspace=@farm-commons/backend
```

## Pull Request Process

### PR Checklist

Before submitting a PR, ensure:

- [ ] Code follows the [style guide](./code-style.md)
- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] New features have tests
- [ ] Documentation is updated (README, API docs, etc.)
- [ ] Database migrations are reversible
- [ ] Breaking changes are clearly documented
- [ ] Commit messages are clear and descriptive

### PR Template

```markdown
## Description
Brief description of what this PR does

## Related Task
Implements TASK 0008 - Build Field Management Page

## Changes Made
- Added FieldsPage component with list view
- Integrated GPS map using Leaflet
- Created field creation form with map picker
- Added field details view with crop history

## Testing
- [ ] Unit tests added for field utilities
- [ ] Component tests for FieldsPage
- [ ] Integration tests for fields API
- [ ] Manual testing completed

## Screenshots (if UI changes)
[Attach screenshots]

## Breaking Changes
None / [Describe breaking changes]

## Checklist
- [x] Tests pass
- [x] Linting passes
- [x] Documentation updated
- [x] Ready for review
```

### PR Size Guidelines

Keep PRs focused and reasonably sized:

- **Small (preferred)**: < 300 lines changed
- **Medium**: 300-800 lines changed
- **Large**: > 800 lines (consider splitting)

Large PRs are harder to review and more likely to introduce bugs.

## Code Review Guidelines

### As a Reviewer

**What to Look For:**

1. **Correctness**: Does the code do what it's supposed to?
2. **Tests**: Are there adequate tests? Do they cover edge cases?
3. **Security**: Any security vulnerabilities? (SQL injection, XSS, etc.)
4. **Performance**: Any obvious performance issues?
5. **Style**: Does it follow our coding standards?
6. **Documentation**: Is the code well-documented?
7. **Breaking Changes**: Are they necessary and well-documented?

**Review Etiquette:**

- Be kind and constructive
- Ask questions rather than make demands
- Provide specific examples
- Approve if minor changes can be addressed in follow-up
- Request changes if critical issues exist

### As an Author

**Responding to Reviews:**

- Thank reviewers for their time
- Address all comments (even if just to explain your reasoning)
- Push new commits (don't force push during review)
- Mark conversations as resolved when addressed
- Re-request review after making changes

## Common Tasks

### Adding a New Feature

1. Find or create a task in TASKS.md
2. Create a feature branch
3. Add database migration (if needed)
4. Create/update types in shared package
5. Implement backend API route
6. Add backend tests
7. Implement frontend component
8. Add frontend tests
9. Update documentation
10. Submit PR

### Fixing a Bug

1. Create a test that reproduces the bug
2. Fix the bug
3. Ensure the test passes
4. Add regression test if needed
5. Submit PR with "fix: " prefix

### Updating Documentation

1. Create a branch with "docs/" prefix
2. Make documentation changes
3. Verify formatting and links
4. Submit PR

### Refactoring Code

1. Ensure full test coverage of code to be refactored
2. Make refactoring changes
3. Verify all tests still pass
4. No behavior changes (tests shouldn't need updates)
5. Submit PR with "refactor: " prefix

## Git Commit Best Practices

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring without behavior change
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, build config, etc.)

**Examples:**

```
feat: add equipment tracking module

Implements TASK 0043 - Equipment Tracking
- Create equipment table migration
- Add CRUD API endpoints
- Build equipment management UI

Closes #123
```

```
fix: correct time entry calculation when crossing midnight

Previously, time entries that started before midnight and ended
after midnight were calculating negative hours. Now properly
handles date rollover.

Fixes #456
```

### Atomic Commits

Make commits small and focused:

```bash
# Good: Small, focused commits
git add packages/backend/src/routes/equipment.ts
git commit -m "feat: add equipment API routes"

git add packages/frontend/src/components/EquipmentList.tsx
git commit -m "feat: add equipment list component"

# Bad: One giant commit
git add .
git commit -m "add equipment feature"
```

## Getting Help

### Resources

- **Documentation**: Read existing docs in `/docs/developers/`
- **Code Examples**: Browse existing routes, components for patterns
- **Architecture**: Review [architecture.md](./architecture.md)
- **GitHub Issues**: Search for similar issues
- **Discussions**: Ask questions in GitHub Discussions

### Asking Good Questions

When asking for help:

1. **Search first**: Check if it's already documented or discussed
2. **Provide context**: What are you trying to do?
3. **Show your work**: What have you tried?
4. **Include details**: Error messages, code snippets, logs
5. **Be specific**: "How do I add a new API route?" vs "How does this work?"

## Recognition

Contributors are recognized through:

- `CONTRIBUTORS.md` listing
- Release notes mentions
- Project website (coming soon)
- GitHub contributor graphs

Thank you for contributing to Farm Commons! 🚜

---

**Next Steps:**
- Read the [Code Style Guide](./code-style.md)
- Pick a task from [TASKS.md](../../TASKS.md)
- Join the community discussions

*Built with soil under our fingernails*
