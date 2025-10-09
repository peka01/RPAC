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
      
      // Only log when mobile state actually changes
      if (mobile !== isMobile) {
        console.log('📱 Mobile detection changed:', { 
          windowWidth, 
          breakpoint,
          mediaQueryMatches: mediaQuery.matches, 
          isMobile: mobile 
        });
      }
      
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Also listen to media query changes for better dev tools support
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handleMediaChange = () => {
      console.log('📱 Media query changed:', mediaQuery.matches);
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
