'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { CommunityResourceHubResponsive } from '@/components/community-resource-hub-responsive';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { supabase } from '@/lib/supabase';
import { communityService } from '@/lib/supabase';
import { t } from '@/lib/locales';
import { Share2, Users, MapPin, ChevronDown } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { LocalCommunity } from '@/lib/supabase';

export default function SharedResourcesPage() {
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
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-[#3D4A2B] text-white font-medium rounded-lg hover:bg-[#2A331E] transition-colors"
            >
              {t('auth.go_to_login')}
            </Link>
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
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-[#3D4A2B]/10 rounded-xl p-3">
                  <Share2 className="w-8 h-8 text-[#3D4A2B]" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Delade från medlemmar</h1>
                  <p className="text-gray-600">Resurser som medlemmar i ditt samhälle delar med varandra</p>
                </div>
              </div>
              
              <div className="bg-[#8B4513]/10 border border-[#8B4513]/20 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-6 h-6 text-[#8B4513]" />
                  <h3 className="text-lg font-semibold text-[#8B4513]">
                    {userCommunities.length === 0 ? 'Inga samhällen hittades' : 'Välj ett samhälle först'}
                  </h3>
                </div>
                <p className="text-gray-700 mb-4">
                  {userCommunities.length === 0 
                    ? 'Du är inte medlem i några lokala samhällen än. Gå med i ett samhälle för att se delade resurser.'
                    : 'Du behöver vara medlem i ett lokalt samhälle för att se delade resurser.'
                  }
                </p>
                <Link
                  href="/local/discover"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#3D4A2B] text-white font-medium rounded-lg hover:bg-[#2A331E] transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  Hitta samhällen
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-8 mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="bg-[#3D4A2B]/10 rounded-xl p-2 md:p-3">
                  <Share2 className="w-6 h-6 md:w-8 md:h-8 text-[#3D4A2B]" />
                </div>
                <div className="flex-1">
                  <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">Delade från medlemmar</h1>
                  <p className="text-sm md:text-base text-gray-600">Resurser som medlemmar delar med varandra</p>
                </div>
              </div>
              
              {/* Community Switcher - DESKTOP ONLY (mobile has it in the component) */}
              {userCommunities.length > 1 && (
                <div className="hidden md:block bg-gradient-to-br from-[#4A5239]/10 to-[#5C6B47]/10 border border-[#4A5239]/20 rounded-xl p-4 min-w-[320px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-[#3D4A2B]" strokeWidth={2.5} />
                    <span className="text-xs font-semibold text-[#3D4A2B] uppercase tracking-wide">
                      {t('community.active_community')}
                    </span>
                  </div>
                  <select
                    value={communityId || ''}
                    onChange={(e) => {
                      const newCommunityId = e.target.value;
                      const selectedCommunity = userCommunities.find(c => c.id === newCommunityId);
                      if (selectedCommunity) {
                        setCommunityId(newCommunityId);
                        setCommunityName(selectedCommunity.community_name);
                        localStorage.setItem('selectedCommunityId', newCommunityId);
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-white/90 backdrop-blur-sm border-2 border-[#3D4A2B]/20 rounded-lg text-[#2A331E] font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#5C6B47] focus:border-[#5C6B47] cursor-pointer hover:bg-white hover:border-[#5C6B47] transition-all duration-200 shadow-sm"
                    disabled={loadingCommunities}
                  >
                    {userCommunities.map((community) => (
                      <option key={community.id} value={community.id} className="font-semibold">
                        {community.community_name} ({community.member_count || 0} {t('community.members_count')})
                      </option>
                    ))}
                  </select>
                  <div className="text-[#707C5F] text-xs mt-2 text-center font-medium">
                    {userCommunities.length} {t('community.communities_count')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resource Hub */}
          <CommunityResourceHubResponsive 
            user={user} 
            communityId={communityId} 
            communityName={communityName}
            initialTab="shared"
            hideTabs={true}
          />
        </div>
      </div>
    </div>
  );
}
