'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Checkin } from '@/types/checkin';
import { Transaction } from '@/types/schemas';
import { computeMentalHealthMetrics, MentalHealthMetrics } from '@/lib/mentalHealthMetrics';

interface MentalHealthSidebarProps {
  transactions?: Transaction[];
}

export const MentalHealthSidebar = ({ transactions = [] }: MentalHealthSidebarProps) => {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [metrics, setMetrics] = useState<MentalHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch checkins
        const res = await fetch('/api/checkins');
        if (!res.ok) throw new Error('Failed to fetch checkins');
        const data = await res.json();
        setCheckins(data.checkins || []);

        // Compute metrics if we have both checkins and transactions
        if (data.checkins && transactions.length > 0) {
          const computed = computeMentalHealthMetrics(data.checkins, transactions);
          setMetrics(computed);
        }
      } catch (err) {
        console.error('Error loading mental health data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [transactions]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-4">
        <p className="text-sm text-red-400">Error: {error}</p>
      </GlassCard>
    );
  }

  if (!metrics) {
    return (
      <GlassCard className="p-4">
        <p className="text-sm text-muted">No data available yet.</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stress vs Spending */}
      <GlassCard className="p-5">
        <h3 className="font-semibold text-text mb-3 text-sm">Stress Impact on Spending</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted">High Stress Days (6+)</span>
            <span className="text-text font-semibold">${metrics.stressSpendingComparison.highStressAvgSpend}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Low Stress Days (&lt;6)</span>
            <span className="text-text font-semibold">${metrics.stressSpendingComparison.lowStressAvgSpend}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-text/10">
            <span className="text-muted">Difference</span>
            <span
              className={`font-semibold ${
                metrics.stressSpendingComparison.difference > 0 ? 'text-red-400' : 'text-green-400'
              }`}
            >
              {metrics.stressSpendingComparison.difference > 0 ? '+' : '-'}
              ${Math.abs(metrics.stressSpendingComparison.difference)} (
              {metrics.stressSpendingComparison.differencePercent}%)
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Emotion Risk Analysis */}
      <GlassCard className="p-5">
        <h3 className="font-semibold text-text mb-3 text-sm">Emotional State & Spending</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted">Risk Emotion Days*</span>
            <span className="text-text font-semibold">${metrics.emotionalRiskAnalysis.riskEmotionDaysAvgSpend}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Other Emotion Days</span>
            <span className="text-text font-semibold">${metrics.emotionalRiskAnalysis.nonRiskEmotionDaysAvgSpend}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-text/10">
            <span className="text-muted">Difference</span>
            <span
              className={`font-semibold ${
                metrics.emotionalRiskAnalysis.difference > 0 ? 'text-red-400' : 'text-green-400'
              }`}
            >
              {metrics.emotionalRiskAnalysis.difference > 0 ? '+' : '-'}
              ${Math.abs(metrics.emotionalRiskAnalysis.difference)} (
              {metrics.emotionalRiskAnalysis.differencePercent}%)
            </span>
          </div>
          <p className="text-muted text-xs italic pt-2">
            *Risk emotions: stressed, anxious, sad, lonely, fatigued
          </p>
        </div>
      </GlassCard>

      {/* Spend by Financial Flags */}
      {metrics.spendByFinancialFlags.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="font-semibold text-text mb-4 text-sm">Spending by Pattern</h3>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.spendByFinancialFlags}
                margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--text)/10" />
                <XAxis
                  dataKey="flag"
                  stroke="var(--text)/50"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 11 }}
                />
                <YAxis stroke="var(--text)/50" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--background)',
                    border: '1px solid var(--text)/20',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value: any) => `$${value.toFixed(2)}`}
                />
                <Bar dataKey="avgDiscretionarySpend" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

      {/* Top Life Event Keywords */}
      {metrics.topLifeEventKeywords.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="font-semibold text-text mb-3 text-sm">Spending Triggers (Keywords)</h3>
          <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
            {metrics.topLifeEventKeywords.map((item) => (
              <div key={item.keyword} className="flex justify-between items-center py-1 border-b border-text/5">
                <div>
                  <div className="text-text font-medium capitalize">{item.keyword}</div>
                  <div className="text-muted text-xs">{item.dayCount} day(s)</div>
                </div>
                <div className="text-text font-semibold text-right">${item.totalSpend}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <div className="text-xs text-muted italic px-1">
        Data from {checkins.length} check-in(s). Correlation analysis only - not medical advice.
      </div>
    </div>
  );
};
