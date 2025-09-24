'use client';

import { useState } from 'react';
import { StatusCard } from '@/components/status-card';
import { QuickActions } from '@/components/quick-actions';
import { PreparednessOverview } from '@/components/preparedness-overview';
import { SupabaseAuth } from '@/components/supabase-auth';
import { SupabaseResourceInventory } from '@/components/supabase-resource-inventory';
import { CommunityHub } from '@/components/community-hub';
import { User } from '@supabase/supabase-js';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const handleAuthChange = (newUser: User | null) => {
    setUser(newUser);
    setLoading(false);
  };

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

  // Show authentication screen for non-authenticated users
  if (!user) {
    return <SupabaseAuth onAuthChange={handleAuthChange} />;
  }

  // Show main content for authenticated users
  return (
    <div className="space-y-16">
      {/* Welcome Message */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Välkommen till RPAC
        </h1>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          Resilience & Preparedness AI Companion
        </p>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
          Hej {user.user_metadata?.name || user.email}! Du är redo att börja bygga din beredskap.
        </p>
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
  );
}