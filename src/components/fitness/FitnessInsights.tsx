'use client';

import { FitnessAnalytics, formatSleepHours, getRiskLabel, getCapacityLabel } from '@/lib/fitnessAnalytics';
import { GlassCard } from '@/components/ui/GlassCard';
import { AlertCircle, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface FitnessInsightsProps {
  analytics: FitnessAnalytics;
}

export const FitnessInsights = ({ analytics }: FitnessInsightsProps) => {
  const impulseFlagColor = analytics.impulseSusceptibilityFlag
    ? 'from-red-500/10 to-rose-500/10 border-red-500/20'
    : 'from-green-500/10 to-emerald-500/10 border-green-500/20';

  const riskLevel = getRiskLabel(analytics.convenienceSpendRisk);
  const capacityLevel = getCapacityLabel(analytics.planningCapacityScore);

  return (
    <div className="space-y-6">
      {/* Impulse Susceptibility Flag */}
      {analytics.impulseSusceptibilityFlag && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className={`p-4 border bg-gradient-to-br ${impulseFlagColor}`}>
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-text">⚠️ Impulse Risk Alert</p>
                <p className="text-sm text-muted">
                  Low sleep + high fatigue may increase impulse spending likelihood
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Sleep Quality */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
        >
          <GlassCard className="p-5 border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Sleep Quality
            </p>
            <p className="text-2xl font-bold text-text">{formatSleepHours(analytics.avgSleepHours)}</p>
            <p className="text-xs text-muted mt-2">Avg nightly</p>
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-xs text-muted">Consistency: <span className="text-text font-semibold">{Math.round(analytics.sleepConsistencyScore)}%</span></p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Convenience Spend Risk */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-5 border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Convenience Spend Risk
            </p>
            <p className="text-2xl font-bold text-text">{Math.round(analytics.convenienceSpendRisk)}%</p>
            <p className="text-xs text-amber-600 font-medium mt-2">{riskLevel} Risk</p>
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-xs text-muted">Fatigue index: <span className="text-text font-semibold">{Math.round(analytics.fatigueIndex)}</span></p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Planning Capacity */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <GlassCard className="p-5 border border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Planning Capacity
            </p>
            <p className="text-2xl font-bold text-text">{Math.round(analytics.planningCapacityScore)}%</p>
            <p className="text-xs text-green-600 font-medium mt-2">{capacityLevel}</p>
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-xs text-muted">Routine stability: <span className="text-text font-semibold">{Math.round(analytics.routineStabilityScore)}%</span></p>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Activity & Energy */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard className="p-5 border border-white/10">
          <h4 className="font-semibold text-text mb-4">Activity & Energy Baseline</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Daily Steps</span>
              <span className="text-sm font-semibold text-text">{Math.round(analytics.avgSteps).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Exercise Minutes</span>
              <span className="text-sm font-semibold text-text">{Math.round(analytics.avgExerciseMin)} min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Resting Heart Rate</span>
              <span className="text-sm font-semibold text-text">{Math.round(analytics.avgRestingHR)} bpm</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Activity Level Score</span>
              <span className="text-sm font-semibold text-text">{Math.round(analytics.activityLevelScore)}/100</span>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Low Energy Days */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <GlassCard className="p-5 border border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Low Energy Days</p>
              <p className="text-lg font-bold text-text">
                {Math.round(analytics.lowEnergyDaysPct)}%
                <span className="text-sm font-normal text-muted ml-2">({analytics.lowEnergyDaysCount} of {analytics.dateRange.dayCount} days)</span>
              </p>
              <p className="text-xs text-muted mt-2">
                Days with {'<'}7h sleep or {'<'}5k steps
              </p>
            </div>
            <TrendingDown
              size={24}
              className={analytics.lowEnergyDaysPct > 40 ? 'text-red-500' : 'text-amber-500'}
            />
          </div>
        </GlassCard>
      </motion.div>

      {/* Data Period */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassCard className="p-4 border border-white/5 text-center">
          <p className="text-xs text-muted">
            Data Period: {analytics.dateRange.start} to {analytics.dateRange.end} ({analytics.dateRange.dayCount} days)
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
};
