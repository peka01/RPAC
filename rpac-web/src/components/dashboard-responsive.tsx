'use client';

import { useState, useEffect } from 'react';
import { DashboardMobile } from '@/components/dashboard-mobile';
import type { User } from '@supabase/supabase-js';

interface DashboardResponsiveProps {
  user: User | null;
  desktopContent: React.ReactNode;
}

export function DashboardResponsive({ user, desktopContent }: DashboardResponsiveProps) {
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
    <DashboardMobile user={user} />
  ) : (
    <>{desktopContent}</>
  );
}

