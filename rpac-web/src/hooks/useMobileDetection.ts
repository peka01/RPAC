import { useState, useEffect } from 'react';

/**
 * Custom hook for reliable mobile detection that works with browser dev tools
 * Uses both window.innerWidth and media queries for better accuracy
 */
export function useMobileDetection(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const checkMobile = () => {
      // Use both window.innerWidth and media query for better dev tools support
      const windowWidth = window.innerWidth;
      const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
      const mobile = windowWidth < breakpoint || mediaQuery.matches;
      
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Also listen to media query changes for better dev tools support
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handleMediaChange = () => {
      checkMobile();
    };
    mediaQuery.addEventListener('change', handleMediaChange);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [breakpoint]);

  return { isMobile, isClient };
}
