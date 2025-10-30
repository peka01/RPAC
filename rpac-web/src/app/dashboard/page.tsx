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
        // Don't auto-login with demo user - redirect to login instead
        // This prevents interference with password reset and other auth flows
        router.push('/');
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