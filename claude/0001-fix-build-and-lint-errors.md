# Task 0001: Fix Build and Lint Errors

## Status

[ ] To Do
[x] In Progress
[ ] Completed

## Priority

High

## Description

Fix all TypeScript compilation errors and ESLint warnings blocking the build. The codebase has syntax errors in TimeTrackingPage.tsx and SchedulePage.tsx, plus numerous lint violations in the frontend package that prevent successful builds and deployments.

## Acceptance Criteria

- [ ] All TypeScript compilation errors fixed (`pnpm run typecheck` passes)
- [ ] All ESLint errors fixed (warnings acceptable for now)
- [ ] SDK package builds successfully
- [ ] Frontend package builds successfully
- [ ] Backend package builds successfully
- [ ] Tests can run (even if some fail)

## Technical Notes

### Issues Identified:

**SDK Package:**

- ✅ FIXED: Unused imports in auth.ts causing type resolution issues
- ✅ FIXED: Missing DOM types in tsconfig.json

**Frontend Package:**
**1. TimeTrackingPage.tsx (line ~163, ~178):**

- Duplicate table rendering code (likely bad merge)
- Malformed JSX with incorrect closing tags
- `</thead>` should be `</tbody>`

**2. SchedulePage.tsx (lines 37, 117, 119, 133):**

- Unclosed `<div>` element
- Unexpected token/brace issues
- Missing closing tags

**3. Multiple component files have lint errors:**

- Layout.tsx: Unused imports (useState, MapPin, etc.), undefined useTranslation
- ThemeToggle.tsx: Missing global type definitions
- CertificationsPanel.tsx: Unused variable getDaysUntilExpiry
- FieldFormModal.tsx: Can use ternary instead of if/else
- UI components: Missing HTML element type definitions
- Multiple files: Using Math.random().substr() flagged by sonarjs

### Strategy:

1. Fix critical TypeScript errors blocking build first
2. Fix ESLint errors that are easy wins
3. Document remaining lint warnings for future cleanup task

## Related Tasks

- Blocks: All subsequent development tasks
- Related to: 0000 (Project Assessment)

## Completion Checklist

- [x] SDK typecheck errors fixed
- [ ] TimeTrackingPage.tsx syntax errors fixed
- [ ] SchedulePage.tsx syntax errors fixed
- [ ] All packages pass typecheck
- [ ] Critical lint errors fixed
- [ ] Build succeeds for all packages
- [ ] Tests can be executed

## Completion Date

[TBD]

## Notes

Started fixing. SDK package fixed. Frontend has JSX syntax errors from bad merges - need to clean up duplicate code blocks.
