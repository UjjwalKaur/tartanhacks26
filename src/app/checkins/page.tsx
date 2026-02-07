'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Activity } from 'lucide-react';
import Link from 'next/link';
import { QuickCheckIn } from '@/components/mosaic/QuickCheckIn';
import { GlassCard } from '@/components/ui/GlassCard';

export default function CheckInsPage() {
  return (
    <div className="space-y-8 pb-24 md:pb-8">
      {/* Header with back button */}
      <div className="flex items-center space-x-4">
        <Link href="/" className="p-2 hover:bg-white/5 rounded-lg transition">
          <ArrowLeft size={24} className="text-text" />
        </Link>
        <div>
          <h1 className="text-5xl font-bold text-text tracking-tight">
            Daily Check-In
          </h1>
          <p className="text-lg text-muted mt-2">
            Share how you're feeling today and get personalized insights from AI
          </p>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Check-in form - takes 2 columns */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <QuickCheckIn />
          </motion.div>

          {/* Information cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 space-y-4"
          >
            <h3 className="text-xl font-semibold text-text">Why Check In?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard className="p-4">
                <h4 className="font-semibold text-text mb-2">Track Patterns</h4>
                <p className="text-sm text-muted">
                  Regular check-ins help you identify patterns in your stress and energy levels.
                </p>
              </GlassCard>
              <GlassCard className="p-4">
                <h4 className="font-semibold text-text mb-2">Get Insights</h4>
                <p className="text-sm text-muted">
                  Receive AI-powered recommendations tailored to your current state.
                </p>
              </GlassCard>
              <GlassCard className="p-4">
                <h4 className="font-semibold text-text mb-2">Self-Awareness</h4>
                <p className="text-sm text-muted">
                  Understand how different factors affect your wellbeing throughout the week.
                </p>
              </GlassCard>
              <GlassCard className="p-4">
                <h4 className="font-semibold text-text mb-2">Wellness Goals</h4>
                <p className="text-sm text-muted">
                  Use insights to set and achieve your personal wellness objectives.
                </p>
              </GlassCard>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Activity size={20} className="text-text" />
                <h3 className="font-semibold text-text">Scale Guide</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-text">Stress Level</p>
                  <p className="text-muted text-xs">1 = Calm, 5 = Very Stressed</p>
                </div>
                <div>
                  <p className="font-medium text-text">Energy Level</p>
                  <p className="text-muted text-xs">1 = Exhausted, 5 = Energized</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
              <p className="text-sm text-muted">
                💡 <span className="text-text font-medium">Pro Tip:</span> Adding notes helps our AI provide more personalized recommendations.
              </p>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
