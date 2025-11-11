# Task 0005: Fix Shared Package Test Failures

## Status

[ ] To Do
[ ] In Progress
[ ] Completed

## Priority

High

## Description

The shared package has 6 pre-existing test failures that are blocking CI. These failures are in passwordStrength.test.ts, currency.test.ts, validators.test.ts, and datetime.test.ts. All tests must pass before merging any PR.

## Acceptance Criteria

- [ ] All tests in shared/src/utils/passwordStrength.test.ts pass
- [ ] All tests in shared/src/utils/**tests**/currency.test.ts pass
- [ ] All tests in shared/src/validators.test.ts pass
- [ ] All tests in shared/src/utils/**tests**/datetime.test.ts pass
- [ ] Shared package test coverage remains above 80%
- [ ] No regressions in passing tests

## Technical Notes

### Current Test Failures:

1. **passwordStrength.test.ts** (1 failure):
   - "should penalize repeated characters" test failing

2. **currency.test.ts** (2 failures):
   - "should handle decimal hours" test failing
   - "should handle negative amounts" (parseCurrency) test failing

3. **validators.test.ts** (1 failure):
   - "should reject invalid time format" test failing

4. **datetime.test.ts** (4 failures):
   - Need to review error output to identify specific failing tests

### Investigation Approach:

1. Run tests locally with verbose output
2. Review test expectations vs actual behavior
3. Fix implementation or update test expectations (if requirements changed)
4. Ensure edge cases are covered

## Related Tasks

- Blocks: All PRs (CI must pass)
- Related to: #0002 (i18n), #0003 (mobile), #0004 (demo data)

## Completion Checklist

- [ ] Investigate all test failures
- [ ] Fix failing tests
- [ ] Verify no regressions
- [ ] Run full test suite locally
- [ ] PR created, checks passing
- [ ] PR merged to develop
- [ ] Post-merge checks passing

## Completion Date

[YYYY-MM-DD]

## Notes

These are pre-existing failures that were present before recent work. They need to be fixed to unblock all CI checks.
