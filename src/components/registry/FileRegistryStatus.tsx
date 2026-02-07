'use client';

import { useFileRegistry } from '@/store/fileRegistry';
import { GlassCard } from '@/components/ui/GlassCard';
import { AlertCircle, FileJson, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export const FileRegistryStatus = () => {
  const { fileRefs, files, isHydrated } = useFileRegistry();

  if (!isHydrated) {
    return (
      <GlassCard className="p-6 border border-white/10">
        <p className="text-muted text-sm">Loading file registry...</p>
      </GlassCard>
    );
  }

  if (fileRefs.size === 0) {
    return (
      <GlassCard className="p-6 border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-text mb-1">No Files Uploaded</h4>
            <p className="text-sm text-muted">
              Upload transaction data from the Finance tab to get started.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text">Uploaded Files</h3>
        <span className="text-xs bg-blue-500/20 text-blue-600 px-3 py-1 rounded-full">
          {fileRefs.size} file{fileRefs.size !== 1 ? 's' : ''}
        </span>
      </div>

      {Array.from(fileRefs.entries()).map(([key, ref], idx) => {
        const isAvailable = files.has(key);
        const Icon = ref.type === 'application/json' ? FileJson : FileText;

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <GlassCard
              className={`p-4 border ${
                isAvailable
                  ? 'border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5'
                  : 'border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <Icon
                    size={18}
                    className={`mt-1 flex-shrink-0 ${
                      isAvailable ? 'text-green-600' : 'text-amber-600'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text truncate">{ref.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted">
                        {(ref.size / 1024).toFixed(1)} KB
                      </p>
                      <span className="text-xs text-muted">•</span>
                      <p className="text-xs text-muted">
                        {new Date(ref.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      isAvailable
                        ? 'bg-green-500/20 text-green-700'
                        : 'bg-amber-500/20 text-amber-700'
                    }`}
                  >
                    {isAvailable ? 'Ready' : 'Re-upload Required'}
                  </span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        );
      })}
    </div>
  );
};
