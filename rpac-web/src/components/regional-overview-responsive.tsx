'use client';

import { useState, useEffect } from 'react';
import { RegionalOverviewDesktop } from './regional-overview-desktop';
import { RegionalOverviewMobile } from './regional-overview-mobile';

interface RegionalOverviewResponsiveProps {
  county: string;
}

export function RegionalOverviewResponsive({ county }: RegionalOverviewResponsiveProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? (
    <RegionalOverviewMobile county={county} />
  ) : (
    <RegionalOverviewDesktop county={county} />
  );
}

