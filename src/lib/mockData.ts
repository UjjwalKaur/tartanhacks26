import {
  DashboardPayload,
  TransactionsSummary,
  HealthSummary,
  CheckInRecord,
} from '@/types/schemas';

export const mockDashboardData: DashboardPayload = {
  domains: [
    {
      domain: 'finance',
      score: 1,
      trend: 'down',
      drivers: [
        'Summary of your transactions'
      ],
    },
    {
      domain: 'mental',
      score: 2,
      trend: 'down',
      drivers: [
        'Summary of how your emotions affect spending',
        'Beat the impulse buying by targetting the root cause',
      ],
    },
    {
      domain: 'physical',
      score: 3,
      trend: 'up',
      drivers: [
        'Poor sleep leads to poor decision making and impulse buying',
        'Regular exercise improves mood and reduces stress spending',
      ],
    },
  ],
  edges: [
    {
      from: 'finance',
      to: 'mental',
      strength: 0.75,
      label: 'Financial stress affects mental health',
    },
    {
      from: 'mental',
      to: 'physical',
      strength: 0.6,
      label: 'Mental state impacts physical activity',
    },
    {
      from: 'physical',
      to: 'mental',
      strength: 0.55,
      label: 'Exercise improves mood',
    },
  ],
  insights: [
    {
      id: 'ins-1',
      title: 'Financial anxiety correlates with poor sleep',
      explanation:
        'Over the past 2 weeks, days with high spending showed 30% worse sleep quality and increased stress reporting.',
      evidence: {
        metric: 'Sleep Quality Index',
        values: [6.2, 5.8, 5.1, 4.8, 5.5, 6.0, 5.3],
        dates: ['Jan 30', 'Jan 31', 'Feb 1', 'Feb 2', 'Feb 3', 'Feb 4', 'Feb 5'],
      },
      confidence: 0.82,
    },
    {
      id: 'ins-2',
      title: 'Morning exercise linked to better energy',
      explanation:
        'Check-ins following morning workouts show 40% higher energy scores throughout the day.',
      evidence: {
        metric: 'Daily Energy Score',
        values: [3.5, 4.2, 4.5, 3.8, 4.0, 4.3, 4.1],
        dates: ['Jan 30', 'Jan 31', 'Feb 1', 'Feb 2', 'Feb 3', 'Feb 4', 'Feb 5'],
      },
      confidence: 0.75,
    },
    {
      id: 'ins-3',
      title: 'Weekend spending spikes precede Monday stress',
      explanation:
        'Excessive weekend discretionary spending is followed by elevated stress levels on Mondays.',
      evidence: {
        metric: 'Stress Level',
        values: [2.5, 2.8, 3.5, 4.2, 3.8, 3.2, 2.9],
        dates: ['Jan 30', 'Jan 31', 'Feb 1', 'Feb 2', 'Feb 3', 'Feb 4', 'Feb 5'],
      },
      confidence: 0.68,
    },
  ],
};

export const mockTransactionsSummary: TransactionsSummary = {
  totalsByCategory: {
    'Food & Dining': 487.32,
    'Transportation': 156.89,
    'Entertainment': 245.00,
    'Shopping': 312.45,
    'Utilities': 189.50,
    'Healthcare': 95.00,
  },
  recentTransactions: [
    {
      id: 'txn-1',
      date: '2026-02-05',
      amount: -45.23,
      category: 'Food & Dining',
      description: 'Dinner at Riverstone Cafe',
    },
    {
      id: 'txn-2',
      date: '2026-02-04',
      amount: -89.99,
      category: 'Shopping',
      description: 'Amazon order',
    },
    {
      id: 'txn-3',
      date: '2026-02-04',
      amount: -12.50,
      category: 'Transportation',
      description: 'Uber ride',
    },
    {
      id: 'txn-4',
      date: '2026-02-03',
      amount: -67.80,
      category: 'Food & Dining',
      description: 'Grocery store',
    },
    {
      id: 'txn-5',
      date: '2026-02-02',
      amount: -25.00,
      category: 'Entertainment',
      description: 'Movie tickets',
    },
  ],
};

export const mockHealthSummary: HealthSummary = {
  sleepSeries: [
    { date: '2026-01-30', value: 7.2 },
    { date: '2026-01-31', value: 6.8 },
    { date: '2026-02-01', value: 6.5 },
    { date: '2026-02-02', value: 5.9 },
    { date: '2026-02-03', value: 7.1 },
    { date: '2026-02-04', value: 7.5 },
    { date: '2026-02-05', value: 6.9 },
  ],
  stepsSeries: [
    { date: '2026-01-30', value: 8234 },
    { date: '2026-01-31', value: 9521 },
    { date: '2026-02-01', value: 7845 },
    { date: '2026-02-02', value: 6234 },
    { date: '2026-02-03', value: 10234 },
    { date: '2026-02-04', value: 11023 },
    { date: '2026-02-05', value: 8934 },
  ],
};

export const mockCheckIns: CheckInRecord[] = [
  {
    id: 'ci-1',
    date: '2026-02-05',
    stress: 3,
    energy: 4,
    note: 'Feeling productive today',
  },
  {
    id: 'ci-2',
    date: '2026-02-04',
    stress: 4,
    energy: 3,
    note: 'Bit tired from late night',
  },
  {
    id: 'ci-3',
    date: '2026-02-03',
    stress: 2,
    energy: 5,
    note: 'Great workout this morning!',
  },
];