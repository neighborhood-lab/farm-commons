# Task 0007: Fix Remaining Backend TypeScript Errors

## Status

[ ] To Do
[x] In Progress
[ ] Completed

## Priority

High

## Description

Clean up remaining TypeScript errors in the backend package. Most errors are unused variables, missing catch parameters, and incomplete stub functions. These need to be resolved to ensure type safety and code quality.

## Acceptance Criteria

- [ ] All unused variable declarations removed or prefixed with `_`
- [ ] All catch blocks have error parameters
- [ ] Missing dependencies installed (twilio, fast-csv, exceljs, bullmq)
- [ ] Stub functions either implemented or marked as TODO
- [ ] Backend package typechecks with 0 errors
- [ ] No regression in existing functionality

## Technical Notes

### Current Errors (26 total):

**Unused Variables:**

- payroll.test.ts: vi, PayPeriod, startOfWeek, endOfWeek
- payroll.ts: Knex, parseISO, payPeriod
- upload.ts: fileURLToPath, bucket, region, endpoint, accessKeyId, secretAccessKey, key, filename (multiple)
- webhooks.ts: WebhookPayload

**Missing Catch Parameters:**

- sms.ts: line 275
- upload.ts: line 94
- webhooks.ts: line 361

**Missing Property in Object:**

- weather.ts: lines 161, 299 (error not in scope)

**Missing Dependencies:**

- twilio (sms.ts)
- fast-csv (export.ts)
- exceljs (export.ts)
- bullmq (queue/jobs/cleanup.ts)

### Fix Strategy:

1. **Unused variables**: Prefix with `_` if part of destructuring, otherwise remove
2. **Catch blocks**: Add `(error)` parameter
3. **Missing deps**: Install or stub if not needed yet
4. **Stub functions**: Add `// TODO: Implement` comments

## Related Tasks

- Related to: #0001 (Build errors)
- Enables: Clean CI pipeline, better developer experience

## Completion Checklist

- [ ] Code cleanup completed
- [ ] Dependencies installed or stubbed
- [ ] Backend typechecks successfully
- [ ] Tests still pass
- [ ] Committed to develop
- [ ] Post-commit checks passing

## Completion Date

[YYYY-MM-DD]

## Notes

### Progress Made (2025-11-11):

**Fixes Completed:**

- ✅ Fixed all `Number.Number.Number.parseInt` typos (14 files)
- ✅ Fixed knexfile import path (`.js` → `.cjs`)
- ✅ Fixed AuthUser ID type mismatches (string vs number)
- ✅ Reduced errors from 473 → 440 (33 errors fixed)

**Remaining Work:**

- 440 TypeScript errors still present
- Most are in test files (unused variables, missing catch parameters)
- Route files have many `error is not defined` in catch blocks
- Consider disabling strict unused variable checks for test files as alternative

This task is larger than initially estimated. Marking as partial progress and creating follow-up task.
