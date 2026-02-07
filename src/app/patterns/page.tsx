'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { InsightsPanel } from '@/components/mosaic/InsightsPanel';
import { MockDataGraphs } from '@/components/patterns/MockDataGraphs';
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
            Discover the interconnected mosaic of your financial health!
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
      </motion.div>

      {/* Mock Data Graphs Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="text-2xl font-bold text-text mb-4">Data Visualizations</h2>
        <MockDataGraphs />
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
