'use client';

import { Suspense, lazy } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useDashboard } from '@/hooks/useDashboard';
import { MosaicGrid } from '@/components/mosaic/MosaicGrid';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Sparkles } from 'lucide-react';

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-96 rounded-3xl">
        <Skeleton className="w-full h-full" />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { data, isLoading, error } = useDashboard();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-text mb-2">Unable to Load Dashboard</h2>
          <p className="text-muted">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
        </GlassCard>
      </div>
    );
  }

  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-12 pb-24 md:pb-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-4 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles size={24} className="text-text" />
          <span className="text-sm font-semibold text-muted uppercase tracking-wide">
            Your Life Mosaic
          </span>
        </div>
        <h1 className="text-6xl lg:text-7xl font-bold text-text tracking-tight">
          Understand Your Life's
          <br />
          <span className="bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 bg-clip-text text-transparent">
            Interconnected Patterns
          </span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto">
          Spending behavior is often a coping behavior, not an optimization problem.
        </p>
      </motion.div>

      {/* Mosaic Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <MosaicGrid 
          domains={data.domains}
          edges={[
            { label: 'Financial Impact', from: 'finance', to: 'mental', strength: 0.8 },
            { label: 'Mental Wellbeing', from: 'mental', to: 'physical', strength: 0.7 },
            { label: 'Energy & Resources', from: 'physical', to: 'finance', strength: 0.6 },
          ]}
        />
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Link href="/checkins" className="group">
          <GlassCard className="p-8 h-full hover:bg-white/10 transition cursor-pointer border border-white/20 hover:border-white/40">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-text">Daily Check-In</h3>
                <ArrowRight size={24} className="text-text/50 group-hover:text-text transition translate-x-0 group-hover:translate-x-1" />
              </div>
              <p className="text-muted">
                Share how you're feeling and get personalized AI insights about your wellbeing.
              </p>
              <div className="pt-4">
                <Button variant="primary" size="sm" className="w-fit">
                  Start Check-In
                </Button>
              </div>
            </div>
          </GlassCard>
        </Link>

        <Link href="/patterns" className="group">
          <GlassCard className="p-8 h-full hover:bg-white/10 transition cursor-pointer border border-white/20 hover:border-white/40">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-text">View Patterns</h3>
                <ArrowRight size={24} className="text-text/50 group-hover:text-text transition translate-x-0 group-hover:translate-x-1" />
              </div>
              <p className="text-muted">
                Explore trends and patterns across your life domains throughout the week.
              </p>
              <div className="pt-4">
                <Button variant="primary" size="sm" className="w-fit">
                  Explore Insights
                </Button>
              </div>
            </div>
          </GlassCard>
        </Link>
      </motion.div>

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <GlassCard className="p-6 border border-white/10">
          <h4 className="font-semibold text-text mb-2">💰 Finance</h4>
          <p className="text-sm text-muted">
            Track spending, savings, and financial health patterns
          </p>
        </GlassCard>
        <GlassCard className="p-6 border border-white/10">
          <h4 className="font-semibold text-text mb-2">🧠 Mental Health</h4>
          <p className="text-sm text-muted">
            Monitor stress levels and emotional wellbeing
          </p>
        </GlassCard>
        <GlassCard className="p-6 border border-white/10">
          <h4 className="font-semibold text-text mb-2">💪 Physical Health</h4>
          <p className="text-sm text-muted">
            Track exercise, sleep, and physical fitness
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
