# Task 0004: Create Comprehensive Demo Data Seed

## Status

[ ] To Do
[ ] In Progress
[ ] Completed

## Priority

High

## Description

Create a comprehensive database seed script with realistic demo data for Farm Commons. This will enable easier local development, testing, and demos. The seed should include a complete farm operation with workers, fields, schedules, time entries, and certifications spanning 2-4 weeks of activity.

## Acceptance Criteria

- [ ] Demo farm created with realistic details
- [ ] 15-20 workers with varied roles and skills
- [ ] 5-10 fields with GPS coordinates and crop info
- [ ] 2-4 weeks of schedules across different workers and fields
- [ ] Historical time entries (completed shifts)
- [ ] Active time entries (current shifts)
- [ ] Worker certifications with varied expiry dates
- [ ] Mix of English and Spanish-speaking workers
- [ ] Realistic task types (planting, harvesting, maintenance, etc.)
- [ ] Script is idempotent (can run multiple times safely)
- [ ] npm run db:seed:demo executes successfully

## Technical Notes

### Seed Script Structure:

```typescript
// packages/backend/src/db/seeds/001_demo_data.ts

export async function seed(knex: Knex): Promise<void> {
  // 1. Clear existing demo data
  // 2. Create demo farm
  // 3. Create workers with varied profiles
  // 4. Create fields with GPS data
  // 5. Create schedules (past and future)
  // 6. Create time entries (completed and active)
  // 7. Create certifications
  // 8. Create skills assignments
}
```

### Data Realism Requirements:

- Worker names should be diverse
- Phone numbers formatted correctly
- GPS coordinates should be real farm locations (public data)
- Task types should match actual farm operations
- Wage rates should be realistic ($15-25/hr range)
- Certification types: Pesticide Applicator, Forklift, First Aid, Food Safety

### Seed Command:

Add to package.json:

```json
"db:seed:demo": "knex seed:run"
```

## Related Tasks

- Enables: Local development for all features
- Blocks: None (nice to have for development)
- Related to: All feature development tasks

## Completion Checklist

- [ ] Seed script created in correct location
- [ ] All entity types seeded with realistic data
- [ ] Script is idempotent
- [ ] npm run db:seed:demo works
- [ ] Data appears correctly in UI
- [ ] Documentation updated with seed instructions
- [ ] PR created, checks passing
- [ ] PR merged to develop
- [ ] Post-merge checks passing

## Completion Date

[YYYY-MM-DD]

## Notes

This significantly improves developer experience. Should include enough variety to test edge cases (expired certs, overlapping schedules, etc.)
