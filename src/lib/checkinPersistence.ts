import { promises as fs } from 'fs';
import path from 'path';
import { Checkin } from '@/types/checkin';

const DATA_DIR = path.join(process.cwd(), '.data', 'checkins');
const CHECKINS_FILE = path.join(DATA_DIR, 'checkins.json');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

async function readCheckinsFile(): Promise<Checkin[]> {
  try {
    await ensureDataDir();
    const content = await fs.readFile(CHECKINS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet, return empty array
      return [];
    }
    throw error;
  }
}

async function writeCheckinsFile(checkins: Checkin[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(CHECKINS_FILE, JSON.stringify(checkins, null, 2), 'utf-8');
}

export async function getAllCheckins(): Promise<Checkin[]> {
  return readCheckinsFile();
}

export async function appendCheckin(checkin: Checkin): Promise<Checkin> {
  const checkins = await readCheckinsFile();
  
  // Check if checkin for this date already exists and replace it
  const existingIndex = checkins.findIndex(
    (c) => c.date_of_checkin === checkin.date_of_checkin
  );
  
  if (existingIndex >= 0) {
    checkins[existingIndex] = checkin;
  } else {
    checkins.push(checkin);
  }
  
  // Sort by date
  checkins.sort(
    (a, b) =>
      new Date(b.date_of_checkin).getTime() -
      new Date(a.date_of_checkin).getTime()
  );
  
  await writeCheckinsFile(checkins);
  return checkin;
}
