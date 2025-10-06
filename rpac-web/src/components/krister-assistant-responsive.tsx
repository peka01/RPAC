'use client';

import { useState, useEffect } from 'react';
import { KRISterAssistant } from './krister-assistant';
import { KRISterAssistantMobile } from './krister-assistant-mobile';

interface KRISterAssistantResponsiveProps {
  user?: any;
  userProfile?: any;
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

