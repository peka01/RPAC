'use client';

import { useState, useEffect } from 'react';
import { CommunityHubEnhanced } from './community-hub-enhanced';
import { CommunityHubMobileEnhanced } from './community-hub-mobile-enhanced';
import type { User } from '@supabase/supabase-js';

interface CommunityHubResponsiveProps {
  user: User;
  initialCommunityId?: string | null;
  initialTab?: string | null;
}

export function CommunityHubResponsive({ user, initialCommunityId, initialTab }: CommunityHubResponsiveProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if mobile on mount
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();

    // Listen for window resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent hydration mismatch by showing loading state initially
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#5C6B47]/10 to-[#707C5F]/10">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#3D4A2B] border-t-transparent"></div>
      </div>
    );
  }

  return isMobile ? (
    <CommunityHubMobileEnhanced user={user} initialCommunityId={initialCommunityId} initialTab={initialTab} />
  ) : (
    <CommunityHubEnhanced user={user} initialCommunityId={initialCommunityId} initialTab={initialTab} />
  );
}

