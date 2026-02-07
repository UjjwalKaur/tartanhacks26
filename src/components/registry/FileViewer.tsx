'use client';

import { useFileRegistry } from '@/store/fileRegistry';
import { GlassCard } from '@/components/ui/GlassCard';
import { AlertCircle, File } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export const FileViewer = () => {
  const { files, fileRefs } = useFileRegistry();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const activeFiles = Array.from(files.entries());

  if (activeFiles.length === 0) {
    return (
      <GlassCard className="p-6 border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-text mb-1">No Active Files</h4>
            <p className="text-sm text-muted">
              Upload files from the Finance, Health, or Transactions tabs to begin analysis.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-text">Active Files</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeFiles.map(([key, file], idx) => {
          const ref = fileRefs.get(key as any);
          const isSelected = selectedKey === key;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <button
                onClick={() => setSelectedKey(isSelected ? null : key)}
                className="w-full text-left"
              >
                <GlassCard
                  className={`p-4 border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-purple-500 bg-gradient-to-br from-purple-500/10 to-pink-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <File
                      size={20}
                      className={`mt-1 flex-shrink-0 ${
                        isSelected ? 'text-purple-500' : 'text-muted'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text truncate">{ref?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted mt-1">
                        {key} • {ref ? `${(ref.size / 1024).toFixed(1)} KB` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </button>
            </motion.div>
          );
        })}
      </div>

      {selectedKey && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <GlassCard className="p-6 border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
            <h4 className="font-semibold text-text mb-4">File Details</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Type:</span>
                <span className="text-text font-medium">{fileRefs.get(selectedKey as any)?.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Size:</span>
                <span className="text-text font-medium">
                  {((fileRefs.get(selectedKey as any)?.size || 0) / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Uploaded:</span>
                <span className="text-text font-medium">
                  {new Date(fileRefs.get(selectedKey as any)?.uploadedAt || 0).toLocaleDateString()}
                </span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
};
