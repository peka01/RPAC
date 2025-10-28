'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SideMenuClean } from './side-menu-clean';
import { TopMenu } from './top-menu';
import { MobileNavigationV2 } from './mobile-navigation-v2';
import { KRISterAssistantResponsive } from './krister-assistant-responsive';
import { useUserProfile } from '@/lib/useUserProfile';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface SideMenuResponsiveProps {
  children: React.ReactNode;
  hideMobileNav?: boolean;
}

export function SideMenuResponsive({ children, hideMobileNav = false }: SideMenuResponsiveProps) {
  const { isMobile, isClient } = useMobileDetection();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isCrisisMode] = useState(false);
  const [communityPulse, setCommunityPulse] = useState(true);
  const pathname = usePathname();

  const { profile: userProfile } = useUserProfile(user);

  useEffect(() => {
    setMounted(true);

    // Check user authentication
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    // Community heartbeat pulse
    const pulseInterval = setInterval(() => {
      setCommunityPulse(prev => !prev);
    }, 2000);

    // Online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      subscription.unsubscribe();
      clearInterval(pulseInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Determine current page from pathname
  const getCurrentPage = (): 'dashboard' | 'individual' | 'local' | 'regional' | 'settings' | 'cultivation' | 'resources' => {
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/individual') return 'individual';
    if (pathname?.startsWith('/local')) return 'local';
    if (pathname?.startsWith('/regional')) return 'regional';
    if (pathname?.startsWith('/settings')) return 'settings';
    // Additional context from URL
    if (pathname?.includes('cultivation')) return 'cultivation';
    if (pathname?.includes('resources')) return 'resources';
    return 'dashboard';
  };

  // Prevent hydration mismatch
  if (!mounted || !isClient) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Top Menu - Desktop only */}
      {!isMobile && (
        <TopMenu
          user={user}
        />
      )}


      {/* Desktop Side Menu - Hidden on mobile */}
      {!isMobile && (
        <SideMenuClean
          user={user}
          isOnline={isOnline}
          isCrisisMode={isCrisisMode}
          communityPulse={communityPulse}
        />
      )}

      {/* Content with appropriate padding */}
      <main className={`
        transition-all duration-300 ease-in-out
        ${!isMobile ? 'ml-80 pt-[48px]' : 'ml-0 pt-20'}
        ${isMobile && !hideMobileNav ? 'pb-20' : 'pb-0'}
        min-h-screen
      `}>
        {children}
      </main>

      {/* Mobile Navigation - Only show if not hidden */}
      {isMobile && !hideMobileNav && <MobileNavigationV2 />}

      {/* KRISter AI Assistant - Available everywhere when user is logged in */}
      {mounted && user && userProfile && (
        <KRISterAssistantResponsive
          user={user}
          userProfile={{ ...userProfile, weather: {} }}
          currentPage={getCurrentPage()}
          currentAction={pathname || ''}
        />
      )}
    </>
  );
}
