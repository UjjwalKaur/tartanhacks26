import { Domain } from '@/types/schemas';
import { Wallet, Brain, Heart } from 'lucide-react';

export interface DomainConfig {
  label: string;
  icon: any;
  description: string;
  color: string;
}

export const DOMAIN_CONFIG: Record<Domain, DomainConfig> = {
  finance: {
    label: 'Finance',
    icon: Wallet,
    description: 'Financial health and spending patterns',
    color: 'rgba(210, 160, 70, 0.3)',
  },
  mental: {
    label: 'Mental',
    icon: Brain,
    description: 'Mental wellbeing and stress levels',
    color: 'rgba(140, 120, 200, 0.3)',
  },
  physical: {
    label: 'Physical',
    icon: Heart,
    description: 'Physical health and activity',
    color: 'rgba(80, 160, 110, 0.3)',
  },
};

export const getRiskColor = (score: number): string => {
  if (score >= 70) return 'var(--risk-low)';
  if (score >= 40) return 'var(--risk-med)';
  return 'var(--risk-high)';
};

export const getRiskSolidColor = (score: number): string => {
  if (score >= 70) return 'var(--risk-low-solid)';
  if (score >= 40) return 'var(--risk-med-solid)';
  return 'var(--risk-high-solid)';
};

export const getRiskLabel = (score: number): string => {
  if (score >= 70) return 'Healthy';
  if (score >= 40) return 'Moderate';
  return 'At Risk';
};