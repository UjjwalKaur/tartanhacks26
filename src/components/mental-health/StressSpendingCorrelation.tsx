'use client';

import { useMemo, useEffect, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';
import { AlertCircle, TrendingDown } from 'lucide-react';
import { Checkin } from '@/types/checkin';
import { Transaction } from '@/types/schemas';

interface CorrelationDataPoint {
  date: string;
  stress: number;
  discretionarySpend: number;
  topEmotion: string;
}

interface CorrelationMetrics {
  avgDiscretionaryLowStress: number;
  avgDiscretionaryHighStress: number;
  delta: number;
  deltaPercent: number;
  pearsonR: number;
  dataPoints: CorrelationDataPoint[];
  lowStressCount: number;
  highStressCount: number;
}

const DISCRETIONARY_CATEGORIES = [
  'Dining',
  'Shopping',
  'Entertainment',
  'Delivery/Rideshare',
  'Coffee',
  'Alcohol',
  'Subscriptions',
];

const calculateDiscretionarySpend = (transactions: Transaction[], date: string): number => {
  return transactions
    .filter((tx) => tx.date.split('T')[0] === date)
    .filter((tx) => DISCRETIONARY_CATEGORIES.includes(tx.category))
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
};

const calculatePearsonCorrelation = (data: CorrelationDataPoint[]): number => {
  if (data.length < 2) return 0;

  const n = data.length;
  const sumX = data.reduce((sum, d) => sum + d.stress, 0);
  const sumY = data.reduce((sum, d) => sum + d.discretionarySpend, 0);
  const sumXY = data.reduce((sum, d) => sum + d.stress * d.discretionarySpend, 0);
  const sumX2 = data.reduce((sum, d) => sum + d.stress * d.stress, 0);
  const sumY2 = data.reduce((sum, d) => sum + d.discretionarySpend * d.discretionarySpend, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
};

interface StressSpendingCorrelationProps {
  checkins: Checkin[];
  transactions: Transaction[];
}

export const StressSpendingCorrelation = ({
  checkins,
  transactions,
}: StressSpendingCorrelationProps) => {
  const metrics = useMemo(() => {
    const dataPoints: CorrelationDataPoint[] = checkins
      .map((checkin) => {
        const discretionarySpend = calculateDiscretionarySpend(
          transactions,
          checkin.date_of_checkin
        );
        const topEmotion = [checkin.emotion1, checkin.emotion2, checkin.emotion3]
          .filter(Boolean)
          .at(0) || 'Unknown';

        return {
          date: checkin.date_of_checkin,
          stress: checkin.stress,
          discretionarySpend,
          topEmotion,
        };
      })
      .sort((a, b) => a.stress - b.stress);

    const lowStressData = dataPoints.filter((d) => d.stress < 6);
    const highStressData = dataPoints.filter((d) => d.stress >= 6);

    const avgDiscretionaryLowStress =
      lowStressData.length > 0
        ? lowStressData.reduce((sum, d) => sum + d.discretionarySpend, 0) /
          lowStressData.length
        : 0;

    const avgDiscretionaryHighStress =
      highStressData.length > 0
        ? highStressData.reduce((sum, d) => sum + d.discretionarySpend, 0) /
          highStressData.length
        : 0;

    const delta = avgDiscretionaryHighStress - avgDiscretionaryLowStress;
    const deltaPercent =
      avgDiscretionaryLowStress === 0
        ? 0
        : (delta / avgDiscretionaryLowStress) * 100;

    const pearsonR = calculatePearsonCorrelation(dataPoints);

    return {
      avgDiscretionaryLowStress: parseFloat(avgDiscretionaryLowStress.toFixed(2)),
      avgDiscretionaryHighStress: parseFloat(avgDiscretionaryHighStress.toFixed(2)),
      delta: parseFloat(delta.toFixed(2)),
      deltaPercent: parseFloat(deltaPercent.toFixed(1)),
      pearsonR: parseFloat(pearsonR.toFixed(3)),
      dataPoints,
      lowStressCount: lowStressData.length,
      highStressCount: highStressData.length,
    };
  }, [checkins, transactions]);

  if (metrics.dataPoints.length === 0) {
    return (
      <GlassCard className="p-6 border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
        <div className="flex items-center space-x-3">
          <AlertCircle size={20} className="text-purple-400" />
          <div>
            <h3 className="font-semibold text-text">Stress vs Discretionary Spending</h3>
            <p className="text-sm text-muted mt-2">
              No check-in data available yet. Start submitting daily check-ins to see your
              stress-spending patterns!
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  const trendlineData = [
    { x: 0, y: 0 },
    { x: 10, y: 10 },
  ];

  // Simple linear trendline calculation
  if (metrics.dataPoints.length >= 2) {
    const n = metrics.dataPoints.length;
    const sumX = metrics.dataPoints.reduce((sum, d) => sum + d.stress, 0);
    const sumY = metrics.dataPoints.reduce((sum, d) => sum + d.discretionarySpend, 0);
    const sumXY = metrics.dataPoints.reduce((sum, d) => sum + d.stress * d.discretionarySpend, 0);
    const sumX2 = metrics.dataPoints.reduce((sum, d) => sum + d.stress * d.stress, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    trendlineData[0] = { x: 0, y: Math.max(0, intercept) };
    trendlineData[1] = { x: 10, y: Math.max(0, intercept + slope * 10) };
  }

  const CustomTooltip = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
      const data = props.payload[0].payload;
      return (
        <div className="bg-bg border border-stroke rounded-lg p-3 shadow-lg">
          <p className="text-xs text-muted">{data.date}</p>
          <p className="text-sm font-semibold text-text">
            Stress: {data.stress}/10
          </p>
          <p className="text-sm font-semibold text-cyan-400">
            ${data.discretionarySpend.toFixed(2)}
          </p>
          <p className="text-xs text-muted mt-1">
            Mood: {data.topEmotion}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-6"
    >
      {/* Main Chart */}
      <GlassCard className="p-6 border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text mb-1">
            Stress vs Discretionary Spending
          </h3>
          <p className="text-sm text-muted">
            Patterns, not proof. Each dot is one check-in day.
          </p>
        </div>

        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                type="number"
                dataKey="stress"
                name="Stress Level"
                domain={[0, 10]}
                stroke="rgba(255,255,255,0.5)"
                label={{ value: 'Stress (0-10)', position: 'insideBottomRight', offset: -10, fill: '#a78bfa' }}
              />
              <YAxis
                type="number"
                dataKey="discretionarySpend"
                name="Discretionary Spend"
                stroke="rgba(255,255,255,0.5)"
                label={{ value: 'Spend ($)', angle: -90, position: 'insideLeft', fill: '#a78bfa' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                name="Check-in Days"
                data={metrics.dataPoints}
                fill="#a78bfa"
                fillOpacity={0.7}
                shape="circle"
              />
              {/* Trendline */}
              <Line
                type="linear"
                dataKey="y"
                data={trendlineData}
                stroke="#ec4899"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={false}
                name="Trend"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Low Stress Spending */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <GlassCard className="p-6 border border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
            <p className="text-xs text-muted mb-2 uppercase tracking-wide">Low Stress Days</p>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-green-400">
                ${metrics.avgDiscretionaryLowStress.toFixed(2)}
              </p>
              <p className="text-xs text-muted">
                Avg discretionary spend ({metrics.lowStressCount} days)
              </p>
            </div>
          </GlassCard>
        </motion.div>

        {/* High Stress Spending */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="p-6 border border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5">
            <p className="text-xs text-muted mb-2 uppercase tracking-wide">High Stress Days</p>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-red-400">
                ${metrics.avgDiscretionaryHighStress.toFixed(2)}
              </p>
              <p className="text-xs text-muted">
                Avg discretionary spend ({metrics.highStressCount} days)
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Delta and Correlation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Delta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <GlassCard className="p-6 border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-amber-500/5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-muted mb-2 uppercase tracking-wide">Stress Impact</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {metrics.delta >= 0 ? '+' : ''}${metrics.delta.toFixed(2)}
                </p>
              </div>
              <TrendingDown
                size={24}
                className={metrics.delta >= 0 ? 'text-red-400 rotate-180' : 'text-green-400'}
              />
            </div>
            <p className="text-sm text-muted">
              {Math.abs(metrics.deltaPercent).toFixed(1)}%{' '}
              {metrics.delta >= 0 ? 'more' : 'less'} spending when stressed
            </p>
          </GlassCard>
        </motion.div>

        {/* Correlation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-6 border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
            <p className="text-xs text-muted mb-2 uppercase tracking-wide">Correlation</p>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-cyan-400">
                {Math.abs(metrics.pearsonR).toFixed(2)}
              </p>
              <p className="text-xs text-muted">
                Pearson r ({metrics.pearsonR > 0 ? 'positive' : 'negative'} relationship)
              </p>
              <p className="text-xs text-muted/70 mt-3 italic">
                Correlation ≠ causation. Pattern observed across your {metrics.dataPoints.length} check-in days.
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Interpretation Guide */}
      <GlassCard className="p-4 border border-blue-500/20 bg-blue-500/5">
        <p className="text-xs text-muted mb-2">💡 How to read this:</p>
        <ul className="text-xs text-muted/80 space-y-1">
          <li>
            • <span className="text-cyan-400">Correlation (r)</span>: Shows strength of relationship (-1 to 1)
          </li>
          <li>
            • <span className="text-yellow-400">Stress Impact</span>: Dollar difference between high & low stress days
          </li>
          <li>
            • <span className="text-purple-400">Trendline</span>: Visual pattern across all your check-in days
          </li>
        </ul>
      </GlassCard>
    </motion.div>
  );
};
