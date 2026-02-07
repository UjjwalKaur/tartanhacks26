'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Insight } from '@/types/schemas';
import { GlassCard } from '@/components/ui/GlassCard';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface InsightsPanelProps {
  insights: Insight[];
}

export const InsightsPanel = ({ insights }: InsightsPanelProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Sparkles size={20} className="text-text" />
        <h2 className="text-2xl font-bold text-text">Top Patterns This Week</h2>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => {
          const chartData = insight.evidence.values.map((value, i) => ({
            value,
            date: insight.evidence.dates[i],
          }));

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text mb-1">{insight.title}</h3>
                    <p className="text-sm text-muted">{insight.explanation}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0 w-24 h-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="var(--text)"
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">{insight.evidence.metric}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted">Confidence:</span>
                    <div className="w-20 h-1.5 bg-glass2 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-text"
                        initial={{ width: 0 }}
                        animate={{ width: `${insight.confidence * 100}%` }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                      />
                    </div>
                    <span className="text-text font-medium">
                      {Math.round(insight.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};