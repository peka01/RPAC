'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/locales';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { StunningDashboardResponsive } from '@/components/stunning-dashboard-responsive';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        // If no user is authenticated, try to authenticate with demo user
        console.log('No user authenticated, trying demo login...');
        try {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: 'demo@beready.se',
            password: 'demo123'
          });
          
          if (signInError) {
            console.log('Demo user not found, creating...');
            const { error: signUpError } = await supabase.auth.signUp({
              email: 'demo@beready.se',
              password: 'demo123',
              options: {
                data: {
                  name: t('dashboard.demo_user')
                }
              }
            });
            
            if (signUpError) {
              console.error('Failed to create demo user:', signUpError);
              router.push('/');
              return;
            }
            
            // Wait for user creation and try to sign in again
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const { error: retryError } = await supabase.auth.signInWithPassword({
              email: 'demo@beready.se',
              password: 'demo123'
            });
            
            if (retryError) {
              console.error('Failed to sign in demo user:', retryError);
              router.push('/');
              return;
            }
          }
          
          // Get the authenticated user
          const { data: { user: authenticatedUser } } = await supabase.auth.getUser();
          if (authenticatedUser) {
            setUser(authenticatedUser);
            setLoading(false);
          } else {
            router.push('/');
          }
        } catch (error) {
          console.error('Authentication error:', error);
          router.push('/');
        }
      }
    };
    checkUser();
  }, [router]);

  // Professional loading experience
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <ShieldProgressSpinner size="lg" color="olive" message="Laddar" />
      </div>
    );
  }

  return (
    <StunningDashboardResponsive user={user} />
  );
}