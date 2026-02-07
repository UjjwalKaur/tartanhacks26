'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { SpendingAnalytics, CHART_COLORS, formatCurrency } from '@/lib/spendingAnalytics';
import { GlassCard } from '@/components/ui/GlassCard';

interface SpendingChartProps {
  analytics: SpendingAnalytics;
}

export const CategorySpendChart = ({ analytics }: SpendingChartProps) => {
  const chartData = analytics.spendByCategory.map((item, idx) => ({
    name: item.category,
    value: parseFloat(item.amount.toFixed(2)),
    percent: item.pctOfTotal,
    fill: CHART_COLORS[idx % CHART_COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-bg border border-stroke rounded-lg p-2 backdrop-blur">
          <p className="text-text text-sm font-semibold">{data.name}</p>
          <p className="text-muted text-xs">{formatCurrency(data.value)}</p>
          <p className="text-muted text-xs">{data.percent}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <GlassCard className="p-6 border border-white/10">
      <h3 className="text-lg font-semibold text-text mb-4">Spending by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${percent}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      {/* Category list below chart */}
      <div className="mt-6 space-y-2">
        {analytics.spendByCategory.map((item, idx) => (
          <motion.div
            key={item.category}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center justify-between p-2 rounded hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
              />
              <span className="text-sm text-muted">{item.category}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-text">
                {formatCurrency(item.amount)}
              </p>
              <p className="text-xs text-muted">{item.pctOfTotal}%</p>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
};

export const EssentialVsDiscretionaryChart = ({ analytics }: SpendingChartProps) => {
  const chartData = [
    {
      name: 'Essential',
      value: parseFloat(analytics.discretionaryVsEssential.essential.toFixed(2)),
      fill: '#10b981',
    },
    {
      name: 'Discretionary',
      value: parseFloat(analytics.discretionaryVsEssential.discretionary.toFixed(2)),
      fill: '#f59e0b',
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-bg border border-stroke rounded-lg p-2 backdrop-blur">
          <p className="text-text text-sm font-semibold">{data.name}</p>
          <p className="text-muted text-xs">{formatCurrency(data.value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <GlassCard className="p-6 border border-white/10">
      <h3 className="text-lg font-semibold text-text mb-4">Essential vs Discretionary</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Stats below chart */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-muted">Essential Spending</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-text">
              {formatCurrency(analytics.discretionaryVsEssential.essential)}
            </p>
            <p className="text-xs text-muted">{analytics.discretionaryVsEssential.essentialPct}%</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm text-muted">Discretionary Spending</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-text">
              {formatCurrency(analytics.discretionaryVsEssential.discretionary)}
            </p>
            <p className="text-xs text-muted">{analytics.discretionaryVsEssential.discretionaryPct}%</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
