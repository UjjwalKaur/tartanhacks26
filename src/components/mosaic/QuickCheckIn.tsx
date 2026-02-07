'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Checkin } from '@/types/checkin';

export const QuickCheckIn = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [textEntry, setTextEntry] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);
  const [savedCheckin, setSavedCheckin] = useState<Checkin | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowError(null);

    try {
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_of_checkin: date,
          text_entry: textEntry,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save check-in');
      }

      const data = await response.json();
      setSavedCheckin(data.checkin);
      setShowSuccess(true);
      setTextEntry('');
      setDate(new Date().toISOString().split('T')[0]);

      setTimeout(() => setShowSuccess(false), 5000);
      setTimeout(() => setSavedCheckin(null), 6000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      setShowError(message);
      setTimeout(() => setShowError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles size={20} className="text-text" />
        <h2 className="text-xl font-semibold text-text">Wellness Check-In</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-white/5 text-text placeholder-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-text"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            How are you feeling today? (free text)
          </label>
          <textarea
            value={textEntry}
            onChange={(e) => setTextEntry(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-white/5 text-text placeholder-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-text resize-none"
            rows={4}
            placeholder="Tell us about your day, stress levels, emotions, spending decisions, or anything on your mind..."
            minLength={10}
            required
          />
          <p className="text-xs text-muted mt-1">
            Min 10 characters. AI will extract emotions, stress level, and financial patterns.
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading || textEntry.length < 10}
        >
          {loading ? 'Processing with Dedalus AI...' : 'Save Check-In'}
        </Button>
      </form>

      {showSuccess && savedCheckin && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30 space-y-3"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={18} className="text-green-400" />
            <span className="text-sm font-medium text-green-400">
              Check-in saved and analyzed!
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white/5 rounded-lg p-2">
              <div className="text-muted mb-1">Emotions</div>
              <div className="text-text font-semibold">
                {savedCheckin.emotion1}
              </div>
              <div className="text-muted text-xs">
                {savedCheckin.emotion2}, {savedCheckin.emotion3}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <div className="text-muted mb-1">Stress</div>
              <div className="text-text font-semibold">{savedCheckin.stress}/10</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <div className="text-muted mb-1">Spending Pattern</div>
              <div className="text-text font-semibold capitalize text-xs">
                {savedCheckin.financial_flags.replace(/_/g, ' ')}
              </div>
            </div>
          </div>

          <div className="text-xs text-muted italic">
            "{savedCheckin.life_event_summary}"
          </div>
        </motion.div>
      )}

      {showError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-2"
        >
          <AlertCircle size={18} className="text-red-400" />
          <span className="text-sm text-red-400">{showError}</span>
        </motion.div>
      )}
    </GlassCard>
  );
};