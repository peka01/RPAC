'use client';

import { useState, useEffect } from 'react';
import { CommunityDashboardRefactored } from './community-dashboard-refactored';
import { CommunityDashboardRefactoredMobile } from './community-dashboard-refactored-mobile';
import type { User } from '@supabase/supabase-js';
import type { LocalCommunity } from '@/lib/supabase';

interface CommunityDashboardRefactoredResponsiveProps {
  user: User;
  community: LocalCommunity;
  onNavigate: (view: 'resources' | 'messaging') => void;
}

export function CommunityDashboardRefactoredResponsive({ 
  user, 
  community, 
  onNavigate 
}: CommunityDashboardRefactoredResponsiveProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (isMobile) {
    return (
      <CommunityDashboardRefactoredMobile
        user={user}
        community={community}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <CommunityDashboardRefactored
      user={user}
      community={community}
      onNavigate={onNavigate}
    />
  );
}
