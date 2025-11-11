# Task 0006: Fix lint-staged Configuration

## Status

[ ] To Do
[ ] In Progress
[x] Completed

## Priority

High

## Description

Fix lint-staged configuration to enable pre-commit hooks. The project has lint-staged installed but no configuration file, causing all commits with husky pre-commit hooks to fail. This blocks the development workflow and needs immediate resolution.

## Acceptance Criteria

- [ ] Create .lintstagedrc.json or add lint-staged config to package.json
- [ ] Configure lint-staged to run appropriate linters on staged files
- [ ] Pre-commit hooks execute successfully
- [ ] Linters run only on changed files (not entire codebase)
- [ ] Commit workflow is fast (<10 seconds for typical changes)
- [ ] Configuration supports all file types in monorepo

## Technical Notes

### Current Issue:

```bash
✖ No valid configuration found.
husky - pre-commit script failed (code 1)
```

### Recommended Configuration:

**Option 1: .lintstagedrc.json**

```json
{
  "packages/*/src/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "packages/*/src/**/*.{css,scss}": ["prettier --write"],
  "*.{json,md,yml}": ["prettier --write"]
}
```

**Option 2: package.json**

```json
{
  "lint-staged": {
    "packages/*/src/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml}": ["prettier --write"]
  }
}
```

### Files to Modify:

1. Create `.lintstagedrc.json` at repository root
2. Verify `.husky/pre-commit` is correctly configured
3. Test with sample commit

### Performance Considerations:

- Lint-staged only runs on staged files (not full codebase)
- ESLint cache should be enabled for faster runs
- Consider excluding test files from pre-commit if too slow

## Related Tasks

- Blocks: All development work (commits fail without this)
- Related to: #0002, #0003, #0004 (prevents committing those fixes)

## Completion Checklist

- [x] lint-staged configuration file created
- [x] Pre-commit hooks work correctly
- [x] Test with various file types
- [x] Documentation updated with commit workflow
- [x] Merged to develop
- [x] Post-merge checks passing

## Completion Date

2025-11-11

## Notes

Successfully configured lint-staged to run ESLint and Prettier on staged files. Pre-commit hooks now work correctly.

### Implementation:

- Created `.lintstagedrc.json` with file pattern matching
- Configured linters for TypeScript, CSS, JSON, YAML files
- Added `.turbo/` cache to gitignore
- Tested pre-commit hook - works flawlessly

### Impact:

- ✅ Pre-commit hooks now functional
- ✅ Code quality enforced automatically on every commit
- ✅ Fast execution (only runs on changed files)
- ✅ Unblocks development workflow

This was a 10-minute fix that removes a critical blocker.
