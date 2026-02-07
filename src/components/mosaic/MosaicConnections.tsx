'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { DependencyEdge, Domain } from '@/types/schemas';
import { DOMAIN_CONFIG } from '@/lib/domainConfig';

interface MosaicConnectionsProps {
  edges: DependencyEdge[];
  containerRef: React.RefObject<HTMLElement>;
}

interface TilePosition {
  domain: Domain;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const MosaicConnections = ({ edges, containerRef }: MosaicConnectionsProps) => {
  const [positions, setPositions] = useState<TilePosition[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updatePositions = () => {
      const container = containerRef.current;
      if (!container) return;

      const tiles = container.querySelectorAll('[data-domain]');
      const newPositions: TilePosition[] = [];

      tiles.forEach((tile) => {
        const domain = tile.getAttribute('data-domain') as Domain;
        const rect = tile.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        newPositions.push({
          domain,
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
        });
      });

      setPositions(newPositions);
    };

    updatePositions();
    window.addEventListener('resize', updatePositions);
    
    // Observe DOM changes
    const observer = new MutationObserver(updatePositions);
    observer.observe(containerRef.current, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', updatePositions);
      observer.disconnect();
    };
  }, [containerRef, edges]);

  const getPosition = (domain: Domain) => {
    return positions.find(p => p.domain === domain);
  };

  if (positions.length === 0) return null;

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
    >
      <defs>
        {edges.map((edge, i) => (
          <linearGradient key={i} id={`gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={DOMAIN_CONFIG[edge.from].color} stopOpacity={0.6} />
            <stop offset="100%" stopColor={DOMAIN_CONFIG[edge.to].color} stopOpacity={0.6} />
          </linearGradient>
        ))}
      </defs>

      {edges.map((edge, i) => {
        const from = getPosition(edge.from);
        const to = getPosition(edge.to);

        if (!from || !to) return null;

        const pathD = `M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${Math.min(from.y, to.y) - 50} ${to.x} ${to.y}`;

        return (
          <g key={i}>
            <motion.path
              d={pathD}
              fill="none"
              stroke={`url(#gradient-${i})`}
              strokeWidth={edge.strength * 4}
              strokeLinecap="round"
              strokeDasharray="5,5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: i * 0.2 }}
            />
          </g>
        );
      })}
    </svg>
  );
};