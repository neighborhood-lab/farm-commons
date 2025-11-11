# Harvest Tracking Mockup

## Overview
The Harvest Tracking system provides comprehensive tools for recording, analyzing, and predicting harvest yields. It helps farmers optimize timing, allocate labor efficiently, track product quality, and plan sales. The system integrates with planting records to provide yield analytics and improve future planning.

## Layout Structure

### Top Navigation Bar
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Farm Commons         [Crop Planning > Harvest Tracking]  👤 User   ☰    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Main Controls
```
┌─────────────────────────────────────────────────────────────────────────┐
│  Harvest Tracking - June 2025                                            │
│  ┌────────────────┐  ┌──────────────────┐  ┌────────────────────┐      │
│  │ ◀ Previous     │  │   This Week       │  │        Next ▶     │      │
│  └────────────────┘  └──────────────────┘  └────────────────────┘      │
│                                                                           │
│  View: (•) Active Harvests  ( ) Scheduled  ( ) Completed  ( ) Analytics │
│  Filter: [All Fields ▾]  [All Crops ▾]  Season: [Summer 2025 ▾]        │
└─────────────────────────────────────────────────────────────────────────┘
```

## Active Harvests Dashboard

### Current Harvest Overview
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Active Harvests - Week of June 15-21, 2025                  [+ Log Harvest]     │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│ ┌─────────────────────────────────────────────────────────────────────┐         │
│ │ 🍅 TOMATOES - Cherry (North Field)                        🔴 Peak   │         │
│ │ ─────────────────────────────────────────────────────────────────── │         │
│ │                                                                      │         │
│ │ Planted: April 20, 2025  |  First Harvest: June 10  |  Day 56      │         │
│ │ Expected Maturity: 60-70 days ✓ On schedule                        │         │
│ │                                                                      │         │
│ │ Harvest Progress:                                                    │         │
│ │ Week 1 (Jun 10-14):  52 lbs    ████░░░░░░░░░░░░░░░░                │         │
│ │ Week 2 (Jun 15-21):  124 lbs   ████████████░░░░░░░░  (Current)     │         │
│ │ Expected Total:      ~800 lbs                                       │         │
│ │                                                                      │         │
│ │ This Week's Details:                                                 │         │
│ │  Mon 6/15: 18 lbs  [View] │ Thu 6/18: 22 lbs  [View]               │         │
│ │  Tue 6/16: 20 lbs  [View] │ Fri 6/19: 24 lbs  [View]               │         │
│ │  Wed 6/17: 19 lbs  [View] │ Sat 6/20: 21 lbs  [View]               │         │
│ │                           │ Sun 6/21: [Schedule]                    │         │
│ │                                                                      │         │
│ │ Labor Stats: 18.5 hours  |  Avg: 6.7 lbs/hour  |  Workers: 3-4     │         │
│ │ Quality: ⭐⭐⭐⭐⭐ 95% Grade A  |  5% Grade B                      │         │
│ │                                                                      │         │
│ │ 💡 Forecast: Peak harvest continues for 2-3 more weeks              │         │
│ │ ⚠️ Note: Schedule extra workers for Monday-Wednesday peak days      │         │
│ │                                                                      │         │
│ │ [Log Today's Harvest]  [Schedule Workers]  [View Full Details]      │         │
│ └─────────────────────────────────────────────────────────────────────┘         │
│                                                                                   │
│ ┌─────────────────────────────────────────────────────────────────────┐         │
│ │ 🥒 CUCUMBERS - Marketmore (South Field)               🟢 Starting   │         │
│ │ ─────────────────────────────────────────────────────────────────── │         │
│ │                                                                      │         │
│ │ Planted: May 1, 2025  |  First Harvest: June 18  |  Day 48         │         │
│ │ Expected Maturity: 50-60 days ✓ On schedule                        │         │
│ │                                                                      │         │
│ │ Harvest Progress:                                                    │         │
│ │ Week 1 (Jun 18-21):  8 lbs     ██░░░░░░░░░░░░░░░░░░  (Starting)    │         │
│ │ Expected Total:      ~400 lbs                                       │         │
│ │                                                                      │         │
│ │ This Week's Details:                                                 │         │
│ │  Thu 6/18: 3 lbs   [View]  │ Sat 6/20: 5 lbs   [View]              │         │
│ │  Fri 6/19: [Skipped]       │ Sun 6/21: [Schedule]                  │         │
│ │                                                                      │         │
│ │ Quality: ⭐⭐⭐⭐⭐ 100% Grade A                                     │         │
│ │                                                                      │         │
│ │ 💡 Tip: Harvest daily starting next week to maintain quality        │         │
│ │                                                                      │         │
│ │ [Log Today's Harvest]  [Schedule Workers]  [View Full Details]      │         │
│ └─────────────────────────────────────────────────────────────────────┘         │
│                                                                                   │
│ ┌─────────────────────────────────────────────────────────────────────┐         │
│ │ 🌿 PEAS - Sugar Snap (South Field)                    🟡 Finishing  │         │
│ │ ─────────────────────────────────────────────────────────────────── │         │
│ │                                                                      │         │
│ │ Planted: March 12, 2025  |  First Harvest: May 25  |  Day 95       │         │
│ │ Expected Maturity: 75 days ✓ Extended season                       │         │
│ │                                                                      │         │
│ │ Harvest Progress:                                                    │         │
│ │ Total Harvested:     78 lbs    ████████████████████  98% Complete   │         │
│ │ Expected Total:      ~80 lbs                                        │         │
│ │                                                                      │         │
│ │ Season Summary (May 25 - Jun 20):                                   │         │
│ │  Week 1: 24 lbs  │  Week 2: 28 lbs  │  Week 3: 18 lbs  │  Week 4: 8 lbs      │
│ │                                                                      │         │
│ │ Quality: ⭐⭐⭐⭐ 85% Grade A  |  15% overripe                       │         │
│ │                                                                      │         │
│ │ 💡 Final harvest expected this week, then clear field for succession │         │
│ │ ✓ Good season, consider planting 20% more next year                 │         │
│ │                                                                      │         │
│ │ [Log Final Harvest]  [Mark Complete]  [View Full Details]           │         │
│ └─────────────────────────────────────────────────────────────────────┘         │
│                                                                                   │
│ 📊 Week Summary: 3 active harvests  |  Total: 132 lbs this week (Mon-Sat)      │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Harvest Entry Modal

### Log Harvest Details
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Log Harvest Entry                                         [✕ Close]     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Harvest Date & Time                                                     │
│  ┌───────────────────────────────────────────────────────────────┐      │
│  │ Date:           [June 21, 2025]  📅                           │      │
│  │ Start Time:     [08:00 AM]       🕐                           │      │
│  │ End Time:       [11:30 AM]       🕐                           │      │
│  │ Duration:       3.5 hours (auto-calculated)                   │      │
│  └───────────────────────────────────────────────────────────────┘      │
│                                                                           │
│  Crop & Location                                                         │
│  ┌───────────────────────────────────────────────────────────────┐      │
│  │ Field:          [North Field ▾]                               │      │
│  │ Crop:           [Tomatoes - Cherry ▾]                         │      │
│  │ Variety:        Sweet 100 (auto-filled)                       │      │
│  │ Planting Date:  April 20, 2025 (auto-filled)                 │      │
│  │ Specific Area:  [Rows 1-5] (optional)                         │      │
│  └───────────────────────────────────────────────────────────────┘      │
│                                                                           │
│  Quantity Harvested                                                      │
│  ┌───────────────────────────────────────────────────────────────┐      │
│  │ Total Weight:   [23.5] lbs                                    │      │
│  │                 or                                             │      │
│  │ By Container:                                                  │      │
│  │   • 5 lb boxes:  [4] boxes = 20 lbs                           │      │
│  │   • 1 lb boxes:  [3] boxes = 3 lbs                            │      │
│  │   • Loose:       [0.5] lbs                                    │      │
│  │   Total:         23.5 lbs ✓                                   │      │
│  │                                                                 │      │
│  │ Alternative Units:                                             │      │
│  │   Bushels: 0.8  |  Pieces: ~470  |  Kg: 10.7                 │      │
│  └───────────────────────────────────────────────────────────────┘      │
│                                                                           │
│  Quality Assessment                                                      │
│  ┌───────────────────────────────────────────────────────────────┐      │
│  │ Grade Distribution:                                            │      │
│  │   Grade A (Premium):  [22] lbs   (94%)  ⭐⭐⭐⭐⭐            │      │
│  │   Grade B (Standard): [1.5] lbs  (6%)   ⭐⭐⭐                │      │
│  │   Grade C (Seconds):  [0] lbs    (0%)   ⭐⭐                  │      │
│  │   Culls (Compost):    [0] lbs    (0%)   ❌                    │      │
│  │                                                                 │      │
│  │ Quality Notes:                                                 │      │
│  │   ☑ Uniform size      ☑ Good color                           │      │
│  │   ☑ Firm texture      ☐ Pest damage                          │      │
│  │   ☐ Disease signs     ☐ Weather damage                       │      │
│  │   ☑ Excellent flavor                                          │      │
│  │                                                                 │      │
│  │ Average Size:  [Medium ▾]  (Small/Medium/Large/XLarge)        │      │
│  │ Brix Level:    [7.2] (optional, for sugar content)            │      │
│  └───────────────────────────────────────────────────────────────┘      │
│                                                                           │
│  Labor & Workers                                                         │
│  ┌───────────────────────────────────────────────────────────────┐      │
│  │ Workers:                                                       │      │
│  │   • Maria Garcia      3.5 hrs  [✓]                            │      │
│  │   • Juan Martinez     3.5 hrs  [✓]                            │      │
│  │   • Ana Rodriguez     3.5 hrs  [✓]                            │      │
│  │   [+ Add Worker]                                               │      │
│  │                                                                 │      │
│  │ Total Labor Hours:    10.5 hours                              │      │
│  │ Productivity:         2.2 lbs/hour per worker                 │      │
│  │                       6.7 lbs/hour total                       │      │
│  │                                                                 │      │
│  │ [Link to Time Entries]                                         │      │
│  └───────────────────────────────────────────────────────────────┘      │
│                                                                           │
│  Destination & Distribution                                              │
│  ┌───────────────────────────────────────────────────────────────┐      │
│  │ ☑ Farm Stand:         [15] lbs    @ $4.50/lb = $67.50        │      │
│  │ ☑ CSA Boxes:          [6] lbs     (12 boxes @ 0.5 lb each)   │      │
│  │ ☑ Farmers Market:     [2.5] lbs   @ $5.00/lb = $12.50        │      │
│  │ ☐ Restaurant:         [0] lbs                                  │      │
│  │ ☐ Wholesale:          [0] lbs                                  │      │
│  │ ☐ Farm Use:           [0] lbs                                  │      │
│  │                                                                 │      │
│  │ Total Allocated:      23.5 lbs ✓ All accounted for           │      │
│  │ Estimated Revenue:    $80.00                                  │      │
│  └───────────────────────────────────────────────────────────────┘      │
│                                                                           │
│  Photos (Optional)                                                       │
│  ┌───────────────────────────────────────────────────────────────┐      │
│  │ [📷 Upload Photo]  [📸 Take Photo]                            │      │
│  │                                                                 │      │
│  │ Uploaded: 2 photos                                             │      │
│  │ [🖼️ IMG_001.jpg]  [🖼️ IMG_002.jpg]                             │      │
│  └───────────────────────────────────────────────────────────────┘      │
│                                                                           │
│  Notes                                                                    │
│  ┌───────────────────────────────────────────────────────────────┐      │
│  │ Beautiful harvest today! Fruits are sweet and firm. Some      │      │
│  │ larger tomatoes showing slight cracking near stem - may need  │      │
│  │ to reduce watering slightly. Overall excellent quality.       │      │
│  │ ____________________________________________________________   │      │
│  └───────────────────────────────────────────────────────────────┘      │
│                                                                           │
│  Weather Conditions (auto-filled)                                        │
│  ┌───────────────────────────────────────────────────────────────┐      │
│  │ Temperature: 72°F  |  Conditions: Sunny  |  Humidity: 65%     │      │
│  │ Recent Rain: None (last 3 days)                               │      │
│  └───────────────────────────────────────────────────────────────┘      │
│                                                                           │
│  [Cancel]  [Save as Draft]  [Save & Create Time Entries]  [Submit]      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Scheduled Harvests

### Upcoming Harvest Calendar
```
┌──────────────────────────────────────────────────────────────────────────┐
│ Scheduled Harvests - Next 14 Days                        [Export PDF]   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ Monday, June 23                                                           │
│ ┌────────────────────────────────────────────────────────────────┐       │
│ │ 🍅 Tomatoes (Cherry) - North Field             [Ready]         │       │
│ │ Expected: 20-25 lbs  |  Workers: 3 needed  |  Time: 3 hrs      │       │
│ │ [Schedule Workers]  [Log Harvest]                              │       │
│ ├────────────────────────────────────────────────────────────────┤       │
│ │ 🥒 Cucumbers - South Field                     [Ready]         │       │
│ │ Expected: 8-12 lbs  |  Workers: 2 needed  |  Time: 1.5 hrs    │       │
│ │ [Schedule Workers]  [Log Harvest]                              │       │
│ └────────────────────────────────────────────────────────────────┘       │
│                                                                            │
│ Tuesday, June 24                                                          │
│ ┌────────────────────────────────────────────────────────────────┐       │
│ │ 🌿 Basil (First Cutting) - Greenhouse         [Ready]         │       │
│ │ Expected: 5 lbs  |  Workers: 1 needed  |  Time: 1 hr          │       │
│ │ [Schedule Workers]  [Log Harvest]                              │       │
│ └────────────────────────────────────────────────────────────────┘       │
│                                                                            │
│ Wednesday, June 25                                                        │
│ ┌────────────────────────────────────────────────────────────────┐       │
│ │ 🍅 Tomatoes (Cherry) - North Field             [Ready]         │       │
│ │ Expected: 22-28 lbs  |  Workers: 3 needed  |  Time: 3.5 hrs   │       │
│ │ ⚠️ Peak day - schedule experienced pickers                    │       │
│ │ [Schedule Workers]  [Log Harvest]                              │       │
│ ├────────────────────────────────────────────────────────────────┤       │
│ │ 🥬 Lettuce (Succession #3) - East Field       [Ready]         │       │
│ │ Expected: 15 lbs  |  Workers: 2 needed  |  Time: 2 hrs        │       │
│ │ [Schedule Workers]  [Log Harvest]                              │       │
│ └────────────────────────────────────────────────────────────────┘       │
│                                                                            │
│ Thursday, June 26 - Friday, June 27                                       │
│ ┌────────────────────────────────────────────────────────────────┐       │
│ │ 🍅 Tomatoes (Cherry) - North Field             [Ready]         │       │
│ │ 🥒 Cucumbers - South Field                     [Ready]         │       │
│ │ [View Details]                                                  │       │
│ └────────────────────────────────────────────────────────────────┘       │
│                                                                            │
│ ⚠️ June 30 - July 2: HEAVY HARVEST PERIOD                                │
│ ┌────────────────────────────────────────────────────────────────┐       │
│ │ Multiple crops reaching peak:                                   │       │
│ │ • Tomatoes (3 varieties)  • Peppers (starting)                 │       │
│ │ • Cucumbers               • Summer Squash (starting)           │       │
│ │ • Beans                                                          │       │
│ │                                                                  │       │
│ │ Estimated: 200+ lbs over 3 days                                │       │
│ │ Workers needed: 8-10 per day                                    │       │
│ │                                                                  │       │
│ │ 💡 Recommend: Increase CSA box size or plan market sale        │       │
│ │ [Schedule Extra Workers]  [Alert Sales Team]                   │       │
│ └────────────────────────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────────────────┘
```

## Analytics Dashboard

### Harvest Analytics & Insights
```
┌──────────────────────────────────────────────────────────────────────────┐
│ Harvest Analytics - Summer 2025 Season                    [Export]       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Season Summary (June 1 - August 31, 2025)                               │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │                                                                 │      │
│  │  Total Harvested:      1,247 lbs   (65% of season complete)   │      │
│  │  Projected Total:      1,900 lbs                               │      │
│  │  Total Revenue:        $6,235                                  │      │
│  │  Projected Revenue:    $9,500                                  │      │
│  │                                                                 │      │
│  │  Active Crops:         8 crops currently harvesting            │      │
│  │  Completed Crops:      4 crops finished                        │      │
│  │  Upcoming (2 weeks):   6 crops starting                        │      │
│  │                                                                 │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                            │
│  Yield by Crop                                                            │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │                                                                 │      │
│  │  🍅 Tomatoes (All):    524 lbs  ████████████████░░░░  82%     │      │
│  │     • Cherry:          298 lbs  (Est: 800 lbs)                 │      │
│  │     • Heirloom:        156 lbs  (Est: 400 lbs)                 │      │
│  │     • Beefsteak:       70 lbs   (Est: 200 lbs)                 │      │
│  │                                                                 │      │
│  │  🥒 Cucumbers:         143 lbs  ████░░░░░░░░░░░░░░  36%       │      │
│  │                                 (Est: 400 lbs)                  │      │
│  │                                                                 │      │
│  │  🥬 Lettuce:           187 lbs  ████████████████████ 100% ✓   │      │
│  │                                 (Complete - matched estimate)  │      │
│  │                                                                 │      │
│  │  🌿 Peas:               78 lbs  ███████████████████░ 98% ✓    │      │
│  │                                 (Final harvest this week)      │      │
│  │                                                                 │      │
│  │  🌶️ Peppers:            24 lbs  ██░░░░░░░░░░░░░░░░  12%       │      │
│  │                                 (Est: 200 lbs - just starting) │      │
│  │                                                                 │      │
│  │  Other (6 crops):      291 lbs  Various stages                 │      │
│  │                                                                 │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                            │
│  Productivity Metrics                                                     │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │                                                                 │      │
│  │  Labor Efficiency:                                             │      │
│  │  ├─ Total Hours:          186 hours                            │      │
│  │  ├─ Avg lbs/hour:         6.7 lbs/hour                         │      │
│  │  ├─ Best Crop:            Lettuce (12.5 lbs/hr)               │      │
│  │  └─ Most Labor-Intensive: Tomatoes (5.2 lbs/hr)               │      │
│  │                                                                 │      │
│  │  Quality Distribution:                                         │      │
│  │  ├─ Grade A (Premium):    92%  ⭐⭐⭐⭐⭐                      │      │
│  │  ├─ Grade B (Standard):   7%   ⭐⭐⭐⭐                        │      │
│  │  └─ Grade C/Culls:        1%   (Excellent!)                   │      │
│  │                                                                 │      │
│  │  Revenue by Channel:                                           │      │
│  │  ├─ CSA Boxes:            $2,845  (46%)                        │      │
│  │  ├─ Farmers Market:       $1,897  (30%)                        │      │
│  │  ├─ Farm Stand:           $1,124  (18%)                        │      │
│  │  └─ Restaurants:          $369    (6%)                         │      │
│  │                                                                 │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                            │
│  Yield Per Square Foot Analysis                                          │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │                                                                 │      │
│  │  North Field (Tomatoes):   0.42 lbs/sq ft   ✓ Above average   │      │
│  │  South Field (Mixed):      0.38 lbs/sq ft   ✓ Good            │      │
│  │  East Field (Greens):      0.51 lbs/sq ft   ✓ Excellent       │      │
│  │  West Field (Root veg):    0.29 lbs/sq ft   ⚠️ Below average  │      │
│  │                                                                 │      │
│  │  Farm Average:             0.39 lbs/sq ft                      │      │
│  │  Industry Average:         0.35 lbs/sq ft   ✓ 11% above       │      │
│  │                                                                 │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                            │
│  Year-over-Year Comparison                                                │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │                    2024        2025        Change               │      │
│  │  ───────────────────────────────────────────────────────────── │      │
│  │  Total Yield:      1,650 lbs  1,900 lbs*  +15% ↗              │      │
│  │  Quality (A+B):    87%        99%         +12pp ↗              │      │
│  │  Revenue:          $7,800     $9,500*     +22% ↗              │      │
│  │  Labor Hours:      245 hrs    186 hrs*    -24% ↗              │      │
│  │  Efficiency:       6.7 lb/hr  10.2 lb/hr* +52% ↗              │      │
│  │                                                                 │      │
│  │  * Projected based on current progress                         │      │
│  │                                                                 │      │
│  │  💡 Key Improvements:                                          │      │
│  │  • Better succession planting reduced waste                    │      │
│  │  • Improved irrigation increased quality                       │      │
│  │  • Worker training improved harvest speed                      │      │
│  │                                                                 │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

## Crop Performance Report

### Individual Crop Analysis
```
┌──────────────────────────────────────────────────────────────────────────┐
│ Crop Performance Report: Tomatoes - Cherry (North Field)  [Export PDF]  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Growing Season Overview                                                  │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │ Variety:           Sweet 100 (Cherry Tomato)                   │      │
│  │ Planted:           April 20, 2025 (150 plants)                 │      │
│  │ First Harvest:     June 10, 2025 (51 days from transplant)     │      │
│  │ Status:            Active (Peak production)                     │      │
│  │ Field/Location:    North Field, Rows 1-10                      │      │
│  │ Square Footage:    800 sq ft                                    │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                            │
│  Harvest Timeline                                                         │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │                                                                 │      │
│  │  Week 1 (Jun 10-14):   52 lbs   ████░░░░░░                    │      │
│  │  Week 2 (Jun 15-21):   124 lbs  ████████░░                    │      │
│  │  Week 3 (Jun 22-28):   Est 145 lbs  ██████████░░  (forecast)  │      │
│  │  Week 4-8:             Est 479 lbs  (peak continues)           │      │
│  │                                                                 │      │
│  │  Total to Date:        176 lbs                                 │      │
│  │  Projected Total:      ~800 lbs                                │      │
│  │  Progress:             22% complete                             │      │
│  │                                                                 │      │
│  │  Expected Season Length: 12-14 weeks (through mid-September)   │      │
│  │                                                                 │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                            │
│  Yield Metrics                                                            │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │ Per Plant:         1.17 lbs/plant (to date)                    │      │
│  │                    5.3 lbs/plant (projected)                    │      │
│  │                                                                 │      │
│  │ Per Sq Ft:         0.22 lbs/sq ft (to date)                    │      │
│  │                    1.0 lbs/sq ft (projected)                    │      │
│  │                                                                 │      │
│  │ Benchmark Comparison:                                          │      │
│  │   Your Farm 2024:   0.85 lbs/sq ft  ↗ +18% improvement       │      │
│  │   Industry Avg:     0.75 lbs/sq ft  ✓ 33% above              │      │
│  │                                                                 │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                            │
│  Quality Analysis                                                         │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │ Overall Quality:   ⭐⭐⭐⭐⭐ 4.8/5.0                           │      │
│  │                                                                 │      │
│  │ Grade Distribution:                                             │      │
│  │   Grade A:  167 lbs (95%)  ████████████████████                │      │
│  │   Grade B:    9 lbs (5%)   █                                   │      │
│  │   Culls:      0 lbs (0%)   (Excellent!)                        │      │
│  │                                                                 │      │
│  │ Common Issues:                                                  │      │
│  │   • Minor cracking (3%)  - Likely water stress                 │      │
│  │   • Sunscald (1%)        - Consider shade cloth               │      │
│  │   • Pest damage (1%)     - Minimal, good IPM                  │      │
│  │                                                                 │      │
│  │ Average Brix:      7.4  (Sweet! Above 6.5 is excellent)       │      │
│  │                                                                 │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                            │
│  Labor & Economics                                                        │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │ Total Labor (to date):                                          │      │
│  │   Harvest:         31.5 hours                                  │      │
│  │   Maintenance:     12 hours (pruning, staking, etc.)          │      │
│  │   Total:           43.5 hours                                  │      │
│  │                                                                 │      │
│  │ Productivity:      5.6 lbs/hour (harvest only)                 │      │
│  │                    4.0 lbs/hour (including maintenance)        │      │
│  │                                                                 │      │
│  │ Revenue (to date): $880                                        │      │
│  │   Average Price:   $5.00/lb                                    │      │
│  │   Labor Cost:      $652.50 (@$15/hr)                          │      │
│  │   Net Profit:      $227.50                                     │      │
│  │   Margin:          26%                                         │      │
│  │                                                                 │      │
│  │ Projected Season:                                              │      │
│  │   Revenue:         $4,000 (800 lbs @ $5/lb)                   │      │
│  │   Labor Cost:      $2,400 (160 hrs @ $15/hr)                  │      │
│  │   Net Profit:      $1,600                                      │      │
│  │   ROI:             67% ✓ Excellent                            │      │
│  │                                                                 │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                            │
│  Growing Conditions & Notes                                               │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │ Weather Impact:                                                 │      │
│  │   • Good growing temps (70-85°F)                               │      │
│  │   • Adequate rainfall in June                                  │      │
│  │   • Minor heat stress late June                                │      │
│  │                                                                 │      │
│  │ Soil Health:                                                    │      │
│  │   • Pre-plant compost: 2" layer                                │      │
│  │   • Fertilizer: Fish emulsion biweekly                         │      │
│  │   • Mulch: Straw, 3" depth                                     │      │
│  │                                                                 │      │
│  │ Pest/Disease Management:                                        │      │
│  │   • Minimal pest pressure (2% damage)                          │      │
│  │   • No disease observed ✓                                      │      │
│  │   • Good air circulation from pruning                          │      │
│  │                                                                 │      │
│  │ Success Factors:                                               │      │
│  │   ✓ Strong transplants (4 weeks old)                          │      │
│  │   ✓ Consistent irrigation (drip system)                        │      │
│  │   ✓ Good staking and pruning                                   │      │
│  │   ✓ Proper spacing (2 ft in-row)                              │      │
│  │                                                                 │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                            │
│  Recommendations for Next Season                                          │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │                                                                 │      │
│  │  ✓ Increase planting by 20% (180 plants) - demand is high     │      │
│  │  ✓ Continue with Sweet 100 variety - excellent performer      │      │
│  │  ⚠️ Install shade cloth for late July/August heat             │      │
│  │  💡 Consider drip tape upgrade for more even watering          │      │
│  │  💡 Start transplants 1 week earlier for earlier harvest       │      │
│  │  💡 Trial 1-2 new cherry varieties for comparison              │      │
│  │                                                                 │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                            │
│  [Export Full Report]  [Compare with Other Varieties]  [Share]           │
└──────────────────────────────────────────────────────────────────────────┘
```

## Mobile View

### Mobile Harvest Logging
```
┌──────────────────────────┐
│ ☰  Harvest  📅 Today  🔍 │
├──────────────────────────┤
│ June 21, 2025            │
│ ☀️ 72°F                  │
│                          │
│ Active Harvests (3)      │
│                          │
│ ┌──────────────────────┐ │
│ │ 🍅 Tomatoes - Cherry │ │
│ │ North Field          │ │
│ │ Peak Season 🔴       │ │
│ │                      │ │
│ │ This Week: 124 lbs   │ │
│ │ Today: Not logged    │ │
│ │                      │ │
│ │ [Quick Log]          │ │
│ │ [Full Entry]         │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ 🥒 Cucumbers         │ │
│ │ South Field          │ │
│ │ Starting 🟢          │ │
│ │                      │ │
│ │ This Week: 8 lbs     │ │
│ │ Today: Not logged    │ │
│ │                      │ │
│ │ [Quick Log]          │ │
│ │ [Full Entry]         │ │
│ └──────────────────────┘ │
│                          │
│ [+ New Harvest]          │
│ [View Analytics]         │
└──────────────────────────┘
```

### Quick Log Interface (Mobile)
```
┌──────────────────────────┐
│ Quick Harvest Log        │
│ Tomatoes - Cherry        │
├──────────────────────────┤
│                          │
│ Weight:                  │
│ ┌──────────────────────┐ │
│ │     [23.5] lbs       │ │
│ │   [- 5]    [+ 5]     │ │
│ │   [- 1]    [+ 1]     │ │
│ └──────────────────────┘ │
│                          │
│ Quality:                 │
│ [⭐][⭐][⭐][⭐][⭐]       │
│                          │
│ Workers: 3               │
│ [Maria] [Juan] [Ana]     │
│                          │
│ Time: 08:00 - 11:30      │
│ (3.5 hours)              │
│                          │
│ [Cancel]  [Save]         │
└──────────────────────────┘
```

## Key Features Summary

1. **Comprehensive Logging**
   - Weight, quality, labor tracking
   - Photo documentation
   - Destination/sales tracking
   - Weather conditions

2. **Predictive Analytics**
   - Harvest forecasting
   - Labor planning
   - Revenue projections
   - Yield comparisons

3. **Quality Management**
   - Multi-grade tracking
   - Defect categorization
   - Brix/quality metrics
   - Customer feedback integration

4. **Performance Insights**
   - Yield per plant/sq ft
   - Labor efficiency
   - Year-over-year comparisons
   - Benchmark analysis

5. **Integration**
   - Worker scheduling
   - Time entry linking
   - Sales channel tracking
   - Planting record connection

## API Endpoints Required

```
GET    /api/harvests?status=active&field=...
GET    /api/harvests/:id
POST   /api/harvests
PUT    /api/harvests/:id
DELETE /api/harvests/:id
GET    /api/harvests/scheduled?start=...&end=...
GET    /api/harvests/analytics?season=...&crop=...
GET    /api/harvests/crop-performance/:cropId
POST   /api/harvests/:id/photos
GET    /api/harvests/forecast/:cropId
GET    /api/harvests/labor-stats
POST   /api/harvests/quick-log
```

## Future Enhancements

1. Machine learning yield predictions
2. Mobile app with offline support
3. Barcode/QR scanning for quick entry
4. Photo analysis for quality grading (AI)
5. Direct integration with sales platforms
6. Customer yield feedback loop
7. Pest/disease correlation analysis
8. Weather impact analysis
9. Automated harvest reminders (SMS/app)
10. Voice-activated logging
11. Blockchain traceability integration
12. Carbon footprint calculations
