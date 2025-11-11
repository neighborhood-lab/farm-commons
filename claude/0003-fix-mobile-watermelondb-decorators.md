# Task 0003: Fix Mobile WatermelonDB Decorator Configuration

## Status

[ ] To Do
[ ] In Progress
[ ] Completed

## Priority

Medium

## Description

The mobile package has TypeScript decorator errors preventing typecheck from passing. WatermelonDB uses decorators for model definitions which require `experimentalDecorators: true` in tsconfig. This is currently blocking the mobile package build.

## Acceptance Criteria

- [ ] Add experimentalDecorators to mobile tsconfig.json
- [ ] Add emitDecoratorMetadata if needed
- [ ] Mobile package typechecks successfully
- [ ] All WatermelonDB model decorators work correctly
- [ ] No regression in existing mobile functionality
- [ ] Mobile package builds successfully

## Technical Notes

### Current Errors:

- ~200+ decorator errors in all model files
- Error: "Unable to resolve signature of property decorator when called as an expression"
- Affects: User, Farm, Field, Schedule, TimeEntry, Certification, SyncQueue models

### Required tsconfig Changes:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Files Affected:

- packages/mobile/tsconfig.json
- packages/mobile/src/database/models/\*.ts (all model files)

### WatermelonDB Documentation Reference:

WatermelonDB requires TypeScript experimental decorators for model definitions.

## Related Tasks

- Related to: #0001 (Build errors)
- Blocks: Mobile app development
- Depends on: None

## Completion Checklist

- [ ] tsconfig.json updated with decorator support
- [ ] Mobile package typechecks successfully
- [ ] No decorator errors in model files
- [ ] Build completes without errors
- [ ] Documentation updated if needed
- [ ] PR created, checks passing
- [ ] PR merged to develop
- [ ] Post-merge checks passing

## Completion Date

[YYYY-MM-DD]

## Notes

This is standard WatermelonDB setup. Should be straightforward configuration change.
