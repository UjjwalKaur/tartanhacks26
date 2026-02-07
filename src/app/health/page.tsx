'use client';

import { useHealthSummary } from '@/hooks/useDashboard';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function HealthPage() {
  const { data, isLoading, error } = useHealthSummary();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-text mb-2">Unable to Load Health Data</h2>
          <p className="text-muted">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
        </GlassCard>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="p-6 h-80">
            <Skeleton className="w-full h-full" />
          </GlassCard>
          <GlassCard className="p-6 h-80">
            <Skeleton className="w-full h-full" />
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-text mb-2">Health Summary</h1>
        <p className="text-muted">Track your physical wellbeing metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sleep Tracker */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold text-text mb-4">Sleep Duration</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.sleepSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--muted)', fontSize: 12 }}
                stroke="var(--stroke)"
              />
              <YAxis
                tick={{ fill: 'var(--muted)', fontSize: 12 }}
                stroke="var(--stroke)"
                label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: 'var(--muted)' }}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--glass)',
                  border: '1px solid var(--stroke)',
                  borderRadius: '0.5rem',
                  backdropFilter: 'blur(var(--blur))',
                }}
                formatter={(value: number) => [`${value.toFixed(1)} hours`, 'Sleep']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--risk-low-solid)"
                strokeWidth={2}
                dot={{ fill: 'var(--risk-low-solid)', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 rounded-xl bg-glass2">
            <div className="text-2xl font-bold text-text">
              {(data.sleepSeries.reduce((sum, d) => sum + d.value, 0) / data.sleepSeries.length).toFixed(1)} hrs
            </div>
            <div className="text-sm text-muted">Average this week</div>
          </div>
        </GlassCard>

        {/* Steps Tracker */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold text-text mb-4">Daily Steps</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.stepsSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--muted)', fontSize: 12 }}
                stroke="var(--stroke)"
              />
              <YAxis
                tick={{ fill: 'var(--muted)', fontSize: 12 }}
                stroke="var(--stroke)"
                label={{ value: 'Steps', angle: -90, position: 'insideLeft', fill: 'var(--muted)' }}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--glass)',
                  border: '1px solid var(--stroke)',
                  borderRadius: '0.5rem',
                  backdropFilter: 'blur(var(--blur))',
                }}
                formatter={(value: number) => [`${value.toLocaleString()} steps`, 'Steps']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--risk-med-solid)"
                strokeWidth={2}
                dot={{ fill: 'var(--risk-med-solid)', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 rounded-xl bg-glass2">
            <div className="text-2xl font-bold text-text">
              {Math.round(data.stepsSeries.reduce((sum, d) => sum + d.value, 0) / data.stepsSeries.length).toLocaleString()}
            </div>
            <div className="text-sm text-muted">Average this week</div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}