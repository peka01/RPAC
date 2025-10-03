'use client';

import { useState, useEffect } from 'react';
import { Navigation } from './navigation';
import { MobileNavigation } from './mobile-navigation';

interface ResponsiveLayoutWrapperProps {
  children: React.ReactNode;
  hideMobileNav?: boolean; // For pages that have their own mobile nav (like community hub)
}

export function ResponsiveLayoutWrapper({ children, hideMobileNav = false }: ResponsiveLayoutWrapperProps) {
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
    return <>{children}</>;
  }

  return (
    <>
      {/* Desktop Navigation - Hidden on mobile */}
      {!isMobile && <Navigation />}

      {/* Content with appropriate padding */}
      <main className={`
        ${!isMobile ? 'pt-20' : 'pt-0'}
        ${isMobile && !hideMobileNav ? 'pb-40' : 'pb-0'}
      `}>
        {children}
      </main>

      {/* Mobile Bottom Navigation - Only show if not hidden */}
      {isMobile && !hideMobileNav && <MobileNavigation />}
    </>
  );
}

