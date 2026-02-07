# Spending Analysis with Gemini AI - Feature Documentation

## Overview

This feature automatically analyzes uploaded transaction data using the Gemini API to:

1. **Understand spending patterns** - Identifies habits like frequent coffee purchases, dining delivery trends
2. **Uncover user intent** - Determines the psychological/behavioral reasons behind spending (stress relief, convenience, etc.)
3. **Provide personalized insights** - Explains why spending occurs and what it reveals about behavior
4. **Generate recommendations** - Suggests actionable improvements based on actual spending data

## How It Works

### Data Flow

```
1. User uploads JSON file (Finance drawer)
   ↓
2. File saved to .data/uploads/finance/
   ↓
3. User views analysis (automatic or manual refresh)
   ↓
4. API fetches latest file and analyzes it
   ↓
5. Gemini API processes transactions
   ↓
6. Results displayed in SpendingAnalysisDisplay component
```

### API Endpoint: `/api/analyze/spending`

**Method:** GET

**Response:**
```json
{
  "success": true,
  "data": {
    "file": "/path/to/file.json",
    "transactionCount": 111,
    "analysis": {
      "summary": "String describing overall spending behavior",
      "patterns": ["pattern1", "pattern2", "pattern3", "pattern4"],
      "intent": "Detailed explanation of why user spends this way",
      "categoryBreakdown": { "category": amount, ... },
      "topMerchants": [
        { "merchant": "name", "total": 0.00, "frequency": 5 }
      ],
      "insights": ["insight1", "insight2", "insight3", "insight4"],
      "recommendations": ["rec1", "rec2", "rec3"]
    },
    "basicAnalysis": {
      "categoryBreakdown": { ... },
      "topMerchants": [ ... ],
      "totalSpent": 1234.56,
      "dateRange": {
        "start": "2026-01-08",
        "end": "2026-01-20"
      }
    }
  }
}
```

## Expected Transaction JSON Format

### Array Format (Simplest)
```json
[
  {
    "date": "2026-01-08",
    "amount": 52.47,
    "category": "Groceries",
    "merchant": "Whole Foods"
  },
  {
    "date": "2026-01-09",
    "amount": 5.82,
    "category": "Coffee",
    "merchant": "Starbucks"
  }
]
```

### Full Format (Recommended)
```json
[
  {
    "transaction_id": "tx_0001",
    "date": "2026-01-08",
    "name": "WHOLE FOODS",
    "merchant": "Whole Foods",
    "amount": 52.47,
    "currency": "USD",
    "category": "Groceries",
    "group": "Needs",
    "payment_channel": "in_store",
    "pending": false,
    "account": "checking"
  }
]
```

### With Metadata
```json
{
  "user": "user@example.com",
  "period": "2026-01",
  "transactions": [
    { "date": "2026-01-08", "amount": 52.47, "category": "Groceries" }
  ]
}
```

## File Structure

```
.data/uploads/finance/
├── finance_1707173400000_transactions.json
├── finance_1707260800000_transactions.json
└── finance_1707347200000_transactions.json
```

The API automatically:
- Finds the latest uploaded file (by timestamp)
- Parses it regardless of JSON structure
- Analyzes transaction data
- Sends analysis to Gemini API

## Gemini Prompt

The system uses this prompt to analyze spending:

```
Analyze the following spending data and provide psychological insights...
- Date Range, Transaction count, Total spent
- Category breakdown
- Top merchants

Provide:
1. Summary of spending patterns
2. 3-4 specific patterns observed
3. Underlying intent/psychology
4. 3-4 actionable insights
5. 2-3 personalized recommendations
```

## Features Explained

### 1. Spending Summary
- **What it shows:** High-level overview of spending behavior
- **Example:** "Your spending is dominated by dining and coffee, suggesting high convenience spending or frequent socializing/commuting lifestyle"

### 2. Why You're Spending This Way
- **What it shows:** Psychological/behavioral intent
- **Example:** "Your frequent small purchases (coffee, dining) suggest stress relief spending or time scarcity (convenience over cost)"

### 3. Spending Patterns
- **What it shows:** Specific recurring behaviors identified
- **Examples:**
  - "Daily Starbucks visits ($5-7 each) indicate routine beverage ritual or stress relief mechanism"
  - "Frequent DoorDash/UberEats orders suggest busy schedule with limited cooking time"
  - "Multiple Amazon purchases indicate online shopping habit or impulse buying pattern"

### 4. Category Breakdown
- **What it shows:** Percentage of spending per category with visual progress bars
- **Uses:** Help identify where money actually goes vs where you think it goes

### 5. Top Merchants
- **What it shows:** Most frequent and highest-spending merchants
- **Frequency:** Number of times merchant appears
- **Total:** Cumulative spending at that merchant

### 6. Key Insights
- **What it shows:** AI-identified psychological factors and behavioral patterns
- **Examples:**
  - "Stress-driven spending: Increased impulse purchases on weekends"
  - "Convenience premium: Willing to pay 30% more for delivery vs in-store"
  - "Time poverty: Dinner spending suggests prioritizing time over cost"

### 7. Recommendations
- **What it shows:** Personalized, actionable suggestions based on actual behavior
- **Examples:**
  - "Consider a coffee subscription to reduce daily visits and save $100+/month"
  - "Schedule meal prep sessions to reduce delivery spending and improve nutrition"
  - "Set daily transaction limits to increase spending awareness"

## Component: SpendingAnalysisDisplay

**Location:** `src/components/mosaic/SpendingAnalysisDisplay.tsx`

**Props:** None (uses `useSpendingAnalysis()` hook internally)

**Features:**
- Fetches analysis on mount
- Loading skeleton while processing
- Error state with helpful message
- Animated cards with staggered entrance
- Category breakdown with animated progress bars
- Responsive merchant list
- Color-coded sections (purple, orange, blue, green, cyan, amber)

**States:**
- **Loading:** Shows skeleton loaders
- **Error:** Displays "No Transaction Data" message with upload hint
- **Success:** Shows full analysis with all sections

## Hook: useSpendingAnalysis

**Location:** `src/hooks/useSpendingAnalysis.ts`

**Usage:**
```tsx
const { data, isLoading, error } = useSpendingAnalysis();
// Automatically queries /api/analyze/spending

const { mutate } = useAnalyzeSpendingMutation();
// Manual trigger for re-analysis
```

**Cache:** 5 minutes (after first successful query)

## Integration Points

### 1. DomainDrawer Component
- Shows upload section for Finance domain
- Displays SpendingAnalysisDisplay below upload area
- Refetches analysis after successful file upload

### 2. Dashboard
- Can be extended to show analysis on main page
- Quick insights card could display top patterns

### 3. Future Enhancements
- Time-series tracking (compare analyses over time)
- Budget recommendations based on analysis
- Alerts for unusual spending detected
- Export analysis as PDF report

## Backend Processing

### 1. File Reading (`getLatestTransactionFile`)
- Lists all JSON files in `.data/uploads/finance/`
- Sorts by timestamp (filename format: `domain_timestamp_name.json`)
- Returns latest file content

### 2. Transaction Analysis (`analyzeTransactionData`)
- Processes all transactions
- Skips income (negative amounts)
- Calculates:
  - Category breakdown (total per category)
  - Merchant analysis (total + frequency per merchant)
  - Date range
  - Total spent

### 3. Gemini Analysis (`analyzeWithGemini`)
- Constructs detailed prompt with analyzed data
- Calls Gemini Pro API
- Extracts JSON from response
- Returns structured insights

## Error Handling

### No Transaction Data
- Shows error card with upload hint
- User sees clear action items

### Invalid JSON
- API validates JSON during upload
- Analysis API skips non-JSON files

### Gemini API Errors
- Gracefully returns `null` for analysis
- Basic analysis still available
- User sees helpful message

### Network Errors
- Query hook retries once
- User sees error state after retry fails

## Performance

- **File I/O:** O(n) where n = number of uploaded files
- **Analysis:** O(m) where m = number of transactions
- **Gemini API:** ~2-3 seconds for response
- **Total time:** 3-5 seconds from upload to displayed analysis

## Environment Variables

Required for Gemini analysis:
```
GEMINI_API_KEY=your_api_key_here
```

## Example Analysis Output

### Input: 111 transactions from Jan 8-20, 2026

**Summary:**
"Your spending is dominated by dining and convenience purchases, suggesting a busy lifestyle with high preference for time-saving options. Daily coffee purchases ($18-20/week) combined with 4-5 food delivery orders indicate stress relief spending or time scarcity."

**Patterns:**
1. Daily Starbucks ritual ($5-7 each, ~6-7 times/week) suggests caffeine dependency or morning routine stress relief
2. Food delivery preference (DoorDash, UberEats, Uber Eats) shows 30%+ premium spending vs restaurant dining
3. Amazon impulse shopping ($100+) indicates online shopping habit triggered by stress or boredom
4. Consistent grocery shopping (2x/week) suggests some meal preparation despite high food delivery spending

**Intent:**
"Your spending pattern reveals a time-scarcity lifestyle where convenience is valued over cost. You're willing to pay premiums for immediate gratification (delivery, coffee shops, Amazon) but still maintain some structure (groceries). This suggests either genuinely high income/time poverty, or stress-driven impulse spending masking underlying anxiety."

**Insights:**
1. "Convenience premium: Paying $30-35 for DoorDash orders that would cost $15-20 in-restaurant"
2. "Stress correlation: Weekend alcohol and shopping purchases ($60+) suggest weekend stress/boredom"
3. "Time poverty indicator: High 'wants' vs 'needs' ratio (60%+ dining, shopping, coffee)"
4. "Income elasticity: Spending suggests $50k+ annual income or unsustainable spending habits"

**Recommendations:**
1. "Set a $10 daily coffee/beverage limit to save $30+/month without eliminating the ritual"
2. "Batch food delivery to 2x/week with meal prep on Sundays (potential $200+/month savings)"
3. "Unsubscribe from Amazon recommendations and implement 30-day purchase delay policy"

## Testing

### With Provided Sample Data
The repository includes `finance_1770446036836_transactions.json` with:
- 111 transactions
- 10-day period (Jan 8-20)
- Mix of categories: Groceries, Dining, Coffee, Shopping, Transport, etc.
- Real merchant names

### Quick Test
1. Navigate to http://localhost:3002/dashboard
2. Click Finance tile
3. File should be pre-uploaded
4. Click refresh or scroll to see analysis
5. Verify all sections populate correctly

## Known Limitations

1. **Only latest file analyzed** - If multiple files uploaded, only newest is used
2. **Income detection** - Only skips negative amounts; doesn't handle all income types
3. **Category inference** - Relies on "category" or "group" fields in JSON
4. **Merchant matching** - Uses exact name matching; similar merchants aren't merged
5. **API rate limits** - Gemini API may throttle if called frequently

## Future Enhancements

- [ ] Multi-file analysis (compare spending across uploads)
- [ ] Historical trend tracking
- [ ] Budget recommendations with savings potential
- [ ] Suspicious transaction detection
- [ ] Category-specific insights
- [ ] Peer comparison (anonymized benchmarks)
- [ ] Export to PDF
- [ ] Calendar visualization of spending
- [ ] Integration with bank APIs for automatic imports
