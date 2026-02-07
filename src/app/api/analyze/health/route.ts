import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOADS_DIR = join(process.cwd(), '.data', 'uploads', 'physical');

interface HealthEntry {
  date: string;
  sleep_total_min?: number | null;
  sleep_efficiency?: number | null;
  hr_resting?: number | null;
  steps?: number | null;
  exercise_min?: number | null;
  active_energy_kcal?: number | null;
}

async function getLatestHealthFile(): Promise<{ path: string; data: HealthEntry[] } | null> {
  if (!existsSync(UPLOADS_DIR)) {
    return null;
  }

  try {
    const files = await readdir(UPLOADS_DIR);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    if (jsonFiles.length === 0) {
      return null;
    }

    // Sort by timestamp (files are named: physical_timestamp_name.json)
    const sortedFiles = jsonFiles.sort((a, b) => {
      const aTimestamp = parseInt(a.split('_')[1]);
      const bTimestamp = parseInt(b.split('_')[1]);
      return bTimestamp - aTimestamp;
    });

    const latestFile = sortedFiles[0];
    const filepath = join(UPLOADS_DIR, latestFile);

    const fileContent = await readFile(filepath, 'utf-8');
    let healthData: HealthEntry[] = [];

    try {
      const data = JSON.parse(fileContent);
      if (Array.isArray(data)) {
        healthData = data;
      } else if (data.entries && Array.isArray(data.entries)) {
        healthData = data.entries;
      } else if (data.data && Array.isArray(data.data)) {
        healthData = data.data;
      }
    } catch (parseError) {
      return null;
    }

    return { path: filepath, data: healthData };
  } catch (error) {
    console.error('Error reading health files:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('[/api/analyze/health] GET request received');
    
    // Fetch latest uploaded health file
    const fileData = await getLatestHealthFile();
    console.log('[/api/analyze/health] getLatestHealthFile result:', fileData ? `Found ${fileData.data.length} entries` : 'No file found');

    if (!fileData) {
      return NextResponse.json(
        {
          error: 'No health data found',
          message: 'Please upload a health/fitness JSON file from the Health drawer first',
        },
        { status: 404 }
      );
    }

    console.log(`Returning ${fileData.data.length} health entries from file: ${fileData.path}`);

    return NextResponse.json({
      success: true,
      health_data: fileData.data,
      data: {
        file: fileData.path,
        entryCount: fileData.data.length,
        dateRange: {
          start: fileData.data[0]?.date || 'N/A',
          end: fileData.data[fileData.data.length - 1]?.date || 'N/A',
        },
      },
    });
  } catch (error) {
    console.error('Error analyzing health:', error);
    return NextResponse.json(
      { error: 'Failed to analyze health data' },
      { status: 500 }
    );
  }
}
