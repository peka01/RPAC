'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  MessageCircle,
  Search,
  MapPin,
  Package,
  Shield,
  Building2
} from 'lucide-react';
import { CommunityDiscovery } from './community-discovery';
import { MessagingSystemV2 } from './messaging-system-v2';
import { CommunityDashboard } from './community-dashboard';
import { CommunityResourceHub } from './community-resource-hub';
import { useUserProfile } from '@/lib/useUserProfile';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { communityService, type LocalCommunity } from '@/lib/supabase';
import { t } from '@/lib/locales';
import type { User } from '@supabase/supabase-js';

interface CommunityHubEnhancedProps {
  user: User;
  initialCommunityId?: string | null;
  initialTab?: string | null;
}

export function CommunityHubEnhanced({ user, initialCommunityId, initialTab }: CommunityHubEnhancedProps) {
  const [activeView, setActiveView] = useState<'home' | 'discovery' | 'resources' | 'messaging'>('home');
  const [activeCommunityId, setActiveCommunityId] = useState<string | undefined>();
  const [userCommunities, setUserCommunities] = useState<LocalCommunity[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { profile, loading } = useUserProfile(user);
  const userPostalCode = profile?.postal_code;

  // Define loadUserCommunities before it's used
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
        
        // Auto-select first community if none is selected and no initial community from URL
        if (!activeCommunityId && !initialCommunityId && validCommunities.length > 0) {
          setActiveCommunityId(validCommunities[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading user communities:', err);
    } finally {
      setLoadingCommunities(false);
    }
  };

  // Load user's communities on mount
  useEffect(() => {
    if (user && user.id !== 'demo-user') {
      loadUserCommunities();
    }
  }, [user]);

  // Handle initial URL parameters
  useEffect(() => {
    if (initialCommunityId) {
      setActiveCommunityId(initialCommunityId);
    }
    if (initialTab === 'resources' || initialTab === 'shared') {
      setActiveView('resources');
    }
  }, [initialCommunityId, initialTab]);

  // Check admin status when active community changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (activeCommunityId && user && user.id !== 'demo-user') {
        try {
          const adminStatus = await communityService.isUserAdmin(activeCommunityId, user.id);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [activeCommunityId, user]);

  const handleJoinCommunity = (communityId: string) => {
    setActiveCommunityId(communityId);
    setActiveView('home');
    loadUserCommunities();
  };

  // Show loading spinner while profile is loading
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <ShieldProgressSpinner variant="bounce" size="lg" color="olive" message="Laddar" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/10 via-white to-[#707C5F]/10">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('local_community.navigation_title')}</h1>
              <p className="text-[#C8D5B9]">{t('local_community.navigation_description')}</p>
            </div>
            {userPostalCode && (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={16} />
                  <span>{t('profile.postal_code')}: {userPostalCode.slice(0, 3)} {userPostalCode.slice(3)}</span>
                </div>
              </div>
            )}
          </div>

          {/* NAVIGATION TABS */}
          <div className="flex gap-2 flex-wrap">
            {userCommunities.length > 0 && (
              <button
                onClick={() => setActiveView('home')}
                className={activeView === 'home'
                  ? "flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-white text-[#3D4A2B] shadow-md"
                  : "flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-[#5C6B47]/30 text-white hover:bg-[#5C6B47]/50"}
              >
                <Shield size={20} /> Översikt
              </button>
            )}
            <button
              onClick={() => setActiveView('discovery')}
              className={activeView === 'discovery'
                ? "flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-white text-[#3D4A2B] shadow-md"
                : "flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-[#5C6B47]/30 text-white hover:bg-[#5C6B47]/50"}
            >
              <Search size={20} />
              {userCommunities.length > 0 ? 'Hitta fler' : t('local_community.find_communities')}
            </button>
            {userCommunities.length > 0 && (
              <>
                <button
                  onClick={() => setActiveView('resources')}
                  className={activeView === 'resources'
                    ? "flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-white text-[#3D4A2B] shadow-md"
                    : "flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-[#5C6B47]/30 text-white hover:bg-[#5C6B47]/50"}
                >
                  <Package size={20} /> Resurser
                </button>
                <button
                  onClick={() => setActiveView('messaging')}
                  className={activeView === 'messaging'
                    ? "flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-white text-[#3D4A2B] shadow-md"
                    : "flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-[#5C6B47]/30 text-white hover:bg-[#5C6B47]/50"}
                >
                  <MessageCircle size={20} /> {t('local_community.messages')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/** COMMUNITY SWITCHER */}
        {userCommunities.length > 1 && activeView !== 'discovery' && (
          <div className="mb-6 bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <Users size={20} />
                <span className="font-medium text-sm">Aktivt samhälle:</span>
              </div>
              <select
                value={activeCommunityId}
                onChange={(e) => setActiveCommunityId(e.target.value)}
                className="flex-1 max-w-md px-4 py-3 bg-white border-2 border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-gray-900 font-bold text-lg cursor-pointer hover:border-[#5C6B47] transition-colors"
              >
                {userCommunities.map((community) => (
                  <option key={community.id} value={community.id} className="font-semibold">
                    {community.community_name} ({community.member_count} medlemmar)
                  </option>
                ))}
              </select>
              <div className="text-white/80 text-sm">
                {userCommunities.length} samhällen
              </div>
            </div>
          </div>
        )}

        {/* Location Prompt */}
        {!userPostalCode && (
          <div className="mb-6 bg-[#B8860B]/10 border-l-4 border-[#B8860B] p-6 rounded-lg">
            <div className="flex items-start gap-3">
              <MapPin className="text-[#B8860B] flex-shrink-0 mt-1" size={24} />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('local_community.location_prompt_title')}
                </h3>
                <p className="text-gray-800 mb-3">
                  {t('local_community.location_prompt_description')}
                </p>
                <a
                  href="/settings"
                  className="inline-block px-4 py-2 bg-[#3D4A2B] text-white font-medium rounded-lg hover:bg-[#2A331E] transition-colors"
                >
                  {t('local_community.enter_postal_code')}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* VIEWS */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeView === 'home' && activeCommunityId && (() => {
            const activeCommunity = userCommunities.find(c => c.id === activeCommunityId);
            return activeCommunity ? (
              <CommunityDashboard
                user={user}
                community={activeCommunity}
                onNavigate={setActiveView}
              />
            ) : null;
          })()}

          {activeView === 'discovery' && (
            <CommunityDiscovery 
              user={user}
              userPostalCode={userPostalCode}
              onJoinCommunity={handleJoinCommunity}
            />
          )}

          {activeView === 'resources' && (
            <div>
              {activeCommunityId ? (
                <>
                  {/* Community Selector */}
                  {userCommunities.length > 1 && (
                    <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Building2 size={20} className="text-[#3D4A2B]" />
                          <span className="font-medium text-gray-700">Välj samhälle:</span>
                        </div>
                        <select
                          value={activeCommunityId}
                          onChange={(e) => setActiveCommunityId(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent bg-white"
                        >
                          {userCommunities.map((community) => (
                            <option key={community.id} value={community.id}>
                              {community.community_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  
                  <CommunityResourceHub
                    user={user}
                    communityId={activeCommunityId}
                    communityName={userCommunities.find(c => c.id === activeCommunityId)?.community_name || 'Laddar samhälle...'}
                    isAdmin={isAdmin}
                    initialTab={initialTab}
                  />
                </>
              ) : loadingCommunities ? (
                <div className="flex items-center justify-center py-12">
                  <ShieldProgressSpinner variant="bounce" size="lg" color="olive" message="Laddar samhälle" />
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package size={64} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Gå med i ett samhälle först
                  </h3>
                  <p className="text-gray-600 mb-4">
                    För att dela och begära resurser behöver du vara medlem i ett samhälle
                  </p>
                  <button
                    onClick={() => setActiveView('discovery')}
                    className="px-6 py-3 bg-[#3D4A2B] text-white font-medium rounded-lg hover:bg-[#2A331E] transition-colors"
                  >
                    {t('local_community.find_communities')}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeView === 'messaging' && (
            <div>
              {userCommunities.length > 0 && activeCommunityId ? (
                <MessagingSystemV2 
                  user={user}
                  communityId={activeCommunityId}
                />
              ) : (
                <div className="text-center py-12">
                  <MessageCircle size={64} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('local_community.select_community_first')}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t('local_community.join_to_message')}
                  </p>
                  <button
                    onClick={() => setActiveView('discovery')}
                    className="px-6 py-3 bg-[#3D4A2B] text-white font-medium rounded-lg hover:bg-[#2A331E] transition-colors"
                  >
                    {t('local_community.find_communities')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {userPostalCode && (
          <div className="mt-6 bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] rounded-lg p-6 text-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{userCommunities.length}</div>
                <div className="text-sm text-[#C8D5B9]">{t('local_community.your_communities')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">
                  {userCommunities.reduce((sum, c) => sum + (c.member_count || 0), 0)}
                </div>
                <div className="text-sm text-[#C8D5B9]">{t('local_community.members_nearby')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">-</div>
                <div className="text-sm text-[#C8D5B9]">{t('local_community.shared_resources')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">-</div>
                <div className="text-sm text-[#C8D5B9]">{t('local_community.active_requests')}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}