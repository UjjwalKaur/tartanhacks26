'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AppShell } from '@/components/AppShell';
import { FinanceProvider } from '@/store/financeContext';
import { FitnessAnalyticsProvider } from '@/store/fitnessContext';
import { FileRegistryProvider } from '@/store/fileRegistry';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <FileRegistryProvider>
        <FinanceProvider>
          <FitnessAnalyticsProvider>
            <AppShell>{children}</AppShell>
          </FitnessAnalyticsProvider>
        </FinanceProvider>
      </FileRegistryProvider>
    </QueryClientProvider>
  );
}
