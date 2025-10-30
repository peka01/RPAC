'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Activity as ActivityIcon } from 'lucide-react';
import { CommunityActivityFeed } from '@/components/community-activity-feed';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { supabase, communityService } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { LocalCommunity } from '@/lib/supabase';

// Configure for Edge Runtime
export const runtime = 'edge';

export default function ActivityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [community, setCommunity] = useState<LocalCommunity | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const communityId = searchParams.get('community');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        if (authUser) {
          setUser(authUser);
        } else {
          // Redirect to login if no user
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const loadCommunity = async () => {
      if (!communityId) return;
      
      try {
        const comm = await communityService.getCommunityById(communityId);
        setCommunity(comm);
      } catch (error) {
        console.error('Error loading community:', error);
      }
    };

    if (communityId) {
      loadCommunity();
    }
  }, [communityId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ShieldProgressSpinner size="xl" color="olive" message="Laddar" />
      </div>
    );
  }

  if (!user || !communityId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/10 to-[#707C5F]/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] text-white shadow-lg">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Tillbaka"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <ActivityIcon size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Senaste aktivitet</h1>
                {community && (
                  <p className="text-[#C8D5B9] text-sm">{community.community_name}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <CommunityActivityFeed 
          communityId={communityId}
          limit={50}
          showHeader={false}
          className="bg-white"
        />
      </div>
    </div>
  );
}
