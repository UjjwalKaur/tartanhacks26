# Backend Setup Guide

## What's Been Set Up

Your app now has:

1. **File-based Database** (`src/lib/database.ts`)
   - Stores check-in data in `.data/checkins.json`
   - Data persists between sessions

2. **API Endpoint** (`src/app/api/checkins/route.ts`)
   - POST endpoint at `/api/checkins`
   - Accepts check-in data
   - Sends data to Gemini API for analysis
   - Returns the saved check-in and AI analysis

3. **Updated API Client** (`src/lib/apiClient.ts`)
   - `createCheckIn()` now uses the real backend endpoint
   - Data is stored and analyzed

## Setup Steps

1. **Get a Gemini API Key**
   - Go to https://makersuite.google.com/app/apikey
   - Create a new API key
   - Copy the key

2. **Add API Key to Environment**
   - Open `.env.local` in your project root
   - Replace `your_gemini_api_key_here` with your actual API key
   - The file is gitignored, so it won't be committed

3. **Restart Your Dev Server**
   ```bash
   npm run dev
   ```

## How It Works

### When a User Submits a Check-in:

1. Frontend sends check-in data to `/api/checkins`
2. Backend saves it to `.data/checkins.json`
3. Backend sends the data to Gemini API with a prompt
4. Gemini analyzes the risk and provides recommendations
5. Response is sent back to frontend with:
   - `checkIn`: The saved check-in record
   - `analysis`: Gemini's AI analysis

### Check-in Data Structure:
```json
{
  "id": "ci-1707173400000",
  "createdAt": "2026-02-06T...",
  "domain": "work",
  "riskLevel": 7,
  "notes": "Feeling overwhelmed with deadlines"
}
```

## Data Location

- Check-ins are stored in: `.data/checkins.json`
- This directory is gitignored (won't be committed)
- Data persists locally on your machine

## Testing

1. Start the dev server: `npm run dev`
2. Go to http://localhost:3000
3. Submit a check-in
4. Check the console for any errors
5. The data should appear in `.data/checkins.json`

## Next Steps

- Modify the Gemini prompt in `/src/app/api/checkins/route.ts` for better analysis
- Add error handling UI
- Display Gemini analysis on the frontend
- Add a `/api/checkins/get` endpoint to retrieve stored check-ins
