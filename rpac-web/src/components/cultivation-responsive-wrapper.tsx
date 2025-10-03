'use client';

import { useState, useEffect } from 'react';

interface CultivationResponsiveWrapperProps {
  mobileComponent: React.ReactNode;
  desktopComponent: React.ReactNode;
}

export function CultivationResponsiveWrapper({ 
  mobileComponent, 
  desktopComponent 
}: CultivationResponsiveWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3D4A2B] border-t-transparent"></div>
      </div>
    );
  }

  return isMobile ? <>{mobileComponent}</> : <>{desktopComponent}</>;
}

