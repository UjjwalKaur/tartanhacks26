'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Insight, HealthSummary, TransactionsSummary, CheckInRecord } from '@/types/schemas';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useFileRegistry } from '@/store/fileRegistry';
import { useFinanceStore } from '@/store/financeContext';
import { analyzeSpending } from '@/lib/spendingAnalytics';
import { useTransactionsSummary, useHealthSummary, useCheckIns } from '@/hooks/useDashboard';

interface InsightsPanelProps {
  insights?: Insight[];
}

type AISummaryData = {
  summary?: string;
  patterns?: Array<{
    title: string;
    description: string;
    linked_signals: string[];
    spending_categories: string[];
    evidence: string;
    confidence: number;
  }>;
  risk_windows?: Array<{
    condition: string;
    likely_spending_behavior: string;
    why: string;
    confidence: number;
  }>;
  actions?: Array<{
    suggestion: string;
    applies_when: string;
    expected_benefit: string;
  }>;
  notes?: string[];
  what_drove_spending?: string[];
  what_to_try_next?: string[];
  high_spend_day_story?: string[];
  caveat?: string;
};

export const InsightsPanel = ({ insights = [] }: InsightsPanelProps) => {
  // Store hooks
  const fileRegistry = useFileRegistry();
  const financeStore = useFinanceStore();

  // Use hooks to fetch all data
  const { data: transactionData } = useTransactionsSummary();
  const { data: healthData } = useHealthSummary();
  const { data: checkInsData } = useCheckIns();

  // State
  const [aiSummary, setAiSummary] = useState<AISummaryData | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string>('');

  // Prepare data for charts
  const spendingByCategory = useMemo(() => {
    if (transactionData?.totalsByCategory) {
      return Object.entries(transactionData.totalsByCategory).map(([category, amount]) => ({
        name: category,
        value: Math.abs(amount as number),
      }));
    }
    return [];
  }, [transactionData]);

  const checkInsChart = useMemo(() => {
    if (checkInsData && Array.isArray(checkInsData)) {
      return checkInsData.map((ci: CheckInRecord) => ({
        date: ci.date,
        stress: ci.stress,
        energy: ci.energy,
      }));
    }
    return [];
  }, [checkInsData]);

  const payload = useMemo(
    () => ({
      insights,
      health: healthData,
      transactions: transactionData,
    }),
    [insights, healthData, transactionData]
  );

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

      const data = (await res.json()) as AISummaryData;
      setAiSummary(data);
    } catch (e: any) {
      setAiError(e?.message ?? 'Could not generate summary.');
    } finally {
      setAiLoading(false);
    }
  }

  // Colors for charts
  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

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
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary */}
              {aiSummary.summary && (
                <div className="bg-background/40 rounded-lg p-4 border border-text/10">
                  <h4 className="font-semibold text-text mb-2">Summary</h4>
                  <p className="text-sm text-text leading-relaxed">{aiSummary.summary}</p>
                </div>
              )}

              {/* What Drove Spending */}
              {aiSummary.what_drove_spending && aiSummary.what_drove_spending.length > 0 && (
                <div className="bg-background/40 rounded-lg p-4 border border-text/10">
                  <h4 className="font-semibold text-text mb-3">What Drove Spending</h4>
                  <ul className="space-y-2">
                    {aiSummary.what_drove_spending.map((item, idx) => (
                      <li key={idx} className="flex gap-3 text-sm text-text">
                        <span className="text-accent flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Patterns */}
              {aiSummary.patterns && aiSummary.patterns.length > 0 && (
                <div className="bg-background/40 rounded-lg p-4 border border-text/10">
                  <h4 className="font-semibold text-text mb-3">Key Patterns</h4>
                  <div className="space-y-3">
                    {aiSummary.patterns.map((pattern, idx) => (
                      <div key={idx} className="border-l-2 border-accent/50 pl-3">
                        <p className="font-medium text-sm text-text">{pattern.title}</p>
                        <p className="text-xs text-muted mt-1">{pattern.description}</p>
                        {pattern.linked_signals && pattern.linked_signals.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {pattern.linked_signals.map((signal, i) => (
                              <span key={i} className="text-xs bg-text/10 text-text px-2 py-1 rounded">
                                {signal}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted mt-2">
                          <span className="font-semibold">Evidence:</span> {pattern.evidence}
                        </p>
                        <div className="text-xs text-muted mt-1">
                          <span className="inline-block bg-accent/20 text-accent px-2 py-0.5 rounded">
                            {Math.round(pattern.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Windows */}
              {aiSummary.risk_windows && aiSummary.risk_windows.length > 0 && (
                <div className="bg-background/40 rounded-lg p-4 border border-text/10">
                  <h4 className="font-semibold text-text mb-3">Risk Windows</h4>
                  <div className="space-y-3">
                    {aiSummary.risk_windows.map((risk, idx) => (
                      <div key={idx} className="border-l-2 border-[var(--risk-high-solid)]/50 pl-3">
                        <p className="font-medium text-sm text-text">{risk.condition}</p>
                        <p className="text-xs text-muted mt-1">{risk.likely_spending_behavior}</p>
                        <p className="text-xs text-muted mt-1">{risk.why}</p>
                        <div className="text-xs text-muted mt-1">
                          <span className="inline-block bg-[var(--risk-high-solid)]/20 text-[var(--risk-high-solid)] px-2 py-0.5 rounded">
                            {Math.round(risk.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {aiSummary.what_to_try_next && aiSummary.what_to_try_next.length > 0 && (
                <div className="bg-background/40 rounded-lg p-4 border border-text/10">
                  <h4 className="font-semibold text-text mb-3">What to Try Next</h4>
                  <ul className="space-y-2">
                    {aiSummary.what_to_try_next.map((action, idx) => (
                      <li key={idx} className="flex gap-3 text-sm text-text">
                        <span className="text-accent flex-shrink-0">→</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* High Spend Days */}
              {aiSummary.high_spend_day_story && aiSummary.high_spend_day_story.length > 0 && (
                <div className="bg-background/40 rounded-lg p-4 border border-text/10">
                  <h4 className="font-semibold text-text mb-3">High Spend Day Patterns</h4>
                  <ul className="space-y-2">
                    {aiSummary.high_spend_day_story.map((story, idx) => (
                      <li key={idx} className="flex gap-3 text-sm text-text">
                        <span className="text-[var(--risk-high-solid)] flex-shrink-0">⚠</span>
                        <span>{story}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions with details */}
              {aiSummary.actions && aiSummary.actions.length > 0 && (
                <div className="bg-background/40 rounded-lg p-4 border border-text/10">
                  <h4 className="font-semibold text-text mb-3">Actionable Suggestions</h4>
                  <div className="space-y-3">
                    {aiSummary.actions.map((action, idx) => (
                      <div key={idx} className="border-l-2 border-accent/50 pl-3">
                        <p className="font-medium text-sm text-text">{action.suggestion}</p>
                        <p className="text-xs text-muted mt-1">
                          <span className="font-semibold">When:</span> {action.applies_when}
                        </p>
                        <p className="text-xs text-muted mt-1">
                          <span className="font-semibold">Benefit:</span> {action.expected_benefit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes/Caveats */}
              {aiSummary.notes && aiSummary.notes.length > 0 && (
                <div className="bg-background/40 rounded-lg p-4 border border-text/10">
                  <h4 className="font-semibold text-text mb-2">Notes</h4>
                  <ul className="space-y-1">
                    {aiSummary.notes.map((note, idx) => (
                      <li key={idx} className="text-xs text-muted">• {note}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSummary.caveat && (
                <div className="bg-background/40 rounded-lg p-4 border border-text/10">
                  <p className="text-xs text-muted italic">{aiSummary.caveat}</p>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-sm text-muted">
              Click Generate to create a personalized explanation of your trends.
            </div>
          )}
        </div>
      </GlassCard>

      {/* Comprehensive Visualizations from All Data Sources */}
      <div className="space-y-6 mt-8">
        {/* Colors palette */}
        {/* Spending by Category - Bar Chart */}
        {spendingByCategory.length > 0 && (
          <GlassCard className="p-5">
            <h3 className="font-semibold text-text mb-4">Spending by Category</h3>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingByCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--text)/10" />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--text)/50"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis stroke="var(--text)/50" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--text)/20' }}
                    formatter={(value: number) => `$${value.toFixed(2)}`}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        )}

        {/* Sleep Duration - Line Chart */}
        {healthData?.sleepSeries && healthData.sleepSeries.length > 0 && (
          <GlassCard className="p-5">
            <h3 className="font-semibold text-text mb-4">Sleep Duration</h3>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={healthData.sleepSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--text)/10" />
                  <XAxis dataKey="date" stroke="var(--text)/50" />
                  <YAxis 
                    stroke="var(--text)/50" 
                    label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: 'var(--text)/50' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--text)/20' }}
                    formatter={(value: number) => `${value.toFixed(1)} hours`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Sleep Hours"
                    dot={{ fill: '#10b981' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        )}

        {/* Daily Steps - Line Chart */}
        {healthData?.stepsSeries && healthData.stepsSeries.length > 0 && (
          <GlassCard className="p-5">
            <h3 className="font-semibold text-text mb-4">Daily Steps</h3>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={healthData.stepsSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--text)/10" />
                  <XAxis dataKey="date" stroke="var(--text)/50" />
                  <YAxis 
                    stroke="var(--text)/50"
                    label={{ value: 'Steps', angle: -90, position: 'insideLeft', fill: 'var(--text)/50' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--text)/20' }}
                    formatter={(value: number) => `${value.toLocaleString()} steps`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Steps"
                    dot={{ fill: '#f59e0b' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        )}

        {/* Stress & Energy Levels - Multi-line Chart */}
        {checkInsChart.length > 0 && (
          <GlassCard className="p-5">
            <h3 className="font-semibold text-text mb-4">Emotional Fitness (Stress & Energy)</h3>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={checkInsChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--text)/10" />
                  <XAxis dataKey="date" stroke="var(--text)/50" />
                  <YAxis 
                    stroke="var(--text)/50"
                    domain={[1, 5]}
                    label={{ value: 'Level (1-5)', angle: -90, position: 'insideLeft', fill: 'var(--text)/50' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--text)/20' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="stress" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Stress Level"
                    dot={{ fill: '#ef4444' }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="energy" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="Energy Level"
                    dot={{ fill: '#8b5cf6' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        )}
      </div>

    </div>
  );
};