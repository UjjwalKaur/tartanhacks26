'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, PieChart, Pie, Cell
} from 'recharts';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, Heart, DollarSign, AlertCircle } from 'lucide-react';

interface Transaction {
  transaction_id: string;
  date: string;
  name: string;
  merchant: string;
  amount: number;
  currency: string;
  category: string;
  group: string;
  payment_channel: string;
  pending: boolean;
  account: string;
}

interface HealthData {
  date: string;
  sleep_total_min: number;
  sleep_efficiency: number;
  hr_resting: number;
  steps: number;
  exercise_min: number;
  active_energy_kcal: number;
}

interface VideoSentiment {
  date: string;
  video_id: string;
  sentiment_score: number;
  stress_score: number;
  dominant_emotions: string[];
  summary: string;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export const MockDataGraphs = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [videoSentiment, setVideoSentiment] = useState<VideoSentiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load mock data
  useEffect(() => {
    const loadMockData = async () => {
      try {
        const [txRes, healthRes, videoRes] = await Promise.all([
          fetch('/mock/transactions.json'),
          fetch('/mock/watch_daily.json'),
          fetch('/mock/video_sentiment.json'),
        ]);

        if (!txRes.ok || !healthRes.ok || !videoRes.ok) {
          throw new Error('Failed to load mock data files');
        }

        const [txData, healthDataRaw, videoData] = await Promise.all([
          txRes.json() as Promise<Transaction[]>,
          healthRes.json() as Promise<HealthData[]>,
          videoRes.json() as Promise<VideoSentiment[]>,
        ]);

        setTransactions(txData);
        setHealthData(healthDataRaw);
        setVideoSentiment(videoData);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error loading data');
        setIsLoading(false);
      }
    };

    loadMockData();
  }, []);

  // Compute aggregated data
  const dailySpending = useMemo(() => {
    const spending: { [key: string]: number } = {};
    transactions.forEach((tx) => {
      if (!spending[tx.date]) spending[tx.date] = 0;
      spending[tx.date] += Math.abs(tx.amount);
    });
    return Object.entries(spending)
      .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions]);

  const spendingByCategory = useMemo(() => {
    const totals: { [key: string]: number } = {};
    transactions.forEach((tx) => {
      if (!totals[tx.category]) totals[tx.category] = 0;
      totals[tx.category] += Math.abs(tx.amount);
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const spendingByGroup = useMemo(() => {
    const totals: { [key: string]: number } = {};
    transactions.forEach((tx) => {
      if (!totals[tx.group]) totals[tx.group] = 0;
      totals[tx.group] += Math.abs(tx.amount);
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [transactions]);

  const combinedHealthSpendingStress = useMemo(() => {
    const combined: {
      [key: string]: { date: string; steps?: number; spending?: number; stress?: number; sleep?: number };
    } = {};

    healthData.forEach((h) => {
      combined[h.date] = { ...combined[h.date], date: h.date, steps: h.steps, sleep: h.sleep_total_min };
    });

    const dailySpendMap: { [key: string]: number } = {};
    dailySpending.forEach((ds) => {
      dailySpendMap[ds.date] = ds.amount;
    });

    videoSentiment.forEach((vs) => {
      combined[vs.date] = { ...combined[vs.date], date: vs.date, stress: vs.stress_score };
    });

    Object.keys(combined).forEach((date) => {
      combined[date].spending = dailySpendMap[date] || 0;
    });

    return Object.values(combined).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [healthData, videoSentiment, dailySpending]);

  const stressVsSpending = useMemo(() => {
    return combinedHealthSpendingStress
      .filter((d) => d.stress !== undefined && d.spending !== undefined)
      .slice(-30);
  }, [combinedHealthSpendingStress]);

  const stepsVsSleep = useMemo(() => {
    return healthData
      .map((d) => ({
        date: d.date,
        steps: d.steps,
        sleep: d.sleep_total_min,
        efficiency: d.sleep_efficiency,
      }))
      .slice(-30);
  }, [healthData]);

  const emotionTimeSeries = useMemo(() => {
    return videoSentiment.map((vs) => ({
      date: vs.date,
      sentiment: vs.sentiment_score,
      stress: vs.stress_score,
    }));
  }, [videoSentiment]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <GlassCard key={i} className="p-6 h-80 animate-pulse bg-white/5" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6 border border-red-500/20 bg-red-500/5">
        <div className="flex items-center space-x-2 text-red-400">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Spending Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign size={20} className="text-blue-400" />
            <h3 className="text-xl font-semibold text-text">Daily Spending Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailySpending}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
              />
              <Line type="monotone" dataKey="amount" stroke="#3b82f6" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </motion.div>

      {/* Spending by Group (Pie) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign size={20} className="text-purple-400" />
            <h3 className="text-xl font-semibold text-text">Needs vs Wants vs Income</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={spendingByGroup}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: $${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {spendingByGroup.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </motion.div>

      {/* Stress vs Spending Scatter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle size={20} className="text-orange-400" />
            <h3 className="text-xl font-semibold text-text">Stress vs Spending Correlation</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                type="number"
                dataKey="stress"
                name="Stress Score"
                stroke="rgba(255,255,255,0.5)"
              />
              <YAxis
                type="number"
                dataKey="spending"
                name="Spending ($)"
                stroke="rgba(255,255,255,0.5)"
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
              />
              <Scatter name="Daily Data" data={stressVsSpending} fill="#f59e0b" />
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-sm text-muted mt-4">
            Shows the relationship between daily stress levels and spending amount
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
};
