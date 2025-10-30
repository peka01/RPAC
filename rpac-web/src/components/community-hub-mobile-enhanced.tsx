'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, 
  MessageCircle,
  Search,
  Home,
  Plus,
  Bell,
  Package,
  ChevronRight,
  MapPin,
  ChevronLeft,
  Building2,
  Send,
  Share2,
  Globe,
  ExternalLink,
  Edit,
  Activity,
  Menu,
  X,
  Heart,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Clock
} from 'lucide-react';
import { CommunityDiscoveryMobile } from './community-discovery-mobile';
import { MessagingSystemV2 } from './messaging-system-v2';
import { CommunityResourceHubMobile } from './community-resource-hub-mobile';
import { CommunityEditModal } from './community-edit-modal';
import { useUserProfile } from '@/lib/useUserProfile';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { communityService, type LocalCommunity, supabase } from '@/lib/supabase';
import { communityActivityService } from '@/lib/community-activity-service';
import { t } from '@/lib/locales';
import type { User } from '@supabase/supabase-js';
import HomespaceEditorWrapper from '@/components/homespace-editor-wrapper';
import { CommunityAdminSectionResponsive } from '@/components/community-admin-section-responsive';

// Activity icon mapping - matches CommunityActivityFeed
const activityIcons = {
  member_joined: { icon: Users, bg: 'bg-[#3D4A2B]' },
  resource_added: { icon: Building2, bg: 'bg-[#5C6B47]' },
  resource_shared: { icon: Share2, bg: 'bg-[#707C5F]' },
  help_requested: { icon: Heart, bg: 'bg-[#8B9B6D]' },
  help_response_added: { icon: CheckCircle, bg: 'bg-[#556B2F]' },
  community_resource_added: { icon: Building2, bg: 'bg-[#3D4A2B]' },
  community_resource_updated: { icon: Package, bg: 'bg-[#5C6B47]' },
  community_resource_deleted: { icon: AlertCircle, bg: 'bg-[#707C5F]' },
  milestone: { icon: CheckCircle, bg: 'bg-[#8B9B6D]' },
  custom: { icon: Activity, bg: 'bg-[#556B2F]' }
};

interface CommunityHubMobileEnhancedProps {
  user: User;
  initialCommunityId?: string | null;
  initialTab?: string | null;
  initialMessagingType?: string | null;
  initialResourceTab?: string | null;
}

export function CommunityHubMobileEnhanced({ user, initialCommunityId, initialTab, initialMessagingType, initialResourceTab }: CommunityHubMobileEnhancedProps) {
  const [activeView, setActiveView] = useState<'home' | 'discovery' | 'messaging' | 'resources' | 'community-detail'>('home');
  const [activeCommunityId, setActiveCommunityId] = useState<string | undefined>();
  const [userCommunities, setUserCommunities] = useState<LocalCommunity[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [messagingType, setMessagingType] = useState<'community' | 'direct'>('community');
  const [showHomespaceEditor, setShowHomespaceEditor] = useState(false);
  const [homespaceSlug, setHomespaceSlug] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLocalMenu, setShowLocalMenu] = useState(false);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const { profile, loading } = useUserProfile(user);
  const userPostalCode = profile?.postal_code;

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
      if (initialMessagingType === 'direct') {
        setMessagingType('direct');
      } else {
        setMessagingType('community');
      }
    } else if (initialTab === 'home') {
      setActiveView('home');
    }
  }, [initialCommunityId, initialTab, initialMessagingType]);

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

  // Load recent activities when community changes
  useEffect(() => {
    if (activeCommunityId) {
      loadRecentActivities();
    }
  }, [activeCommunityId]);

  // Load homespace data when community changes
  useEffect(() => {
    const loadHomespace = async () => {
      if (activeCommunityId && isAdmin) {
        console.log('🏡 Loading homespace for community:', activeCommunityId);
        const { data } = await supabase
          .from('community_homespaces')
          .select('slug')
          .eq('community_id', activeCommunityId)
          .single();
        
        console.log('🏡 Homespace data:', data);
        setHomespaceSlug(data?.slug || null);
      } else {
        console.log('🏡 Not loading homespace - activeCommunityId:', activeCommunityId, 'isAdmin:', isAdmin);
      }
    };
    
    loadHomespace();
  }, [activeCommunityId, isAdmin]);

  const loadUserCommunities = async () => {
    if (!user || user.id === 'demo-user') return;
    
    console.log('🏘️ CommunityHubMobileEnhanced loadUserCommunities called for user:', user.id);
    setLoadingCommunities(true);
    try {
      const memberships = await communityService.getUserMemberships(user.id);
      console.log('📋 User memberships:', memberships);
      
      if (memberships.length > 0) {
        const communities = await Promise.all(
          memberships.map(id => communityService.getCommunityById(id))
        );
        
        const validCommunities = communities.filter(c => c !== null) as LocalCommunity[];
        console.log('🏘️ Valid communities:', validCommunities);
        setUserCommunities(validCommunities);
        
        if (!activeCommunityId && !initialCommunityId && validCommunities.length > 0) {
          console.log('🔄 Setting first community as active:', validCommunities[0].id);
          setActiveCommunityId(validCommunities[0].id);
        }
      } else {
        console.log('⚠️ No community memberships found for user');
      }
    } catch (err) {
      console.error('Error loading user communities:', err);
    } finally {
      setLoadingCommunities(false);
    }
  };

  const loadRecentActivities = async () => {
    if (!activeCommunityId) return;
    
    console.log('Loading recent activities for community:', activeCommunityId);
    try {
      const activities = await communityActivityService.getCommunityActivities(activeCommunityId, 5);
      console.log('Loaded activities:', activities);
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error loading recent activities:', error);
      setRecentActivities([]);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just nu';
    if (diffInMinutes < 60) return `${diffInMinutes} min sedan`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} tim sedan`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} dag${diffInDays > 1 ? 'ar' : ''} sedan`;
    
    return date.toLocaleDateString('sv-SE');
  };

  const getActivityIcon = (activityType: string) => {
    const config = activityIcons[activityType as keyof typeof activityIcons] || activityIcons.custom;
    const IconComponent = config.icon;
    
    return (
      <div className={`w-8 h-8 ${config.bg} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <IconComponent size={14} className="text-white" strokeWidth={2} />
      </div>
    );
  };

  const getActivityActionText = (activityType: string) => {
    switch (activityType) {
      case 'resource_added':
        return 'lade till resurs';
      case 'resource_shared':
        return 'delade resurs';
      case 'member_joined':
        return 'gick med i samhället';
      case 'help_requested':
        return 'begärde hjälp';
      case 'help_response_added':
        return 'erbjöd hjälp';
      case 'community_resource_added':
        return 'lade till gemensam resurs';
      case 'community_resource_updated':
        return 'uppdaterade gemensam resurs';
      case 'community_resource_deleted':
        return 'tog bort gemensam resurs';
      case 'milestone':
        return 'uppnådde milstolpe';
      default:
        return 'aktivitet';
    }
  };

  const getActivityLink = (activityType: string): string | null => {
    if (activityType === 'help_requested' || activityType === 'help_response_added') {
      return `/local?tab=resources&resourceTab=help`;
    }
    if (activityType === 'community_resource_added' || 
        activityType === 'community_resource_updated') {
      return `/local?tab=resources&resourceTab=owned`;
    }
    if (activityType === 'resource_shared' || activityType === 'resource_added') {
      return `/local?tab=resources&resourceTab=shared`;
    }
    return null;
  };

  const handleJoinCommunity = (communityId: string) => {
    setActiveCommunityId(communityId);
    setActiveView('messaging');
    loadUserCommunities();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#5C6B47]/10 to-[#707C5F]/10">
        <ShieldProgressSpinner size="xl" color="olive" message="Laddar" />
      </div>
    );
  }

  // Local Hub Hamburger Menu (replaces internal bottom nav to avoid overlap with global nav)
  const LocalHamburgerMenu = () => (
    <>
      {/* Floating Hamburger Button - Top Right */}
      <button
        onClick={() => setShowLocalMenu(true)}
        aria-label="Öppna lokalt meny"
        id="local-hamburger-fab"
        className="fixed top-4 right-4 z-[60] w-12 h-12 rounded-xl bg-[#3D4A2B] text-white shadow-lg flex items-center justify-center active:scale-95 touch-manipulation"
      >
        <Menu size={22} />
      </button>

      {/* Full Screen Sheet */}
      {showLocalMenu && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowLocalMenu(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl border-t border-[#5C6B47]/20 animate-slide-in-bottom p-6 pt-8 max-h-[80vh] overflow-y-auto">
            <div className="absolute top-3 right-4">
              <button
                onClick={() => setShowLocalMenu(false)}
                className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all"
                aria-label="Stäng meny"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Home size={20} /> Lokalt nav
              </h2>
              <p className="text-sm text-gray-600 mt-1">Snabb åtkomst till lokala funktioner</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setActiveView('home'); setShowLocalMenu(false); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border shadow-sm active:scale-95 transition-all ${activeView === 'home' ? 'bg-[#3D4A2B] text-white border-[#2A331E]' : 'bg-white text-gray-700 border-[#5C6B47]/30 hover:bg-[#5C6B47]/10'}`}
              >
                <Home size={24} />
                <span className="text-sm font-medium">Hem</span>
              </button>
              <button
                onClick={() => { setActiveView('discovery'); setShowLocalMenu(false); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border shadow-sm active:scale-95 transition-all ${activeView === 'discovery' ? 'bg-[#3D4A2B] text-white border-[#2A331E]' : 'bg-white text-gray-700 border-[#5C6B47]/30 hover:bg-[#5C6B47]/10'}`}
              >
                <Search size={24} />
                <span className="text-sm font-medium">Hitta</span>
              </button>
              <button
                onClick={() => { setActiveView('resources'); setShowLocalMenu(false); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border shadow-sm active:scale-95 transition-all ${activeView === 'resources' ? 'bg-[#3D4A2B] text-white border-[#2A331E]' : 'bg-white text-gray-700 border-[#5C6B47]/30 hover:bg-[#5C6B47]/10'}`}
              >
                <Package size={24} />
                <span className="text-sm font-medium">Resurser</span>
              </button>
              <button
                onClick={() => { setActiveView('messaging'); setShowLocalMenu(false); }}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border shadow-sm active:scale-95 transition-all ${activeView === 'messaging' ? 'bg-[#3D4A2B] text-white border-[#2A331E]' : 'bg-white text-gray-700 border-[#5C6B47]/30 hover:bg-[#5C6B47]/10'}`}
              >
                <MessageCircle size={24} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                <span className="text-sm font-medium">Chat</span>
              </button>
            </div>

            {/* Quick Action shortcuts inside menu */}
            <div className="mt-8 space-y-3">
              {activeCommunityId && (
                <button
                  onClick={() => { setActiveView('community-detail'); setShowLocalMenu(false); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#5C6B47]/30 hover:bg-[#5C6B47]/10 active:scale-95 transition-all"
                >
                  <Building2 size={24} className="text-[#3D4A2B]" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-800">Samhällesdetaljer</div>
                    <div className="text-xs text-gray-500">Visa och administrera samhälle</div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </button>
              )}
              <button
                onClick={() => { setActiveView('resources'); setShowLocalMenu(false); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#A08E5A] to-[#5C6B47] text-white hover:shadow-lg active:scale-95 transition-all"
              >
                <Package size={24} />
                <div className="flex-1 text-left">
                  <div className="font-semibold">Resursdelning</div>
                  <div className="text-xs text-white/80">Dela och begär resurser</div>
                </div>
                <ChevronRight size={20} className="text-white/70" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Home View - Dashboard
  const HomeView = () => (
  <div className="pb-24 px-4 pt-6 space-y-6 safe-area-pb">
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Building2 size={24} />
                {userCommunities.find(c => c.id === activeCommunityId)?.community_name || 'Mitt samhälle'}
              </h1>
              
              {/* Edit Community Button - Only for admins */}
              {isAdmin && activeCommunityId && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 hover:bg-white/30 transition-colors"
                  title="Redigera samhälle"
                >
                  <Edit size={14} className="text-white/90" />
                  <span className="text-xs font-medium text-white/90">Redigera</span>
                </button>
              )}
            </div>
            
            {/* Community Description */}
            <p className="text-[#C8D5B9] text-sm mb-3">
              {userCommunities.find(c => c.id === activeCommunityId)?.description || 'Din lokala samhällsöversikt'}
            </p>
            
            {/* Community Tags */}
            {activeCommunityId && (() => {
              const activeCommunity = userCommunities.find(c => c.id === activeCommunityId);
              if (!activeCommunity) return null;
              
              return (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Location Tag - Show county name */}
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1">
                    <MapPin size={12} className="text-white/80" />
                    <span className="text-xs font-medium text-white/90">
                      {activeCommunity.county ? activeCommunity.county.charAt(0).toUpperCase() + activeCommunity.county.slice(1).replace('_', ' ') : activeCommunity.location}
                    </span>
                  </div>
                  
                  
                  {/* External URL */}
                  {homespaceSlug && (
                    <a 
                      href={`/${homespaceSlug}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1 hover:bg-white/30 transition-colors"
                    >
                      <Globe size={12} className="text-white/80" />
                      <span className="text-xs font-medium text-white/90">beready.se/{homespaceSlug}</span>
                      <ExternalLink size={10} className="text-white/80" />
                    </a>
                  )}
                  
                </div>
              );
            })()}
          </div>
        </div>

        {!userPostalCode && (
          <Link
            href="/settings?highlight=postal_code"
            className="block mt-4 bg-white/90 text-[#3D4A2B] text-center font-bold py-3 px-4 rounded-xl hover:bg-white transition-all touch-manipulation active:scale-95"
          >
            Ange ditt postnummer
          </Link>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-[#5C6B47]/20">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-[#3D4A2B]/10 rounded-full p-2">
              <Users className="text-[#3D4A2B]" size={20} />
            </div>
            <span className="text-3xl font-bold text-[#3D4A2B]">{userCommunities.length}</span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Samhällen</p>
          <p className="text-xs text-gray-400 mt-1">Dina medlemskap</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg border border-[#5C6B47]/20">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-[#556B2F]/10 rounded-full p-2">
              <MessageCircle className="text-[#556B2F]" size={20} />
            </div>
            <span className="text-3xl font-bold text-[#556B2F]">
              {userCommunities.reduce((sum, c) => sum + (c.member_count || 0), 0)}
            </span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Medlemmar</p>
          <p className="text-xs text-gray-400 mt-1">I ditt nätverk</p>
        </div>
      </div>

      {/* My Communities List */}
      {userCommunities.length > 0 ? (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3 px-1">Mina samhällen</h2>
          <div className="space-y-3">
            {userCommunities.map((community) => (
              <button
                key={community.id}
                onClick={() => {
                  setActiveCommunityId(community.id);
                  setActiveView('community-detail');
                }}
                className="w-full bg-white rounded-2xl p-4 shadow-md border border-[#5C6B47]/20 hover:shadow-lg transition-all touch-manipulation active:scale-98"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-[#3D4A2B] rounded-lg p-1.5">
                        <Users className="text-white" size={16} />
                      </div>
                      <h3 className="font-bold text-gray-900">{community.community_name}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {community.location}
                      </span>
                      <span>• {community.member_count || 0} medlemmar</span>
                    </div>
                  </div>
                  <ChevronRight className="text-[#3D4A2B]" size={24} />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-[#5C6B47]/20">
          <div className="bg-[#5C6B47]/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Users className="text-[#5C6B47]" size={40} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Inget samhälle än</h3>
          <p className="text-gray-600 mb-6 text-sm">
            Hitta och gå med i ett samhälle för att börja dela resurser och kommunicera
          </p>
          <button
            onClick={() => setActiveView('discovery')}
            className="w-full bg-[#3D4A2B] text-white font-bold py-4 px-6 rounded-xl hover:bg-[#2A331E] transition-all touch-manipulation active:scale-95 flex items-center justify-center gap-2"
          >
            <Search size={20} />
            Hitta samhällen
          </button>
        </div>
      )}

      {/* Action Cards */}
      <div className="space-y-3">
        {userCommunities.length > 0 && (
          <button
            onClick={() => setActiveView('resources')}
            className="w-full bg-gradient-to-r from-[#A08E5A] to-[#5C6B47] text-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-full p-3">
                <Package size={24} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg mb-1">Resursdelning</h3>
                <p className="text-[#C8D5B9] text-sm">Dela och begär resurser</p>
              </div>
              <ChevronRight size={24} />
            </div>
          </button>
        )}
        <button
          onClick={() => setActiveView('discovery')}
          className="w-full bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-full p-3">
              <Plus size={24} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-lg mb-1">Hitta samhällen</h3>
              <p className="text-[#C8D5B9] text-sm">Utöka ditt nätverk</p>
            </div>
            <ChevronRight size={24} />
          </div>
        </button>
      </div>
    </div>
  );

  // Community Detail View - Shows when clicking on a specific community
  const CommunityDetailView = () => {
    const activeCommunity = userCommunities.find(c => c.id === activeCommunityId);
    
    console.log('📋 CommunityDetailView - activeCommunityId:', activeCommunityId, 'isAdmin:', isAdmin, 'homespaceSlug:', homespaceSlug);
    
    if (!activeCommunity) {
      return null;
    }

    return (
  <div className="min-h-screen bg-white pb-24 safe-area-pb">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] text-white px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setActiveView('home')}
              className="p-2 hover:bg-white/10 rounded-full touch-manipulation"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{activeCommunity.community_name}</h1>
              <div className="flex items-center gap-2 text-[#C8D5B9] text-sm mt-1">
                <MapPin size={14} />
                <span>{activeCommunity.location}</span>
              </div>
              {/* Public Homepage URL - visible to all */}
              {homespaceSlug && (
                <a
                  href={`/${homespaceSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors text-xs font-medium"
                >
                  <Home size={12} />
                  <span>beready.se/{homespaceSlug}</span>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="opacity-70">
                    <path d="M10.5 1.5L1.5 10.5M10.5 1.5H3M10.5 1.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Community Selector - Only show if user has multiple communities */}
          {userCommunities.length > 1 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 max-w-full overflow-hidden">
              <div className="flex items-center gap-3 mb-2">
                <Users size={18} />
                <span className="text-sm font-medium">Aktivt samhälle:</span>
              </div>
              <select
                value={activeCommunityId}
                onChange={(e) => setActiveCommunityId(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-gray-900 font-medium text-sm cursor-pointer hover:border-[#5C6B47] transition-colors"
              >
                {userCommunities.map((community) => (
                  <option key={community.id} value={community.id} className="font-medium text-sm">
                    {community.community_name}
                  </option>
                ))}
              </select>
              <div className="text-white/80 text-sm mt-2 text-center">
                {userCommunities.length} samhällen
              </div>
            </div>
          )}


          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} />
                <span className="text-2xl font-bold">{activeCommunity.member_count || 0}</span>
              </div>
              <p className="text-[#C8D5B9] text-xs">Medlemmar</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Bell size={16} />
                <span className="text-2xl font-bold">{unreadCount > 0 ? unreadCount : '0'}</span>
              </div>
              <p className="text-[#C8D5B9] text-xs">Olästa meddelanden</p>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="px-4 py-6">
          <div className="bg-[#5C6B47]/5 rounded-2xl p-5 mb-6">
            <h3 className="font-bold text-gray-900 mb-2">Om samhället</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {activeCommunity.description || 'Ett lokalt samhälle för att dela resurser och stötta varandra i beredskapsfrågor.'}
            </p>
          </div>

          {/* Enhanced Activity Feed - Prominent Mobile Section */}
          <div className="bg-gradient-to-br from-[#3D4A2B]/5 to-[#5C6B47]/10 rounded-2xl p-6 border border-[#3D4A2B]/20 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3D4A2B] rounded-xl flex items-center justify-center">
                  <Bell size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Senaste aktivitet</h3>
                  <p className="text-sm text-[#3D4A2B] font-medium">Vad händer i samhället</p>
                </div>
              </div>
              <button className="px-3 py-1.5 bg-[#3D4A2B]/10 text-[#3D4A2B] text-xs font-semibold rounded-lg hover:bg-[#3D4A2B]/20 transition-colors"
                onClick={() => window.location.href = `/local/activity?community=${activeCommunityId}`}
              >
                Visa alla
              </button>
            </div>
            
            <div className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.slice(0, 3).map((activity, index) => {
                  const link = getActivityLink(activity.activity_type);
                  const hasImage = !!activity.image_url;
                  const content = (
                    <>
                      {getActivityIcon(activity.activity_type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">
                          {activity.activity_type === 'member_joined' ? (
                            <>
                              <span className="font-semibold">
                                {activity.user_name && activity.user_name !== 'Anonym användare' ? activity.user_name : 'Ny medlem'}
                              </span>
                              {' '}
                              <span className="text-gray-600">
                                {getActivityActionText(activity.activity_type)}
                              </span>
                            </>
                          ) : (
                            <>
                              {activity.user_name && activity.user_name !== 'Anonym användare' && (
                                <>
                                  <span className="font-semibold">{activity.user_name}</span>
                                  {' '}
                                </>
                              )}
                              <span className="text-gray-600">
                                {getActivityActionText(activity.activity_type)}
                              </span>
                              {activity.resource_name && (
                                <>
                                  {': '}
                                  <span className="font-semibold text-gray-900">
                                    {activity.resource_name}
                                  </span>
                                </>
                              )}
                            </>
                          )}
                        </p>
                        
                        {/* Show image thumbnail if available */}
                        {hasImage && (
                          <div className="mt-2 relative group">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-[#3D4A2B] transition-all duration-200 active:scale-95">
                              <Image
                                src={activity.image_url!}
                                alt={activity.resource_name || activity.title}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                            {/* Large tap/hover preview */}
                            <div className="absolute left-0 top-0 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                              <div className="relative w-40 h-40 rounded-xl overflow-hidden border-4 border-[#3D4A2B] shadow-2xl">
                                <Image
                                  src={activity.image_url!}
                                  alt={activity.resource_name || activity.title}
                                  fill
                                  className="object-cover"
                                  sizes="160px"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <p className="text-xs text-[#3D4A2B]/70 mt-1 font-medium flex items-center gap-1">
                          <Clock size={10} />
                          {formatTimeAgo(activity.created_at)}
                          {link && <ExternalLink size={10} className="ml-1" />}
                        </p>
                      </div>
                      {index === 0 && (
                        <div className="w-2 h-2 bg-[#3D4A2B] rounded-full animate-pulse"></div>
                      )}
                    </>
                  );

                  return link ? (
                    <Link
                      key={activity.id}
                      href={link}
                      className="flex items-start gap-3 p-4 bg-white/80 rounded-xl border border-white/50 hover:bg-white transition-colors cursor-pointer"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={activity.id} className="flex items-start gap-3 p-4 bg-white/80 rounded-xl border border-white/50">
                      {content}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#3D4A2B]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Bell size={24} className="text-[#3D4A2B]" />
                  </div>
                  <p className="text-gray-600 text-sm">Ingen aktivitet ännu</p>
                  <p className="text-gray-500 text-xs mt-1">Aktiviteter visas här när medlemmar delar resurser</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-[#3D4A2B]/20">
              <button 
                onClick={() => window.location.href = `/local/activity?community=${activeCommunityId}`}
                className="w-full py-2 px-4 bg-white/50 text-[#3D4A2B] text-sm font-semibold rounded-lg hover:bg-white/80 transition-colors"
              >
                Visa alla aktiviteter
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <button
              onClick={() => setActiveView('messaging')}
              className="w-full bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] text-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 rounded-full p-3">
                  <MessageCircle size={24} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-lg mb-1">Meddelanden</h3>
                  <p className="text-[#C8D5B9] text-sm">Chatta med samhället</p>
                </div>
                {unreadCount > 0 && (
                  <div className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
                <ChevronRight size={24} />
              </div>
            </button>

            <button
              onClick={() => setActiveView('resources')}
              className="w-full bg-gradient-to-r from-[#A08E5A] to-[#5C6B47] text-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 rounded-full p-3">
                  <Package size={24} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-lg mb-1">Resursdelning</h3>
                  <p className="text-[#C8D5B9] text-sm">Dela och begär resurser</p>
                </div>
                <ChevronRight size={24} />
              </div>
            </button>

            <button
              onClick={() => {
                // Share functionality placeholder
                if (navigator.share) {
                  navigator.share({
                    title: activeCommunity.community_name,
                    text: `Gå med i ${activeCommunity.community_name} på BE READY`,
                  }).catch(() => {});
                }
              }}
              className="w-full bg-white border-2 border-[#5C6B47]/30 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all touch-manipulation active:scale-98"
            >
              <div className="flex items-center gap-4">
                <div className="bg-[#5C6B47]/10 rounded-full p-3">
                  <Share2 size={24} className="text-[#3D4A2B]" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">Bjud in medlemmar</h3>
                  <p className="text-gray-600 text-sm">Dela samhället med andra</p>
                </div>
                <ChevronRight size={24} className="text-gray-400" />
              </div>
            </button>

          </div>

          {/* Admin Section - Only for admins */}
          {isAdmin && activeCommunityId && (
            <div className="px-4 pb-6">
              <CommunityAdminSectionResponsive
                user={user}
                communityId={activeCommunityId}
                communityName={activeCommunity.community_name}
                onSettingsUpdate={() => {
                  // Reload communities
                  loadUserCommunities();
                }}
                onOpenHomespaceEditor={() => setShowHomespaceEditor(true)}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/10 via-white to-[#707C5F]/10 relative">
      {/* Content Area */}
      <div className="min-h-screen">
        {activeView === 'home' && <HomeView />}
        
        {activeView === 'community-detail' && <CommunityDetailView />}
        
        {activeView === 'discovery' && (
          <div className="pb-24 px-4 pt-6 safe-area-pb">
            <CommunityDiscoveryMobile 
              user={user}
              userPostalCode={userPostalCode}
              onJoinCommunity={handleJoinCommunity}
            />
          </div>
        )}

        {activeView === 'resources' && (
          <div className="pb-24 safe-area-pb">
            {activeCommunityId ? (
              <>
                
                <CommunityResourceHubMobile
                  user={user}
                  communityId={activeCommunityId}
                  communityName={userCommunities.find(c => c.id === activeCommunityId)?.community_name || 'Samhälle'}
                  isAdmin={isAdmin}
                  initialTab={initialResourceTab}
                  onNavigate={setActiveView}
                />
              </>
            ) : loadingCommunities ? (
            <div className="flex items-center justify-center min-h-screen px-4">
              <ShieldProgressSpinner size="lg" color="olive" message="Laddar samhälle" />
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="text-center">
                <div className="bg-[#5C6B47]/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <Package className="text-[#5C6B47]" size={48} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Inget samhälle valt</h3>
                <p className="text-gray-600 mb-8">
                  Gå med i ett samhälle för att se och dela resurser
                </p>
                <button
                  onClick={() => setActiveView('discovery')}
                  className="px-8 py-4 bg-[#3D4A2B] text-white font-bold rounded-xl hover:bg-[#2A331E] transition-all touch-manipulation active:scale-95"
                >
                  Hitta samhällen
                </button>
              </div>
            </div>
          )}
        </div>
      )}

        {activeView === 'messaging' && (
          <div className="fixed inset-0 bg-white z-50">
            {/* Full-screen messaging header */}
            <div className="bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] text-white px-4 py-4 safe-area-pt">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveView('home')}
                    className="p-2 hover:bg-white/10 rounded-full touch-manipulation"
                  >
                    <ChevronLeft size={24} strokeWidth={2.5} />
                  </button>
                  <div>
                    <h1 className="text-lg font-bold">Meddelanden</h1>
                    <p className="text-white/80 text-sm">Chat med samhället</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-screen messaging content */}
            <div className="h-[calc(100vh-80px)]">
              {userCommunities.length > 0 && activeCommunityId ? (
                <>
                  <MessagingSystemV2 
                    user={user}
                    communityId={activeCommunityId}
                    initialTab={messagingType}
                    hideTabs={true}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-full px-4">
                  <div className="text-center">
                    <div className="bg-[#5C6B47]/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                      <MessageCircle className="text-[#5C6B47]" size={48} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Inget samhälle valt</h3>
                    <p className="text-gray-600 mb-8">
                      Gå med i ett samhälle för att börja chatta med andra medlemmar
                    </p>
                    <button
                      onClick={() => setActiveView('discovery')}
                      className="px-8 py-4 bg-[#3D4A2B] text-white font-bold rounded-xl hover:bg-[#2A331E] transition-all touch-manipulation active:scale-95"
                    >
                      Hitta samhällen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

  {/* Local Hamburger Menu (internal hub navigation) */}
  <LocalHamburgerMenu />

      {/* Homespace Editor Modal */}
      {showHomespaceEditor && activeCommunityId && (
        <HomespaceEditorWrapper
          communityId={activeCommunityId}
          userId={user.id}
          onClose={() => {
            setShowHomespaceEditor(false);
            // Reload homespace data after editing
            if (isAdmin) {
              supabase
                .from('community_homespaces')
                .select('slug')
                .eq('community_id', activeCommunityId)
                .single()
                .then(({ data }) => setHomespaceSlug(data?.slug || null));
            }
          }}
        />
      )}

      {/* Edit Community Modal */}
      {showEditModal && activeCommunityId && (
        <CommunityEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          community={userCommunities.find(c => c.id === activeCommunityId)!}
          onUpdate={(updatedCommunity) => {
            // Update the community in the list
            setUserCommunities(prev => 
              prev.map(c => c.id === updatedCommunity.id ? updatedCommunity : c)
            );
          }}
        />
      )}
    </div>
  );
}

