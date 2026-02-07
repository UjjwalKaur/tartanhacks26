# JSON File Upload Feature - Finance Domain

## Overview

Users can now upload transaction JSON files directly from the Finance domain drawer to analyze their spending patterns.

## How It Works

### User Flow
1. User clicks on the Finance mosaic tile
2. Domain drawer opens on the right side
3. User sees "Upload Transaction Data" section
4. User clicks the upload area and selects a JSON file
5. File is uploaded to the backend
6. Success message appears
7. File is saved and available for analysis

### Backend Process
1. **Endpoint:** `POST /api/upload/csv`
2. **Validation:**
   - Ensures file is JSON format
   - Validates JSON syntax
   - Validates domain (finance/mental/physical)
   - Checks file exists
3. **Storage:**
   - Creates `.data/uploads/` directory
   - Organizes by domain: `.data/uploads/finance/`
   - Saves with timestamp: `finance_1707173400000_transactions.json`
4. **Metadata:**
   - Counts transactions (array length or nested array length)
   - Logs upload info
   - Returns success response

## JSON Format Expected

The JSON file can be in several formats:

### Format 1: Array of transactions (simplest)
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
  }
]
```

### Format 2: Object with transactions array
```json
{
  "user": "john@example.com",
  "period": "2026-02",
  "transactions": [
    {
      "date": "2026-02-01",
      "amount": 50.00,
      "category": "Food"
    },
    {
      "date": "2026-02-02",
      "amount": 200.00,
      "category": "Rent"
    }
  ]
}
```

### Format 3: Object with data array
```json
{
  "account": "Checking",
  "data": [
    { "date": "2026-02-01", "amount": 100 },
    { "date": "2026-02-02", "amount": 150 }
  ]
}
```

### Minimal Format
```json
[
  { "date": "2026-01-30", "amount": 100 },
  { "date": "2026-01-31", "amount": 150 },
  { "date": "2026-02-01", "amount": 200 }
]
```

## File Storage Location

```
.data/
└── uploads/
    ├── finance/
    │   ├── finance_1707173400000_transactions.json
    │   └── finance_1707173500000_expenses.json
    ├── mental/
    └── physical/
```

## Current Features

✅ File upload UI in Finance drawer
✅ JSON file validation
✅ Multiple JSON format support (array, nested objects)
✅ Timestamp-based naming to prevent conflicts
✅ Transaction counting from various JSON structures
✅ Success feedback to user
✅ Error handling with user messages
✅ Organized storage by domain
✅ Detailed error messages for invalid JSON

## Future Enhancements

- [ ] Parse JSON and extract spending categories
- [ ] Calculate spending trends
- [ ] Integrate with Gemini API for financial advice
- [ ] Show uploaded files list
- [ ] Delete/re-upload functionality
- [ ] JSON template download
- [ ] Bank account integration
- [ ] Recurring transaction detection

## Testing

### Upload a Test JSON File

1. Create a file called `test_transactions.json`:
```json
[
  {
    "date": "2026-01-30",
    "amount": 45.00,
    "category": "Food",
    "merchant": "Starbucks"
  },
  {
    "date": "2026-01-31",
    "amount": 120.00,
    "category": "Transportation",
    "merchant": "Shell"
  },
  {
    "date": "2026-02-01",
    "amount": 1500.00,
    "category": "Housing",
    "merchant": "Landlord"
  },
  {
    "date": "2026-02-02",
    "amount": 200.00,
    "category": "Entertainment",
    "merchant": "AMC"
  },
  {
    "date": "2026-02-03",
    "amount": 89.50,
    "category": "Utilities",
    "merchant": "Electric Co"
  }
]
```

2. Go to http://localhost:3000/dashboard
3. Click the Finance tile
4. Click "Click to upload JSON"
5. Select the test file
6. Verify success message appears
7. Check `.data/uploads/finance/` for the saved file

## Error Handling

- **No file selected:** Message shown, nothing uploaded
- **Wrong file type:** Error alert shown (must be .json)
- **Invalid JSON:** Error alert shown with parse message
- **Invalid domain:** 400 error returned
- **Server error:** 500 error returned with message
- **Network error:** Browser handles gracefully

## Files Modified

- ✅ `src/components/mosaic/DomainDrawer.tsx` - Added upload UI
- ✅ `src/app/api/upload/csv/route.ts` - JSON file endpoint
- ✅ `.gitignore` - Already excludes `.data/`

## Environment Variables

None required! File uploads work out of the box.

## Security Notes

⚠️ Current implementation:
- No file size limits (add in production!)
- No virus scanning
- Files stored in plain text
- No authentication check (add in production!)
- No JSON schema validation (add in production!)

For production, consider:
- File size limits (max 10MB)
- Virus scanning integration
- Encryption at rest
- User authentication
- JSON schema validation
- Rate limiting
- Content sanitization
