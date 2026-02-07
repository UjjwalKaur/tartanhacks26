'use client';

import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { SpendingAnalytics, formatCurrency } from '@/lib/spendingAnalytics';
import { GlassCard } from '@/components/ui/GlassCard';

interface FinanceInsightsProps {
  analytics: SpendingAnalytics;
}

export const FinanceInsights = ({ analytics }: FinanceInsightsProps) => {
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-4 border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
          <p className="text-xs text-muted mb-1">Total Spend</p>
          <p className="text-2xl font-bold text-text">{formatCurrency(analytics.totalSpend)}</p>
          <p className="text-xs text-muted mt-2">
            {analytics.period.startDate} to {analytics.period.endDate}
          </p>
        </GlassCard>

        <GlassCard className="p-4 border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
          <p className="text-xs text-muted mb-1">Top Category</p>
          <p className="text-2xl font-bold text-text">
            {analytics.top3Categories[0]?.category || 'N/A'}
          </p>
          <p className="text-xs text-muted mt-2">
            {formatCurrency(analytics.top3Categories[0]?.amount || 0)}
          </p>
        </GlassCard>

        <GlassCard className="p-4 border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
          <p className="text-xs text-muted mb-1">Subscriptions</p>
          <p className="text-2xl font-bold text-text">
            {formatCurrency(analytics.subscriptionSpend.total)}
          </p>
          <p className="text-xs text-muted mt-2">{analytics.subscriptionSpend.pctOfTotal}% of total</p>
        </GlassCard>
      </div>

      {/* Insights */}
      <GlassCard className="p-6 border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
        <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <Lightbulb size={18} className="text-cyan-600" />
          Key Insights
        </h3>
        <div className="space-y-3">
          {analytics.insights.map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-cyan-600">•</span>
              </div>
              <p className="text-sm text-muted leading-relaxed">{insight}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Top 3 Categories */}
      <GlassCard className="p-6 border border-green-500/20">
        <h3 className="text-lg font-semibold text-text mb-4">Top 3 Categories</h3>
        <div className="space-y-3">
          {analytics.top3Categories.map((category, idx) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              <div className="flex items-center gap-3">
                <div className="text-sm font-bold text-green-600 bg-green-500/20 rounded-full w-6 h-6 flex items-center justify-center">
                  {idx + 1}
                </div>
                <span className="text-sm text-muted">{category.category}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-text">
                  {formatCurrency(category.amount)}
                </p>
                <p className="text-xs text-muted">{category.pctOfTotal}%</p>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
