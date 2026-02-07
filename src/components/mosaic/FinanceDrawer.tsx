'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { CategorySpendChart, EssentialVsDiscretionaryChart } from '@/components/finance/SpendingCharts';
import { FinanceInsights } from '@/components/finance/FinanceInsights';
import { useFinanceStore } from '@/store/financeContext';
import { useFileRegistry } from '@/store/fileRegistry';
import { SpendingAnalytics } from '@/lib/spendingAnalytics';
import { Wallet } from 'lucide-react';

interface FinanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FinanceDrawer = ({ isOpen, onClose }: FinanceDrawerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const { analytics, setAnalytics } = useFinanceStore();
  const { setFile } = useFileRegistry();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('domain', 'finance');

      const response = await fetch('/api/upload/csv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      
      // Register file in FileRegistry
      setFile('finance_json', selectedFile);
      
      // Set analytics from upload response
      if (data.analytics) {
        setAnalytics(data.analytics);
      }

      setUploadSuccess(true);
      setSelectedFile(null);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to upload JSON file';
      setUploadError(errorMsg);
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

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
            className="fixed right-0 top-0 h-full w-full max-w-4xl bg-bg shadow-glass-lg z-50 overflow-y-auto"
          >
            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-2xl bg-glass border border-stroke">
                    <Wallet size={32} strokeWidth={1.5} className="text-text" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-text">Finance</h2>
                    <p className="text-muted">Track spending and analyze patterns</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X size={20} />
                </Button>
              </div>

              {/* Upload Section */}
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

                  {/* Success message */}
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

                  {/* Error message */}
                  {uploadError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                    >
                      <AlertCircle size={18} className="text-red-600" />
                      <span className="text-sm text-red-700">{uploadError}</span>
                    </motion.div>
                  )}
                </div>
              </GlassCard>

              {/* Analytics Display */}
              {analytics ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <FinanceInsights analytics={analytics} />
                  <CategorySpendChart analytics={analytics} />
                  <EssentialVsDiscretionaryChart analytics={analytics} />
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <Skeleton className="h-32 rounded-xl" />
                  <Skeleton className="h-96 rounded-xl" />
                  <Skeleton className="h-96 rounded-xl" />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
