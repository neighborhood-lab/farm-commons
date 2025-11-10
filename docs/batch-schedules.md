# Batch Schedule Creation

## Overview

The Batch Schedule Creation feature (Task 0071) allows farm managers and administrators to create multiple schedules at once, reducing the time needed for scheduling large numbers of workers.

## Features

### 1. Bulk Schedule Creation
- Create multiple schedules in a single API request
- All schedules are created atomically (all succeed or all fail)
- Automatic rollback on any errors

### 2. Conflict Detection
- Automatically detects scheduling conflicts for workers
- Prevents double-booking workers at overlapping times
- Can be disabled if needed (e.g., for intentional overlaps)

### 3. Validation
- Validates worker existence and farm membership
- Validates field existence and farm membership
- Ensures all required fields are present

### 4. Template Support
- Optional template_id field for future template-based scheduling
- Foundation for recurring schedules feature

## API Endpoints

### POST /api/schedules/batch

Create multiple schedules at once.

**Authentication Required:** Yes (Manager or Admin role)

**Request Body:**
```json
{
  "schedules": [
    {
      "worker_id": "uuid",
      "field_id": "uuid",
      "scheduled_date": "2024-12-01",
      "start_time": "08:00",
      "end_time": "12:00",
      "task_type": "Planting",
      "task_description": "Plant tomatoes",
      "notes": "Optional notes"
    },
    {
      "worker_id": "uuid",
      "field_id": "uuid",
      "scheduled_date": "2024-12-01",
      "start_time": "13:00",
      "end_time": "17:00",
      "task_type": "Harvesting",
      "task_description": "Harvest corn"
    }
  ],
  "validate_conflicts": true,
  "template_id": "uuid (optional)"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "created_count": 2,
    "schedules": [
      {
        "id": "uuid",
        "worker_id": "uuid",
        "field_id": "uuid",
        "scheduled_date": "2024-12-01T00:00:00.000Z",
        "start_time": "08:00",
        "end_time": "12:00",
        "task_type": "Planting",
        "task_description": "Plant tomatoes",
        "status": "scheduled",
        "farm_id": "uuid",
        "created_at": "2024-11-10T12:00:00.000Z",
        "updated_at": "2024-11-10T12:00:00.000Z"
      }
    ]
  },
  "message": "Successfully created 2 schedule(s)"
}
```

**Error Response - Conflicts (409 Conflict):**
```json
{
  "success": false,
  "error": "Schedule conflicts detected",
  "conflicts": [
    {
      "worker_id": "uuid",
      "date": "2024-12-01",
      "new_time": "10:00-14:00",
      "existing_time": "08:00-12:00",
      "existing_task": "Planting",
      "existing_schedule_id": "uuid"
    }
  ]
}
```

**Error Response - Validation (400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation failed",
  "validation_errors": [
    {
      "type": "invalid_workers",
      "message": "Workers not found or do not belong to farm: uuid1, uuid2",
      "worker_ids": ["uuid1", "uuid2"]
    }
  ]
}
```

### POST /api/schedules/batch/validate

Validate schedules without creating them. Useful for checking conflicts before committing.

**Authentication Required:** Yes (Manager or Admin role)

**Request Body:** Same as batch creation endpoint

**Success Response (200 OK):**
```json
{
  "success": true,
  "valid": true,
  "schedule_count": 2,
  "message": "All 2 schedule(s) are valid and can be created"
}
```

**Response with Conflicts (200 OK):**
```json
{
  "success": true,
  "valid": false,
  "schedule_count": 2,
  "conflicts": [
    {
      "worker_id": "uuid",
      "date": "2024-12-01",
      "new_time": "10:00-14:00",
      "existing_time": "08:00-12:00",
      "existing_task": "Planting",
      "existing_schedule_id": "uuid"
    }
  ],
  "message": "Found 1 conflict(s)"
}
```

## Conflict Detection Logic

Two schedules are considered conflicting if:
1. They are for the same worker
2. They are on the same date
3. Their time ranges overlap
4. Neither schedule is cancelled

**Time Overlap Detection:**
- Schedule A (new): start_time to end_time
- Schedule B (existing): start_time to end_time
- Overlap exists if: `(A.start < B.end) AND (A.end > B.start)`

**Examples:**
- `08:00-12:00` and `10:00-14:00` → Conflict (overlap)
- `08:00-12:00` and `12:00-16:00` → No conflict (back-to-back)
- `08:00-12:00` and `13:00-17:00` → No conflict (separate times)

## Transaction Safety

All batch operations use database transactions to ensure data consistency:

1. Transaction begins
2. All validations are performed
3. All schedules are inserted
4. Transaction commits
5. If any step fails, transaction rolls back

This ensures that either all schedules are created successfully, or none are created.

## Use Cases

### 1. Weekly Schedule Planning
Create a week's worth of schedules for multiple workers:
```json
{
  "schedules": [
    // Monday
    { "worker_id": "...", "scheduled_date": "2024-12-02", "start_time": "08:00", "end_time": "12:00", "task_type": "Planting" },
    { "worker_id": "...", "scheduled_date": "2024-12-02", "start_time": "13:00", "end_time": "17:00", "task_type": "Watering" },
    // Tuesday
    { "worker_id": "...", "scheduled_date": "2024-12-03", "start_time": "08:00", "end_time": "12:00", "task_type": "Weeding" },
    // ... more schedules
  ]
}
```

### 2. Team Assignment
Assign multiple workers to the same task:
```json
{
  "schedules": [
    { "worker_id": "worker1", "scheduled_date": "2024-12-01", "start_time": "08:00", "end_time": "12:00", "task_type": "Harvesting", "field_id": "field1" },
    { "worker_id": "worker2", "scheduled_date": "2024-12-01", "start_time": "08:00", "end_time": "12:00", "task_type": "Harvesting", "field_id": "field1" },
    { "worker_id": "worker3", "scheduled_date": "2024-12-01", "start_time": "08:00", "end_time": "12:00", "task_type": "Harvesting", "field_id": "field1" }
  ]
}
```

### 3. Pre-validation
Check for conflicts before showing the schedule to the user:
```javascript
// First, validate
const validationResponse = await fetch('/api/schedules/batch/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ schedules: proposedSchedules })
});

const validation = await validationResponse.json();

if (validation.valid) {
  // Create the schedules
  await fetch('/api/schedules/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ schedules: proposedSchedules })
  });
} else {
  // Show conflicts to user
  console.log('Conflicts:', validation.conflicts);
}
```

## Future Enhancements

### Template-Based Creation
The `template_id` field is included for future enhancement:
- Save common scheduling patterns as templates
- Reuse templates to quickly create recurring schedules
- Example: "Monday Morning Harvest Team" template

### Recurring Schedules
Future implementation could include:
- Daily, weekly, or monthly recurrence patterns
- End date or occurrence count
- Automatic conflict detection across all generated schedules

## Testing

Basic unit tests are provided in `/packages/backend/src/routes/__tests__/batch-schedules.test.ts`.

For full integration testing, add supertest:
```bash
pnpm add -D supertest @types/supertest
```

Then implement the integration tests marked in the test file.

## Implementation Files

- **Route Handler:** `/packages/backend/src/routes/batch-schedules.ts`
- **Validator Schema:** `/packages/shared/src/validators.ts` (batchScheduleSchema)
- **Tests:** `/packages/backend/src/routes/__tests__/batch-schedules.test.ts`
- **Route Registration:** `/packages/backend/src/index.ts`

## Related Tasks

This implementation completes **Task 0071** from TASKS.md and provides foundation for:
- Task 0044: Task Templates
- Task 0072: Schedule Calendar View
- Task 0106: Shift Trading System
- Task 0117: Smart Schedule Suggestions
