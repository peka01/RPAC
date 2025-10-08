'use client';

import { useState, useEffect } from 'react';
import { StunningDashboard } from './stunning-dashboard';
import { StunningDashboardMobile } from './stunning-dashboard-mobile';
import type { User } from '@supabase/supabase-js';

interface StunningDashboardResponsiveProps {
  user: User | null;
}

export function StunningDashboardResponsive({ user }: StunningDashboardResponsiveProps) {
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
    <StunningDashboardMobile user={user} />
  ) : (
    <StunningDashboard user={user} />
  );
}
