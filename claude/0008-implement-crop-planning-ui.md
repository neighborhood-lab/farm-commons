# Task 0008: Implement Crop Planning Calendar UI

## Status

[ ] To Do
[ ] In Progress
[ ] Completed

## Priority

High

## Description

Create an interactive crop planning calendar view for farmers to plan seasonal rotations, planting schedules, and harvest timelines. This is a core Phase 2 feature that helps small-scale farmers optimize their field usage and plan ahead for crop rotations throughout the growing season.

## Acceptance Criteria

- [ ] Calendar grid view showing 12-month timeline
- [ ] Drag-and-drop crop placement on timeline
- [ ] Color-coded crop categories (vegetables, grains, legumes, etc.)
- [ ] Field assignment for each crop planning entry
- [ ] Crop rotation recommendations (e.g., don't plant tomatoes after peppers)
- [ ] Season-aware planting suggestions based on crop type
- [ ] Mobile-responsive design
- [ ] English/Spanish bilingual support
- [ ] Data persists to backend API

## Technical Notes

### Frontend Components Needed:

```
src/pages/CropPlanningPage.tsx    - Main page component
src/components/CropCalendar.tsx    - Calendar grid with drag-drop
src/components/CropCard.tsx        - Individual crop planning card
src/components/CropLibrary.tsx     - Draggable crop options
src/lib/cropData.ts                - Crop metadata (seasons, families)
```

### Backend API Endpoints:

The `crops.ts` route already exists with most CRUD operations. May need to add:

- `GET /api/crops/recommendations` - Get rotation suggestions
- `GET /api/crops/calendar/:farmId/:year` - Get annual plan

### Data Model:

```typescript
interface CropPlan {
  id: string;
  crop_id: string;
  field_id: string;
  planned_start: Date;
  planned_end: Date;
  quantity_estimate: number;
  notes?: string;
}
```

### Design Considerations:

- Use `react-dnd` or similar for drag-and-drop
- Calendar should show months across top, fields down left side
- Color-code by crop family to visualize rotation
- Warn when planting incompatible succession crops

## Related Tasks

- Depends on: #0002 (i18n setup - completed)
- Blocks: Harvest tracking, inventory management
- Related to: Phase 2 operations features

## Completion Checklist

- [ ] CropPlanningPage component created
- [ ] Calendar grid with drag-drop working
- [ ] Crop library with filtering
- [ ] Field selection working
- [ ] Data saves to backend
- [ ] Rotation warnings implemented
- [ ] Unit tests for crop logic
- [ ] Bilingual labels
- [ ] Mobile responsive
- [ ] Accessibility tested
- [ ] Committed to develop

## Completion Date

[YYYY-MM-DD]

## Notes

This feature directly helps small farmers plan their operations, which is core to the Farm Commons mission. Focus on simplicity and practical utility over complexity.
