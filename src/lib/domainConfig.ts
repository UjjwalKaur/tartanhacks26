import { Domain } from '@/types/schemas';
import { Wallet, Brain, Heart } from 'lucide-react';

export interface DomainConfig {
  label: string;
  icon: any;
  description: string;
  color: string;
}

export interface MosaicLayoutItem {
  id: Domain;
  label: string;
  rowStart: number;
  rowEnd: number;
  colStart: number;
  colEnd: number;
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

// Asymmetrical mosaic layout (4x4 grid)
// Finance: 2x2 top-left
// Mental: 2x2 top-right
// Physical: 2x2 bottom-center spanning
export const MOSAIC_LAYOUT: MosaicLayoutItem[] = [
  {
    id: 'finance',
    label: 'Finance',
    rowStart: 1,
    rowEnd: 3,
    colStart: 1,
    colEnd: 3,
  },
  {
    id: 'mental',
    label: 'Mental',
    rowStart: 1,
    rowEnd: 3,
    colStart: 3,
    colEnd: 5,
  },
  {
    id: 'physical',
    label: 'Physical',
    rowStart: 3,
    rowEnd: 5,
    colStart: 2,
    colEnd: 4,
  },
];

export const getRiskColor = (score: number): string => {
  if (score <= 1) return 'var(--risk-low)';
  if (score <= 2) return 'var(--risk-med)';
  return 'var(--risk-high)';
};

export const getRiskSolidColor = (score: number): string => {
  if (score <= 1) return 'var(--risk-low-solid)';
  if (score <= 2) return 'var(--risk-med-solid)';
  return 'var(--risk-high-solid)';
};

export const getRiskLabel = (score: number): string => {
  if (score <= 1) return 'Healthy';
  if (score <= 2) return 'Moderate';
  return 'At Risk';
};