'use client';

import { useState, useRef } from 'react';
import { useFileRegistry } from '@/store/fileRegistry';
import { useFitnessStore } from '@/store/fitnessContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { FitnessInsights } from '@/components/fitness/FitnessInsights';
import { CorrelationGraph } from '@/components/fitness/CorrelationGraph';
import { analyzeFitness, FitnessEntry } from '@/lib/fitnessAnalytics';
import { analyzeCorrelation, Transaction } from '@/lib/correlationAnalytics';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const HealthDrawer = () => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [correlationAnalysis, setCorrelationAnalysis] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { setFile, getFile } = useFileRegistry();
  const { analytics, setAnalytics } = useFitnessStore();

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    setError(null);
    setIsLoading(true);

    try {
      // Validate file type
      if (!file.name.endsWith('.json') && file.type !== 'application/json') {
        throw new Error('Please upload a JSON file');
      }

      // Read and parse file
      const text = await file.text();
      let data: any;
      
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON format');
      }

      // Validate data structure
      if (!Array.isArray(data.entries) && !Array.isArray(data)) {
        throw new Error('JSON must contain an "entries" array or be an array of entries');
      }

      const entries: FitnessEntry[] = Array.isArray(data) ? data : data.entries;

      // Validate entries
      if (entries.length === 0) {
        throw new Error('No entries found in file');
      }

      // Validate entry structure
      const requiredFields = ['date', 'sleep_total_min', 'sleep_efficiency', 'hr_resting', 'steps', 'exercise_min', 'active_energy_kcal'];
      const firstEntry = entries[0];
      
      for (const field of requiredFields) {
        if (!(field in firstEntry)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Analyze fitness data
      const fitnessAnalytics = analyzeFitness(entries);
      if (!fitnessAnalytics) {
        throw new Error('Failed to analyze fitness data');
      }

      // SAVE FILE TO BACKEND
      const formData = new FormData();
      formData.append('file', file);
      formData.append('domain', 'physical');

      const uploadResponse = await fetch('/api/upload/csv', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      console.log('Health file uploaded successfully to backend');

      // Store file in registry for UI
      setFile('physical_json', file);
      
      // Store analytics in memory
      setAnalytics(fitnessAnalytics);

      // Try to compute correlation if we have finance data
      try {
        const financeFile = getFile('finance_json');
        if (financeFile) {
          console.log('Found finance file, computing correlation...');
          const financeText = await financeFile.text();
          const financeData = JSON.parse(financeText);
          
          // Handle multiple transaction formats
          let transactionList = financeData.transactions || financeData.data || (Array.isArray(financeData) ? financeData : []);
          
          const transactions: Transaction[] = transactionList.map((t: any) => ({
            date: t.date,
            category: t.category || t.merchant_category || '',
            amount: t.amount || 0,
            merchant: t.merchant,
          }));

          if (transactions.length > 0) {
            const correlation = analyzeCorrelation(entries, transactions);
            setCorrelationAnalysis(correlation);
            console.log('Correlation computed:', correlation);
          } else {
            console.log('No valid transactions found in finance data');
          }
        } else {
          console.log('No finance file found in registry - correlation skipped');
        }
      } catch (corrError) {
        console.error('Correlation analysis error:', corrError);
        console.log('Correlation analysis skipped - finance data not available or invalid');
      }

      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process file';
      setError(message);
      setAnalytics(null);
      setCorrelationAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadedFile = getFile('physical_json');

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!uploadedFile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/20 hover:border-white/30 bg-white/5'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={32} className="mx-auto mb-3 text-muted" />
            <p className="text-text font-semibold mb-1">Drop fitness data here</p>
            <p className="text-sm text-muted">or click to select JSON file</p>
            <p className="text-xs text-muted mt-3">
              Format: {'{date, sleep_total_min, sleep_efficiency, hr_resting, steps, exercise_min, active_energy_kcal}'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <GlassCard className="p-6 border border-white/10">
          <p className="text-muted text-sm">Analyzing fitness data...</p>
        </GlassCard>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-4 border border-red-500/20 bg-gradient-to-br from-red-500/5 to-rose-500/5">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-text">Upload Failed</p>
                <p className="text-sm text-muted mt-1">{error}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* File Info */}
      {uploadedFile && !error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-4 border border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-green-600" />
                <div>
                  <p className="font-semibold text-text">{uploadedFile.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {(uploadedFile.size / 1024).toFixed(1)} KB • Uploaded: {new Date(uploadedFile.lastModified).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-text transition"
              >
                Replace
              </button>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Analytics Display */}
      {analytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-xl font-bold text-text mb-4">Finance-Linked Health Metrics</h3>
          <FitnessInsights analytics={analytics} />
        </motion.div>
      )}

      {/* Correlation Graph */}
      {correlationAnalysis ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CorrelationGraph analysis={correlationAnalysis} />
        </motion.div>
      ) : uploadedFile ? (
        <GlassCard className="p-4 border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
          <p className="text-sm text-muted">
            💡 <span className="font-semibold">Tip:</span> Upload transaction data to Finance tab to see correlation analysis with your spending patterns.
          </p>
        </GlassCard>
      ) : null}
    </div>
  );
};
