'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DomainRisk } from '@/types/schemas';
import { DOMAIN_CONFIG, getRiskColor, getRiskLabel } from '@/lib/domainConfig';
import { Badge } from '@/components/ui/Badge';

interface MosaicTileProps {
  domain: DomainRisk;
  onClick: () => void;
  index: number;
}

export const MosaicTile = ({ domain, onClick, index }: MosaicTileProps) => {
  const config = DOMAIN_CONFIG[domain.domain];
  const Icon = config.icon;
  
  const TrendIcon = domain.trend === 'up' 
    ? TrendingUp 
    : domain.trend === 'down' 
    ? TrendingDown 
    : Minus;

  const riskColor = getRiskColor(domain.score);
  const riskLabel = getRiskLabel(domain.score);
  
  const getBadgeVariant = () => {
    if (domain.score >= 70) return 'success';
    if (domain.score >= 40) return 'warning';
    return 'danger';
  };

  return (
    <motion.div
      data-domain={domain.domain}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: index * 0.1,
      }}
      whileHover={{ scale: 1.02 }}
      className="glass-card glass-card-hover p-6 relative overflow-hidden group"
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg, ${riskColor} 0%, var(--glass) 50%)`,
      }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform translate-x-8 -translate-y-8">
        <Icon size={128} strokeWidth={1} />
      </div>
      
      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-glass2">
              <Icon size={24} strokeWidth={1.5} className="text-text" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text">{config.label}</h3>
              <p className="text-xs text-muted">{config.description}</p>
            </div>
          </div>
          
          <TrendIcon 
            size={20} 
            className={`${
              domain.trend === 'up' 
                ? 'text-[var(--risk-low-solid)]' 
                : domain.trend === 'down' 
                ? 'text-[var(--risk-high-solid)]' 
                : 'text-muted'
            }`}
          />
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-4xl font-bold text-text">{domain.score}</div>
            <div className="text-sm text-muted">Risk Score</div>
          </div>
          <Badge variant={getBadgeVariant()}>{riskLabel}</Badge>
        </div>

        {domain.drivers.length > 0 && (
          <div className="pt-3 border-t border-stroke/50">
            <p className="text-xs text-muted line-clamp-2">
              {domain.drivers[0]}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};