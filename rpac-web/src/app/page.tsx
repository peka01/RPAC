'use client';

import { useState, useEffect } from 'react';
import { StatusCard } from '@/components/status-card';
import { QuickActions } from '@/components/quick-actions';
import { PreparednessOverview } from '@/components/preparedness-overview';
import { WelcomeScreen } from '@/components/welcome-screen';
import { RPACLogo } from '@/components/rpac-logo';
import { t } from '@/lib/locales';
import { localAuth } from '@/lib/local-auth';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    const currentUser = localAuth.getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // Listen for auth changes
    const unsubscribe = localAuth.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg" style={{ color: 'var(--text-primary)' }}>Laddar...</p>
        </div>
      </div>
    );
  }

  // Show welcome screen for non-authenticated users
  if (!user) {
    return <WelcomeScreen />;
  }

  // Show main content for authenticated users
  return (
    <div className="space-y-16">
      {/* Welcome Card */}
      <div className="text-center">
        <div className="modern-card max-w-3xl mx-auto">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white p-2">
              <RPACLogo size="md" className="text-green-700" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                Välkommen tillbaka, {user.user_metadata?.name || 'användare'}!
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                {t('messages.offline_ready')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Status and Actions Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-6">
          <StatusCard />
        </div>
        <div className="space-y-6">
          <QuickActions />
        </div>
      </div>

      {/* Preparedness Overview */}
      <div className="space-y-6">
        <PreparednessOverview />
      </div>
    </div>
  );
}