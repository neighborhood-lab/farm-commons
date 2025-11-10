# Task Checklist System API

## Overview

The Task Checklist System allows farms to create reusable checklist templates and assign them to scheduled tasks. This helps ensure that all necessary steps are completed before, during, or after farm activities.

## Features

- Create reusable checklist templates
- Define required vs optional checklist items
- Assign checklists to scheduled tasks
- Track completion status with timestamps
- Add notes and photo verification to completed items
- Sort items by custom order

## Database Schema

### Tables

1. **checklist_templates**: Reusable checklist templates
2. **checklist_template_items**: Individual items within a template
3. **schedule_checklists**: Links templates to schedules
4. **checklist_item_completions**: Tracks completion of individual items

## API Endpoints

### Checklist Templates

#### GET `/api/task-checklists/templates`
List all checklist templates for the farm.

**Authentication:** Required
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "farm_id": "uuid",
      "name": "Pre-Harvest Checklist",
      "description": "Tasks to complete before harvesting",
      "task_type": "Harvesting",
      "item_count": 5,
      "created_at": "2024-11-10T10:00:00Z",
      "updated_at": "2024-11-10T10:00:00Z"
    }
  ]
}
```

#### GET `/api/task-checklists/templates/:id`
Get a single template with all its items.

**Authentication:** Required
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "farm_id": "uuid",
    "name": "Pre-Harvest Checklist",
    "description": "Tasks to complete before harvesting",
    "task_type": "Harvesting",
    "created_at": "2024-11-10T10:00:00Z",
    "updated_at": "2024-11-10T10:00:00Z",
    "items": [
      {
        "id": "uuid",
        "template_id": "uuid",
        "description": "Check weather conditions",
        "is_required": true,
        "sort_order": 0,
        "created_at": "2024-11-10T10:00:00Z",
        "updated_at": "2024-11-10T10:00:00Z"
      }
    ]
  }
}
```

#### POST `/api/task-checklists/templates`
Create a new checklist template with items.

**Authentication:** Required (Admin/Manager only)
**Request Body:**
```json
{
  "name": "Pre-Harvest Checklist",
  "description": "Tasks to complete before harvesting",
  "task_type": "Harvesting",
  "items": [
    {
      "description": "Check weather conditions",
      "is_required": true,
      "sort_order": 0
    },
    {
      "description": "Inspect equipment",
      "is_required": true,
      "sort_order": 1
    },
    {
      "description": "Prepare containers",
      "is_required": false,
      "sort_order": 2
    }
  ]
}
```

#### PUT `/api/task-checklists/templates/:id`
Update a checklist template.

**Authentication:** Required (Admin/Manager only)
**Request Body:**
```json
{
  "name": "Updated Checklist Name",
  "description": "Updated description",
  "task_type": "Planting"
}
```

#### DELETE `/api/task-checklists/templates/:id`
Delete a checklist template (cascades to items and assignments).

**Authentication:** Required (Admin/Manager only)

### Template Items

#### POST `/api/task-checklists/templates/:id/items`
Add an item to an existing template.

**Authentication:** Required (Admin/Manager only)
**Request Body:**
```json
{
  "description": "New checklist item",
  "is_required": false,
  "sort_order": 3
}
```

#### PUT `/api/task-checklists/items/:id`
Update a checklist item.

**Authentication:** Required (Admin/Manager only)
**Request Body:**
```json
{
  "description": "Updated item description",
  "is_required": true,
  "sort_order": 1
}
```

#### DELETE `/api/task-checklists/items/:id`
Delete a checklist item.

**Authentication:** Required (Admin/Manager only)

### Schedule Assignment

#### POST `/api/task-checklists/assign`
Assign a checklist template to a schedule.

**Authentication:** Required (Admin/Manager only)
**Request Body:**
```json
{
  "schedule_id": "uuid",
  "template_id": "uuid"
}
```

**Note:** This automatically creates completion records for all items in the template.

#### GET `/api/task-checklists/schedule/:scheduleId`
Get all checklists assigned to a schedule with completion status.

**Authentication:** Required
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "schedule_checklist_id": "uuid",
      "schedule_id": "uuid",
      "template_id": "uuid",
      "template_name": "Pre-Harvest Checklist",
      "template_description": "Tasks to complete before harvesting",
      "created_at": "2024-11-10T10:00:00Z",
      "items": [
        {
          "completion_id": "uuid",
          "item_id": "uuid",
          "description": "Check weather conditions",
          "is_required": true,
          "sort_order": 0,
          "completed": true,
          "completed_at": "2024-11-10T12:30:00Z",
          "completed_by_email": "manager@farm.com",
          "notes": "Clear skies, perfect for harvest",
          "photo_url": "https://example.com/photo.jpg"
        }
      ]
    }
  ]
}
```

### Completion Tracking

#### PUT `/api/task-checklists/completions/:id`
Mark a checklist item as completed or incomplete.

**Authentication:** Required
**Request Body:**
```json
{
  "completed": true,
  "notes": "Verified all equipment is functioning",
  "photo_url": "https://example.com/verification-photo.jpg"
}
```

**Note:** When marking as completed, the system automatically records the user and timestamp.

## Use Cases

### 1. Safety Checklists
Create templates for pre-work safety checks:
- Verify PPE availability
- Check first aid kit
- Inspect safety equipment
- Review emergency procedures

### 2. Equipment Checklists
Before using farm equipment:
- Check fuel levels
- Inspect hydraulic systems
- Verify safety features
- Document maintenance needs

### 3. Harvest Checklists
Pre-harvest preparations:
- Check weather forecast
- Inspect harvesting equipment
- Prepare storage facilities
- Verify transportation readiness
- Coordinate worker assignments

### 4. Planting Checklists
Pre-planting tasks:
- Soil preparation verification
- Seed inventory check
- Equipment readiness
- Irrigation system check
- Weather monitoring

## Best Practices

1. **Required Items**: Mark critical safety or quality items as required
2. **Sort Order**: Use sort_order to ensure logical task sequence
3. **Photo Verification**: Use photo attachments for compliance documentation
4. **Notes**: Add context to completions for future reference
5. **Task Types**: Associate templates with specific task types for automatic suggestions

## Security

- All endpoints require authentication
- Template creation/modification requires Admin or Manager role
- Workers can complete checklist items assigned to their schedules
- Farm-level data isolation ensures users only access their farm's checklists

## Testing

Integration tests are available in:
```
packages/backend/src/routes/__tests__/task-checklists.test.ts
```

Run tests with:
```bash
npm test task-checklists
```
