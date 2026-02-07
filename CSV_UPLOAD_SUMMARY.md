# JSON File Upload Feature - Implementation Summary

## What's New

When users click on the **Finance tile** on the home page, they now see a JSON upload section where they can upload their transaction data.

## How to Use

1. **Go to Dashboard:** http://localhost:3000/dashboard
2. **Click Finance Tile:** Opens the right-side drawer
3. **Upload JSON:** Click the upload area and select a JSON file with transaction data
4. **Success Confirmation:** Green checkmark appears when upload completes
5. **Files Saved:** Transaction files are saved to `.data/uploads/finance/`

## Example JSON Format

The simplest format is an array of transactions:

```json
[
  {
    "date": "2026-02-01",
    "amount": 50.00,
    "category": "Food",
    "description": "Coffee",
    "merchant": "Starbucks"
  },
  {
    "date": "2026-02-01",
    "amount": 120.00,
    "category": "Transportation",
    "description": "Gas",
    "merchant": "Shell"
  },
  {
    "date": "2026-02-02",
    "amount": 1500.00,
    "category": "Rent",
    "description": "Monthly rent",
    "merchant": "Landlord"
  }
]
```

Or with nested structure:

```json
{
  "user": "john@example.com",
  "period": "2026-02",
  "transactions": [
    { "date": "2026-02-01", "amount": 100 },
    { "date": "2026-02-02", "amount": 150 }
  ]
}
```

## What Gets Saved

```
.data/uploads/
└── finance/
    └── finance_1707173400000_transactions.json
```

The filename includes:
- Domain name: `finance_`
- Timestamp: `1707173400000_`
- Original filename: `transactions.json`

This prevents file conflicts and tracks upload time.

## Supported JSON Formats

The endpoint automatically detects:
1. **Array format:** `[{...}, {...}]` - counts array length
2. **Object with transactions:** `{ transactions: [...] }` - counts transactions array
3. **Object with data:** `{ data: [...] }` - counts data array

## UI Components

### Upload Section (in DomainDrawer)
- ✅ Only visible for Finance domain
- ✅ Amber/gold styling to match Finance theme
- ✅ Clear upload instructions
- ✅ Click to browse for JSON files
- ✅ File validation (must be .json)
- ✅ JSON format validation
- ✅ Success message with checkmark
- ✅ Error handling for invalid JSON

## API Endpoint

**POST** `/api/upload/csv`

Request:
```
FormData {
  file: File,
  domain: "finance"
}
```

Response:
```json
{
  "success": true,
  "message": "3 transactions uploaded for finance",
  "metadata": {
    "filename": "finance_1707173400000_transactions.json",
    "domain": "finance",
    "uploadedAt": "2026-02-07T...",
    "transactionCount": 3
  }
}
```

## Error Messages

- **"Only JSON files are supported"** - File must have .json extension
- **"Invalid JSON format"** - File contains invalid JSON syntax
- **"Invalid domain"** - Domain must be finance, mental, or physical
- **"No file provided"** - No file was selected
- **"Failed to upload file"** - Server error occurred

## Files Modified

1. **src/components/mosaic/DomainDrawer.tsx**
   - Updated file input to accept `.json`
   - Changed label text from "CSV" to "JSON"
   - Updated instructions
   - Same upload UI and state management

2. **src/app/api/upload/csv/route.ts**
   - Changed file validation to accept JSON only
   - Added JSON parsing and validation
   - Supports multiple JSON structures
   - Counts transactions intelligently

## Next Steps (Optional)

After uploading JSON files, you could:

1. **Parse the data** - Extract spending categories and trends
2. **Generate insights** - Use Gemini API to analyze spending
3. **Create visualizations** - Show spending by category
4. **Set budgets** - Help users set spending limits
5. **Detect anomalies** - Flag unusual transactions
6. **Predict trends** - Forecast future spending

## Testing with JSON

Create `test_transactions.json`:
```json
[
  { "date": "2026-01-30", "amount": 100, "category": "Food" },
  { "date": "2026-01-31", "amount": 150, "category": "Transport" },
  { "date": "2026-02-01", "amount": 200, "category": "Rent" }
]
```

Upload via Finance drawer and check `.data/uploads/finance/` for the file.

## Status

✅ **Complete and Working**
- Upload UI functional
- JSON validation implemented
- Multiple JSON format support
- File storage working
- Success feedback implemented
- Error handling in place
- Ready for further analysis integration
