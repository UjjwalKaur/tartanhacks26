'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Domain } from '@/types/schemas';
import { DOMAIN_CONFIG } from '@/lib/domainConfig';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { useDashboard } from '@/hooks/useDashboard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DomainDrawerProps {
  domain: Domain | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DomainDrawer = ({ domain, isOpen, onClose }: DomainDrawerProps) => {
  const { data } = useDashboard();
  
  if (!domain) return null;

  const config = DOMAIN_CONFIG[domain];
  const Icon = config.icon;
  const domainData = data?.domains.find(d => d.domain === domain);

  // Mock chart data
  const chartData = [
    { date: 'Jan 30', score: 72 },
    { date: 'Jan 31', score: 70 },
    { date: 'Feb 1', score: 68 },
    { date: 'Feb 2', score: 65 },
    { date: 'Feb 3', score: 67 },
    { date: 'Feb 4', score: 68 },
    { date: 'Feb 5', score: domainData?.score || 68 },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-text/20 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-bg shadow-glass-lg z-50 overflow-y-auto"
          >
            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-2xl bg-glass border border-stroke">
                    <Icon size={32} strokeWidth={1.5} className="text-text" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-text">{config.label}</h2>
                    <p className="text-muted">{config.description}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X size={20} />
                </Button>
              </div>

              {/* Score Overview */}
              {domainData && (
                <GlassCard className="p-6">
                  <h3 className="text-sm font-medium text-muted mb-2">Current Risk Score</h3>
                  <div className="text-5xl font-bold text-text">{domainData.score}</div>
                  <div className="mt-4">
                    <p className="text-sm text-muted mb-2">Trend over last 7 days</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke)" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: 'var(--muted)', fontSize: 12 }}
                          stroke="var(--stroke)"
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
                            backdropFilter: 'blur(var(--blur))'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="var(--text)" 
                          strokeWidth={2}
                          dot={{ fill: 'var(--text)', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              )}

              {/* Key Drivers */}
              {domainData && domainData.drivers.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-text mb-4">Key Drivers</h3>
                  <div className="space-y-3">
                    {domainData.drivers.map((driver, i) => (
                      <GlassCard key={i} className="p-4">
                        <p className="text-text">{driver}</p>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Insights */}
              <div>
                <h3 className="text-xl font-semibold text-text mb-4">Related Insights</h3>
                <GlassCard className="p-4">
                  <p className="text-muted text-sm">
                    Insights related to {config.label.toLowerCase()} will appear here.
                  </p>
                </GlassCard>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};