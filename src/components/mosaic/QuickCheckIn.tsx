'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Activity, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { useCreateCheckIn } from '@/hooks/useDashboard';

export const QuickCheckIn = () => {
  const [stress, setStress] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [geminiInsight, setGeminiInsight] = useState<string | null>(null);

  const { mutate: createCheckIn, isPending } = useCreateCheckIn();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createCheckIn(
      { stress, energy, note: note || undefined },
      {
        onSuccess: (response: any) => {
          setShowSuccess(true);
          setNote('');
          setStress(3);
          setEnergy(3);
          // Display Gemini insight if available
          if (response.analysis) {
            setGeminiInsight(response.analysis);
          }
          setTimeout(() => setShowSuccess(false), 4000);
          setTimeout(() => setGeminiInsight(null), 6000);
        },
      }
    );
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Activity size={20} className="text-text" />
        <h2 className="text-xl font-semibold text-text">Quick Check-In</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Slider
          label="Stress Level"
          min={1}
          max={5}
          value={stress}
          onChange={(e) => setStress(Number(e.target.value))}
        />

        <Slider
          label="Energy Level"
          min={1}
          max={5}
          value={energy}
          onChange={(e) => setEnergy(Number(e.target.value))}
        />

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Notes (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-2 rounded-xl glass-card text-text placeholder-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-text resize-none"
            rows={3}
            placeholder="How are you feeling today?"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? 'Submitting...' : 'Submit Check-In'}
        </Button>
      </form>

      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-4 p-3 rounded-xl bg-[var(--risk-low)] border border-[var(--risk-low-solid)] border-opacity-20 flex items-center space-x-2"
        >
          <CheckCircle2 size={18} className="text-[var(--risk-low-solid)]" />
          <span className="text-sm text-[var(--risk-low-solid)]">
            Check-in saved successfully!
          </span>
        </motion.div>
      )}

      {geminiInsight && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 space-y-2"
        >
          <div className="flex items-center space-x-2">
            <Sparkles size={18} className="text-purple-400" />
            <span className="text-sm font-semibold text-purple-300">AI Insight</span>
          </div>
          <p className="text-sm text-text/90 leading-relaxed">{geminiInsight}</p>
        </motion.div>
      )}
    </GlassCard>
  );
};