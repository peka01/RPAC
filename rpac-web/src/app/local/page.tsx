'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CommunityHubResponsive } from '@/components/community-hub-responsive';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/locales';
import type { User } from '@supabase/supabase-js';

export default function LocalPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <ShieldProgressSpinner variant="bounce" size="xl" color="olive" message="Laddar" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('auth.login_required')}</h2>
            <p className="text-gray-600 mb-6">
              {t('auth.login_required_description')}
            </p>
            <a
              href="/dashboard"
              className="inline-block px-6 py-3 bg-[#3D4A2B] text-white font-medium rounded-lg hover:bg-[#2A331E] transition-colors"
            >
              {t('auth.go_to_login')}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Extract URL parameters
  const communityId = searchParams.get('community');
  const tab = searchParams.get('tab');
  

  return <CommunityHubResponsive user={user} initialCommunityId={communityId} initialTab={tab} />;
}
