'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { DomainRisk, Domain, DependencyEdge } from '@/types/schemas';
import { MosaicTile } from './MosaicTile';
import { MosaicConnections } from './MosaicConnections';
import { DomainDrawer } from './DomainDrawer';
import { FinanceDrawer } from './FinanceDrawer';
import { HealthDrawer } from './HealthDrawer';
import { MOSAIC_LAYOUT } from '@/lib/domainConfig';
import { GlassCard } from '@/components/ui/GlassCard';

interface MosaicGridProps {
  domains: DomainRisk[];
  edges?: DependencyEdge[];
  onSelectDomain?: (domain: Domain) => void;
}

export const MosaicGrid = ({ 
  domains, 
  edges = [
    { label: 'Financial Impact', from: 'finance', to: 'mental', strength: 0.8 },
    { label: 'Mental Wellbeing', from: 'mental', to: 'physical', strength: 0.7 },
    { label: 'Energy & Resources', from: 'physical', to: 'finance', strength: 0.6 },
  ],
  onSelectDomain 
}: MosaicGridProps) => {
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<Map<Domain, HTMLDivElement>>(new Map());

  const handleTileClick = (domain: Domain) => {
    setSelectedDomain(domain);
    onSelectDomain?.(domain);
  };

  const handleCloseDrawer = () => {
    setSelectedDomain(null);
  };

  if (!domains || domains.length === 0) {
    return (
      <GlassCard className="p-12 text-center">
        <p className="text-muted">No domain data available</p>
      </GlassCard>
    );
  }

  const domainMap = new Map(domains.map(d => [d.domain, d]));

  return (
    <div className="space-y-8">
      {/* Mosaic Container */}
      <div 
        ref={containerRef}
        className="relative"
      >
        {/* CSS Grid Mosaic */}
        <div 
          className="grid gap-6 bg-gradient-to-br from-white/5 to-white/0 p-8 rounded-3xl border border-white/10"
          style={{
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridTemplateRows: 'repeat(4, minmax(200px, 1fr))',
            minHeight: '600px',
          }}
        >
          {MOSAIC_LAYOUT.map((layout, index) => {
            const domain = domainMap.get(layout.id);
            if (!domain) return null;

            return (
              <motion.div
                key={layout.id}
                ref={(el) => {
                  if (el) tileRefs.current.set(layout.id, el);
                }}
                style={{
                  gridRowStart: layout.rowStart,
                  gridRowEnd: layout.rowEnd,
                  gridColumnStart: layout.colStart,
                  gridColumnEnd: layout.colEnd,
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <MosaicTile
                  domain={domain}
                  onClick={() => handleTileClick(domain.domain)}
                  index={index}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Connection Lines SVG Overlay */}
        {containerRef.current && (
          <div className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden">
            <MosaicConnections 
              edges={edges}
              containerRef={containerRef}
            />
          </div>
        )}
      </div>

      {/* Drawers */}
      <AnimatePresence>
        {selectedDomain === 'finance' ? (
          <FinanceDrawer
            isOpen={selectedDomain !== null}
            onClose={handleCloseDrawer}
          />
        ) : selectedDomain === 'physical' ? (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDrawer}
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
                  <div>
                    <h2 className="text-3xl font-bold text-text">💪 Physical Fitness</h2>
                    <p className="text-muted">Upload and analyze your fitness data</p>
                  </div>
                  <button
                    onClick={handleCloseDrawer}
                    className="p-2 hover:bg-white/10 rounded-lg transition text-text"
                  >
                    <X size={20} />
                  </button>
                </div>
                {/* Health Drawer Content */}
                <HealthDrawer />
              </div>
            </motion.div>
          </>
        ) : (
          <DomainDrawer
            domain={selectedDomain}
            isOpen={selectedDomain !== null}
            onClose={handleCloseDrawer}
          />
        )}
      </AnimatePresence>
    </div>
  );
};