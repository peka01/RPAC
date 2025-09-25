'use client';

import { useState, useEffect } from 'react';
import { CommunityHub } from '@/components/community-hub';
import { t } from '@/lib/locales';

import type { User } from '@supabase/supabase-js';

export default function LocalPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Always use demo mode for now
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('LocalPage: Using demo mode');
      const demoUser = {
        id: 'demo-user',
        email: 'demo@rpac.se',
        user_metadata: { name: 'Demo Användare' }
      } as unknown as User;
      setUser(demoUser);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">{t('loading.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">{t('loading.initializing')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">
            {t('local_community.title')}
          </h1>
        </div>

        <div className="modern-card">
          <CommunityHub user={user} />
        </div>
      </div>
    </div>
  );
}
