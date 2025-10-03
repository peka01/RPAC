'use client';

import { useState, useEffect } from 'react';
import { PersonalDashboard } from '@/components/personal-dashboard';
import { PersonalDashboardMobile } from '@/components/personal-dashboard-mobile';

interface PersonalDashboardResponsiveProps {
  user?: { id: string } | null;
}

export function PersonalDashboardResponsive({ user }: PersonalDashboardResponsiveProps = {}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? (
    <PersonalDashboardMobile user={user} />
  ) : (
    <PersonalDashboard user={user} />
  );
}

