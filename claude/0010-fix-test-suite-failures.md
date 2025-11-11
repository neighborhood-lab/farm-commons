# Task 0010: Fix Test Suite Failures Blocking CI

## Status

[ ] To Do
[ ] In Progress
[ ] Completed

## Priority

Critical

## Description

The CI test suite has multiple failures blocking PR merges. Tests are failing on both feature branches and develop branch, indicating systemic pre-existing issues. This task addresses all test failures to restore CI health and enable the quality gates to function properly.

## Acceptance Criteria

- [ ] All backend tests pass (`pnpm run test` in packages/backend)
- [ ] All frontend tests pass (`pnpm run test` in packages/frontend)
- [ ] All shared tests pass (`pnpm run test` in packages/shared)
- [ ] Security scan passes
- [ ] CI pipeline shows all green checks
- [ ] No regression in existing passing tests

## Technical Notes

### Current Test Failures (from CI run 19278673708):

**Frontend/Backend Tests:**

- `Cannot find module 'sqlite3'` - Missing dependency or incorrect import
- `Cannot find module '../../../knexfile.js'` - Path resolution issue
- Multiple `expected 200/201, got 403 "Forbidden"` - Authentication/authorization setup issues in tests
- `Invalid credentials` errors - Test fixtures not properly configured

**Root Causes Identified:**

1. Test database setup incomplete
2. Authentication tokens not properly mocked in integration tests
3. Missing test dependencies (sqlite3)
4. Knexfile path resolution broken
5. Test fixtures may have outdated data

### Strategy:

**Phase 1: Fix Test Infrastructure (Priority)**

1. Fix knexfile path resolution (use absolute imports or proper relative paths)
2. Add missing sqlite3 dependency if needed (or fix imports)
3. Fix test database initialization in setup files
4. Ensure authentication middleware is properly mocked in tests

**Phase 2: Fix Authentication Issues**

1. Review all 403 errors - likely RBAC middleware blocking test requests
2. Update test fixtures to include proper role assignments
3. Ensure test auth tokens have correct permissions

**Phase 3: Fix Security Scan**

1. Review npm audit output
2. Update vulnerable dependencies
3. Add overrides if needed for transitive dependencies

## Related Tasks

- Blocks: All PRs (CI must pass)
- Blocks: #0008 (Crop Planning UI - PR #98 ready but CI failing)
- Related to: #0005 (Shared package test failures - marked complete but may have issues)

## Completion Checklist

- [ ] All test infrastructure issues fixed
- [ ] All authentication/authorization test issues fixed
- [ ] Security scan passes
- [ ] CI pipeline fully green
- [ ] Verified on both develop branch and feature branch
- [ ] Documentation updated with test running instructions
- [ ] Committed to develop

## Completion Date

[YYYY-MM-DD]

## Notes

This is blocking PR #98 (Crop Planning UI) which is otherwise complete and ready to ship. The test failures are pre-existing (develop branch also failing) and not caused by recent changes. This is a critical infrastructure task that must be completed to restore development velocity.
