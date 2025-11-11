'use client';

import { useState, useEffect } from 'react';
import { KRISterAssistant } from './krister-assistant';
import { KRISterAssistantMobile } from './krister-assistant-mobile';

/**
 * IMPORTANT: This is a RESPONSIVE WRAPPER that switches between two different components:
 * 
 * - Mobile (< 768px): Uses './krister-assistant-mobile.tsx' ← EDIT THIS FOR MOBILE
 * - Desktop (≥ 768px): Uses './krister-assistant.tsx' ← EDIT THIS FOR DESKTOP
 * 
 * When making styling changes, make sure to edit BOTH files!
 * 
 * Files to update:
 * - krister-assistant-mobile.tsx (for phones/tablets)
 * - krister-assistant.tsx (for desktop)
 */

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
  };
}

import { UserProfile as DatabaseUserProfile } from '@/lib/useUserProfile';

interface UserProfile extends DatabaseUserProfile {
  weather?: {
    temperature?: number;
    humidity?: number;
    forecast?: string;
    windSpeed?: number;
    precipitation?: number;
    feelsLike?: number;
    warnings?: Array<{
      type?: string;
      description?: string;
      message?: string;
      severity?: 'low' | 'moderate' | 'severe' | 'extreme';
    }>;
  };
  [key: string]: unknown;
}

interface KRISterAssistantResponsiveProps {
  user?: User;
  userProfile?: UserProfile;
  currentPage: 'dashboard' | 'individual' | 'local' | 'regional' | 'settings' | 'cultivation' | 'resources';
  currentAction?: string;
}

export function KRISterAssistantResponsive(props: KRISterAssistantResponsiveProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? <KRISterAssistantMobile {...props} /> : <KRISterAssistant {...props} />;
}

