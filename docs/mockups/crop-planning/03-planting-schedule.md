# Planting Schedule Mockup

## Overview
The Planting Schedule provides a detailed, actionable timeline for all planting activities, including seed starting, transplanting, direct seeding, and succession planting. It integrates with worker scheduling and weather forecasts to optimize planting timing.

## Layout Structure

### Top Navigation Bar
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Farm Commons          [Crop Planning > Planting Schedule]  👤 User  ☰   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Main Controls
```
┌─────────────────────────────────────────────────────────────────────────┐
│  Planting Schedule - Spring 2025                                         │
│  ┌────────────────┐  ┌──────────────────┐  ┌────────────────────┐      │
│  │ ◀ Previous     │  │   March 2025      │  │        Next ▶     │      │
│  └────────────────┘  └──────────────────┘  └────────────────────┘      │
│                                                                           │
│  View: (•) Weekly  ( ) Daily  ( ) Monthly     Season: [Spring ▾]        │
│  Show: ☑ Seed Starting  ☑ Transplanting  ☑ Direct Seeding              │
│         ☑ Weather Forecast  ☑ Frost Warnings                            │
└─────────────────────────────────────────────────────────────────────────┘
```

## Weekly View (Default)

### Weekly Planting Schedule
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Week of March 10-16, 2025                    Last Frost: ~April 15   [+ Task]   │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│ Monday, March 10      ☀️ 65°F / 45°F    🌧️ 20% chance                          │
│ ┌──────────────────────────────────────────────────────────────────────┐        │
│ │ 🌱 SEED STARTING (Indoor)                                             │        │
│ │ ├─ Tomatoes (Early Girl) - 72-cell trays       [✓ Complete] [Edit]  │        │
│ │ │  Qty: 150 plants  |  Location: Greenhouse  |  Workers: 2 needed   │        │
│ │ │  Transplant date: April 20 (6 weeks)                               │        │
│ │ ├─ Peppers (Bell) - 50-cell trays               [In Progress] [Edit] │        │
│ │ │  Qty: 100 plants  |  Location: Greenhouse  |  Workers: 1 assigned │        │
│ │ └─ Basil (Sweet) - 72-cell trays                [Scheduled] [Edit]   │        │
│ │    Qty: 50 plants   |  Location: Greenhouse  |  Workers: Not assigned│        │
│ └──────────────────────────────────────────────────────────────────────┘        │
│                                                                                   │
│ Tuesday, March 11     ☁️ 58°F / 42°F    🌧️ 60% chance                          │
│ ┌──────────────────────────────────────────────────────────────────────┐        │
│ │ ⚠️ Not recommended for outdoor planting (rain expected)              │        │
│ │                                                                        │        │
│ │ 🏠 INDOOR TASKS                                                        │        │
│ │ ├─ Check germination - Lettuce seeds (Day 5)    [Scheduled] [Edit]  │        │
│ │ └─ Water seed trays - All crops                 [Daily] [Edit]       │        │
│ └──────────────────────────────────────────────────────────────────────┘        │
│                                                                                   │
│ Wednesday, March 12   🌤️ 62°F / 44°F    🌧️ 10% chance                          │
│ ┌──────────────────────────────────────────────────────────────────────┐        │
│ │ 🌱 DIRECT SEEDING                                                     │        │
│ │ ├─ Peas (Sugar Snap) - South Field Rows 1-4    [Scheduled] [Edit]   │        │
│ │ │  Qty: 200 ft row  |  Depth: 1"  |  Spacing: 2"  |  Workers: 3     │        │
│ │ │  Harvest: ~May 25 (75 days)  |  Succession: Plant again Mar 26    │        │
│ │ ├─ Spinach (Bloomsdale) - East Field            [Scheduled] [Edit]   │        │
│ │ │  Qty: 50 ft row   |  Depth: 0.5"  |  Spacing: 3"  |  Workers: 2   │        │
│ │ └─ Lettuce (Mixed) - North Field Bed 1-2        [Scheduled] [Edit]   │        │
│ │    Qty: 2 beds      |  Depth: 0.25"  |  Spacing: 6"  |  Workers: 2  │        │
│ └──────────────────────────────────────────────────────────────────────┘        │
│                                                                                   │
│ Thursday, March 13    ☀️ 68°F / 46°F    🌧️ 0% chance  ⭐ IDEAL DAY            │
│ ┌──────────────────────────────────────────────────────────────────────┐        │
│ │ 🌱 DIRECT SEEDING                                                     │        │
│ │ ├─ Carrots (Nantes) - West Field Rows 1-5      [Scheduled] [Edit]   │        │
│ │ │  Qty: 250 ft row  |  Depth: 0.25"  |  Spacing: 1"  |  Workers: 3  │        │
│ │ │  Harvest: ~June 15 (70 days)  |  Notes: Thin to 2" after sprout  │        │
│ │ ├─ Radishes (Cherry Belle) - Intercrop w/ Carrots [Scheduled] [Edit]│        │
│ │ │  Qty: Same rows   |  Depth: 0.5"  |  Spacing: 1"  |  Workers: +1  │        │
│ │ │  Harvest: ~April 15 (30 days)  |  Notes: Harvest before carrots   │        │
│ │ └─ Arugula - North Field Bed 3                  [Scheduled] [Edit]   │        │
│ │    Qty: 1 bed       |  Depth: 0.25"  |  Spacing: 3"  |  Workers: 1  │        │
│ └──────────────────────────────────────────────────────────────────────┘        │
│                                                                                   │
│ Friday, March 14      ☀️ 70°F / 48°F    🌧️ 5% chance                           │
│ ┌──────────────────────────────────────────────────────────────────────┐        │
│ │ 🌱 SEED STARTING (Indoor)                                             │        │
│ │ ├─ Cucumbers (Marketmore) - 50-cell trays      [Scheduled] [Edit]   │        │
│ │ │  Qty: 60 plants   |  Location: Greenhouse  |  Workers: 1 needed   │        │
│ │ │  Transplant date: April 28 (4 weeks)                               │        │
│ │ └─ Squash (Zucchini) - 50-cell trays            [Scheduled] [Edit]   │        │
│ │    Qty: 40 plants   |  Location: Greenhouse  |  Workers: 1 needed   │        │
│ │                                                                        │        │
│ │ 🌱 DIRECT SEEDING                                                     │        │
│ │ └─ Kale (Lacinato) - South Field                [Scheduled] [Edit]   │        │
│ │    Qty: 50 ft row   |  Depth: 0.5"  |  Spacing: 12"  |  Workers: 2  │        │
│ └──────────────────────────────────────────────────────────────────────┘        │
│                                                                                   │
│ Saturday, March 15    ⛅ 66°F / 47°F    🌧️ 15% chance                          │
│ ┌──────────────────────────────────────────────────────────────────────┐        │
│ │ 🏠 MAINTENANCE & PREP                                                 │        │
│ │ ├─ Harden off tomato seedlings (started Feb 24) [Scheduled] [Edit]  │        │
│ │ │  Duration: 1 week  |  Method: Gradually increase outdoor exposure  │        │
│ │ ├─ Prepare beds for next week's planting        [Scheduled] [Edit]   │        │
│ │ │  Tasks: Till, amend soil, rake beds  |  Workers: 4 needed         │        │
│ │ └─ Check greenhouse temperature/humidity         [Daily] [Edit]      │        │
│ └──────────────────────────────────────────────────────────────────────┘        │
│                                                                                   │
│ Sunday, March 16      ☀️ 71°F / 49°F    🌧️ 0% chance                           │
│ ┌──────────────────────────────────────────────────────────────────────┐        │
│ │ 📅 PLANNING DAY                                                        │        │
│ │ ├─ Review next week's schedule                   [Scheduled] [Edit]  │        │
│ │ ├─ Order seeds for late spring planting          [Scheduled] [Edit]  │        │
│ │ └─ Inventory seed starting supplies              [Scheduled] [Edit]  │        │
│ └──────────────────────────────────────────────────────────────────────┘        │
│                                                                                   │
│ 📊 Week Summary: 12 planting tasks scheduled  |  18 workers needed             │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Task Detail Modal

### Click on Any Task to View/Edit Details
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Planting Task Details                                     [✕ Close]     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Task Type:      [Direct Seeding ▾]                                      │
│  Crop:           [Peas - Sugar Snap ▾]                                   │
│  Field/Location: [South Field, Rows 1-4 ▾]                               │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Planting Information                                             │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │ Scheduled Date:    [March 12, 2025]  📅                         │    │
│  │ Backup Date:       [March 14, 2025]  (if weather delays)        │    │
│  │                                                                   │    │
│  │ Seed Information:                                                │    │
│  │   Variety:         Sugar Snap Pea                                │    │
│  │   Seed Lot:        #2025-PS-001                                 │    │
│  │   Germination:     92% (tested Feb 2025)                         │    │
│  │   Available:       500 seeds in inventory ✓                     │    │
│  │                                                                   │    │
│  │ Planting Specs:                                                  │    │
│  │   Row Length:      [200] feet                                    │    │
│  │   Depth:           [1.0] inches                                  │    │
│  │   Spacing:         [2] inches (in-row)                          │    │
│  │   Row Spacing:     [18] inches                                   │    │
│  │   Seeds Needed:    ~1,200 seeds (calculated)                    │    │
│  │                                                                   │    │
│  │ Growing Information:                                             │    │
│  │   Days to Germination:  7-14 days                               │    │
│  │   Days to Maturity:     75 days                                 │    │
│  │   Expected Harvest:     May 25 - June 10, 2025                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Succession Planting                                              │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │ ☑ Enable succession planting                                    │    │
│  │                                                                   │    │
│  │ Interval:          [14] days                                     │    │
│  │ Number of plantings: [3] (Mar 12, Mar 26, Apr 9)                │    │
│  │                                                                   │    │
│  │ 📊 Succession Timeline:                                          │    │
│  │   Planting 1: Mar 12 → Harvest May 25-Jun 10                    │    │
│  │   Planting 2: Mar 26 → Harvest Jun 8-Jun 24                     │    │
│  │   Planting 3: Apr 9  → Harvest Jun 22-Jul 8                     │    │
│  │                                                                   │    │
│  │ [Auto-create succession tasks]                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Labor Assignment                                                 │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │ Workers Needed:    [3]                                           │    │
│  │ Estimated Time:    2.5 hours                                     │    │
│  │ Skill Level:       Basic                                         │    │
│  │                                                                   │    │
│  │ Assigned Workers:                                                │    │
│  │   • Maria Garcia     (Lead)        [✓ Assigned]                 │    │
│  │   • Juan Martinez                  [✓ Assigned]                 │    │
│  │   • [+ Assign Worker]              [Not assigned]               │    │
│  │                                                                   │    │
│  │ [Link to Worker Schedule]                                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Preparation Checklist                                            │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │ Before Planting:                                                 │    │
│  │   ☑ Bed prepared and raked                                      │    │
│  │   ☑ Compost added (1" layer)                                    │    │
│  │   ☐ Irrigation lines installed/tested                           │    │
│  │   ☐ Row markers placed                                          │    │
│  │   ☐ Seeds counted and ready                                     │    │
│  │   ☐ Tools gathered (hoe, rake, string line)                     │    │
│  │                                                                   │    │
│  │ [+ Add checklist item]                                           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Weather Considerations                                           │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │ Forecast for March 12:                                           │    │
│  │   High: 62°F  |  Low: 44°F  |  Rain: 10% ✓ Good                │    │
│  │   Soil Temp: 52°F ✓ (Optimal: 45-75°F for peas)                │    │
│  │   Wind: 5-10 mph ✓                                              │    │
│  │                                                                   │    │
│  │ ⚠️ Frost Warning: None (Last frost ~April 15)                   │    │
│  │ ✓ Conditions favorable for planting                             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  Notes & Instructions                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • Use string line for straight rows                              │    │
│  │ • Pre-soak pea seeds for 12-24 hours before planting            │    │
│  │ • Consider using pea inoculant for nitrogen fixation            │    │
│  │ • Install trellis within 2 weeks of planting                     │    │
│  │ • Water immediately after planting                               │    │
│  │ _____________________________________________________________    │    │
│  │ _____________________________________________________________    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  [Cancel]  [Mark as Complete]  [Save & Create Worker Schedule]          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Calendar View

### Monthly Calendar with Planting Tasks
```
┌──────────────────────────────────────────────────────────────────────────┐
│                          March 2025                         [Print]      │
├────────┬────────┬────────┬────────┬────────┬────────┬────────────────────┤
│  Sun   │  Mon   │  Tue   │  Wed   │  Thu   │  Fri   │  Sat              │
├────────┼────────┼────────┼────────┼────────┼────────┼────────────────────┤
│        │        │        │        │        │   1    │   2               │
│        │        │        │        │        │ 🌱 x2  │ 🌱 x1             │
├────────┼────────┼────────┼────────┼────────┼────────┼────────────────────┤
│   3    │   4    │   5    │   6    │   7    │   8    │   9               │
│        │ 🌱 x2  │ 🌱 x1  │ 🌱 x3  │ 🌱 x1  │ 🏠 x2  │                   │
│        │        │        │ ⛅     │ ☀️     │ ☁️     │                   │
├────────┼────────┼────────┼────────┼────────┼────────┼────────────────────┤
│  10    │  11    │  12    │  13    │  14    │  15    │  16               │
│ 🌱 x2  │ 🏠 x2  │ 🌱 x3  │ 🌱 x5  │ 🌱 x4  │ 🏠 x3  │ 📅                │
│ ☀️     │ 🌧️     │ 🌤️     │ ☀️⭐   │ ☀️     │ ⛅     │ ☀️                │
├────────┼────────┼────────┼────────┼────────┼────────┼────────────────────┤
│  17    │  18    │  19    │  20    │  21    │  22    │  23               │
│        │ 🌱 x1  │ 🌱 x2  │ 🌱 x3  │ 🏠 x1  │ 🌱 x4  │                   │
│        │ 🌿 x2  │        │        │        │        │                   │
├────────┼────────┼────────┼────────┼────────┼────────┼────────────────────┤
│  24    │  25    │  26    │  27    │  28    │  29    │  30               │
│        │ 🌱 x2  │ 🌱 x3  │ 🏠 x2  │ 🌱 x1  │ 🌱 x2  │                   │
│        │        │ 🌿 x1  │        │        │        │                   │
├────────┼────────┼────────┼────────┼────────┼────────┼────────────────────┤
│  31    │        │        │        │        │        │                   │
│ 🌱 x1  │        │        │        │        │        │                   │
└────────┴────────┴────────┴────────┴────────┴────────┴────────────────────┘

Legend:
🌱 = Direct seeding task
🌿 = Transplanting task
🏠 = Indoor/greenhouse task
☀️ = Sunny    ⛅ = Partly cloudy    ☁️ = Cloudy    🌧️ = Rain
⭐ = Ideal planting day
```

## Seasonal Planning Dashboard

### Season Overview
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Spring 2025 Planting Overview                              [Export]     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Season Progress:  ████████░░░░░░░░░░ 40% Complete                      │
│  Tasks Completed:  24 of 60                                              │
│  Days Until Last Frost:  18 days (April 15)                             │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ Planting Breakdown by Type                                    │       │
│  ├──────────────────────────────────────────────────────────────┤       │
│  │                                                               │       │
│  │  Direct Seeding:      ████████████ 45 tasks (75% complete)   │       │
│  │  Seed Starting:       ████████░░░░ 30 tasks (60% complete)   │       │
│  │  Transplanting:       ██████░░░░░░ 25 tasks (35% complete)   │       │
│  │                                                               │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ Upcoming Critical Tasks (Next 7 Days)                         │       │
│  ├──────────────────────────────────────────────────────────────┤       │
│  │                                                               │       │
│  │  Mar 28: Transplant tomatoes (150 plants) - Weather ✓       │       │
│  │  Mar 29: Start cucumber seeds (60 plants)                    │       │
│  │  Mar 30: Direct seed carrots succession #2                   │       │
│  │  Apr 1:  Transplant peppers (100 plants) - Weather ⚠️       │       │
│  │  Apr 2:  Direct seed beans - Wait for warmer soil            │       │
│  │                                                               │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ Resource Summary                                              │       │
│  ├──────────────────────────────────────────────────────────────┤       │
│  │                                                               │       │
│  │  Total Seeds Needed:     ~15,000 seeds                       │       │
│  │  Seeds in Inventory:     ✓ Sufficient for season            │       │
│  │  Seed Trays Needed:      45 trays (32 available)  ⚠️        │       │
│  │  Potting Mix:            15 cubic ft (10 available)  ⚠️     │       │
│  │  Labor Hours (Est.):     180 hours total, 45 remaining       │       │
│  │                                                               │       │
│  │  [Order Supplies]                                             │       │
│  │                                                               │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Succession Planting Manager

### Automated Succession Planning
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Succession Planting Manager                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Active Succession Series:                                               │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Lettuce - Mixed Varieties (South Field, Bed 1)                  │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                   │    │
│  │  Interval: Every 10 days  |  Total Plantings: 8                 │    │
│  │  Duration: Mar 1 - May 15, 2025                                 │    │
│  │                                                                   │    │
│  │  Timeline:                                                        │    │
│  │  Mar 1  ✓ Planted → ✓ Germinated → 🌱 Growing → Harvest Apr 10 │    │
│  │  Mar 11 ✓ Planted → ✓ Germinated → 🌱 Growing → Harvest Apr 20 │    │
│  │  Mar 21 ✓ Planted → 🌱 Germinating                              │    │
│  │  Mar 31 📅 Scheduled                                             │    │
│  │  Apr 10 📅 Scheduled                                             │    │
│  │  Apr 20 📅 Scheduled                                             │    │
│  │  Apr 30 📅 Scheduled                                             │    │
│  │  May 10 📅 Scheduled                                             │    │
│  │                                                                   │    │
│  │  [Edit Series]  [Pause]  [Complete]                             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Peas - Sugar Snap (South Field, Rows 1-4)                       │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                   │    │
│  │  Interval: Every 14 days  |  Total Plantings: 3                 │    │
│  │  Duration: Mar 12 - Apr 9, 2025                                 │    │
│  │                                                                   │    │
│  │  Timeline:                                                        │    │
│  │  Mar 12 ✓ Planted → 🌱 Germinating                              │    │
│  │  Mar 26 📅 Scheduled                                             │    │
│  │  Apr 9  📅 Scheduled                                             │    │
│  │                                                                   │    │
│  │  [Edit Series]  [Pause]  [Complete]                             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  [+ Create New Succession Series]                                        │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Seed Inventory Integration

### Seed Inventory Status
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Seed Inventory for Scheduled Plantings                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Next 30 Days Seed Requirements:                                         │
│                                                                           │
│  ┌──────────────────┬────────────┬─────────────┬────────────────────┐   │
│  │ Crop             │  Needed    │  Available  │  Status           │   │
│  ├──────────────────┼────────────┼─────────────┼────────────────────┤   │
│  │ Tomatoes (Early) │ 150 seeds  │ 200 seeds   │ ✓ Sufficient      │   │
│  │ Peppers (Bell)   │ 100 seeds  │ 120 seeds   │ ✓ Sufficient      │   │
│  │ Peas (Sugar Snap)│ 1,200      │ 500 seeds   │ ⚠️ Order needed   │   │
│  │ Lettuce (Mixed)  │ 800 seeds  │ 1,500 seeds │ ✓ Sufficient      │   │
│  │ Carrots (Nantes) │ 2,500      │ 600 seeds   │ ❌ Urgent - Order │   │
│  │ Basil (Sweet)    │ 50 seeds   │ 80 seeds    │ ✓ Sufficient      │   │
│  │ Cucumbers        │ 60 seeds   │ 35 seeds    │ ⚠️ Order needed   │   │
│  └──────────────────┴────────────┴─────────────┴────────────────────┘   │
│                                                                           │
│  [Generate Shopping List]  [Mark as Ordered]  [Update Inventory]        │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Mobile View

### Mobile Planting Schedule
```
┌──────────────────────────┐
│ ☰  Planting  📅  Mar 12  │
├──────────────────────────┤
│ ☀️ 62°F  🌧️ 10%  ⭐      │
│                          │
│ Today's Tasks (3)        │
│                          │
│ ┌──────────────────────┐ │
│ │ 🌱 Direct Seed       │ │
│ │ Peas - Sugar Snap    │ │
│ │ South Field, Row 1-4 │ │
│ │                      │ │
│ │ 👥 3 workers needed  │ │
│ │ ⏱️ 2.5 hours         │ │
│ │                      │ │
│ │ [View Details]       │ │
│ │ [✓ Mark Complete]    │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ 🌱 Direct Seed       │ │
│ │ Spinach - Bloomsdale │ │
│ │ East Field           │ │
│ │                      │ │
│ │ 👥 2 workers needed  │ │
│ │ ⏱️ 1.5 hours         │ │
│ │                      │ │
│ │ [View Details]       │ │
│ │ [✓ Mark Complete]    │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ 🌱 Direct Seed       │ │
│ │ Lettuce - Mixed      │ │
│ │ North Field, Bed 1-2 │ │
│ │                      │ │
│ │ 👥 2 workers needed  │ │
│ │ ⏱️ 1 hour            │ │
│ │                      │ │
│ │ [View Details]       │ │
│ │ [✓ Mark Complete]    │ │
│ └──────────────────────┘ │
│                          │
│ [+ Add Task]             │
│ [View Week]              │
└──────────────────────────┘
```

## Smart Features

### Weather-Aware Scheduling
```
┌─────────────────────────────────────────────────────────────────┐
│ 🌤️ Weather Alert                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ⚠️ Heavy rain expected Thursday-Friday (March 13-14)           │
│                                                                  │
│  Suggested Actions:                                             │
│  • Move 3 outdoor planting tasks to Wednesday                   │
│  • Delay 2 tasks until Saturday                                 │
│  • Focus on indoor seed starting during rain                    │
│                                                                  │
│  [Auto-Reschedule]  [Review Changes]  [Dismiss]                │
└─────────────────────────────────────────────────────────────────┘
```

### Planting Window Optimizer
```
┌─────────────────────────────────────────────────────────────────┐
│ 💡 Optimal Planting Window                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Crop: Tomatoes (transplant)                                    │
│                                                                  │
│  ✓ Best Window: April 20-25                                     │
│    • 5+ days after last expected frost                          │
│    • Soil temperature optimal (>60°F)                           │
│    • Extended warm forecast                                     │
│    • Moon phase favorable for fruiting crops                    │
│                                                                  │
│  ⚠️ Acceptable: April 15-19                                     │
│    • Risk of late frost (10% chance)                            │
│    • Consider row covers                                        │
│                                                                  │
│  [Schedule in Best Window]  [View Forecast]                     │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features Summary

1. **Detailed Task Management**
   - Seed starting, direct seeding, transplanting
   - Succession planting automation
   - Worker assignment integration
   - Preparation checklists

2. **Weather Integration**
   - Daily forecasts
   - Frost warnings
   - Soil temperature monitoring
   - Automatic rescheduling suggestions

3. **Resource Management**
   - Seed inventory tracking
   - Supply needs calculation
   - Labor hour estimation
   - Equipment requirements

4. **Smart Planning**
   - Optimal planting window detection
   - Succession series automation
   - Weather-aware scheduling
   - Resource alerts

## API Endpoints Required

```
GET    /api/planting/schedule?start=2025-03-01&end=2025-03-31
GET    /api/planting/tasks/:id
POST   /api/planting/tasks
PUT    /api/planting/tasks/:id
DELETE /api/planting/tasks/:id
POST   /api/planting/succession-series
GET    /api/seeds/inventory
PUT    /api/seeds/inventory/:id
GET    /api/weather/forecast?location=...
GET    /api/planting/optimal-windows/:cropId
```

## Future Enhancements

1. Lunar planting calendar integration
2. Companion planting suggestions
3. Photo documentation of plantings
4. QR code labels for seed trays
5. Voice-activated task updates
6. Integration with seed ordering systems
7. Germination rate tracking
8. Automatic variety recommendations
9. Climate zone-specific timing
10. Multi-farm collaboration features
