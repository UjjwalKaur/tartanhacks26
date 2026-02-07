/**
 * Fitness Analytics - Finance-Linked Health Metrics
 * 
 * Computes deterministic health metrics with direct finance implications:
 * - Sleep quality → decision-making capacity
 * - Activity consistency → impulse control
 * - Energy levels → spending risk
 */

export interface FitnessEntry {
  date: string;
  sleep_total_min: number;
  sleep_efficiency: number;
  hr_resting: number;
  steps: number;
  exercise_min: number;
  active_energy_kcal: number;
}

export interface FitnessAnalytics {
  // Sleep Metrics
  avgSleepHours: number;
  sleepConsistencyScore: number;
  
  // Activity Metrics
  avgSteps: number;
  avgExerciseMin: number;
  avgRestingHR: number;
  avgActiveEnergyKcal: number;
  
  // Fatigue Index (0-100 scale)
  fatigueIndex: number;
  
  // Low Energy Assessment
  lowEnergyDaysPct: number;
  lowEnergyDaysCount: number;
  
  // Routine & Stability
  routineStabilityScore: number;
  
  // Activity Level
  activityLevelScore: number;
  
  // Finance-Linked Signals
  convenienceSpendRisk: number; // 0-100 scale
  planningCapacityScore: number; // 0-100 scale
  impulseSusceptibilityFlag: boolean;
  
  // Summary
  dateRange: {
    start: string;
    end: string;
    dayCount: number;
  };
}

/**
 * Calculate mean of a numeric array
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate variance of a numeric array
 */
function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map((val) => Math.pow(val - avg, 2));
  return mean(squaredDiffs);
}

/**
 * Calculate standard deviation
 */
function stdDev(values: number[]): number {
  return Math.sqrt(variance(values));
}

/**
 * Calculate consistency score as inverse variance
 * Higher score = more consistent
 * Uses coefficient of variation (CV) to normalize
 * Formula: 100 / (1 + CV) where CV = stdDev / mean
 */
function consistencyScore(values: number[], minValue: number = 1): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  
  // Avoid division by zero
  if (avg < minValue) return 0;
  
  const cv = stdDev(values) / avg;
  
  // Scale so that CV=0.1 (very consistent) → score≈91
  // and CV=0.5 (inconsistent) → score≈67
  const score = 100 / (1 + cv);
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate fatigue index based on:
 * - Sleep duration (< 7h is indicator)
 * - Resting heart rate (elevated = stress/fatigue)
 * - Activity level (low steps = low energy)
 */
function calculateFatigueIndex(
  avgSleepHours: number,
  avgRestingHR: number,
  avgSteps: number
): number {
  let score = 0;

  // Sleep component (0-40 points)
  // Optimal: 7-9 hours
  // Max penalty at < 5 hours or > 10 hours
  const sleepDiff = Math.abs(avgSleepHours - 8);
  const sleepPenalty = Math.min(40, (sleepDiff / 3) * 40);
  score += sleepPenalty;

  // Resting HR component (0-35 points)
  // Optimal: 60-70 bpm
  // Elevated HR (> 80) indicates stress/poor recovery
  const hrdiff = Math.max(0, avgRestingHR - 70);
  const hrPenalty = Math.min(35, (hrdiff / 30) * 35);
  score += hrPenalty;

  // Activity component (0-25 points)
  // Optimal: > 8000 steps/day
  // Low activity (< 5000) indicates low energy
  const activityDeficit = Math.max(0, 8000 - avgSteps);
  const activityPenalty = Math.min(25, (activityDeficit / 5000) * 25);
  score += activityPenalty;

  return Math.min(100, score);
}

/**
 * Calculate low energy days percentage
 * A day is "low energy" if:
 * - Sleep < 7 hours, OR
 * - Steps < 5000 (very sedentary)
 */
function calculateLowEnergyDaysPct(entries: FitnessEntry[]): {
  pct: number;
  count: number;
} {
  if (entries.length === 0) return { pct: 0, count: 0 };

  const lowEnergyCount = entries.filter((entry) => {
    const sleepHours = entry.sleep_total_min / 60;
    return sleepHours < 7 || entry.steps < 5000;
  }).length;

  return {
    pct: (lowEnergyCount / entries.length) * 100,
    count: lowEnergyCount,
  };
}

/**
 * Calculate activity level score
 * Combines normalized steps and exercise minutes
 * Both normalized to 0-100 scale
 */
function calculateActivityLevelScore(avgSteps: number, avgExerciseMin: number): number {
  // Steps: 0 steps = 0 score, 15000+ steps = 100 score
  const stepsScore = Math.min(100, (avgSteps / 15000) * 100);

  // Exercise: 0 min = 0 score, 60+ min = 100 score
  const exerciseScore = Math.min(100, (avgExerciseMin / 60) * 100);

  // Weighted average: 60% steps, 40% exercise
  return stepsScore * 0.6 + exerciseScore * 0.4;
}

/**
 * Calculate convenience spend risk
 * Higher fatigue and low energy → more convenience spending
 * Formula: average of fatigueIndex and lowEnergyDaysPct
 */
function calculateConvenienceSpendRisk(
  fatigueIndex: number,
  lowEnergyDaysPct: number
): number {
  return (fatigueIndex + lowEnergyDaysPct) / 2;
}

/**
 * Calculate planning capacity score
 * Inverse of convenience spend risk
 * High sleep consistency + routine stability = better planning
 */
function calculatePlanningCapacityScore(
  sleepConsistencyScore: number,
  routineStabilityScore: number
): number {
  return (sleepConsistencyScore + routineStabilityScore) / 2;
}

/**
 * Determine impulse susceptibility flag
 * True if: avgSleepHours < 6.5 AND fatigueIndex > 60
 */
function calculateImpulseSusceptibility(
  avgSleepHours: number,
  fatigueIndex: number
): boolean {
  return avgSleepHours < 6.5 && fatigueIndex > 60;
}

/**
 * Main analytics computation function
 */
export function analyzeFitness(entries: FitnessEntry[]): FitnessAnalytics | null {
  if (!entries || entries.length === 0) {
    return null;
  }

  // Extract metrics
  const sleepMinutes = entries.map((e) => e.sleep_total_min);
  const restingHRs = entries.map((e) => e.hr_resting);
  const stepsList = entries.map((e) => e.steps);
  const exerciseMinsList = entries.map((e) => e.exercise_min);
  const activeEnergyList = entries.map((e) => e.active_energy_kcal);

  // Basic statistics
  const avgSleepHours = mean(sleepMinutes) / 60;
  const avgRestingHR = mean(restingHRs);
  const avgSteps = mean(stepsList);
  const avgExerciseMin = mean(exerciseMinsList);
  const avgActiveEnergyKcal = mean(activeEnergyList);

  // Consistency scores
  const sleepConsistencyScore = consistencyScore(sleepMinutes, 60);
  const routineStabilityScore = (
    consistencyScore(sleepMinutes, 60) + consistencyScore(stepsList, 1000)
  ) / 2;

  // Fatigue and energy assessment
  const fatigueIndex = calculateFatigueIndex(avgSleepHours, avgRestingHR, avgSteps);
  const { pct: lowEnergyDaysPct, count: lowEnergyDaysCount } =
    calculateLowEnergyDaysPct(entries);

  // Activity score
  const activityLevelScore = calculateActivityLevelScore(avgSteps, avgExerciseMin);

  // Finance-linked signals
  const convenienceSpendRisk = calculateConvenienceSpendRisk(fatigueIndex, lowEnergyDaysPct);
  const planningCapacityScore = calculatePlanningCapacityScore(
    sleepConsistencyScore,
    routineStabilityScore
  );
  const impulseSusceptibilityFlag = calculateImpulseSusceptibility(
    avgSleepHours,
    fatigueIndex
  );

  // Date range
  const sortedDates = entries.map((e) => e.date).sort();
  const dateRange = {
    start: sortedDates[0],
    end: sortedDates[sortedDates.length - 1],
    dayCount: entries.length,
  };

  return {
    avgSleepHours,
    sleepConsistencyScore,
    avgSteps,
    avgExerciseMin,
    avgRestingHR,
    avgActiveEnergyKcal,
    fatigueIndex,
    lowEnergyDaysPct,
    lowEnergyDaysCount,
    routineStabilityScore,
    activityLevelScore,
    convenienceSpendRisk,
    planningCapacityScore,
    impulseSusceptibilityFlag,
    dateRange,
  };
}

/**
 * Format sleep hours for display
 */
export function formatSleepHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

/**
 * Get risk assessment label
 */
export function getRiskLabel(score: number): string {
  if (score < 20) return 'Low';
  if (score < 40) return 'Moderate';
  if (score < 60) return 'Elevated';
  if (score < 80) return 'High';
  return 'Very High';
}

/**
 * Get capacity assessment label
 */
export function getCapacityLabel(score: number): string {
  if (score < 30) return 'Low';
  if (score < 50) return 'Moderate';
  if (score < 70) return 'Good';
  if (score < 85) return 'Strong';
  return 'Excellent';
}
