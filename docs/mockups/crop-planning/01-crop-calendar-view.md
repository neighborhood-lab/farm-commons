# Crop Calendar View Mockup

## Overview
The Crop Calendar View provides a visual timeline of all crop activities across the farm, helping farmers plan and coordinate planting, maintenance, and harvest activities throughout the growing season.

## Layout Structure

### Top Navigation Bar
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Farm Commons                    [Crop Planning]  👤 User   ☰ Menu       │
└─────────────────────────────────────────────────────────────────────────┘
```

### View Controls
```
┌─────────────────────────────────────────────────────────────────────────┐
│  2025 Crop Calendar                                                      │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────┐                  │
│  │ ◀ Previous     │  │   Year: 2025  │  │  Next ▶   │                  │
│  └────────────────┘  └──────────────┘  └────────────┘                  │
│                                                                           │
│  View:  ( ) Month  (•) Season  ( ) Year                                 │
│  Filter: [All Fields ▾]  [All Crops ▾]  [All Activities ▾]             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Seasonal Calendar View (Default)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SPRING (Mar - May)                                │
├─────────┬───────────┬───────────────────────────────────────────────────┤
│ Field   │ Crop      │        March    │    April    │     May          │
├─────────┼───────────┼──────────────┬──┼──────────┬──┼──────────────────┤
│ North   │ Tomatoes  │  [Prep Soil] │░░│░Planting░│██│████Growing███    │
│ Field   │           │              │  │          │  │                  │
├─────────┼───────────┼──────────────┴──┼──────────┴──┼──────────────────┤
│ South   │ Lettuce   │     [Planting]  │░░Growing░░░ │ [Harvest]        │
│ Field   │           │                 │             │                  │
├─────────┼───────────┼─────────────────┼─────────────┼──────────────────┤
│ East    │ Peppers   │                 │ [Prep Soil] │░░░Planting░░     │
│ Field   │           │                 │             │                  │
└─────────┴───────────┴─────────────────┴─────────────┴──────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        SUMMER (Jun - Aug)                                │
├─────────┬───────────┬───────────────────────────────────────────────────┤
│ Field   │ Crop      │       June     │    July     │   August          │
├─────────┼───────────┼──────────────┬─┼──────────┬──┼──────────────────┤
│ North   │ Tomatoes  │████Growing███│█│██Growing█│██│[Harvest]         │
│ Field   │           │              │ │          │  │                  │
├─────────┼───────────┼──────────────┴─┼──────────┴──┼──────────────────┤
│ South   │ Cucumbers │  [Planting]    │░░Growing░░  │ [Harvest]        │
│ Field   │           │                │             │                  │
├─────────┼───────────┼────────────────┼─────────────┼──────────────────┤
│ East    │ Peppers   │███Growing███   │████Growing█ │███Growing████    │
│ Field   │           │                │             │                  │
└─────────┴───────────┴────────────────┴─────────────┴──────────────────┘

[Continue pattern for Fall and Winter...]
```

### Color Coding Legend
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Legend:                                                                  │
│  [Activity]  = Planned task/event                                       │
│  ░░░░░░░░    = Growing period (light shade)                             │
│  ████████    = Active growth (dark shade)                               │
│  🌱          = Planting phase                                           │
│  🌿          = Vegetative growth                                        │
│  🌸          = Flowering                                                │
│  🍅          = Fruiting/Harvest ready                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Interactive Features

### 1. Timeline Interactions
- **Click on bar**: View detailed crop information and edit activities
- **Drag bar edges**: Adjust planting or harvest dates
- **Drag bar**: Shift entire crop cycle
- **Right-click**: Quick actions menu (edit, duplicate, delete)

### 2. Hover States
When hovering over a crop timeline bar:
```
┌─────────────────────────────────────────┐
│ Tomatoes - North Field                  │
│ ─────────────────────────────────────── │
│ Planted: March 15, 2025                 │
│ Expected Harvest: June 20 - July 15     │
│ Days to Maturity: 75-80 days            │
│ Status: On schedule                     │
│                                          │
│ 📊 View Details  ✏️ Edit  📋 Copy       │
└─────────────────────────────────────────┘
```

### 3. Activity Detail Modal
Clicking on an activity bracket [Activity] opens:
```
┌─────────────────────────────────────────────────────────────────┐
│ Activity Details                                      [✕ Close] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Activity Type:     [Prep Soil ▾]                               │
│  Field:             North Field                                 │
│  Crop:              Tomatoes                                    │
│  Scheduled Date:    March 1-7, 2025                            │
│  Assigned Workers:  [+ Add Workers]                             │
│  Tasks:                                                          │
│    □ Till soil                                                  │
│    □ Add compost                                                │
│    □ Check pH levels                                            │
│    □ Install irrigation                                         │
│                                                                  │
│  Notes: _____________________________________________           │
│        _____________________________________________           │
│                                                                  │
│  [Cancel]                             [Save Activity]           │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Add New Crop Button
```
┌──────────────────────────────────┐
│     [+ Add New Crop Cycle]       │
└──────────────────────────────────┘
```

## View Mode Options

### Month View
Shows a detailed month-by-month breakdown with daily granularity:
```
┌──────────────────────────────────────────────────────────────────┐
│                        March 2025                                 │
├────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┤
│Field│ 1 │ 5 │ 10 │ 15 │ 20 │ 25 │ 30 │                          │
├────┼────┴────┴────┴────┴────┴────┴────┴──────────────────────────┤
│North│  [Prep]  │░░░░░Planting░░░░░│                              │
│South│  ░░░░Growing░░░░│   [Harvest]  │                          │
└────┴──────────────────┴──────────────┴──────────────────────────┘
```

### Year View
Compact overview showing all 12 months:
```
┌──────────────────────────────────────────────────────────────────┐
│ Field    │J│F│M│A│M│J│J│A│S│O│N│D│ Crop                         │
├──────────┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼──────────────────────────────┤
│ North    │ │ │░│█│█│█│█│H│ │░│█│ │ Tomatoes (Spring) → Kale    │
│ South    │█│H│░│█│█│H│░│█│█│H│ │ │ Lettuce → Cukes → Spinach  │
└──────────┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴──────────────────────────────┘
```

## Mobile Responsiveness

### Mobile Layout (< 768px)
```
┌───────────────────────────┐
│ ☰  Crop Calendar   🔍 👤 │
├───────────────────────────┤
│ ◀  March 2025  ▶         │
│                           │
│ [All Fields ▾] [Filter]  │
├───────────────────────────┤
│ North Field               │
│ ┌───────────────────────┐ │
│ │ Tomatoes              │ │
│ │ 🌱 Mar 15 → 🍅 Jun 20 │ │
│ │ [View Details]        │ │
│ └───────────────────────┘ │
│                           │
│ ┌───────────────────────┐ │
│ │ Peppers               │ │
│ │ 🌱 Apr 1 → 🍅 Jul 15  │ │
│ │ [View Details]        │ │
│ └───────────────────────┘ │
├───────────────────────────┤
│ South Field               │
│ ...                       │
└───────────────────────────┘
```

## Key Features

### 1. Drag and Drop Planning
- Drag new crops from a sidebar palette onto fields
- Adjust timing by dragging timeline bars
- Visual feedback for conflicts or optimal planting windows

### 2. Weather Integration
- Display frost dates as vertical lines
- Show optimal planting windows based on historical weather
- Weather forecast overlay (7-day, 30-day)

### 3. Succession Planting
- Automatically suggest follow-up crops
- Show available field windows after harvest
- Calculate optimal succession intervals

### 4. Conflict Detection
```
┌─────────────────────────────────────────┐
│ ⚠️ Planning Conflict Detected           │
│                                          │
│ Tomatoes and Peppers overlap in         │
│ North Field from April 15-30             │
│                                          │
│ [Adjust Dates] [Change Field] [Ignore]  │
└─────────────────────────────────────────┘
```

### 5. Export and Print
```
[Export Options ▾]
  - Export to PDF (printable wall calendar)
  - Export to CSV (for spreadsheet analysis)
  - Export to iCal (for calendar apps)
  - Share with team members
```

## Sidebar Panel (Optional)

### Crop Library Quick Access
```
┌─────────────────────────────┐
│ Crop Library                │
├─────────────────────────────┤
│ 🔍 Search crops...          │
├─────────────────────────────┤
│ Common Crops:               │
│  🍅 Tomatoes                │
│  🥬 Lettuce                 │
│  🥒 Cucumbers               │
│  🌶️ Peppers                │
│  🥕 Carrots                 │
│  🌽 Corn                    │
│                             │
│ [View All Crops →]          │
│                             │
│ Templates:                  │
│  📋 Spring Garden           │
│  📋 Summer Harvest          │
│  📋 Fall Succession         │
└─────────────────────────────┘
```

## Data Visualization

### Summary Statistics Panel
```
┌─────────────────────────────────────────────────────────────────┐
│ 2025 Season Overview                                             │
├─────────────────────────────────────────────────────────────────┤
│  Total Crops Planned: 24                                        │
│  Fields in Use: 8 of 10                                         │
│  Estimated Labor Hours: 1,250                                   │
│  Peak Season: June - August                                     │
│                                                                  │
│  Crop Diversity Index: ████████░░ 82%                          │
│  Field Utilization:    ██████████ 95%                          │
└─────────────────────────────────────────────────────────────────┘
```

## Accessibility Features

1. **Keyboard Navigation**
   - Tab through timeline bars
   - Arrow keys to adjust dates
   - Enter to open detail modal
   - Escape to close modals

2. **Screen Reader Support**
   - ARIA labels for all interactive elements
   - Semantic HTML structure
   - Text alternatives for color coding

3. **High Contrast Mode**
   - Alternative color schemes
   - Pattern fills in addition to colors

## Technical Notes

### State Management
- Selected date range
- Active filters (field, crop, activity type)
- View mode (month, season, year)
- Zoom level
- Selected crop for editing

### API Endpoints Needed
- `GET /api/crops/calendar?year=2025&field=all`
- `POST /api/crops/cycles` - Create new crop cycle
- `PUT /api/crops/cycles/:id` - Update cycle timing
- `DELETE /api/crops/cycles/:id` - Remove crop cycle

### Performance Considerations
- Lazy load crop data for year view
- Virtualize long lists in month view
- Cache weather data
- Debounce drag operations

## Future Enhancements

1. Multi-year planning view
2. Crop rotation rule enforcement
3. Soil health tracking integration
4. Pest/disease prediction overlays
5. Automated succession planting suggestions
6. Integration with seed inventory
7. Labor scheduling coordination
8. Harvest yield predictions
