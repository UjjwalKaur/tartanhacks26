import fs from 'fs';
import path from 'path';

// Simple file-based storage for check-ins
const DATA_DIR = path.join(process.cwd(), '.data');
const CHECKINS_FILE = path.join(DATA_DIR, 'checkins.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load all check-ins from file
export function loadCheckIns() {
  ensureDataDir();
  if (!fs.existsSync(CHECKINS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(CHECKINS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save check-ins to file
export function saveCheckIns(checkIns: any[]) {
  ensureDataDir();
  fs.writeFileSync(CHECKINS_FILE, JSON.stringify(checkIns, null, 2));
}

// Add a new check-in
export function addCheckIn(checkIn: any) {
  const checkIns = loadCheckIns();
  const newCheckIn = {
    id: `ci-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...checkIn,
  };
  checkIns.unshift(newCheckIn);
  saveCheckIns(checkIns);
  return newCheckIn;
}

// Get all check-ins
export function getAllCheckIns() {
  return loadCheckIns();
}
