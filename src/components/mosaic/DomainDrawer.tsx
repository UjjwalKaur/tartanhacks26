'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, CheckCircle2, RefreshCw } from 'lucide-react';
import { Domain } from '@/types/schemas';
import { DOMAIN_CONFIG } from '@/lib/domainConfig';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { useDashboard } from '@/hooks/useDashboard';
import { useSpendingAnalysis } from '@/hooks/useSpendingAnalysis';
import { SpendingAnalysisDisplay } from '@/components/mosaic/SpendingAnalysisDisplay';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DomainDrawerProps {
  domain: Domain | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DomainDrawer = ({ domain, isOpen, onClose }: DomainDrawerProps) => {
  const { data } = useDashboard();
  const { refetch } = useSpendingAnalysis();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
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