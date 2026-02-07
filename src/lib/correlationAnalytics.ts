/**
 * Correlation Analysis - Physical Fitness vs Convenience Spending
 * 
 * Analyzes the relationship between daily fatigue levels and impulse spending.
 */

import { FitnessEntry } from './fitnessAnalytics';

export interface Transaction {
  date: string;
  category: string;
  amount: number;
  merchant?: string;
}

export interface CorrelationPoint {
  date: string;
  fatigueIndex: number;
  convenienceSpend: number;
}

export interface CorrelationAnalysis {
  points: CorrelationPoint[];
  correlation: number;
  riskZoneCount: number;
  averageFatigue: number;
  averageConvenienceSpend: number;
  trendLine: {
    slope: number;
    intercept: number;
  };
}

/**
 * Convenience spending categories
 */
const CONVENIENCE_CATEGORIES = [
  'dining',
  'delivery',
  'rideshare',
  'transportation',
  'entertainment',
  'shopping',
];

/**
 * Check if a category is a convenience/impulse category
 */
function isConvenienceCategory(category: string): boolean {
  return CONVENIENCE_CATEGORIES.some((conv) =>
    category.toLowerCase().includes(conv.toLowerCase())
  );
}

/**
 * Calculate daily fatigue index from fitness entry
 * Simplified version of the full analysis (for daily granularity)
 */
function calculateDailyFatigueIndex(entry: FitnessEntry): number {
  let score = 0;

  const sleepHours = entry.sleep_total_min / 60;

  // Sleep component (0-40 points)
  const sleepDiff = Math.abs(sleepHours - 8);
  const sleepPenalty = Math.min(40, (sleepDiff / 3) * 40);
  score += sleepPenalty;

  // Resting HR component (0-35 points)
  const hrDiff = Math.max(0, entry.hr_resting - 70);
  const hrPenalty = Math.min(35, (hrDiff / 30) * 35);
  score += hrPenalty;

  // Activity component (0-25 points)
  const activityDeficit = Math.max(0, 8000 - entry.steps);
  const activityPenalty = Math.min(25, (activityDeficit / 5000) * 25);
  score += activityPenalty;

  return Math.min(100, score);
}

/**
 * Calculate daily convenience spending from transactions
 */
function calculateDailyConvenienceSpend(
  dayTransactions: Transaction[]
): number {
  return dayTransactions
    .filter((t) => isConvenienceCategory(t.category))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

/**
 * Group transactions by date
 */
function groupTransactionsByDate(
  transactions: Transaction[]
): Map<string, Transaction[]> {
  const grouped = new Map<string, Transaction[]>();

  transactions.forEach((t) => {
    if (!grouped.has(t.date)) {
      grouped.set(t.date, []);
    }
    grouped.get(t.date)!.push(t);
  });

  return grouped;
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculatePearsonCorrelation(
  points: CorrelationPoint[]
): number {
  if (points.length < 2) return 0;

  const n = points.length;
  const xValues = points.map((p) => p.fatigueIndex);
  const yValues = points.map((p) => p.convenienceSpend);

  const meanX = xValues.reduce((a, b) => a + b, 0) / n;
  const meanY = yValues.reduce((a, b) => a + b, 0) / n;

  const numerator = points.reduce((sum, p) => {
    return sum + (p.fatigueIndex - meanX) * (p.convenienceSpend - meanY);
  }, 0);

  const sumSqX = xValues.reduce((sum, x) => sum + Math.pow(x - meanX, 2), 0);
  const sumSqY = yValues.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);

  const denominator = Math.sqrt(sumSqX * sumSqY);

  if (denominator === 0) return 0;

  return numerator / denominator;
}

/**
 * Calculate linear regression trend line
 */
function calculateTrendLine(
  points: CorrelationPoint[]
): { slope: number; intercept: number } {
  if (points.length < 2) {
    return { slope: 0, intercept: 0 };
  }

  const n = points.length;
  const xValues = points.map((p) => p.fatigueIndex);
  const yValues = points.map((p) => p.convenienceSpend);

  const meanX = xValues.reduce((a, b) => a + b, 0) / n;
  const meanY = yValues.reduce((a, b) => a + b, 0) / n;

  const numerator = points.reduce((sum, p) => {
    return sum + (p.fatigueIndex - meanX) * (p.convenienceSpend - meanY);
  }, 0);

  const denominator = xValues.reduce((sum, x) => {
    return sum + Math.pow(x - meanX, 2);
  }, 0);

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;

  return { slope, intercept };
}

/**
 * Analyze correlation between physical fitness and spending
 */
export function analyzeCorrelation(
  fitnessEntries: FitnessEntry[],
  transactions: Transaction[]
): CorrelationAnalysis | null {
  if (fitnessEntries.length === 0 || transactions.length === 0) {
    return null;
  }

  // Create fitness data map by date
  const fitnessMap = new Map<string, FitnessEntry>();
  fitnessEntries.forEach((entry) => {
    fitnessMap.set(entry.date, entry);
  });

  // Group transactions by date
  const transactionsByDate = groupTransactionsByDate(transactions);

  // Build correlation points
  const points: CorrelationPoint[] = [];

  fitnessMap.forEach((fitnessEntry, date) => {
    // Only include dates where we have transaction data
    if (!transactionsByDate.has(date)) {
      return;
    }

    const dayTransactions = transactionsByDate.get(date)!;
    const fatigueIndex = calculateDailyFatigueIndex(fitnessEntry);
    const convenienceSpend = calculateDailyConvenienceSpend(dayTransactions);

    points.push({
      date,
      fatigueIndex,
      convenienceSpend,
    });
  });

  // Need at least 2 points for correlation
  if (points.length < 2) {
    return null;
  }

  // Calculate statistics
  const correlation = calculatePearsonCorrelation(points);
  const trendLine = calculateTrendLine(points);

  const fatigueIndexes = points.map((p) => p.fatigueIndex);
  const spends = points.map((p) => p.convenienceSpend);

  const averageFatigue = fatigueIndexes.reduce((a, b) => a + b, 0) / points.length;
  const averageConvenienceSpend = spends.reduce((a, b) => a + b, 0) / points.length;

  // Count risk zone days (high fatigue + high spend)
  // Risk zone: fatigue > 60 AND spend > 75th percentile
  const spendsSorted = [...spends].sort((a, b) => a - b);
  const p75Spend = spendsSorted[Math.floor(spends.length * 0.75)];
  const riskZoneCount = points.filter(
    (p) => p.fatigueIndex > 60 && p.convenienceSpend > p75Spend
  ).length;

  return {
    points,
    correlation,
    riskZoneCount,
    averageFatigue,
    averageConvenienceSpend,
    trendLine,
  };
}

/**
 * Get correlation strength label
 */
export function getCorrelationLabel(correlation: number): string {
  const abs = Math.abs(correlation);
  if (abs < 0.2) return 'Very Weak';
  if (abs < 0.4) return 'Weak';
  if (abs < 0.6) return 'Moderate';
  if (abs < 0.8) return 'Strong';
  return 'Very Strong';
}

/**
 * Get direction label
 */
export function getDirectionLabel(correlation: number): string {
  if (correlation > 0) return 'Positive';
  if (correlation < 0) return 'Negative';
  return 'No';
}
