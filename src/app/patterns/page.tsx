'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { InsightsPanel } from '@/components/mosaic/InsightsPanel';
import { GlassCard } from '@/components/ui/GlassCard';
import { useDashboard } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/Skeleton';
import { FileRegistryStatus } from '@/components/registry/FileRegistryStatus';
import { FileViewer } from '@/components/registry/FileViewer';
import { AnalyticsFromRegistry } from '@/components/registry/AnalyticsFromRegistry';

export default function PatternsPage() {
  const { data, isLoading, error } = useDashboard();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-text mb-2">Unable to Load Patterns</h2>
          <p className="text-muted">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      {/* Header with back button */}
      <div className="flex items-center space-x-4">
        <Link href="/" className="p-2 hover:bg-white/5 rounded-lg transition">
          <ArrowLeft size={24} className="text-text" />
        </Link>
        <div>
          <h1 className="text-5xl font-bold text-text tracking-tight">
            Top Patterns
          </h1>
          <p className="text-lg text-muted mt-2">
            Discover the interconnected patterns across your wellbeing
          </p>
        </div>
      </div>

      {/* File Registry Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <h2 className="text-2xl font-bold text-text mb-4">Uploaded Data</h2>
        <FileRegistryStatus />
      </motion.div>

      {/* File Viewer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <FileViewer />
      </motion.div>

      {/* Analytics from Registry */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <AnalyticsFromRegistry />
      </motion.div>

      {/* Insights Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {isLoading || !data ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <GlassCard key={i} className="p-6 h-48">
                <Skeleton className="w-full h-full" />
              </GlassCard>
            ))}
          </div>
        ) : (
          <InsightsPanel insights={data.insights} />
        )}
      </motion.div>

      {/* Summary Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text">Total Check-Ins</h3>
            <TrendingUp size={20} className="text-text opacity-50" />
          </div>
          <p className="text-4xl font-bold text-text">
            {data?.insights?.length || 0}
          </p>
          <p className="text-sm text-muted mt-2">This week</p>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="font-semibold text-text mb-4">Stress Trend</h3>
          <div className="flex items-end space-x-1 h-12">
            {[3, 2, 4, 3, 5, 2, 4].map((val, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-red-500/50 to-red-500 rounded-t opacity-70 hover:opacity-100 transition"
                style={{ height: `${(val / 5) * 100}%` }}
              />
            ))}
          </div>
          <p className="text-sm text-muted mt-2">Last 7 days</p>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="font-semibold text-text mb-4">Energy Trend</h3>
          <div className="flex items-end space-x-1 h-12">
            {[3, 4, 2, 3, 2, 4, 3].map((val, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-blue-500/50 to-blue-500 rounded-t opacity-70 hover:opacity-100 transition"
                style={{ height: `${(val / 5) * 100}%` }}
              />
            ))}
          </div>
          <p className="text-sm text-muted mt-2">Last 7 days</p>
        </GlassCard>
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-text mb-4">Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
            <h4 className="font-semibold text-text mb-2">✓ Keep Doing</h4>
            <p className="text-sm text-muted">
              Your energy levels are highest on days with exercise. Continue this routine!
            </p>
          </GlassCard>
          <GlassCard className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
            <h4 className="font-semibold text-text mb-2">⚠ Pay Attention To</h4>
            <p className="text-sm text-muted">
              Stress spikes on Monday mornings. Try a calming routine at the start of your week.
            </p>
          </GlassCard>
        </div>
      </motion.div>
    </div>
  );
}
