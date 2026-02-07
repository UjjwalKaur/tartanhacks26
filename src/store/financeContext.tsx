'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { SpendingAnalytics } from '@/lib/spendingAnalytics';

interface FinanceContextType {
  analytics: SpendingAnalytics | null;
  setAnalytics: (analytics: SpendingAnalytics | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinanceStore = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinanceStore must be used within FinanceProvider');
  }
  return context;
};

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const [analytics, setAnalytics] = useState<SpendingAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <FinanceContext.Provider value={{ analytics, setAnalytics, isLoading, setIsLoading }}>
      {children}
    </FinanceContext.Provider>
  );
};
