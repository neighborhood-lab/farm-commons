# Field Rotation Planner Mockup

## Overview
The Field Rotation Planner helps farmers optimize crop rotations across multiple seasons and years, following best practices for soil health, pest management, and nutrient cycling. It provides visual planning tools and intelligent suggestions based on crop families and rotation rules.

## Layout Structure

### Top Navigation Bar
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Farm Commons              [Crop Planning > Rotation]  👤 User   ☰ Menu  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Main View Controls
```
┌─────────────────────────────────────────────────────────────────────────┐
│  Field Rotation Planner                                                  │
│  ┌────────────────┐  ┌──────────────────┐  ┌────────────────────┐      │
│  │ ◀ 2024        │  │   View: 2025-2027 │  │        2028 ▶     │      │
│  └────────────────┘  └──────────────────┘  └────────────────────┘      │
│                                                                           │
│  Display: (•) Grid View  ( ) Timeline  ( ) Cycle Diagram                │
│  Filter:  [All Fields ▾]  ☑ Show Warnings  ☑ Show Suggestions          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Grid View (Default)

### Multi-Year Rotation Grid
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Field Rotation Grid: 2025-2027                              [+ Add Field]        │
├────────────┬─────────────────┬─────────────────┬─────────────────┬───────────────┤
│  Field     │    2025         │     2026        │     2027        │  Rotation     │
│            │   (Current)     │                 │                 │  Status       │
├────────────┼─────────────────┼─────────────────┼─────────────────┼───────────────┤
│ North      │ 🍅 Tomatoes     │ 🥬 Brassicas    │ 🌿 Legumes      │ ✓ Optimal     │
│ Field      │ (Solanaceae)    │ (Cover Crop)    │ (Beans)         │               │
│ [Edit]     │ Planted: Apr 1  │ Plan: Mar 15    │ Plan: Apr 10    │ 3-yr cycle    │
│            │ ───────────────────────────────────────────────────  │               │
│            │ Last: Corn (2024)     Next: Root veg (2028)         │               │
├────────────┼─────────────────┼─────────────────┼─────────────────┼───────────────┤
│ South      │ 🥬 Lettuce      │ 🍅 Tomatoes     │ 🥕 Carrots      │ ⚠️ Review     │
│ Field      │ (Brassicas)     │ (Solanaceae)    │ (Root veg)      │               │
│ [Edit]     │ Planted: Mar 10 │ Plan: Apr 5     │ Plan: Apr 20    │ 3-yr cycle    │
│            │ ───────────────────────────────────────────────────  │               │
│            │ ⚠️ Warning: Tomatoes used 2 years ago               │               │
├────────────┼─────────────────┼─────────────────┼─────────────────┼───────────────┤
│ East       │ 🌽 Corn         │ 🌿 Cover Crop   │ 🌶️ Peppers     │ ✓ Optimal     │
│ Field      │ (Heavy Feeder)  │ (Clover mix)    │ (Solanaceae)    │               │
│ [Edit]     │ Planted: May 1  │ Plan: Sep 1     │ Plan: Apr 1     │ 4-yr cycle    │
│            │ ───────────────────────────────────────────────────  │               │
│            │ 💡 Suggestion: Add nitrogen-fixing legume after corn │               │
├────────────┼─────────────────┼─────────────────┼─────────────────┼───────────────┤
│ West       │ 🥒 Cucumbers    │ 🥬 Kale         │ 🌿 Legumes      │ ✓ Good        │
│ Field      │ (Cucurbits)     │ (Brassicas)     │ (Peas)          │               │
│ [Edit]     │ Planted: May 15 │ Plan: Aug 1     │ Plan: Mar 1     │ 3-yr cycle    │
├────────────┼─────────────────┼─────────────────┼─────────────────┼───────────────┤
│ Greenhouse │ 🍅 Tomatoes     │ 🥬 Greens       │ 🍅 Tomatoes     │ ⚠️ Intensive  │
│ #1         │ (Year-round)    │ (Winter)        │ (Year-round)    │               │
│ [Edit]     │ Continuous      │ Plan: Oct 1     │ Plan: Apr 1     │ Greenhouse    │
│            │ ───────────────────────────────────────────────────  │               │
│            │ ⚠️ Note: Consider soil replacement between tomato cycles             │
└────────────┴─────────────────┴─────────────────┴─────────────────┴───────────────┘
```

### Status Indicators Legend
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Rotation Health:                                                         │
│  ✓ Optimal    - Follows best rotation practices                        │
│  ✓ Good       - Acceptable rotation with minor issues                  │
│  ⚠️ Review     - Potential problems detected                            │
│  ❌ Problem    - Rotation violates best practices                       │
│                                                                           │
│ Icons:                                                                    │
│  💡 = Suggestion available    ⚠️ = Warning    ℹ️ = Information          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Timeline View

### Horizontal Timeline Representation
```
┌──────────────────────────────────────────────────────────────────────────┐
│ Timeline View: North Field (2023-2028)                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  2023      2024        2025        2026        2027        2028          │
│   │          │          │          │          │          │               │
│   │          │          │          │          │          │               │
│  🥕        🌽        🍅        🥬        🌿        🥕                     │
│ Carrots    Corn     Tomatoes  Brassicas  Legumes   Carrots               │
│  Root      Heavy     Fruiting   Leafy     N-Fix     Root                 │
│  Veg       Feeder    Solanac.   Greens    Cover     Veg                  │
│   │          │          │          │          │          │               │
│ ─────────────────────────────────────────────────────────────────────    │
│           └─────┬─────┘                                                   │
│                 Good: Different families,                                 │
│                 nitrogen management                                       │
│                       └────────┬────────┘                                │
│                                Excellent: Cover crop                      │
│                                for soil health                            │
│                                                                            │
│  Rotation Cycle: 5 years (Root → Heavy → Fruiting → Leafy → Legume)     │
└──────────────────────────────────────────────────────────────────────────┘
```

## Cycle Diagram View

### Circular Rotation Visualization
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Rotation Cycle Diagram: Standard 4-Year Rotation                        │
│                                                                           │
│                         Year 1                                           │
│                      🌿 LEGUMES                                          │
│                     (Nitrogen-fixing)                                    │
│                      Beans, Peas                                         │
│                           │                                              │
│              ┌────────────┴────────────┐                                │
│              │                          │                                 │
│         Year 4                      Year 2                               │
│      🥕 ROOT CROPS              🍅 FRUITING                              │
│      (Light feeders)            (Heavy feeders)                          │
│      Carrots, Beets             Tomatoes, Peppers                        │
│              │                          │                                 │
│              └────────────┬────────────┘                                │
│                           │                                              │
│                        Year 3                                            │
│                    🥬 BRASSICAS                                          │
│                   (Medium feeders)                                       │
│                  Cabbage, Broccoli                                       │
│                                                                           │
│  [⟲ Rotate Forward]  [⟳ Rotate Back]  [Edit Cycle]                     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Edit Field Rotation Modal

### Click on Any Field Cell to Edit
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Edit Rotation: North Field - 2026                          [✕ Close]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Field Information                                                        │
│  ┌───────────────────────────────────────────────────────────────┐      │
│  │ Field Name:     North Field                                    │      │
│  │ Size:           2.5 acres                                      │      │
│  │ Soil Type:      Loamy clay                                     │      │
│  │ pH Level:       6.8 (Last tested: Jan 2025)                   │      │
│  │ Drainage:       Good                                           │      │
│  └───────────────────────────────────────────────────────────────┘      │
│                                                                           │
│  Previous Crops (History)                                                │
│  ├─ 2025: Tomatoes (Solanaceae) - Heavy nitrogen user                  │
│  ├─ 2024: Corn (Heavy feeder) - Depleted nutrients                     │
│  └─ 2023: Carrots (Root vegetables) - Light feeder                     │
│                                                                           │
│  Planned Crop for 2026                                                   │
│  ┌───────────────────────────────────────────────────────────────┐      │
│  │ Crop Family:    [Brassicas (Cabbage family) ▾]               │      │
│  │ Specific Crop:  [Broccoli ▾]                                 │      │
│  │                                                                 │      │
│  │ Alternative Suggestions:                                        │      │
│  │  • Legumes (Beans/Peas) - Restore nitrogen  ✓ Recommended     │      │
│  │  • Leafy Greens (Lettuce) - Light feeder    ✓ Good            │      │
│  │  • Cover Crop (Clover mix) - Soil building  ✓ Excellent       │      │
│  │  • Brassicas (Broccoli) - Current selection  ⚠️ Acceptable    │      │
│  └───────────────────────────────────────────────────────────────┘      │
│                                                                           │
│  Rotation Analysis                                                        │
│  ┌───────────────────────────────────────────────────────────────┐      │
│  │ ⚠️ Considerations:                                             │      │
│  │  • Brassicas are medium-heavy feeders                          │      │
│  │  • Field had heavy feeders last 2 years                        │      │
│  │  • Consider nitrogen-fixing crop or cover crop                 │      │
│  │                                                                 │      │
│  │ ✓ Benefits:                                                     │      │
│  │  • Different plant family from last 2 years                    │      │
│  │  • Good pest/disease break                                     │      │
│  │  • Compatible with field characteristics                       │      │
│  │                                                                 │      │
│  │ Rotation Score: 7/10  ⚠️ Could be improved                    │      │
│  └───────────────────────────────────────────────────────────────┘      │
│                                                                           │
│  Soil Amendments Needed                                                  │
│  ┌───────────────────────────────────────────────────────────────┐      │
│  │ Based on crop choice and field history:                        │      │
│  │  □ Compost (2 tons per acre)                                  │      │
│  │  □ Nitrogen fertilizer (moderate)                              │      │
│  │  □ Lime (pH adjustment if needed)                              │      │
│  │  □ Soil test recommended before planting                       │      │
│  └───────────────────────────────────────────────────────────────┘      │
│                                                                           │
│  Planting Details                                                        │
│  ┌───────────────────────────────────────────────────────────────┐      │
│  │ Estimated Plant Date:  [March 15, 2026]  📅                   │      │
│  │ Estimated Harvest:     [June 1 - June 30, 2026]              │      │
│  │ Days to Maturity:      75-85 days                             │      │
│  │                                                                 │      │
│  │ Growing Season:        Spring/Summer                           │      │
│  │ Succession Planting:   ☑ Enable (plant every 2 weeks)         │      │
│  └───────────────────────────────────────────────────────────────┘      │
│                                                                           │
│  Notes                                                                    │
│  ┌───────────────────────────────────────────────────────────────┐      │
│  │ ____________________________________________________________   │      │
│  │ ____________________________________________________________   │      │
│  └───────────────────────────────────────────────────────────────┘      │
│                                                                           │
│  [Cancel]  [Use Suggested Crop]  [Save Plan]  [Save & Copy to Others]  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Rotation Rules Library

### Predefined Rotation Rules
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Rotation Rules & Best Practices                         [+ Add Rule]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Active Rules:                                                           │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │ ☑ Same family minimum 3-year gap                           │ [Edit] │
│  │   Prevents disease buildup (especially Solanaceae)          │        │
│  │   Severity: ⚠️ Warning                                      │        │
│  │                                                              │        │
│  │ ☑ Heavy feeders followed by nitrogen-fixers                │ [Edit] │
│  │   Restores soil nutrients naturally                         │        │
│  │   Severity: 💡 Suggestion                                   │        │
│  │                                                              │        │
│  │ ☑ Include cover crops every 3-4 years                      │ [Edit] │
│  │   Builds soil organic matter and structure                  │        │
│  │   Severity: 💡 Suggestion                                   │        │
│  │                                                              │        │
│  │ ☑ Alternate root depths                                    │ [Edit] │
│  │   Deep roots → Shallow roots → Medium roots                 │        │
│  │   Severity: ℹ️ Information                                  │        │
│  │                                                              │        │
│  │ ☐ Biofumigation with brassicas                             │ [Edit] │
│  │   Use before high-disease-risk crops                        │        │
│  │   Severity: 💡 Suggestion                                   │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                           │
│  Custom Rules: [View All]                                                │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Crop Family Reference

### Quick Reference Panel (Sidebar or Modal)
```
┌─────────────────────────────────────────────────────────────────┐
│ Crop Families Reference                            [✕ Close]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 🍅 SOLANACEAE (Nightshades)                                     │
│    Tomatoes, Peppers, Eggplants, Potatoes                      │
│    Rotation: Min 3-4 years    Nutrient: Heavy feeders          │
│    Common issues: Early blight, verticillium wilt               │
│                                                                  │
│ 🥬 BRASSICACEAE (Cabbage family)                                │
│    Broccoli, Cabbage, Kale, Radishes, Turnips                 │
│    Rotation: Min 3 years      Nutrient: Medium feeders         │
│    Common issues: Club root, cabbage worms                      │
│                                                                  │
│ 🌿 FABACEAE (Legumes)                                           │
│    Beans, Peas, Clover, Alfalfa                                │
│    Rotation: 3-4 years        Nutrient: Nitrogen-fixers        │
│    Benefits: Enriches soil nitrogen                             │
│                                                                  │
│ 🥒 CUCURBITACEAE (Cucurbits)                                    │
│    Cucumbers, Squash, Melons, Pumpkins                         │
│    Rotation: 3-4 years        Nutrient: Heavy feeders          │
│    Common issues: Powdery mildew, cucumber beetles             │
│                                                                  │
│ 🥕 APIACEAE (Carrot family)                                     │
│    Carrots, Parsnips, Celery, Parsley                          │
│    Rotation: 3 years          Nutrient: Light feeders          │
│                                                                  │
│ 🧅 AMARYLLIDACEAE (Alliums)                                     │
│    Onions, Garlic, Leeks, Shallots                             │
│    Rotation: 3-4 years        Nutrient: Light-medium feeders   │
│    Benefits: Natural pest deterrent                             │
│                                                                  │
│ 🌽 POACEAE (Grasses)                                            │
│    Corn, Wheat, Oats, Rye                                       │
│    Rotation: 2-3 years        Nutrient: Heavy feeders          │
│                                                                  │
│ 🥬 OTHER LEAFY GREENS                                           │
│    Lettuce, Spinach, Chard, Arugula                            │
│    Rotation: 2-3 years        Nutrient: Light feeders          │
│                                                                  │
│ [Search Crops...]                              [Print Reference] │
└─────────────────────────────────────────────────────────────────┘
```

## Smart Suggestions Panel

### AI-Powered Rotation Suggestions
```
┌─────────────────────────────────────────────────────────────────────────┐
│ 💡 Smart Suggestions                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Based on your farm's history and best practices:                        │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │ ⭐ Recommended: East Field 2026                             │        │
│  │ Plant: Peas or Beans (Legumes)                              │        │
│  │                                                               │        │
│  │ Why: Following corn (heavy feeder) with nitrogen-fixing      │        │
│  │ legumes will naturally restore soil nutrients. This field    │        │
│  │ hasn't had legumes in 4 years.                               │        │
│  │                                                               │        │
│  │ Expected benefit: +30% nitrogen restoration                  │        │
│  │                                                               │        │
│  │ [Apply Suggestion]  [Learn More]  [Dismiss]                 │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │ 💡 Consider: South Field 2027                               │        │
│  │ Use: Cover crop instead of carrots                           │        │
│  │                                                               │        │
│  │ Why: This field has been in continuous production for        │        │
│  │ 3 years. A cover crop season will improve soil structure     │        │
│  │ and organic matter.                                          │        │
│  │                                                               │        │
│  │ Suggested: Clover/Rye mix                                    │        │
│  │                                                               │        │
│  │ [Apply Suggestion]  [Learn More]  [Dismiss]                 │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │ ⚠️ Warning: North Field rotation                            │        │
│  │ Issue: Tomatoes repeated too frequently                      │        │
│  │                                                               │        │
│  │ Tomatoes in 2025, and in 2023. Nightshades should rotate     │        │
│  │ with minimum 3-year gap to prevent disease buildup.          │        │
│  │                                                               │        │
│  │ [View Alternative Crops]  [Keep Current Plan]               │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Companion Planting Integration

### Companion Crop Suggestions
```
┌─────────────────────────────────────────────────────────────────┐
│ Companion Planting Guide                                         │
├─────────────────────────────────────────────────────────────────┤
│ Selected: Tomatoes                                               │
│                                                                  │
│ ✓ Good Companions:                                              │
│   🌿 Basil - Improves flavor, repels pests                      │
│   🥕 Carrots - Different root depth, good use of space          │
│   🧅 Onions - Pest deterrent                                    │
│   🌼 Marigolds - Nematode control                               │
│                                                                  │
│ ❌ Avoid Planting With:                                         │
│   🥔 Potatoes - Same family, shared diseases                    │
│   🥬 Brassicas - Competition for nutrients                      │
│   🌽 Corn - Attracts similar pests                              │
│                                                                  │
│ [Add Companions to Plan]                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Reports and Analytics

### Rotation Health Report
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Rotation Health Report: 2025-2027 Plan                    [Export PDF]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Overall Farm Rotation Score: 8.2/10  ✓ Good                            │
│                                                                           │
│  ┌────────────────────────────────────────────────────────┐             │
│  │ Rotation Compliance:          ████████░░ 85%          │             │
│  │ Soil Health Optimization:     █████████░ 90%          │             │
│  │ Pest/Disease Prevention:      ██████░░░░ 75%          │             │
│  │ Nutrient Management:          ████████░░ 80%          │             │
│  └────────────────────────────────────────────────────────┘             │
│                                                                           │
│  Strengths:                                                              │
│   ✓ Good family rotation intervals across most fields                   │
│   ✓ Regular inclusion of nitrogen-fixing crops                          │
│   ✓ Diverse crop selection                                              │
│                                                                           │
│  Areas for Improvement:                                                  │
│   ⚠️ South Field: Tomato rotation gap only 2 years                      │
│   💡 Consider more cover crop periods for soil building                 │
│   💡 East Field could benefit from deeper-rooted crops                  │
│                                                                           │
│  3-Year Projection:                                                      │
│   • Estimated soil nitrogen levels: Improving                            │
│   • Disease pressure: Low (good rotation practices)                     │
│   • Biodiversity index: High                                             │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Mobile Responsive Design

### Mobile View (< 768px)
```
┌──────────────────────────┐
│ ☰  Rotation  📅 2025  🔍 │
├──────────────────────────┤
│ North Field              │
│ ┌──────────────────────┐ │
│ │ 2025: Tomatoes    🍅 │ │
│ │ 2026: Brassicas   🥬 │ │
│ │ 2027: Legumes     🌿 │ │
│ │                      │ │
│ │ Status: ✓ Optimal    │ │
│ │ [View Details]       │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│ South Field              │
│ ┌──────────────────────┐ │
│ │ 2025: Lettuce     🥬 │ │
│ │ 2026: Tomatoes    🍅 │ │
│ │ 2027: Carrots     🥕 │ │
│ │                      │ │
│ │ Status: ⚠️ Review    │ │
│ │ [View Details]       │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│ [+ Add Field Plan]       │
│ [💡 View Suggestions]    │
└──────────────────────────┘
```

## Key Features Summary

### 1. Intelligent Rotation Planning
- Multi-year planning (3-5 year cycles)
- Family-based rotation rules
- Nutrient management tracking
- Pest and disease prevention

### 2. Visual Planning Tools
- Grid, timeline, and cycle diagram views
- Drag-and-drop interface
- Color-coded status indicators
- Historical tracking

### 3. Smart Recommendations
- AI-powered crop suggestions
- Rotation rule validation
- Companion planting guides
- Soil amendment recommendations

### 4. Flexibility and Customization
- Custom rotation rules
- Field-specific parameters
- Multiple rotation templates
- Export and sharing capabilities

## API Endpoints Required

```
GET    /api/fields/:id/rotation-history    # Get rotation history
GET    /api/fields/:id/rotation-plan       # Get planned rotations
POST   /api/rotation-plans                 # Create rotation plan
PUT    /api/rotation-plans/:id             # Update rotation plan
GET    /api/rotation/suggestions/:fieldId  # Get AI suggestions
GET    /api/crop-families                  # Get crop family data
GET    /api/rotation-rules                 # Get rotation rules
POST   /api/rotation-rules                 # Add custom rule
GET    /api/rotation/report/:farmId        # Generate health report
```

## Future Enhancements

1. AI learning from farm-specific outcomes
2. Climate zone-specific recommendations
3. Soil test result integration
4. Yield prediction modeling
5. Carbon sequestration tracking
6. Biodiversity impact scoring
7. Integration with seed ordering systems
8. Community knowledge sharing (anonymized)
