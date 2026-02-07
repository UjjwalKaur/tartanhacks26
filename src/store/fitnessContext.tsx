'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { FitnessAnalytics } from '@/lib/fitnessAnalytics';

interface FitnessContextType {
  analytics: FitnessAnalytics | null;
  setAnalytics: (analytics: FitnessAnalytics | null) => void;
}

const FitnessContext = createContext<FitnessContextType | undefined>(undefined);

export const useFitnessStore = () => {
  const context = useContext(FitnessContext);
  if (!context) {
    throw new Error('useFitnessStore must be used within FitnessProvider');
  }
  return context;
};

export const FitnessAnalyticsProvider = ({ children }: { children: ReactNode }) => {
  const [analytics, setAnalytics] = useState<FitnessAnalytics | null>(null);

  return (
    <FitnessContext.Provider value={{ analytics, setAnalytics }}>
      {children}
    </FitnessContext.Provider>
  );
};
