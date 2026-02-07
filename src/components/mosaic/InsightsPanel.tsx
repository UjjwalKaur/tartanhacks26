'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Insight } from '@/types/schemas';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface InsightsPanelProps {
  insights: Insight[];
}

export const InsightsPanel = ({ insights }: InsightsPanelProps) => {
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string>('');

  const payload = useMemo(() => ({ insights }), [insights]);

  async function generateSummary() {
    try {
      setAiError('');
      setAiLoading(true);

      const res = await fetch('/api/insights/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }

      const data = (await res.json()) as { summary?: string };
      setAiSummary(data.summary ?? 'No summary returned.');
    } catch (e: any) {
      setAiError(e?.message ?? 'Could not generate summary.');
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Sparkles size={20} className="text-text" />
        <h2 className="text-2xl font-bold text-text">Top Patterns This Week</h2>
      </div>

      {/* AI Summary Card */}
      <GlassCard className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="font-semibold text-text">AI summary and suggestions</div>
            <div className="text-sm text-muted">
              Uses your patterns to explain what is trending and what to try next.
            </div>
          </div>

          <Button
            onClick={generateSummary}
            disabled={aiLoading || insights.length === 0}
            className="shrink-0"
          >
            {aiLoading ? 'Generating…' : 'Generate'}
          </Button>
        </div>

        <div className="mt-4">
          {aiError ? (
            <div className="text-sm text-[var(--risk-high-solid)]">
              {aiError}
            </div>
          ) : aiSummary ? (
            <motion.pre
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-text whitespace-pre-wrap leading-relaxed"
            >
              {aiSummary}
            </motion.pre>
          ) : (
            <div className="text-sm text-muted">
              Click Generate to create a personalized explanation of your trends.
            </div>
          )}
        </div>
      </GlassCard>

      {/* Existing insight cards */}
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
                    <h3 className="font-semibold text-text mb-1">
                      {insight.title}
                    </h3>
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
                        transition={{
                          delay: index * 0.1 + 0.3,
                          duration: 0.5,
                        }}
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
