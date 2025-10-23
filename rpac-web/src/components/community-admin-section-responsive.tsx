'use client';

import { useState, useEffect } from 'react';
import { CommunityAdminSection } from './community-admin-section';
import { CommunityAdminSectionMobile } from './community-admin-section-mobile';
import type { User } from '@supabase/supabase-js';

interface CommunityAdminSectionResponsiveProps {
  user: User;
  communityId: string;
  communityName: string;
  onSettingsUpdate?: () => void;
  onOpenHomespaceEditor?: () => void;
}

export function CommunityAdminSectionResponsive({ 
  user, 
  communityId, 
  communityName,
  onSettingsUpdate,
  onOpenHomespaceEditor
}: CommunityAdminSectionResponsiveProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? (
    <CommunityAdminSectionMobile
      user={user}
      communityId={communityId}
      communityName={communityName}
      onSettingsUpdate={onSettingsUpdate}
      onOpenHomespaceEditor={onOpenHomespaceEditor}
    />
  ) : (
    <CommunityAdminSection
      user={user}
      communityId={communityId}
      communityName={communityName}
      onSettingsUpdate={onSettingsUpdate}
      onOpenHomespaceEditor={onOpenHomespaceEditor}
    />
  );
}

