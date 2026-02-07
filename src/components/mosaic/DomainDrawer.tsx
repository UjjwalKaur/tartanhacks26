'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, CheckCircle2, RefreshCw, TrendingUp } from 'lucide-react';
import { Domain } from '@/types/schemas';
import { DOMAIN_CONFIG } from '@/lib/domainConfig';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { useDashboard } from '@/hooks/useDashboard';
import { useSpendingAnalysis } from '@/hooks/useSpendingAnalysis';
import { SpendingAnalysisDisplay } from '@/components/mosaic/SpendingAnalysisDisplay';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { computeMentalHealthMetrics, type MajorLifeEvent } from '@/lib/mentalHealthMetrics';
import { Checkin } from '@/types/checkin';
import { Transaction } from '@/types/schemas';

interface DomainDrawerProps {
  domain: Domain | null;
  isOpen: boolean;
  onClose: () => void;
}

// Life Event Bubble Cloud Component
interface LifeEventBubbleCloudProps {
  events: MajorLifeEvent[];
}

const LifeEventBubbleCloud: React.FC<LifeEventBubbleCloudProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center">
        <p className="text-muted text-sm">No major life events to display yet</p>
      </div>
    );
  }

  // Normalize spend to font size (12px to 32px)
  const maxSpend = Math.max(...events.map((e) => e.spend));
  const minSpend = Math.min(...events.map((e) => e.spend));
  const spendRange = maxSpend - minSpend || 1;

  const getBubbleSize = (spend: number): { fontSize: number; padding: number } => {
    const normalized = (spend - minSpend) / spendRange;
    const fontSize = 12 + normalized * 20; // 12px to 32px
    const padding = 8 + normalized * 12; // 8px to 20px
    return { fontSize, padding };
  };

  // Simple grid-based layout to minimize overlapping
  const positions: Array<{ event: MajorLifeEvent; x: number; y: number; size: ReturnType<typeof getBubbleSize> }> = [];
  const cols = 3;
  const rowHeight = 100;
  const colWidth = 280 / cols;

  events.forEach((event, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = col * colWidth + (colWidth - 50) / 2; // Center-ish
    const y = row * rowHeight + 20;
    positions.push({
      event,
      x,
      y,
      size: getBubbleSize(event.spend),
    });
  });

  return (
    <div className="relative w-full h-72 bg-white/5 rounded-lg overflow-hidden">
      {positions.map(({ event, x, y, size }, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300 }}
          className="absolute flex flex-col items-center justify-center rounded-full bg-gradient-to-br from-amber-500/30 to-yellow-500/20 border border-amber-500/40 hover:border-amber-500/60 transition-all cursor-pointer group"
          style={{
            left: `${x}px`,
            top: `${y}px`,
            width: `${size.padding * 6}px`,
            height: `${size.padding * 6}px`,
          }}
        >
          <div className="text-center px-2 py-1">
            <p
              className="text-text font-semibold leading-tight"
              style={{ fontSize: `${size.fontSize * 0.8}px` }}
            >
              {event.phrase.length > 20
                ? event.phrase.substring(0, 20) + '…'
                : event.phrase}
            </p>
            <p
              className="text-amber-400 font-bold"
              style={{ fontSize: `${size.fontSize * 0.7}px` }}
            >
              ${event.spend.toFixed(0)}
            </p>
          </div>
          <div className="absolute inset-0 rounded-full bg-amber-500/0 group-hover:bg-amber-500/10 transition pointer-events-none" />
        </motion.div>
      ))}
    </div>
  );
};

export const DomainDrawer = ({ domain, isOpen, onClose }: DomainDrawerProps) => {
  const { data } = useDashboard();
  const { refetch } = useSpendingAnalysis();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Mental health state
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [mentalMetrics, setMentalMetrics] = useState<any>(null);
  const [isLoadingMentalData, setIsLoadingMentalData] = useState(false);
  
  // Load and compute mental health metrics
  useEffect(() => {
    if (domain === 'mental' && isOpen) {
      const loadMentalData = async () => {
        setIsLoadingMentalData(true);
        try {
          // Fetch checkins
          const checkinsRes = await fetch('/api/checkins');
          let checkinsList: Checkin[] = [];
          if (checkinsRes.ok) {
            const checkinsData = await checkinsRes.json();
            checkinsList = checkinsData.checkins || [];
            setCheckins(checkinsList);
          }
          
          // Fetch transactions from spending analysis endpoint
          const transactionsRes = await fetch('/api/analyze/spending');
          let transactions: Transaction[] = [];
          if (transactionsRes.ok) {
            const spendingData = await transactionsRes.json();
            // Extract transactions from spending analysis response
            if (spendingData.transactions && Array.isArray(spendingData.transactions)) {
              transactions = spendingData.transactions;
            }
          }
          
          const metrics = computeMentalHealthMetrics(checkinsList, transactions);
          setMentalMetrics(metrics);
        } catch (error) {
          console.error('Failed to load mental health data:', error);
        } finally {
          setIsLoadingMentalData(false);
        }
      };
      
      loadMentalData();
    }
  }, [domain, isOpen]);

  if (!domain) return null;

  const config = DOMAIN_CONFIG[domain];
  const Icon = config.icon;
  const domainData = data?.domains.find(d => d.domain === domain);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('domain', domain);

      const response = await fetch('/api/upload/csv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setUploadSuccess(true);
      setSelectedFile(null);
      // Refetch analysis after successful upload
      await refetch();
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload JSON file');
    } finally {
      setIsUploading(false);
    }
  };

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

              {/* CSV Upload Section - Finance Domain Only */}
              {domain === 'finance' && (
                <>
                  <GlassCard className="p-6 border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Upload size={20} className="text-amber-600" />
                        <h3 className="font-semibold text-text">Upload Transaction Data</h3>
                      </div>
                      <p className="text-sm text-muted">
                        Upload a JSON file with your transaction details. We'll analyze spending patterns and provide insights.
                      </p>
                      
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      {/* File selection button */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-dashed border-amber-500/30 rounded-xl hover:border-amber-500/50 hover:bg-amber-500/5 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload size={18} className="text-amber-600" />
                        <span className="text-sm font-medium text-text">
                          {selectedFile ? selectedFile.name : 'Choose a JSON file'}
                        </span>
                      </button>

                      {/* Selected file info and upload button */}
                      {selectedFile && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
                        >
                          <div>
                            <p className="text-xs text-muted mb-1">Selected file:</p>
                            <p className="text-sm font-medium text-text truncate">{selectedFile.name}</p>
                            <p className="text-xs text-muted">
                              {(selectedFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <Button
                            onClick={handleUploadClick}
                            disabled={isUploading}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                            size="sm"
                          >
                            {isUploading ? 'Uploading...' : 'Upload File'}
                          </Button>
                        </motion.div>
                      )}

                      {uploadSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                        >
                          <CheckCircle2 size={18} className="text-green-600" />
                          <span className="text-sm text-green-700">File uploaded successfully!</span>
                        </motion.div>
                      )}
                    </div>
                  </GlassCard>

                  {/* Spending Analysis - Finance Domain */}
                  <div className="pt-4">
                    <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                      <RefreshCw size={18} />
                      Spending Analysis
                    </h3>
                    <SpendingAnalysisDisplay />
                  </div>
                </>
              )}

              {/* Mental Health Insights */}
              {domain === 'mental' && (
                <div className="space-y-6">
                  {isLoadingMentalData ? (
                    <GlassCard className="p-6">
                      <p className="text-muted">Loading mental health data...</p>
                    </GlassCard>
                  ) : mentalMetrics ? (
                    <>
                      {/* Stress vs Spending Impact */}
                      {mentalMetrics && mentalMetrics.stressSpendingComparison && (
                        <GlassCard className="p-6 border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
                          <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
                            <TrendingUp size={18} className="text-purple-600" />
                            Stress vs Spending Impact
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted mb-1">High Stress Days</p>
                              <p className="text-2xl font-bold text-text">
                                ${mentalMetrics.stressSpendingComparison.highStressAvgSpend.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted mt-1">avg spend</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted mb-1">Low Stress Days</p>
                              <p className="text-2xl font-bold text-text">
                                ${mentalMetrics.stressSpendingComparison.lowStressAvgSpend.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted mt-1">avg spend</p>
                            </div>
                          </div>
                          <div className="mt-3 p-2 rounded-lg bg-white/5">
                            <p className="text-sm font-medium text-yellow-400">
                              {mentalMetrics.stressSpendingComparison.differencePercent > 0 
                                ? '↑ ' + mentalMetrics.stressSpendingComparison.differencePercent.toFixed(1) + '% more'
                                : '↓ ' + Math.abs(mentalMetrics.stressSpendingComparison.differencePercent).toFixed(1) + '% less'
                              } spending when stressed
                            </p>
                          </div>
                        </GlassCard>
                      )}

                      {/* Emotional Risk Analysis */}
                      {mentalMetrics && mentalMetrics.emotionalRiskAnalysis && (
                        <GlassCard className="p-6 border border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5">
                          <h3 className="font-semibold text-text mb-4">Emotional Risk Analysis</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted mb-1">Risk Emotions</p>
                              <p className="text-2xl font-bold text-red-400">
                                ${mentalMetrics.emotionalRiskAnalysis.riskEmotionDaysAvgSpend.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted mt-1">avg spend</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted mb-1">Other Emotions</p>
                              <p className="text-2xl font-bold text-green-400">
                                ${mentalMetrics.emotionalRiskAnalysis.nonRiskEmotionDaysAvgSpend.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted mt-1">avg spend</p>
                            </div>
                          </div>
                          <div className="mt-3 p-2 rounded-lg bg-white/5">
                            <p className="text-sm font-medium text-red-400">
                              {mentalMetrics.emotionalRiskAnalysis.differencePercent > 0 
                                ? '↑ ' + mentalMetrics.emotionalRiskAnalysis.differencePercent.toFixed(1) + '% more'
                                : '↓ ' + Math.abs(mentalMetrics.emotionalRiskAnalysis.differencePercent).toFixed(1) + '% less'
                              } during vulnerable emotions
                            </p>
                          </div>
                        </GlassCard>
                      )}

                      {/* Spending by Financial Flags Chart */}
                      {mentalMetrics && mentalMetrics.spendByFinancialFlags && mentalMetrics.spendByFinancialFlags.length > 0 && (
                        <GlassCard className="p-6 border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
                          <h3 className="font-semibold text-text mb-4">Spending Patterns</h3>
                          <div className="w-full h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={mentalMetrics.spendByFinancialFlags}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke)" />
                                <XAxis 
                                  dataKey="flag" 
                                  tick={{ fill: 'var(--muted)', fontSize: 11 }}
                                  angle={-45}
                                  textAnchor="end"
                                  height={80}
                                />
                                <YAxis 
                                  tick={{ fill: 'var(--muted)', fontSize: 12 }}
                                  stroke="var(--stroke)"
                                />
                                <Tooltip 
                                  contentStyle={{ 
                                    background: 'var(--glass)', 
                                    border: '1px solid var(--stroke)',
                                    borderRadius: '0.5rem'
                                  }}
                                  formatter={(value) => `$${(value as number).toFixed(2)}`}
                                />
                                <Bar dataKey="avgDiscretionarySpend" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </GlassCard>
                      )}

                      {/* Top Life Event Keywords */}
                      {mentalMetrics && mentalMetrics.topLifeEventKeywords && mentalMetrics.topLifeEventKeywords.length > 0 && (
                        <GlassCard className="p-6 border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-yellow-500/5">
                          <h3 className="font-semibold text-text mb-4">Major Life Events</h3>
                          <LifeEventBubbleCloud events={mentalMetrics.majorLifeEvents || []} />
                        </GlassCard>
                      )}

                      {checkins.length === 0 && (
                        <GlassCard className="p-6 border border-muted/20">
                          <p className="text-muted text-sm text-center">
                            No check-ins yet. Start by submitting a check-in from the Daily Check-In form!
                          </p>
                        </GlassCard>
                      )}
                    </>
                  ) : (
                    <GlassCard className="p-6">
                      <p className="text-muted">No mental health data available yet</p>
                    </GlassCard>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};