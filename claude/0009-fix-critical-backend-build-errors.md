# Task 0009: Fix Critical Backend Build Errors Blocking CI

## Status

[x] In Progress
[ ] Completed

## Priority

Critical

## Description

The backend has 440 TypeScript errors blocking all CI/CD pipelines. This task focuses on fixing the CRITICAL subset that prevents builds from succeeding, prioritizing production code over test files. The goal is to get CI passing so feature PRs can merge.

## Acceptance Criteria

- [ ] Backend package builds successfully (`pnpm run build` passes)
- [ ] All `error is not defined` issues fixed in src/ (not **tests**)
- [ ] All `Number.Number.Number.parseInt` typos fixed
- [ ] All AuthUser type mismatches fixed
- [ ] CI pipeline passes for backend build
- [ ] Can proceed with merging feature PRs

## Strategy

**Phase 1: Fix Production Code Only (Priority)**

- Fix all errors in `src/` files (excluding `__tests__/`)
- Focus on middleware/, routes/, services/, queue/

**Phase 2: Test Files (If Time Permits)**

- Fix unused variable warnings in test files
- These don't block production builds

## Technical Notes

### Error Categories from CI Logs:

**Critical (Blocking Production Build):**

1. `error` is not defined in catch blocks (middleware, routes)
2. `Number.Number.parseInt` typos (partially fixed already)
3. AuthUser property mismatches (farmId vs farm_id)
4. Missing bullmq module
5. Redis client import issues

**Lower Priority (Test Files):**

- Unused variables in **tests**/ files
- Test setup issues

### Files Requiring Immediate Fixes:

Production Code:

- src/middleware/auditLog.ts
- src/middleware/cache.ts
- src/middleware/rateLimiting.ts
- src/middleware/rbac.ts
- src/middleware/validation.ts
- src/middleware/queryMonitoring.ts
- src/**tests**/setup.ts (affects all tests)

### Quick Wins:

1. Global find/replace `Number.Number.parseInt` → `Number.parseInt`
2. Add `(error)` or `(err)` to all catch blocks missing parameter
3. Install bullmq: `pnpm add bullmq`
4. Fix redis client import pattern

## Related Tasks

- Blocks: #0008 (Crop Planning UI - PR #98 waiting)
- Related to: #0007 (Backend TypeScript cleanup - broader scope)
- Critical for: All future PRs (CI is currently broken)

## Completion Checklist

- [ ] Critical errors fixed (production code)
- [ ] Backend builds successfully
- [ ] CI pipeline passes
- [ ] PR #98 can be merged
- [ ] Committed to develop
- [ ] Post-commit checks passing

## Completion Date

[YYYY-MM-DD]

## Notes

This is a CRITICAL BLOCKER. All feature development is stalled until CI passes. Focus on speed over perfection - fix enough to unblock, defer test file cleanup to task #0007.
