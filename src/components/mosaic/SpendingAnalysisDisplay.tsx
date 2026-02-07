'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Zap, TrendingUp, Lightbulb } from 'lucide-react';
import { useSpendingAnalysis } from '@/hooks/useSpendingAnalysis';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

export const SpendingAnalysisDisplay = () => {
  const { data, isLoading, error } = useSpendingAnalysis();
  const [isExpanded, setIsExpanded] = useState(false);

  if (error) {
    return (
      <GlassCard className="p-6 border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-text">No Transaction Data</h4>
            <p className="text-sm text-muted">
              Upload a JSON file with your transactions to see spending analysis powered by AI.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!data?.data?.analysis) {
    return (
      <GlassCard className="p-6 border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-text">Analysis Processing</h4>
            <p className="text-sm text-muted">
              We're analyzing your spending patterns. Check back in a moment.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  const analysis = data.data.analysis;
  const basicData = data.data.basicAnalysis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Summary */}
      <GlassCard className="p-6 border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Zap size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-text mb-2">Spending Summary</h4>
              <p className="text-sm text-muted leading-relaxed">{analysis.summary}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
            <div>
              <p className="text-xs text-muted mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-text">${basicData.totalSpent.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Transactions</p>
              <p className="text-2xl font-bold text-text">{data.data.transactionCount}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Spending Intent & Psychology */}
      <GlassCard className="p-6 border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-red-500/5">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Lightbulb size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-text mb-2">Why You're Spending This Way</h4>
              <p className="text-sm text-muted leading-relaxed">{analysis.intent}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Patterns */}
      <GlassCard className="p-6 border border-blue-500/20">
        <h4 className="font-semibold text-text mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-blue-600" />
          Spending Patterns
        </h4>
        <div className="space-y-3">
          {analysis.patterns.map((pattern, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex gap-3"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <span className="text-xs font-semibold text-blue-600">{idx + 1}</span>
              </div>
              <p className="text-sm text-muted leading-relaxed pt-0.5">{pattern}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Category Breakdown */}
      <GlassCard className="p-6 border border-green-500/20">
        <h4 className="font-semibold text-text mb-4">Spending by Category</h4>
        <div className="space-y-3">
          {Object.entries(basicData.categoryBreakdown)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([category, amount]) => (
              <div key={category} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">{category}</span>
                  <span className="font-semibold text-text">${(amount as number).toFixed(2)}</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((amount as number) / basicData.totalSpent) * 100}%`,
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                  />
                </div>
              </div>
            ))}
        </div>
      </GlassCard>

      {/* Top Merchants */}
      {basicData.topMerchants.length > 0 && (
        <GlassCard className="p-6 border border-indigo-500/20">
          <h4 className="font-semibold text-text mb-4">Top Merchants</h4>
          <div className="space-y-3">
            {basicData.topMerchants.slice(0, 5).map((merchant, idx) => (
              <motion.div
                key={merchant.merchant}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex justify-between items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
              >
                <div>
                  <p className="font-medium text-text">{merchant.merchant}</p>
                  <p className="text-xs text-muted">{merchant.frequency} transactions</p>
                </div>
                <p className="font-semibold text-text">${merchant.total.toFixed(2)}</p>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Insights */}
      <GlassCard className="p-6 border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
        <h4 className="font-semibold text-text mb-4 flex items-center gap-2">
          <Lightbulb size={18} className="text-cyan-600" />
          Key Insights
        </h4>
        <div className="space-y-3">
          {analysis.insights.map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-cyan-600">💡</span>
              </div>
              <p className="text-sm text-muted leading-relaxed">{insight}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <GlassCard className="p-6 border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-yellow-500/5">
          <h4 className="font-semibold text-text mb-4 flex items-center gap-2">
            <Zap size={18} className="text-amber-600" />
            Recommendations
          </h4>
          <div className="space-y-3">
            {analysis.recommendations.map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-amber-600">→</span>
                </div>
                <p className="text-sm text-muted leading-relaxed pt-0.5">{rec}</p>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Date Range Info */}
      <div className="text-center pt-4">
        <p className="text-xs text-muted">
          Analysis for transactions from {basicData.dateRange.start} to {basicData.dateRange.end}
        </p>
      </div>
    </motion.div>
  );
};
