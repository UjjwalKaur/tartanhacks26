import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export interface SpendingAnalysisData {
  success: boolean;
  data: {
    file: string;
    transactionCount: number;
    analysis: {
      summary: string;
      patterns: string[];
      intent: string;
      categoryBreakdown: Record<string, number>;
      topMerchants: Array<{ merchant: string; total: number; frequency: number }>;
      insights: string[];
      recommendations: string[];
    } | null;
    basicAnalysis: {
      categoryBreakdown: Record<string, number>;
      topMerchants: Array<{ merchant: string; total: number; frequency: number }>;
      totalSpent: number;
      dateRange: { start: string; end: string };
    };
  };
}

export function useSpendingAnalysis() {
  return useQuery({
    queryKey: ['spendingAnalysis'],
    queryFn: async () => {
      const result = await apiClient.analyzeSpending();
      return result as SpendingAnalysisData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

export function useAnalyzeSpendingMutation() {
  return useMutation({
    mutationFn: async () => {
      const result = await apiClient.analyzeSpending();
      return result as SpendingAnalysisData;
    },
  });
}
