'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessagingSystemV2 } from '@/components/messaging-system-v2';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { supabase } from '@/lib/supabase';
import { communityService } from '@/lib/supabase';
import { t } from '@/lib/locales';
import { MessageCircle, Users, MapPin, ChevronDown } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { LocalCommunity } from '@/lib/supabase';

// Configure for Edge Runtime (required for Cloudflare Pages)
export const runtime = 'edge';

export default function CommunityMessagesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [communityName, setCommunityName] = useState<string>('Ditt lokala samhälle');
  const [userCommunities, setUserCommunities] = useState<LocalCommunity[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for authenticated user
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        // Silent error handling (expected when not logged in)
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load user's communities
  const loadUserCommunities = async () => {
    if (!user || user.id === 'demo-user') return;
    
    setLoadingCommunities(true);
    try {
      const memberships = await communityService.getUserMemberships(user.id);
      
      if (memberships.length > 0) {
        const communities = await Promise.all(
          memberships.map(id => communityService.getCommunityById(id))
        );
        
        const validCommunities = communities.filter(c => c !== null) as LocalCommunity[];
        setUserCommunities(validCommunities);
        
        // Check for saved community selection first
        const savedCommunityId = localStorage.getItem('selectedCommunityId');
        const savedCommunity = validCommunities.find(c => c.id === savedCommunityId);
        
        if (savedCommunity) {
          setCommunityId(savedCommunity.id);
          setCommunityName(savedCommunity.community_name);
        } else if (!communityId && validCommunities.length > 0) {
          const firstCommunity = validCommunities[0];
          setCommunityId(firstCommunity.id);
          setCommunityName(firstCommunity.community_name);
          // Save the first community as default
          localStorage.setItem('selectedCommunityId', firstCommunity.id);
        }
      }
    } catch (err) {
      console.error('Error loading user communities:', err);
    } finally {
      setLoadingCommunities(false);
    }
  };

  useEffect(() => {
    // Get community ID from URL params first
    const communityParam = searchParams.get('community');
    if (communityParam) {
      setCommunityId(communityParam);
    }
  }, [searchParams]);

  // Load user's communities when user is available
  useEffect(() => {
    if (user && user.id !== 'demo-user') {
      loadUserCommunities();
    }
  }, [user]);

  if (loading || loadingCommunities) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <ShieldProgressSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Inloggning krävs</h1>
          <p className="text-gray-600">Du måste logga in för att komma åt meddelanden.</p>
        </div>
      </div>
    );
  }

  if (!communityId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-[#3D4A2B]/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Users className="text-[#3D4A2B]" size={48} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Välj ett samhälle</h1>
          <p className="text-gray-600 mb-8">Du behöver vara medlem i ett samhälle för att chatta.</p>
          <button
            onClick={() => window.location.href = '/local/discover'}
            className="px-8 py-4 bg-[#3D4A2B] text-white font-bold rounded-xl hover:bg-[#2A331E] transition-all"
          >
            Hitta samhällen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-[#3D4A2B]/10 rounded-xl p-3">
                  <MessageCircle className="w-8 h-8 text-[#3D4A2B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2 truncate">Chatta med alla i {communityName}</h1>
                  <p className="text-gray-600 text-sm md:text-base">Samhällschatt för alla medlemmar</p>
                </div>
              </div>
              
              {/* Community Selector - Mobile Responsive */}
              {userCommunities.length > 1 && (
                <div className="bg-gradient-to-r from-[#3D4A2B]/10 to-[#5C6B47]/10 border-2 border-[#3D4A2B]/30 rounded-xl px-4 py-3 md:px-6 md:py-4 shadow-lg w-full md:w-auto">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="bg-[#3D4A2B] rounded-full p-2">
                        <Users size={16} className="text-white" />
                      </div>
                      <span className="font-bold text-[#3D4A2B] text-sm md:text-base">Aktivt samhälle:</span>
                    </div>
                    <select
                      value={communityId || ''}
                      onChange={(e) => {
                        const selectedCommunity = userCommunities.find(c => c.id === e.target.value);
                        if (selectedCommunity) {
                          setCommunityId(selectedCommunity.id);
                          setCommunityName(selectedCommunity.community_name);
                          // Save selection to localStorage for persistence
                          localStorage.setItem('selectedCommunityId', selectedCommunity.id);
                        }
                      }}
                      className="w-full md:w-auto px-3 py-2 md:px-4 md:py-3 bg-white border-2 border-[#3D4A2B]/40 rounded-lg focus:outline-none focus:ring-4 focus:ring-[#3D4A2B]/20 text-gray-900 font-bold text-sm md:text-base cursor-pointer hover:border-[#3D4A2B] hover:shadow-md transition-all shadow-sm"
                    >
                      {userCommunities.map((community) => (
                        <option key={community.id} value={community.id} className="font-bold">
                          {community.community_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Messaging System */}
          <MessagingSystemV2 
            user={user} 
            communityId={communityId}
            initialTab="community"
            hideTabs={true}
          />
        </div>
      </div>
    </div>
  );
}
