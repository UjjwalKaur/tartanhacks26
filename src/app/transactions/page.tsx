'use client';

import { useTransactionsSummary } from '@/hooks/useDashboard';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TransactionsPage() {
  const { data, isLoading, error } = useTransactionsSummary();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-text mb-2">Unable to Load Transactions</h2>
          <p className="text-muted">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
        </GlassCard>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <GlassCard className="p-6 h-96">
          <Skeleton className="w-full h-full" />
        </GlassCard>
      </div>
    );
  }

  const chartData = Object.entries(data.totalsByCategory).map(([category, amount]) => ({
    category,
    amount: Math.abs(amount),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-text mb-2">Transactions</h1>
        <p className="text-muted">Overview of your spending patterns</p>
      </div>

      {/* Category Summary */}
      <GlassCard className="p-6">
        <h2 className="text-2xl font-semibold text-text mb-6">Spending by Category</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke)" />
            <XAxis
              dataKey="category"
              tick={{ fill: 'var(--muted)', fontSize: 12 }}
              stroke="var(--stroke)"
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              tick={{ fill: 'var(--muted)', fontSize: 12 }}
              stroke="var(--stroke)"
            />
            <Tooltip
              contentStyle={{
                background: 'var(--glass)',
                border: '1px solid var(--stroke)',
                borderRadius: '0.5rem',
                backdropFilter: 'blur(var(--blur))',
              }}
              formatter={(value: number) => `$${value.toFixed(2)}`}
            />
            <Bar dataKey="amount" fill="var(--text)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Recent Transactions */}
      <div>
        <h2 className="text-2xl font-semibold text-text mb-4">Recent Transactions</h2>
        <div className="space-y-3">
          {data.recentTransactions.map((transaction) => (
            <GlassCard key={transaction.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-text">{transaction.description}</div>
                  <div className="text-sm text-muted">{transaction.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-text">
                    ${Math.abs(transaction.amount).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted">{transaction.date}</div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}