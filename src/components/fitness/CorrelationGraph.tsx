'use client';

import { CorrelationAnalysis } from '@/lib/correlationAnalytics';
import { GlassCard } from '@/components/ui/GlassCard';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
  ReferenceLine,
} from 'recharts';

interface CorrelationGraphProps {
  analysis: CorrelationAnalysis;
}

/**
 * Interpret correlation strength
 */
function getCorrelationLabel(r: number): string {
  const absR = Math.abs(r);
  if (absR < 0.3) return 'Weak';
  if (absR < 0.5) return 'Moderate';
  if (absR < 0.7) return 'Strong';
  return 'Very Strong';
}

/**
 * Interpret correlation direction
 */
function getCorrelationDirection(r: number): string {
  if (r > 0.1) return 'Positive (higher fatigue → higher spending)';
  if (r < -0.1) return 'Negative (higher fatigue → lower spending)';
  return 'No correlation';
}

export const CorrelationGraph = ({ analysis }: CorrelationGraphProps) => {
  if (!analysis.points || analysis.points.length === 0) {
    return (
      <GlassCard className="p-6 border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-text mb-1">Insufficient Data</h4>
            <p className="text-sm text-muted">
              Upload both fitness and transaction data to see correlation analysis.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Calculate axis ranges for better visualization
  const maxFatigue = Math.max(...analysis.points.map((p) => p.fatigueIndex)) * 1.1;
  const maxSpend = Math.max(...analysis.points.map((p) => p.convenienceSpend)) * 1.1;

  // Create trend line data for display
  const trendLineData = [
    {
      x: 0,
      y: analysis.trendLine.intercept,
    },
    {
      x: maxFatigue * 0.9,
      y: analysis.trendLine.intercept + analysis.trendLine.slope * (maxFatigue * 0.9),
    },
  ];

  const correlationLabel = getCorrelationLabel(analysis.correlation);
  const correlationDirection = getCorrelationDirection(analysis.correlation);
  const riskPercentage = (analysis.riskZoneCount / analysis.points.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-text">Physical Fatigue vs Convenience Spending</h3>
        <p className="text-sm text-muted mt-2">
          Each point represents one day from your uploaded data.
        </p>
      </div>

      {/* Chart */}
      <GlassCard className="p-6 border border-white/10">
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 60 }}>
            {/* Risk Zone Background (high fatigue + high spend) */}
            <defs>
              <pattern
                id="riskZonePattern"
                x="0"
                y="0"
                width="100%"
                height="100%"
                patternUnits="userSpaceOnUse"
              >
                <rect width="100%" height="100%" fill="rgba(239, 68, 68, 0.05)" />
              </pattern>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke)" />
            <XAxis
              type="number"
              dataKey="fatigueIndex"
              name="Fatigue Index"
              unit=""
              domain={[0, maxFatigue]}
              tick={{ fill: 'var(--muted)', fontSize: 12 }}
              stroke="var(--stroke)"
              label={{ value: 'Fatigue Index (0-100)', position: 'insideBottomRight', offset: -10, fill: 'var(--muted)' }}
            />
            <YAxis
              type="number"
              dataKey="convenienceSpend"
              name="Convenience Spend ($)"
              unit="$"
              domain={[0, maxSpend]}
              tick={{ fill: 'var(--muted)', fontSize: 12 }}
              stroke="var(--stroke)"
              label={{ value: 'Daily Spending ($)', angle: -90, position: 'insideLeftTop', offset: 10, fill: 'var(--muted)' }}
            />

            {/* Trend Line */}
            <Line
              type="monotone"
              dataKey="y"
              data={trendLineData}
              stroke="var(--risk-med-solid)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Trend Line"
              isAnimationActive={false}
            />

            {/* Data Points */}
            <Scatter
              name="Daily Data"
              data={analysis.points}
              fill="var(--risk-low-solid)"
              stroke="var(--risk-low-solid)"
            />

            {/* Tooltip */}
            <Tooltip
              contentStyle={{
                background: 'var(--glass)',
                border: '1px solid var(--stroke)',
                borderRadius: '0.5rem',
                backdropFilter: 'blur(var(--blur))',
              }}
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(value: number, name: string) => {
                if (name === 'Fatigue Index') return [value.toFixed(1), name];
                if (name === 'Convenience Spend ($)') return [`$${value.toFixed(2)}`, name];
                return [value, name];
              }}
              labelFormatter={(value: string) => {
                const point = analysis.points.find((p) => p.fatigueIndex === parseFloat(value));
                return point ? `Date: ${point.date}` : '';
              }}
            />

            <Legend wrapperStyle={{ paddingTop: '20px' }} />
          </ScatterChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Correlation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-4 border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
            <p className="text-xs font-semibold text-muted uppercase mb-2">Correlation (r)</p>
            <p className="text-2xl font-bold text-text">{analysis.correlation.toFixed(3)}</p>
            <p className="text-xs text-muted mt-2">{correlationLabel}</p>
            <p className="text-xs text-blue-600 font-medium mt-1">{correlationDirection}</p>
          </GlassCard>
        </motion.div>

        {/* Average Fatigue */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <GlassCard className="p-4 border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <p className="text-xs font-semibold text-muted uppercase mb-2">Avg Fatigue</p>
            <p className="text-2xl font-bold text-text">{analysis.averageFatigue.toFixed(1)}</p>
            <p className="text-xs text-muted mt-2">out of 100</p>
          </GlassCard>
        </motion.div>

        {/* Average Spending */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-4 border border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
            <p className="text-xs font-semibold text-muted uppercase mb-2">Avg Daily Spend</p>
            <p className="text-2xl font-bold text-text">${analysis.averageConvenienceSpend.toFixed(2)}</p>
            <p className="text-xs text-muted mt-2">convenience only</p>
          </GlassCard>
        </motion.div>

        {/* Risk Zone */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
        >
          <GlassCard className="p-4 border border-red-500/20 bg-gradient-to-br from-red-500/5 to-rose-500/5">
            <p className="text-xs font-semibold text-muted uppercase mb-2">Risk Zone Days</p>
            <p className="text-2xl font-bold text-text">{riskPercentage.toFixed(0)}%</p>
            <p className="text-xs text-red-600 font-medium mt-2">
              {analysis.riskZoneCount} of {analysis.points.length} days
            </p>
          </GlassCard>
        </motion.div>
      </div>

      {/* Interpretation */}
      <GlassCard className="p-4 border border-white/10">
        <p className="text-sm text-muted">
          <span className="text-text font-semibold">How to read this:</span> The scatter plot shows the relationship between your
          daily fatigue levels (X-axis) and impulse spending (Y-axis). A positive trend line
          suggests that on days when you're more fatigued, you tend to spend more on
          convenience purchases. The risk zone (top-right) represents days with high fatigue
          <span className="font-semibold"> and </span>
          high spending.
        </p>
      </GlassCard>
    </motion.div>
  );
};
