# Gemini Insights Display - Implementation Guide

## What's Changed

### 1. **Updated QuickCheckIn Component** (`src/components/mosaic/QuickCheckIn.tsx`)
   - Added state to store `geminiInsight`
   - Updated `handleSubmit` to capture the Gemini analysis from the API response
   - Added a beautiful insight card that displays after submission
   - Shows the AI analysis with a Sparkles icon and purple gradient styling
   - Insight displays for 6 seconds before disappearing

### 2. **Updated API Client** (`src/lib/apiClient.ts`)
   - Modified `createCheckIn()` to return both the check-in record AND the Gemini analysis
   - Returns: `{ checkIn: CheckInRecord, analysis: string | null }`

## How It Works

**When a user submits a check-in:**

1. Form data (stress, energy, notes) is sent to `/api/checkins`
2. Backend saves the data to `.data/checkins.json`
3. Backend sends the data to Gemini API with analysis prompt
4. Gemini returns AI insights about the check-in
5. Frontend receives both the saved check-in and the analysis
6. Analysis is displayed in a beautiful card under the success message

## Visual Flow

```
User fills form
     ↓
Clicks "Submit Check-In"
     ↓
"Submitting..." button state
     ↓
API response received
     ↓
✓ Green success message appears ("Check-in saved successfully!")
✓ Purple AI Insight card appears (if Gemini API is configured)
     ↓
Both messages fade after a few seconds
```

## What You Need to Do

1. **Add your Gemini API key** to `.env.local`:
   ```
   GEMINI_API_KEY=your_key_here
   ```
   Get one at: https://makersuite.google.com/app/apikey

2. **Restart your dev server** (already done via npm run dev)

3. **Test it out!**
   - Go to your dashboard
   - Fill in the Quick Check-In form
   - Submit it
   - You should see both the success message AND an AI insight card

## Example Insight

When you submit a check-in with:
- Stress: 7/5
- Energy: 2/5
- Notes: "Feeling overwhelmed with deadlines"

Gemini might respond with:
> "Your high stress level combined with low energy suggests burnout risk. Consider taking short breaks every hour and prioritizing tasks by urgency. Delegate if possible to reduce workload."

## Styling

The insight card uses:
- Purple gradient background (`from-purple-500/10 to-blue-500/10`)
- Subtle border with transparency
- Sparkles icon in purple
- Smooth fade-in animation via Framer Motion
- Responsive padding and spacing

## Troubleshooting

**If insights aren't showing:**
1. Check browser console for errors
2. Verify `.env.local` has the `GEMINI_API_KEY`
3. Check network tab - is the API call succeeding?
4. Look at server logs for Gemini API errors

**If you see "Failed to create check-in":**
1. Ensure `.env.local` has the key
2. Verify the Gemini API key is valid
3. Check that the backend endpoint is responding
