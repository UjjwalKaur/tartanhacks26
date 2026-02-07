'use client';

import { useState } from 'react';
import { DomainRisk, Domain } from '@/types/schemas';
import { MosaicTile } from './MosaicTile';
import { DomainDrawer } from './DomainDrawer';

interface MosaicGridProps {
  domains: DomainRisk[];
}

export const MosaicGrid = ({ domains }: MosaicGridProps) => {
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);

  const handleTileClick = (domain: Domain) => {
    setSelectedDomain(domain);
  };

  const handleCloseDrawer = () => {
    setSelectedDomain(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {domains.map((domain, index) => (
          <MosaicTile
            key={domain.domain}
            domain={domain}
            onClick={() => handleTileClick(domain.domain)}
            index={index}
          />
        ))}
      </div>

      <DomainDrawer
        domain={selectedDomain}
        isOpen={selectedDomain !== null}
        onClose={handleCloseDrawer}
      />
    </>
  );
};