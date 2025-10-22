'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/locales';
import { Shield, AlertCircle } from 'lucide-react';

interface SuperAdminGuardProps {
  children: React.ReactNode;
}

export function SuperAdminGuard({ children }: SuperAdminGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSuperAdminAccess();
  }, []);

  async function checkSuperAdminAccess() {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      console.log('🔍 Super Admin Check - User:', user?.id, user?.email);
      
      if (authError || !user) {
        console.error('❌ Auth error:', authError);
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      // Check if user has super_admin tier
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_tier, license_type, is_license_active')
        .eq('user_id', user.id)
        .single();

      console.log('🔍 Profile query result:', { profile, error: profileError });

      if (profileError) {
        console.error('❌ Profile error:', profileError);
        console.error('❌ This usually means:');
        console.error('   1. No user_profiles row exists for user_id:', user.id);
        console.error('   2. Or user_tier column doesn\'t exist (migration not run)');
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      const isSuperAdmin = profile?.user_tier === 'super_admin';
      console.log('🔍 Is Super Admin?', isSuperAdmin);
      console.log('🔍 User tier value:', profile?.user_tier);
      
      setIsAuthorized(isSuperAdmin);
      setIsLoading(false);

      if (!isSuperAdmin) {
        console.log('❌ Access denied - redirecting to login');
        // Redirect to super admin login after a delay
        setTimeout(() => {
          router.push('/super-admin/login');
        }, 3000);
      } else {
        console.log('✅ Super admin access granted!');
      }
    } catch (error) {
      console.error('❌ Error checking super admin access:', error);
      setIsAuthorized(false);
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2A331E] to-[#3D4A2B] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">{t('admin.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2A331E] to-[#3D4A2B] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('admin.access_denied')}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('admin.access_denied_description')}
          </p>
          <p className="text-sm text-gray-500">
            Omdirigerar till inloggning...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

