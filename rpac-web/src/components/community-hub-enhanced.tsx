'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  MessageCircle,
  Search,
  MapPin,
  Package,
  Shield,
  Building2,
  Globe,
  ExternalLink,
  Edit
} from 'lucide-react';
import { CommunityDiscovery } from './community-discovery';
import { MessagingSystemV2 } from './messaging-system-v2';
import { CommunityDashboard } from './community-dashboard';
import { CommunityResourceHub } from './community-resource-hub';
import { CommunityEditModal } from './community-edit-modal';
import { useUserProfile } from '@/lib/useUserProfile';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { communityService, type LocalCommunity, supabase } from '@/lib/supabase';
import { t } from '@/lib/locales';
import type { User } from '@supabase/supabase-js';

interface CommunityHubEnhancedProps {
  user: User;
  initialCommunityId?: string | null;
  initialTab?: string | null;
  initialResourceTab?: string | null;
}

export function CommunityHubEnhanced({ user, initialCommunityId, initialTab, initialResourceTab }: CommunityHubEnhancedProps) {
  const [activeView, setActiveView] = useState<'home' | 'discovery' | 'resources' | 'messaging'>('home');
  const [activeCommunityId, setActiveCommunityId] = useState<string | undefined>();
  const [userCommunities, setUserCommunities] = useState<LocalCommunity[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [homespaceSlug, setHomespaceSlug] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
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
    } else if (initialTab === 'messages') {
      setActiveView('messaging');
    } else if (initialTab === 'home') {
      setActiveView('home');
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

  // Load homespace data when active community changes
  useEffect(() => {
    if (activeCommunityId) {
      loadHomespaceData();
    }
  }, [activeCommunityId]);

  const loadHomespaceData = async () => {
    if (!activeCommunityId) return;
    
    try {
      const { data } = await supabase
        .from('community_homespaces')
        .select('slug')
        .eq('community_id', activeCommunityId)
        .single();
      
      setHomespaceSlug(data?.slug || null);
    } catch (error) {
      console.error('Error loading homespace data:', error);
      setHomespaceSlug(null);
    }
  };

  const handleJoinCommunity = (communityId: string) => {
    setActiveCommunityId(communityId);
    setActiveView('home');
    loadUserCommunities();
  };

  // Show loading spinner while profile is loading
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <ShieldProgressSpinner size="lg" color="olive" message="Laddar" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/10 via-white to-[#707C5F]/10">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                {activeView === 'home' ? (
                  <>
                    <Building2 size={32} />
                    {userCommunities.find(c => c.id === activeCommunityId)?.community_name || 'Mitt samhälle'}
                  </>
                ) :
                 activeView === 'discovery' ? 'Hitta fler' :
                 activeView === 'resources' ? (
                   <>
                     <Building2 size={32} />
                     {userCommunities.find(c => c.id === activeCommunityId)?.community_name || 'Samhälle'}
                   </>
                 ) :
                 activeView === 'messaging' ? 'Meddelanden' :
                 t('local_community.navigation_title')}
              </h1>
              <p className="text-[#C8D5B9] mb-3">
                {activeView === 'home' ? (
                  userCommunities.find(c => c.id === activeCommunityId)?.description || 'Din lokala samhällsöversikt'
                ) :
                 activeView === 'discovery' ? 'Upptäck nya samhällen i ditt område' :
                 activeView === 'resources' ? (
                   <span className="text-lg font-semibold">Resurser</span>
                 ) :
                 activeView === 'messaging' ? 'Kommunikation med ditt samhälle' :
                 t('local_community.navigation_description')}
              </p>
              
              {/* Community Tags - Only show on home view */}
              {activeView === 'home' && activeCommunityId && (() => {
                const activeCommunity = userCommunities.find(c => c.id === activeCommunityId);
                if (!activeCommunity) return null;
                
                
                return (
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Location Tag - Show county name */}
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
                      <MapPin size={14} className="text-white/80" />
                      <span className="text-sm font-medium text-white/90">
                        {activeCommunity.county ? activeCommunity.county.charAt(0).toUpperCase() + activeCommunity.county.slice(1).replace('_', ' ') : activeCommunity.location}
                      </span>
                    </div>
                    
                    
                    {/* External URL */}
                    {homespaceSlug && (
                      <a 
                        href={`/${homespaceSlug}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 hover:bg-white/30 transition-colors"
                      >
                        <Globe size={14} className="text-white/80" />
                        <span className="text-sm font-medium text-white/90">beready.se/{homespaceSlug}</span>
                        <ExternalLink size={12} className="text-white/80" />
                      </a>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center gap-4">
              {/* Edit Community Button - Only for admins */}
              {isAdmin && activeCommunityId && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 hover:bg-white/30 transition-colors"
                  title="Redigera samhälle"
                >
                  <Edit size={16} className="text-white/90" />
                  <span className="text-sm font-medium text-white/90">Redigera</span>
                </button>
              )}

              {/* Community Selector */}
              {userCommunities.length > 1 && (
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users size={16} />
                      <span className="font-medium">Aktivt samhälle:</span>
                    </div>
                    <select
                      value={activeCommunityId}
                      onChange={(e) => setActiveCommunityId(e.target.value)}
                      className="px-3 py-1 bg-white border-2 border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-gray-900 font-bold text-sm cursor-pointer hover:border-[#5C6B47] transition-colors"
                    >
                      {userCommunities.map((community) => (
                        <option key={community.id} value={community.id} className="font-semibold">
                          {community.community_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        

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
                <Link
                  href="/settings?highlight=postal_code"
                  className="inline-block px-4 py-2 bg-[#3D4A2B] text-white font-medium rounded-lg hover:bg-[#2A331E] transition-colors cursor-pointer"
                >
                  {t('local_community.enter_postal_code')}
                </Link>
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
                  
                  <CommunityResourceHub
                    user={user}
                    communityId={activeCommunityId}
                    communityName={userCommunities.find(c => c.id === activeCommunityId)?.community_name || 'Laddar samhälle...'}
                    isAdmin={isAdmin}
                    initialTab={initialResourceTab}
                    onNavigate={setActiveView}
                  />
                </>
              ) : loadingCommunities ? (
                <div className="flex items-center justify-center py-12">
                  <ShieldProgressSpinner size="lg" color="olive" message="Laddar samhälle" />
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

      {/* Edit Community Modal */}
      {showEditModal && activeCommunityId && (
        <CommunityEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          community={userCommunities.find(c => c.id === activeCommunityId)!}
          onUpdate={async (updatedCommunity) => {
            // Update the community in the list
            setUserCommunities(prev => 
              prev.map(c => c.id === updatedCommunity.id ? updatedCommunity : c)
            );
            // Reload homespace data to show updated slug
            await loadHomespaceData();
          }}
        />
      )}
    </div>
  );
}