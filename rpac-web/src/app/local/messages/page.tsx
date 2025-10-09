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

export default function MessagesPage() {
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

  // Show loading while checking communities
  if (loadingCommunities) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <ShieldProgressSpinner variant="bounce" size="xl" color="olive" message="Laddar samhällen" />
      </div>
    );
  }

  if (!communityId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-4 md:py-8">
          <div className="max-w-4xl mx-auto">
            {/* Page Header - Mobile Optimized */}
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-8 mb-4 md:mb-8">
              <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="bg-[#3D4A2B]/10 rounded-xl p-2 md:p-3">
                  <MessageCircle className="w-6 h-6 md:w-8 md:h-8 text-[#3D4A2B]" />
                </div>
                <div>
                  <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">Meddelanden</h1>
                  <p className="text-sm md:text-base text-gray-600">Chatta med andra medlemmar i ditt samhälle</p>
                </div>
              </div>
              
              <div className="bg-[#8B4513]/10 border border-[#8B4513]/20 rounded-lg p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-3">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-[#8B4513]" />
                  <h3 className="text-base md:text-lg font-semibold text-[#8B4513]">
                    {userCommunities.length === 0 ? 'Inga samhällen hittades' : 'Välj ett samhälle först'}
                  </h3>
                </div>
                <p className="text-sm md:text-base text-gray-700 mb-4">
                  {userCommunities.length === 0 
                    ? 'Du är inte medlem i några lokala samhällen än. Gå med i ett samhälle för att chatta med andra medlemmar.'
                    : 'Du behöver vara medlem i ett lokalt samhälle för att chatta med andra medlemmar.'
                  }
                </p>
                <a
                  href="/local/discover"
                  className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-[#3D4A2B] text-white font-medium rounded-lg hover:bg-[#2A331E] transition-colors text-sm md:text-base touch-manipulation active:scale-95"
                >
                  <MapPin className="w-4 h-4" />
                  Hitta samhällen
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header - Mobile Optimized */}
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-8 mb-4 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="bg-[#3D4A2B]/10 rounded-xl p-2 md:p-3">
                  <MessageCircle className="w-6 h-6 md:w-8 md:h-8 text-[#3D4A2B]" />
                </div>
                <div>
                  <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">Meddelanden</h1>
                  <p className="text-sm md:text-base text-gray-600">Chatta med andra medlemmar</p>
                </div>
              </div>
              
              {/* Community Selector - Mobile Responsive */}
              {userCommunities.length > 1 && (
                <div className="bg-gradient-to-r from-[#3D4A2B]/10 to-[#5C6B47]/10 border-2 border-[#3D4A2B]/30 rounded-xl px-4 md:px-6 py-3 md:py-4 shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <div className="flex items-center gap-2 text-xs md:text-sm">
                      <div className="bg-[#3D4A2B] rounded-full p-1.5 md:p-2">
                        <Users size={14} className="md:w-4 md:h-4 text-white" />
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
                      className="px-3 md:px-4 py-2 md:py-3 bg-white border-2 border-[#3D4A2B]/40 rounded-lg focus:outline-none focus:ring-4 focus:ring-[#3D4A2B]/20 text-gray-900 font-bold text-sm md:text-base cursor-pointer hover:border-[#3D4A2B] hover:shadow-md transition-all w-full md:min-w-[220px] shadow-sm"
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

          {/* Messaging System - Full Height on Mobile */}
          <div className="h-[calc(100vh-200px)] md:h-auto">
            <MessagingSystemV2 
              user={user} 
              communityId={communityId}
              initialTab="community"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
