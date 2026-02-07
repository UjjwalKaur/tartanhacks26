'use client';

import { useFileRegistry } from '@/store/fileRegistry';
import { useFinanceStore } from '@/store/financeContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { analyzeSpending } from '@/lib/spendingAnalytics';
import { CategorySpendChart, EssentialVsDiscretionaryChart } from '@/components/finance/SpendingCharts';
import { FinanceInsights } from '@/components/finance/FinanceInsights';

export const AnalyticsFromRegistry = () => {
  const { files } = useFileRegistry();
  const { analytics } = useFinanceStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const financeFile = files.get('finance_json');

  useEffect(() => {
    const analyzeFile = async () => {
      if (!financeFile) {
        setError(null);
        return;
      }

      try {
        setIsAnalyzing(true);
        setError(null);

        const text = await financeFile.text();
        const data = JSON.parse(text);
        const transactions = data.transactions || [];

        if (!Array.isArray(transactions) || transactions.length === 0) {
          setError('Invalid transaction data format');
          return;
        }

        const spendingAnalytics = analyzeSpending(
          transactions,
          data.startDate,
          data.endDate
        );

        if (!spendingAnalytics) {
          setError('Failed to analyze spending data');
          return;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to analyze file');
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeFile();
  }, [financeFile]);

  if (!financeFile && !analytics) {
    return (
      <GlassCard className="p-6 border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-text mb-1">No Financial Data</h4>
            <p className="text-sm text-muted">
              Upload a transaction JSON file from the Finance tab to view spending analytics.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6 border border-red-500/20 bg-gradient-to-br from-red-500/5 to-rose-500/5">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-text mb-1">Analysis Error</h4>
            <p className="text-sm text-muted">{error}</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (!analytics || isAnalyzing) {
    return (
      <GlassCard className="p-6 border border-white/10">
        <p className="text-muted text-sm">
          {isAnalyzing ? 'Analyzing spending data...' : 'Loading analytics...'}
        </p>
      </GlassCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h3 className="text-2xl font-bold text-text mb-4">Spending Analytics</h3>
        <FinanceInsights analytics={analytics} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <CategorySpendChart analytics={analytics} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <EssentialVsDiscretionaryChart analytics={analytics} />
        </motion.div>
      </div>
    </motion.div>
  );
};
