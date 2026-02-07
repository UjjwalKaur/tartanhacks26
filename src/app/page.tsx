'use client';

import { Suspense, lazy } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { MosaicGrid } from '@/components/mosaic/MosaicGrid';
import { InsightsPanel } from '@/components/mosaic/InsightsPanel';
import { QuickCheckIn } from '@/components/mosaic/QuickCheckIn';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';

// Lazy load 3D hero with fallback
const HeroMosaic3D = lazy(() =>
  import('@/components/mosaic/HeroMosaic3D').then((mod) => ({
    default: mod.HeroMosaic3D,
  }))
);

const HeroMosaicCSS = lazy(() =>
  import('@/components/mosaic/HeroMosaicCSS').then((mod) => ({
    default: mod.HeroMosaicCSS,
  }))
);

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-64 -mt-8 -mb-8">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <GlassCard key={i} className="p-6 h-64">
            <Skeleton className="w-full h-full" />
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
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
    <div className="space-y-8 pb-24 md:pb-8">
      {/* Hero Mosaic */}
      <Suspense fallback={<HeroMosaicCSS />}>
        <HeroMosaic3D />
      </Suspense>

      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-5xl font-bold text-text tracking-tight">
          Your Life Mosaic
        </h1>
        <p className="text-lg text-muted max-w-2xl">
          Understand the interconnected patterns across your financial, mental, and
          physical wellbeing.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Domain Tiles - takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <MosaicGrid domains={data.domains} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <QuickCheckIn />
        </div>
      </div>

      {/* Insights Section */}
      <div className="mt-12">
        <InsightsPanel insights={data.insights} />
      </div>
    </div>
  );
}