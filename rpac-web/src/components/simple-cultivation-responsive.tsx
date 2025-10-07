'use client';

import { useState, useEffect } from 'react';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { SimpleCultivationManager } from './simple-cultivation-manager';
import { SimpleCultivationManagerMobile } from './simple-cultivation-manager-mobile';

interface SimpleCultivationResponsiveProps {
  userId: string;
  householdSize?: number;
}

export function SimpleCultivationResponsive({ userId, householdSize }: SimpleCultivationResponsiveProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ShieldProgressSpinner variant="bounce" size="lg" color="olive" message="Laddar" />
      </div>
    );
  }

  return isMobile ? (
    <SimpleCultivationManagerMobile userId={userId} householdSize={householdSize} />
  ) : (
    <SimpleCultivationManager userId={userId} householdSize={householdSize} />
  );
}

