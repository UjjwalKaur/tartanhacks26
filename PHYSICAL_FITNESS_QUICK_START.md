# Physical Fitness Analytics - Implementation Summary

## What Was Built

### 1. **Fitness Analytics Engine** (`fitnessAnalytics.ts`)
- Computes 14+ health metrics from wearable data
- Finance-linked signals: convenience spend risk, planning capacity, impulse susceptibility
- Deterministic math (no AI) - fully reproducible
- ~400 lines of pure utility functions

### 2. **HealthDrawer Component** (`HealthDrawer.tsx`)
- Upload JSON with wearable entries
- Drag-and-drop or file picker UI
- Full validation: schema, format, required fields
- File registered in FileRegistry under `physical_json`
- Shows sample JSON format for users

### 3. **FitnessInsights Component** (`FitnessInsights.tsx`)
- Finance-oriented display (not generic health metrics)
- Red impulse alert when risk detected
- 3-column summary: Sleep Quality | Spend Risk | Planning Capacity
- Activity baseline & low-energy assessment
- Animated cards with contextual labels

### 4. **FitnessAnalyticsProvider** (`fitnessContext.tsx`)
- In-memory state only (no persistence)
- Available across app for session
- Cleared on refresh

### 5. **Health Page Integration**
- HealthDrawer displays prominently at top
- "💪 Physical Fitness" section
- Legacy health charts kept below for reference

---

## Key Metrics Computed

| Metric | Range | Meaning |
|--------|-------|---------|
| avgSleepHours | 0-12 | Nightly sleep in hours |
| sleepConsistencyScore | 0-100 | Regularity of sleep pattern |
| fatigueIndex | 0-100 | Overall fatigue from sleep + HR + activity |
| convenienceSpendRisk | 0-100 | Likelihood of impulse spending |
| planningCapacityScore | 0-100 | Quality of financial decision-making |
| impulseSusceptibilityFlag | bool | Red alert: < 6.5h sleep + high fatigue |
| lowEnergyDaysPct | 0-100 | % days with poor sleep/activity |
| routineStabilityScore | 0-100 | Consistency of sleep + activity pattern |

---

## Data Flow

```
User drops JSON file
    ↓
HealthDrawer validates schema
    ↓
analyzeFitness() computes metrics
    ↓
FitnessAnalyticsProvider stores in-memory
    ↓
FileRegistry registers physical_json
    ↓
FitnessInsights renders with finance labels
```

---

## Expected JSON Format

```json
[
  {
    "date": "2024-02-01",
    "sleep_total_min": 420,
    "sleep_efficiency": 92,
    "hr_resting": 62,
    "steps": 8500,
    "exercise_min": 30,
    "active_energy_kcal": 450
  },
  ...
]
```

---

## Features

✅ Drag-and-drop file upload
✅ JSON validation (format + schema)
✅ In-memory analytics (no persistence)
✅ File registration in FileRegistry
✅ Finance-linked signals
✅ Red alert for impulse risk
✅ Animated UI cards
✅ Contextual risk/capacity labels
✅ Activity & energy baseline metrics
✅ Sample JSON format shown to users
✅ Error messages for invalid uploads

---

## Files Created/Modified

**New Files:**
- `/src/lib/fitnessAnalytics.ts` (400+ lines)
- `/src/store/fitnessContext.tsx` (30 lines)
- `/src/components/fitness/FitnessInsights.tsx` (200+ lines)
- `/src/components/mosaic/HealthDrawer.tsx` (200+ lines)

**Modified Files:**
- `/src/app/health/page.tsx` - Integrated HealthDrawer
- `/src/app/providers.tsx` - Added FitnessAnalyticsProvider
- `/src/store/fileRegistry.tsx` - Added 'physical_json' FileKey

---

## How to Use

1. Navigate to `/health` page
2. See "💪 Physical Fitness" section at top
3. Drag JSON file into drop area or click to select
4. View computed analytics:
   - Impulse risk (red alert if high)
   - Sleep quality (consistency score)
   - Planning capacity (decision quality)
   - Activity level & low-energy days
5. File is stored in FileRegistry for patterns page access

---

## Design Highlights

- **Finance-First**: Metrics labeled for spending behavior, not generic health
- **Deterministic**: Pure math, reproducible results, no randomness
- **Contextual**: Shows warnings when user is at risk for impulse spending
- **Non-Persistent**: Analytics reset on refresh (intentional - lightweight approach)
- **Well-Integrated**: Follows existing patterns (FileRegistry, Providers, UI components)
- **Extensible**: Foundation for cross-domain analysis (fitness + spending patterns)
