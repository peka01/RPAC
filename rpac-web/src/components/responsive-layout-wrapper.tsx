'use client';

import { useState, useEffect } from 'react';
import { Navigation } from './navigation';
import { MobileNavigation } from './mobile-navigation';
import { KRISterAssistantResponsive } from './krister-assistant-responsive';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ResponsiveLayoutWrapperProps {
  children: React.ReactNode;
  hideMobileNav?: boolean; // For pages that have their own mobile nav (like community hub)
}

export function ResponsiveLayoutWrapper({ children, hideMobileNav = false }: ResponsiveLayoutWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load user and profile for KRISter
  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // Load user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
        }
      }
    };

    loadUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
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

      {/* KRISter AI Assistant - Available everywhere when user is logged in */}
      {mounted && user && (
        <KRISterAssistantResponsive
          user={user}
          userProfile={userProfile}
          currentPage={getCurrentPage()}
          currentAction={pathname || ''}
        />
      )}
    </>
  );
}

