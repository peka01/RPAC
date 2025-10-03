'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  MessageCircle,
  Search,
  Home,
  Plus,
  Bell,
  Package,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { CommunityDiscoveryMobile } from './community-discovery-mobile';
import { MessagingSystemMobile } from './messaging-system-mobile';
import { useUserProfile } from '@/lib/useUserProfile';
import { communityService, type LocalCommunity } from '@/lib/supabase';
import { t } from '@/lib/locales';
import type { User } from '@supabase/supabase-js';

interface CommunityHubMobileEnhancedProps {
  user: User;
}

export function CommunityHubMobileEnhanced({ user }: CommunityHubMobileEnhancedProps) {
  const [activeView, setActiveView] = useState<'home' | 'discovery' | 'messaging'>('home');
  const [activeCommunityId, setActiveCommunityId] = useState<string | undefined>();
  const [userCommunities, setUserCommunities] = useState<LocalCommunity[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { profile, loading } = useUserProfile(user);
  const userPostalCode = profile?.postal_code;

  // Load user's communities on mount
  useEffect(() => {
    if (user && user.id !== 'demo-user') {
      loadUserCommunities();
    }
  }, [user]);

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
    setActiveView('messaging');
    loadUserCommunities();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#5C6B47]/10 to-[#707C5F]/10">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#3D4A2B] border-t-transparent"></div>
      </div>
    );
  }

  // Mobile Bottom Navigation
  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#5C6B47]/20 shadow-2xl z-50 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-3">
        <button
          onClick={() => setActiveView('home')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all touch-manipulation ${
            activeView === 'home'
              ? 'bg-[#3D4A2B] text-white scale-105'
              : 'text-gray-600 active:scale-95'
          }`}
        >
          <Home size={24} strokeWidth={activeView === 'home' ? 2.5 : 2} />
          <span className={`text-xs font-medium ${activeView === 'home' ? 'font-bold' : ''}`}>
            Hem
          </span>
        </button>

        <button
          onClick={() => setActiveView('discovery')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all touch-manipulation ${
            activeView === 'discovery'
              ? 'bg-[#3D4A2B] text-white scale-105'
              : 'text-gray-600 active:scale-95'
          }`}
        >
          <Search size={24} strokeWidth={activeView === 'discovery' ? 2.5 : 2} />
          <span className={`text-xs font-medium ${activeView === 'discovery' ? 'font-bold' : ''}`}>
            Hitta
          </span>
        </button>

        <button
          onClick={() => setActiveView('messaging')}
          className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all touch-manipulation ${
            activeView === 'messaging'
              ? 'bg-[#3D4A2B] text-white scale-105'
              : 'text-gray-600 active:scale-95'
          }`}
        >
          <MessageCircle size={24} strokeWidth={activeView === 'messaging' ? 2.5 : 2} />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
          <span className={`text-xs font-medium ${activeView === 'messaging' ? 'font-bold' : ''}`}>
            Chat
          </span>
        </button>
      </div>
    </div>
  );

  // Home View - Dashboard
  const HomeView = () => (
    <div className="pb-24 px-4 pt-6 space-y-6">
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Lokalt Nätverk</h1>
            <p className="text-[#C8D5B9] text-sm">
              {userPostalCode ? `${userPostalCode.slice(0, 3)} ${userPostalCode.slice(3)}` : 'Ange din plats'}
            </p>
          </div>
          {userPostalCode && (
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <MapPin size={24} />
            </div>
          )}
        </div>

        {!userPostalCode && (
          <a
            href="/settings"
            className="block mt-4 bg-white/90 text-[#3D4A2B] text-center font-bold py-3 px-4 rounded-xl hover:bg-white transition-all touch-manipulation active:scale-95"
          >
            Ange ditt postnummer
          </a>
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
                  setActiveView('messaging');
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
        <button
          onClick={() => setActiveView('discovery')}
          className="w-full bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-full p-3">
              <Plus size={24} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-lg mb-1">Hitta fler samhällen</h3>
              <p className="text-[#C8D5B9] text-sm">Utöka ditt nätverk</p>
            </div>
            <ChevronRight size={24} />
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/10 via-white to-[#707C5F]/10 relative">
      {/* Content Area */}
      <div className="min-h-screen">
        {activeView === 'home' && <HomeView />}
        
        {activeView === 'discovery' && (
          <div className="pb-24 px-4 pt-6">
            <CommunityDiscoveryMobile 
              user={user}
              userPostalCode={userPostalCode}
              onJoinCommunity={handleJoinCommunity}
            />
          </div>
        )}

        {activeView === 'messaging' && (
          <div className="pb-24">
            {userCommunities.length > 0 && activeCommunityId ? (
              <MessagingSystemMobile 
                user={user}
                communityId={activeCommunityId}
                onUnreadCountChange={setUnreadCount}
              />
            ) : (
              <div className="flex items-center justify-center min-h-screen px-4">
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
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

