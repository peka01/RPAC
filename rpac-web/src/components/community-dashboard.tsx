'use client';

import { CommunityDashboardRefactoredResponsive } from './community-dashboard-refactored-responsive';
import type { User } from '@supabase/supabase-js';
import type { LocalCommunity } from '@/lib/supabase';

interface CommunityDashboardProps {
  user: User;
  community: LocalCommunity;
  onNavigate: (view: 'resources' | 'messaging') => void;
}

export function CommunityDashboard({ user, community, onNavigate }: CommunityDashboardProps) {
  return (
    <CommunityDashboardRefactoredResponsive
      user={user}
      community={community}
      onNavigate={onNavigate}
    />
  );
}