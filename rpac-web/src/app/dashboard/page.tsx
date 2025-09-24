'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StatusCard } from '@/components/status-card';
import { QuickActions } from '@/components/quick-actions';
import { PreparednessOverview } from '@/components/preparedness-overview';
import { SupabaseResourceInventory } from '@/components/supabase-resource-inventory';
import { CommunityHub } from '@/components/community-hub';
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
        // Redirect to login if not authenticated
        router.push('/');
      }
    };
    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Laddar dashboard...</p>
        </div>
      </div>
    );
  }

  // Show main content for authenticated users
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Message */}
      <div className="text-center py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            Välkommen till RPAC
          </h1>
          <p className="text-xl md:text-2xl mb-4 text-gray-600">
            Resilience & Preparedness AI Companion
          </p>
          <p className="text-lg mb-8 text-gray-600">
            Hej {user.user_metadata?.name || user.email}! Du är redo att börja bygga din beredskap.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12 space-y-16">
        {/* Modern Status and Actions Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-6">
            <StatusCard />
          </div>
          <div className="space-y-6">
            <QuickActions />
          </div>
        </div>

        {/* Resource Inventory */}
        <div className="space-y-6">
          <SupabaseResourceInventory user={user} />
        </div>

        {/* Community Hub */}
        <div className="space-y-6">
          <CommunityHub user={user} />
        </div>

        {/* Preparedness Overview */}
        <div className="space-y-6">
          <PreparednessOverview />
        </div>
      </div>
    </div>
  );
}
