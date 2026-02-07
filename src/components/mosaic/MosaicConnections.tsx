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
}

export const MosaicConnections = ({ edges, containerRef }: MosaicConnectionsProps) => {
  const [positions, setPositions] = useState<Map<Domain, TilePosition>>(new Map());
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updatePositions = () => {
      const container = containerRef.current;
      if (!container) return;

      setContainerSize({
        width: container.offsetWidth,
        height: container.offsetHeight,
      });

      // Find all MosaicTile containers by looking for divs with motion classes
      // that are direct children of grid cells
      const positionsMap = new Map<Domain, TilePosition>();
      const gridChildren = container.querySelectorAll('[style*="grid"]');

      gridChildren.forEach((child) => {
        const rect = child.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Try to identify domain from child content
        const textContent = child.textContent || '';
        let domain: Domain | null = null;

        if (textContent.includes('Finance') || textContent.includes('Wallet')) {
          domain = 'finance';
        } else if (textContent.includes('Mental') || textContent.includes('Brain')) {
          domain = 'mental';
        } else if (textContent.includes('Physical') || textContent.includes('Heart')) {
          domain = 'physical';
        }

        if (domain) {
          positionsMap.set(domain, {
            domain,
            x: rect.left - containerRect.left + rect.width / 2 + container.scrollLeft,
            y: rect.top - containerRect.top + rect.height / 2 + container.scrollTop,
          });
        }
      });

      setPositions(positionsMap);
    };

    updatePositions();
    const timer = setTimeout(updatePositions, 100); // Delay to ensure render

    window.addEventListener('resize', updatePositions);
    
    return () => {
      window.removeEventListener('resize', updatePositions);
      clearTimeout(timer);
    };
  }, [containerRef]);

  if (positions.size === 0 || containerSize.width === 0) return null;

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none"
      width={containerSize.width}
      height={containerSize.height}
      style={{ zIndex: 5 }}
    >
      <defs>
        {edges.map((edge, i) => (
          <linearGradient key={`grad-${i}`} id={`gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e8d7c3" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#d4c5b3" stopOpacity={0.5} />
          </linearGradient>
        ))}
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {edges.map((edge, i) => {
        const from = positions.get(edge.from);
        const to = positions.get(edge.to);

        if (!from || !to) return null;

        // Bezier curve with control point
        const cx = (from.x + to.x) / 2;
        const cy = Math.min(from.y, to.y) - 80;
        const pathD = `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;

        return (
          <g key={`edge-${i}`}>
            <motion.path
              d={pathD}
              fill="none"
              stroke={`url(#gradient-${i})`}
              strokeWidth={2 + edge.strength * 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: i * 0.2, ease: 'easeInOut' }}
            />
            {/* Animated dash overlay for glow effect */}
            <motion.path
              d={pathD}
              fill="none"
              stroke="rgba(232, 215, 195, 0.3)"
              strokeWidth={6 + edge.strength * 2}
              strokeLinecap="round"
              strokeDasharray="8,8"
              opacity={0.4}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1, opacity: [0.4, 0.1, 0.4] }}
              transition={{ duration: 2.5, delay: i * 0.2, repeat: Infinity, ease: 'linear' }}
            />
          </g>
        );
      })}
    </svg>
  );
};