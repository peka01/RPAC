'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  MessageCircle,
  Search,
  Settings,
  MapPin,
  Plus,
  ChevronDown,
  Package,
  Shield
} from 'lucide-react';
import { CommunityDiscovery } from './community-discovery';
import { MessagingSystemV2 } from './messaging-system-v2';
import { ResourceSharingPanel } from './resource-sharing-panel';
import { CommunityDashboard } from './community-dashboard';
import { CommunityResourceHub } from './community-resource-hub';
import { useUserProfile } from '@/lib/useUserProfile';
import { communityService, type LocalCommunity } from '@/lib/supabase';
import { t } from '@/lib/locales';
import type { User } from '@supabase/supabase-js';

interface CommunityHubEnhancedProps {
  user: User;
}

export function CommunityHubEnhanced({ user }: CommunityHubEnhancedProps) {
  const [activeView, setActiveView] = useState<'home' | 'discovery' | 'resources' | 'messaging'>('home');
  const [activeCommunityId, setActiveCommunityId] = useState<string | undefined>();
  const [userCommunities, setUserCommunities] = useState<LocalCommunity[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { profile, loading } = useUserProfile(user);
  const userPostalCode = profile?.postal_code;

  // Load user's communities on mount
  useEffect(() => {
    if (user && user.id !== 'demo-user') {
      loadUserCommunities();
    }
  }, [user]);

  // Check admin status when active community changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (activeCommunityId && user && user.id !== 'demo-user') {
        const adminStatus = await communityService.isUserAdmin(activeCommunityId, user.id);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [activeCommunityId, user]);

  const loadUserCommunities = async () => {
    if (!user || user.id === 'demo-user') return;
    
    setLoadingCommunities(true);
    try {
      const memberships = await communityService.getUserMemberships(user.id);
      
      if (memberships.length > 0) {
        // Load full community details for each membership
        const communities = await Promise.all(
          memberships.map(id => communityService.getCommunityById(id))
        );
        
        const validCommunities = communities.filter(c => c !== null) as LocalCommunity[];
        setUserCommunities(validCommunities);
        
        // Auto-select first community if none is selected
        if (!activeCommunityId && validCommunities.length > 0) {
          setActiveCommunityId(validCommunities[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading user communities:', err);
    } finally {
      setLoadingCommunities(false);
    }
  };

  const handleJoinCommunity = (communityId: string) => {
    setActiveCommunityId(communityId);
    setActiveView('home'); // Show dashboard after joining
    // Reload communities to include the newly joined one
    loadUserCommunities();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3D4A2B]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/10 via-white to-[#707C5F]/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('local_community.navigation_title')}</h1>
              <p className="text-[#C8D5B9]">
                {t('local_community.navigation_description')}
              </p>
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

          {/* Navigation Tabs */}
          <div className="flex gap-2 flex-wrap">
            {userCommunities.length > 0 && (
              <button
                onClick={() => setActiveView('home')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeView === 'home'
                    ? 'bg-white text-[#3D4A2B] shadow-md'
                    : 'bg-[#5C6B47]/30 text-white hover:bg-[#5C6B47]/50'
                }`}
              >
                <Shield size={20} />
                Översikt
              </button>
            )}
            <button
              onClick={() => setActiveView('discovery')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeView === 'discovery'
                  ? 'bg-white text-[#3D4A2B] shadow-md'
                  : 'bg-[#5C6B47]/30 text-white hover:bg-[#5C6B47]/50'
              }`}
            >
              <Search size={20} />
              {userCommunities.length > 0 ? 'Hitta fler' : t('local_community.find_communities')}
            </button>
            {userCommunities.length > 0 && (
              <>
                <button
                  onClick={() => setActiveView('resources')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                    activeView === 'resources'
                      ? 'bg-white text-[#3D4A2B] shadow-md'
                      : 'bg-[#5C6B47]/30 text-white hover:bg-[#5C6B47]/50'
                  }`}
                >
                  <Package size={20} />
                  Resurser
                </button>
                <button
                  onClick={() => setActiveView('messaging')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                    activeView === 'messaging'
                      ? 'bg-white text-[#3D4A2B] shadow-md'
                      : 'bg-[#5C6B47]/30 text-white hover:bg-[#5C6B47]/50'
                  }`}
                >
                  <MessageCircle size={20} />
                  {t('local_community.messages')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Community Switcher (when member of multiple communities) */}
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

        {/* Location Setup Prompt */}
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

        {/* Content Views */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeView === 'home' && activeCommunityId && (
            <CommunityDashboard
              user={user}
              community={userCommunities.find(c => c.id === activeCommunityId)!}
              onNavigate={(view) => setActiveView(view)}
            />
          )}

          {activeView === 'discovery' && (
            <CommunityDiscovery 
              user={user}
              userPostalCode={userPostalCode}
              onJoinCommunity={handleJoinCommunity}
            />
          )}

          {activeView === 'resources' && (
            <div>
              {userCommunities.length > 0 && activeCommunityId ? (
                <CommunityResourceHub
                  user={user}
                  communityId={activeCommunityId}
                  communityName={userCommunities.find(c => c.id === activeCommunityId)?.community_name || 'Samhälle'}
                  isAdmin={isAdmin}
                />
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

        {/* Info Section */}
        {activeView === 'discovery' && userPostalCode && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#5C6B47]/10 rounded-lg p-4 border border-[#5C6B47]/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-[#3D4A2B] rounded-full p-2">
                  <Search className="text-white" size={20} />
                </div>
                <h4 className="font-semibold text-gray-900">{t('local_community.search_locally')}</h4>
              </div>
              <p className="text-sm text-gray-700">
                {t('local_community.search_local_description')}
              </p>
            </div>

            <div className="bg-[#556B2F]/10 rounded-lg p-4 border border-[#556B2F]/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-[#556B2F] rounded-full p-2">
                  <Users className="text-white" size={20} />
                </div>
                <h4 className="font-semibold text-gray-900">{t('local_community.join')}</h4>
              </div>
              <p className="text-sm text-gray-700">
                {t('local_community.join_description')}
              </p>
            </div>

            <div className="bg-[#707C5F]/10 rounded-lg p-4 border border-[#707C5F]/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-[#4A5239] rounded-full p-2">
                  <MessageCircle className="text-white" size={20} />
                </div>
                <h4 className="font-semibold text-gray-900">{t('local_community.communicate')}</h4>
              </div>
              <p className="text-sm text-gray-700">
                {t('local_community.communicate_description')}
              </p>
            </div>
          </div>
        )}

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

