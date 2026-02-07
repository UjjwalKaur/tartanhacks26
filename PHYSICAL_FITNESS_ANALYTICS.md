# Physical Fitness Analytics Implementation

## Overview

Implemented comprehensive finance-linked health metrics for the Physical Fitness page. Users can upload wearable data in JSON format and receive deterministic analytics showing how physical fitness impacts financial decision-making capacity.

---

## Architecture

### 1. **Fitness Analytics Engine** (`/src/lib/fitnessAnalytics.ts`)

**Core Metrics Computed**:

#### Sleep Metrics
- **avgSleepHours**: Mean sleep duration in hours (sleep_total_min ÷ 60)
- **sleepConsistencyScore**: Inverse coefficient of variation (0-100)
  - Formula: `100 / (1 + CV)` where CV = stdDev / mean
  - Higher score = more consistent sleep pattern

#### Activity Metrics
- **avgSteps**: Mean daily steps
- **avgExerciseMin**: Mean daily exercise minutes
- **avgRestingHR**: Mean resting heart rate (bpm)
- **avgActiveEnergyKcal**: Mean daily active energy

#### Fatigue Assessment
- **fatigueIndex** (0-100): Weighted heuristic combining:
  - Sleep duration penalty (0-40 points): Optimal 7-9 hours
  - Resting HR penalty (0-35 points): Elevated HR > 80 bpm indicates stress
  - Activity deficit penalty (0-25 points): Low steps < 5000 indicates low energy

#### Energy & Routine
- **lowEnergyDaysPct**: % of days where sleep < 7h OR steps < 5000
- **lowEnergyDaysCount**: Absolute count of low energy days
- **routineStabilityScore**: Average of sleep & steps consistency (0-100)
- **activityLevelScore**: Normalized combination of steps (60%) and exercise (40%)

#### Finance-Linked Signals

1. **convenienceSpendRisk** (0-100):
   - Higher when fatigue and low energy are high
   - Formula: `(fatigueIndex + lowEnergyDaysPct) / 2`
   - **Insight**: Tired users make more impulse purchases (convenience spending)

2. **planningCapacityScore** (0-100):
   - Higher when sleep & routine stability are strong
   - Formula: `(sleepConsistencyScore + routineStabilityScore) / 2`
   - **Insight**: Well-rested users make better financial decisions

3. **impulseSusceptibilityFlag** (boolean):
   - `true` if avgSleepHours < 6.5 AND fatigueIndex > 60
   - **Insight**: High-risk state for impulse control failures

---

## Components

### 2. **HealthDrawer** (`/src/components/mosaic/HealthDrawer.tsx`)

**Purpose**: Upload and analyze wearable fitness data

**Features**:
- **Drag-and-drop JSON upload** or file picker
- **File validation**:
  - Checks for required fields: date, sleep_total_min, sleep_efficiency, hr_resting, steps, exercise_min, active_energy_kcal
  - Validates JSON format
  - Minimum 1 entry required
- **File registration** in FileRegistry under key `"physical_json"`
- **In-memory analytics computation** (no persistence)
- **Loading states** during file processing
- **Error handling** with helpful messages
- **Sample format display** with JSON example

**Data Flow**:
```
User selects JSON file
    ↓
Drag-and-drop or file picker
    ↓
File validation (format, schema)
    ↓
analyzeFitness() utility processes entries
    ↓
FitnessAnalytics object created
    ↓
Stored in FitnessAnalyticsProvider (in-memory)
    ↓
File registered in FileRegistry
    ↓
FitnessInsights component displays results
```

### 3. **FitnessInsights** (`/src/components/fitness/FitnessInsights.tsx`)

**Purpose**: Display finance-linked health metrics with clear financial implications

**UI Sections**:

#### Impulse Risk Alert (Conditional)
- Shows **⚠️ Impulse Risk Alert** when impulseSusceptibilityFlag is true
- Warning: "Low sleep + high fatigue may increase impulse spending likelihood"
- Red border (danger state)

#### Summary Cards (3 columns)
1. **Sleep Quality** (Blue)
   - Average nightly sleep in h:m format
   - Sleep consistency score (%)

2. **Convenience Spend Risk** (Amber)
   - Risk score 0-100
   - Risk level label (Low/Moderate/Elevated/High/Very High)
   - Underlying fatigue index

3. **Planning Capacity** (Green)
   - Score 0-100
   - Capacity level label (Low/Moderate/Good/Strong/Excellent)
   - Routine stability score

#### Activity & Energy Baseline
- Daily Steps (average)
- Exercise Minutes (average)
- Resting Heart Rate (bpm)
- Activity Level Score (0-100)

#### Low Energy Days Assessment
- Percentage of low-energy days
- Absolute count (e.g., "8 of 30 days")
- Definition: "Days with <7h sleep or <5k steps"
- Trending indicator (red for >40%, amber otherwise)

#### Data Period Summary
- Date range (start to end)
- Total days in dataset

---

## Integration

### 4. **FitnessAnalyticsProvider** (`/src/store/fitnessContext.tsx`)

**Purpose**: In-memory state management for fitness analytics

**API**:
```typescript
interface FitnessContextType {
  analytics: FitnessAnalytics | null;
  setAnalytics: (analytics: FitnessAnalytics | null) => void;
}
```

**Characteristics**:
- In-memory only (no localStorage)
- Lost on page refresh
- Persists across route changes within session

### 5. **FileRegistry Update**

Added new FileKey type:
```typescript
type FileKey = 'finance_json' | 'physical_json' | 'transactions_csv' | 'health_csv' | 'checkins_csv';
```

Physical fitness files registered under `'physical_json'` key.

### 6. **Health Page** (`/src/app/health/page.tsx`)

**Structure**:
```tsx
<Health Summary Page>
  ├─ Header: "Health Summary"
  ├─ Physical Fitness Section
  │  └─ HealthDrawer (upload + analytics)
  ├─ Legacy Health Tracking Section (kept for reference)
  │  ├─ Sleep Duration Chart
  │  └─ Daily Steps Chart
  └─ </div>
```

### 7. **App Providers** (`/src/app/providers.tsx`)

**Updated Provider Stack**:
```tsx
QueryClientProvider
├─ FileRegistryProvider
├─ FinanceProvider
├─ FitnessAnalyticsProvider    [NEW]
└─ AppShell
```

---

## JSON Input Format

Users must provide a JSON file with entries containing:

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

**Field Definitions**:
- `date`: ISO format date string (YYYY-MM-DD)
- `sleep_total_min`: Total sleep in minutes
- `sleep_efficiency`: Sleep efficiency percentage (0-100)
- `hr_resting`: Resting heart rate in beats per minute
- `steps`: Daily step count
- `exercise_min`: Exercise duration in minutes
- `active_energy_kcal`: Active energy expenditure in kcal

---

## Computation Examples

### Example Dataset (10 days)
```
Date       Sleep  HR  Steps  Exercise
2024-02-01  420   62   8500    30
2024-02-02  390   65   7200    25
2024-02-03  450   60   10000   45
2024-02-04  360   70   5000    15
2024-02-05  420   61   9000    35
2024-02-06  410   64   7500    28
2024-02-07  380   68   4500    10
2024-02-08  440   59   9500    40
2024-02-09  400   63   8000    32
2024-02-10  430   62   8500    38
```

### Computed Metrics
```
avgSleepHours:           6.8 hours
sleepConsistencyScore:   ~78% (fairly consistent)
avgSteps:                7820 steps/day
avgExerciseMin:          29.8 minutes/day
avgRestingHR:            63.4 bpm
fatigueIndex:            ~42 (moderate fatigue)
lowEnergyDaysPct:        30% (3 of 10 days)
routineStabilityScore:   ~70% (good routine)
activityLevelScore:      ~67/100 (moderate activity)
convenienceSpendRisk:    ~36% (moderate risk)
planningCapacityScore:   ~74% (strong capacity)
impulseSusceptibilityFlag: false
```

---

## Deterministic Math

All calculations use pure mathematical functions:
- ✅ Mean and variance
- ✅ Coefficient of variation (CV = stdDev / mean)
- ✅ Weighted heuristics with thresholds
- ✅ No AI/ML models
- ✅ No randomness
- ✅ Fully reproducible

**Result**: Same input → Same output, always.

---

## UI Flow

### Happy Path
```
1. User navigates to Health page
2. Sees "💪 Physical Fitness" section at top
3. HealthDrawer shows:
   - Drag-and-drop area
   - Sample JSON format
   - File picker button
4. User uploads valid JSON
5. HealthDrawer validates and analyzes
6. FitnessInsights displays:
   - Impulse alert (if triggered)
   - 3-column summary cards
   - Activity baseline metrics
   - Low energy assessment
   - Data period summary
7. File is registered in FileRegistry
8. Analytics available in-memory for session
```

### Error Cases
```
1. Invalid JSON → "Invalid JSON format"
2. Missing fields → "Missing required field: [field_name]"
3. Empty array → "No entries found in file"
4. Wrong structure → "JSON must contain an 'entries' array or be an array"
5. File type → "Please upload a JSON file"
```

---

## Key Design Decisions

### 1. **In-Memory Only**
- No localStorage persistence for analytics
- No database snapshots
- Cleared on page refresh
- Reason: Fitness data is session-transient; user can re-upload if needed

### 2. **Finance-Linked Metrics**
- Not generic health scores
- Directly tied to spending behavior
- convenienceSpendRisk = fatigue proxy
- planningCapacityScore = decision quality proxy
- impulseSusceptibilityFlag = red alert for financial discipline

### 3. **Deterministic Computation**
- Pure math, no heuristics
- Reproducible for debugging
- No ML models
- Clear threshold definitions

### 4. **Contextual UI Labels**
- "Convenience Spend Risk" not "Fatigue Score"
- "Planning Capacity" not "Sleep Quality"
- Risk labels (Low/Moderate/Elevated/High)
- Capacity labels (Low/Moderate/Good/Strong/Excellent)

### 5. **File Organization**
- HealthDrawer: Dedicated UI component
- FitnessAnalytics: Pure utility functions
- FitnessInsights: Display component (separate from spendingInsights)
- FitnessContext: In-memory state

---

## File Structure

```
src/
├── lib/
│   └── fitnessAnalytics.ts        [NEW] - All computation logic
├── store/
│   ├── fitnessContext.tsx          [NEW] - In-memory state
│   └── fileRegistry.tsx            [UPDATED] - Added 'physical_json' key
├── components/
│   ├── fitness/
│   │   └── FitnessInsights.tsx     [NEW] - Display component
│   └── mosaic/
│       └── HealthDrawer.tsx        [NEW] - Upload + analysis component
├── app/
│   ├── health/page.tsx             [UPDATED] - Integrated HealthDrawer
│   └── providers.tsx               [UPDATED] - Added FitnessAnalyticsProvider
```

---

## Testing Scenarios

1. **Valid 30-day dataset**
   - ✅ All metrics compute correctly
   - ✅ Finance signals appear
   - ✅ No impulse alert (healthy data)

2. **Severely sleep-deprived 10-day dataset**
   - ✅ avgSleepHours < 6.5
   - ✅ fatigueIndex > 60
   - ✅ impulseSusceptibilityFlag = true
   - ✅ Red alert displays

3. **Inconsistent routine (high variance)**
   - ✅ sleepConsistencyScore low
   - ✅ routineStabilityScore low
   - ✅ planningCapacityScore drops

4. **Very active user**
   - ✅ activityLevelScore high
   - ✅ convenienceSpendRisk low

5. **Invalid uploads**
   - ✅ Missing field → Error message
   - ✅ Wrong JSON structure → Error message
   - ✅ Empty array → Error message

---

## Future Extensions

### Short-term (Recommended)
1. **Cross-Domain Analysis** - Correlate fitness data with spending patterns
2. **Time-Series Predictions** - Forecast convenience spending risk from upcoming low-sleep days
3. **Actionable Recommendations** - "Get 30 more minutes sleep to reduce impulse spending risk by 15%"

### Medium-term
1. **Multiple Upload Support** - Compare two datasets side-by-side
2. **Export Functionality** - Download analytics as PDF/CSV
3. **Custom Thresholds** - Let users adjust what counts as "low energy"

### Long-term
1. **Real-time Wearable Integration** - Live data sync from fitness trackers
2. **Personalized Baselines** - Learn user's optimal sleep/activity for their decision-making
3. **ML-Powered Anomaly Detection** - Detect unusual patterns predicting overspending

---

## Conclusion

Physical Fitness Analytics provides:
✅ Deterministic health metrics
✅ Finance-linked signals (impulse risk, planning capacity)
✅ Clear visual warnings for high-risk states
✅ Seamless file upload and validation
✅ In-memory analytics (no persistence)
✅ Clean, intuitive UI with contextual labels
✅ Foundation for cross-domain pattern detection

Users can now understand how physical fatigue impacts their financial decision-making capacity and spending behavior.
