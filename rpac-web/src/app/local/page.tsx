'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CommunityHubEnhanced } from '@/components/community-hub-enhanced';
import { CommunityHubMobileEnhanced } from '@/components/community-hub-mobile-enhanced';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function LocalPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsClient(true);
    
    const checkMobile = () => {
      // Use both window.innerWidth and media query for better dev tools support
      const windowWidth = window.innerWidth;
      const mediaQuery = window.matchMedia('(max-width: 767px)');
      const mobile = windowWidth < 768 || mediaQuery.matches;
      console.log('📱 Local page mobile check:', { 
        windowWidth, 
        mediaQueryMatches: mediaQuery.matches, 
        isMobile: mobile 
      });
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Also listen to media query changes for better dev tools support
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleMediaChange = () => {
      console.log('📱 Local page media query changed:', mediaQuery.matches);
      checkMobile();
    };
    mediaQuery.addEventListener('change', handleMediaChange);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  useEffect(() => {
    // Check for authenticated user
    const checkAuth = async () => {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        if (authUser) {
          setUser(authUser);
        } else {
          // Fallback to demo mode if no authenticated user
          const demoUser = {
            id: 'demo-user',
            email: 'demo@beready.se',
            user_metadata: { name: 'Demo Användare' }
          } as unknown as User;
          setUser(demoUser);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Use demo mode on error
        const demoUser = {
          id: 'demo-user',
          email: 'demo@beready.se',
          user_metadata: { name: 'Demo Användare' }
        } as unknown as User;
        setUser(demoUser);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ShieldProgressSpinner variant="bounce" size="xl" color="olive" message="Laddar" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Inloggning krävs</h2>
            <p className="text-gray-600 mb-6">
              Du behöver vara inloggad för att komma åt lokala samhällen
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-[#3D4A2B] text-white font-medium rounded-lg hover:bg-[#2A331E] transition-colors"
            >
              Gå till inloggning
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get URL parameters
  const communityId = searchParams.get('community');
  const tab = searchParams.get('tab');
  const type = searchParams.get('type');

  console.log('📱 Local page rendering decision:', { isMobile, communityId, tab, type });
  
  return isMobile ? (
    <>
      {console.log('📱 Rendering CommunityHubMobileEnhanced')}
      <CommunityHubMobileEnhanced 
        user={user}
        initialCommunityId={communityId}
        initialTab={tab}
        initialMessagingType={type}
      />
    </>
  ) : (
    <>
      {console.log('🖥️ Rendering CommunityHubEnhanced')}
      <CommunityHubEnhanced 
        user={user}
        initialCommunityId={communityId}
        initialTab={tab}
      />
    </>
  );
}
