# FileRegistry Implementation & Patterns Page Integration

## Overview

Implemented a lightweight, centralized file management system (`FileRegistry`) that enables different tabs/pages to upload files and collectively access them across the application. The Patterns page now serves as the central analytics dashboard displaying uploaded files and their computed analytics.

---

## Architecture

### 1. **FileRegistry Context** (`/src/store/fileRegistry.tsx`)

**Purpose**: Centralized file tracking and access across all domains

**Key Features**:
- **In-Memory File Storage**: Maintains `Map<FileKey, File>` for quick access to File objects
- **Persistent Metadata**: Stores `Map<FileKey, FileRef>` in localStorage under key `"mosaic:fileRegistry"`
- **Object URL Management**: Creates/revokes blob URLs for file access
- **Hydration Safety**: Uses `isHydrated` flag to prevent race conditions on mount

**Types**:
```typescript
export type FileKey = 'finance_json' | 'transactions_csv' | 'health_csv' | 'checkins_csv';

export interface FileRef {
  key: FileKey;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  uploadedAt: number;
  objectUrl?: string;
}
```

**Context API**:
```typescript
interface FileRegistryContextType {
  fileRefs: Map<FileKey, FileRef>;           // Metadata (localStorage-persisted)
  files: Map<FileKey, File>;                 // In-memory File objects
  setFile(key, file): void;                  // Register a file
  getFile(key): File | undefined;            // Retrieve by key
  getFileRef(key): FileRef | undefined;      // Get metadata
  getAllFiles(): Array<{key, file}>;         // Get all active files
  clearFile(key): void;                      // Remove + revoke URL
  clearAll(): void;                          // Clear everything
  isHydrated: boolean;                       // Mount status flag
}
```

**localStorage Structure**:
```json
{
  "mosaic:fileRegistry": [
    ["finance_json", { "key": "finance_json", "name": "...", "size": 2048, ... }],
    ["transactions_csv", { "key": "transactions_csv", "name": "...", ... }]
  ]
}
```

---

## Components

### 2. **FileRegistryStatus** (`/src/components/registry/FileRegistryStatus.tsx`)

**Purpose**: Display registered files with status indicators

**Features**:
- Shows file list with metadata (name, size, upload date)
- **Status Badges**:
  - ✅ **Ready** (green): File object in memory
  - ⚠️ **Re-upload Required** (amber): FileRef exists but File object missing (stale after refresh)
- Empty state with helpful message
- Animated cards with staggered delays
- Color-coded borders based on status

**Usage**:
```tsx
<FileRegistryStatus />
```

**Output**:
```
Uploaded Files (2 files)
├─ finance_transactions.json (245.3 KB) | Ready ✅
└─ health_metrics.csv (18.5 KB) | Re-upload Required ⚠️
```

---

### 3. **FileViewer** (`/src/components/registry/FileViewer.tsx`)

**Purpose**: Interactive file browser with detailed metadata

**Features**:
- Grid of file cards (clickable for details)
- Selected file shows:
  - File type (MIME)
  - Size in KB
  - Upload date
- Empty state guidance
- Motion animations

**Usage**:
```tsx
<FileViewer />
```

**UI Flow**:
1. Click a file card → highlights with purple border
2. Details panel expands below
3. Click again to collapse

---

### 4. **AnalyticsFromRegistry** (`/src/components/registry/AnalyticsFromRegistry.tsx`)

**Purpose**: Automatically compute and display analytics from registered files

**Features**:
- Reads `finance_json` file from FileRegistry
- Parses transaction JSON data
- Calls `analyzeSpending()` utility to compute analytics
- Displays full spending analytics:
  - `FinanceInsights` (summary stats + insights)
  - `CategorySpendChart` (pie chart)
  - `EssentialVsDiscretionaryChart` (pie chart)
- Error handling for invalid/missing data
- Loading states during analysis

**Usage**:
```tsx
<AnalyticsFromRegistry />
```

**Data Flow**:
```
FileRegistry (files.get('finance_json'))
    ↓
Read file as JSON
    ↓
Parse { transactions, startDate, endDate }
    ↓
analyzeSpending() utility
    ↓
SpendingAnalytics object
    ↓
Display charts & insights
```

---

## Integration Points

### 5. **FinanceDrawer Integration** (`/src/components/mosaic/FinanceDrawer.tsx`)

**Updated to Register Files**:
```typescript
const { setFile } = useFileRegistry();

const handleUploadClick = async () => {
  // ... upload logic ...
  setFile('finance_json', selectedFile);  // ← Registers in FileRegistry
};
```

**Flow**:
1. User selects file in Finance tab
2. File uploaded to `/api/upload/csv`
3. Backend computes `SpendingAnalytics`
4. FinanceDrawer calls `setFile('finance_json', selectedFile)`
5. File appears in FileRegistry
6. Patterns page reads from registry and displays

---

### 6. **Patterns Page** (`/src/app/patterns/page.tsx`)

**Enhanced with File Management Sections**:

```tsx
<div className="space-y-8">
  {/* File Upload Status */}
  <FileRegistryStatus />
  
  {/* File Browser */}
  <FileViewer />
  
  {/* Analytics Dashboard */}
  <AnalyticsFromRegistry />
  
  {/* Existing Insights Panel */}
  <InsightsPanel insights={data.insights} />
</div>
```

**New Sections** (in order of appearance):
1. **Uploaded Data** - FileRegistryStatus (shows all registered files)
2. **Active Files** - FileViewer (interactive file details)
3. **Spending Analytics** - AnalyticsFromRegistry (charts & insights)
4. **Top Patterns** - InsightsPanel (existing dashboard insights)

---

### 7. **App Providers** (`/src/app/providers.tsx`)

**Updated Provider Hierarchy**:
```tsx
<QueryClientProvider client={queryClient}>
  <FileRegistryProvider>           {/* ← NEW: File registry context */}
    <FinanceProvider>              {/* ← Finance analytics state */}
      <AppShell>{children}</AppShell>
    </FinanceProvider>
  </FileRegistryProvider>
</QueryClientProvider>
```

**Provider Order Rationale**:
- QueryClient first (data fetching)
- FileRegistry second (global file state)
- FinanceProvider third (finance-specific state)
- AppShell last (consumes all context)

---

## File Upload Flow

### Complete End-to-End Journey

```
1. USER UPLOADS FILE (Finance Tab)
   ↓
2. FinanceDrawer.handleUploadClick()
   - Selects file from input
   - Calls /api/upload/csv with file
   ↓
3. Upload API (/api/upload/csv)
   - Validates JSON format
   - Extracts transactions array
   - Calls analyzeSpending()
   - Returns { success, metadata, analytics }
   ↓
4. FinanceDrawer.setFile()
   - Calls FileRegistry.setFile('finance_json', file)
   - Creates Object URL
   - Stores FileRef metadata in localStorage
   - Stores File object in memory
   ↓
5. USER NAVIGATES TO PATTERNS
   - FileRegistryStatus: Shows "Ready ✅" badge
   - FileViewer: Allows inspection of file details
   - AnalyticsFromRegistry: Reads file, displays charts
   ↓
6. ANALYTICS DISPLAY
   - FinanceInsights: Total spend, top category, subscriptions
   - CategorySpendChart: Spending by category (pie chart)
   - EssentialVsDiscretionaryChart: Essential vs discretionary (pie chart)
```

---

## Key Features & Behaviors

### File Persistence
- **FileRef** (metadata) persists across page refreshes via localStorage
- **File** objects are in-memory only (lost on refresh)
- UI shows "Re-upload Required ⚠️" when FileRef exists but File object is missing

### Multi-Domain Support
FileKeys currently defined (extensible):
- `'finance_json'` - Spending transactions (active)
- `'transactions_csv'` - Additional transactions (ready)
- `'health_csv'` - Health metrics (ready)
- `'checkins_csv'` - Check-in data (ready)

### Object URL Lifecycle
```typescript
// Created when file registered
setFile(key, file) → URL.createObjectURL(file)

// Stored in FileRef for potential streaming access
fileRef.objectUrl = blob:http://localhost:3001/...

// Revoked when file cleared
clearFile(key) → URL.revokeObjectURL(ref.objectUrl)
```

### Error Handling
- Invalid JSON format → "Invalid transaction data format"
- Empty transactions → "Invalid transaction data format"
- Missing fields → spendingAnalytics returns null
- Graceful degradation with helpful error messages

---

## Usage Examples

### From a Component (e.g., Finance Tab)

```tsx
import { useFileRegistry } from '@/store/fileRegistry';

export const FinanceDomain = () => {
  const { setFile, getFile } = useFileRegistry();
  
  const handleUpload = (file: File) => {
    setFile('finance_json', file);  // Register file
  };
  
  const viewFile = () => {
    const file = getFile('finance_json');
    if (file) {
      const text = await file.text();
      console.log(JSON.parse(text));
    }
  };
  
  return (
    <>
      <button onClick={() => handleUpload(selectedFile)}>Upload</button>
      <button onClick={viewFile}>View</button>
    </>
  );
};
```

### Patterns Page (Analytics Dashboard)

```tsx
import { FileRegistryStatus } from '@/components/registry/FileRegistryStatus';
import { AnalyticsFromRegistry } from '@/components/registry/AnalyticsFromRegistry';

export default function PatternsPage() {
  return (
    <div>
      <FileRegistryStatus />          {/* Shows upload status */}
      <AnalyticsFromRegistry />       {/* Shows computed analytics */}
    </div>
  );
}
```

---

## Technical Debt & Future Improvements

### Short-term (Recommended)
1. ✅ **File Type Validation** - Currently only finance_json, extend to CSV types
2. ✅ **Batch Analytics** - Compute analytics for multiple files simultaneously
3. ⏳ **File Deletion UI** - Add "Remove File" button in FileRegistryStatus
4. ⏳ **File History** - Track file upload timeline in analytics panel

### Medium-term
1. **Advanced Filtering** - Filter analytics by date range
2. **Cross-Domain Analysis** - Correlate finance data with health/checkins
3. **Export Functionality** - Download analytics as CSV/PDF
4. **File Comparisons** - Compare two uploads side-by-side

### Long-term
1. **Real-time Updates** - WebSocket for live file uploads
2. **Collaborative Mode** - Multi-user file sharing
3. **Advanced Analytics** - ML-based pattern detection
4. **Data Compression** - Handle large files more efficiently

---

## Testing Checklist

- [ ] Upload finance_json file from Finance tab
- [ ] Verify "Ready ✅" badge appears in FileRegistryStatus
- [ ] Click file in FileViewer to see details
- [ ] Navigate to Patterns page
- [ ] Verify AnalyticsFromRegistry displays charts
- [ ] Refresh page, check "Re-upload Required ⚠️" appears
- [ ] Upload another file (different domain)
- [ ] Verify multiple files displayed in FileRegistryStatus
- [ ] Test localStorage persistence across sessions
- [ ] Test error handling with invalid JSON

---

## File Structure

```
src/
├── components/
│   ├── registry/                          [NEW]
│   │   ├── FileRegistryStatus.tsx         - File list with status badges
│   │   ├── FileViewer.tsx                 - Interactive file browser
│   │   └── AnalyticsFromRegistry.tsx      - Analytics display from files
│   ├── finance/
│   │   ├── SpendingCharts.tsx
│   │   └── FinanceInsights.tsx
│   └── mosaic/
│       ├── FinanceDrawer.tsx              [UPDATED] - Registers files on upload
│       └── AppShell.tsx
├── store/
│   ├── fileRegistry.tsx                   [NEW] - FileRegistry context
│   └── financeContext.tsx                 [UPDATED] - Added to providers
├── lib/
│   ├── spendingAnalytics.ts               - Core analysis engine
│   └── api.ts
├── app/
│   ├── providers.tsx                      [UPDATED] - FileRegistry provider
│   └── patterns/
│       └── page.tsx                       [UPDATED] - Integrated FileRegistry components
```

---

## Configuration

### localStorage Key
```typescript
const STORAGE_KEY = 'mosaic:fileRegistry';
```

### File Type Support
```typescript
type FileKey = 'finance_json' | 'transactions_csv' | 'health_csv' | 'checkins_csv';
```

### Supported MIME Types
- `application/json` - JSON transaction files
- `text/csv` - CSV data files

---

## API Endpoints Used

### Upload Endpoint
- **Route**: `/api/upload/csv`
- **Method**: POST
- **Input**: FormData with file field
- **Output**: `{ success, message, metadata, analytics }`
- **Integration**: FinanceDrawer calls this on file select

---

## Conclusion

The FileRegistry implementation provides:
✅ Centralized file management
✅ Cross-domain file access
✅ Persistent metadata tracking
✅ Safe Object URL lifecycle management
✅ Seamless Patterns page integration
✅ Clear UI feedback (Ready/Re-upload states)
✅ Foundation for multi-file analytics

The Patterns page now serves as a unified analytics dashboard where users can:
- View upload status for all registered files
- Inspect file details interactively
- See computed spending analytics automatically
- Track patterns and insights across their data
